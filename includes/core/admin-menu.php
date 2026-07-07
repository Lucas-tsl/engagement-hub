<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Menu de premier niveau propre au plugin, entièrement indépendant : ne se
// rattache à aucun autre plugin/menu (ex. un éventuel "Saito Toolkit").
add_action( 'admin_menu', 'eh_add_admin_menu' );
function eh_add_admin_menu() {
    add_menu_page(
        __( 'LSG Hub', 'engagement-hub' ),
        __( 'LSG Hub', 'engagement-hub' ),
        'manage_options',
        'eh-main',
        'eh_render_dashboard_page',
        'dashicons-admin-generic',
        58
    );
}

// Chaque module a sa propre option d'activation, déclarée ici en une seule
// fois pour tous les modules du registre.
add_action( 'admin_init', 'eh_register_module_settings' );
function eh_register_module_settings() {
    foreach ( EH_Module_Registry::all() as $module ) {
        register_setting(
            'eh_modules_group',
            $module['option_name'],
            array(
                'type'              => 'integer',
                'sanitize_callback' => 'eh_sanitize_checkbox',
                'default'           => $module['default_active'] ? 1 : 0,
            )
        );
    }

    // Position du bouton flottant : un widget tiers (chat, WhatsApp...) est
    // très souvent logé en bas-droite sur les sites e-commerce, d'où ce
    // réglage pour éviter toute collision visuelle.
    register_setting(
        'eh_modules_group',
        'eh_fab_position',
        array(
            'type'              => 'string',
            'sanitize_callback' => 'eh_sanitize_fab_position',
            'default'           => 'right',
        )
    );
}

function eh_render_dashboard_page() {
    if ( ! eh_user_can_manage() ) {
        wp_die( esc_html__( "Vous n'avez pas les permissions nécessaires pour accéder à cette page.", 'engagement-hub' ) );
    }
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'LSG Hub', 'engagement-hub' ); ?></h1>
        <p><?php esc_html_e( 'Activez ou désactivez les modules pilotés par le bouton flottant du site.', 'engagement-hub' ); ?></p>
        <form method="post" action="options.php">
            <?php settings_fields( 'eh_modules_group' ); ?>
            <table class="widefat striped" style="max-width: 900px;">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th><?php esc_html_e( 'Module', 'engagement-hub' ); ?></th>
                        <th><?php esc_html_e( 'Description', 'engagement-hub' ); ?></th>
                        <th style="width: 90px;"><?php esc_html_e( 'Actif', 'engagement-hub' ); ?></th>
                        <th style="width: 110px;"></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( EH_Module_Registry::all() as $module ) : ?>
                    <tr>
                        <td style="font-size: 20px;"><?php echo esc_html( $module['icon'] ); ?></td>
                        <td>
                            <strong><?php echo esc_html( $module['label'] ); ?></strong>
                            <?php if ( ! $module['available'] ) : ?>
                                <br /><em><?php esc_html_e( 'Bientôt disponible', 'engagement-hub' ); ?></em>
                            <?php endif; ?>
                        </td>
                        <td><?php echo esc_html( $module['description'] ); ?></td>
                        <td>
                            <input type="hidden" name="<?php echo esc_attr( $module['option_name'] ); ?>" value="0" />
                            <input
                                type="checkbox"
                                name="<?php echo esc_attr( $module['option_name'] ); ?>"
                                value="1"
                                <?php checked( 1, get_option( $module['option_name'], $module['default_active'] ? 1 : 0 ) ); ?>
                                <?php disabled( ! $module['available'] ); ?>
                            />
                        </td>
                        <td>
                            <?php if ( ! empty( $module['settings_url'] ) ) : ?>
                                <a href="<?php echo esc_url( $module['settings_url'] ); ?>"><?php esc_html_e( 'Réglages', 'engagement-hub' ); ?></a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <h2><?php esc_html_e( 'Position du bouton flottant', 'engagement-hub' ); ?></h2>
            <p>
                <label for="eh_fab_position"><?php esc_html_e( 'Coin de l\'écran', 'engagement-hub' ); ?></label><br />
                <select name="eh_fab_position" id="eh_fab_position">
                    <option value="right" <?php selected( 'right', get_option( 'eh_fab_position', 'right' ) ); ?>><?php esc_html_e( 'Bas droite (par défaut)', 'engagement-hub' ); ?></option>
                    <option value="left" <?php selected( 'left', get_option( 'eh_fab_position', 'right' ) ); ?>><?php esc_html_e( 'Bas gauche', 'engagement-hub' ); ?></option>
                </select>
            </p>
            <p class="description"><?php esc_html_e( 'À changer si un autre widget flottant (chat, WhatsApp...) occupe déjà le bas droite du site.', 'engagement-hub' ); ?></p>

            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
