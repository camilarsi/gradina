(function () {
  'use strict';

  // Redirige a WhatsApp con el número de js/config.js, para poder compartir gradina.com.ar/wa
  // (por ejemplo en el perfil de Instagram) sin mostrar el número en la dirección.
  var SITE = window.SITE;
  if (!SITE || !/^\d{8,15}$/.test(SITE.whatsapp)) return;
  window.location.replace('https://wa.me/' + SITE.whatsapp);
})();
