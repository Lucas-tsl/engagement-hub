<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Langues actives fournies par WPML, si le plugin est installé et configuré.
 * On n'utilise que son API officielle (filtre 'wpml_active_languages') :
 * si WPML est absent, ce filtre n'existe pas et renvoie simplement null.
 * Retourne un tableau vide dans ce cas, pour masquer proprement le sélecteur
 * de langue plutôt que d'afficher un choix qui ne ferait rien.
 */
function eh_a11y_get_languages() {
    if ( ! has_filter( 'wpml_active_languages' ) ) {
        return array();
    }
    $languages = apply_filters( 'wpml_active_languages', null, array( 'skip_missing' => 0 ) );
    return is_array( $languages ) ? $languages : array();
}

add_action( 'wp_footer', 'eh_a11y_render_panel' );
function eh_a11y_render_panel() {
    $eh_languages = eh_a11y_get_languages();
    ?>
    <div id="eh-a11y-panel" class="eh-a11y-panel">
        <button type="button" class="eh-a11y-close" aria-label="<?php esc_attr_e( 'Fermer', 'engagement-hub' ); ?>">✕</button>
        <div class="eh-a11y-scroll">
            <h3 class="eh-a11y-title"><?php esc_html_e( 'Accessibilité', 'engagement-hub' ); ?></h3>

            <?php if ( ! empty( $eh_languages ) ) : ?>
            <div class="eh-a11y-row">
                <label for="eh-a11y-lang"><?php esc_html_e( 'Langue de la page', 'engagement-hub' ); ?></label>
                <select id="eh-a11y-lang">
                    <?php foreach ( $eh_languages as $eh_language ) : ?>
                        <option
                            value="<?php echo esc_url( $eh_language['url'] ); ?>"
                            <?php selected( ! empty( $eh_language['active'] ) ); ?>
                        ><?php echo esc_html( $eh_language['translated_name'] ); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <p class="eh-a11y-note"><?php esc_html_e( 'Langues gérées par WPML.', 'engagement-hub' ); ?></p>
            <?php endif; ?>

            <div class="eh-a11y-row">
                <span><?php esc_html_e( 'Contraste élevé', 'engagement-hub' ); ?></span>
                <button type="button" id="eh-a11y-contrast-toggle" class="eh-a11y-switch" aria-pressed="false">
                    <span class="eh-a11y-switch-knob"></span>
                </button>
            </div>

            <div class="eh-a11y-row">
                <span><?php esc_html_e( 'Curseur agrandi', 'engagement-hub' ); ?></span>
                <button type="button" id="eh-a11y-cursor-toggle" class="eh-a11y-switch" aria-pressed="false">
                    <span class="eh-a11y-switch-knob"></span>
                </button>
            </div>
        </div>
    </div>
    <?php
}
