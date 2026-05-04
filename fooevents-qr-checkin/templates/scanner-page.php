<?php
if (! defined('ABSPATH')) {
    exit;
}
?>
<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FooEvents QR Check-In</title>
    <link rel="manifest" href="<?php echo esc_url($config['manifestUrl']); ?>">
</head>
<body>
<div class="feqc-wrap">
    <h1>FooEvents QR Check-In</h1>
    <video id="feqc-video" autoplay playsinline muted></video>
    <p id="feqc-status"></p>

    <form id="feqc-test-form" class="feqc-row">
        <input id="feqc-ticket-input" type="text" placeholder="Ticket-ID (12-stellig)">
        <select id="feqc-day">
            <?php for ($d = 1; $d <= 30; $d++) : ?>
                <option value="<?php echo esc_attr((string) $d); ?>" <?php selected($d, (int) $config['defaultDay']); ?>><?php echo esc_html((string) $d); ?></option>
            <?php endfor; ?>
        </select>
        <button type="submit">Prüfen</button>
    </form>
</div>
<script>window.FooEventsQrScanner = <?php echo wp_json_encode($config); ?>;</script>
<?php wp_print_styles('fooevents-qr-checkin-app'); ?>
<?php wp_print_scripts('fooevents-qr-checkin-app'); ?>
</body>
</html>
