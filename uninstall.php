<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

$eh_options = array(
    // Activation/désactivation des modules (réglage central du hub)
    'eh_module_active_cookie-consent',
    'eh_module_active_sticky-cart',
    'eh_module_active_video-ads',
    'eh_module_active_accessibility',
    // Module Cookie Consent
    'eh_cookie_logo_url',
    'eh_cookie_texte_banniere',
    'eh_cookie_url_politique',
    'eh_cookie_url_mentions',
);

foreach ( $eh_options as $eh_option ) {
    delete_option( $eh_option );
}
