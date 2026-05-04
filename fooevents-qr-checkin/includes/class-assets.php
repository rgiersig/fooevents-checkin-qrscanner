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
        add_action('wp_enqueue_scripts', [__CLASS__, 'enqueue_frontend']);
    }

    public static function enqueue_admin(string $hook_suffix): void
    {
        if (substr($hook_suffix, -strlen('_page_fooevents-qr-checkin')) !== '_page_fooevents-qr-checkin') {
            return;
        }

        self::enqueue();
    }

    public static function enqueue_frontend(): void
    {
        if ((int) get_query_var('fooevents_qr_scanner') === 1) {
            self::enqueue();
            return;
        }

        global $post;
        if ($post && has_shortcode((string) $post->post_content, 'fooevents_checkin_qrscanner')) {
            self::enqueue();
        }
    }

    private static function enqueue(): void
    {
        wp_enqueue_style('fooevents-qr-checkin-app', self::$plugin_url . 'assets/app.css', [], '0.1.2');
        wp_enqueue_script('fooevents-qr-checkin-app', self::$plugin_url . 'assets/app.js', [], '0.1.2', true);
    }
}
