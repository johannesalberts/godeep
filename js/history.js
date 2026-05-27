/**
 * GoDeep – Session history modal
 */
function initHistoryModal() {
  const openBtn = document.getElementById('btn-history');
  const overlay = document.getElementById('history-modal');
  const closeBtn = document.getElementById('history-close');

  if (!openBtn || !overlay || !closeBtn) return;

  openBtn.addEventListener('click', openHistoryModal);
  closeBtn.addEventListener('click', closeHistoryModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeHistoryModal();
  });
}

function openHistoryModal() {
  renderHistoryList();
  const overlay = document.getElementById('history-modal');
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeHistoryModal() {
  const overlay = document.getElementById('history-modal');
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  const data = GoDeepStorage.getSessionHistory();
  const sessions = [...(data.sessions || [])].sort((a, b) => {
    return new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime();
  });

  if (!sessions.length) {
    list.innerHTML = '<li class="history-empty">Noch keine gespeicherten Sessions.</li>';
    renderHistoryDetail(null);
    return;
  }

  list.innerHTML = sessions
    .map((s, idx) => {
      const end = formatDateTime(s.endedAt);
      const mode = GoDeepTimer.WORK_MODE_LABELS[s.workMode] || s.workMode || 'Fokus';
      return `<li>
        <button type="button" class="history-item${idx === 0 ? ' is-active' : ''}" data-history-id="${s.id}">
          <span class="history-item__top">${end}</span>
          <span class="history-item__meta">${s.minutes || 0} Min · ${escapeHtml(mode)}</span>
          <span class="history-item__goal">${escapeHtml(s.goal || 'Ohne Ziel')}</span>
        </button>
      </li>`;
    })
    .join('');

  list.querySelectorAll('[data-history-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-history-id');
      list.querySelectorAll('.history-item').forEach((el) => el.classList.remove('is-active'));
      btn.classList.add('is-active');
      const session = sessions.find((x) => x.id === id) || null;
      renderHistoryDetail(session);
    });
  });

  renderHistoryDetail(sessions[0]);
}

function renderHistoryDetail(session) {
  const detail = document.getElementById('history-detail');
  if (!session) {
    detail.innerHTML = '<p class="history-empty">Session auswählen, um Details zu sehen.</p>';
    return;
  }

  const snapshot = session.snapshot || {};
  const goal = snapshot.goal || '(leer)';
  const notes = snapshot.notes || '(leer)';
  const sources = snapshot.sources || [];
  const thoughts = snapshot.thoughts || [];
  const reviewDone = snapshot.review?.done || '(leer)';
  const reviewStuck = snapshot.review?.stuck || '(leer)';
  const mode = GoDeepTimer.WORK_MODE_LABELS[session.workMode] || session.workMode || 'Fokus';

  detail.innerHTML = `
    <div class="history-detail__head">
      <div>
        <h3>${escapeHtml(formatDateTime(session.endedAt))}</h3>
        <p>${session.minutes || 0} Min · ${escapeHtml(mode)}</p>
      </div>
      <div class="history-detail__actions">
        <button type="button" class="btn-ghost" id="history-export-session">Export</button>
        <button type="button" class="btn-text history-delete-btn" id="history-delete-session">Löschen</button>
      </div>
    </div>
    <div class="history-block">
      <h4>Ziel</h4>
      <p>${escapeHtml(goal)}</p>
    </div>
    <div class="history-block">
      <h4>Notizen</h4>
      <p>${escapeHtml(notes)}</p>
    </div>
    <div class="history-block">
      <h4>Quellen (${sources.length})</h4>
      ${sources.length ? `<ul>${sources.map((s) => `<li>${escapeHtml(s.text || '')}</li>`).join('')}</ul>` : '<p>(leer)</p>'}
    </div>
    <div class="history-block">
      <h4>Gedanken (${thoughts.length})</h4>
      ${thoughts.length ? `<ul>${thoughts.map((t) => `<li>${t.done ? '[x] ' : ''}${escapeHtml(t.text || '')}</li>`).join('')}</ul>` : '<p>(leer)</p>'}
    </div>
    <div class="history-block history-block--review">
      <div>
        <h4>Review · Geschafft</h4>
        <p>${escapeHtml(reviewDone)}</p>
      </div>
      <div>
        <h4>Review · Nächster Anknüpfungspunkt</h4>
        <p>${escapeHtml(reviewStuck)}</p>
      </div>
    </div>
  `;

  document.getElementById('history-export-session')?.addEventListener('click', () => {
    exportSessionEntry(session);
  });
  document.getElementById('history-delete-session')?.addEventListener('click', () => {
    deleteSessionEntry(session.id);
  });
}

function exportSessionEntry(session) {
  const snapshot = session.snapshot || {};
  const mode = GoDeepTimer.WORK_MODE_LABELS[session.workMode] || session.workMode || 'Fokus';
  const date = formatDateTime(session.endedAt);
  const linesSources = (snapshot.sources || []).map((s) => `- ${s.text || ''}`);
  const linesThoughts = (snapshot.thoughts || []).map((t) => `- [${t.done ? 'x' : ' '}] ${t.text || ''}`);

  const content = `# GoDeep Session\n\n` +
    `- Ende: ${date}\n` +
    `- Modus: ${mode}\n` +
    `- Dauer: ${session.minutes || 0} Min\n\n` +
    `## Ziel\n${snapshot.goal || '(leer)'}\n\n` +
    `## Notizen\n${snapshot.notes || '(leer)'}\n\n` +
    `## Quellen\n${linesSources.length ? linesSources.join('\n') : '(leer)'}\n\n` +
    `## Gedanken\n${linesThoughts.length ? linesThoughts.join('\n') : '(leer)'}\n\n` +
    `## Review\n` +
    `### Geschafft\n${snapshot.review?.done || '(leer)'}\n\n` +
    `### Nächster Anknüpfungspunkt\n${snapshot.review?.stuck || '(leer)'}\n`;

  const stamp = new Date(session.endedAt || Date.now());
  const file = `godeep-session-${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}.md`;
  downloadText(file, content);
  showToast('Session exportiert.');
}

function deleteSessionEntry(sessionId) {
  if (!sessionId) return;

  const history = GoDeepStorage.getSessionHistory();
  const before = history.sessions.length;
  history.sessions = history.sessions.filter((s) => s.id !== sessionId);
  if (history.sessions.length === before) return;
  GoDeepStorage.saveSessionHistory(history);

  const log = GoDeepStorage.getTodayLog();
  log.sessions = (log.sessions || []).filter((s) => s.id !== sessionId);
  GoDeepStorage.saveTodayLog(log);

  if (window.GoDeepStats?.refresh) GoDeepStats.refresh();
  renderHistoryList();
  showToast('Session gelöscht.');
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(iso) {
  if (!iso) return 'Unbekannt';
  return new Date(iso).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.GoDeepHistory = { initHistoryModal, openHistoryModal, closeHistoryModal };
