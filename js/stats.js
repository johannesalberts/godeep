/**
 * GoDeep – minimal statistics
 */
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function initStats() {
  refresh();
  renderTodaySessions();
}

function refresh() {
  GoDeepMidnight.checkMidnightReset();
  const log = GoDeepStorage.getTodayLog();
  const sessions = log.sessions || [];

  let minutesToday = 0;
  const modeMinutes = { schreiben: 0, recherche: 0, ueberarbeitung: 0 };

  sessions.forEach((s) => {
    minutesToday += s.minutes || 0;
    if (modeMinutes[s.workMode] !== undefined) {
      modeMinutes[s.workMode] += s.minutes || 0;
    }
  });

  document.getElementById('stat-minutes').textContent = minutesToday;
  document.getElementById('stat-sessions').textContent = sessions.length;

  const totalMode = modeMinutes.schreiben + modeMinutes.recherche + modeMinutes.ueberarbeitung;
  const pct = (m) => (totalMode > 0 ? Math.round((modeMinutes[m] / totalMode) * 100) : 0);

  document.getElementById('chip-schreiben').innerHTML = `Schreiben <strong>${pct('schreiben')}%</strong>`;
  document.getElementById('chip-recherche').innerHTML = `Recherche <strong>${pct('recherche')}%</strong>`;
  document.getElementById('chip-ueberarbeitung').innerHTML = `Überarbeitung <strong>${pct('ueberarbeitung')}%</strong>`;

  document.getElementById('stat-streak').textContent = calcLongestStreak();

  renderWeekChart();
  renderTodaySessions();
}

function calcLongestStreak() {
  const week = GoDeepStorage.getWeekStats();
  const today = GoDeepStorage.todayDateStr();
  const log = GoDeepStorage.getTodayLog();

  const daysWithWork = new Set();
  Object.entries(week).forEach(([date, data]) => {
    if (data.minutes > 0) daysWithWork.add(date);
  });
  if ((log.sessions || []).length > 0) daysWithWork.add(today);

  const sorted = [...daysWithWork].sort();
  if (sorted.length === 0) return '0';

  let max = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }

  return String(max);
}

function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ dateStr, label: DAY_NAMES[i] });
  }
  return days;
}

function renderWeekChart() {
  const container = document.getElementById('week-chart');
  const weekDays = getWeekDays();
  const weekStats = GoDeepStorage.getWeekStats();
  const today = GoDeepStorage.todayDateStr();
  const log = GoDeepStorage.getTodayLog();

  const values = weekDays.map((d) => {
    if (d.dateStr === today) {
      return (log.sessions || []).reduce((sum, s) => sum + (s.minutes || 0), 0);
    }
    return weekStats[d.dateStr]?.minutes || 0;
  });

  const max = Math.max(...values, 1);

  container.innerHTML = weekDays
    .map((d, i) => {
      const h = Math.max(2, (values[i] / max) * 100);
      return `<div class="week-bar-wrap">
        <div class="week-bar" style="height:${h}%" title="${values[i]} Min"></div>
        <span class="week-bar__label">${d.label}</span>
      </div>`;
    })
    .join('');
}

function renderTodaySessions() {
  const list = document.getElementById('today-sessions-list');
  const log = GoDeepStorage.getTodayLog();
  const sessions = [...(log.sessions || [])].reverse();

  if (sessions.length === 0) {
    list.innerHTML = '<li>Noch keine Sessions heute.</li>';
    return;
  }

  list.innerHTML = sessions
    .map((s) => {
      const time = new Date(s.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const mode = GoDeepTimer.WORK_MODE_LABELS[s.workMode] || s.workMode;
      const goal = s.goal ? ` – ${s.goal.slice(0, 40)}${s.goal.length > 40 ? '…' : ''}` : '';
      const interruptCount = s.interruptionCount ?? s.interruptions?.count ?? 0;
      const interruptSeconds = s.interruptionSeconds ?? s.interruptions?.totalSeconds ?? 0;
      const interruptMeta =
        interruptCount > 0
          ? ` · ${interruptCount} Unterbr. (${formatInterruptDuration(interruptSeconds)})`
          : '';
      return `<li class="session-row" data-session-id="${s.id}">
        <span class="session-row__text">${time} · ${s.minutes} Min · ${mode}${interruptMeta}${goal}</span>
      </li>`;
    })
    .join('');
}

function formatInterruptDuration(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

window.GoDeepStats = { initStats, refresh, renderTodaySessions };
