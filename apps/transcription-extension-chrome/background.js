console.log("extensao de audio carregada");

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

    if (message.type === "session:check-source-tab") {
      const tabId = Number(message.tabId);
      if (!Number.isFinite(tabId)) {
        throw new Error("tabId invalido");
      }

      try {
        await chrome.tabs.get(tabId);
        sendResponse?.({ ok: true, exists: true });
      } catch {
        sendResponse?.({ ok: true, exists: false });
      }
      return;
    }
  })().catch((error) => {
    console.error("erro no listener de mensagem", error);
    sendResponse?.({ ok: false, error: String(error) });
  });

  return true;
});
