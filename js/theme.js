/**
 * GoDeep – light/dark mode toggle
 */
function initTheme() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;

  applyThemeFromSettings();
  btn.addEventListener('click', toggleTheme);
}

function applyThemeFromSettings() {
  const s = GoDeepStorage.getSettings();
  const theme = s.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeLogo(theme);
  updateThemeButton(theme);
}

function toggleTheme() {
  const s = GoDeepStorage.getSettings();
  const next = s.theme === 'dark' ? 'light' : 'dark';
  s.theme = next;
  GoDeepStorage.saveSettings(s);
  applyThemeFromSettings();
}

function updateThemeButton(theme) {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;

  if (theme === 'dark') {
    btn.setAttribute('aria-label', 'Light Mode aktivieren');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  } else {
    btn.setAttribute('aria-label', 'Dark Mode aktivieren');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/></svg>';
  }
}

function updateThemeLogo(theme) {
  const logo = document.querySelector('.logo__img');
  if (!logo) return;
  logo.setAttribute('src', theme === 'dark' ? 'css/godeep_logo_dark.svg' : 'css/godeep_logo.svg');
}

window.GoDeepTheme = { initTheme, applyThemeFromSettings };
