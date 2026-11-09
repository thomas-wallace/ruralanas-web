<?php
/**
 * Plugin Name: Ruralanas · Contenido de la tienda
 * Description: Guarda lo que se edita desde el admin de la tienda nueva (línea de tiempo, campañas, mapa de países) y anota a qué países se vende. Sin pantallas propias: la tienda le habla por la API REST.
 * Version: 0.1.0
 * Requires PHP: 8.1
 * Author: Ruralanas
 *
 * Por qué vive en WordPress: la tienda nueva puede correr en un servidor sin
 * disco propio (Vercel). WordPress ya tiene base de datos, backup y biblioteca
 * de medios, así que el contenido del admin se guarda acá, junto al resto.
 *
 * Qué hace, y nada más:
 *   · Documentos JSON por nombre (`/wp-json/ruralanas/v1/documentos/{nombre}`),
 *     guardados como opciones de WordPress que no se cargan en cada página.
 *   · Países con ventas (`/wp-json/ruralanas/v1/paises-ventas`): cada pedido
 *     pagado anota su país de envío. Es lo que alimenta el mapa de Nosotros.
 *   · Un rol "Ruralanas · Contenido de la tienda" que sólo puede leer y escribir
 *     estos documentos y subir archivos a la biblioteca. Con ese usuario y una
 *     contraseña de aplicación se conecta la tienda: nunca con un administrador.
 *
 * Desactivarlo no rompe la tienda: el admin deja de guardar y el sitio muestra
 * el contenido escrito en el código. Los datos quedan en la base hasta que se
 * borre el plugin.
 */

if (!defined('ABSPATH')) {
	exit;
}

const RURALANAS_CONTENIDO_VERSION = '0.1.0';
const RURALANAS_CONTENIDO_CAP = 'manage_ruralanas_content';
const RURALANAS_CONTENIDO_ROLE = 'ruralanas_contenido';
const RURALANAS_CONTENIDO_DOC = 'ruralanas_doc_';
const RURALANAS_CONTENIDO_VENTAS = 'ruralanas_paises_ventas';
/** Un documento entero no pasa de 1 MB: es texto, las fotos van a la biblioteca. */
const RURALANAS_CONTENIDO_MAX = 1048576;
/** Estados de un pedido pagado. En espera (transferencia sin confirmar) no cuenta. */
const RURALANAS_CONTENIDO_PAGADO = ['processing', 'completed'];

// ── Rol y permiso ────────────────────────────────────────────────────────────

/**
 * Se crea al cargar y no al activar: así también queda bien si el plugin se
 * copia a mano o se actualiza sin pasar por "Activar". Sólo escribe cuando
 * cambia la versión.
 */
add_action('init', 'ruralanas_contenido_roles');

function ruralanas_contenido_roles(): void {
	if (get_option('ruralanas_contenido_roles') === RURALANAS_CONTENIDO_VERSION) {
		return;
	}
	$admin = get_role('administrator');
	if ($admin) {
		$admin->add_cap(RURALANAS_CONTENIDO_CAP);
	}
	remove_role(RURALANAS_CONTENIDO_ROLE);
	add_role(RURALANAS_CONTENIDO_ROLE, 'Ruralanas · Contenido de la tienda', [
		'read'                     => true,
		'upload_files'             => true,
		RURALANAS_CONTENIDO_CAP    => true,
	]);
	update_option('ruralanas_contenido_roles', RURALANAS_CONTENIDO_VERSION, true);
}

register_uninstall_hook(__FILE__, 'ruralanas_contenido_uninstall');

/** Al borrar el plugin (no al desactivarlo) se van el rol y el permiso. Los datos quedan. */
function ruralanas_contenido_uninstall(): void {
	remove_role(RURALANAS_CONTENIDO_ROLE);
	$admin = get_role('administrator');
	if ($admin) {
		$admin->remove_cap(RURALANAS_CONTENIDO_CAP);
	}
	delete_option('ruralanas_contenido_roles');
}

function ruralanas_contenido_can(): bool {
	return current_user_can(RURALANAS_CONTENIDO_CAP);
}

// ── Documentos ───────────────────────────────────────────────────────────────

/**
 * El documento se guarda tal como llega, como texto JSON. Se decodifica sin
 * convertir a arrays de PHP: si no, un objeto vacío `{}` volvería como `[]`.
 */
function ruralanas_contenido_doc_get(WP_REST_Request $request) {
	$raw = get_option(RURALANAS_CONTENIDO_DOC . $request['name'], null);
	if (!is_string($raw)) {
		return ['data' => null, 'updated' => null];
	}
	$stored = json_decode($raw);
	return is_object($stored) ? $stored : ['data' => null, 'updated' => null];
}

function ruralanas_contenido_doc_put(WP_REST_Request $request) {
	$body = $request->get_body();
	if (strlen($body) > RURALANAS_CONTENIDO_MAX) {
		return new WP_Error('ruralanas_too_large', 'El documento pasa de 1 MB.', ['status' => 413]);
	}
	$parsed = json_decode($body);
	if (!is_object($parsed) || !property_exists($parsed, 'data')) {
		return new WP_Error('ruralanas_invalid', 'Se esperaba { "data": … }.', ['status' => 400]);
	}

	$stored = ['data' => $parsed->data, 'updated' => gmdate('c')];
	update_option(
		RURALANAS_CONTENIDO_DOC . $request['name'],
		wp_json_encode($stored, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
		false
	);
	return $stored;
}

// ── Países con ventas ────────────────────────────────────────────────────────

/**
 * `{ "AR": { "since": "2024-03-01", "order": 1234 } }`: el primer pedido pagado
 * a cada país. Anotar es idempotente —un país ya anotado no cambia salvo que
 * aparezca un pedido más viejo—, así que da igual si un pedido pasa por
 * "procesando" y después por "completado", o si se recalcula dos veces.
 */
function ruralanas_contenido_ventas(): array {
	$sales = get_option(RURALANAS_CONTENIDO_VENTAS, []);
	return is_array($sales) ? $sales : [];
}

/** País de envío; si el pedido no tiene (retiro en el local), el de facturación. */
function ruralanas_contenido_pais(WC_Order $order): string {
	$code = strtoupper((string) ($order->get_shipping_country() ?: $order->get_billing_country()));
	return preg_match('/^[A-Z]{2}$/', $code) ? $code : '';
}

/** Suma un pedido a `$sales`. Devuelve true si el país no estaba. */
function ruralanas_contenido_anotar(array &$sales, WC_Order $order): bool {
	$code = ruralanas_contenido_pais($order);
	if ($code === '') {
		return false;
	}
	$date = $order->get_date_paid() ?: $order->get_date_created();
	$day = $date ? $date->date('Y-m-d') : gmdate('Y-m-d');

	$known = $sales[$code] ?? null;
	if ($known && ($known['since'] ?? '9999') <= $day) {
		return false;
	}
	$sales[$code] = ['since' => $day, 'order' => $order->get_id()];
	return $known === null;
}

function ruralanas_contenido_pedido_pagado($order_id): void {
	$order = wc_get_order($order_id);
	if (!$order instanceof WC_Order) {
		return;
	}
	$sales = ruralanas_contenido_ventas();
	$before = $sales;
	$new_country = ruralanas_contenido_anotar($sales, $order);
	if ($sales !== $before) {
		update_option(RURALANAS_CONTENIDO_VENTAS, $sales, false);
	}
	if ($new_country) {
		ruralanas_contenido_avisar_tienda();
	}
}
add_action('woocommerce_order_status_processing', 'ruralanas_contenido_pedido_pagado');
add_action('woocommerce_order_status_completed', 'ruralanas_contenido_pedido_pagado');

/**
 * Le pide a la tienda que vuelva a dibujar el mapa ya, en vez de esperar a su
 * próxima revisión (como mucho una hora). Opcional: hace falta definir en
 * wp-config.php `RURALANAS_TIENDA_URL` y `RURALANAS_REVALIDATE_TOKEN` (el mismo
 * `REVALIDATE_TOKEN` de la tienda). No bloquea el pedido: si falla, no pasa nada.
 */
function ruralanas_contenido_avisar_tienda(): void {
	if (!defined('RURALANAS_TIENDA_URL') || !defined('RURALANAS_REVALIDATE_TOKEN')) {
		return;
	}
	wp_remote_post(untrailingslashit(RURALANAS_TIENDA_URL) . '/api/revalidate', [
		'timeout'  => 3,
		'blocking' => false,
		'headers'  => [
			'content-type'       => 'application/json',
			'x-revalidate-token' => RURALANAS_REVALIDATE_TOKEN,
		],
		'body'     => wp_json_encode(['tags' => ['world-reach']]),
	]);
}

/**
 * Recorre los pedidos pagados de antes de instalar el plugin, de a una página
 * por llamada para no pasar el tiempo máximo del hosting. El admin de la tienda
 * pide la página 1, 2, 3… hasta que `pagina` llega a `paginas`.
 */
function ruralanas_contenido_recalcular(WP_REST_Request $request) {
	if (!function_exists('wc_get_orders')) {
		return new WP_Error('ruralanas_no_woo', 'WooCommerce no está activo.', ['status' => 503]);
	}
	$page = max(1, (int) $request['pagina']);
	$result = wc_get_orders([
		'type'     => 'shop_order',
		'status'   => RURALANAS_CONTENIDO_PAGADO,
		'limit'    => 200,
		'page'     => $page,
		'paginate' => true,
		'orderby'  => 'ID',
		'order'    => 'ASC',
	]);

	$sales = ruralanas_contenido_ventas();
	$before = $sales;
	foreach ($result->orders as $order) {
		if ($order instanceof WC_Order) {
			ruralanas_contenido_anotar($sales, $order);
		}
	}
	if ($sales !== $before) {
		update_option(RURALANAS_CONTENIDO_VENTAS, $sales, false);
	}

	return [
		'pagina'  => $page,
		'paginas' => (int) $result->max_num_pages,
		'pedidos' => (int) $result->total,
		'paises'  => count($sales),
	];
}

// ── Rutas ────────────────────────────────────────────────────────────────────

add_action('rest_api_init', function () {
	register_rest_route('ruralanas/v1', '/documentos/(?P<name>[a-z0-9-]{1,60})', [
		['methods' => 'GET', 'callback' => 'ruralanas_contenido_doc_get', 'permission_callback' => 'ruralanas_contenido_can'],
		['methods' => 'PUT', 'callback' => 'ruralanas_contenido_doc_put', 'permission_callback' => 'ruralanas_contenido_can'],
	]);
	register_rest_route('ruralanas/v1', '/paises-ventas', [
		'methods'             => 'GET',
		'callback'            => fn () => (object) ruralanas_contenido_ventas(),
		'permission_callback' => 'ruralanas_contenido_can',
	]);
	register_rest_route('ruralanas/v1', '/paises-ventas/recalcular', [
		'methods'             => 'POST',
		'callback'            => 'ruralanas_contenido_recalcular',
		'permission_callback' => 'ruralanas_contenido_can',
		'args'                => ['pagina' => ['type' => 'integer', 'default' => 1, 'minimum' => 1]],
	]);
});
