# FRISBY S.A — Tienda ficticia para el laboratorio de GA4

Tienda en línea **ficticia** de pollo apanado, creada para el laboratorio de Google Analytics 4 del
*Diplomado en E-commerce y Negocios Internacionales Digitales*.

- Solo HTML, CSS y JavaScript puros: sin frameworks, sin npm, sin compilación, sin servidor y sin base de datos.
- **No procesa pagos reales** y **no pide ni guarda** correo, teléfono, documento ni datos de tarjeta.
- Usa Google Analytics 4 únicamente con fines didácticos.
- "FRISBY" se usa solo como nombre de ejercicio académico; el logotipo es un dibujo propio en SVG.

---

## 1. Estructura de archivos

```
FRISBY-SA/
├── index.html          Catálogo (inicio) + banner del cupón
├── producto.html       Detalle del producto  (producto.html?id=FRI-001)
├── carrito.html        Carrito
├── checkout.html       Checkout en dos pasos (Envío → Pago simulado)
├── gracias.html        Confirmación de compra (evento purchase)
├── css/
│   └── estilos.css     Estilos de la tienda y del monitor de eventos
├── js/
│   ├── config.js       ← ÚNICO archivo que debes editar (ID de GA4)
│   ├── productos.js    Los 8 productos y utilidades de formato
│   ├── carrito.js      Carrito (localStorage), cupón y tarifas de envío
│   ├── analytics.js    Carga de gtag.js, envío de eventos y Monitor de eventos
│   ├── inicio.js       Lógica de index.html
│   ├── producto.js     Lógica de producto.html
│   ├── pagina-carrito.js  Lógica de carrito.html
│   ├── checkout.js     Lógica de checkout.html
│   └── gracias.js      Lógica de gracias.html
└── README.md
```

## 2. Configurar tu ID de medición (único paso obligatorio)

1. En GA4: **Administrar → Flujos de datos → tu flujo web → ID de medición** (formato `G-ABC123DEF4`).
2. Abre `js/config.js` y reemplaza el marcador:

```js
window.TIENDA_CONFIG = {
  GA_MEASUREMENT_ID: "G-ABC123DEF4",  // tu ID real
  DEBUG_MODE: true                    // true = verás los eventos en DebugView
};
```

- Con el marcador `G-XXXXXXXXXX` **no se carga Google Analytics**. El monitor de la derecha muestra un aviso
  rojo y los eventos solo aparecen allí.
- Con un ID válido el monitor muestra un aviso verde: `Conectado a G-... · modo depuración`.
- `DEBUG_MODE: true` envía `debug_mode` en `gtag('config', ...)`; los eventos se ven en tiempo real en
  **Administrar → DebugView**. Con `false` no se envía `debug_mode`.

## 3. Probarla en tu computador

Opción A: abre `index.html` con doble clic (funciona, pero algunos navegadores limitan cookies en `file://`).

Opción B (recomendada): desde la carpeta, ejecuta un servidor local y abre `http://localhost:8000`:

```
python3 -m http.server 8000
```

## 4. Monitor de eventos (ayuda didáctica)

Panel fijo a la derecha (380 px; en pantallas de menos de 820 px pasa abajo con 300 px de alto):

- **Estado de la conexión** con GA4 (verde = conectado, rojo = sin ID).
- **Origen de la visita**: `utm_source / utm_medium · utm_campaign` de la **primera página de la sesión**, o
  `directo (sin UTM)`. Prueba abriendo `index.html?utm_source=facebook&utm_medium=cpc&utm_campaign=lab_ga4`.
- **Propiedad de usuario** `tipo_cliente` una vez confirmas el envío.
- **Últimos 12 eventos** (hora, nombre y resumen). Toca un evento para ver todos sus parámetros.
  Incluye `page_view` de cada página (GA4 lo envía solo; el monitor lo muestra).
- **Simular nuevo visitante**: borra las cookies `_ga*` en todas las variantes de dominio del host, el carrito
  y `sessionStorage`, y vuelve a `index.html`. Para simular una visita con UTM, hazlo y luego abre la URL con UTM.
- Botón **Ocultar/Mostrar** (recuerda tu elección).

## 5. Contrato de medición

Todos los eventos llevan `currency: "COP"`. Cada ítem lleva `item_id`, `item_name`, `item_brand`
(`FRISBY S.A`), `item_category`, `price`, `quantity` e `index`. Con cupón activo: `price` = precio unitario
con descuento, `discount` = descuento por unidad y `coupon`.

| # | Evento | Cuándo se envía | Parámetros clave |
|---|--------|-----------------|------------------|
| 1 | `view_item_list` | Al cargar el catálogo | `item_list_id: "catalogo_principal"`, `item_list_name`, `items` |
| 2 | `view_promotion` | Al mostrarse el banner del cupón | `promotion_id: "BIENVENIDA10"`, `promotion_name`, `creative_name`, `creative_slot`, `items` |
| 3 | `select_promotion` | Clic en el banner (aplica el cupón y va al carrito) | Igual que `view_promotion` |
| 4 | `select_item` | Clic en un producto del catálogo, antes de navegar | `item_list_id`, `item_list_name`, `items` |
| 5 | `view_item` | Al abrir el detalle | `value`, `items` |
| 6 | `add_to_cart` | Al agregar o aumentar unidades | `value`, `items` (`quantity` = unidades agregadas) |
| 7 | `remove_from_cart` | Al quitar o disminuir unidades | `value`, `items` |
| 8 | `view_cart` | Al abrir el carrito con productos | `value`, `coupon` (si existe), `items` |
| 9 | `begin_checkout` | Al abrir `checkout.html` | `value`, `coupon`, `items` |
| 10 | `add_shipping_info` | Clic en "Continuar al pago" | `value`, `coupon`, `items`, `shipping_tier` |
| 11 | `add_payment_info` | Clic en "Pagar (simulado)" | `value`, `coupon`, `payment_type`, `items` |
| 12 | `purchase` | Al cargar `gracias.html` (una sola vez por pedido) | `transaction_id`, `affiliation`, `value`, `shipping`, `coupon`, `tipo_cliente`, `items` |

Notas de diseño:

- `value` siempre es la suma de `price × quantity` de los ítems del evento (productos **con descuento**, **sin envío**).
- `shipping_tier` toma exactamente uno de: `Nacional - Estándar`, `Nacional - Express`,
  `Internacional - Estándar`, `Internacional - Express`.
- `gtag('set', 'user_properties', { tipo_cliente })` se envía al confirmar el envío y otra vez antes de `purchase`.
  `tipo_cliente` es `Nacional` si el país es Colombia, y `Internacional` en los demás casos.
- `purchase` se envía **una sola vez**: el pedido se guarda en `sessionStorage` antes de ir a `gracias.html`, se marca
  como enviado después del evento y el carrito se vacía. Recargar la página no repite la compra.
- Los eventos que navegan (`select_item`, `select_promotion`, `add_payment_info`) usan `event_callback`,
  `event_timeout` de 1000 ms y un respaldo de 1200 ms, así la navegación nunca se queda esperando a GA4.
- Ningún evento contiene datos personales (el nombre ficticio nunca se envía a GA4).

### Cupón y envío

- Cupón `BIENVENIDA10`: 10 % de descuento. Se aplica en el carrito (escribiéndolo) o desde el banner del inicio.
- Tarifas (COP): Nacional Estándar 12.000 · Nacional Express 25.000 · Internacional Estándar 95.000 ·
  Internacional Express 160.000.
- Nacional Estándar es **gratis desde $150.000 en productos** (valor de productos ya con descuento).
- Países disponibles: Colombia, México, Estados Unidos, España, Países Bajos, Alemania, Chile y Perú.

## 6. Catálogo (precios en COP)

| ID | Producto | Categoría | Precio |
|----|----------|-----------|-------:|
| FRI-001 | Combo Familiar 12 piezas | Combos | 89.900 |
| FRI-002 | Combo Personal 3 piezas + papas | Combos | 28.900 |
| FRI-003 | Balde Crujiente 8 piezas | Piezas | 64.900 |
| FRI-004 | Tiras de Pollo Apanado x10 | Tiras y Nuggets | 27.900 |
| FRI-005 | Nuggets Dorados x20 | Tiras y Nuggets | 31.900 |
| FRI-006 | Alitas Apanadas x10 | Piezas | 36.900 |
| FRI-007 | Papas a la Francesa Grandes | Acompañamientos | 12.900 |
| FRI-008 | Pack de 4 Salsas | Salsas | 8.900 |

## 7. Recorrido sugerido para el laboratorio

1. Abre el sitio con UTM: `.../index.html?utm_source=facebook&utm_medium=cpc&utm_campaign=lab_ga4`.
2. En el catálogo: `view_item_list` y `view_promotion`.
3. Entra a un producto (`select_item` → `view_item`) y agrégalo (`add_to_cart`).
4. Haz clic en el banner (`select_promotion`) → carrito (`view_cart`). Disminuye una unidad (`remove_from_cart`).
5. Ve al checkout (`begin_checkout`), elige un país distinto de Colombia y servicio Express
   (`add_shipping_info`), elige un método de pago y paga (`add_payment_info` → `purchase`).
6. Recarga `gracias.html`: no debe aparecer un segundo `purchase`.
7. Pulsa **Simular nuevo visitante** y repite con otro país para comparar clientes Nacional e Internacional.

Para analizar `tipo_cliente` en GA4, regístralo como **dimensión personalizada** (Administrar → Definiciones
personalizadas), con alcance **Usuario** (propiedad de usuario) y, si quieres verlo en informes de compras,
también con alcance **Evento**. Las dimensiones nuevas tardan en poblarse (hasta 24 h); DebugView es inmediato.

## 8. Publicar gratis en GitHub + Vercel (sin instalar nada)

### 8.1 Subir a GitHub desde el navegador
1. Descomprime el `.zip`.
2. Entra a <https://github.com> e inicia sesión. Clic en **+ → New repository**.
3. Nombre: por ejemplo `frisby-ga4-lab`. Déjalo **Public** (o Private, Vercel también lo permite). Clic en **Create repository**.
4. En la página del repositorio vacío, clic en **uploading an existing file**.
5. Abre la carpeta descomprimida y **arrastra su contenido** (`index.html`, `producto.html`, `carrito.html`,
   `checkout.html`, `gracias.html`, `README.md` y las carpetas `css` y `js`) a la página de GitHub.
   Importante: `index.html` debe quedar en la **raíz** del repositorio, no dentro de otra carpeta.
6. Clic en **Commit changes**.

> Edita `js/config.js` con tu ID **antes** de subirlo, o después con el lápiz de GitHub (**Edit this file**) y
> **Commit changes**: Vercel republica solo.

### 8.2 Publicar en Vercel
1. Entra a <https://vercel.com> y regístrate con **Continue with GitHub** (plan Hobby, gratis).
2. **Add New… → Project** y selecciona tu repositorio (**Import**).
3. **Framework Preset: Other**. No cambies nada más: sin Build Command, sin Output Directory, sin Install Command.
4. Clic en **Deploy**. En menos de un minuto tendrás una URL tipo `https://frisby-ga4-lab.vercel.app`.
5. Abre la URL y revisa el monitor: debe decir `Conectado a G-... · modo depuración` (verde).

### 8.3 Comprobar en GA4
- **Administrar → DebugView** (con `DEBUG_MODE: true`): verás los eventos del recorrido en tiempo real.
- **Informes → Tiempo real**: confirma las visitas y eventos.

## 9. Problemas frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Aviso rojo en el monitor | `GA_MEASUREMENT_ID` sigue en `G-XXXXXXXXXX` o no empieza por `G-`. |
| Aviso verde pero no llegan datos | Bloqueador de anuncios o privacidad del navegador; prueba en una ventana sin extensiones. |
| No aparece nada en DebugView | `DEBUG_MODE` en `false`, o espera unos segundos y actualiza. |
| El carrito no se vacía tras comprar | Revisa que no haya errores en la consola (F12). |
| Quiero empezar de cero | Botón **Simular nuevo visitante** del monitor. |

---
*Sitio académico de simulación: no procesa pagos reales, no guarda datos personales y usa Google Analytics 4.*
