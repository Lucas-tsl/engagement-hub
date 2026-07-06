<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_enqueue_scripts', 'eh_sticky_enqueue_assets', 20 );

function eh_sticky_enqueue_assets() {
    // WooCommerce peut être absent sur certaines installs du hub (modules
    // futurs non liés au e-commerce) : on évite un fatal error si is_product()
    // n'existe pas plutôt que de supposer WooCommerce toujours actif.
    if ( ! function_exists( 'is_product' ) || ! is_product() ) {
        return;
    }

    eh_enqueue_style(
        'eh-sticky-css',
        EH_PLUGIN_URL . 'assets/css/sticky-cart.css',
        array(),
        EH_VERSION
    );

    eh_enqueue_script(
        'eh-sticky-js',
        EH_PLUGIN_URL . 'assets/js/sticky-cart.js',
        array( 'jquery' ),
        EH_VERSION,
        true
    );

    wp_localize_script(
        'eh-sticky-js',
        'ehStickyCartI18n',
        array(
            'addToCartText' => __( 'Ajouter au panier - ', 'engagement-hub' ),
            'addingText'    => __( 'Ajout en cours...', 'engagement-hub' ),
            'outOfStockText' => __( 'Rupture de stock', 'engagement-hub' ),
        )
    );
}
