/**
 * GoDeep – Neue Session Wizard
 */
const WIZARD_STEPS = ['ziel', 'quellen', 'modus', 'review'];

const WIZARD_STEP_DESC = [
  'Lege dein Ziel für diese Fokusphase fest.',
  'Wähle Quellen, die du in dieser Session nutzen willst.',
  'Arbeitsmodus und Fokusdauer für den Timer festlegen.',
  'Alles prüfen – dann startet der erste Fokusblock.',
];

let wizardState = {
  step: 0,
  selectedSourceIds: new Set(),
  newSources: [],
  workMode: 'schreiben',
  durationType: 'mode',
  durationPreset: 'focus',
  durationCustom: '',
};

function initSessionWizard() {
  const openBtn = document.getElementById('btn-new-session');
  const overlay = document.getElementById('session-wizard-modal');
  const closeBtn = document.getElementById('wizard-close');
  const backBtn = document.getElementById('wizard-back');
  const nextBtn = document.getElementById('wizard-next');
  const startBtn = document.getElementById('wizard-start');

  openBtn.addEventListener('click', openSessionWizard);
  closeBtn.addEventListener('click', closeSessionWizard);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSessionWizard();
  });
  backBtn.addEventListener('click', goWizardStepBack);
  nextBtn.addEventListener('click', goWizardStepNext);
  startBtn.addEventListener('click', startWizardSession);

  bindWizardInputs();
}

function bindWizardInputs() {
  document.querySelectorAll('[data-wizard-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      wizardState.workMode = btn.dataset.wizardMode;
      renderWizardModeButtons();
      updateWizardModeDurationLabel();
      renderWizardDurationCards();
      renderWizardSummary();
    });
  });

  document.querySelectorAll('.wizard-duration-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wizard-duration-custom-input')) return;
      wizardState.durationType = card.dataset.wizardDurationType;
      if (card.dataset.wizardPreset) {
        wizardState.durationPreset = card.dataset.wizardPreset;
      }
      renderWizardDurationCards();
      renderWizardSummary();
      if (wizardState.durationType === 'custom') {
        document.getElementById('wizard-duration-custom').focus();
      }
    });
  });

  const customInput = document.getElementById('wizard-duration-custom');
  customInput.addEventListener('focus', () => {
    wizardState.durationType = 'custom';
    renderWizardDurationCards();
  });
  customInput.addEventListener('input', () => {
    wizardState.durationCustom = customInput.value;
    wizardState.durationType = 'custom';
    renderWizardDurationCards();
    renderWizardSummary();
  });

  const goalInput = document.getElementById('wizard-goal');
  goalInput.addEventListener('input', renderWizardSummary);

  document.getElementById('wizard-goal-clear').addEventListener('click', () => {
    goalInput.value = '';
    goalInput.focus();
    renderWizardSummary();
  });

  const sourceInput = document.getElementById('wizard-source-input');
  const sourceAddBtn = document.getElementById('wizard-source-add');

  sourceAddBtn.addEventListener('click', addWizardNewSource);
  sourceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWizardNewSource();
    }
  });

  document.getElementById('wizard-sources-clear').addEventListener('click', clearWizardSourceSelection);
}

function addWizardNewSource() {
  const input = document.getElementById('wizard-source-input');
  const text = input.value.trim();
  if (!text) return;

  const exists =
    wizardState.newSources.some((s) => s.toLowerCase() === text.toLowerCase()) ||
    GoDeepStorage.getWorkspace().sources.some((s) => s.text.toLowerCase() === text.toLowerCase());

  if (exists) {
    showToast('Diese Quelle ist bereits vorhanden.');
    return;
  }

  wizardState.newSources.push(text);
  input.value = '';
  renderWizardNewSources();
  renderWizardSummary();
  input.focus();
}

function removeWizardNewSource(index) {
  wizardState.newSources.splice(index, 1);
  renderWizardNewSources();
  renderWizardSummary();
}

function clearWizardSourceSelection() {
  wizardState.selectedSourceIds.clear();
  document.querySelectorAll('[data-wizard-source-id]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  renderWizardSummary();
}

function openSessionWizard() {
  if (GoDeepTimer.isRunning()) {
    showToast('Timer läuft bereits. Erst pausieren oder stoppen.');
    return;
  }

  const settings = GoDeepStorage.getSettings();
  const ws = GoDeepStorage.getWorkspace();

  wizardState = {
    step: 0,
    selectedSourceIds: new Set(),
    newSources: [],
    workMode: settings.workMode || 'schreiben',
    durationType: settings.customWorkMinutes ? 'custom' : settings.activePreset ? 'preset' : 'mode',
    durationPreset: settings.activePreset || 'focus',
    durationCustom: settings.customWorkMinutes ? String(settings.customWorkMinutes) : '',
  };

  document.getElementById('wizard-goal').value = ws.goal || '';
  document.getElementById('wizard-source-input').value = '';
  document.getElementById('wizard-duration-custom').value = wizardState.durationCustom;
  renderLastReviewHint();

  renderWizardSourceChoices();
  renderWizardNewSources();
  renderWizardModeButtons();
  updateWizardModeDurationLabel();
  renderWizardDurationCards();
  renderWizardSummary();
  renderWizardStep();

  const overlay = document.getElementById('session-wizard-modal');
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeSessionWizard() {
  const overlay = document.getElementById('session-wizard-modal');
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

function renderWizardSourceChoices() {
  const container = document.getElementById('wizard-existing-sources');
  const clearBtn = document.getElementById('wizard-sources-clear');
  const ws = GoDeepStorage.getWorkspace();

  if (!ws.sources.length) {
    container.innerHTML = '<p class="wizard-muted">Noch keine gespeicherten Quellen – unten neue eintragen.</p>';
    clearBtn.classList.add('hidden');
    return;
  }

  clearBtn.classList.remove('hidden');

  container.innerHTML = ws.sources
    .map(
      (s) => `
      <label class="wizard-source-chip">
        <input type="checkbox" data-wizard-source-id="${s.id}"${wizardState.selectedSourceIds.has(s.id) ? ' checked' : ''}>
        <span class="wizard-source-chip__text">${escapeHtml(s.text)}</span>
      </label>
    `
    )
    .join('');

  container.querySelectorAll('[data-wizard-source-id]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const id = checkbox.getAttribute('data-wizard-source-id');
      if (checkbox.checked) wizardState.selectedSourceIds.add(id);
      else wizardState.selectedSourceIds.delete(id);
      renderWizardSummary();
    });
  });
}

function renderLastReviewHint() {
  const hintEl = document.getElementById('wizard-last-stuck-hint');
  if (!hintEl) return;

  const history = GoDeepStorage.getSessionHistory();
  const sessions = [...(history.sessions || [])].sort((a, b) => {
    return new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime();
  });

  let lastStuck = '';
  for (const s of sessions) {
    const text = s?.snapshot?.review?.stuck?.trim();
    if (text) {
      lastStuck = text;
      break;
    }
  }

  if (!lastStuck) {
    const ws = GoDeepStorage.getWorkspace();
    lastStuck = ws.lastReviewStuck?.trim() || ws.review?.stuck?.trim() || '';
  }

  if (!lastStuck) {
    hintEl.textContent = '';
    hintEl.classList.add('hidden');
    return;
  }

  hintEl.textContent = `Letzter Anknüpfungspunkt: ${lastStuck}`;
  hintEl.classList.remove('hidden');
}

function renderWizardNewSources() {
  const list = document.getElementById('wizard-new-source-list');

  if (!wizardState.newSources.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = wizardState.newSources
    .map(
      (text, index) => `
      <li class="item">
        <div class="item__body">
          <div class="item__text">${escapeHtml(text)}</div>
        </div>
        <button type="button" class="item__delete" data-wizard-new-source="${index}" aria-label="Quelle entfernen">×</button>
      </li>
    `
    )
    .join('');

  list.querySelectorAll('[data-wizard-new-source]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeWizardNewSource(Number(btn.dataset.wizardNewSource));
    });
  });
}

function renderWizardModeButtons() {
  document.querySelectorAll('[data-wizard-mode]').forEach((btn) => {
    btn.classList.toggle('wizard-mode-card--active', btn.dataset.wizardMode === wizardState.workMode);
  });
}

function updateWizardModeDurationLabel() {
  const settings = GoDeepStorage.getSettings();
  const mins = settings.modeDurations?.[wizardState.workMode] ?? 25;
  const label = document.getElementById('wizard-mode-duration-label');
  if (label) label.textContent = `${mins} Min`;

  document.querySelectorAll('[data-wizard-mode-meta]').forEach((el) => {
    const mode = el.getAttribute('data-wizard-mode-meta');
    const m = settings.modeDurations?.[mode] ?? 25;
    el.textContent = `${m} Min Standard`;
  });
}

function renderWizardDurationCards() {
  document.querySelectorAll('.wizard-duration-card').forEach((card) => {
    const type = card.dataset.wizardDurationType;
    let active = wizardState.durationType === type;
    if (type === 'preset' && active) {
      active = card.dataset.wizardPreset === wizardState.durationPreset;
    }
    card.classList.toggle('wizard-duration-card--active', active);
  });

  const customRow = document.getElementById('wizard-custom-row');
  if (customRow) {
    customRow.classList.toggle('hidden', wizardState.durationType !== 'custom');
  }
}

function renderWizardSummary() {
  const goal = document.getElementById('wizard-goal').value.trim() || '—';
  const existingCount = wizardState.selectedSourceIds.size;
  const newCount = wizardState.newSources.length;
  const totalSources = existingCount + newCount;
  const modeLabel = GoDeepTimer.WORK_MODE_LABELS[wizardState.workMode] || 'Schreiben';

  let durationLabel = 'Modus-Standard';
  if (wizardState.durationType === 'preset') {
    const preset = GoDeepTimer.PRESETS[wizardState.durationPreset];
    durationLabel = preset ? `${preset.label} · ${preset.minutes} Min` : 'Preset';
  } else if (wizardState.durationType === 'custom') {
    const val = document.getElementById('wizard-duration-custom').value;
    durationLabel = val ? `${val} Min` : 'Eigene Dauer';
  } else {
    const settings = GoDeepStorage.getSettings();
    const mins = settings.modeDurations?.[wizardState.workMode] ?? 25;
    durationLabel = `Modus-Standard · ${mins} Min`;
  }

  document.getElementById('wizard-summary-goal').textContent = goal;
  document.getElementById('wizard-summary-sources').textContent =
    totalSources === 0 ? 'Keine ausgewählt' : `${totalSources} Quelle${totalSources === 1 ? '' : 'n'}`;
  document.getElementById('wizard-summary-mode').textContent = modeLabel;
  document.getElementById('wizard-summary-duration').textContent = durationLabel;
}

function renderWizardStep() {
  WIZARD_STEPS.forEach((name, idx) => {
    const panel = document.querySelector(`[data-wizard-panel="${name}"]`);
    panel.classList.toggle('hidden', idx !== wizardState.step);
  });

  const desc = document.getElementById('wizard-step-desc');
  if (desc) desc.textContent = WIZARD_STEP_DESC[wizardState.step] || '';

  document.querySelectorAll('.wizard-progress__step').forEach((el, idx) => {
    el.classList.toggle('is-active', idx === wizardState.step);
    el.classList.toggle('is-done', idx < wizardState.step);
  });

  const lines = document.querySelectorAll('.wizard-progress__line');
  lines.forEach((line, idx) => {
    line.classList.toggle('is-done', idx < wizardState.step);
  });

  document.getElementById('wizard-back').classList.toggle('hidden', wizardState.step === 0);
  document.getElementById('wizard-next').classList.toggle('hidden', wizardState.step >= WIZARD_STEPS.length - 1);
  document.getElementById('wizard-start').classList.toggle('hidden', wizardState.step !== WIZARD_STEPS.length - 1);
}

function goWizardStepBack() {
  wizardState.step = Math.max(0, wizardState.step - 1);
  renderWizardStep();
}

function goWizardStepNext() {
  wizardState.step = Math.min(WIZARD_STEPS.length - 1, wizardState.step + 1);
  renderWizardStep();
}

function startWizardSession() {
  const durationCustom = parseInt(document.getElementById('wizard-duration-custom').value, 10);
  if (wizardState.durationType === 'custom' && (!Number.isInteger(durationCustom) || durationCustom < 1 || durationCustom > 180)) {
    showToast('Bitte eine gültige Dauer zwischen 1 und 180 Minuten eingeben.');
    return;
  }

  GoDeepWorkspace.applySessionContext({
    goal: document.getElementById('wizard-goal').value,
    selectedSourceIds: [...wizardState.selectedSourceIds],
    newSources: [...wizardState.newSources],
  });

  const ok = GoDeepTimer.startSessionFromWizard({
    workMode: wizardState.workMode,
    durationType: wizardState.durationType,
    durationPreset: wizardState.durationPreset,
    durationCustom,
  });

  if (!ok) return;

  closeSessionWizard();
  showToast('Session gestartet.');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.GoDeepSessionWizard = { initSessionWizard };
