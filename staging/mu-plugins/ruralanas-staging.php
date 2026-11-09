<?php
/**
 * Plugin Name: Ruralanas · Copia de prueba
 * Description: Sólo existe en la copia local (staging). Manda todo mail a Mailpit y marca el sitio como copia.
 *
 * Un "mu-plugin" se carga siempre y no se puede desactivar desde el panel: es
 * la garantía de que ningún mail de esta copia le llega a un cliente real.
 */

if (!defined('ABSPATH')) {
	exit;
}

// Todo mail sale por el SMTP de Mailpit (http://localhost:8025), que lo
// guarda y no lo entrega a nadie.
add_action('phpmailer_init', function ($mailer) {
	$mailer->isSMTP();
	$mailer->Host = 'mailpit';
	$mailer->Port = 1025;
	$mailer->SMTPAuth = false;
	$mailer->SMTPSecure = '';
	$mailer->SMTPAutoTLS = false;
}, PHP_INT_MAX);

// Las fotos no se copian (son ~11 GB): la copia las muestra desde el sitio
// real, que sólo las sirve. Lo que la copia escriba en uploads queda local.
add_filter('upload_dir', function ($dirs) {
	$real = 'https://ruralanas.com/wp-content/uploads';
	$dirs['url'] = $real . $dirs['subdir'];
	$dirs['baseurl'] = $real;
	return $dirs;
});

// Lo que se sube en la copia (desde el admin de la tienda, por ejemplo) no
// existe en el sitio real: se marca al subirlo y su dirección queda local.
add_action('add_attachment', function ($id) {
	update_post_meta($id, '_ruralanas_staging_local', 1);
});
add_filter('wp_get_attachment_url', function ($url, $id) {
	if (!get_post_meta($id, '_ruralanas_staging_local', true)) {
		return $url;
	}
	return str_replace('https://ruralanas.com/wp-content/uploads', home_url('/wp-content/uploads'), $url);
}, 10, 2);

// WordPress sólo habilita las contraseñas de aplicación con HTTPS. La copia
// corre en http://localhost y la tienda entra con una (CONTENT_WP_USER).
add_filter('wp_is_application_passwords_available', '__return_true');

// Fuera de buscadores, pase lo que pase con los ajustes importados.
add_filter('pre_option_blog_public', fn () => '0');

// Aviso visible en el panel y en el checkout: esto no es la tienda real.
$aviso = function () {
	echo '<div style="position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#5A3F26;color:#F0EEEA;'
		. 'font:13px/1.4 sans-serif;padding:6px 12px;text-align:center">'
		. 'COPIA DE PRUEBA — nada de lo que pase acá afecta a ruralanas.com. Pagos sólo en modo prueba.'
		. '</div>';
};
add_action('admin_footer', $aviso);
add_action('wp_footer', $aviso);
