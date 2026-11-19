export function playRoyalPageTransition(onComplete) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onComplete();
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'royal-page-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="royal-page-transition__orbit"></div>' +
    '<img class="royal-page-transition__logo" src="/logo-medallon.png" alt="" />';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  window.requestAnimationFrame(() => overlay.classList.add('is-active'));
  window.setTimeout(onComplete, 430);
  window.setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
  }, 980);
}
