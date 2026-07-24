"""
Motor de Videos — Worker (Modal)
================================
Pipeline del sprint "El Cortador + Reencuadre + Plan.md". Cada etapa:
  1) marca el estado del `job` en Supabase,
  2) hace su trabajo (S3 / Whisper / FFmpeg / OpenRouter),
  3) registra el costo en `cost_events`,
  4) dispara la siguiente etapa — o se DETIENE en la revisión humana.

Idiom Modal: en el nivel superior solo importamos `modal` + stdlib. Las libs
pesadas (boto3, supabase, faster-whisper, httpx) se importan DENTRO de cada
función, porque solo existen en la imagen del contenedor, no en local.

Local:    modal run worker/main.py
Deploy:   modal deploy worker/main.py
Secrets:  ver docs/SETUP.md (aws, openrouter, supabase)
"""

from __future__ import annotations

import os
from typing import Any

import modal

app = modal.App("motor-de-videos")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .pip_install(
        "faster-whisper",   # transcripción con timestamps
        "boto3",            # S3
        "httpx",            # OpenRouter
        "supabase",         # estado / costos
    )
)

# Secrets creados con `modal secret create ...` (ver docs/SETUP.md).
secrets = [
    modal.Secret.from_name("aws"),
    modal.Secret.from_name("openrouter"),
    modal.Secret.from_name("supabase"),
]


# =============================================================
# Helpers de infraestructura (corren dentro del contenedor)
# =============================================================

def _supabase():
    from supabase import create_client

    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _s3():
    import boto3

    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


def _bucket() -> str:
    return os.environ["S3_BUCKET"]


# ---------- Base de datos (jobs / costos / planes / assets) ----------

def set_state(job_id: str, state: str, progress: int | None = None,
              error: str | None = None) -> None:
    patch: dict[str, Any] = {"state": state}
    if progress is not None:
        patch["progress"] = progress
    if error is not None:
        patch["error"] = error
    _supabase().table("jobs").update(patch).eq("id", job_id).execute()


def get_job(job_id: str) -> dict:
    return _supabase().table("jobs").select("*").eq("id", job_id).single().execute().data


def get_project(project_id: str) -> dict:
    return _supabase().table("projects").select("*").eq("id", project_id).single().execute().data


def insert_cost(*, workspace_id: str, project_id: str | None, job_id: str | None,
                category: str, provider: str, quantity: float, unit: str,
                cost_usd: float) -> None:
    _supabase().table("cost_events").insert({
        "workspace_id": workspace_id,
        "project_id": project_id,
        "job_id": job_id,
        "category": category,
        "provider": provider,
        "quantity": quantity,
        "unit": unit,
        "cost_usd": cost_usd,
    }).execute()


def insert_asset(*, workspace_id: str, project_id: str, kind: str, s3_key: str,
                 mime_type: str | None = None, size_bytes: int | None = None) -> None:
    _supabase().table("assets").insert({
        "workspace_id": workspace_id,
        "project_id": project_id,
        "kind": kind,
        "s3_key": s3_key,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
    }).execute()


# ---------- Almacenamiento (S3) ----------

def download(key: str, dest: str) -> str:
    _s3().download_file(_bucket(), key, dest)
    return dest


def upload(src: str, key: str, content_type: str | None = None) -> str:
    extra = {"ContentType": content_type} if content_type else {}
    _s3().upload_file(src, _bucket(), key, ExtraArgs=extra)
    return key


def presign_get(key: str, expires: int = 3600) -> str:
    return _s3().generate_presigned_url(
        "get_object", Params={"Bucket": _bucket(), "Key": key}, ExpiresIn=expires
    )


# ---------- LLM (OpenRouter — API compatible con OpenAI) ----------

def llm_complete(model: str, messages: list[dict], **kwargs) -> dict:
    import httpx

    resp = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
        json={"model": model, "messages": messages, **kwargs},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


# El contrato de salida (build_plan_md) vive en worker/plan.py — módulo puro y
# testeable. Se importará dentro de assemble_plan cuando implementemos la etapa.


# =============================================================
# Etapas del pipeline (mapean a los estados del job)
# NOTA: el "cuerpo" pesado (Whisper/FFmpeg/prompts) es TODO de Fase 1.
#       La orquestación de estados y el encadenamiento ya están cableados.
# =============================================================

@app.function(image=image, secrets=secrets, timeout=3600)
def transcribe(job_id: str):
    """Etapa 2 (`transcribing`): video -> transcript con timestamps."""
    set_state(job_id, "transcribing", progress=10)
    # TODO Fase 1: download(raw_key) -> faster-whisper -> guardar transcript (asset)
    #              -> insert_cost(category='transcription', provider='whisper', unit='minutes')
    plan_cuts.spawn(job_id)


@app.function(image=image, secrets=secrets, timeout=900)
def plan_cuts(job_id: str):
    """Etapa 3 (`planning_cuts`): transcript + descripción -> plan de cortes (LLM)."""
    set_state(job_id, "planning_cuts", progress=30)
    # TODO Fase 1: llm_complete(model, [transcript + project.description])
    #              -> guardar cut_plan (segmentos) -> insert_cost(category='llm', unit='tokens')
    # Se DETIENE para revisión humana (el humano aprueba en la web):
    set_state(job_id, "review_pending", progress=40)


@app.function(image=image, secrets=secrets, timeout=3600)
def render_clean(job_id: str):
    """Etapa 5 (`rendering`): aplica los cortes aprobados -> video limpio (FFmpeg)."""
    set_state(job_id, "rendering", progress=55)
    # TODO Fase 1: leer segmentos aprobados -> FFmpeg (cortar/concatenar) -> upload(clean_key)
    #              -> insert_asset(kind='clean_video')
    propose_reframe.spawn(job_id)


@app.function(image=image, secrets=secrets, timeout=1800)
def propose_reframe(job_id: str):
    """Etapa 6 (`reframing`): propuestas de encuadre ajustado (no auto-aplica)."""
    set_state(job_id, "reframing", progress=70)
    # TODO Fase 1: analizar encuadre/sujeto -> propuestas de reencuadre.
    propose_visuals.spawn(job_id)


@app.function(image=image, secrets=secrets, timeout=900)
def propose_visuals(job_id: str):
    """Etapa 7 (`proposing_visuals`): apoyo visual + material necesario (LLM)."""
    set_state(job_id, "proposing_visuals", progress=85)
    # TODO Fase 1: llm_complete -> propuestas de b-roll/gráficos/SFX + lista de material.
    assemble_plan.spawn(job_id)


@app.function(image=image, secrets=secrets, timeout=600)
def assemble_plan(job_id: str):
    """Etapa 8 (`plan_ready`): ensambla el plan.md y lo sube a S3."""
    # TODO Fase 1: build_plan_md(...) -> upload(plan_key) -> insert_asset(kind='plan_md')
    set_state(job_id, "plan_ready", progress=100)


# =============================================================
# Endpoints HTTP que dispara la web (Next.js)
# (si tu versión de Modal usa el nombre antiguo, es `modal.web_endpoint`)
# =============================================================

@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="POST")
def start_pipeline(payload: dict):
    """Arranca el pipeline: {"job_id": "..."}. Corre hasta 'review_pending'."""
    job_id = payload["job_id"]
    transcribe.spawn(job_id)
    return {"ok": True, "job_id": job_id, "next": "transcribing"}


@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="POST")
def resume_pipeline(payload: dict):
    """Reanuda tras la aprobación humana: {"job_id": "..."}. Corre render -> plan_ready."""
    job_id = payload["job_id"]
    render_clean.spawn(job_id)
    return {"ok": True, "job_id": job_id, "next": "rendering"}
