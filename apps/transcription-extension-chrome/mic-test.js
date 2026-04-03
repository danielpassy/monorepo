let mediaRecorder = null;
let chunks = [];
let streamId = null;
let activeStreams = [];
let stopReason = "manual";
let stopRequested = false;
const backendUrl = "http://127.0.0.1:8000";
const params = new URLSearchParams(window.location.search);
const pageMode = params.get("mode") ?? "debug";
const autostart = params.get("autostart") === "1";
const sourceTitle = params.get("sourceTitle") ?? "Meet";
const sourceTabId = params.get("sourceTabId");

const statusEl = document.getElementById("status");
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description");
const sessionHint = document.getElementById("session-hint");
const startButton = document.getElementById("start");
const startMixedButton = document.getElementById("start-mixed");
const stopButton = document.getElementById("stop");

function log(message, data) {
  const line = data ? `${message} ${JSON.stringify(data)}` : message;
  console.log(line);
  statusEl.textContent += `\n${line}`;
}

function tryCloseWindow() {
  window.close();
  setTimeout(() => {
    if (!window.closed) {
      log("feche esta aba de captura");
    }
  }, 150);
}

function setSessionModeUi() {
  if (pageMode !== "session") {
    return;
  }

  pageTitle.textContent = "Captura da sessao";
  pageDescription.textContent =
    "Esta pagina tenta iniciar a captura automaticamente. No seletor do navegador, escolha a aba da sessao e marque compartilhar audio.";
  sessionHint.hidden = false;
  sessionHint.textContent = `Aba esperada: ${sourceTitle}`;
  startButton.hidden = true;
  startMixedButton.textContent = "Continuar captura da sessao";
}

async function buildCaptureStream(mode) {
  const streams = [];
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  streams.push(micStream);

  const micSource = audioContext.createMediaStreamSource(micStream);
  micSource.connect(destination);
  log("microfone conectado");

  if (mode === "mixed") {
    const tabStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
      },
      audio: {
        suppressLocalAudioPlayback: false,
      },
      preferCurrentTab: true,
      surfaceSwitching: "include",
      monitorTypeSurfaces: "exclude",
      systemAudio: "include",
    });
    streams.push(tabStream);

    const hasAudioTrack = tabStream.getAudioTracks().length > 0;
    if (!hasAudioTrack) {
      throw new Error("a aba compartilhada nao trouxe audio");
    }

    for (const track of tabStream.getTracks()) {
      track.addEventListener("ended", () => {
        log("compartilhamento encerrado", { kind: track.kind });
        stopCapture("share-ended");
      });
    }

    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(destination);
    log("audio da aba conectado pelo compartilhamento do navegador");

    if (pageMode === "session" && sourceTabId) {
      await chrome.runtime.sendMessage({
        type: "session:focus-source-tab",
        target: "background",
        tabId: sourceTabId,
      });
      log("foco devolvido para a aba da sessao", { tabId: sourceTabId });
    }
  }

  activeStreams = streams;
  return { stream: destination.stream, audioContext };
}

async function uploadRecording(blob) {
  const response = await fetch(`${backendUrl}/api/audio/upload?stream_id=${encodeURIComponent(streamId)}`, {
    method: "POST",
    body: blob,
  });
  if (!response.ok) {
    throw new Error(`falha ao enviar audio: ${response.status}`);
  }
  const payload = await response.json();
  log("audio enviado ao backend", payload);
}

async function cleanupCapture(audioContext) {
  for (const stream of activeStreams) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  activeStreams = [];
  await audioContext.close();
}

function resetButtons() {
  startButton.disabled = pageMode === "session";
  startMixedButton.disabled = false;
  stopButton.disabled = true;
}

function stopCapture(reason = "manual") {
  if (!mediaRecorder || mediaRecorder.state === "inactive" || stopRequested) {
    return;
  }

  stopRequested = true;
  stopReason = reason;
  mediaRecorder.stop();
  resetButtons();
  log("gravacao parada", { reason });
}

async function startCapture(mode) {
  try {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      return;
    }

    streamId = crypto.randomUUID();
    log("abrindo captura", { streamId, mode });

    const { stream, audioContext } = await buildCaptureStream(mode);

    chunks = [];
    stopRequested = false;
    stopReason = "manual";
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        log("chunk capturado", { bytes: event.data.size, chunks: chunks.length });
      }
    };

    mediaRecorder.onstop = async () => {
      await cleanupCapture(audioContext);
      const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
      await uploadRecording(blob);
      mediaRecorder = null;

      if (pageMode === "session" && stopReason === "share-ended") {
        tryCloseWindow();
      }
    };

    mediaRecorder.start(1000);
    startButton.disabled = true;
    startMixedButton.disabled = true;
    stopButton.disabled = false;
    log("gravacao iniciada", { mode });
  } catch (error) {
    log("falha ao iniciar", {
      name: error?.name,
      message: error?.message,
    });

    if (pageMode === "session") {
      sessionHint.hidden = false;
      sessionHint.textContent =
        "O navegador bloqueou o inicio automatico. Clique em 'Continuar captura da sessao' e escolha a aba do Meet com audio.";
    }
  }
}

startButton.addEventListener("click", async () => {
  await startCapture("mic");
});

startMixedButton.addEventListener("click", async () => {
  await startCapture("mixed");
});

stopButton.addEventListener("click", () => {
  stopCapture("manual");
});

setSessionModeUi();

if (pageMode === "session" && autostart) {
  void startCapture("mixed");
}
