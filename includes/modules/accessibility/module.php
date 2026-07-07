<?php
if ( ! defined( 'ABSPATH' ) ) exit;

EH_Module_Registry::register(
    'accessibility',
    array(
        'label'           => __( 'Accessibilité', 'engagement-hub' ),
        'short_label'     => __( 'Accessibilité', 'engagement-hub' ),
        'icon'            => '♿',
        'icon_svg'        => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none"></circle><path d="M11 6v6h5"></path><path d="M9 12l4 2 3 6"></path><circle cx="9" cy="16" r="5"></circle></svg>',
        'description'     => __( 'Langue (via WPML), contraste élevé et curseur agrandi.', 'engagement-hub' ),
        'option_name'     => 'eh_module_active_accessibility',
        'default_active'  => true,
        'fab_action'      => 'open-accessibility-panel',
        'fab_condition'   => '',
        'available'       => true,
    )
);

if ( EH_Module_Registry::is_active( 'accessibility' ) ) {
    require_once __DIR__ . '/public-display.php';

    add_action( 'wp_enqueue_scripts', 'eh_a11y_enqueue_assets' );
    function eh_a11y_enqueue_assets() {
        // Les libellés sont déjà rendus côté serveur dans public-display.php ;
        // le JS n'a besoin d'aucune chaîne traduite, seulement du comportement.
        eh_enqueue_style( 'eh-a11y-css', EH_PLUGIN_URL . 'assets/css/accessibility.css', array(), EH_VERSION );
        eh_enqueue_script( 'eh-a11y-js', EH_PLUGIN_URL . 'assets/js/accessibility.js', array(), EH_VERSION, true );
    }
}
