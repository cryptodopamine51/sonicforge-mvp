# modal_worker/app.py
import base64
import io
import os
from typing import Optional

import modal

# --- Modal app definition ---
app = modal.App("sonicforge-musicgen-mvp")

# Image: system deps + python deps
# NOTE: We keep it minimal for MVP. If build fails, we will pin versions.
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi==0.115.0",
        "pydantic==2.8.2",
        "uvicorn==0.30.6",
        # MusicGen lives in audiocraft
        "audiocraft==1.3.0",
        # Torch is heavy; Modal will resolve a compatible build.
        # If you get torch issues, we will pin torch+cuda explicitly.
        "torch",
    )
)

# GPU: start with a modest GPU.
# If generation is too slow or fails, change to "A10G" or stronger.
GPU_TYPE = os.environ.get("MODAL_GPU", "T4")


@app.function(
    image=image,
    gpu=GPU_TYPE,
    timeout=600,
    keep_warm=1,  # reduces cold start
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field

    # Lazy imports inside container
    from audiocraft.models import MusicGen
    import torch

    api = FastAPI(title="SonicForge MusicGen MVP", version="0.1.0")

    class GenerateRequest(BaseModel):
        prompt: str = Field(..., min_length=1, max_length=400)
        duration_sec: int = Field(15, ge=5, le=30)
        seed: Optional[int] = None
        format: str = Field("mp3")  # "mp3" or "wav"

    # Load model once per container
    # model options: "small", "medium", "large" (large requires more GPU)
    model = MusicGen.get_pretrained("medium")
    model.set_generation_params(duration=15)

    @api.get("/health")
    def health():
        return {"status": "ok", "gpu": GPU_TYPE}

    @api.post("/generate")
    def generate(req: GenerateRequest):
        if req.format not in ("mp3", "wav"):
            raise HTTPException(status_code=400, detail="format must be mp3 or wav")

        # Configure generation params
        model.set_generation_params(duration=req.duration_sec)

        # Seed (optional)
        if req.seed is not None:
            torch.manual_seed(req.seed)

        # Generate: returns a tensor waveform
        with torch.no_grad():
            wav = model.generate([req.prompt])  # shape: [batch, channels, samples]

        # Convert tensor -> bytes
        # We'll save to WAV in-memory first, then optionally encode to MP3 via ffmpeg.
        import soundfile as sf
        import subprocess
        import tempfile

        # audiocraft typically uses 32000 Hz
        sample_rate = 32000
        wav_np = wav[0].cpu().numpy().T  # (samples, channels)

        if req.format == "wav":
            buf = io.BytesIO()
            sf.write(buf, wav_np, sample_rate, format="WAV")
            audio_bytes = buf.getvalue()
        else:
            # mp3 via ffmpeg using temp files (simplest and reliable)
            with tempfile.TemporaryDirectory() as td:
                wav_path = os.path.join(td, "out.wav")
                mp3_path = os.path.join(td, "out.mp3")
                sf.write(wav_path, wav_np, sample_rate, format="WAV")

                cmd = ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-q:a", "2", mp3_path]
                p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if p.returncode != 0:
                    raise HTTPException(
                        status_code=500,
                        detail=f"ffmpeg mp3 encode failed: {p.stderr.decode('utf-8')[:200]}",
                    )

                with open(mp3_path, "rb") as f:
                    audio_bytes = f.read()

        audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
        return {
            "format": req.format,
            "audio_base64": audio_b64,
            "duration_sec": req.duration_sec,
            "seed": req.seed,
        }

    return api
