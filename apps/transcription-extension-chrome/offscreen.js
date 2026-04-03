let mediaRecorder = null;
let chunks = [];
let chunkIndex = 0;

console.log("documento offscreen carregado");

chrome.runtime.onMessage.addListener((message) => {
  if (message?.target !== "offscreen") return;

  void (async () => {
    if (message.type === "recording:start") {
      await startRecording(message.data);
      return;
    }

    if (message.type === "recording:stop") {
      await stopRecording();
    }
  })().catch((error) => {
    console.error("erro no offscreen listener", error);
  });

  return true;
});

async function startRecording(data) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    return;
  }

  const media = await getMediaStream(data);

  chunks = [];
  chunkIndex = 0;
  await postJson(`${data.backendUrl.replace(/\/$/, "")}/api/audio/stream/start`, {
    method: "POST",
    body: JSON.stringify({
      stream_id: data.streamId,
      patient_id: data.patientId,
      source: "google-meet",
      meeting_title: data.tabTitle,
      meeting_url: "",
    }),
  });
  console.log("stream avisado ao backend", { streamId: data.streamId });
  mediaRecorder = new MediaRecorder(media, {
    mimeType: "audio/webm;codecs=opus",
  });

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
      const buffer = await event.data.arrayBuffer();
      const chunkB64 = arrayBufferToBase64(buffer);
      await postJson(`${data.backendUrl.replace(/\/$/, "")}/api/audio/stream/chunk`, {
        method: "POST",
        body: JSON.stringify({
          stream_id: data.streamId,
          chunk_index: chunkIndex++,
          chunk_bytes: event.data.size,
          chunk_b64: chunkB64,
        }),
      });
      console.log("chunk enviado", {
        streamId: data.streamId,
        bytes: event.data.size,
        chunkIndex: chunkIndex - 1,
      });
    }
  };

  mediaRecorder.onstop = async () => {
    await postJson(`${data.backendUrl.replace(/\/$/, "")}/api/audio/stream/finish`, {
      method: "POST",
      body: JSON.stringify({
        stream_id: data.streamId,
      }),
    });
    console.log("stream finalizado no backend", {
      streamId: data.streamId,
      chunks: chunks.length,
      size: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
    });
  };

  mediaRecorder.start(1000);
  console.log("gravacao iniciada", {
    tabTitle: data.tabTitle,
    streamId: data.streamId,
    mode: data.mode ?? "tab",
  });
}

async function stopRecording() {
  if (!mediaRecorder) return;
  if (mediaRecorder.state === "inactive") return;

  mediaRecorder.stop();
  console.log("gravacao parada");
}

async function postJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`backend json failed: ${response.status}`);
  }
  return response;
}

async function getMediaStream(data) {
  if (data.mode === "mic") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch (error) {
      console.error("falha ao abrir microfone", {
        name: error?.name,
        message: error?.message,
      });
      throw error;
    }
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: data.streamId,
        },
      },
      video: false,
    });
  } catch (error) {
    console.error("falha ao abrir captura de aba", {
      name: error?.name,
      message: error?.message,
    });
    throw error;
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}
