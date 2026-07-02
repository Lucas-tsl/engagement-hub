<?php
if ( ! defined( 'ABSPATH' ) ) exit;

EH_Module_Registry::register(
    'sticky-cart',
    array(
        'label'           => __( 'Ajout au panier', 'engagement-hub' ),
        'icon'            => '🛒',
        'description'     => __( 'Panneau produit (image, variation, ajout au panier) ancré au bouton, qui suit l\'utilisateur sur les fiches produit.', 'engagement-hub' ),
        'option_name'     => 'eh_module_active_sticky-cart',
        'default_active'  => true,
        'fab_action'      => 'open-sticky-panel',
        'fab_condition'   => 'is_product',
        'available'       => true,
    )
);

// Pas de réglages dédiés : l'activation se fait depuis le tableau de bord
// central (page "Engagement Hub"), via l'option 'eh_module_active_sticky-cart'.
if ( EH_Module_Registry::is_active( 'sticky-cart' ) && ! is_admin() ) {
    require_once __DIR__ . '/sticky-frontend.php';
}
