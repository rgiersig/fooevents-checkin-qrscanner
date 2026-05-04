<?php

namespace FooEventsQrCheckIn;

if (! defined('ABSPATH')) {
    exit;
}

class Pwa
{
    public static function init(): void
    {
        add_action('init', [__CLASS__, 'register_rewrites']);
        add_action('template_redirect', [__CLASS__, 'serve_assets']);
    }

    public static function register_rewrites(): void
    {
        add_rewrite_rule('^fooevents-checkin-qrscanner-manifest\.webmanifest$', 'index.php?fooevents_qr_manifest=1', 'top');
        add_rewrite_rule('^fooevents-checkin-qrscanner-sw\.js$', 'index.php?fooevents_qr_sw=1', 'top');
        add_filter('query_vars', static function (array $vars): array {
            $vars[] = 'fooevents_qr_manifest';
            $vars[] = 'fooevents_qr_sw';

            return $vars;
        });
    }

    public static function serve_assets(): void
    {
        if ((int) get_query_var('fooevents_qr_manifest') === 1) {
            header('Content-Type: application/manifest+json; charset=utf-8');
            readfile(dirname(__DIR__) . '/assets/manifest.webmanifest');
            exit;
        }

        if ((int) get_query_var('fooevents_qr_sw') === 1) {
            header('Content-Type: application/javascript; charset=utf-8');
            readfile(dirname(__DIR__) . '/assets/service-worker.js');
            exit;
        }
    }
}
