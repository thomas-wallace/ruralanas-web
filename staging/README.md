# Copia de prueba (staging) en tu PC

Un ruralanas.com completo corriendo en Docker, para probar compras de punta a
punta —carrito, checkout de Woo, pagos en modo prueba, stock y mails— sin tocar
el sitio real. Armado el 07-11-2026 a partir de un backup de producción.

| Qué | Dónde |
|---|---|
| La tienda nueva contra la copia | http://localhost:3020 |
| Carrito, checkout y cuenta de Woo | http://localhost:3020/cart/ · /checkout/ · /my-account/ |
| Panel de WordPress de la copia | http://localhost:3020/wp-admin/ |
| Mails que mandó la copia (no salen) | http://localhost:8025 |

## Por qué es seguro

- **No puede hablar con el sitio real.** Dentro del contenedor, `ruralanas.com`
  y sus subdominios apuntan a sí mismo. Dolibarr no se entera de nada: la
  sincronización la hace Dolibarr desde su lado, contra el sitio real.
- **No sale a internet**, salvo a Stripe, Mercado Pago, PayPal y wordpress.org
  (`WP_HTTP_BLOCK_EXTERNAL` en `docker-compose.yml`).
- **Ningún mail llega a nadie**: todos quedan en Mailpit
  (`mu-plugins/ruralanas-staging.php`, que no se puede desactivar desde el panel).
- **Sin credenciales de pago reales.** Al importar se borraron las de PayPal y se
  desactivaron PayPal, Imunify, Site Kit, los de backup/migración y EWWW. Mercado
  Pago no tenía credenciales en producción. Las de prueba se cargan a mano en el
  panel de la copia.
- **La base tiene datos reales de clientes** (pedidos, nombres, mails). La copia
  y `backup/` no se suben a git ni se comparten.

## Arrancar (ya importada)

```bash
cd staging && docker compose up -d     # WordPress, base de datos y Mailpit
npm run staging:web                     # la tienda, en http://localhost:3020
```

La tienda de la copia compila en `.next-staging/`, así puede correr al mismo
tiempo que `npm run dev` sin pisarse.

## Rehacer la copia desde cero

1. Bajar del cPanel a `staging/backup/`:
   - `ruralana_wp119.sql.gz` — Backup → Descargar backup de base de datos.
   - `staging-wp-code.zip` — Administrador de archivos → comprimir `plugins`,
     `themes`, `languages` y `mu-plugins` de `wp-content` **en `/home/ruralana/`,
     nunca dentro de `public_html`**; bajarlo y borrarlo del servidor. Las fotos
     (`uploads`, ~11 GB) no hacen falta: la copia las muestra desde el sitio real.
2. `docker compose down -v` (borra la copia anterior) y `docker compose up -d db`.
3. Importar la base:
   `zcat backup/ruralana_wp119.sql.gz | docker compose exec -T db mariadb -uwordpress -pstaging-solo-local wordpress`
4. Cargar el código en el volumen (descomprimir adentro es mucho más rápido que
   copiar desde Windows):
   ```bash
   docker compose run --rm --no-deps -T -v "$(pwd)/backup:/backup:ro" --entrypoint sh wordpress -c \
     "cp /backup/staging-wp-code.zip /tmp/c.zip && php -r '\$z=new ZipArchive;\$z->open(\"/tmp/c.zip\");\$z->extractTo(\"/var/www/html/wp-content\");' && mkdir -p /var/www/html/wp-content/uploads && chown -R www-data:www-data /var/www/html/wp-content"
   ```
5. **Antes de abrir la copia por primera vez**, neutralizar credenciales y
   plugins riesgosos directo en la base (sin cargar plugins), como se hizo el
   07-11-2026: sacar de `active_plugins` PayPal, Imunify, Site Kit, Duplicator,
   All-in-One WP Migration, WP Migrate DB y EWWW, y borrar las opciones
   `woocommerce_ppcp_api_settings`, `woocommerce-ppcp-settings`,
   `woocommerce_paypal_settings` y el transitorio `ppcp-paypal-bearer`.
6. `docker compose up -d` y `npm run staging:web`.

## Lo que ya se probó (07-11-2026)

- Carrito de la tienda nueva → checkout de Woo con el carrito entero: **funciona**
  desde que la tienda usa la cookie de sesión de Woo en vez del `Cart-Token`
  (ver `COOKIE_SESSION` en `src/lib/commerce/woo/repository.ts`). Antes llegaba
  vacío; no se podía ver sin un origen compartido.
- Pedido #6127 por transferencia: creado, stock descontado (185 → 184), mail al
  cliente y aviso a la tienda atrapados en Mailpit.
