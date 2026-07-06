<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Version du consentement : l'incrémenter force les visiteurs ayant déjà
// répondu (texte de bannière modifié, nouvelle finalité de tracking, etc.)
// à revalider leur choix.
define( 'EH_COOKIE_CONSENT_VERSION', '1' );

// Texte de bannière par défaut, partagé entre l'écran de réglages et l'affichage public
function eh_cookie_texte_par_defaut() {
    return __( "Nous utilisons des cookies pour assurer le bon fonctionnement du site, analyser notre trafic et personnaliser nos publicités. Vous pouvez choisir vos préférences ci-dessous.", 'engagement-hub' );
}

EH_Module_Registry::register(
    'cookie-consent',
    array(
        'label'           => __( 'Consentement cookies', 'engagement-hub' ),
        'icon'            => '🍪',
        'icon_svg'        => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"></circle><circle cx="15.5" cy="15" r="1" fill="currentColor" stroke="none"></circle><circle cx="9" cy="15.5" r="1" fill="currentColor" stroke="none"></circle></svg>',
        'description'     => __( 'Bannière RGPD et Google Consent Mode V2, connectée au DataLayer GTM.', 'engagement-hub' ),
        'option_name'     => 'eh_module_active_cookie-consent',
        'default_active'  => true,
        'fab_action'      => 'open-cookie-modal',
        'fab_condition'   => '',
        'available'       => true,
        'settings_url'    => admin_url( 'admin.php?page=eh-cookie-consent' ),
    )
);

if ( EH_Module_Registry::is_active( 'cookie-consent' ) ) {
    require_once __DIR__ . '/admin-settings.php';
    require_once __DIR__ . '/public-display.php';

    add_action( 'wp_enqueue_scripts', 'eh_cookie_enqueue_assets' );
    function eh_cookie_enqueue_assets() {
        // Le bouton du hub et la modale de préférences restent disponibles
        // après consentement : CSS et JS sont donc toujours nécessaires.
        eh_enqueue_style( 'eh-cookie-css', EH_PLUGIN_URL . 'assets/css/cookie-consent.css', array(), EH_VERSION );
        eh_enqueue_script( 'eh-cookie-js', EH_PLUGIN_URL . 'assets/js/cookie-consent.js', array(), EH_VERSION, true );
        wp_localize_script(
            'eh-cookie-js',
            'ehCookieConfig',
            array( 'consentVersion' => EH_COOKIE_CONSENT_VERSION )
        );
    }
}
