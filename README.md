# Storefront Ruralanas

Web pública de Ruralanas. Next.js 15 (App Router), TypeScript estricto y Tailwind v4.

Es la traducción a código del prototipo de diseño que está en
[`../../front-web/Ruralanas_home/`](../../front-web/Ruralanas_home/): misma paleta, misma
tipografía, mismo relato por capítulos, ahora en componentes mantenibles y con datos
tipados.

## Arrancar

```bash
npm install
cp .env.example .env.local   # los valores por defecto ya funcionan
npm run dev                  # http://localhost:3000 → redirige a /es
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run clean` | Borra `.next` |
| `npm run dev:clean` | Borra `.next` y arranca en desarrollo |

### Si de golpe falla todo

Dos causas, y las dos se ven igual —errores en todas las rutas— pero se arreglan distinto:

1. **`ERR_CONNECTION_REFUSED` en cualquier página.** No hay servidor: `npm run dev`.
2. **`Cannot find module './NNN.js'` o `__webpack_modules__[moduleId] is not a function`.**
   La carpeta `.next` quedó corrupta. No es un error del código: pasa cuando `next build` y
   `next dev` escriben la misma carpeta a la vez. Se arregla con `npm run dev:clean`.

**No correr `npm run build` mientras `npm run dev` está levantado.** Comparten `.next` y se
pisan. Parar el dev primero, o compilar desde otra copia del repo.

## Qué hay hoy

| Ruta | Estado |
|---|---|
| `/[locale]` | Home narrativa completa: hero, Capítulo I con video scroll-scrub, seis pasos del proceso, Capítulo II, cifras, alcance mundial, sostenibilidad, por qué la lana, colección, cuidados, testimonios, reconocimientos, noticias y footer con formularios |
| `/[locale]/tienda` | Listado con filtros por categoría y técnica, solo disponibles, orden, y dos vistas (grilla y lista) |
| `/[locale]/tienda/[slug]` | Ficha con galería, caja de compra, trazabilidad de la artesana, ficha técnica, cuidados y relacionados |
| `/[locale]/carrito` | Carrito propio, con cantidades limitadas por el stock real y totales del motor |
| `/[locale]/checkout` | Checkout híbrido: contacto, envío, tarifa elegida y resumen con total real antes de pagar |
| `/[locale]/gracias` | Retorno de la pasarela; muestra el estado real del pedido, no un "gracias" optimista |
| `/[locale]/admin/resenas` | Admin interno: cargar reseñas, protegido por contraseña |
| `/api/cart` · `/api/checkout` · `/api/orders` | Capa BFF del motor transaccional |
| `/api/admin/*` | Sesión del admin y alta de reseñas |
| `/api/revalidate` | Endpoint para que el servicio de integración invalide el catálogo tras sincronizar stock |

Idiomas: ES y EN completos. FR y DE aparecen en el selector como planificados; agregarlos
es escribir un diccionario más en `src/lib/i18n/dictionaries/`.

## Arquitectura de datos

La web **no habla con el ERP ni con el CRM**. Habla con dos puertos, y del otro lado va a
estar el servicio de integración descrito en
[`09-plataforma/servicio-integracion.md`](../../../09-plataforma/servicio-integracion.md).

```
Dolibarr (ERP) ──> servicio de integración ──> [catalog]  ──> páginas
                            ▲                                    │
HubSpot (CRM)  <────────────┴─────────────── [leads]  <── formularios

navegador ──> /api/cart · /api/checkout ──> [commerce] ──> WooCommerce (Store API)
```

**Catálogo** — `src/lib/catalog/`

- `types.ts` — modelo de dominio. Es el contrato que el backend tiene que cumplir.
- `repository.ts` — la interfaz. Todo componente lee por acá.
- `mock-repository.ts` — los 16 productos del prototipo, con la forma del dato real.
- `http-repository.ts` — implementación contra el servicio, ya escrita.

Se cambia de origen con una variable: `CATALOG_SOURCE=mock | woo | http`. Ningún componente
cambia.

- `woo-repository.ts` — **origen activo**. Lee la Store API pública de WooCommerce, que hoy
  ya refleja el stock de Dolibarr. Trae los 18 productos con fotos, precios, categorías,
  disponibilidad y variantes de color. No trae artesana, técnica ni horas de tejido: eso
  llega con el ERP, y hasta entonces la ficha esconde el bloque en vez de inventarlo. Ver
  [D-018](../../../00-estrategia/decisiones.md).

**Comercio** — `src/lib/commerce/`

El carrito, el checkout y los pedidos salen por un tercer puerto, con la misma forma que el
catálogo.

- `types.ts` — modelo del carrito: línea, totales, tarifa de envío, pedido.
- `repository.ts` — la interfaz. Las rutas de API leen y escriben sólo por acá.
- `local-repository.ts` — motor de prototipo: calcula sobre el catálogo, respeta el stock,
  recorre el flujo entero y **no cobra**. Todo pedido suyo viaja con `simulated: true`.
- `woo/` — WooCommerce headless por Store API: `client.ts` (Cart-Token, Nonce y su
  reintento), `sku-map.ts` (sku de Dolibarr → id de Woo) y `repository.ts`.

Se cambia de motor con `COMMERCE_SOURCE=local | woo | woo-hosted`. **El modo activo es
`woo-hosted`**: el carrito se arma acá contra la Store API y el botón de finalizar compra
entrega a `/checkout/` de WooCommerce, que es donde están todas las pasarelas. Un checkout
propio sólo puede cobrar con `bacs` y `ppcp`; ver [D-017](../../../00-estrategia/decisiones.md).

> **Requisito de despliegue.** El carrito viaja al checkout por la cookie de sesión de Woo, y
> una cookie no cruza de un origen a otro. El storefront tiene que servirse desde el mismo
> origen que WooCommerce. En desarrollo, con el storefront en `localhost`, el salto abre el
> checkout vacío: es esperable y la propia página lo avisa.

**El navegador nunca habla con WordPress.** Toda llamada pasa por `/api/cart`,
`/api/checkout` y `/api/orders` de este mismo dominio. Tres consecuencias: no hay que
habilitar CORS en WooCommerce, el dominio de la tienda no se filtra al cliente, y el
`Cart-Token` —que identifica un carrito con stock comprometido— vive en una cookie
`httpOnly` fuera del alcance de cualquier script.

**Reseñas** — `src/lib/reviews/`

Reseñas propias guardadas en WooCommerce ([D-019](../../../00-estrategia/decisiones.md)). Se
leen por la Store API pública —sin clave y sin costo— y se cargan desde
`/[idioma]/admin/resenas`, que las crea por la API REST v3. WordPress sigue siendo donde se
moderan y se borran.

Cada reseña cuelga de una pieza concreta. Si no hay ninguna cargada, la sección de la portada
no se dibuja: el respaldo es `curated.ts`, y ahí sólo va texto real con permiso de quien lo
escribió.

Para cargar reseñas hacen falta dos cosas en el entorno: `ADMIN_PASSWORD` (mínimo doce
caracteres) y las claves `WOO_API_KEY` / `WOO_API_SECRET`, que se generan en WooCommerce →
Ajustes → Avanzado → API REST con permiso de lectura/escritura. Para **leerlas** no hace
falta ninguna clave.

**Leads** — `src/lib/leads/`

Contacto, newsletter y aviso de reposición entran por acciones de servidor, se validan y
salen por `submitLead()`. Con `LEADS_SINK=log` se escriben en consola; con `http` van al
servicio, que los deja en HubSpot. El navegador nunca ve un token.

## Decisiones tomadas al portar

- **Variante de tienda: "Mostrador"** (la 1b del prototipo), con sidebar de filtros en
  escritorio y panel inferior en móvil. La grilla de 4 columnas de la 1a se lee como
  catálogo mayorista; con piezas de 249 USD el aire es parte del producto. La 1c se
  conservó como **vista de lista**, disponible con un toggle.
- **Los filtros viven en la URL**, no en estado de React: la tienda funciona sin
  JavaScript, cada combinación es compartible y Google puede rastrear las categorías.
- **Fuentes autoalojadas** con `next/font` en vez de la CDN de Google: sin request
  bloqueante a un tercero y sin salto de layout.
- **El scrub por fotogramas del video solo corre en pantallas grandes.** Extraer cien
  frames a memoria en un móvil es caro y el seek encadenado entrecorta en Safari iOS. En
  móvil el video se reproduce en bucle y el marco sigue animándose con el scroll.
- **`stock 1` se muestra como "Queda 1 · pieza única"**, en color de marca y no como
  alerta. Agotado nunca es un callejón sin salida: hay plazo de producción o formulario de
  aviso.
- **Lo que falta producir se ve.** Las fotos, ilustraciones, sellos y el mapa que todavía
  no existen se dibujan como marcos punteados, igual que en el prototipo. Es el inventario
  visible del trabajo del módulo 08.

## Lo que este proyecto todavía no tiene

- Conexión real con WooCommerce. El código del motor está escrito y el flujo funciona de
  punta a punta, pero corre contra el repositorio de prototipo: falta apuntar
  `WOO_STORE_API_URL` a la instalación, conciliar los SKU y probar una compra real con la
  pasarela de cada mercado (módulo 07).
- Analítica del checkout. `add_to_cart`, `begin_checkout` y `add_payment_info` tienen su
  punto de emisión identificado en el flujo; `purchase` se emite desde el servidor al
  confirmarse el pago por webhook, no desde la página de gracias.
- Analítica. Los siete eventos del módulo 05 no están instrumentados: falta decidir el
  destino antes de escribir el `track()`.
- Página de artesanas, blog y regalo corporativo.
- Datos reales. Los nombres y zonas de las artesanas en `mock-repository.ts` son de
  muestra y **requieren consentimiento** antes de publicarse.
