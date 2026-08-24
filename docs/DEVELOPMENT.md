# Development

Run backend with `uvicorn app.main:app --reload --port 8000` from `backend` after installing `requirements.txt`.

Run frontend with `npm install && npm run dev` from `frontend`.

The first practical activity is a local-first circuit simulator: connect three terminal pairs and close the switch to turn on the lamp. The frontend calls the FastAPI scoring endpoint when available and has a deterministic local fallback so the activity remains usable during development.
