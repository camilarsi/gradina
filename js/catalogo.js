(function () {
  'use strict';

  // Catálogo interactivo: convierte la lista de servicios (<ul data-catalogo>) en pestañas de comando y una
  // "pantalla" que muestra el video del servicio elegido con su descripción debajo. Sin JavaScript queda la lista.
  var lista = document.querySelector('ul[data-catalogo]');
  if (!lista) return;

  var items = Array.prototype.slice.call(lista.children);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var angosto = window.matchMedia('(max-width: 699.98px)');

  var servicios = items.map(function (li) {
    var titulo = li.querySelector('strong').textContent.trim();
    var res = li.querySelector('.resumen');
    var det = li.querySelector('.det');
    var texto = res ? res.textContent.trim() : li.textContent.replace(titulo, '').trim();
    var casos = [];
    try { casos = JSON.parse(li.getAttribute('data-casos') || '[]'); } catch (e) { casos = []; }
    return { corto: li.getAttribute('data-corto') || titulo, titulo: titulo, texto: texto, detalle: det ? det.cloneNode(true) : null, casos: casos };
  });

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // ---------- Estructura ----------
  var raiz = el('div', 'cat');
  var tablist = el('div', 'cat-lista', { role: 'tablist', 'aria-orientation': 'vertical', 'aria-label': 'Qué hacemos' });
  var escena = el('div', 'cat-escena');
  var pantalla = el('div', 'pantalla');
  var barra = el('div', 'pantalla-barra');
  var luces = el('span', 'pantalla-luces', { 'aria-hidden': 'true' });
  luces.innerHTML = '<i></i><i></i><i></i>';
  var rutaTitulo = el('span', 'pantalla-titulo');
  barra.appendChild(luces);
  barra.appendChild(rutaTitulo);
  var cuerpo = el('div', 'pantalla-cuerpo');
  var pie = el('div', 'pantalla-pie');
  pantalla.appendChild(barra);
  pantalla.appendChild(cuerpo);
  pantalla.appendChild(pie);
  var panel = el('div', 'cat-texto', { id: 'cat-panel', role: 'tabpanel', tabindex: '0', 'aria-live': 'polite' });
  var tituloPanel = el('h3');
  var textoPanel = el('p');
  var detallePanel = el('ul');
  panel.appendChild(tituloPanel);
  panel.appendChild(textoPanel);
  pantalla.appendChild(panel);   // la descripción va dentro de la pantalla, como la salida de una consola bajo el video
  escena.appendChild(pantalla);

  var tabs = servicios.map(function (s, i) {
    var b = el('button', 'cat-tab', { type: 'button', role: 'tab', id: 'cat-tab-' + i, 'aria-controls': 'cat-panel', 'aria-selected': 'false', tabindex: '-1' });
    b.innerHTML = '<span class="cat-cursor" aria-hidden="true">&gt;</span><span class="cat-nombre"></span><span class="cat-parpadeo" aria-hidden="true">_</span>';
    b.querySelector('.cat-nombre').textContent = s.corto;
    b.addEventListener('click', function () { elegir(i, 0); });
    tablist.appendChild(b);
    return b;
  });
  panel.setAttribute('aria-labelledby', 'cat-tab-0');

  raiz.appendChild(tablist);
  raiz.appendChild(escena);
  lista.parentNode.insertBefore(raiz, lista);
  lista.hidden = true;

  // ---------- Reproducción ----------
  var actual = -1;
  var enPantalla = true;
  var videos = [];

  function reproducir() {
    videos.forEach(function (v) {
      if (reduceMotion) { v.controls = true; return; }   // con movimiento reducido no arranca solo
      if (v.offsetParent === null || !enPantalla || document.hidden) { v.pause(); return; }
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  function crearVideo(base, dims, clase, descripcion) {
    var v = el('video', clase, { muted: '', loop: '', playsinline: '', preload: 'none', poster: base + '.jpg', 'aria-label': descripcion });
    v.muted = true;
    if (dims) { v.setAttribute('width', dims[0]); v.setAttribute('height', dims[1]); }
    var s = el('source', null, { src: base + '.mp4', type: 'video/mp4' });
    v.appendChild(s);
    return v;
  }

  function dibujarPantalla(s, c) {
    videos = [];
    cuerpo.textContent = '';
    pie.textContent = '';
    var caso = s.casos[c];
    pantalla.classList.toggle('pantalla--vacia', !caso);
    pantalla.classList.toggle('pantalla--vertical', !!(caso && (caso.m || caso.mi)));

    if (!caso) {
      var consola = el('p', 'pantalla-consola');
      consola.innerHTML = '<span class="cat-cursor">&gt;</span> <span class="pantalla-comando"></span><span class="cat-parpadeo">_</span>';
      consola.querySelector('.pantalla-comando').textContent = s.corto.toLowerCase();
      consola.setAttribute('aria-hidden', 'true');
      cuerpo.appendChild(consola);
      var nota = el('p', 'pantalla-nota');
      nota.textContent = '// consultanos por este servicio';
      pie.appendChild(nota);
      return;
    }

    var dv = crearVideo(caso.d, caso.dw, 'v-desktop', 'Recorrido por ' + caso.n + ' en computadora');
    cuerpo.appendChild(dv);
    videos.push(dv);
    if (caso.m) {
      var mv = crearVideo(caso.m, caso.mw, 'v-mobile', 'Recorrido por ' + caso.n + ' en celular');
      cuerpo.appendChild(mv);
      videos.push(mv);
    } else if (caso.mi) {
      var img = el('img', 'v-mobile', { src: caso.mi, alt: caso.n + ' en celular', loading: 'lazy' });
      if (caso.mw) { img.setAttribute('width', caso.mw[0]); img.setAttribute('height', caso.mw[1]); }
      cuerpo.appendChild(img);
    }

    if (s.casos.length > 1) {
      s.casos.forEach(function (k, n) {
        var b = el('button', 'pantalla-caso', { type: 'button', 'aria-pressed': n === c ? 'true' : 'false' });
        b.textContent = '[ ' + k.n + ' ]';
        b.addEventListener('click', function () { elegir(actual, n); });
        pie.appendChild(b);
      });
    } else {
      var rotulo = el('p', 'pantalla-nota nota-linea');
      rotulo.textContent = '// ' + caso.n;   // mismo formato de comentario que '// consultanos por este servicio'
      pie.appendChild(rotulo);
      // Nombres compuestos ("Marca - Proyecto"): en celular se muestran como comentario de varias líneas
      var partes = caso.n.split(' - ');
      if (partes.length > 1) {
        rotulo.className += ' nota-doble';
        var bloque = el('p', 'pantalla-nota nota-bloque', { 'aria-hidden': 'true' });
        bloque.textContent = ['/*'].concat(partes.map(function (p) { return ' * ' + p; }), [' */']).join('\n');
        pie.appendChild(bloque);
      }
    }
  }

  function elegir(i, c) {
    actual = i;
    var s = servicios[i];
    tabs.forEach(function (t, k) {
      var sel = k === i;
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.setAttribute('tabindex', sel ? '0' : '-1');
    });
    panel.setAttribute('aria-labelledby', 'cat-tab-' + i);
    rutaTitulo.textContent = '~/' + s.corto.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
    tituloPanel.textContent = s.titulo;
    textoPanel.textContent = s.texto;
    if (detallePanel.parentNode) detallePanel.parentNode.removeChild(detallePanel);
    if (s.detalle) { detallePanel = s.detalle; detallePanel.className = 'cat-detalle'; panel.appendChild(detallePanel); }
    dibujarPantalla(s, c);
    reproducir();
  }

  // Teclado: flechas y inicio/fin recorren los comandos
  tablist.addEventListener('keydown', function (e) {
    var k = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (actual + 1) % tabs.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (actual - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') k = 0;
    else if (e.key === 'End') k = tabs.length - 1;
    if (k === null) return;
    e.preventDefault();
    elegir(k, 0);
    tabs[k].focus();
  });

  // Los videos se pausan cuando la pantalla sale de la vista o la pestaña queda en segundo plano.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      enPantalla = entries[0].isIntersecting;
      reproducir();
    }, { threshold: 0.25 }).observe(pantalla);
  }
  document.addEventListener('visibilitychange', reproducir);
  angosto.addEventListener('change', reproducir);   // al girar el celular o cambiar el ancho

  // Indicador de scroll (solo escritorio ancho, donde la ventana tiene marco): unos chevrons hacia abajo, fijos en el borde
  // inferior de la pantalla y centrados respecto de la ventana, mientras esta se extiende más allá del viewport.
  var ventana = raiz.closest('.ventana');
  if (ventana) {
    var pista = el('div', 'scroll-hint');
    var boton = el('button', 'scroll-hint-btn', { type: 'button', 'aria-label': 'Ir al final de la sección', tabindex: '-1' });
    boton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 30" width="26" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M4 5l8 8 8-8"/><path d="M4 16l8 8 8-8"/></svg>';
    boton.addEventListener('click', function () {
      ventana.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
    });
    pista.appendChild(boton);
    document.body.appendChild(pista);   // fuera de la ventana: así puede quedar por encima de la caja flotante de contacto
    var actualizarPista = function () {
      var r = ventana.getBoundingClientRect();
      var excede = r.bottom > window.innerHeight + 8 && r.top < window.innerHeight - 120;
      pista.style.left = Math.round(r.left + r.width / 2) + 'px';   // centrado en el ancho de la ventana
      pista.classList.toggle('visible', excede);
      boton.tabIndex = excede ? 0 : -1;   // solo se puede enfocar con el teclado mientras se ve
    };
    window.addEventListener('scroll', actualizarPista, { passive: true });
    window.addEventListener('resize', actualizarPista);
    if ('ResizeObserver' in window) new ResizeObserver(actualizarPista).observe(ventana);
    actualizarPista();
  }

  // Arranca en el primer servicio que tiene video, así la pantalla no abre vacía.
  var inicio = 0;
  for (var k = 0; k < servicios.length; k++) { if (servicios[k].casos.length) { inicio = k; break; } }
  elegir(inicio, 0);
})();
