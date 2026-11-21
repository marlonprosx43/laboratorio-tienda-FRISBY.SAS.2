/* ==========================================================================
   FRISBY S.A — Catálogo de productos (datos ficticios)
   Precios enteros en pesos colombianos (COP).
   Sin imágenes externas: cada producto usa un bloque de color con siglas.
   ========================================================================== */
(function () {
  "use strict";

  window.MARCA = "FRISBY S.A";
  window.AFILIACION = "FRISBY S.A - Tienda Web";
  window.MONEDA = "COP";

  window.PRODUCTOS = [
    {
      id: "FRI-001",
      nombre: "Combo Familiar 12 piezas",
      categoria: "Combos",
      precio: 89900,
      descripcion: "Doce piezas de pollo apanado dorado y crujiente, papas a la francesa grandes y cuatro salsas. Ideal para compartir en familia.",
      siglas: "CF", color: "#D31820", colorTexto: "#FFFFFF"
    },
    {
      id: "FRI-002",
      nombre: "Combo Personal 3 piezas + papas",
      categoria: "Combos",
      precio: 28900,
      descripcion: "Tres piezas de pollo apanado con porción de papas a la francesa y una salsa a elección. El antojo perfecto para una persona.",
      siglas: "CP", color: "#FFBA08", colorTexto: "#231713"
    },
    {
      id: "FRI-003",
      nombre: "Balde Crujiente 8 piezas",
      categoria: "Piezas",
      precio: 64900,
      descripcion: "Balde con ocho piezas surtidas de pollo apanado, marinado y frito al momento con nuestra corteza dorada.",
      siglas: "BC", color: "#E85D04", colorTexto: "#FFFFFF"
    },
    {
      id: "FRI-004",
      nombre: "Tiras de Pollo Apanado x10",
      categoria: "Tiras y Nuggets",
      precio: 27900,
      descripcion: "Diez tiras de pechuga apanada, tiernas por dentro y crujientes por fuera. Se acompañan con salsa de la casa.",
      siglas: "TP", color: "#F48C06", colorTexto: "#FFFFFF"
    },
    {
      id: "FRI-005",
      nombre: "Nuggets Dorados x20",
      categoria: "Tiras y Nuggets",
      precio: 31900,
      descripcion: "Veinte nuggets de pollo apanado, perfectos para picar, para los niños o para llevar de merienda.",
      siglas: "ND", color: "#FAA307", colorTexto: "#231713"
    },
    {
      id: "FRI-006",
      nombre: "Alitas Apanadas x10",
      categoria: "Piezas",
      precio: 36900,
      descripcion: "Diez alitas apanadas con un toque de especias y salsa agridulce. Crocantes y jugosas.",
      siglas: "AA", color: "#9D0208", colorTexto: "#FFFFFF"
    },
    {
      id: "FRI-007",
      nombre: "Papas a la Francesa Grandes",
      categoria: "Acompañamientos",
      precio: 12900,
      descripcion: "Porción grande de papas a la francesa doradas y saladas, el acompañamiento clásico del pollo apanado.",
      siglas: "PF", color: "#FFD166", colorTexto: "#231713"
    },
    {
      id: "FRI-008",
      nombre: "Pack de 4 Salsas",
      categoria: "Salsas",
      precio: 8900,
      descripcion: "Cuatro salsas de la casa: tártara, BBQ, miel mostaza y ají suave. Para mojar sin parar.",
      siglas: "SA", color: "#7D0C10", colorTexto: "#FFFFFF"
    }
  ];

  window.buscarProducto = function (id) {
    for (var i = 0; i < window.PRODUCTOS.length; i++) {
      if (window.PRODUCTOS[i].id === id) return window.PRODUCTOS[i];
    }
    return null;
  };

  // Formato de pesos colombianos: 89900 -> "$89.900"
  window.formatoCOP = function (n) {
    var negativo = n < 0;
    var texto = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (negativo ? "-$" : "$") + texto;
  };
})();
