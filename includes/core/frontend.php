<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_enqueue_scripts', 'eh_enqueue_core_assets', 5 );
function eh_enqueue_core_assets() {
    eh_enqueue_style( 'eh-core-css', EH_PLUGIN_URL . 'assets/css/core.css', array(), EH_VERSION );
    eh_enqueue_script( 'eh-core-js', EH_PLUGIN_URL . 'assets/js/core.js', array(), EH_VERSION, true );

    // Icône "retour en haut" : toujours proposée par le noyau, visible uniquement
    // après 50% de scroll. Ce n'est pas un module car elle n'a pas d'état activable.
    $items = array(
        array(
            'id'              => 'top',
            'icon'            => '↑',
            'label'           => __( 'Haut de page', 'engagement-hub' ),
            'shortLabel'      => __( 'Haut', 'engagement-hub' ),
            'action'          => 'scroll-top',
            'condition'       => 'scroll',
            'scrollThreshold' => 50,
        ),
    );

    foreach ( EH_Module_Registry::active_modules() as $module_id ) {
        $module = EH_Module_Registry::get( $module_id );
        if ( empty( $module['fab_action'] ) ) {
            continue;
        }
        $items[] = array(
            'id'         => $module_id,
            'icon'       => $module['icon'],
            'iconSvg'    => $module['icon_svg'],
            'label'      => $module['label'],
            // Légende affichée sous l'icône dans le menu du FAB : plus courte
            // que le libellé complet, qui déborderait sous l'icône. Repli sur
            // le libellé complet si un module n'en définit pas.
            'shortLabel' => ! empty( $module['short_label'] ) ? $module['short_label'] : $module['label'],
            'action'     => $module['fab_action'],
            'condition'  => $module['fab_condition'],
        );
    }

    wp_localize_script(
        'eh-core-js',
        'ehHubConfig',
        array(
            'items'      => $items,
            'isProduct'  => function_exists( 'is_product' ) && is_product(),
            'closeLabel' => __( 'Fermer', 'engagement-hub' ),
        )
    );
}

// SVG dessiné plutôt que l'emoji ⚙️, dont le rendu diffère trop d'un
// appareil/navigateur à l'autre (Windows, macOS, Android, iOS) pour rester
// cohérent — même logique que les icônes SVG des modules (class-eh-module-registry.php).
define( 'EH_GEAR_SVG', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' );

// Lien d'évitement dédié : sans lui, un utilisateur clavier doit tabuler à
// travers toute la page avant d'atteindre les réglages (cookies,
// accessibilité, panier), le FAB étant rendu en tout dernier dans le DOM
// (wp_footer). wp_body_open est le point d'ancrage recommandé par WordPress
// pour ce type de lien : la plupart des thèmes l'appellent juste après <body>.
add_action( 'wp_body_open', 'eh_render_skip_to_fab_link' );
function eh_render_skip_to_fab_link() {
    ?>
    <a href="#eh-fab-toggle" class="eh-skip-link"><?php esc_html_e( 'Aller aux réglages (accessibilité, cookies, panier)', 'engagement-hub' ); ?></a>
    <?php
}

add_action( 'wp_footer', 'eh_render_fab_markup', 5 );
function eh_render_fab_markup() {
    // Un seul objet DOM traverse les 3 états (fermé / menu / détail) : voir
    // assets/css/core.css et assets/js/core.js. #eh-fab-detail est le slot
    // partagé où chaque module vient afficher son propre contenu (déplacé ou
    // injecté par assets/js/core.js), plutôt que de flotter indépendamment.
    ?>
    <div id="eh-fab" class="eh-fab" data-state="closed" data-position="<?php echo esc_attr( get_option( 'eh_fab_position', 'right' ) ); ?>">
        <button type="button" id="eh-fab-toggle" class="eh-fab-toggle" aria-expanded="false" aria-label="<?php esc_attr_e( 'Ouvrir le menu', 'engagement-hub' ); ?>">
            <span class="eh-fab-gear" aria-hidden="true"><?php echo EH_GEAR_SVG; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- constante SVG interne, pas une entrée utilisateur. ?></span>
        </button>
        <div id="eh-fab-menu" class="eh-fab-menu" role="menu"></div>
        <div id="eh-fab-detail" class="eh-fab-detail"></div>
    </div>
    <?php
}
