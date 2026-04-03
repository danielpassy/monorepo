const activeTabTitle = document.getElementById("active-tab-title");
const activeTabUrl = document.getElementById("active-tab-url");
const tabWarning = document.getElementById("tab-warning");
const startSessionButton = document.getElementById("start-session");

function isCapturableTab(tab) {
  if (!tab?.id || !tab.url) return false;

  return !(
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:")
  );
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function loadActiveTab() {
  const tab = await getActiveTab();
  activeTabTitle.textContent = tab?.title ?? "aba nao encontrada";
  activeTabUrl.textContent = tab?.url ?? "";

  if (!isCapturableTab(tab)) {
    startSessionButton.disabled = true;
    tabWarning.textContent =
      "Abra o Meet ou outra pagina normal antes de iniciar. Este fluxo nao funciona em chrome:// nem na propria extensao.";
    return;
  }

  startSessionButton.disabled = false;
  tabWarning.textContent =
    "Ao iniciar, a extensao abre uma pagina de captura e o navegador pede para compartilhar a aba com audio.";
}

document.getElementById("start-session").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!isCapturableTab(tab)) {
    return;
  }

  await chrome.runtime.sendMessage({
    type: "session:open-page",
    target: "background",
    tabId: tab.id,
  });
  window.close();
});

document.getElementById("open-mic-page").addEventListener("click", async () => {
  await chrome.tabs.create({
    url: chrome.runtime.getURL("mic-test.html"),
  });
  window.close();
});

void loadActiveTab();
