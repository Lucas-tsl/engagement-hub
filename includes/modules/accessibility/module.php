<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Module non développé pour le moment : il ne fait que se déclarer auprès du
// noyau pour apparaître dans le tableau de bord ("Bientôt disponible").
// Pour l'activer un jour : ajouter un fab_action, passer 'available' à true,
// puis créer public-display.php + assets/{css,js}/accessibility.* en suivant
// exactement le schéma du module sticky-cart.
EH_Module_Registry::register(
    'accessibility',
    array(
        'label'           => __( 'Accessibilité', 'engagement-hub' ),
        'icon'            => '♿',
        'description'     => __( 'Réglages de langue, police et contraste pour les visiteurs.', 'engagement-hub' ),
        'option_name'     => 'eh_module_active_accessibility',
        'default_active'  => false,
        'fab_action'      => '',
        'fab_condition'   => '',
        'available'       => false,
    )
);
