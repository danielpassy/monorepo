const ROOT_ID = "therapist-capture-root";
const runtimeApi = globalThis.chrome?.runtime ?? globalThis.browser?.runtime ?? null;

function ensureButton() {
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.style.position = "fixed";
  root.style.right = "20px";
  root.style.bottom = "20px";
  root.style.zIndex = "2147483647";
  root.style.fontFamily = "sans-serif";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Iniciar captura";
  button.style.background = "#111";
  button.style.color = "#fff";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.padding = "12px 16px";
  button.style.fontSize = "14px";
  button.style.fontWeight = "600";
  button.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.2)";
  button.style.cursor = "pointer";

  const hint = document.createElement("div");
  hint.textContent = "Abre a captura da sessao com compartilhamento de audio.";
  hint.style.marginTop = "8px";
  hint.style.maxWidth = "220px";
  hint.style.padding = "10px 12px";
  hint.style.borderRadius = "12px";
  hint.style.background = "rgba(17, 17, 17, 0.92)";
  hint.style.color = "#fff";
  hint.style.fontSize = "12px";
  hint.style.lineHeight = "1.4";

  button.addEventListener("click", async () => {
    if (!runtimeApi?.sendMessage) {
      console.error("runtime da extensao indisponivel no Meet");
      hint.textContent = "A extensao nao conseguiu falar com o background. Recarregue a extensao.";
      return;
    }

    button.disabled = true;
    button.textContent = "Abrindo...";

    try {
      const response = await runtimeApi.sendMessage({
        type: "session:open-page",
        target: "background",
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? "falha ao abrir captura");
      }

      button.textContent = "Captura aberta";
      hint.textContent = "Volte ao Meet e escolha esta aba com audio no seletor do navegador.";
    } catch (error) {
      console.error("falha ao abrir captura no Meet", error);
      hint.textContent = "Falha ao abrir a captura. Recarregue a extensao e tente novamente.";
      button.disabled = false;
      button.textContent = "Iniciar captura";
    }
  });

  root.appendChild(button);
  root.appendChild(hint);
  document.documentElement.appendChild(root);
}

ensureButton();

const observer = new MutationObserver(() => {
  ensureButton();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
