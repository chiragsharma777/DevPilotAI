# DevPilotAI

DevPilotAI is an AI-powered productivity and workflow assistant that combines a modern React frontend, a FastAPI backend, and Supabase-powered authentication and data storage. It is designed to help users interact with AI while integrating with tools like GitHub, Notion, Google, and social platforms.

## Overview

This project includes:

- A FastAPI backend for API orchestration, authentication, and AI request handling
- A Vite + React + TypeScript frontend for the user experience
- Supabase database and SQL setup for user profiles and integration state
- OAuth and identity integrations for multiple providers
- AI chat workflows using OpenAI-compatible models such as Sarvam AI

## Features

- AI chat interface with markdown rendering and syntax highlighting
- OAuth login with GitHub, Google, and Notion
- Social integrations for Instagram and Snapchat
- Supabase-based auth and profile management
- FastAPI backend with CORS and secure cookie session handling
- Modular integration layer for third-party services
- Responsive frontend built with React and Tailwind CSS

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Markdown
- Lucide React

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- Supabase client
- OpenAI-compatible model client
- Python-dotenv

### Data & Auth
- Supabase
- SQL migration files in `supabase/`
- Email auth + OAuth provider support

## Repository Structure

```text
DevPilotAI/
├── backend/
│   ├── .env.example
│   ├── integrations.py
│   ├── main.py
│   ├── requirements.txt
│   ├── requirements-phase1.txt
│   ├── supabase_client.py
│   └── test_supabase.py
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── supabase/
│   ├── auth_profiles.sql
│   └── phase1_integrations.sql
├── .gitignore
└── README.md
```

## Prerequisites

Before running the app, make sure you have:

- Python 3.10+
- Node.js 18+
- npm
- A Supabase project
- AI provider credentials (for example Sarvam or OpenAI-compatible API keys)
- OAuth credentials for any integrations you want to enable

## Environment Setup

1. Copy the example backend environment file:

```bash
cp backend/.env.example backend/.env
```

2. Update the environment variables in `backend/.env` with your own values, including:

- `SARVAM_API_KEY` or another LLM provider key
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`

3. Configure your Supabase project for email and redirect-based auth as described in the frontend README.

## Running the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8082 --reload
```

The backend exposes the API through FastAPI and handles session auth, AI connections, and platform integrations.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, the app is served on the Vite development port (`http://localhost:5173`).

## Supabase Setup

The repository includes SQL helpers for the application schema:

- `supabase/auth_profiles.sql` creates a profile row for each authenticated user
- `supabase/phase1_integrations.sql` configures integration-related database structure

Apply these scripts in your Supabase SQL editor as needed for the project.

## Notes

This project is currently structured as a full-stack application with early-phase integrations and authentication scaffolding. Some providers and features may require additional configuration and credentials before use in production or local development.

## License

This project does not currently include a license file. If you plan to distribute or reuse the project publicly, add an appropriate open-source license before publication.

## Contributing

Contributions are welcome. If you are improving the app, please create a feature branch and open a pull request with a clear description of the changes.

## Contact

For questions or collaboration, please reach out through the repository owner or the project’s GitHub issue tracker.
