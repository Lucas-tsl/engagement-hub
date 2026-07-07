<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Lit et assainit une valeur de cookie ; retourne null si absente.
function eh_cookie_cookie_value( $nom ) {
    if ( ! isset( $_COOKIE[ $nom ] ) ) {
        return null;
    }
    return sanitize_text_field( wp_unslash( $_COOKIE[ $nom ] ) );
}

// Injection du Google Consent Mode V2 (AVANT GTM, très important de garder ce JS ici dans le <head>)
add_action( 'wp_head', 'eh_cookie_inject_consent_mode', 1 );
function eh_cookie_inject_consent_mode() {
    ?>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}

        var ehConsentVersion = document.cookie.match(/(?:^|; )bcc_consent_version=([^;]*)/);
        var ehHasConsent = document.cookie.indexOf('bcc_consent_all=') !== -1
            && ehConsentVersion !== null
            && ehConsentVersion[1] === '<?php echo esc_js( EH_COOKIE_CONSENT_VERSION ); ?>';
        var ehStats = document.cookie.indexOf('bcc_consent_stats=1') !== -1 ? 'granted' : 'denied';
        var ehMkt = document.cookie.indexOf('bcc_consent_mkt=1') !== -1 ? 'granted' : 'denied';

        gtag('consent', 'default', {
            'ad_storage': ehHasConsent ? ehMkt : 'denied',
            'ad_user_data': ehHasConsent ? ehMkt : 'denied',
            'ad_personalization': ehHasConsent ? ehMkt : 'denied',
            'analytics_storage': ehHasConsent ? ehStats : 'denied',
            // Le délai n'a d'utilité que le temps de laisser un nouveau visiteur
            // répondre à la bannière ; inutile de ralentir GTM pour un visiteur
            // dont le choix est déjà connu.
            'wait_for_update': ehHasConsent ? 0 : 500
        });
    </script>
    <?php
}

// Lien de gestion des cookies utilisable n'importe où (typiquement le footer
// du site) : [eh_cookie_preferences_link] ou [eh_cookie_preferences_link
// text="Gérer les cookies"]. Le seul point d'entrée existant jusqu'ici pour
// rouvrir les préférences était l'icône 🍪 du bouton flottant, deux clics
// sans le repère visuel qu'un visiteur attend habituellement (un lien dédié
// en pied de page).
add_shortcode( 'eh_cookie_preferences_link', 'eh_cookie_preferences_link_shortcode' );
function eh_cookie_preferences_link_shortcode( $atts ) {
    $atts = shortcode_atts(
        array( 'text' => __( 'Gérer les cookies', 'engagement-hub' ) ),
        $atts,
        'eh_cookie_preferences_link'
    );
    return '<a href="#" class="eh-cookie-preferences-link">' . esc_html( $atts['text'] ) . '</a>';
}

// Affichage HTML de la bannière et de la modale de préférences.
// Le bouton de réouverture après consentement est désormais le bouton
// flottant central du hub (icône 🍪 dans includes/core/frontend.php),
// qui déclenche l'événement 'eh:action' écouté dans assets/js/cookie-consent.js.
add_action( 'wp_footer', 'eh_cookie_afficher_banniere' );
function eh_cookie_afficher_banniere() {
    $logo          = get_option( 'eh_cookie_logo_url', eh_cookie_logo_url_par_defaut() );
    $texte         = get_option( 'eh_cookie_texte_banniere', eh_cookie_texte_par_defaut() );
    $url_politique = get_option( 'eh_cookie_url_politique', '#' );
    $url_mentions  = get_option( 'eh_cookie_url_mentions', '#' );

    $choix_fait = null !== eh_cookie_cookie_value( 'bcc_consent_all' )
        && eh_cookie_cookie_value( 'bcc_consent_version' ) === EH_COOKIE_CONSENT_VERSION;
    ?>

    <div id="bcc-banner-card" class="bcc-banner-card" role="region" aria-labelledby="bcc-banner-title" style="display: <?php echo $choix_fait ? 'none' : 'block'; ?>;">
        <?php if ( ! empty( $logo ) ) : ?><img src="<?php echo esc_url( $logo ); ?>" alt="<?php esc_attr_e( 'Logo', 'engagement-hub' ); ?>" class="bcc-logo" /><?php endif; ?>
        <h3 class="bcc-title" id="bcc-banner-title"><?php esc_html_e( 'Gérer le consentement', 'engagement-hub' ); ?></h3>
        <p class="bcc-desc"><?php echo nl2br( esc_html( $texte ) ); ?></p>
        <div class="bcc-links">
            <a href="<?php echo esc_url( $url_politique ); ?>"><?php esc_html_e( 'Politique de confidentialité', 'engagement-hub' ); ?></a> | <a href="<?php echo esc_url( $url_mentions ); ?>"><?php esc_html_e( 'Mentions légales', 'engagement-hub' ); ?></a>
        </div>
        <?php /* "Tout Accepter" et "Tout Refuser" à même niveau, même poids visuel :
                 la CNIL exige une prééminence équivalente entre les deux (recommandations
                 2020). "Personnaliser" reste un choix possible mais secondaire. */ ?>
        <div class="bcc-actions">
            <button id="bcc-btn-accepter" class="bcc-btn bcc-btn-accepter"><?php esc_html_e( 'Tout Accepter', 'engagement-hub' ); ?></button>
            <button id="bcc-btn-refuser" class="bcc-btn bcc-btn-refuser"><?php esc_html_e( 'Tout Refuser', 'engagement-hub' ); ?></button>
        </div>
        <button id="bcc-btn-prefs" class="bcc-btn-link"><?php esc_html_e( 'Personnaliser mes choix', 'engagement-hub' ); ?></button>
    </div>

    <div id="bcc-modal-overlay" class="bcc-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bcc-modal-title">
        <div class="bcc-modal" tabindex="-1">
            <button type="button" class="bcc-modal-close" aria-label="<?php esc_attr_e( 'Fermer', 'engagement-hub' ); ?>">✕</button>
            <div class="bcc-modal-scroll">
                <h3 class="bcc-title" id="bcc-modal-title"><?php esc_html_e( 'Préférences des cookies', 'engagement-hub' ); ?></h3>
                <div class="bcc-cookie-type">
                    <label for="chk-necessaires">
                        <strong><?php esc_html_e( 'Strictement Nécessaires', 'engagement-hub' ); ?></strong>
                        <p class="bcc-desc"><?php esc_html_e( 'Requis pour le site (panier, sécurité). Non désactivables.', 'engagement-hub' ); ?></p>
                    </label>
                    <input type="checkbox" id="chk-necessaires" checked disabled>
                </div>
                <div class="bcc-cookie-type">
                    <label for="chk-stats">
                        <strong><?php esc_html_e( 'Statistiques (Google Analytics)', 'engagement-hub' ); ?></strong>
                        <p class="bcc-desc"><?php esc_html_e( "Pour mesurer l'audience de la boutique.", 'engagement-hub' ); ?></p>
                    </label>
                    <input type="checkbox" id="chk-stats" <?php echo ( '1' === eh_cookie_cookie_value( 'bcc_consent_stats' ) ) ? 'checked' : ''; ?>>
                </div>
                <div class="bcc-cookie-type">
                    <label for="chk-mkt">
                        <strong><?php esc_html_e( 'Marketing (Pixel Facebook, Google Ads)', 'engagement-hub' ); ?></strong>
                        <p class="bcc-desc"><?php esc_html_e( 'Pour afficher des publicités ciblées.', 'engagement-hub' ); ?></p>
                    </label>
                    <input type="checkbox" id="chk-mkt" <?php echo ( '1' === eh_cookie_cookie_value( 'bcc_consent_mkt' ) ) ? 'checked' : ''; ?>>
                </div>
                <div class="bcc-actions" style="margin-top: 20px;">
                    <button id="bcc-btn-save-prefs" class="bcc-btn bcc-btn-accepter"><?php esc_html_e( 'Enregistrer mes choix', 'engagement-hub' ); ?></button>
                    <button id="bcc-btn-close-modal" class="bcc-btn bcc-btn-refuser"><?php esc_html_e( 'Annuler', 'engagement-hub' ); ?></button>
                </div>
            </div>
        </div>
    </div>
    <?php
}
