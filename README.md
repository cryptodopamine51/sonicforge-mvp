# Text-to-Music Generation API MVP

This project consists of two parts:
1.  **Replit App**: Node.js/Express API + React Frontend + Postgres DB.
2.  **Worker**: Python script that processes jobs (simulated MusicGen).

## 1. Replit App (API & UI)

The main application is hosted on Replit.

### Setup
- The project uses a PostgreSQL database (automatically provisioned).
- Redis is optional for local dev but recommended for production.
  - Set `REDIS_URL` in Secrets if you have an external Redis instance.
  - If `REDIS_URL` is not set, jobs are saved to DB and the worker can poll the API (fallback mode).

### Run
The app starts automatically with:
```bash
npm run dev
```
Access the UI at the Replit URL.

## 2. Worker (GPU)

The worker code is in the `worker/` directory. It is designed to run on a separate machine with a GPU (or locally for testing).

### Setup (Local/External Machine)
1.  Navigate to `worker/` directory.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set environment variables (create `.env` or export):
    ```bash
    API_URL=https://your-replit-app.replit.co  # URL of this Replit app
    REDIS_URL=redis://...                      # Optional, if using Redis
    ```
4.  Run the worker:
    ```bash
    python worker.py
    ```

## API Documentation

### Endpoints

#### `POST /api/jobs`
Create a new music generation job.
- **Body**:
  ```json
  {
    "prompt": "A cheerful melody",
    "durationSec": 15,
    "format": "mp3",
    "model": "musicgen-medium"
  }
  ```
- **Response**: `201 Created` with Job object.

#### `GET /api/jobs/:id`
Get job status and details.
- **Response**: Job object.

#### `GET /api/jobs`
List all jobs.

#### `PATCH /api/jobs/:id`
Update job status (used by Worker).
- **Body**: `{ "status": "processing", ... }`

### Example Curl Commands

**Create a Job:**
```bash
curl -X POST https://your-app-url/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Synthwave beat", "durationSec": 10}'
```

**Check Job Status:**
```bash
curl https://your-app-url/api/jobs/1
```

## Environment Variables

- `DATABASE_URL`: Postgres connection string (Required).
- `REDIS_URL`: Redis connection string (Optional).
