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
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # ... (this function remains unchanged)
        figure_list_str = "\n".join([f"- {f.name}: {f.description}" for f in figures])

        # MODIFIED: Add file context to the prompt if provided
        context_block = ""
        if file_context:
            # Truncate to avoid overly long prompts
            truncated_context = file_context[:2000]
            context_block = f"""
        The user has also provided the following text for additional context. Use this to better understand their query and find a more relevant match from the list.
        ---
        User's Context:
        {truncated_context}
        ---
        """

        prompt = f"""
        You are an AI research assistant. Your task is to find the best historical figure from a provided list that matches the user's query. You must narrate your thought process by producing a series of JSON objects.

        Follow these steps precisely:
        1.  Start by acknowledging the user's query. Output a JSON object: {{"type": "log", "payload": "Analyzing your request..."}}
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
            async for chunk in stream:
                # Clean up the chunk text which might be wrapped in ```json ... ```
                text_chunk = chunk.text.strip()
                if text_chunk.startswith("```json"):
                    text_chunk = text_chunk[7:]
                if text_chunk.endswith("```"):
                    text_chunk = text_chunk[:-3]

                # Sometimes multiple JSON objects can come in one chunk
                json_strings = (
                    text_chunk.strip().replace("}\n{", "}}\n{{").split("}\n{")
                )

                for json_str in json_strings:
                    try:
                        if not json_str.startswith("{"):
                            json_str = "{" + json_str
                        if not json_str.endswith("}"):
                            json_str = json_str + "}"

                        data = json.loads(json_str)

                        # Find the full figure data if it's a match event
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
                    except json.JSONDecodeError:
                        logger.warning(f"Could not decode JSON chunk: {json_str}")
                        continue  # Ignore malformed chunks

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
        """
        Performs Retrieval-Augmented Generation.
        1. Searches Qdrant for relevant context using figure_name.
        2. Constructs an augmented prompt.
        3. Streams the response from Gemini.
        4. Yields text chunks and final citation data.
        """
        # 1. Retrieve context from Qdrant
        retrieved_docs = await qdrant_db.search(
            query=user_query, figure_name=figure_name, limit=3
        )

        context_str = "\n\n".join(
            f"Source: {doc.payload['source_name']}\nContent: {doc.payload['text']}"
            for doc in retrieved_docs
        )

        # 2. Augment the prompt
        # MODIFIED: Change task instruction based on use_web_search
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

            # The last message is now the prompt itself, as it contains the user query.
            stream = await chat_session.send_message_async(
                "Please answer my last question based on the sources and instructions provided.",
                stream=True,
            )

            async for chunk in stream:
                if chunk.text:
                    yield {"type": "text", "content": chunk.text}

            # 4. After streaming, yield the citations
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
