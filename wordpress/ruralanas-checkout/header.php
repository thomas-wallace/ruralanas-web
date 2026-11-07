<?php
/**
 * Encabezado: el mismo de la tienda nueva, reducido a lo que sirve mientras se
 * compra. Logo y "volver a la tienda"; nada del menú del sitio viejo.
 */
if (!defined('ABSPATH')) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo('charset'); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex, follow">
	<?php wp_head(); ?>
</head>
<body <?php body_class('rl-body'); ?>>
<?php wp_body_open(); ?>
<header class="rl-header">
	<div class="rl-header__inner">
		<a class="rl-header__logo" href="<?php echo esc_url(ruralanas_checkout_shop_url()); ?>">
			<img src="<?php echo esc_url(get_theme_file_uri('assets/logo-ruralanas.png')); ?>" alt="Ruralanas" width="180" height="40">
		</a>
		<nav class="rl-header__nav" aria-label="<?php echo esc_attr(ruralanas_checkout_t('back')); ?>">
			<span class="rl-header__secure">
				<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>
				<?php echo esc_html(ruralanas_checkout_t('secure')); ?>
			</span>
			<a class="rl-header__back" href="<?php echo esc_url(ruralanas_checkout_shop_url()); ?>">← <?php echo esc_html(ruralanas_checkout_t('back')); ?></a>
		</nav>
	</div>
</header>
