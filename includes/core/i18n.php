<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Traduction du plugin pilotée par la langue active détectée via WPML (qui
 * gère lui-même l'URL, quel que soit son format configuré : sous-dossier,
 * sous-domaine ou paramètre), sans dépendre d'un fichier .mo compilé ni
 * d'un plugin de traduction supplémentaire (Loco Translate, etc.).
 *
 * Reste utilisable si le plugin est réinstallé sur un site sans WPML : dans
 * ce cas la langue détectée retombe sur la locale WordPress, et si aucun
 * dictionnaire ne correspond, les chaînes françaises d'origine s'affichent
 * simplement telles quelles (comportement inchangé).
 */
function eh_current_language() {
    if ( has_filter( 'wpml_current_language' ) ) {
        $lang = apply_filters( 'wpml_current_language', null );
        if ( ! empty( $lang ) ) {
            return $lang;
        }
    }
    return substr( get_locale(), 0, 2 );
}

// Intercepte toutes les chaînes du text-domain 'engagement-hub' (que ce soit
// via __(), _e(), esc_html__(), esc_html_e(), esc_attr__() ou esc_attr_e() :
// toutes passent par ce même filtre) pour les remplacer par leur traduction
// si la langue active correspond à un dictionnaire connu.
add_filter( 'gettext', 'eh_translate_strings', 10, 3 );
function eh_translate_strings( $translated, $original, $domain ) {
    if ( 'engagement-hub' !== $domain ) {
        return $translated;
    }

    $dictionaries = array(
        'en' => eh_dictionary_en(),
    );

    $lang = eh_current_language();
    if ( ! isset( $dictionaries[ $lang ] ) ) {
        return $translated;
    }

    $dictionary = $dictionaries[ $lang ];
    return isset( $dictionary[ $original ] ) ? $dictionary[ $original ] : $translated;
}

/**
 * Dictionnaire français → anglais. Reprend exactement les chaînes de
 * languages/engagement-hub-en_US.po (à garder synchronisés si l'un des
 * deux est mis à jour).
 */
function eh_dictionary_en() {
    return array(
        'Haut de page' => 'Back to top',
        'Ouvrir le menu' => 'Open menu',
        "Nous utilisons des cookies pour assurer le bon fonctionnement du site, analyser notre trafic et personnaliser nos publicités. Vous pouvez choisir vos préférences ci-dessous." => 'We use cookies to ensure the site works properly, analyze our traffic, and personalize our ads. You can choose your preferences below.',
        'Consentement cookies' => 'Cookie consent',
        'Bannière RGPD et Google Consent Mode V2, connectée au DataLayer GTM.' => 'GDPR banner and Google Consent Mode V2, connected to the GTM DataLayer.',
        'Logo' => 'Logo',
        'Gérer le consentement' => 'Manage consent',
        'Politique de confidentialité' => 'Privacy policy',
        'Mentions légales' => 'Legal notice',
        'Tout Accepter' => 'Accept All',
        'Tout Refuser' => 'Reject All',
        'Personnaliser' => 'Customize',
        'Préférences des cookies' => 'Cookie preferences',
        'Strictement Nécessaires' => 'Strictly Necessary',
        'Requis pour le site (panier, sécurité). Non désactivables.' => 'Required for the site (cart, security). Cannot be disabled.',
        'Statistiques (Google Analytics)' => 'Statistics (Google Analytics)',
        "Pour mesurer l'audience de la boutique." => "To measure the store's audience.",
        'Marketing (Pixel Facebook, Google Ads)' => 'Marketing (Facebook Pixel, Google Ads)',
        'Pour afficher des publicités ciblées.' => 'To display targeted ads.',
        'Enregistrer mes choix' => 'Save my choices',
        'Annuler' => 'Cancel',
        'Accessibilité' => 'Accessibility',
        'Langue (via WPML), contraste élevé et curseur agrandi.' => 'Language (via WPML), high contrast and enlarged cursor.',
        "Vous n'avez pas les permissions nécessaires pour accéder à cette page." => 'You do not have sufficient permissions to access this page.',
        'Activez ou désactivez les modules pilotés par le bouton flottant du site.' => "Enable or disable the modules driven by the site's floating button.",
        'Module' => 'Module',
        'Description' => 'Description',
        'Actif' => 'Active',
        'Bientôt disponible' => 'Coming soon',
        'Réglages' => 'Settings',
        'Réglages Bannière Cookie' => 'Cookie Banner Settings',
        'Cookies' => 'Cookies',
        'Configuration de la Bannière Cookie (GTM Edition)' => 'Cookie Banner Configuration (GTM Edition)',
        'Note : ce module communique directement avec Google Tag Manager via le Google Consent Mode V2.' => 'Note: this module communicates directly with Google Tag Manager via Google Consent Mode V2.',
        'URL du Logo' => 'Logo URL',
        'Texte de la bannière' => 'Banner text',
        'URL Politique de confidentialité' => 'Privacy Policy URL',
        'URL Mentions légales' => 'Legal Notice URL',
        'Fermer' => 'Close',
        'Langue de la page' => 'Page language',
        'Langues gérées par WPML.' => 'Languages managed by WPML.',
        'Contraste élevé' => 'High contrast',
        'Curseur agrandi' => 'Enlarged cursor',
        'Vidéo à la une' => 'Featured video',
        'Vidéo courte (short/reel) associée à une annonce produit, déclenchable depuis le hub.' => 'Short video (short/reel) linked to a product ad, triggerable from the hub.',
        'Ajout au panier' => 'Add to cart',
        "Panneau produit (image, variation, ajout au panier) ancré au bouton, qui suit l'utilisateur sur les fiches produit." => 'Product panel (image, variation, add to cart) anchored to the button, following the user on product pages.',
        'Ajouter au panier - ' => 'Add to cart - ',
        'Ajout en cours...' => 'Adding...',
        'Rupture de stock' => 'Out of stock',
    );
}
