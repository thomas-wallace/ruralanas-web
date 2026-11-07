<?php
/** Pie: discreto, como el cierre de la tienda nueva. */
if (!defined('ABSPATH')) {
	exit;
}
?>
<footer class="rl-footer">
	<div class="rl-footer__inner">
		<span><?php echo esc_html(ruralanas_checkout_t('help')); ?></span>
		<span>© <?php echo esc_html(gmdate('Y')); ?> Ruralanas · Tejemos calidad de vida</span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
