/**
 * GoDeep – compact sticky timer on mobile when scrolling
 */
function initMobileTimerCompact() {
  const timerCol = document.querySelector('.timer-col');
  if (!timerCol) return;

  const mq = window.matchMedia('(max-width: 900px)');
  let ticking = false;

  function update() {
    ticking = false;
    if (!mq.matches) {
      timerCol.classList.remove('timer-col--compact');
      return;
    }
    timerCol.classList.toggle('timer-col--compact', window.scrollY > 56);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  mq.addEventListener('change', update);
  update();
}

window.GoDeepMobileTimer = { initMobileTimerCompact };
