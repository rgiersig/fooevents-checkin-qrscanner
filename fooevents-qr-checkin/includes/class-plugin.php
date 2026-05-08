<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/class-admin-page.php';
require_once __DIR__ . '/class-assets.php';

class Plugin
{
    private static string $plugin_file;

    public static function activate(): void
    {
    }

    public static function deactivate(): void
    {
    }

    public static function init(string $plugin_file): void
    {
        self::$plugin_file = $plugin_file;

        Assets::init($plugin_file);
        Admin_Page::init();

        if (! self::is_express_check_in_available()) {
            add_action('admin_notices', [__CLASS__, 'render_missing_express_notice']);
        }
    }

    public static function is_express_check_in_available(): bool
    {
        $active_plugins = (array) get_option('active_plugins', []);
        $network_plugins = function_exists('get_site_option') ? array_keys((array) get_site_option('active_sitewide_plugins', [])) : [];
        $active_plugins = array_merge($active_plugins, $network_plugins);

        if (in_array('fooevents_express_check_in/fooevents-express-check_in.php', $active_plugins, true)) {
            return true;
        }

        return class_exists('FooEvents_Express_Check_In');
    }

    public static function render_missing_express_notice(): void
    {
        if (! current_user_can('activate_plugins')) {
            return;
        }

        echo '<div class="notice notice-error"><p>';
        echo esc_html__('FooEvents QR Check-In benoetigt ein aktives FooEvents Express Check-in Plugin.', 'fooevents-qr-checkin');
        echo '</p></div>';
    }
}
