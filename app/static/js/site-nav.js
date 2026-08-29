/**
 * Site navigation — mobile hamburger menu only.
 *
 * The desktop nav and every anchor link on the page work with plain <a
 * href="#id"> tags plus the stylesheet's `scroll-behavior: smooth` and each
 * section's `scroll-mt-*` — no JS involved. This file's only job is the
 * mobile dropdown panel: toggle it open/closed, close it on link click,
 * outside click, or Escape. Self-contained IIFE, touches nothing outside
 * #mobile-menu-btn / #mobile-menu-panel.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var btn = document.getElementById('mobile-menu-btn');
    var panel = document.getElementById('mobile-menu-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      setOpen(panel.classList.contains('hidden'));
    });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('.mobile-menu-link')) setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (panel.classList.contains('hidden')) return;
      if (!panel.contains(event.target) && !btn.contains(event.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.classList.contains('hidden')) {
        setOpen(false);
        btn.focus();
      }
    });

    function setOpen(open) {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
})();
