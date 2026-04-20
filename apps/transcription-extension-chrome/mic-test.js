let mediaRecorder = null;
let chunks = [];
let streamId = null;
let activeStreams = [];
let stopReason = "manual";
let stopRequested = false;
let lastErrorMessage = "";
let sourceTabWatchTimer = null;

const backendUrl = "https://api.rafaellapontes.com.br";
const helpChannelBaseUrl = "mailto:suporte@rafaellapontes.com.br";
const params = new URLSearchParams(window.location.search);
const pageMode = params.get("mode") ?? "debug";
const autostart = params.get("autostart") === "1";
const sourceTitle = params.get("sourceTitle") ?? "Meet";
const sourceTabId = params.get("sourceTabId");

const statusEl = document.getElementById("status");
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description");
const sessionMeta = document.getElementById("session-meta");
const sessionMetaText = document.getElementById("session-meta-text");
const sessionWarning = document.getElementById("session-warning");
const retryButton = document.getElementById("retry");
const stopButton = document.getElementById("stop");
const helpLink = document.getElementById("help-link");

function log(message, data) {
  const line = data ? `${message} ${JSON.stringify(data)}` : message;
  console.log(line);
  statusEl.textContent += `\n${line}`;
}

function updateHelpLink() {
  const subject = encodeURIComponent("Ajuda com captura da sessao");
  const body = encodeURIComponent(
    [
      "Oi, preciso de ajuda com a captura da sessao.",
      "",
      `Sessao esperada: ${sourceTitle}`,
      `Modo da pagina: ${pageMode}`,
      streamId ? `Stream ID: ${streamId}` : "Stream ID: ainda nao iniciado",
      lastErrorMessage ? `Ultimo erro: ${lastErrorMessage}` : "Ultimo erro: nenhum",
    ].join("\n"),
  );
  helpLink.href = `${helpChannelBaseUrl}?subject=${subject}&body=${body}`;
}

function showWarning(message) {
  sessionWarning.hidden = false;
  sessionWarning.textContent = message;
}

function clearWarning() {
  sessionWarning.hidden = true;
  sessionWarning.textContent = "";
}

function tryCloseWindow() {
  window.close();
  setTimeout(() => {
    if (!window.closed) {
      log("feche esta aba de captura");
    }
  }, 150);
}

function stopSourceTabWatch() {
  if (sourceTabWatchTimer) {
    clearInterval(sourceTabWatchTimer);
    sourceTabWatchTimer = null;
  }
}

function startSourceTabWatch() {
  if (pageMode !== "session" || !sourceTabId || sourceTabWatchTimer) {
    return;
  }

  sourceTabWatchTimer = setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "session:check-source-tab",
        target: "background",
        tabId: sourceTabId,
      });

      if (response?.ok && response.exists === false) {
        log("aba da sessao foi fechada", { tabId: sourceTabId });
        stopSourceTabWatch();
        stopCapture("source-tab-closed");
      }
    } catch (error) {
      log("falha ao verificar aba da sessao", {
        name: error?.name,
        message: error?.message,
      });
    }
  }, 1000);
}

function setSessionModeUi() {
  if (pageMode !== "session") {
    pageTitle.textContent = "Teste de captura";
    pageDescription.textContent =
      "Use esta pagina apenas para testar a captura. Para uso real, abra a partir do Google Meet.";
    retryButton.hidden = false;
    retryButton.textContent = "Iniciar captura";
    return;
  }

  pageTitle.textContent = "Preparando a captura da sessao";
  pageDescription.textContent =
    "Quando o seletor do navegador abrir, escolha a aba desta sessao e habilite o compartilhamento de audio.";
  sessionMeta.hidden = false;
  sessionMetaText.textContent = sourceTitle;
  retryButton.hidden = true;
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

    if (tabStream.getAudioTracks().length === 0) {
      throw new Error("A aba compartilhada foi iniciada sem audio.");
    }

    for (const track of tabStream.getTracks()) {
      track.addEventListener("ended", () => {
        log("compartilhamento encerrado", { kind: track.kind });
        stopCapture("share-ended");
      });
    }

    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(destination);
    log("audio da aba conectado");

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
  stopSourceTabWatch();
  for (const stream of activeStreams) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  activeStreams = [];
  await audioContext.close();
}

function resetActions() {
  retryButton.hidden = pageMode === "session";
  retryButton.disabled = false;
  stopButton.hidden = true;
  stopButton.disabled = true;
}

function setRecordingActions() {
  retryButton.hidden = true;
  stopButton.hidden = false;
  stopButton.disabled = false;
}

function stopCapture(reason = "manual") {
  if (!mediaRecorder || mediaRecorder.state === "inactive" || stopRequested) {
    return;
  }

  stopRequested = true;
  stopReason = reason;
  mediaRecorder.stop();
  resetActions();
  log("gravacao parada", { reason });
}

async function startCapture(mode) {
  try {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      return;
    }

    clearWarning();
    streamId = crypto.randomUUID();
    lastErrorMessage = "";
    updateHelpLink();
    log("abrindo captura", { streamId, mode, sourceTitle });

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
      resetActions();

      if (pageMode === "session" && ["share-ended", "source-tab-closed"].includes(stopReason)) {
        tryCloseWindow();
      }
    };

    mediaRecorder.start(1000);
    startSourceTabWatch();
    setRecordingActions();
    log("gravacao iniciada", { mode });
  } catch (error) {
    lastErrorMessage = error?.message ?? "erro inesperado";
    updateHelpLink();
    log("falha ao iniciar", {
      name: error?.name,
      message: error?.message,
    });

    showWarning(
      "Nao foi possivel iniciar automaticamente. Clique em “Continuar captura”, escolha a aba correta no navegador e habilite o compartilhamento de audio.",
    );
    retryButton.hidden = false;
    retryButton.textContent = pageMode === "session" ? "Continuar captura" : "Tentar novamente";
  }
}

retryButton.addEventListener("click", async () => {
  await startCapture(pageMode === "session" ? "mixed" : "mic");
});

stopButton.addEventListener("click", () => {
  stopCapture("manual");
});

setSessionModeUi();
updateHelpLink();
resetActions();

if (pageMode === "session" && autostart) {
  void startCapture("mixed");
}
