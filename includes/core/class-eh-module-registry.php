<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Registre central des modules du hub. Chaque module s'y déclare une fois
 * (voir includes/modules/*/module.php) ; le menu admin et le bouton flottant
 * du front-end lisent ce registre pour savoir quoi afficher, sans se
 * connaître les uns les autres.
 */
class EH_Module_Registry {

    private static $modules = array();

    public static function register( $id, array $args ) {
        $defaults = array(
            'label'           => $id,
            'icon'            => '⚙️',
            'description'     => '',
            'option_name'     => 'eh_module_active_' . $id,
            'default_active'  => true,
            'settings_url'    => '',
            // Action déclenchée sur le bus d'événements front-end ('eh:action')
            // quand l'icône du module est cliquée dans le menu du bouton flottant.
            'fab_action'      => '',
            // Condition d'affichage de l'icône dans le menu : '' (toujours),
            // 'is_product' (fiche produit) ou 'scroll70' (scroll > 70% de la page).
            'fab_condition'   => '',
            // false = module déclaré mais pas encore développé ("bientôt disponible").
            'available'       => true,
        );

        self::$modules[ $id ] = wp_parse_args( $args, $defaults );
    }

    public static function all() {
        return self::$modules;
    }

    public static function get( $id ) {
        return isset( self::$modules[ $id ] ) ? self::$modules[ $id ] : null;
    }

    public static function is_active( $id ) {
        $module = self::get( $id );
        if ( ! $module || ! $module['available'] ) {
            return false;
        }
        return (bool) get_option( $module['option_name'], $module['default_active'] ? 1 : 0 );
    }

    public static function active_modules() {
        return array_filter(
            array_keys( self::$modules ),
            array( __CLASS__, 'is_active' )
        );
    }
}
