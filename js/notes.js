/**
 * GoDeep – multi-note workspace (simple / overview / detail)
 */
let notesUi = {
  mode: 'simple',
  stackView: 'overview',
  activeNoteId: null,
};

function initNotes() {
  migrateWorkspaceNotes();

  const simpleInput = document.getElementById('notes-input-simple');
  const detailInput = document.getElementById('notes-input-detail');

  simpleInput?.addEventListener('input', debounce(() => {
    syncSimpleNoteFromInput();
    updateNotesHeaderActions();
  }, 300));

  detailInput?.addEventListener('input', debounce(() => {
    saveActiveDetailNote();
  }, 300));

  document.getElementById('notes-add')?.addEventListener('click', addAnotherNote);
  document.getElementById('notes-back')?.addEventListener('click', showNotesOverview);
  document.getElementById('notes-clear')?.addEventListener('click', handleNotesClear);

  renderNotes();
}

function migrateWorkspaceNotes() {
  const ws = GoDeepStorage.getWorkspace();
  if (Array.isArray(ws.notes)) return;

  if (typeof ws.notes === 'string' && ws.notes.trim()) {
    ws.notes = [
      {
        id: GoDeepStorage.uid(),
        text: ws.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  } else {
    ws.notes = [];
  }

  GoDeepStorage.saveWorkspace(ws);
}

function getWorkspaceNotes() {
  migrateWorkspaceNotes();
  return GoDeepStorage.getWorkspace().notes || [];
}

function saveWorkspaceNotes(notes) {
  const ws = GoDeepStorage.getWorkspace();
  ws.notes = notes;
  GoDeepStorage.saveWorkspace(ws);
}

function syncSimpleNoteFromInput() {
  const input = document.getElementById('notes-input-simple');
  if (!input) return;

  const text = input.value;
  const notes = getWorkspaceNotes();

  if (!text && notes.length === 0) return;

  if (notes.length === 0) {
    notes.push(createNote(text));
  } else {
    notes[0].text = text;
    notes[0].updatedAt = new Date().toISOString();
  }

  saveWorkspaceNotes(notes);
}

function createNote(text = '') {
  const now = new Date().toISOString();
  return {
    id: GoDeepStorage.uid(),
    text,
    createdAt: now,
    updatedAt: now,
  };
}

function addAnotherNote() {
  const notes = getWorkspaceNotes();

  if (notesUi.mode === 'simple') {
    syncSimpleNoteFromInput();
    const refreshed = getWorkspaceNotes();
    const next = createNote('');
    refreshed.push(next);
    saveWorkspaceNotes(refreshed);
    notesUi.mode = 'stack';
    notesUi.stackView = 'detail';
    notesUi.activeNoteId = next.id;
    renderNotes();
    document.getElementById('notes-input-detail')?.focus();
    return;
  }

  const next = createNote('');
  notes.push(next);
  saveWorkspaceNotes(notes);
  notesUi.stackView = 'detail';
  notesUi.activeNoteId = next.id;
  renderNotes();
  document.getElementById('notes-input-detail')?.focus();
}

function showNotesOverview() {
  saveActiveDetailNote();
  notesUi.stackView = 'overview';
  notesUi.activeNoteId = null;
  renderNotes();
}

function showNotesDetail(noteId) {
  saveActiveDetailNote();
  notesUi.stackView = 'detail';
  notesUi.activeNoteId = noteId;
  renderNotes();
  document.getElementById('notes-input-detail')?.focus();
}

function saveActiveDetailNote() {
  if (notesUi.stackView !== 'detail' || !notesUi.activeNoteId) return;

  const input = document.getElementById('notes-input-detail');
  if (!input) return;

  const notes = getWorkspaceNotes();
  const note = notes.find((n) => n.id === notesUi.activeNoteId);
  if (!note) return;

  note.text = input.value;
  note.updatedAt = new Date().toISOString();
  saveWorkspaceNotes(notes);
}

async function handleNotesClear() {
  if (notesUi.mode === 'simple') {
    const input = document.getElementById('notes-input-simple');
    if (!input?.value.trim() && getWorkspaceNotes().length === 0) return;

    const ok = await showConfirm({
      title: 'Notiz leeren?',
      message: 'Der Inhalt der Notiz wird unwiderruflich gelöscht.',
      confirmLabel: 'Leeren',
    });
    if (!ok) return;

    saveWorkspaceNotes([]);
    input.value = '';
    updateNotesHeaderActions();
    return;
  }

  if (notesUi.stackView === 'detail') {
    const ok = await showConfirm({
      title: 'Notiz löschen?',
      message: 'Diese Notiz wird unwiderruflich gelöscht.',
      confirmLabel: 'Löschen',
    });
    if (!ok) return;

    saveActiveDetailNote();
    let notes = getWorkspaceNotes().filter((n) => n.id !== notesUi.activeNoteId);

    if (notes.length <= 1) {
      notesUi.mode = 'simple';
      notesUi.stackView = 'overview';
      notesUi.activeNoteId = null;
      saveWorkspaceNotes(notes);
      renderNotes();
      return;
    }

    notesUi.stackView = 'overview';
    notesUi.activeNoteId = null;
    saveWorkspaceNotes(notes);
    renderNotes();
    return;
  }

  const ok = await showConfirm({
    title: 'Alle Notizen leeren?',
    message: 'Alle Notizen werden unwiderruflich gelöscht. Es bleibt ein leeres Freitextfeld.',
    confirmLabel: 'Alle leeren',
  });
  if (!ok) return;

  notesUi.mode = 'simple';
  notesUi.stackView = 'overview';
  notesUi.activeNoteId = null;
  saveWorkspaceNotes([]);
  renderNotes();
}

function renderNotes() {
  migrateWorkspaceNotes();
  const notes = getWorkspaceNotes();

  if (notes.length <= 1) {
    notesUi.mode = 'simple';
    notesUi.stackView = 'overview';
    notesUi.activeNoteId = null;
  } else if (notesUi.mode !== 'stack') {
    notesUi.mode = 'stack';
    notesUi.stackView = 'overview';
    notesUi.activeNoteId = null;
  }

  const simplePanel = document.getElementById('notes-panel-simple');
  const stackPanel = document.getElementById('notes-panel-stack');
  const simpleInput = document.getElementById('notes-input-simple');
  const detailInput = document.getElementById('notes-input-detail');
  const views = document.getElementById('notes-views');

  if (notesUi.mode === 'simple') {
    simplePanel?.classList.remove('hidden');
    stackPanel?.classList.add('hidden');
    if (simpleInput) simpleInput.value = notes[0]?.text || '';
  } else {
    simplePanel?.classList.add('hidden');
    stackPanel?.classList.remove('hidden');
    views?.classList.toggle('notes-views--detail', notesUi.stackView === 'detail');

    if (notesUi.stackView === 'detail' && notesUi.activeNoteId) {
      const note = notes.find((n) => n.id === notesUi.activeNoteId);
      if (detailInput) detailInput.value = note?.text || '';
    }

    renderNotesList(notes);
  }

  updateNotesHeaderActions();
}

function renderNotesList(notes) {
  const list = document.getElementById('notes-list');
  if (!list) return;

  if (!notes.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = notes
    .map((note) => {
      const excerpt = noteExcerpt(note.text);
      const time = formatShortDate(note.updatedAt || note.createdAt);
      return `<li>
        <button type="button" class="notes-item item" data-note-id="${note.id}">
          <div class="item__body">
            <div class="item__text">${escapeHtml(excerpt)}</div>
            <div class="item__meta">${escapeHtml(time)}</div>
          </div>
        </button>
      </li>`;
    })
    .join('');

  list.querySelectorAll('[data-note-id]').forEach((btn) => {
    btn.addEventListener('click', () => showNotesDetail(btn.getAttribute('data-note-id')));
  });
}

function updateNotesHeaderActions() {
  const addBtn = document.getElementById('notes-add');
  const backBtn = document.getElementById('notes-back');
  const clearBtn = document.getElementById('notes-clear');
  const simpleInput = document.getElementById('notes-input-simple');

  if (!addBtn || !backBtn || !clearBtn) return;

  if (notesUi.mode === 'simple') {
    backBtn.classList.add('hidden');
    addBtn.classList.toggle('hidden', !simpleInput?.value.trim());
    clearBtn.textContent = 'Leeren';
    return;
  }

  if (notesUi.stackView === 'detail') {
    backBtn.classList.remove('hidden');
    addBtn.classList.add('hidden');
    clearBtn.textContent = 'Löschen';
    return;
  }

  backBtn.classList.add('hidden');
  addBtn.classList.remove('hidden');
  clearBtn.textContent = 'Leeren';
}

function noteExcerpt(text) {
  const normalized = (text || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Leere Notiz';
  if (normalized.length <= 120) return normalized;
  return `${normalized.slice(0, 117)}…`;
}

function getNotesForSnapshot() {
  return getWorkspaceNotes().map((note) => ({
    text: note.text || '',
    createdAt: note.createdAt || null,
    updatedAt: note.updatedAt || null,
  }));
}

function formatNotesForDisplay(notesData) {
  if (Array.isArray(notesData)) {
    const items = notesData.filter((n) => (n?.text || '').trim());
    if (!items.length) return '(leer)';
    return items.map((n, i) => `Notiz ${i + 1}:\n${n.text}`).join('\n\n');
  }

  if (typeof notesData === 'string' && notesData.trim()) return notesData;
  return '(leer)';
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

window.GoDeepNotes = {
  initNotes,
  renderNotes,
  getNotesForSnapshot,
  formatNotesForDisplay,
};
