/**
 * GoDeep – export (single files + ZIP)
 */
function initExport() {
  document.getElementById('export-goal').addEventListener('click', () => exportSingle('ziel', buildGoalText()));
  document.getElementById('export-thoughts').addEventListener('click', () => exportSingle('gedankenparkplatz', buildThoughtsText()));
  document.getElementById('export-sources').addEventListener('click', () => exportSingle('quellen', buildSourcesText()));
  document.getElementById('export-review').addEventListener('click', () => exportSingle('review', buildReviewText()));
  document.getElementById('export-sessions').addEventListener('click', () => exportSingle('sessions-heute', buildSessionsText()));
  document.getElementById('export-zip').addEventListener('click', exportZip);
}

function buildGoalText() {
  const ws = GoDeepStorage.getWorkspace();
  return `# Ziel\n\n${ws.goal || '(leer)'}\n\nExportiert: ${formatExportDate()}\n`;
}

function buildThoughtsText() {
  const ws = GoDeepStorage.getWorkspace();
  const lines = ws.thoughts.map((t) => `- [${t.done ? 'x' : ' '}] ${t.text}`);
  return `# Gedankenparkplatz\n\n${lines.length ? lines.join('\n') : '(leer)'}\n\nExportiert: ${formatExportDate()}\n`;
}

function buildSourcesText() {
  const ws = GoDeepStorage.getWorkspace();
  const lines = ws.sources.map((s) => `- ${s.text} (${formatShort(s.createdAt)})`);
  return `# Quellen / Fundstellen\n\n${lines.length ? lines.join('\n') : '(leer)'}\n\nExportiert: ${formatExportDate()}\n`;
}

function buildReviewText() {
  const ws = GoDeepStorage.getWorkspace();
  return `# Review\n\n## Geschafft\n${ws.review?.done || '(leer)'}\n\n## Hängt geblieben\n${ws.review?.stuck || '(leer)'}\n\nExportiert: ${formatExportDate()}\n`;
}

function buildSessionsText() {
  const log = GoDeepStorage.getTodayLog();
  const lines = (log.sessions || []).map((s) => {
    const time = new Date(s.at).toLocaleString('de-DE');
    const mode = GoDeepTimer.WORK_MODE_LABELS[s.workMode] || s.workMode;
    return `- ${time} | ${s.minutes} Min | ${mode}${s.goal ? ` | ${s.goal}` : ''}`;
  });
  return `# Sessions heute (${log.date || GoDeepStorage.todayDateStr()})\n\n${lines.length ? lines.join('\n') : '(keine)'}\n\nExportiert: ${formatExportDate()}\n`;
}

function formatExportDate() {
  return new Date().toLocaleString('de-DE');
}

function formatShort(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('de-DE');
}

function exportSingle(name, content) {
  downloadBlob(`${name}-${dateStamp()}.md`, content, 'text/markdown;charset=utf-8');
  showToast(`${name} exportiert.`);
}

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function downloadBlob(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportZip() {
  if (typeof JSZip === 'undefined') {
    showToast('ZIP-Bibliothek nicht geladen.');
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder(`godeep-${dateStamp()}`);

  folder.file('ziel.md', buildGoalText());
  folder.file('gedankenparkplatz.md', buildThoughtsText());
  folder.file('quellen.md', buildSourcesText());
  folder.file('review.md', buildReviewText());
  folder.file('sessions-heute.md', buildSessionsText());

  const settings = GoDeepStorage.getSettings();
  folder.file('einstellungen.json', JSON.stringify(settings, null, 2));

  const log = GoDeepStorage.getTodayLog();
  folder.file('sessions-heute.json', JSON.stringify(log, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`godeep-export-${dateStamp()}.zip`, blob, 'application/zip');
  showToast('ZIP exportiert.');
}

window.GoDeepExport = { initExport };
