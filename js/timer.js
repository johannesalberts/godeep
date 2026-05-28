/**
 * GoDeep – Pomodoro timer (4-cycle, editable durations)
 */
const TIMER_MODES = {
  work: 'work',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
};

const WORK_MODE_LABELS = {
  schreiben: 'Schreiben',
  recherche: 'Recherche',
  ueberarbeitung: 'Überarbeitung',
};

const PRESETS = {
  quick: { label: 'Quick', minutes: 25 },
  focus: { label: 'Focus', minutes: 50 },
  deep: { label: 'Deep Work', minutes: 90 },
};

let state = {
  timerId: null,
  endTime: null,
  timeLeft: 0,
  isRunning: false,
  timerMode: TIMER_MODES.work,
  totalSeconds: 0,
};

let els = {};
let pendingReviewSessionId = null;
let audioCtx = null;
let completing = false;
let baseDocumentTitle = 'GoDeep';
let titleBlinkId = null;

function initTimer() {
  baseDocumentTitle = document.title || 'GoDeep';
  els = {
    minutes: document.getElementById('timer-minutes'),
    seconds: document.getElementById('timer-seconds'),
    label: document.getElementById('timer-mode-label'),
    ringFg: document.getElementById('timer-ring-fg'),
    startBtn: document.getElementById('btn-start'),
    pauseBtn: document.getElementById('btn-pause'),
    resetBtn: document.getElementById('btn-reset'),
    cycleText: document.getElementById('cycle-text'),
    modePills: document.querySelectorAll('[data-timer-mode]'),
    workModePills: document.querySelectorAll('[data-work-mode]'),
  };

  els.startBtn.addEventListener('click', startTimer);
  els.pauseBtn.addEventListener('click', pauseTimer);
  els.resetBtn.addEventListener('click', resetTimer);
  bindSessionCompleteModal();

  els.modePills.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.isRunning) {
        showToast('Timer zuerst pausieren.');
        return;
      }
      setTimerMode(btn.dataset.timerMode);
    });
  });

  els.workModePills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const settings = GoDeepStorage.getSettings();
      settings.workMode = btn.dataset.workMode;
      settings.activePreset = null;
      settings.customWorkMinutes = null;
      settings.useModeDuration = true;
      GoDeepStorage.saveSettings(settings);
      updateWorkModeUI(settings.workMode);
      if (state.timerMode === TIMER_MODES.work && !state.isRunning) {
        applyWorkDuration();
        resetTimer();
      }
    });
  });

  const settings = GoDeepStorage.getSettings();
  applyTimerSoundFromSettings(settings);
  updateWorkModeUI(settings.workMode);
  updateCycleDisplay();
  restoreTimerState();

  window.addEventListener('pagehide', saveTimerState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveTimerState();
      return;
    }
    stopTitleBlink();
    syncTimerFromClock();
  });
  window.addEventListener('focus', syncTimerFromClock);
}

function bindSessionCompleteModal() {
  const overlay = document.getElementById('session-complete-modal');
  const closeBtn = document.getElementById('session-complete-close');
  const reviewBtn = document.getElementById('session-complete-review');
  if (!overlay || !closeBtn || !reviewBtn) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSessionCompleteModal();
  });
  closeBtn.addEventListener('click', closeSessionCompleteModal);
  reviewBtn.addEventListener('click', () => {
    const sessionId = pendingReviewSessionId;
    closeSessionCompleteModal();
    if (window.GoDeepWorkspace?.openReviewModal) {
      window.GoDeepWorkspace.openReviewModal(sessionId);
    }
  });
}

function openSessionCompleteModal(sessionId) {
  pendingReviewSessionId = sessionId || null;
  const overlay = document.getElementById('session-complete-modal');
  if (!overlay) return;
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeSessionCompleteModal() {
  const overlay = document.getElementById('session-complete-modal');
  if (!overlay) return;
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
  pendingReviewSessionId = null;
}

function getWorkMinutes() {
  const s = GoDeepStorage.getSettings();
  if (s.customWorkMinutes) {
    return s.customWorkMinutes;
  }
  if (s.activePreset && PRESETS[s.activePreset]) {
    return PRESETS[s.activePreset].minutes;
  }
  if (s.useModeDuration && s.modeDurations[s.workMode]) {
    return s.modeDurations[s.workMode];
  }
  return s.workMinutes;
}

function getModeMinutes(mode) {
  const s = GoDeepStorage.getSettings();
  switch (mode) {
    case TIMER_MODES.shortBreak:
      return s.shortBreakMinutes;
    case TIMER_MODES.longBreak:
      return s.longBreakMinutes;
    default:
      return getWorkMinutes();
  }
}

function applyWorkDuration() {
  if (state.timerMode !== TIMER_MODES.work) return;
  const mins = getWorkMinutes();
  state.totalSeconds = mins * 60;
  state.timeLeft = state.totalSeconds;
  updateDisplay();
}

function setTimerMode(mode, options = {}) {
  const { resetTime = true } = options;
  state.timerMode = mode;
  syncTimerModeUI(mode);

  const mins = getModeMinutes(mode);
  state.totalSeconds = mins * 60;
  if (resetTime) {
    state.timeLeft = state.totalSeconds;
  }
  updateDisplay();
  updateProgress();
  saveTimerState();
}

function syncTimerModeUI(mode) {
  els.modePills.forEach((btn) => {
    btn.classList.toggle('pill--active', btn.dataset.timerMode === mode);
  });

  const labels = {
    work: getWorkModeLabel(),
    shortBreak: 'Kurze Pause',
    longBreak: 'Lange Pause',
  };
  els.label.textContent = labels[mode] || 'Fokus';

  const durationHint = document.querySelector('.timer-duration-hint');
  if (durationHint) {
    durationHint.classList.toggle('hidden', mode !== TIMER_MODES.work);
  }
}

function getWorkModeLabel() {
  const s = GoDeepStorage.getSettings();
  return WORK_MODE_LABELS[s.workMode] || 'Fokus';
}

function updateWorkModeUI(mode) {
  els.workModePills.forEach((btn) => {
    btn.classList.toggle('pill--active', btn.dataset.workMode === mode);
  });
  if (state.timerMode === TIMER_MODES.work) {
    els.label.textContent = WORK_MODE_LABELS[mode] || 'Fokus';
  }
}

function getModeDefaultMinutes() {
  const s = GoDeepStorage.getSettings();
  if (s.modeDurations[s.workMode]) return s.modeDurations[s.workMode];
  return s.workMinutes;
}

function applyPresetFromSettings() {
  if (state.timerMode !== TIMER_MODES.work || state.isRunning) return;
  applyWorkDuration();
  resetTimer();
}

function updateCycleDisplay() {
  const cycle = GoDeepStorage.getCycle();
  const n = cycle.completedInCycle;
  els.cycleText.textContent = `Fokusblock ${Math.min(n + 1, 4)} / 4`;
}

function startTimer() {
  if (state.isRunning) return;

  completing = false;
  stopTitleBlink();
  unlockAudio();
  ensureNotificationPermission();

  const startsFreshWorkSession =
    state.timerMode === TIMER_MODES.work &&
    state.totalSeconds > 0 &&
    state.timeLeft === state.totalSeconds;
  if (startsFreshWorkSession && window.GoDeepWorkspace?.resetReviewForNewSession) {
    window.GoDeepWorkspace.resetReviewForNewSession();
  }

  state.isRunning = true;
  els.startBtn.classList.add('hidden');
  els.pauseBtn.classList.remove('hidden');

  state.endTime = Date.now() + state.timeLeft * 1000;
  saveTimerState();

  updateRunningTitle();
  state.timerId = setInterval(syncTimerFromClock, 200);
}

function syncTimerFromClock() {
  if (!state.isRunning || !state.endTime) return;

  const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
  state.timeLeft = remaining;
  updateDisplay();
  updateProgress();
  updateRunningTitle();

  if (remaining <= 0) {
    onTimerComplete();
  }
}

function pauseTimer() {
  if (!state.isRunning) return;
  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
  state.endTime = null;
  els.startBtn.classList.remove('hidden');
  els.pauseBtn.classList.add('hidden');
  restoreDocumentTitle();
  saveTimerState();
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = state.totalSeconds;
  updateDisplay();
  updateProgress();
  saveTimerState();
}

function saveTimerState() {
  GoDeepStorage.saveTimerState({
    timerMode: state.timerMode,
    timeLeft: state.timeLeft,
    totalSeconds: state.totalSeconds,
    isRunning: state.isRunning,
    endTime: state.isRunning ? state.endTime : null,
  });
}

function restoreTimerState() {
  const saved = GoDeepStorage.getTimerState();
  const validModes = Object.values(TIMER_MODES);

  if (!saved || !validModes.includes(saved.timerMode)) {
    setTimerMode(TIMER_MODES.work);
    return;
  }

  state.timerMode = saved.timerMode;
  state.totalSeconds = saved.totalSeconds || getModeMinutes(saved.timerMode) * 60;
  syncTimerModeUI(saved.timerMode);

  if (saved.isRunning && saved.endTime) {
    const remaining = Math.max(0, Math.round((saved.endTime - Date.now()) / 1000));
    state.timeLeft = remaining;
    updateDisplay();
    updateProgress();

    if (remaining <= 0) {
      onTimerComplete();
      return;
    }

    startTimer();
    return;
  }

  state.timeLeft = Math.min(
    Math.max(0, saved.timeLeft ?? state.totalSeconds),
    state.totalSeconds
  );
  updateDisplay();
  updateProgress();
  saveTimerState();
}

function updateDisplay() {
  const m = Math.floor(state.timeLeft / 60);
  const s = state.timeLeft % 60;
  els.minutes.textContent = String(m).padStart(2, '0');
  els.seconds.textContent = String(s).padStart(2, '0');
}

function formatTimeLeftTitle() {
  const m = Math.floor(state.timeLeft / 60);
  const s = state.timeLeft % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateRunningTitle() {
  if (titleBlinkId || !state.isRunning) return;
  document.title = `${formatTimeLeftTitle()} · ${baseDocumentTitle}`;
}

function signalTitleComplete() {
  const message =
    state.timerMode === TIMER_MODES.work ? 'Fokusblock fertig!' : 'Pause beendet!';
  const alertTitle = `✓ ${message} · ${baseDocumentTitle}`;
  document.title = alertTitle;
  startTitleBlink(alertTitle);
}

function startTitleBlink(alertTitle) {
  stopTitleBlink();
  if (!document.hidden) return;

  let showAlert = true;
  titleBlinkId = setInterval(() => {
    showAlert = !showAlert;
    document.title = showAlert ? alertTitle : baseDocumentTitle;
  }, 1200);
}

function stopTitleBlink() {
  if (!titleBlinkId) return;
  clearInterval(titleBlinkId);
  titleBlinkId = null;
}

function restoreDocumentTitle() {
  stopTitleBlink();
  document.title = baseDocumentTitle;
}

function updateProgress() {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const progress = state.totalSeconds > 0 ? (state.totalSeconds - state.timeLeft) / state.totalSeconds : 0;
  const offset = circumference * (1 - progress);
  els.ringFg.style.strokeDasharray = `${circumference}`;
  els.ringFg.style.strokeDashoffset = `${offset}`;
}

function onTimerComplete() {
  if (completing) return;
  completing = true;

  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
  state.endTime = null;
  els.startBtn.classList.remove('hidden');
  els.pauseBtn.classList.add('hidden');
  playCompleteSound();
  notifyComplete();
  signalTitleComplete();

  const settings = GoDeepStorage.getSettings();
  let cycle = GoDeepStorage.getCycle();

  if (state.timerMode === TIMER_MODES.work) {
    const completedSessionId = logWorkSession();
    cycle.completedInCycle = Math.min(4, cycle.completedInCycle + 1);
    GoDeepStorage.saveCycle(cycle);
    updateCycleDisplay();

    if (window.GoDeepStats) GoDeepStats.refresh();

    const isLongBreak = cycle.completedInCycle >= 4;
    if (isLongBreak) {
      cycle.completedInCycle = 0;
      GoDeepStorage.saveCycle(cycle);
      updateCycleDisplay();
      setTimerMode(TIMER_MODES.longBreak);
      showToast('4 Zyklen geschafft – lange Pause.');
    } else {
      setTimerMode(TIMER_MODES.shortBreak);
      showToast('Arbeitsblock abgeschlossen – kurze Pause.');
    }

    if (settings.autoStartBreaks) setTimeout(() => startTimer(), 800);
    setTimeout(() => openSessionCompleteModal(completedSessionId), 180);
  } else {
    setTimerMode(TIMER_MODES.work);
    applyWorkDuration();
    showToast('Pause beendet – weiter geht\'s.');
    if (settings.autoStartWork) setTimeout(() => startTimer(), 800);
  }

  saveTimerState();
}

function logWorkSession() {
  const settings = GoDeepStorage.getSettings();
  const minutes = getWorkMinutes();
  const log = GoDeepStorage.getTodayLog();
  const today = GoDeepStorage.todayDateStr();

  if (log.date !== today) {
    GoDeepMidnight.checkMidnightReset();
  }

  const freshLog = GoDeepStorage.getTodayLog();
  const ws = GoDeepStorage.getWorkspace();
  const endedAt = new Date().toISOString();
  const sessionEntry = {
    id: GoDeepStorage.uid(),
    endedAt,
    workMode: settings.workMode,
    minutes,
    preset: settings.activePreset,
    durationType: settings.customWorkMinutes ? 'custom' : settings.activePreset ? 'preset' : 'mode',
    goal: ws.goal ? ws.goal.slice(0, 120) : '',
    snapshot: {
      goal: ws.goal || '',
      notes: ws.notes || '',
      sources: (ws.sources || []).map((s) => ({ text: s.text, createdAt: s.createdAt || null })),
      thoughts: (ws.thoughts || []).map((t) => ({ text: t.text, done: !!t.done, createdAt: t.createdAt || null })),
      review: {
        done: ws.review?.done || '',
        stuck: ws.review?.stuck || '',
      },
    },
  };

  freshLog.sessions.push({
    id: sessionEntry.id,
    at: endedAt,
    workMode: sessionEntry.workMode,
    minutes: sessionEntry.minutes,
    preset: sessionEntry.preset,
    goal: sessionEntry.goal,
  });

  GoDeepStorage.saveTodayLog(freshLog);
  GoDeepStorage.appendSessionHistory(sessionEntry);
  return sessionEntry.id;
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

async function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const audio = document.getElementById('timer-complete');
    if (!audio) return;

    applyTimerSoundFromSettings();
    const prevVolume = audio.volume;
    audio.volume = 0.001;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = prevVolume;
  } catch (_) {
    /* ignore – browser may block until explicit user gesture */
  }
}

function playCompleteSound() {
  const audio = document.getElementById('timer-complete');
  applyTimerSoundFromSettings();

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (audio && audio.src) {
    audio.currentTime = 0;
    audio.play().catch(beep);
  } else {
    beep();
  }
}

function applyTimerSoundFromSettings(settingsArg) {
  const settings = settingsArg || GoDeepStorage.getSettings();
  const audio = document.getElementById('timer-complete');
  if (!audio) return;

  const file = settings.timerSound === 'easy' ? 'assets/timer-easy.mp3' : 'assets/timer-standard.mp3';
  const current = audio.getAttribute('src');
  if (current !== file) {
    audio.setAttribute('src', file);
    audio.load();
  }
}

function beep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 520;
    g.gain.value = 0.08;
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch (_) { /* ignore */ }
}

function ensureNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function notifyComplete() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title =
    state.timerMode === TIMER_MODES.work
      ? 'GoDeep – Arbeitsblock fertig'
      : 'GoDeep – Pause beendet';
  new Notification(title, { body: 'Zeit für den nächsten Schritt.' });
}

function reloadFromSettings() {
  const settings = GoDeepStorage.getSettings();
  applyTimerSoundFromSettings(settings);
  updateWorkModeUI(settings.workMode);
  if (!state.isRunning) {
    if (state.timerMode === TIMER_MODES.work) applyWorkDuration();
    else {
      const mins = getModeMinutes(state.timerMode);
      state.totalSeconds = mins * 60;
      state.timeLeft = state.totalSeconds;
    }
    updateDisplay();
    updateProgress();
    saveTimerState();
  }
}

function startSessionFromWizard(config) {
  if (state.isRunning) {
    showToast('Timer läuft bereits.');
    return false;
  }

  const settings = GoDeepStorage.getSettings();

  if (config?.workMode && WORK_MODE_LABELS[config.workMode]) {
    settings.workMode = config.workMode;
  }

  if (config?.durationType === 'preset' && PRESETS[config.durationPreset]) {
    settings.activePreset = config.durationPreset;
    settings.customWorkMinutes = null;
    settings.useModeDuration = false;
  } else if (config?.durationType === 'custom' && Number.isInteger(config.durationCustom)) {
    settings.customWorkMinutes = Math.min(180, Math.max(1, config.durationCustom));
    settings.activePreset = null;
    settings.useModeDuration = false;
  } else {
    settings.activePreset = null;
    settings.customWorkMinutes = null;
    settings.useModeDuration = true;
  }

  GoDeepStorage.saveSettings(settings);
  updateWorkModeUI(settings.workMode);
  setTimerMode(TIMER_MODES.work, { resetTime: true });
  startTimer();
  return true;
}

window.GoDeepTimer = {
  initTimer,
  reloadFromSettings,
  applyPresetFromSettings,
  startSessionFromWizard,
  PRESETS,
  WORK_MODE_LABELS,
  getWorkMinutes,
  getModeDefaultMinutes,
  isRunning: () => state.isRunning,
  getTimerMode: () => state.timerMode,
};
