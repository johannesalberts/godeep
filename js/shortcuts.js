/**
 * GoDeep – keyboard shortcuts
 */
const SHORTCUTS = [
  { keys: 'Leertaste', action: 'Timer starten / pausieren' },
  { keys: 'N', action: 'Neue Session' },
  { keys: 'F', action: 'Fokusmodus ein / aus' },
  { keys: 'Esc', action: 'Dialog schließen' },
  { keys: '?', action: 'Shortcuts anzeigen' },
];

function initShortcuts() {
  bindShortcutsPopover();
  document.addEventListener('keydown', handleShortcutKeydown);
}

function bindShortcutsPopover() {
  const toggle = document.getElementById('btn-shortcuts-hint');
  const popover = document.getElementById('shortcuts-popover');
  if (!toggle || !popover) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleShortcutsPopover();
  });

  document.addEventListener('click', (e) => {
    if (!popover.classList.contains('shortcuts-popover--open')) return;
    if (popover.contains(e.target) || toggle.contains(e.target)) return;
    closeShortcutsPopover();
  });
}

function toggleShortcutsPopover() {
  const popover = document.getElementById('shortcuts-popover');
  if (!popover) return;
  if (popover.classList.contains('shortcuts-popover--open')) {
    closeShortcutsPopover();
  } else {
    openShortcutsPopover();
  }
}

function openShortcutsPopover() {
  const toggle = document.getElementById('btn-shortcuts-hint');
  const popover = document.getElementById('shortcuts-popover');
  const footer = document.getElementById('site-footer');
  if (!toggle || !popover) return;

  popover.classList.remove('hidden');
  popover.classList.add('shortcuts-popover--open');
  toggle.setAttribute('aria-expanded', 'true');
  footer?.classList.add('site-footer--shortcuts-open');
}

function closeShortcutsPopover() {
  const toggle = document.getElementById('btn-shortcuts-hint');
  const popover = document.getElementById('shortcuts-popover');
  const footer = document.getElementById('site-footer');
  if (!toggle || !popover) return;

  popover.classList.remove('shortcuts-popover--open');
  popover.classList.add('hidden');
  toggle.setAttribute('aria-expanded', 'false');
  footer?.classList.remove('site-footer--shortcuts-open');
}

function handleShortcutKeydown(e) {
  if (e.key === '?' && !isTypingContext()) {
    e.preventDefault();
    toggleShortcutsPopover();
    return;
  }

  if (e.key === 'Escape') {
    if (closeShortcutsPopoverIfOpen()) {
      e.preventDefault();
      return;
    }
    if (closeTopModal()) {
      e.preventDefault();
    }
    return;
  }

  if (isTypingContext()) return;

  if (e.code === 'Space') {
    e.preventDefault();
    GoDeepTimer.togglePlayPause();
    return;
  }

  if (e.key === 'n' || e.key === 'N') {
    if (hasOpenModal()) return;
    e.preventDefault();
    document.getElementById('btn-new-session')?.click();
    return;
  }

  if (e.key === 'f' || e.key === 'F') {
    if (hasOpenModal()) return;
    e.preventDefault();
    GoDeepFocusMode.toggleFocusMode();
  }
}

function isTypingContext() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!el.isContentEditable;
}

function hasOpenModal() {
  return !!document.querySelector('.modal-overlay--open');
}

function closeShortcutsPopoverIfOpen() {
  const popover = document.getElementById('shortcuts-popover');
  if (!popover?.classList.contains('shortcuts-popover--open')) return false;
  closeShortcutsPopover();
  return true;
}

function closeTopModal() {
  const overlay = document.querySelector('.modal-overlay--open');
  if (!overlay) return false;

  const id = overlay.id;
  const closers = {
    'session-wizard-modal': () => GoDeepSessionWizard.closeSessionWizard?.(),
    'history-modal': () => GoDeepHistory.closeHistoryModal?.(),
    'insights-modal': () => GoDeepInsights.closeInsightsModal?.(),
    'settings-modal': () => document.getElementById('settings-close')?.click(),
    'review-modal': () => document.getElementById('review-close')?.click(),
    'about-modal': () => document.getElementById('about-close')?.click(),
    'duration-modal': () => document.getElementById('duration-close')?.click(),
    'session-complete-modal': () => document.getElementById('session-complete-close')?.click(),
    'confirm-modal': () => document.getElementById('confirm-cancel')?.click(),
  };

  if (closers[id]) {
    closers[id]();
    return true;
  }

  const closeBtn = overlay.querySelector('.btn-text, .btn-primary[id$="-close"]');
  if (closeBtn) {
    closeBtn.click();
    return true;
  }

  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
  return true;
}

function renderShortcutsList() {
  const list = document.getElementById('shortcuts-list');
  if (!list) return;

  list.innerHTML = SHORTCUTS.map(
    (item) =>
      `<div class="shortcuts-popover__row"><kbd>${item.keys}</kbd><span>${item.action}</span></div>`
  ).join('');
}

window.GoDeepShortcuts = { initShortcuts, renderShortcutsList };
