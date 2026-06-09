/**
 * GoDeep – focus mode (timer only, hide workspace)
 */
const FOCUS_MODE_KEY = 'godeep_focus_mode';

function initFocusMode() {
  const btn = document.getElementById('btn-focus-mode');
  if (!btn) return;

  btn.addEventListener('click', () => toggleFocusMode());

  if (localStorage.getItem(FOCUS_MODE_KEY) === '1') {
    setFocusMode(true, { silent: true });
  }
}

function isFocusMode() {
  return document.body.classList.contains('focus-mode');
}

function toggleFocusMode() {
  setFocusMode(!isFocusMode());
}

function setFocusMode(enabled, options = {}) {
  const { silent = false } = options;
  const btn = document.getElementById('btn-focus-mode');

  document.body.classList.toggle('focus-mode', enabled);
  localStorage.setItem(FOCUS_MODE_KEY, enabled ? '1' : '0');

  if (btn) {
    btn.classList.toggle('btn-fab--focus-active', enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      enabled ? 'Fokusmodus beenden' : 'Fokusmodus – nur Timer anzeigen'
    );
  }

  if (!silent) {
    showToast(enabled ? 'Fokusmodus aktiv – nur Timer.' : 'Fokusmodus beendet.');
  }
}

window.GoDeepFocusMode = {
  initFocusMode,
  toggleFocusMode,
  isFocusMode,
};
