<?php
/**
 * Plugin Name: LSG Hub
 * Description: Hub d'engagement flottant, propre à Les Senteurs Gourmandes et indépendant de tout autre plugin : consentement cookies (Google Consent Mode V2), ajout au panier, accessibilité (langue, contraste, curseur), et modules futurs (vidéo), pilotés depuis un bouton unique.
 * Version: 1.3.0
 * Author: Troteseil Lucas
 * Author URI: https://github.com/Lucas-tsl
 * Text Domain: engagement-hub
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Sécurité : empêche l'accès direct au fichier
}

define( 'EH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'EH_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'EH_VERSION', '1.3.0' );

// Chargement des traductions
add_action( 'plugins_loaded', 'eh_charger_traductions' );
function eh_charger_traductions() {
    load_plugin_textdomain( 'engagement-hub', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}

// Noyau : registre de modules, helpers, menu admin, bouton flottant (FAB)
require_once EH_PLUGIN_DIR . 'includes/core/class-eh-module-registry.php';
require_once EH_PLUGIN_DIR . 'includes/core/helpers.php';
require_once EH_PLUGIN_DIR . 'includes/core/i18n.php';
require_once EH_PLUGIN_DIR . 'includes/core/admin-menu.php';
require_once EH_PLUGIN_DIR . 'includes/core/frontend.php';

// Modules : chacun s'enregistre auprès du noyau puis charge son propre code
// s'il est actif. Un futur module suit exactement ce même schéma (voir README).
require_once EH_PLUGIN_DIR . 'includes/modules/cookie-consent/module.php';
require_once EH_PLUGIN_DIR . 'includes/modules/sticky-cart/module.php';
require_once EH_PLUGIN_DIR . 'includes/modules/video-ads/module.php';
require_once EH_PLUGIN_DIR . 'includes/modules/accessibility/module.php';
