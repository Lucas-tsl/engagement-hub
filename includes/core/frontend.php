<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_enqueue_scripts', 'eh_enqueue_core_assets', 5 );
function eh_enqueue_core_assets() {
    eh_enqueue_style( 'eh-core-css', EH_PLUGIN_URL . 'assets/css/core.css', array(), EH_VERSION );
    eh_enqueue_script( 'eh-core-js', EH_PLUGIN_URL . 'assets/js/core.js', array(), EH_VERSION, true );

    // Le "retour en haut" n'est plus un choix du menu de l'engrenage : voir
    // eh_render_scroll_top_button() plus bas, un bouton indépendant qui
    // apparaît/disparaît tout seul au scroll, sur le même principe que le
    // panneau panier sur une fiche produit.
    $items = array();

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
            'items'              => $items,
            'isProduct'          => function_exists( 'is_product' ) && is_product(),
            'closeLabel'         => __( 'Fermer', 'engagement-hub' ),
            // Seuil du bouton "retour en haut" indépendant (voir
            // eh_render_scroll_top_button plus bas) : 65% de la page
            // défilée, contre 50% quand c'était un choix du menu.
            'scrollTopThreshold' => 65,
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

// Flèche dessinée (voir EH_GEAR_SVG un peu plus haut pour la même logique) :
// un simple trait + chevron, plutôt que l'emoji ↑ dont l'épaisseur/le style
// varie trop d'un système à l'autre pour rester cohérent avec le reste des
// icônes du plugin.
define( 'EH_ARROW_UP_SVG', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>' );

// Bouton "retour en haut" indépendant du FAB : apparaît/disparaît tout seul
// selon la position de scroll (assets/js/core.js), sur le même principe que
// le panneau panier qui s'affiche tout seul sur une fiche produit — pas
// besoin d'ouvrir l'engrenage pour y accéder.
add_action( 'wp_footer', 'eh_render_scroll_top_button', 5 );
function eh_render_scroll_top_button() {
    ?>
    <button type="button" id="eh-scroll-top" class="eh-scroll-top" data-position="<?php echo esc_attr( get_option( 'eh_fab_position', 'right' ) ); ?>" aria-label="<?php esc_attr_e( 'Haut de page', 'engagement-hub' ); ?>">
        <span aria-hidden="true"><?php echo EH_ARROW_UP_SVG; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- constante SVG interne, pas une entrée utilisateur. ?></span>
    </button>
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
