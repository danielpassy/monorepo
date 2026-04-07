const tabWarning = document.getElementById("tab-warning");
const startSessionButton = document.getElementById("start-session");

function isCapturableTab(tab) {
  if (!tab?.id || !tab.url) return false;

  return tab.url.startsWith("https://meet.google.com/");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function loadActiveTab() {
  const tab = await getActiveTab();

  if (!isCapturableTab(tab)) {
    startSessionButton.disabled = true;
    tabWarning.textContent =
      "Voce deve iniciar a extensao dentro de uma chamada ativa no Google Meet.";
    return;
  }

  startSessionButton.disabled = false;
  tabWarning.textContent =
    "Ao iniciar, o navegador vai pedir permissao para compartilhar a aba do Meet com audio.";
}

startSessionButton.addEventListener("click", async () => {
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

void loadActiveTab();
