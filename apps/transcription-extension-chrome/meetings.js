const list = document.getElementById("list");

render();

async function render() {
  const { transcripts = [] } = await chrome.storage.local.get(["transcripts"]);

  if (!transcripts.length) {
    list.innerHTML = "<p>No transcripts saved yet.</p>";
    return;
  }

  list.innerHTML = transcripts
    .map(
      (item) => `
        <article class="item">
          <h2>${escapeHtml(item.title || "Untitled transcript")}</h2>
          <div class="meta">${escapeHtml(item.createdAt || "")} · ${escapeHtml(item.source || "")}</div>
          <pre>${escapeHtml(item.text || "")}</pre>
        </article>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

