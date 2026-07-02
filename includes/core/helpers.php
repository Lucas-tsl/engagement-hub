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
