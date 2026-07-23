"""
Motor de Videos — Worker (Modal)
================================
Pipeline de procesamiento de video. Cada etapa actualiza el estado del `job`
en Supabase y (cuando aplique) sube resultados a S3.

Estado: ESQUELETO del sprint "El Cortador + Reencuadre + Plan.md".
La lógica real de cada etapa se implementa por pasos; aquí queda la forma.

Correr localmente:  modal run worker/main.py
Desplegar:          modal deploy worker/main.py
Secrets:            ver docs/SETUP.md (aws, openrouter, supabase)
"""

import modal

app = modal.App("motor-de-videos")

# Imagen del contenedor: FFmpeg + librerías de audio/IA.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .pip_install(
        "faster-whisper",   # transcripción con timestamps
        "boto3",            # S3
        "httpx",            # llamadas HTTP (OpenRouter)
        "supabase",         # actualizar estado/costos
    )
)

# Secrets creados con `modal secret create ...` (ver docs/SETUP.md).
secrets = [
    modal.Secret.from_name("aws"),
    modal.Secret.from_name("openrouter"),
    modal.Secret.from_name("supabase"),
]


# ---------- Etapas del pipeline (mapean a los estados del job) ----------

@app.function(image=image, secrets=secrets, timeout=3600)
def transcribe(job_id: str):
    """Etapa 2 (`transcribing`): video -> transcript con timestamps por palabra."""
    # TODO: descargar video de S3, correr faster-whisper, guardar transcript,
    #       registrar costo (minutos), pasar a 'planning_cuts'.
    raise NotImplementedError


@app.function(image=image, secrets=secrets, timeout=900)
def plan_cuts(job_id: str):
    """Etapa 3 (`planning_cuts`): transcript + descripción -> plan de cortes (LLM)."""
    # TODO: prompt a OpenRouter con transcript + descripción del proyecto,
    #       guardar cut_plan (segmentos), pasar a 'review_pending' y esperar al humano.
    raise NotImplementedError


@app.function(image=image, secrets=secrets, timeout=3600)
def render_clean(job_id: str):
    """Etapa 5 (`rendering`): aplica los cortes aprobados -> video limpio (FFmpeg)."""
    # TODO: leer segmentos aprobados, cortar/concatenar con FFmpeg, subir a S3.
    raise NotImplementedError


@app.function(image=image, secrets=secrets, timeout=1800)
def propose_reframe(job_id: str):
    """Etapa 6 (`reframing`): genera propuestas de encuadre ajustado (no auto-aplica)."""
    raise NotImplementedError


@app.function(image=image, secrets=secrets, timeout=900)
def propose_visuals(job_id: str):
    """Etapa 7 (`proposing_visuals`): propone apoyo visual y material necesario (LLM)."""
    raise NotImplementedError


@app.function(image=image, secrets=secrets, timeout=600)
def assemble_plan(job_id: str):
    """Etapa 8 (`plan_ready`): ensambla el plan.md (video limpio + propuestas) -> S3."""
    raise NotImplementedError


# ---------- Endpoint que dispara el pipeline desde Next.js ----------

@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="POST")
def start_pipeline(payload: dict):
    """
    Recibe {"job_id": "..."} desde la web y arranca el pipeline en background.
    Corre hasta 'review_pending'; tras la aprobación humana la web dispara la
    reanudación (render_clean -> ... -> plan_ready).
    """
    job_id = payload["job_id"]
    transcribe.spawn(job_id)  # encadenaremos las siguientes etapas dentro de cada una
    return {"ok": True, "job_id": job_id}
