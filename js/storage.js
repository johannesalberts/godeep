/**
 * GoDeep – localStorage persistence
 */
const STORAGE_KEYS = {
  settings: 'godeep_settings',
  workspace: 'godeep_workspace',
  todayLog: 'godeep_todayLog',
  weekStats: 'godeep_weekStats',
  cycle: 'godeep_cycle',
  timer: 'godeep_timer',
  sessionHistory: 'godeep_session_history',
};

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartBreaks: false,
  autoStartWork: false,
  notifications: true,
  workMode: 'schreiben',
  modeDurations: {
    schreiben: 50,
    recherche: 25,
    ueberarbeitung: 40,
  },
  useModeDuration: true,
  activePreset: null,
  customWorkMinutes: null,
  timerSound: 'standard',
  theme: 'light',
};

const DEFAULT_WORKSPACE = {
  goal: '',
  thoughts: [],
  sources: [],
  notes: '',
  lastReviewStuck: '',
  review: { done: '', stuck: '' },
};

const DEFAULT_CYCLE = {
  completedInCycle: 0,
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(raw) };
  } catch {
    return structuredClone(fallback);
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getSettings() {
  return loadJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

function saveSettings(settings) {
  saveJSON(STORAGE_KEYS.settings, settings);
}

function getWorkspace() {
  return loadJSON(STORAGE_KEYS.workspace, DEFAULT_WORKSPACE);
}

function saveWorkspace(workspace) {
  saveJSON(STORAGE_KEYS.workspace, workspace);
}

function getTodayLog() {
  const data = loadJSON(STORAGE_KEYS.todayLog, { date: '', sessions: [] });
  return data;
}

function saveTodayLog(data) {
  saveJSON(STORAGE_KEYS.todayLog, data);
}

function getWeekStats() {
  return loadJSON(STORAGE_KEYS.weekStats, {});
}

function saveWeekStats(stats) {
  saveJSON(STORAGE_KEYS.weekStats, stats);
}

function getCycle() {
  return loadJSON(STORAGE_KEYS.cycle, DEFAULT_CYCLE);
}

function saveCycle(cycle) {
  saveJSON(STORAGE_KEYS.cycle, cycle);
}

function getTimerState() {
  const raw = localStorage.getItem(STORAGE_KEYS.timer);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveTimerState(data) {
  saveJSON(STORAGE_KEYS.timer, data);
}

function getSessionHistory() {
  const data = loadJSON(STORAGE_KEYS.sessionHistory, { sessions: [] });
  if (!Array.isArray(data.sessions)) data.sessions = [];
  return data;
}

function saveSessionHistory(data) {
  saveJSON(STORAGE_KEYS.sessionHistory, data);
}

function appendSessionHistory(sessionEntry) {
  const data = getSessionHistory();
  data.sessions.push(sessionEntry);
  saveSessionHistory(data);
}

function updateSessionReviewById(sessionId, review) {
  if (!sessionId) return false;
  const data = getSessionHistory();
  const entry = data.sessions.find((s) => s.id === sessionId);
  if (!entry) return false;

  entry.snapshot = entry.snapshot || {};
  entry.snapshot.review = {
    done: review?.done || '',
    stuck: review?.stuck || '',
  };
  saveSessionHistory(data);
  return true;
}

function updateLatestSessionReview(review) {
  const data = getSessionHistory();
  if (!data.sessions.length) return;

  let latestIdx = 0;
  let latestTs = new Date(data.sessions[0]?.endedAt || 0).getTime();
  for (let i = 1; i < data.sessions.length; i++) {
    const ts = new Date(data.sessions[i]?.endedAt || 0).getTime();
    if (ts > latestTs) {
      latestTs = ts;
      latestIdx = i;
    }
  }

  const entry = data.sessions[latestIdx];
  entry.snapshot = entry.snapshot || {};
  entry.snapshot.review = {
    done: review?.done || '',
    stuck: review?.stuck || '',
  };
  saveSessionHistory(data);
}

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

window.GoDeepStorage = {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  getWorkspace,
  saveWorkspace,
  getTodayLog,
  saveTodayLog,
  getWeekStats,
  saveWeekStats,
  getCycle,
  saveCycle,
  getTimerState,
  saveTimerState,
  getSessionHistory,
  saveSessionHistory,
  appendSessionHistory,
  updateSessionReviewById,
  updateLatestSessionReview,
  todayDateStr,
  uid,
};
