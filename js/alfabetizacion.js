(function () {
  'use strict';

  // El bloque de aportes voluntarios sólo se muestra si hay un alias cargado en js/config.js (SITE.donacion).
  // Sin alias, la página no muestra nada de eso.
  var SITE = window.SITE || {};
  var alias = typeof SITE.donacion === 'string' ? SITE.donacion.trim() : '';
  var bloque = document.getElementById('aporte');
  if (!bloque || !/^[A-Za-z0-9._-]{6,20}$/.test(alias)) return;

  var campo = document.getElementById('alias');
  var boton = document.getElementById('copiar-alias');
  var aviso = document.getElementById('aviso-copia');
  campo.textContent = alias;
  bloque.hidden = false;

  function avisar(texto) {
    aviso.textContent = texto;
  }

  function copiarSinApi() {
    // Para navegadores que no ofrecen navigator.clipboard (por ejemplo, páginas sin https)
    var rango = document.createRange();
    rango.selectNodeContents(campo);
    var seleccion = window.getSelection();
    seleccion.removeAllRanges();
    seleccion.addRange(rango);
    try {
      return document.execCommand('copy');
    } catch (e) {
      return false;
    }
  }

  boton.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(alias).then(
        function () { avisar('Alias copiado.'); },
        function () { avisar(copiarSinApi() ? 'Alias copiado.' : 'No se pudo copiar. Se puede seleccionar el alias y copiarlo a mano.'); }
      );
    } else {
      avisar(copiarSinApi() ? 'Alias copiado.' : 'No se pudo copiar. Se puede seleccionar el alias y copiarlo a mano.');
    }
  });
})();
