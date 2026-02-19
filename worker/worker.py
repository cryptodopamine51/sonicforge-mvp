import os
import time
import json
import redis
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:5000")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
S3_BUCKET = os.getenv("S3_BUCKET", "music-gen-bucket")
MODEL_NAME = os.getenv("MODEL_NAME", "facebook/musicgen-medium")

# Initialize Redis client
try:
    r = redis.from_url(REDIS_URL)
    print(f"Connected to Redis at {REDIS_URL}")
except Exception as e:
    print(f"Failed to connect to Redis: {e}")
    # Fallback for testing without Redis: we'll simulate a loop
    r = None

def process_job(job_id):
    print(f"Processing job {job_id}...")
    
    # 1. Fetch job details from API
    try:
        response = requests.get(f"{API_URL}/api/jobs/{job_id}")
        response.raise_for_status()
        job = response.json()
    except Exception as e:
        print(f"Error fetching job {job_id}: {e}")
        return

    # Update status to processing
    requests.patch(f"{API_URL}/api/jobs/{job_id}", json={
        "status": "processing", 
        "startedAt": new_iso_timestamp()
    })

    # 2. Simulate Music Generation (The real model code would go here)
    print(f"Generating music for prompt: '{job['prompt']}' with model {job['model']}...")
    time.sleep(5) # Simulate generation time

    # 3. Simulate S3 Upload
    # In a real worker, we would upload the generated file to S3
    # bucket.upload_file("output.mp3", f"jobs/{job_id}.mp3")
    audio_url = f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{job_id % 16 + 1}.mp3" 
    print(f"Uploaded to {audio_url}")

    # 4. Update Job Status to Completed
    requests.patch(f"{API_URL}/api/jobs/{job_id}", json={
        "status": "completed",
        "audioUrl": audio_url,
        "finishedAt": new_iso_timestamp()
    })
    print(f"Job {job_id} completed successfully.")

def new_iso_timestamp():
    from datetime import datetime
    return datetime.utcnow().isoformat() + "Z"

def main():
    print("Worker started. Waiting for jobs...")
    while True:
        if r:
            # Blocking pop from Redis 'jobs' list
            # Returns a tuple (queue_name, data)
            task = r.blpop("jobs", timeout=5)
            if task:
                job_id = task[1].decode("utf-8")
                process_job(job_id)
        else:
            # Fallback/Mock mode: Poll API for pending jobs (for testing locally without Redis)
            try:
                response = requests.get(f"{API_URL}/api/jobs")
                if response.status_code == 200:
                    jobs = response.json()
                    pending_jobs = [j for j in jobs if j['status'] == 'pending']
                    for job in pending_jobs:
                        process_job(job['id'])
                time.sleep(5)
            except Exception as e:
                print(f"Error polling API: {e}")
                time.sleep(5)

if __name__ == "__main__":
    main()
