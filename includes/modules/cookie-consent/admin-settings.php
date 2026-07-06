<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'admin_menu', 'eh_cookie_ajouter_menu' );
function eh_cookie_ajouter_menu() {
    add_submenu_page(
        eh_admin_parent_slug(),
        __( 'Réglages Bannière Cookie', 'engagement-hub' ),
        __( 'Cookies', 'engagement-hub' ),
        'manage_options',
        'eh-cookie-consent',
        'eh_cookie_page_reglages_html'
    );
}

add_action( 'admin_init', 'eh_cookie_enregistrer_parametres' );
function eh_cookie_enregistrer_parametres() {
    register_setting( 'eh_cookie_options_group', 'eh_cookie_logo_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
    register_setting( 'eh_cookie_options_group', 'eh_cookie_texte_banniere', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
    register_setting( 'eh_cookie_options_group', 'eh_cookie_url_politique', array( 'sanitize_callback' => 'esc_url_raw' ) );
    register_setting( 'eh_cookie_options_group', 'eh_cookie_url_mentions', array( 'sanitize_callback' => 'esc_url_raw' ) );
}

function eh_cookie_page_reglages_html() {
    if ( ! eh_user_can_manage() ) {
        wp_die( esc_html__( "Vous n'avez pas les permissions nécessaires pour accéder à cette page.", 'engagement-hub' ) );
    }
    $texte_defaut = eh_cookie_texte_par_defaut();
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'Configuration de la Bannière Cookie (GTM Edition)', 'engagement-hub' ); ?></h1>
        <p><em><?php esc_html_e( 'Note : ce module communique directement avec Google Tag Manager via le Google Consent Mode V2.', 'engagement-hub' ); ?></em></p>
        <form method="post" action="options.php">
            <?php settings_fields( 'eh_cookie_options_group' ); ?>
            <table class="form-table">
                <tr valign="top"><th scope="row"><?php esc_html_e( 'URL du Logo', 'engagement-hub' ); ?></th><td><input type="text" name="eh_cookie_logo_url" value="<?php echo esc_attr( get_option( 'eh_cookie_logo_url', eh_cookie_logo_url_par_defaut() ) ); ?>" class="regular-text" /></td></tr>
                <tr valign="top"><th scope="row"><?php esc_html_e( 'Texte de la bannière', 'engagement-hub' ); ?></th><td><textarea name="eh_cookie_texte_banniere" rows="4" cols="60"><?php echo esc_textarea( get_option( 'eh_cookie_texte_banniere', $texte_defaut ) ); ?></textarea></td></tr>
                <tr valign="top"><th scope="row"><?php esc_html_e( 'URL Politique de confidentialité', 'engagement-hub' ); ?></th><td><input type="text" name="eh_cookie_url_politique" value="<?php echo esc_attr( get_option( 'eh_cookie_url_politique' ) ); ?>" class="regular-text" /></td></tr>
                <tr valign="top"><th scope="row"><?php esc_html_e( 'URL Mentions légales', 'engagement-hub' ); ?></th><td><input type="text" name="eh_cookie_url_mentions" value="<?php echo esc_attr( get_option( 'eh_cookie_url_mentions' ) ); ?>" class="regular-text" /></td></tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
