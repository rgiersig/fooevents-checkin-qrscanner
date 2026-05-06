<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/class-admin-page.php';
require_once __DIR__ . '/class-assets.php';
require_once __DIR__ . '/class-pwa.php';

class Plugin
{
    private static string $plugin_file;

    public static function activate(): void
    {
        if (self::is_fooevents_available()) {
            self::register_rewrite();
            Pwa::register_rewrites();
        }

        flush_rewrite_rules();
    }

    public static function deactivate(): void
    {
        flush_rewrite_rules();
    }

    public static function init(string $plugin_file): void
    {
        self::$plugin_file = $plugin_file;

        if (! self::is_fooevents_available()) {
            add_action('admin_notices', [__CLASS__, 'render_missing_fooevents_notice']);
            return;
        }

        add_action('init', [__CLASS__, 'register_rewrite']);
        add_action('template_redirect', [__CLASS__, 'render_frontend_scanner']);
        add_filter('query_vars', [__CLASS__, 'register_query_var']);

        Admin_Page::init();
        Assets::init($plugin_file);
        Pwa::init();
    }

    public static function is_fooevents_available(): bool
    {
        $known_fooevents_plugins = [
            'woocommerce-events/woocommerce-events.php',
            'fooevents/fooevents.php',
            'fooevents-for-woocommerce/fooevents-for-woocommerce.php',
        ];
        $active_plugins = (array) get_option('active_plugins', []);
        $network_plugins = function_exists('get_site_option') ? array_keys((array) get_site_option('active_sitewide_plugins', [])) : [];
        $active_plugins = array_merge($active_plugins, $network_plugins);

        foreach ($known_fooevents_plugins as $plugin) {
            if (in_array($plugin, $active_plugins, true)) {
                return true;
            }
        }

        return current_user_can('publish_event_magic_tickets')
            || post_type_exists('event_magic_tickets')
            || class_exists('FooEvents')
            || class_exists('FooEvents_WooCommerce')
            || defined('FOOEVENTS_VERSION');
    }

    public static function render_missing_fooevents_notice(): void
    {
        if (! current_user_can('activate_plugins')) {
            return;
        }

        echo '<div class="notice notice-error"><p>';
        echo esc_html__('FooEvents QR Check-In ist installiert, laeuft aber erst, wenn FooEvents aktiv ist.', 'fooevents-qr-checkin');
        echo '</p></div>';
    }

    public static function register_rewrite(): void
    {
        add_rewrite_rule('^fooevents-checkin-qrscanner/?$', 'index.php?fooevents_qr_scanner=1', 'top');
    }

    public static function register_query_var(array $vars): array
    {
        $vars[] = 'fooevents_qr_scanner';

        return $vars;
    }

    public static function render_frontend_scanner(): void
    {
        if ((int) get_query_var('fooevents_qr_scanner') !== 1) {
            return;
        }

        if (! is_user_logged_in() || ! current_user_can('publish_event_magic_tickets')) {
            auth_redirect();
        }

        status_header(200);
        nocache_headers();

        $config = Admin_Page::build_frontend_config();
        $standalone = true;
        require dirname(__DIR__) . '/templates/scanner-page.php';
        exit;
    }
}
