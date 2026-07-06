<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function eh_enqueue_style( $handle, $src, $deps = array(), $ver = false, $media = 'all' ) {
    wp_enqueue_style( $handle, $src, $deps, $ver, $media );
}

function eh_enqueue_script( $handle, $src, $deps = array(), $ver = false, $in_footer = true ) {
    wp_enqueue_script( $handle, $src, $deps, $ver, $in_footer );
}

function eh_user_can_manage() {
    return current_user_can( 'manage_options' );
}

function eh_sanitize_checkbox( $value ) {
    return empty( $value ) ? 0 : 1;
}

/**
 * Vérifie que le menu "Saito" a réellement été enregistré (présent dans le
 * $menu global de WordPress), pas seulement que sa fonction existe.
 *
 * function_exists('saito_core_create_menu') ne suffit pas : le fichier peut
 * se charger sans erreur alors qu'une autre partie du même plugin (un autre
 * module bogué) empêche l'appel add_menu_page('saito-main', ...) de
 * réellement aboutir pendant le hook 'admin_menu'. S'y fier aveuglément a
 * déjà rendu 'eh-main' inaccessible (rattaché à un parent qui n'existait
 * pas vraiment) le jour où Saito Toolkit avait une erreur fatale ailleurs.
 *
 * Nécessite d'être appelée après que Saito ait eu l'occasion de s'enregistrer
 * (voir la priorité 20 sur 'admin_menu' dans admin-menu.php et
 * cookie-consent/admin-settings.php).
 */
function eh_saito_menu_exists() {
    global $menu;
    if ( empty( $menu ) || ! is_array( $menu ) ) {
        return false;
    }
    foreach ( $menu as $item ) {
        if ( isset( $item[2] ) && 'saito-main' === $item[2] ) {
            return true;
        }
    }
    return false;
}

/**
 * Slug du menu admin sous lequel Engagement Hub (et ses sous-pages, comme
 * les réglages du module cookies) doivent se rattacher : le menu "Saito"
 * s'il est réellement présent, sinon le menu de premier niveau propre à
 * Engagement Hub ('eh-main').
 */
function eh_admin_parent_slug() {
    return eh_saito_menu_exists() ? 'saito-main' : 'eh-main';
}
