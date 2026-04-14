/**
 * prototipo-delivery/script.js
 * Restaurantes → platos → resumen → confirmación. Sin módulos ES6.
 */

(function () {
  'use strict';

  var RESTAURANTES = [
    { id: 'r1', nombre: 'Pizzería Napoli', categoria: 'pizza', img: './assets/rest-r1.svg' },
    { id: 'r2', nombre: 'Sushi Roll', categoria: 'asiatica', img: './assets/rest-r2.svg' },
    { id: 'r3', nombre: 'Burger Norte', categoria: 'hamburguesas', img: './assets/rest-r3.svg' },
    { id: 'r4', nombre: 'Mamma Mia Express', categoria: 'pizza', img: './assets/rest-r4.svg' }
  ];

  /** Platos por restaurante (cada uno con imagen en ./assets/) */
  var MENU = {
    r1: [
      { id: 'm1', nombre: 'Margarita', precio: 8.5, img: './assets/dish-m1.svg' },
      { id: 'm2', nombre: 'Cuatro quesos', precio: 10.9, img: './assets/dish-m2.svg' },
      { id: 'm9', nombre: 'Refresco', precio: 2.5, img: './assets/dish-m9.svg' }
    ],
    r2: [
      { id: 'm3', nombre: 'Menú maki (12 pzs)', precio: 14.0, img: './assets/dish-m3.svg' },
      { id: 'm4', nombre: 'Yakisoba', precio: 9.5, img: './assets/dish-m4.svg' }
    ],
    r3: [
      { id: 'm5', nombre: 'Clásica + patatas', precio: 11.0, img: './assets/dish-m5.svg' },
      { id: 'm6', nombre: 'Veggie', precio: 10.5, img: './assets/dish-m6.svg' }
    ],
    r4: [
      { id: 'm7', nombre: 'Calzone', precio: 9.0, img: './assets/dish-m7.svg' },
      { id: 'm8', nombre: 'Prosciutto', precio: 11.5, img: './assets/dish-m8.svg' }
    ]
  };

  var restauranteActual = null;
  /** pedido: { idPlato, nombre, precioUnit, cantidad } */
  var pedido = [];

  var elFiltro = document.getElementById('filtro-cat');
  var elListaRest = document.getElementById('lista-restaurantes');
  var elStepRest = document.getElementById('step-restaurante');
  var elStepProd = document.getElementById('step-productos');
  var elStepRes = document.getElementById('step-resumen');
  var elStepConf = document.getElementById('step-confirmacion');
  var elSteps = document.querySelector('.steps');
  var elTituloRest = document.getElementById('titulo-restaurante');
  var elListaPlatos = document.getElementById('lista-platos');
  var elListaResumen = document.getElementById('lista-resumen');
  var elResumenVacio = document.getElementById('resumen-vacio');
  var elTotal = document.getElementById('total-delivery');
  var elMsgConfirm = document.getElementById('msg-confirm');
  var elFeedback = document.getElementById('feedback');
  var elOrderStatus = document.getElementById('order-status');
  var elCartCount = document.getElementById('cart-count');

  function mostrarSoloPanel(panel) {
    var panels = [elStepRest, elStepProd, elStepRes, elStepConf];
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var on = p === panel;
      p.classList.toggle('active', on);
      p.hidden = !on;
    }
    actualizarIndicadoresPasos(panel);
  }

  function actualizarIndicadoresPasos(panel) {
    var n = '0';
    if (panel === elStepRest) n = '1';
    if (panel === elStepProd) n = '2';
    if (panel === elStepRes) n = '3';
    if (panel === elStepConf) n = '3';

    var indicadores = document.querySelectorAll('[data-step-indicator]');
    for (var i = 0; i < indicadores.length; i++) {
      var el = indicadores[i];
      var step = el.getAttribute('data-step-indicator');
      el.classList.toggle('active', step === n || (panel === elStepConf && step === '3'));
    }
  }

  function getPedidoCount() {
    var count = 0;
    for (var i = 0; i < pedido.length; i++) {
      count += pedido[i].cantidad;
    }
    return count;
  }

  var feedbackTimeout = null;

  function showFeedback(message) {
    if (!elFeedback) return;
    clearTimeout(feedbackTimeout);
    elFeedback.textContent = message;
    elFeedback.hidden = false;
    elFeedback.className = 'feedback feedback--visible';
    feedbackTimeout = setTimeout(function () {
      elFeedback.hidden = true;
      elFeedback.className = 'feedback';
    }, 3000);
  }

  function updateOrderStatus() {
    if (!elOrderStatus || !elCartCount) return;
    var count = getPedidoCount();
    if (count === 0) {
      elOrderStatus.textContent = 'Aún no hay pedidos.';
      elCartCount.hidden = true;
      elCartCount.textContent = '';
    } else {
      elOrderStatus.textContent = 'Tienes ' + count + ' ' + (count === 1 ? 'pedido' : 'pedidos') + ' en el carrito.';
      elCartCount.hidden = false;
      elCartCount.textContent = count;
    }
  }

  function navegar(pagina, restId, options) {
    options = options || {};
    var state = { page: pagina };
    if (restId) state.restId = restId;

    if (pagina === 'restaurantes') {
      mostrarSoloPanel(elStepRest);
    } else if (pagina === 'menu') {
      if (restId) {
        abrirMenu(restId);
      } else {
        mostrarSoloPanel(elStepRest);
      }
    } else if (pagina === 'resumen') {
      pintarResumen();
      mostrarSoloPanel(elStepRes);
    } else if (pagina === 'confirmacion') {
      mostrarSoloPanel(elStepConf);
    }

    if (options.pushState === false) {
      // do not modify history
    } else if (options.replaceState) {
      window.history.replaceState(state, '', '');
    } else {
      window.history.pushState(state, '', '');
    }

    updateOrderStatus();
  }

  function handlePopState(event) {
    var state = event.state;
    if (!state) {
      state = { page: 'restaurantes' };
    }
    navegar(state.page, state.restId, { pushState: false });
  }

  function filtrarRestaurantes() {
    var cat = elFiltro.value;
    elListaRest.innerHTML = '';
    for (var i = 0; i < RESTAURANTES.length; i++) {
      var r = RESTAURANTES[i];
      if (cat !== 'todas' && r.categoria !== cat) continue;
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-rest';
      btn.setAttribute('data-rest', r.id);
      btn.innerHTML =
        '<span class="card-rest__media"><img src="' +
        r.img +
        '" width="72" height="72" alt="" loading="lazy"></span>' +
        '<span class="card-rest__body"><strong>' +
        escapeHtml(r.nombre) +
        '</strong><span class="tag">' +
        escapeHtml(r.categoria) +
        '</span></span>';
      li.appendChild(btn);
      elListaRest.appendChild(li);
    }
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function abrirMenu(restId) {
    restauranteActual = restId;
    var r = null;
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restId) {
        r = RESTAURANTES[i];
        break;
      }
    }
    elTituloRest.textContent = r ? r.nombre : 'Menú';
    var platos = MENU[restId] || [];
    elListaPlatos.innerHTML = '';
    for (var j = 0; j < platos.length; j++) {
      var pl = platos[j];
      var li = document.createElement('li');
      li.className = 'plato-row';
      li.innerHTML =
        '<img class="plato-thumb" src="' +
        pl.img +
        '" width="52" height="52" alt="">' +
        '<div class="plato-info"><span class="plato-nombre">' +
        escapeHtml(pl.nombre) +
        '</span></div>' +
        '<span class="plato-precio">' +
        formatEuros(pl.precio) +
        '</span>' +
        '<button type="button" class="btn-mini" data-add-plato="' +
        pl.id +
        '" data-nombre="' +
        escapeAttr(pl.nombre) +
        '" data-precio="' +
        pl.precio +
        '" data-img="' +
        escapeAttr(pl.img) +
        '">+</button>';
      elListaPlatos.appendChild(li);
    }
    mostrarSoloPanel(elStepProd);
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function lineaPedido(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) return pedido[i];
    }
    return null;
  }

  function agregarPlato(idPlato, nombre, precio, img) {
    var linea = lineaPedido(idPlato);
    if (linea) {
      linea.cantidad += 1;
    } else {
      pedido.push({
        idPlato: idPlato,
        nombre: nombre,
        precioUnit: precio,
        cantidad: 1,
        img: img
      });
    }
    updateOrderStatus();
    showFeedback('Añadido "' + nombre + '" al pedido.');
  }

  function eliminarPlato(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) {
        var nombre = pedido[i].nombre;
        pedido.splice(i, 1);
        updateOrderStatus();
        pintarResumen();
        showFeedback('Eliminado "' + nombre + '" del pedido.');
        return;
      }
    }
  }

  function totalPedido() {
    var t = 0;
    for (var i = 0; i < pedido.length; i++) {
      t += pedido[i].precioUnit * pedido[i].cantidad;
    }
    return t;
  }

  function formatEuros(n) {
    return Number(n).toFixed(2).replace('.', ',') + ' €';
  }

  function pintarResumen() {
    elListaResumen.innerHTML = '';
    if (pedido.length === 0) {
      elResumenVacio.hidden = false;
    } else {
      elResumenVacio.hidden = true;
    }
    for (var i = 0; i < pedido.length; i++) {
      var l = pedido[i];
      var li = document.createElement('li');
      li.className = 'resumen-line';
      li.innerHTML =
        '<img class="resumen-thumb" src="' +
        l.img +
        '" width="40" height="40" alt="">' +
        '<div class="resumen-meta">' +
        '<span class="resumen-nombre">' +
        escapeHtml(l.nombre) +
        '</span>' +
        '<span class="resumen-detalle">' +
        l.cantidad + ' × ' + formatEuros(l.precioUnit) +
        ' = ' + formatEuros(l.precioUnit * l.cantidad) +
        '</span>' +
        '</div>' +
        '<button type="button" class="btn-remove" data-remove-plato="' + l.idPlato + '">Eliminar</button>';
      elListaResumen.appendChild(li);
    }
    elTotal.textContent = formatEuros(totalPedido());
  }

  elSteps.addEventListener('click', function (e) {
    var stepBtn = e.target.closest('[data-step-target]');
    if (!stepBtn) return;
    var target = stepBtn.getAttribute('data-step-target');
    if (target === 'restaurantes') {
      navegar('restaurantes');
      showFeedback('Volviendo al paso Local.');
    } else if (target === 'menu') {
      if (restauranteActual) {
        navegar('menu', restauranteActual);
        showFeedback('Abriendo el menú del restaurante.');
      } else {
        navegar('restaurantes');
        showFeedback('Selecciona primero un restaurante.');
      }
    } else if (target === 'resumen') {
      navegar('resumen');
      showFeedback('Mostrando el resumen del pedido.');
    }
  });

  elListaRest.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-rest]');
    if (!btn) return;
    var restId = btn.getAttribute('data-rest');
    navegar('menu', restId);
    showFeedback('Restaurante seleccionado.');
  });

  elFiltro.addEventListener('change', filtrarRestaurantes);

  elListaPlatos.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-plato]');
    if (!b) return;
    var id = b.getAttribute('data-add-plato');
    var nombre = b.getAttribute('data-nombre');
    var precio = parseFloat(b.getAttribute('data-precio'), 10);
    var imgPlato = b.getAttribute('data-img') || '';
    agregarPlato(id, nombre, precio, imgPlato);
  });

  document.getElementById('btn-volver-rest').addEventListener('click', function () {
    navegar('restaurantes');
    showFeedback('Volviendo a la lista de locales.');
  });

  document.getElementById('btn-carrito').addEventListener('click', function () {
    navegar('resumen');
    showFeedback('Mostrando resumen del pedido.');
  });

  document.getElementById('btn-seguir-comprando').addEventListener('click', function () {
    if (restauranteActual) {
      navegar('menu', restauranteActual);
      showFeedback('Volviendo al menú del restaurante.');
    } else {
      navegar('restaurantes');
      showFeedback('Volviendo a la lista de locales.');
    }
  });

  document.getElementById('btn-comprar').addEventListener('click', function () {
    if (pedido.length === 0) {
      showFeedback('Añada al menos un plato antes de confirmar.');
      return;
    }
    var nombreRest = '';
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restauranteActual) {
        nombreRest = RESTAURANTES[i].nombre;
        break;
      }
    }
    elMsgConfirm.textContent =
      'Su pedido en ' +
      nombreRest +
      ' por ' +
      formatEuros(totalPedido()) +
      ' está en preparación. Tiempo aproximado: 35 minutos.';
    pedido = [];
    pintarResumen();
    navegar('confirmacion');
    showFeedback('Pedido confirmado. Gracias.');
  });

  document.getElementById('btn-nuevo').addEventListener('click', function () {
    restauranteActual = null;
    pedido = [];
    updateOrderStatus();
    navegar('restaurantes');
    showFeedback('Listo para un nuevo pedido.');
  });

  document.getElementById('btn-volver-menu').addEventListener('click', function () {
    if (restauranteActual) {
      navegar('menu', restauranteActual);
      showFeedback('Volviendo al menú.');
    } else {
      navegar('restaurantes');
      showFeedback('Volviendo a la lista de locales.');
    }
  });

  elListaResumen.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-plato]');
    if (!btn) return;
    var idPlato = btn.getAttribute('data-remove-plato');
    eliminarPlato(idPlato);
  });

  window.addEventListener('popstate', handlePopState);

  filtrarRestaurantes();
  navegar('restaurantes', null, { replaceState: true });
})();

