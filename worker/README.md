# MusicGen Worker

This worker consumes jobs from a Redis queue, generates music using MusicGen (simulated in this MVP), and uploads the result to S3.

## Setup

1.  **Environment Variables**:
    Create a `.env` file in this directory or pass env vars to Docker:
    ```
    API_URL=https://your-replit-app.replit.co
    REDIS_URL=redis://your-redis-host:6379
    S3_BUCKET=your-s3-bucket
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    ```

2.  **Run Locally**:
    ```bash
    pip install -r requirements.txt
    python worker.py
    ```

3.  **Run with Docker**:
    ```bash
    docker build -t musicgen-worker .
    docker run --env-file .env musicgen-worker
    ```

## Real Model Integration
To enable the actual MusicGen model:
1.  Uncomment `torch`, `torchaudio`, `audiocraft` in `requirements.txt`.
2.  Update `worker.py` to import `audiocraft` and load the model.
3.  Ensure your Docker host has GPU support (`--gpus all`).
