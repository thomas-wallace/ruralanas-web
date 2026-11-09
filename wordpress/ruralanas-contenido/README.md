# Ruralanas · Contenido de la tienda (plugin de WordPress)

Guarda en el WordPress de ruralanas.com lo que se edita desde el admin de la
tienda nueva —línea de tiempo de Nosotros, campañas, mapa de países—, anota el
país de cada pedido pagado para el mapa y le da a la tienda permiso para
escribir noticias (entradas comunes de WordPress, las mismas que lee la web). No tiene pantallas: la tienda le habla
por la API REST (`/wp-json/ruralanas/v1/…`).

## Instalar en producción

Cambia WordPress de producción: hacerlo con backup verificado y avisando.

1. Comprimir esta carpeta (`ruralanas-contenido/`) en un zip y subirlo en
   Plugins → Añadir nuevo → Subir plugin. Activarlo.
2. Usuarios → Añadir nuevo: un usuario sólo para la tienda (por ejemplo
   `tienda-contenido`) con el rol **Ruralanas · Contenido de la tienda**. Nunca un
   administrador: ese rol sólo puede leer y escribir estos documentos, subir
   archivos a la biblioteca y escribir, publicar y mandar a la papelera
   noticias. No toca páginas, productos, pedidos ni ajustes, y WordPress limpia
   el HTML que manda (no tiene `unfiltered_html`).
3. En el perfil de ese usuario → Contraseñas de aplicación → crear una llamada
   "Tienda". Copiarla (WordPress la muestra una sola vez).
4. En Vercel (o donde corra la tienda), variables de entorno:
   ```
   CONTENT_STORE=wordpress
   CONTENT_WP_USER=tienda-contenido
   CONTENT_WP_APP_PASSWORD=<la contraseña de aplicación>
   ```
   `WP_API_URL` ya está (es la del blog). Volver a desplegar.
5. En la tienda: Admin → Mapa → "Buscar países en pedidos anteriores", una vez.

Opcional, para que un país nuevo aparezca en el mapa al instante y no en menos de
una hora: en `wp-config.php`,
```php
define('RURALANAS_TIENDA_URL', 'https://ruralanas.com');
define('RURALANAS_REVALIDATE_TOKEN', '<el mismo REVALIDATE_TOKEN de la tienda>');
```

## Qué guarda y dónde

- Cada documento es una opción `ruralanas_doc_{nombre}` (sin carga automática).
- Los países con ventas, en `ruralanas_paises_ventas`: el primer pedido pagado
  ("procesando" o "completado") a cada país. Es idempotente; no cuenta pedidos.
- Desactivar el plugin no rompe la tienda: deja de guardar y el sitio muestra el
  contenido escrito en el código. Borrarlo quita el rol; los datos quedan.
- Las noticias viejas armadas con Elementor: la API marca `ruralanas_builder` y
  el admin no deja cambiar su texto (Elementor lo guarda aparte); sí título,
  foto, bajada, categorías y fecha.
