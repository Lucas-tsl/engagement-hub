<?php
if ( ! defined( 'ABSPATH' ) ) exit;

EH_Module_Registry::register(
    'accessibility',
    array(
        'label'           => __( 'Accessibilité', 'engagement-hub' ),
        'icon'            => '♿',
        'description'     => __( 'Traduction de la page (Google), contraste élevé et curseur agrandi.', 'engagement-hub' ),
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
