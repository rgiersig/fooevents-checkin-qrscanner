<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

class Assets
{
    private static string $plugin_url;

    public static function init(string $plugin_file): void
    {
        self::$plugin_url = plugin_dir_url($plugin_file);

        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_admin']);
    }

    public static function enqueue_admin(string $hook_suffix): void
    {
        if (substr($hook_suffix, -strlen('_page_fooevents-qr-checkin')) !== '_page_fooevents-qr-checkin') {
            return;
        }

        self::enqueue_app();
    }

    public static function enqueue_app(): void
    {
        wp_enqueue_style('fooevents-qr-checkin-app', self::$plugin_url . 'assets/app.css', [], '0.2.0');
        wp_enqueue_script('fooevents-qr-checkin-jsqr', self::$plugin_url . 'assets/vendor/jsQR.js', [], '1.4.0', true);
        wp_enqueue_script('fooevents-qr-checkin-app', self::$plugin_url . 'assets/app.js', ['jquery', 'fooevents-qr-checkin-jsqr'], '0.2.0', true);
        wp_localize_script('fooevents-qr-checkin-app', 'FooEventsExpressObj', [
            'successTicketText' => __('SUCCESS: Ticket', 'fooevents-express-check-in'),
            'hasBeenUpdatedText' => __(' has been updated.', 'fooevents-express-check-in'),
            'soundsURL' => self::express_sounds_url(),
            'soundsEnable' => get_option('globalWooCommerceEventsExpressSounds'),
        ]);
    }

    private static function express_sounds_url(): string
    {
        $express_plugin_file = WP_PLUGIN_DIR . '/fooevents_express_check_in/fooevents-express-check_in.php';

        if (file_exists($express_plugin_file)) {
            return plugins_url('sounds/', $express_plugin_file);
        }

        return self::$plugin_url . 'assets/';
    }
}
