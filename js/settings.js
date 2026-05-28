/**
 * GoDeep – settings modal
 */
function initSettings() {
  const overlay = document.getElementById('settings-modal');
  const openBtn = document.getElementById('btn-settings');
  const closeBtn = document.getElementById('settings-close');
  const saveBtn = document.getElementById('settings-save');

  openBtn.addEventListener('click', () => openSettings(overlay));
  closeBtn.addEventListener('click', () => closeSettings(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSettings(overlay);
  });
  saveBtn.addEventListener('click', () => {
    saveSettingsFromForm();
    closeSettings(overlay);
    GoDeepTimer.reloadFromSettings();
    showToast('Einstellungen gespeichert.');
  });

  populateSettingsForm();
}

function openSettings(overlay) {
  populateSettingsForm();
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeSettings(overlay) {
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

function populateSettingsForm() {
  const s = GoDeepStorage.getSettings();
  document.getElementById('set-work').value = s.workMinutes;
  document.getElementById('set-short').value = s.shortBreakMinutes;
  document.getElementById('set-long').value = s.longBreakMinutes;
  document.getElementById('set-auto-break').checked = s.autoStartBreaks;
  document.getElementById('set-auto-work').checked = s.autoStartWork;
  document.getElementById('set-timer-sound').value = s.timerSound || 'standard';
  document.getElementById('set-use-mode').checked = s.useModeDuration;
  document.getElementById('set-schreiben').value = s.modeDurations.schreiben;
  document.getElementById('set-recherche').value = s.modeDurations.recherche;
  document.getElementById('set-ueberarbeitung').value = s.modeDurations.ueberarbeitung;
}

function saveSettingsFromForm() {
  const s = GoDeepStorage.getSettings();
  s.workMinutes = clampInt(document.getElementById('set-work').value, 1, 120, 25);
  s.shortBreakMinutes = clampInt(document.getElementById('set-short').value, 1, 30, 5);
  s.longBreakMinutes = clampInt(document.getElementById('set-long').value, 1, 60, 15);
  s.autoStartBreaks = document.getElementById('set-auto-break').checked;
  s.autoStartWork = document.getElementById('set-auto-work').checked;
  s.timerSound = document.getElementById('set-timer-sound').value === 'easy' ? 'easy' : 'standard';
  s.useModeDuration = document.getElementById('set-use-mode').checked;
  s.modeDurations = {
    schreiben: clampInt(document.getElementById('set-schreiben').value, 1, 120, 50),
    recherche: clampInt(document.getElementById('set-recherche').value, 1, 120, 25),
    ueberarbeitung: clampInt(document.getElementById('set-ueberarbeitung').value, 1, 120, 40),
  };
  GoDeepStorage.saveSettings(s);
}

function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

window.GoDeepSettings = { initSettings };
