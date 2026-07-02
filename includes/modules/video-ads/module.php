<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Module non développé pour le moment : il ne fait que se déclarer auprès du
// noyau pour apparaître dans le tableau de bord ("Bientôt disponible").
// Pour l'activer un jour : ajouter un fab_action, passer 'available' à true,
// puis créer public-display.php + assets/{css,js}/video-ads.* en suivant
// exactement le schéma du module sticky-cart.
EH_Module_Registry::register(
    'video-ads',
    array(
        'label'           => __( 'Vidéo à la une', 'engagement-hub' ),
        'icon'            => '▶️',
        'description'     => __( "Vidéo courte (short/reel) associée à une annonce produit, déclenchable depuis le hub.", 'engagement-hub' ),
        'option_name'     => 'eh_module_active_video-ads',
        'default_active'  => false,
        'fab_action'      => '',
        'fab_condition'   => '',
        'available'       => false,
    )
);
