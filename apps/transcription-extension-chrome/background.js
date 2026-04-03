let recording = false;
let recorderTabId = null;
let recordingMode = "tab";
const backendUrl = "http://127.0.0.1:8000";
const patientId = "patient-dev-1";

console.log("extensao de audio carregada");

chrome.action.onClicked.addListener(async (tab) => {
  if (recording) await stopRecording();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== "background") return;

  void (async () => {
    if (message.type === "session:open-page") {
      const tab = message.tabId ? await chrome.tabs.get(message.tabId) : sender?.tab ?? null;
      if (!tab?.id || !tab.url) {
        throw new Error("aba ativa nao encontrada");
      }

      const sessionUrl = new URL(chrome.runtime.getURL("mic-test.html"));
      sessionUrl.searchParams.set("mode", "session");
      sessionUrl.searchParams.set("autostart", "1");
      sessionUrl.searchParams.set("sourceTabId", String(tab.id));
      sessionUrl.searchParams.set("sourceTitle", tab.title ?? "Sessao");

      await chrome.tabs.create({ url: sessionUrl.toString() });
      sendResponse?.({ ok: true });
      return;
    }

    if (message.type === "session:focus-source-tab") {
      const tabId = Number(message.tabId);
      if (!Number.isFinite(tabId)) {
        throw new Error("tabId invalido");
      }

      await chrome.tabs.update(tabId, { active: true });
      sendResponse?.({ ok: true });
      return;
    }

    if (message.type === "recording:start-mic") {
      const tab = message.tabId ? await chrome.tabs.get(message.tabId) : sender?.tab ?? null;
      await startRecording(tab, "mic");
      sendResponse?.({ ok: true });
      return;
    }

    if (message.type === "recording:start-tab") {
      const tab = message.tabId ? await chrome.tabs.get(message.tabId) : sender?.tab ?? null;
      await startRecording(tab, "tab");
      sendResponse?.({ ok: true });
      return;
    }

    if (message.type === "recording:stop") {
      await stopRecording();
      sendResponse?.({ ok: true });
    }
  })().catch((error) => {
    console.error("erro no listener de mensagem", error);
    sendResponse?.({ ok: false, error: String(error) });
  });

  return true;
});

async function startRecording(tab, mode) {
  if (!tab?.id) {
    throw new Error("aba ativa nao encontrada");
  }

  if (
    mode === "tab" &&
    (!tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:"))
  ) {
    throw new Error("capture de aba so funciona em paginas normais");
  }

  const offscreenDocument = await ensureOffscreenDocument();
  const streamId =
    mode === "mic"
      ? crypto.randomUUID()
      : await chrome.tabCapture.getMediaStreamId({
          targetTabId: tab.id,
        });

  recorderTabId = tab.id;
  recording = true;
  recordingMode = mode;
  console.log("captura iniciada", { tabId: tab.id, title: tab.title });

  chrome.runtime.sendMessage({
    type: "recording:start",
    target: "offscreen",
    data: {
      streamId,
      tabTitle: tab.title ?? "meet",
      backendUrl,
      patientId,
      mode,
    },
  });
}

async function stopRecording() {
  recording = false;
  recorderTabId = null;
  recordingMode = "tab";
  console.log("captura parada");
  chrome.runtime.sendMessage({
    type: "recording:stop",
    target: "offscreen",
  });
}

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({});
  const existing = contexts.find((c) => c.contextType === "OFFSCREEN_DOCUMENT");
  if (existing) return existing;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record tab audio using chrome.tabCapture",
  });

  return null;
}
