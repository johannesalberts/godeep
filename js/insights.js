/**
 * GoDeep – Statistik & Export Modal
 */
function initInsightsModal() {
  const overlay = document.getElementById('insights-modal');
  const openBtn = document.getElementById('btn-insights');
  const closeBtn = document.getElementById('insights-close');

  openBtn.addEventListener('click', () => openInsightsModal(overlay));
  closeBtn.addEventListener('click', () => closeInsightsModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeInsightsModal(overlay);
  });
}

function openInsightsModal(overlay) {
  if (window.GoDeepStats) GoDeepStats.refresh();
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeInsightsModal(overlay) {
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

window.GoDeepInsights = { initInsightsModal, openInsightsModal };
