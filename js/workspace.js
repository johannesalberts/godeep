/**
 * GoDeep – Goal, Gedankenparkplatz, Quellen, Review
 */
let activeReviewSessionId = null;

function initWorkspace() {
  bindGoal();
  bindNotes();
  bindThoughts();
  bindSources();
  bindReview();
  renderAll();
}

function bindGoal() {
  const el = document.getElementById('goal-input');
  const clearBtn = document.getElementById('goal-clear');
  el.addEventListener('input', debounce(() => {
    const ws = GoDeepStorage.getWorkspace();
    ws.goal = el.value;
    GoDeepStorage.saveWorkspace(ws);
  }, 300));

  clearBtn.addEventListener('click', () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.goal = '';
    GoDeepStorage.saveWorkspace(ws);
    el.value = '';
  });
}

function bindNotes() {
  const el = document.getElementById('notes-input');
  const clearBtn = document.getElementById('notes-clear');
  el.addEventListener('input', debounce(() => {
    const ws = GoDeepStorage.getWorkspace();
    ws.notes = el.value;
    GoDeepStorage.saveWorkspace(ws);
  }, 300));

  clearBtn.addEventListener('click', () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.notes = '';
    GoDeepStorage.saveWorkspace(ws);
    el.value = '';
  });
}

function bindThoughts() {
  const input = document.getElementById('thought-input');
  const addBtn = document.getElementById('thought-add');
  const clearBtn = document.getElementById('thought-clear');

  const add = () => {
    const text = input.value.trim();
    if (!text) return;
    const ws = GoDeepStorage.getWorkspace();
    ws.thoughts.push({ id: GoDeepStorage.uid(), text, done: false, createdAt: new Date().toISOString() });
    GoDeepStorage.saveWorkspace(ws);
    input.value = '';
    renderThoughts();
  };

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  });
  clearBtn.addEventListener('click', () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.thoughts = [];
    GoDeepStorage.saveWorkspace(ws);
    input.value = '';
    renderThoughts();
  });
}

function bindSources() {
  const input = document.getElementById('source-input');
  const addBtn = document.getElementById('source-add');
  const clearBtn = document.getElementById('source-clear');

  const add = () => {
    const text = input.value.trim();
    if (!text) return;
    const ws = GoDeepStorage.getWorkspace();
    ws.sources.push({ id: GoDeepStorage.uid(), text, createdAt: new Date().toISOString() });
    GoDeepStorage.saveWorkspace(ws);
    input.value = '';
    renderSources();
  };

  addBtn.addEventListener('click', add);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  });
  clearBtn.addEventListener('click', () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.sources = [];
    GoDeepStorage.saveWorkspace(ws);
    input.value = '';
    renderSources();
  });
}

function bindReview() {
  const overlay = document.getElementById('review-modal');
  const closeBtn = document.getElementById('review-close');
  const saveBtn = document.getElementById('review-save');
  const doneEl = document.getElementById('review-done');
  const stuckEl = document.getElementById('review-stuck');
  const clearBtn = document.getElementById('review-clear');

  const save = () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.review = { done: doneEl.value, stuck: stuckEl.value };
    if (stuckEl.value.trim()) ws.lastReviewStuck = stuckEl.value.trim();
    GoDeepStorage.saveWorkspace(ws);
    if (activeReviewSessionId && GoDeepStorage.updateSessionReviewById) {
      GoDeepStorage.updateSessionReviewById(activeReviewSessionId, ws.review);
    } else if (GoDeepStorage.updateLatestSessionReview) {
      GoDeepStorage.updateLatestSessionReview(ws.review);
    }
  };

  const saveDebounced = debounce(save, 300);

  doneEl.addEventListener('input', saveDebounced);
  stuckEl.addEventListener('input', saveDebounced);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeReviewModal();
  });
  closeBtn.addEventListener('click', closeReviewModal);
  saveBtn.addEventListener('click', () => {
    save();
    closeReviewModal();
    showToast('Review gespeichert.');
  });
  clearBtn.addEventListener('click', () => {
    const ws = GoDeepStorage.getWorkspace();
    ws.review = { done: '', stuck: '' };
    GoDeepStorage.saveWorkspace(ws);
    if (activeReviewSessionId && GoDeepStorage.updateSessionReviewById) {
      GoDeepStorage.updateSessionReviewById(activeReviewSessionId, ws.review);
    } else if (GoDeepStorage.updateLatestSessionReview) {
      GoDeepStorage.updateLatestSessionReview(ws.review);
    }
    doneEl.value = '';
    stuckEl.value = '';
    showToast('Review geleert.');
  });
}

function renderAll() {
  const ws = GoDeepStorage.getWorkspace();
  document.getElementById('goal-input').value = ws.goal || '';
  document.getElementById('notes-input').value = ws.notes || '';
  document.getElementById('review-done').value = ws.review?.done || '';
  document.getElementById('review-stuck').value = ws.review?.stuck || '';
  renderThoughts();
  renderSources();
}

function renderThoughts() {
  const list = document.getElementById('thought-list');
  const ws = GoDeepStorage.getWorkspace();
  const open = ws.thoughts.filter((t) => !t.done);
  const done = ws.thoughts.filter((t) => t.done);

  if (ws.thoughts.length === 0) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = [...open, ...done].map((t) => thoughtItemHTML(t)).join('');
  list.querySelectorAll('[data-thought-toggle]').forEach((el) => {
    el.addEventListener('click', () => toggleThought(el.dataset.id));
  });
  list.querySelectorAll('[data-thought-delete]').forEach((el) => {
    el.addEventListener('click', () => deleteThought(el.dataset.id));
  });
}

function thoughtItemHTML(t) {
  const done = t.done ? ' item--done' : '';
  const checkOn = t.done ? ' item__check--on' : '';
  const checkIcon = t.done
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'
    : '';
  return `<li class="item${done}" data-id="${t.id}">
    <div class="item__check${checkOn}" data-thought-toggle data-id="${t.id}" role="button" tabindex="0">${checkIcon}</div>
    <div class="item__body"><div class="item__text">${escapeHtml(t.text)}</div></div>
    <button class="item__delete" data-thought-delete data-id="${t.id}" aria-label="Löschen">×</button>
  </li>`;
}

function toggleThought(id) {
  const ws = GoDeepStorage.getWorkspace();
  const t = ws.thoughts.find((x) => x.id === id);
  if (t) {
    t.done = !t.done;
    GoDeepStorage.saveWorkspace(ws);
    renderThoughts();
  }
}

function deleteThought(id) {
  const ws = GoDeepStorage.getWorkspace();
  ws.thoughts = ws.thoughts.filter((x) => x.id !== id);
  GoDeepStorage.saveWorkspace(ws);
  renderThoughts();
}

function renderSources() {
  const list = document.getElementById('source-list');
  const ws = GoDeepStorage.getWorkspace();

  if (ws.sources.length === 0) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = ws.sources
    .map((s) => {
      const time = formatShortDate(s.createdAt);
      return `<li class="item" data-id="${s.id}">
        <div class="item__body">
          <div class="item__text">${escapeHtml(s.text)}</div>
          <div class="item__meta">${time}</div>
        </div>
        <button class="item__delete" data-source-delete data-id="${s.id}" aria-label="Löschen">×</button>
      </li>`;
    })
    .join('');

  list.querySelectorAll('[data-source-delete]').forEach((el) => {
    el.addEventListener('click', () => deleteSource(el.dataset.id));
  });
}

function deleteSource(id) {
  const ws = GoDeepStorage.getWorkspace();
  ws.sources = ws.sources.filter((x) => x.id !== id);
  GoDeepStorage.saveWorkspace(ws);
  renderSources();
}

function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getWorkspaceExportText() {
  const ws = GoDeepStorage.getWorkspace();
  return { ws };
}

function applySessionContext({ goal, selectedSourceIds = [], newSources = [] }) {
  const ws = GoDeepStorage.getWorkspace();

  if (typeof goal === 'string') {
    ws.goal = goal.trim();
  }

  const selectedSet = new Set(selectedSourceIds);
  const selectedExisting = ws.sources.filter((s) => selectedSet.has(s.id));

  const normalizedNew = newSources
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .map((text) => ({
      id: GoDeepStorage.uid(),
      text,
      createdAt: new Date().toISOString(),
    }));

  const dedupMap = new Map();
  [...selectedExisting, ...normalizedNew].forEach((entry) => {
    const key = entry.text.toLowerCase();
    if (!dedupMap.has(key)) dedupMap.set(key, entry);
  });

  if (dedupMap.size > 0) {
    const existingRemaining = ws.sources.filter((s) => !selectedSet.has(s.id));
    ws.sources = [...dedupMap.values(), ...existingRemaining];
  }

  GoDeepStorage.saveWorkspace(ws);
  renderAll();
}

function openReviewModal(sessionId = null) {
  const overlay = document.getElementById('review-modal');
  if (!overlay) return;
  activeReviewSessionId = sessionId;

  const ws = GoDeepStorage.getWorkspace();
  document.getElementById('review-done').value = ws.review?.done || '';
  document.getElementById('review-stuck').value = ws.review?.stuck || '';

  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('review-done').focus();
}

function closeReviewModal() {
  const overlay = document.getElementById('review-modal');
  if (!overlay) return;
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
  activeReviewSessionId = null;
}

function resetReviewForNewSession() {
  const ws = GoDeepStorage.getWorkspace();
  ws.review = { done: '', stuck: '' };
  GoDeepStorage.saveWorkspace(ws);

  const doneEl = document.getElementById('review-done');
  const stuckEl = document.getElementById('review-stuck');
  if (doneEl) doneEl.value = '';
  if (stuckEl) stuckEl.value = '';
}

window.GoDeepWorkspace = {
  initWorkspace,
  renderAll,
  getWorkspaceExportText,
  applySessionContext,
  openReviewModal,
  resetReviewForNewSession,
};
