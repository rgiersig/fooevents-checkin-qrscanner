<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

class Admin_Page
{
    public static function init(): void
    {
        add_action('admin_menu', [__CLASS__, 'add_menu_item']);
    }

    public static function add_menu_item(): void
    {
        if (current_user_can('publish_event_magic_tickets')) {
            add_submenu_page(
                'fooevents',
                __('QR Check-in', 'fooevents-qr-checkin'),
                __('QR Check-in', 'fooevents-qr-checkin'),
                'edit_posts',
                'fooevents-qr-checkin',
                [__CLASS__, 'display_page']
            );
        }
    }

    public static function display_page(): void
    {
        if (! Plugin::is_express_check_in_available()) {
            echo '<div class="wrap"><h1>QR Check-in</h1><div class="notice notice-error"><p>';
            echo esc_html__('FooEvents QR Check-In benoetigt ein aktives FooEvents Express Check-in Plugin.', 'fooevents-qr-checkin');
            echo '</p></div></div>';
            return;
        }

        $multiday_options = self::build_multiday_options();

        require dirname(__DIR__) . '/templates/qr-check-in.php';
    }

    private static function build_multiday_options(): string
    {
        self::load_plugin_helpers();

        if (
            function_exists('is_plugin_active')
            && function_exists('is_plugin_active_for_network')
            && class_exists('Fooevents_Multiday_Events')
            && (
                is_plugin_active('fooevents_multi_day/fooevents-multi-day.php')
                || is_plugin_active_for_network('fooevents_multi_day/fooevents-multi-day.php')
            )
        ) {
            $fooevents_multiday_events = new \Fooevents_Multiday_Events();

            return '<span>' . $fooevents_multiday_events->display_multiday_express_check_in_options() . '</span>';
        }

        return '';
    }

    private static function load_plugin_helpers(): void
    {
        if (! function_exists('is_plugin_active') || ! function_exists('is_plugin_active_for_network')) {
            require_once ABSPATH . '/wp-admin/includes/plugin.php';
        }
    }
}
