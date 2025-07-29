"""
Service for direct interaction with the Google Gemini API, supporting streaming.
"""

from typing import List, AsyncGenerator, Dict, Any, Optional
from loguru import logger
import google.generativeai as genai
import json

from ..core.settings import get_settings
from ..db.models import Message, HistoricalFigure, Citation
from ..db.qdrant import qdrant_db


class GeminiService:
    def __init__(self):
        # ... (init is unchanged)
        settings = get_settings()
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set.")
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.safety_settings = [
            {"category": c, "threshold": "BLOCK_NONE"}
            for c in [
                "HARM_CATEGORY_HARASSMENT",
                "HARM_CATEGORY_HATE_SPEECH",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "HARM_CATEGORY_DANGEROUS_CONTENT",
            ]
        ]
        self.model_name = settings.GOOGLE_MODEL_NAME
        logger.info(f"Gemini Service initialized for model '{self.model_name}'.")

    async def stream_figure_search(
        self,
        query: str,
        figures: List[HistoricalFigure],
        file_context: Optional[str] = None,
        use_web_search: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        figure_list_str = "\n".join([f"- {f.name}: {f.description}" for f in figures])

        context_block = ""
        if file_context:
            truncated_context = file_context[:2000]
            context_block = f"""
        The user has also provided the following text for additional context. Use this to better understand their query and find a more relevant match from the list.
        ---
        User's Context:
        {truncated_context}
        ---
        """

        if use_web_search:
            task_instruction = "First, use your general knowledge to understand the user's query about a person, event, or concept. Then, find the single best-matching historical figure from the provided list. Your main goal is to find the closest fit from the list, even if it's not a perfect match. If you use external knowledge, state that you are doing so."
            log_step_1 = '{"type": "log", "payload": "Analyzing your request with modern context..."}'
        else:
            task_instruction = "Your task is to find the best historical figure from the provided list that strictly matches the user's query. Confine your analysis ONLY to the provided figure list and context."
            log_step_1 = '{"type": "log", "payload": "Analyzing your request..."}'

        prompt = f"""
        You are an AI research assistant. {task_instruction} You must narrate your thought process by producing a series of JSON objects.

        Follow these steps precisely:
        1.  Start by acknowledging the user's query using the appropriate log message. Output a JSON object: {log_step_1}
        2.  Extract the key characteristics from the user's query. Output a JSON object: {{"type": "log", "payload": "Key characteristics identified: [list characteristics here]."}}
        3.  Scan the list of available figures and state which one is the best match. Output a JSON object: {{"type": "log", "payload": "Comparing against the archive... I believe the best match is [Figure Name]."}}
        4.  Finally, output the matched figure's data as a single JSON object with "match" type. The payload must be a JSON object containing the id, name, and avatar of the matched figure. Format: {{"type": "match", "payload": {{"id": "...", "name": "...", "avatar": "..."}}}}

        If no figure from the list is a clear match for the query, you MUST output a single JSON object of type "error": {{"type": "error", "payload": "I could not find a suitable figure for your request. Please try rephrasing."}}

        Here is the list of available figures:
        {figure_list_str}
        {context_block}
        User's Query: "{query}"

        Begin your JSON output now.
        """
        try:
            model = genai.GenerativeModel(
                self.model_name, safety_settings=self.safety_settings
            )
            stream = await model.generate_content_async(prompt, stream=True)

            # --- MODIFIED: Robust JSON stream parsing logic ---
            buffer = ""
            async for chunk in stream:
                buffer += chunk.text

                # Clean up markdown code fences that the model sometimes adds
                clean_buffer = buffer.replace("```json", "").replace("```", "").strip()
                buffer = clean_buffer

                # Try to parse complete JSON objects from the buffer
                while "{" in buffer and "}" in buffer:
                    try:
                        start_index = buffer.find("{")
                        end_index = buffer.find("}", start_index)
                        if end_index == -1:
                            # We have a start but no end yet, wait for more chunks
                            break

                        json_str = buffer[start_index : end_index + 1]
                        data = json.loads(json_str)

                        # If parsing succeeded, process and yield the data
                        if data.get("type") == "match":
                            matched_name = data["payload"].get("name")
                            for figure in figures:
                                if figure.name == matched_name:
                                    data["payload"] = {
                                        "id": str(figure.id),
                                        "name": figure.name,
                                        "avatar": figure.avatar,
                                    }
                                    break

                        yield data

                        # Remove the parsed part from the buffer
                        buffer = buffer[end_index + 1 :]

                    except json.JSONDecodeError:
                        # This means we have a partial object, so we wait for the next chunk.
                        # We break the inner while loop to fetch more stream content.
                        break
            # --- End of modified block ---

        except Exception as e:
            logger.error(f"Error during AI figure search stream: {e}")
            yield {
                "type": "error",
                "payload": "An unexpected error occurred with the AI service.",
            }

    async def stream_rag_response(
        self,
        system_prompt: str,
        user_query: str,
        figure_name: str,
        chat_history: List[Message],
        use_web_search: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # ... (This function is unchanged)
        retrieved_docs = await qdrant_db.search(
            query=user_query, figure_name=figure_name, limit=3
        )

        context_str = "\n\n".join(
            f"Source: {doc.payload['source_name']}\nContent: {doc.payload['text']}"
            for doc in retrieved_docs
        )

        if use_web_search:
            task_instruction = "Respond to the user's question. You may use your general knowledge to supplement information not found in the Source Material, but you MUST prioritize and use the provided sources when they are relevant. Speak in your persona."
        else:
            task_instruction = "Respond to the user's question. Your response MUST be based *only* on the Source Material provided above. Do not use any external knowledge. If the answer is not in the sources, state that you cannot answer from the provided texts. Speak in your persona."

        rag_prompt = f"""
        {system_prompt}

        ---
        Source Material:
        You have been provided with the following excerpts from primary and secondary sources.
        {context_str}
        ---

        User's Question: "{user_query}"

        ---
        Task:
        {task_instruction}
        Keep the response concise and directly related to the question.
        """

        gemini_history = []
        for msg in chat_history:
            gemini_history.append(
                {
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [msg.content],
                }
            )

        try:
            model_with_prompt = genai.GenerativeModel(
                self.model_name,
                system_instruction=rag_prompt,
                safety_settings=self.safety_settings,
            )
            chat_session = model_with_prompt.start_chat(history=gemini_history)

            stream = await chat_session.send_message_async(
                "Please answer my last question based on the sources and instructions provided.",
                stream=True,
            )

            async for chunk in stream:
                if chunk.text:
                    yield {"type": "text", "content": chunk.text}

            citations = [
                Citation(
                    source=doc.payload["source_name"], text_quote=doc.payload["text"]
                )
                for doc in retrieved_docs
            ]
            yield {"type": "citations", "data": citations}

        except Exception as e:
            logger.error(f"Error streaming RAG response from Gemini: {e}")
            error_message = "I am currently facing difficulty processing your request with the available sources."
            yield {"type": "text", "content": error_message}
            yield {"type": "citations", "data": []}


gemini_service = GeminiService()
