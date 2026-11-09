<?php
// Activa el plugin de contenido en la copia y crea su usuario con una contraseña
// de aplicación. Imprime sólo las líneas para data/web.local.env (ver README):
// la contraseña va directo a ese archivo, fuera de git, y no a la pantalla.
// Se puede volver a correr: reemplaza la contraseña anterior.
require '/var/www/html/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';
$r = activate_plugin('ruralanas-contenido/ruralanas-contenido.php');
if (is_wp_error($r)) { fwrite(STDERR, $r->get_error_message()); exit(1); }
ruralanas_contenido_roles();
$login = 'tienda-contenido';
$user = get_user_by('login', $login);
if (!$user) {
  $id = wp_insert_user(['user_login' => $login, 'user_pass' => wp_generate_password(32), 'user_email' => 'tienda-contenido@staging.test', 'role' => 'ruralanas_contenido', 'display_name' => 'Tienda (contenido)']);
  if (is_wp_error($id)) { fwrite(STDERR, $id->get_error_message()); exit(1); }
  $user = get_user_by('id', $id);
}
$user->set_role('ruralanas_contenido');
foreach (WP_Application_Passwords::get_user_application_passwords($user->ID) as $item) {
  if ($item['name'] === 'Tienda local') WP_Application_Passwords::delete_application_password($user->ID, $item['uuid']);
}
[$password] = WP_Application_Passwords::create_new_application_password($user->ID, ['name' => 'Tienda local']);
echo "CONTENT_WP_USER={$login}\nCONTENT_WP_APP_PASSWORD={$password}\n";
