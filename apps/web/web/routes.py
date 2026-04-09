import base64
from pathlib import Path
from fastapi import APIRouter, Request, Response

from web.models import AudioStreamChunk, AudioStreamFinish, AudioStreamInit, TranscriptIngestion
from web.settings import DEFAULT_PATIENT_ID, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE
from web.transcripts import add_transcript, list_transcripts

router = APIRouter()
STREAMS: dict[str, bytearray] = {}
AUDIT_DIR = Path(__file__).resolve().parent.parent / "data" / "audio"


@router.get("/health")
def health() -> dict[str, str]:
    print("Health check requested")
    return {"status": "ok"}


@router.post("/api/dev/login")
def dev_login(response: Response) -> dict[str, str]:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=SESSION_COOKIE_VALUE,
        httponly=True,
        samesite="lax",
    )
    return {"status": "ok"}


@router.post("/api/transcripts")
def ingest_transcript(
    payload: TranscriptIngestion,
) -> dict[str, str]:
    if payload.patient_id != DEFAULT_PATIENT_ID:
        payload = payload.model_copy(update={"patient_id": DEFAULT_PATIENT_ID})
    add_transcript(payload)
    print("transcription recebida", {"patient_id": payload.patient_id, "length": len(payload.raw_text)})
    return {"status": "accepted"}


@router.get("/api/transcripts")
def get_transcripts() -> dict[str, list[TranscriptIngestion]]:
    return {"items": list_transcripts()}


@router.post("/api/audio/stream/start")
def start_audio_stream(payload: AudioStreamInit) -> dict[str, str]:
    STREAMS[payload.stream_id] = bytearray()
    print("stream iniciado", payload.model_dump())
    return {"status": "started"}


@router.post("/api/audio/stream/chunk")
async def append_audio_stream(
    payload: AudioStreamChunk,
) -> dict[str, str]:
    stream = STREAMS.setdefault(payload.stream_id, bytearray())
    stream.extend(base64.b64decode(payload.chunk_b64))
    print("chunk recebido", payload.model_dump())
    return {"status": "chunk_received"}


@router.post("/api/audio/stream/finish")
def finish_audio_stream(payload: AudioStreamFinish) -> dict[str, int | str]:
    stream = STREAMS.pop(payload.stream_id, bytearray())
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    audio_path = AUDIT_DIR / f"{payload.stream_id}.webm"
    audio_path.write_bytes(bytes(stream))
    print("stream finalizado", {"stream_id": payload.stream_id, "size": len(stream)})
    print("audio salvo em disco", {"path": str(audio_path), "size": len(stream)})
    return {"status": "finished", "size": len(stream), "path": str(audio_path)}


@router.post("/api/audio/upload")
async def upload_audio(request: Request) -> dict[str, int | str]:
    stream_id = request.query_params.get("stream_id", "").strip()
    if not stream_id:
        return {"status": "missing_stream_id", "size": 0, "path": ""}

    audio_bytes = await request.body()
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    audio_path = AUDIT_DIR / f"{stream_id}.webm"
    audio_path.write_bytes(audio_bytes)
    print("audio recebido por upload", {"stream_id": stream_id, "size": len(audio_bytes), "path": str(audio_path)})
    return {"status": "saved", "size": len(audio_bytes), "path": str(audio_path)}
