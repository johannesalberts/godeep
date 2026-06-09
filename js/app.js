/**
 * GoDeep – main entry
 */
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('toast--show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('toast--show'), 2800);
}

window.showToast = showToast;

function initConfirmModal() {
  const overlay = document.getElementById('confirm-modal');
  const cancelBtn = document.getElementById('confirm-cancel');
  const okBtn = document.getElementById('confirm-ok');
  if (!overlay || !cancelBtn || !okBtn) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) finishConfirm(false);
  });
  cancelBtn.addEventListener('click', () => finishConfirm(false));
  okBtn.addEventListener('click', () => finishConfirm(true));
}

let confirmResolver = null;

function finishConfirm(result) {
  const overlay = document.getElementById('confirm-modal');
  overlay?.classList.remove('modal-overlay--open');
  overlay?.setAttribute('aria-hidden', 'true');
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(result);
  }
}

function showConfirm({ title, message, confirmLabel = 'Bestätigen' }) {
  const overlay = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const messageEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok');
  if (!overlay || !titleEl || !messageEl || !okBtn) return Promise.resolve(false);

  titleEl.textContent = title;
  messageEl.textContent = message;
  okBtn.textContent = confirmLabel;

  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

window.showConfirm = showConfirm;

document.addEventListener('DOMContentLoaded', () => {
  initConfirmModal();
  GoDeepMidnight.checkMidnightReset();
  GoDeepMidnight.startMidnightWatcher();

  GoDeepTimer.initTimer();
  GoDeepWorkspace.initWorkspace();
  GoDeepStats.initStats();
  GoDeepInsights.initInsightsModal();
  GoDeepHistory.initHistoryModal();
  GoDeepSessionWizard.initSessionWizard();
  GoDeepSettings.initSettings();
  GoDeepTheme.initTheme();
  GoDeepAbout.initAboutModal();
  GoDeepDuration.initDurationModal();

  requestNotificationPermission();

  const today = GoDeepStorage.todayDateStr();
  const log = GoDeepStorage.getTodayLog();
  if (!log.date || log.date !== today) {
    GoDeepStorage.saveTodayLog({ date: today, sessions: log.sessions || [] });
  }
});

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
