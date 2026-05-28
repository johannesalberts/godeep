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

document.addEventListener('DOMContentLoaded', () => {
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
