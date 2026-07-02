<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_enqueue_scripts', 'eh_enqueue_core_assets', 5 );
function eh_enqueue_core_assets() {
    eh_enqueue_style( 'eh-core-css', EH_PLUGIN_URL . 'assets/css/core.css', array(), EH_VERSION );
    eh_enqueue_script( 'eh-core-js', EH_PLUGIN_URL . 'assets/js/core.js', array(), EH_VERSION, true );

    // Icône "retour en haut" : toujours proposée par le noyau, visible uniquement
    // après 70% de scroll (cf. schéma : "icone flèche -> ouverture si 70% hauteur
    // page dépassé"). Ce n'est pas un module car elle n'a pas d'état activable.
    $items = array(
        array(
            'id'        => 'top',
            'icon'      => '↑',
            'label'     => __( 'Haut de page', 'engagement-hub' ),
            'action'    => 'scroll-top',
            'condition' => 'scroll70',
        ),
    );

    foreach ( EH_Module_Registry::active_modules() as $module_id ) {
        $module = EH_Module_Registry::get( $module_id );
        if ( empty( $module['fab_action'] ) ) {
            continue;
        }
        $items[] = array(
            'id'        => $module_id,
            'icon'      => $module['icon'],
            'label'     => $module['label'],
            'action'    => $module['fab_action'],
            'condition' => $module['fab_condition'],
        );
    }

    wp_localize_script(
        'eh-core-js',
        'ehHubConfig',
        array(
            'items'     => $items,
            'isProduct' => function_exists( 'is_product' ) && is_product(),
        )
    );
}

add_action( 'wp_footer', 'eh_render_fab_markup', 5 );
function eh_render_fab_markup() {
    ?>
    <div id="eh-fab" class="eh-fab">
        <div id="eh-fab-menu" class="eh-fab-menu" role="menu"></div>
        <button type="button" id="eh-fab-toggle" class="eh-fab-toggle" aria-expanded="false" aria-label="<?php esc_attr_e( 'Ouvrir le menu', 'engagement-hub' ); ?>">
            <span class="eh-fab-gear" aria-hidden="true">⚙️</span>
        </button>
    </div>
    <?php
}
