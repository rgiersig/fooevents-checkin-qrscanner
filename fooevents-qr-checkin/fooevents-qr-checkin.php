<?php
/**
 * Plugin Name: FooEvents QR Check-In
 * Description: QR-Scanner als PWA fuer FooEvents Check-In/Check-Out. Benoetigt FooEvents for WooCommerce.
 * Version: 0.1.6
 * Author: 4future QR Scanner development team
 * Text Domain: fooevents-qr-checkin
 */

if (! defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/includes/class-plugin.php';

\FooEventsQrCheckIn\Plugin::init(__FILE__);
register_activation_hook(__FILE__, ['\\FooEventsQrCheckIn\\Plugin', 'activate']);
register_deactivation_hook(__FILE__, ['\\FooEventsQrCheckIn\\Plugin', 'deactivate']);
