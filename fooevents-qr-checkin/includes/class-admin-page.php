<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

class Admin_Page
{
    public static function init(): void
    {
        add_action('admin_menu', [__CLASS__, 'register_menu'], 99);
        add_shortcode('fooevents_checkin_qrscanner', [__CLASS__, 'render_shortcode']);
    }

    public static function register_menu(): void
    {
        $capability = self::menu_capability();
        $parent_slug = self::has_menu_slug('fooevents') ? 'fooevents' : 'tools.php';

        add_submenu_page(
            $parent_slug,
            'QR Check-In',
            'QR Check-In',
            $capability,
            'fooevents-qr-checkin',
            [__CLASS__, 'render_admin_page']
        );
    }

    private static function has_menu_slug(string $slug): bool
    {
        global $menu;

        if (! is_array($menu)) {
            return false;
        }

        foreach ($menu as $item) {
            if (($item[2] ?? '') === $slug) {
                return true;
            }
        }

        return false;
    }

    public static function render_admin_page(): void
    {
        if (! self::can_access_scanner()) {
            wp_die(esc_html__('Keine Berechtigung.', 'fooevents-qr-checkin'));
        }

        Assets::enqueue_app();
        $config = self::build_frontend_config();
        $standalone = false;
        require dirname(__DIR__) . '/templates/scanner-page.php';
    }

    public static function render_shortcode(): string
    {
        if (! is_user_logged_in() || ! self::can_access_scanner()) {
            return '<p>' . esc_html__('Bitte einloggen.', 'fooevents-qr-checkin') . '</p>';
        }

        ob_start();
        Assets::enqueue_app();
        $config = self::build_frontend_config();
        $standalone = false;
        require dirname(__DIR__) . '/templates/scanner-page.php';

        return (string) ob_get_clean();
    }

    public static function can_access_scanner(): bool
    {
        return current_user_can('publish_event_magic_tickets')
            || current_user_can('manage_woocommerce')
            || current_user_can('manage_options');
    }

    private static function menu_capability(): string
    {
        foreach (['publish_event_magic_tickets', 'manage_woocommerce', 'manage_options'] as $capability) {
            if (current_user_can($capability)) {
                return $capability;
            }
        }

        return 'manage_options';
    }

    public static function build_frontend_config(): array
    {
        return [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('fooevents-express-check-in-search'),
            'defaultDay' => 1,
            'ticketPattern' => '^\\d{12}$',
            'debug' => false,
            'swUrl' => home_url('/fooevents-checkin-qrscanner-sw.js'),
            'manifestUrl' => home_url('/fooevents-checkin-qrscanner-manifest.webmanifest'),
        ];
    }
}
