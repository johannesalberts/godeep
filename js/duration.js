/**
 * GoDeep – Fokusdauer-Modal (Presets + manuelle Eingabe)
 */
function initDurationModal() {
  const overlay = document.getElementById('duration-modal');
  const openBtn = document.getElementById('btn-duration');
  const closeBtn = document.getElementById('duration-close');
  const presetBtns = overlay.querySelectorAll('[data-preset]');
  const customInput = document.getElementById('duration-custom-min');
  const customApply = document.getElementById('duration-custom-apply');

  openBtn.addEventListener('click', openDurationModal);
  closeBtn.addEventListener('click', () => closeDurationModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDurationModal(overlay);
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset === '' ? null : btn.dataset.preset;
      applyDurationPreset(preset);
      closeDurationModal(overlay);
    });
  });

  customApply.addEventListener('click', () => {
    applyCustomDurationFromInput();
    closeDurationModal(overlay);
  });

  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustomDurationFromInput();
      closeDurationModal(overlay);
    }
  });
}

function openDurationModal() {
  if (window.GoDeepTimer?.isRunning?.()) {
    showToast('Timer zuerst pausieren.');
    return;
  }
  if (window.GoDeepTimer?.getTimerMode?.() !== 'work') {
    showToast('Dauer-Presets gelten für Fokusphasen.');
    return;
  }

  const overlay = document.getElementById('duration-modal');
  const settings = GoDeepStorage.getSettings();
  const modeMin = GoDeepTimer.getModeDefaultMinutes();
  const customInput = document.getElementById('duration-custom-min');
  const customBlock = document.getElementById('duration-custom-block');

  const modeLabel = document.getElementById('duration-mode-default-min');
  if (modeLabel) modeLabel.textContent = String(modeMin);

  if (customInput) {
    customInput.value = settings.customWorkMinutes ? String(settings.customWorkMinutes) : '';
  }

  overlay.querySelectorAll('[data-preset]').forEach((btn) => {
    const isModeDefault = btn.dataset.preset === '';
    const active = !settings.customWorkMinutes && (
      isModeDefault
        ? !settings.activePreset && settings.useModeDuration
        : settings.activePreset === btn.dataset.preset
    );
    btn.classList.toggle('duration-preset-btn--active', active);
  });

  if (customBlock) {
    customBlock.classList.toggle('duration-custom--active', !!settings.customWorkMinutes);
  }

  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeDurationModal(overlay) {
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

function applyDurationPreset(preset) {
  const settings = GoDeepStorage.getSettings();
  settings.customWorkMinutes = null;

  if (preset) {
    settings.activePreset = preset;
    settings.useModeDuration = false;
  } else {
    settings.activePreset = null;
    settings.useModeDuration = true;
  }

  GoDeepStorage.saveSettings(settings);
  GoDeepTimer.applyPresetFromSettings();
  showToast(
    preset
      ? `${GoDeepTimer.PRESETS[preset].label}: ${GoDeepTimer.PRESETS[preset].minutes} Min`
      : 'Modus-Standard übernommen'
  );
}

function applyCustomDurationFromInput() {
  const input = document.getElementById('duration-custom-min');
  const minutes = clampDurationMinutes(input?.value);

  if (minutes === null) {
    showToast('Bitte eine Dauer zwischen 1 und 180 Minuten eingeben.');
    return;
  }

  const settings = GoDeepStorage.getSettings();
  settings.customWorkMinutes = minutes;
  settings.activePreset = null;
  settings.useModeDuration = false;
  GoDeepStorage.saveSettings(settings);
  GoDeepTimer.applyPresetFromSettings();
  showToast(`Eigene Dauer: ${minutes} Min`);
}

function clampDurationMinutes(val) {
  const n = parseInt(val, 10);
  if (Number.isNaN(n) || n < 1 || n > 180) return null;
  return n;
}

window.GoDeepDuration = { initDurationModal };
