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
 * Slug du menu admin sous lequel Engagement Hub (et ses sous-pages, comme
 * les réglages du module cookies) doivent se rattacher.
 *
 * Si le plugin "Saito Toolkit" est actif (détecté via sa fonction de menu
 * saito_core_create_menu), tout se range comme sous-menu de son menu "Saito"
 * plutôt que d'ajouter une entrée de plus au premier niveau du back-office.
 * Sinon, Engagement Hub garde son propre menu de premier niveau ('eh-main').
 */
function eh_admin_parent_slug() {
    return function_exists( 'saito_core_create_menu' ) ? 'saito-main' : 'eh-main';
}
