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

// Whitelist stricte : toute valeur inattendue retombe sur 'right' (position
// historique du FAB), plutôt que de laisser passer une chaîne arbitraire.
function eh_sanitize_fab_position( $value ) {
    return ( 'left' === $value ) ? 'left' : 'right';
}

/**
 * Slug du menu admin sous lequel LSG Hub (et ses sous-pages, comme les
 * réglages du module cookies) se rattachent : toujours son propre menu de
 * premier niveau ('eh-main'), indépendant de tout autre plugin.
 */
function eh_admin_parent_slug() {
    return 'eh-main';
}
