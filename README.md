<div align="center">
  <img src="https://raw.githubusercontent.com/mr-green1337/thucydides/main/assets/logo.png" alt="Thucydides Logo" width="120" />
  <h1 align="center">Thucydides</h1>
  <p align="center">
    <strong>Converse with history, grounded in truth.</strong>
    <br />
    A RAG-powered dialogue engine for interactive, verifiable research with historical figures.
  </p>
  <p align="center">
    <a href="https://github.com/mr-green1337/thucydides/stargazers">
      <img src="https://img.shields.io/github/stars/mr-green1337/thucydides?style=social" alt="GitHub Stars">
    </a>
    <a href="https://github.com/mr-green1337/thucydides/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/mr-green1337/thucydides?color=blue" alt="License">
    </a>
  </p>
</div>

<br />

<p align="center">
  <img src="https://raw.githubusercontent.com/mr-green1337/thucydides/main/assets/1.png" alt="Thucydides Dialogue Chamber">
</p>

## The Vision: Ask History a Question

> *"I'd love to be able to ask Aristotle a question."* — Steve Jobs, 1983

Decades ago, Steve Jobs dreamed of a day when we could do more than just read what historical figures wrote—we could interact with their knowledge. **Thucydides** is the realization of that vision.

It's an immersive platform where students, researchers, and enthusiasts can engage in deep, meaningful dialogues with history's greatest minds. Unlike a standard chatbot, every response from a historical figure is generated and **strictly grounded in a library of primary and secondary sources**, with verifiable citations provided in real-time. This ensures academic integrity and eliminates AI hallucinations.

---

## Key Features

- **🗣️ Natural Language Dialogue:** Converse with figures like Marcus Aurelius, Socrates, and Cleopatra in a fluid, immersive chat interface.
- **📚 RAG-Powered Accuracy:** Utilizes a Retrieval-Augmented Generation (RAG) pipeline with Google Gemini to ensure responses are based *only* on indexed source material.
- **🧾 Verifiable Citations:** Every piece of information is footnoted with the exact source text it was derived from, making it a powerful tool for academic research.
- **🔍 AI-Powered Discovery:** Use the "Collaborative Search" to describe a figure in natural language (e.g., "the last pharaoh of Egypt") and let the AI find the right person in the archive.
- **🌐 Modern Tech Stack:** Built with a fully containerized FastAPI backend and a reactive Next.js frontend for a robust and scalable experience.
- **💳 Stripe Integration:** Includes a full billing system for managing user subscriptions.

<p align="center">
  <img src="https://raw.githubusercontent.com/mr-green1337/thucydides/main/assets/2.png" alt="The Archive">
</p>

---

## Tech Stack

This project is a full-stack application built with a modern, production-ready technology set.

| Area      | Technology                                                                                                                              |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**   | <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" /> <img src="https://img.shields.io/badge/SQLModel-48B0F0?style=for-the-badge&logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" /> |
| **Frontend**  | <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" /> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />   |
| **AI / ML**   | <img src="https://img.shields.io/badge/Google_Gemini-8E77F0?style=for-the-badge&logo=google-gemini&logoColor=white" /> <img src="https://img.shields.io/badge/Qdrant-FF69B4?style=for-the-badge&logo=qdrant&logoColor=white" /> |
| **Infra & Auth** | <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/Stripe-6772E5?style=for-the-badge&logo=stripe&logoColor=white" /> <img src="https://img.shields.io/badge/NextAuth.js-000?style=for-the-badge&logo=nextauth.js&logoColor=white" /> |

---

## Getting Started

This project is fully containerized with Docker, making local setup straightforward.

### Prerequisites

- [Docker](https://www.docker.com/get-started/) and Docker Compose
- Git

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/mr-green1337/thucydides.git
    cd thucydides
    ```

2.  **Configure Environment Variables:**
    You'll need to set up your secrets. There are example files in both the `backend` and `web` directories.

    - **Backend:**
      ```bash
      cd backend
      cp .env.example .env
      ```
      Now, edit `backend/.env` and fill in your keys for:
      - `POSTGRES_DATABASE_URL` (should be `postgresql+asyncpg://postgres:postgres@postgres:5432/postgres` for Docker)
      - `PRIVATE_KEY` & `PUBLIC_KEY` (generate an RS256 key pair)
      - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
      - `GOOGLE_API_KEY` (for Gemini)
      - `STRIPE_API_KEY` & `STRIPE_WEBHOOK_SECRET`

    - **Frontend:**
      ```bash
      cd ../web
      cp .env.example .env
      ```
      Now, edit `web/.env` and fill in your keys for:
      - `NEXTAUTH_SECRET` (generate a random string)
      - `NEXTAUTH_URL` (should be `http://localhost:3000`)
      - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

3.  **Run the Application:**
    From the root `thucydides` directory, launch the entire stack with Docker Compose.

    ```bash
    docker-compose up --build
    ```
    The `--build` flag is only needed the first time or after code changes.

4.  **Access the Application:**
    - The Next.js frontend will be available at [http://localhost:3000](http://localhost:3000).
    - The FastAPI backend API docs will be at [http://localhost:8000/docs](http://localhost:8000/docs).

<p align="center">
  <img src="https://raw.githubusercontent.com/mr-green1337/thucydides/main/assets/3.png" alt="Collaborative Search">
</p>

---

## Roadmap

This project is actively under development. Here's what's planned next:

- [ ] Full deployment to a cloud provider (e.g., Vercel/AWS).
- [ ] Ingestion pipeline for users to upload their own source texts.
- [ ] Context-aware UI themes that adapt to the historical era.
- [ ] Caching layer (Redis) for frequently accessed data.
- [ ] More robust testing suite for the backend and frontend.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/mshumer/thucydides/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/mshumer/thucydides/blob/main/LICENSE) file for details.
