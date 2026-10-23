(function () {
  'use strict';

  var SITE = window.SITE || {};

  // ---------- Links de contacto (se completan desde config.js) ----------
  document.querySelectorAll('[data-brand]').forEach(function (node) {
    if (SITE.brand) node.textContent = SITE.brand;
  });

  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var text = a.getAttribute('data-wa');
    a.href = 'https://wa.me/' + SITE.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
    a.target = '_blank';
    a.rel = 'noopener';
  });

  document.querySelectorAll('[data-email]').forEach(function (a) {
    a.href = 'mailto:' + SITE.email;
  });

  document.querySelectorAll('[data-instagram]').forEach(function (a) {
    a.href = SITE.instagram;
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();
