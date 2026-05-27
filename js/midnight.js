/**
 * Reset today's session log at calendar day change (local midnight).
 */
function checkMidnightReset() {
  const today = GoDeepStorage.todayDateStr();
  const log = GoDeepStorage.getTodayLog();

  if (log.date && log.date !== today) {
    archiveDayToWeekStats(log);
    GoDeepStorage.saveTodayLog({ date: today, sessions: [] });
    return true;
  }

  if (!log.date) {
    GoDeepStorage.saveTodayLog({ date: today, sessions: [] });
  }

  return false;
}

function archiveDayToWeekStats(log) {
  if (!log.sessions || log.sessions.length === 0) return;

  const stats = GoDeepStorage.getWeekStats();
  const date = log.date;
  let totalMinutes = 0;
  const modes = { schreiben: 0, recherche: 0, ueberarbeitung: 0 };

  log.sessions.forEach((s) => {
    totalMinutes += s.minutes || 0;
    if (modes[s.workMode] !== undefined) modes[s.workMode] += s.minutes || 0;
  });

  stats[date] = {
    sessions: log.sessions.length,
    minutes: totalMinutes,
    modes,
  };

  const keys = Object.keys(stats).sort();
  if (keys.length > 14) {
    keys.slice(0, keys.length - 14).forEach((k) => delete stats[k]);
  }

  GoDeepStorage.saveWeekStats(stats);
}

function startMidnightWatcher() {
  checkMidnightReset();

  setInterval(() => {
    const reset = checkMidnightReset();
    if (reset && window.GoDeepStats) {
      GoDeepStats.refresh();
      GoDeepStats.renderTodaySessions();
    }
  }, 60_000);
}

window.GoDeepMidnight = { checkMidnightReset, startMidnightWatcher };
