/**
 * GoDeep – about modal
 */
function initAboutModal() {
  const overlay = document.getElementById('about-modal');
  const openBtn = document.getElementById('btn-about');
  const closeBtn = document.getElementById('about-close');
  if (!overlay || !openBtn || !closeBtn) return;

  openBtn.addEventListener('click', () => openAboutModal(overlay));
  closeBtn.addEventListener('click', () => closeAboutModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAboutModal(overlay);
  });
}

function openAboutModal(overlay) {
  overlay.classList.add('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeAboutModal(overlay) {
  overlay.classList.remove('modal-overlay--open');
  overlay.setAttribute('aria-hidden', 'true');
}

window.GoDeepAbout = { initAboutModal };
