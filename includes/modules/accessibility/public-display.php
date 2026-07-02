<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_footer', 'eh_a11y_render_panel' );
function eh_a11y_render_panel() {
    ?>
    <div id="eh-a11y-panel" class="eh-a11y-panel">
        <button type="button" class="eh-a11y-close" aria-label="<?php esc_attr_e( 'Fermer', 'engagement-hub' ); ?>">✕</button>
        <h3 class="eh-a11y-title"><?php esc_html_e( 'Accessibilité', 'engagement-hub' ); ?></h3>

        <div class="eh-a11y-row">
            <label for="eh-a11y-lang"><?php esc_html_e( 'Langue de la page', 'engagement-hub' ); ?></label>
            <select id="eh-a11y-lang">
                <option value=""><?php esc_html_e( 'Version originale', 'engagement-hub' ); ?></option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
            </select>
        </div>

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

        <p class="eh-a11y-note"><?php esc_html_e( 'La traduction est fournie par Google et peut différer du texte original.', 'engagement-hub' ); ?></p>

        <!-- Widget Google Traduction, chargé à la demande et piloté par le sélecteur ci-dessus. -->
        <div id="google_translate_element" class="eh-a11y-google-widget"></div>
    </div>
    <?php
}
