<?php
/**
 * Única plantilla del tema. Carrito, checkout, pedido recibido y cuenta son
 * páginas con el shortcode de Woo: se dibuja la franja de título y el contenido.
 */
if (!defined('ABSPATH')) {
	exit;
}

get_header();
[$title, $lead] = ruralanas_checkout_heading();
?>
<main id="contenido" class="rl-main">
	<section class="rl-hero">
		<div class="rl-container">
			<h1 class="rl-hero__title"><?php echo esc_html($title); ?></h1>
			<?php if ($lead) : ?>
				<p class="rl-hero__lead"><?php echo esc_html($lead); ?></p>
			<?php endif; ?>
		</div>
	</section>

	<div class="rl-container rl-content">
		<?php
		while (have_posts()) :
			the_post();
			the_content();
		endwhile;
		?>
	</div>
</main>
<?php
get_footer();
