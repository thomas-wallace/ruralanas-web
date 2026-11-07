<?php
/**
 * Ruralanas Checkout — tema mínimo para las páginas de compra de WooCommerce.
 *
 * Desde el lanzamiento, el cliente navega la tienda nueva (Next.js) y WordPress
 * sólo se ve en carrito, checkout, pedido recibido y "Mi cuenta" (D-017). Este
 * tema viste esas páginas con el diseño de la tienda nueva: mismas tipografías,
 * colores, logo y botón. El motor sigue siendo el de Woo, con sus pasarelas.
 *
 * Fuente de verdad del diseño: `src/app/globals.css` de la tienda. Si cambia un
 * color o una tipografía allá, se cambia en `assets/checkout.css`.
 */

if (!defined('ABSPATH')) {
	exit;
}

const RURALANAS_CHECKOUT_VERSION = '0.1.0';

add_action('after_setup_theme', function () {
	add_theme_support('title-tag');
	add_theme_support('woocommerce');
	add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
});

/** Versión de un archivo del tema según su fecha: el navegador no se queda con uno viejo. */
function ruralanas_checkout_asset_version(string $relative): string {
	$file = get_theme_file_path($relative);
	return file_exists($file) ? (string) filemtime($file) : RURALANAS_CHECKOUT_VERSION;
}

add_action('wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'ruralanas-checkout',
		get_theme_file_uri('assets/checkout.css'),
		['woocommerce-general', 'woocommerce-layout'],
		ruralanas_checkout_asset_version('assets/checkout.css')
	);

	// Los estilos de bloques y del editor no se usan en estas páginas.
	wp_dequeue_style('wp-block-library');
	wp_dequeue_style('wp-block-library-theme');
	wp_dequeue_style('global-styles');
	wp_dequeue_style('classic-theme-styles');
}, 20);

// Las tipografías se precargan: son las mismas de la tienda y evitan el salto
// de letra al abrir el checkout.
add_action('wp_head', function () {
	foreach (['cormorant-garamond-latin', 'instrument-sans-latin'] as $font) {
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
			esc_url(get_theme_file_uri("assets/fonts/{$font}.woff2"))
		);
	}
}, 1);

// Sin emojis de WordPress: suma un script y una petición que acá no aportan.
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

/**
 * Idioma de la página según TranslatePress (`/en/…` → inglés). El portugués
 * todavía no existe en el WordPress de producción.
 */
function ruralanas_checkout_lang(): string {
	$locale = function_exists('determine_locale') ? determine_locale() : get_locale();
	return str_starts_with($locale, 'en') ? 'en' : 'es';
}

/** Textos propios del tema. Los de Woo los traduce TranslatePress. */
function ruralanas_checkout_t(string $key): string {
	$texts = [
		'es' => [
			'back'        => 'Volver a la tienda',
			'secure'      => 'Pago seguro',
			'checkout'    => 'Finalizar compra',
			'checkoutLead' => 'Envíos a todo el mundo desde Uruguay. Ves el costo del envío antes de pagar.',
			'cart'        => 'Tu carrito',
			'account'     => 'Tu cuenta',
			'thanks'      => 'Gracias por tu compra',
			'thanksLead'  => 'Cada pieza la tejió a mano una artesana del campo uruguayo. Te escribimos cuando salga tu pedido.',
			'help'        => '¿Dudas con tu compra? Escribinos a contacto@ruralanas.com',
		],
		'en' => [
			'back'        => 'Back to the shop',
			'secure'      => 'Secure payment',
			'checkout'    => 'Checkout',
			'checkoutLead' => 'Worldwide shipping from Uruguay. You see the shipping cost before you pay.',
			'cart'        => 'Your cart',
			'account'     => 'Your account',
			'thanks'      => 'Thank you for your order',
			'thanksLead'  => 'Every piece was hand-knitted by an artisan in rural Uruguay. We will write to you when your order ships.',
			'help'        => 'Questions about your order? Write to contacto@ruralanas.com',
		],
	];
	$lang = ruralanas_checkout_lang();
	return $texts[$lang][$key] ?? $texts['es'][$key] ?? $key;
}

/**
 * Dirección de la tienda nueva en el idioma actual. Se arma desde la opción
 * `home` sin filtros: TranslatePress le agregaría su propio `/en/`.
 */
function ruralanas_checkout_shop_url(): string {
	$home = untrailingslashit((string) get_option('home'));
	return $home . '/' . ruralanas_checkout_lang() . '/tienda';
}

/** Título y bajada de la franja superior según la página de Woo. */
function ruralanas_checkout_heading(): array {
	if (function_exists('is_order_received_page') && is_order_received_page()) {
		return [ruralanas_checkout_t('thanks'), ruralanas_checkout_t('thanksLead')];
	}
	if (function_exists('is_checkout') && is_checkout()) {
		return [ruralanas_checkout_t('checkout'), ruralanas_checkout_t('checkoutLead')];
	}
	if (function_exists('is_cart') && is_cart()) {
		return [ruralanas_checkout_t('cart'), ''];
	}
	if (function_exists('is_account_page') && is_account_page()) {
		return [ruralanas_checkout_t('account'), ''];
	}
	return [get_the_title(), ''];
}

/**
 * Los nombres de producto están cargados en mayúsculas en Woo ("CLARA LA
 * OVEJITA"). La tienda nueva los muestra como "Clara la Ovejita"
 * (`humanizeName` en `src/lib/catalog/woo-text.ts`); acá se aplica la misma
 * regla para que el carrito, el checkout y los mails digan lo mismo. Sólo
 * cambia lo que se muestra: el producto en Woo queda igual.
 *
 * En otro idioma, el nombre se traduce primero con TranslatePress y después se
 * ajustan las mayúsculas. El resultado se marca `data-no-translation`: si no,
 * TranslatePress buscaría la traducción de "Clara la Ovejita" —que no existe,
 * la que tiene es la de "CLARA LA OVEJITA"— y lo dejaría en español.
 */
function ruralanas_checkout_humanize(string $name): string {
	$text = html_entity_decode(wp_strip_all_tags($name), ENT_QUOTES, 'UTF-8');

	global $TRP_LANGUAGE;
	$translated = function_exists('trp_translate') && !empty($TRP_LANGUAGE) && $TRP_LANGUAGE !== 'es_ES';
	if ($translated) {
		$text = trim(html_entity_decode(wp_strip_all_tags(trp_translate($text, null, false)), ENT_QUOTES, 'UTF-8'));
	}

	// Sólo se tocan los nombres que vienen enteros en mayúsculas.
	if (!preg_match('/[a-záéíóúñü]/u', $text)) {
		$minor = ['y', 'de', 'del', 'con', 'la', 'el', 'los', 'las', 'en', 'a', 'para',
			'and', 'of', 'with', 'the', 'for', 'in', 'on', 'an', 'or', 'to'];
		$parts = preg_split('/(\s+|\/)/u', mb_strtolower($text, 'UTF-8'), -1, PREG_SPLIT_DELIM_CAPTURE);
		foreach ($parts as $i => $part) {
			if ($part === '' || preg_match('/^(\s+|\/)$/u', $part) || ($i > 0 && in_array($part, $minor, true))) {
				continue;
			}
			$parts[$i] = mb_strtoupper(mb_substr($part, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($part, 1, null, 'UTF-8');
		}
		$text = implode('', $parts);
	}

	$human = $translated ? '<span data-no-translation>' . esc_html($text) . '</span>' : esc_html($text);
	// Si el nombre venía como enlace (carrito), se conserva el enlace.
	return preg_match('/<a\s[^>]*>/i', $name, $link) ? $link[0] . $human . '</a>' : $human;
}
add_filter('woocommerce_cart_item_name', 'ruralanas_checkout_humanize', 20);
add_filter('woocommerce_order_item_name', 'ruralanas_checkout_humanize', 20);

/**
 * Los enlaces a un producto (en el carrito y en el pedido) van a la ficha de
 * la tienda nueva, no a la página de producto de WordPress, que deja de
 * existir para el público. El slug es el mismo en los dos lados.
 */
function ruralanas_checkout_product_url(?WC_Product $product): string {
	if (!$product) {
		return '';
	}
	$slug = $product->is_type('variation')
		? get_post_field('post_name', $product->get_parent_id())
		: $product->get_slug();
	return $slug ? trailingslashit(ruralanas_checkout_shop_url()) . rawurlencode($slug) : '';
}
add_filter('woocommerce_cart_item_permalink', function ($url, $cart_item) {
	return ruralanas_checkout_product_url($cart_item['data'] ?? null) ?: $url;
}, 20, 2);
add_filter('woocommerce_order_item_permalink', function ($url, $item) {
	return method_exists($item, 'get_product') ? (ruralanas_checkout_product_url($item->get_product() ?: null) ?: $url) : $url;
}, 20, 2);

// "Volver a la tienda" y "Seguir comprando" de Woo llevan a la tienda nueva,
// no a la página /shop/ de WordPress.
add_filter('woocommerce_return_to_shop_redirect', 'ruralanas_checkout_shop_url');
add_filter('woocommerce_continue_shopping_redirect', 'ruralanas_checkout_shop_url');
