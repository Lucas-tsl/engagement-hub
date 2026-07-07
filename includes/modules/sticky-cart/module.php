<?php
if ( ! defined( 'ABSPATH' ) ) exit;

EH_Module_Registry::register(
    'sticky-cart',
    array(
        'label'           => __( 'Ajout au panier', 'engagement-hub' ),
        'short_label'     => __( 'Panier', 'engagement-hub' ),
        'icon'            => '🛒',
        'icon_svg'        => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1" fill="currentColor" stroke="none"></circle><circle cx="18" cy="20" r="1" fill="currentColor" stroke="none"></circle><path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6"></path></svg>',
        'description'     => __( 'Panneau produit (image, variation, ajout au panier) ancré au bouton, qui suit l\'utilisateur sur les fiches produit.', 'engagement-hub' ),
        'option_name'     => 'eh_module_active_sticky-cart',
        'default_active'  => true,
        // Pas d'icône dans le menu du FAB : le panneau panier s'affiche déjà
        // tout seul au scroll sur une fiche produit (handleStickyVisibility,
        // assets/js/sticky-cart.js) — une entrée manuelle en plus n'apportait
        // rien, seulement une icône de plus à afficher pour rien.
        'fab_action'      => '',
        'fab_condition'   => 'is_product',
        'available'       => true,
    )
);

// Pas de réglages dédiés : l'activation se fait depuis le tableau de bord
// central (page "LSG Hub"), via l'option 'eh_module_active_sticky-cart'.
if ( EH_Module_Registry::is_active( 'sticky-cart' ) && ! is_admin() ) {
    require_once __DIR__ . '/sticky-frontend.php';
}
