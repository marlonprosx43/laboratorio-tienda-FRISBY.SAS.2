/* ==========================================================================
   FRISBY S.A — gracias.html
   Evento: purchase (una sola vez por pedido)
   El pedido se guarda en sessionStorage ("frisby_pedido") antes de llegar aquí.
   Después de enviar purchase se marca enviado:true para que recargar no lo repita.
   ========================================================================== */
(function () {
  "use strict";

  var cont = document.getElementById("confirmacion");
  var pedido = null;

  try { pedido = JSON.parse(sessionStorage.getItem("frisby_pedido")); } catch (e) { pedido = null; }

  if (!pedido || !pedido.transaction_id) {
    cont.innerHTML = '<div class="vacio"><h2>No hay un pedido para mostrar</h2>' +
      '<p>Realiza una compra simulada desde el catálogo.</p>' +
      '<a class="btn btn-rojo" href="index.html">Ir al catálogo</a></div>';
    return;
  }

  var cop = window.formatoCOP;
  var yaEnviado = pedido.enviado === true;

  // El nombre lo escribe la persona: se escapa antes de mostrarlo
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  if (!yaEnviado) {
    // La propiedad de usuario va antes del evento purchase
    window.Analitica.establecerPropiedadesUsuario({ tipo_cliente: pedido.tipo_cliente });

    var params = {
      currency: "COP",
      transaction_id: pedido.transaction_id,
      affiliation: pedido.affiliation,
      value: pedido.value,
      shipping: pedido.shipping,
      tipo_cliente: pedido.tipo_cliente,
      items: pedido.items
    };
    if (pedido.coupon) params.coupon = pedido.coupon;

    window.Analitica.enviarEvento("purchase", params);

    // Marcar como enviado DESPUÉS de purchase
    pedido.enviado = true;
    try { sessionStorage.setItem("frisby_pedido", JSON.stringify(pedido)); } catch (e) { /* nada */ }
  }

  var filas = pedido.items.map(function (it) {
    return "<tr><td>" + it.item_name + '</td><td class="num">' + it.quantity + '</td><td class="num">' +
      cop(it.price) + '</td><td class="num">' + cop(it.price * it.quantity) + "</td></tr>";
  }).join("");

  var celebracionHTML =
    '<div class="confetti-container" aria-hidden="true">' +
    '<span class="confetti-dot c1"></span><span class="confetti-dot c2"></span>' +
    '<span class="confetti-dot c3"></span><span class="confetti-dot c4"></span>' +
    '<span class="confetti-dot c5"></span>' +
    '</div>' +
    '<div class="icono-exito" aria-hidden="true">' +
    '<svg viewBox="0 0 52 52"><circle class="checkmark-circulo" cx="26" cy="26" r="23" fill="none"/>' +
    '<path class="checkmark-check" fill="none" d="M14 27l8 8 16-16"/></svg>' +
    '</div>';

  cont.innerHTML =
    celebracionHTML +
    '<span class="sello">¡Compra simulada exitosa!</span>' +
    "<h1>Gracias, " + esc(pedido.nombre) + "</h1>" +
    "<p>Pedido <strong>" + pedido.transaction_id + "</strong> · cliente <strong>" + pedido.tipo_cliente +
    "</strong> · envío a " + pedido.pais + " (" + pedido.shipping_tier + ") · pago con " + pedido.metodo_pago + ".</p>" +
    '<table class="tabla-pedido"><thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Subtotal</th></tr></thead><tbody>' +
    filas + "</tbody></table>" +
    '<div class="resumen" style="max-width:420px;margin-left:auto">' +
    '<div class="fila"><span>Productos' + (pedido.coupon ? " (con cupón " + pedido.coupon + ")" : "") + "</span><span>" + cop(pedido.value) + "</span></div>" +
    '<div class="fila"><span>Envío</span><span>' + (pedido.shipping === 0 ? '<span class="gratis">GRATIS</span>' : cop(pedido.shipping)) + "</span></div>" +
    '<div class="fila total"><span>Total pagado (simulado)</span><span>' + cop(pedido.value + pedido.shipping) + "</span></div></div>" +
    '<p class="aviso" style="margin-top:16px">' +
    (yaEnviado
      ? "Este pedido ya se había enviado a la medición: recargar la página <strong>no</strong> repite el evento purchase."
      : "Se envió el evento <strong>purchase</strong> con este pedido. Si recargas la página, no se enviará de nuevo.") +
    "</p>" +
    '<div class="botones"><a class="btn btn-rojo" href="index.html">Seguir comprando</a></div>';
})();
