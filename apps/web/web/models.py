from pydantic import BaseModel, Field


class TranscriptIngestion(BaseModel):
    patient_id: str = Field(default="patient-dev-1", min_length=1)
    source: str = Field(default="google-meet")
    meeting_title: str | None = None
    meeting_url: str | None = None
    raw_text: str = Field(default="")
    captured_at: str | None = None


class AudioStreamInit(BaseModel):
    stream_id: str = Field(min_length=1)
    patient_id: str = Field(default="patient-dev-1", min_length=1)
    source: str = Field(default="google-meet")
    meeting_title: str | None = None
    meeting_url: str | None = None


class AudioStreamChunk(BaseModel):
    stream_id: str = Field(min_length=1)
    chunk_index: int = Field(ge=0)
    chunk_bytes: int = Field(ge=0)
    chunk_b64: str = Field(min_length=1)


class AudioStreamFinish(BaseModel):
    stream_id: str = Field(min_length=1)
