#!/bin/bash
#
# Primary (Thucydides) - Context Generation Script v1
# This script gathers all relevant source code from the backend and web,
# then appends an updated architectural prompt and directory trees to create a comprehensive context file.
#

echo "--- Generating complete context for Primary ---"

# --- Step 1: Clear previous context for a fresh start ---
echo "[1/4] Clearing old context file..."
> primary_context.txt

# --- Step 2: Append Backend Source (Python/FastAPI) ---
echo "[2/4] Appending backend source files (*.py)..."
find backend/src -name "*.py" -exec sh -c '
  echo "File: {}" >> primary_context.txt && cat {} >> primary_context.txt && echo -e "\n-e\n" >> primary_context.txt
' \;
find backend/tests -name "*.py" -exec sh -c '
  echo "File: {}" >> primary_context.txt && cat {} >> primary_context.txt && echo -e "\n-e\n" >> primary_context.txt
' \;
find backend/alembic -name "*.py" -exec sh -c '
  echo "File: {}" >> primary_context.txt && cat {} >> primary_context.txt && echo -e "\n-e\n" >> primary_context.txt
' \;
# --- Step 3: Append Web App Source (Next.js/React) ---
echo "[3/4] Appending web source files (*.ts, *.tsx, *.css)..."
find web/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) -exec sh -c '
  echo "File: $1" >> primary_context.txt && cat "$1" >> primary_context.txt && echo -e "\n-e\n" >> primary_context.txt
' sh {} \;

# --- Step 4: Append Directory Trees & Final Prompt ---
echo "[4/4] Appending directory trees and project prompt..."
{
  echo "--- DIRECTORY TREES ---"
  echo ""
  echo "Backend Tree:"
  tree backend/src
  echo ""
  echo "Backend Tests Tree:"
  tree backend/tests
  echo ""
  echo "Web App Tree:"
  tree web/src
  echo ""
  echo "-----------------------"
  echo ""
} >> primary_context.txt

# Append your startup context at the bottom
cat <<'EOT' >> primary_context.txt
Project Context: Thucydides

Core Concept: A dynamic, interactive research interface for primary sources. It leverages a Retrieval-Augmented Generation (RAG) architecture to allow users—primarily students, academics, and researchers—to query vast libraries of historical texts through a natural language dialogue with an AI persona of the historical author. Every statement made by the AI is verifiable and directly linked to a source document, providing academic integrity by design.

System Architecture: Two-Part System

The project is composed of two distinct but interconnected components:

1. FastAPI Backend (backend):

Role: The "RAG & Dialogue Engine." This is the brain of the application.

Function:
- Manages user authentication and dialogue sessions.
- Ingests, processes, and indexes vast corpora of historical texts into a vector database (e.g., primary sources, critical analyses, letters).
- Implements a sophisticated ReAct agent. When a user sends a message, the agent queries the vector database for relevant source material.
- Uses a Large Language Model (Gemini) to synthesize a response *in the persona of the historical figure*, based *only* on the retrieved documents.
- Returns the synthesized text along with the source citations for every piece of information, ensuring zero hallucination and full verifiability.

Endpoints: Robust OAuth2 endpoints (`/auth/...`), an endpoint to initiate a dialogue session (`/dialogue/start`), and a primary streaming endpoint for sending/receiving chat messages (`/dialogue/{session_id}/chat`).

2. Next.js Web App (web):

Role: "The Archive & Dialogue Chamber." This is the immersive, user-facing application.

Function:
- Handles user signup and login.
- Features "The Archive," a modern, minimalist dashboard where users can browse historical eras and select figures for dialogue.
- The core of the experience is the "Dialogue Chamber," an immersive, context-adaptive chat interface. The entire UI—fonts, colors, textures, and even UI elements—transforms to match the historical context of the figure the user is conversing with (e.g., a marble-and-parchment theme for Marcus Aurelius, a blueprint-and-monospace theme for Richard Feynman).
- Renders the AI's responses and elegantly displays the integrated, clickable source citations, allowing users to instantly verify the information against the primary source text.

User Experience & Core Loop:

1. Onboarding: A history undergraduate signs up and logs into the platform.
2. Discovery: From "The Archive" dashboard, she browses to the "Classical Antiquity" era and selects the portrait card for Socrates.
3. Immersion: The screen fades to black and re-emerges as the Dialogue Chamber, themed with the aesthetics of ancient Athens (marble textures, serif fonts).
4. Dialogue & Research: She asks, "What is your opinion on the charges brought against you by Meletus?" The AI, in the persona of Socrates, responds with a series of probing questions, drawing its entire knowledge base from the text of Plato's "Apology." Each response has small, clickable footnote markers.
5. Verification: She clicks a footnote, and a scroll "unfurls" from the side of the message bubble, displaying the exact passage from the "Apology" that the AI used to formulate its response, giving her a citable source for her research paper.
EOT

echo "--- Context generation complete. File 'thucydides_context.txt' is ready. ---"
