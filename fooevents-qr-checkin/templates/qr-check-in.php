<?php

}
?>
<div id="fooevents-express-check-in-wrapper">
    <div class="fooevents-express-check-in-container">
        <h1><?php echo esc_attr__('QR Check-in', 'fooevents-qr-checkin'); ?></h1>

        <div class="fooevents-qr-checkin-camera">
            <video id="fooevents-qr-checkin-video" autoplay playsinline muted></video>
            <p id="fooevents-qr-checkin-status"><?php echo esc_html__('Kamera startet...', 'fooevents-qr-checkin'); ?></p>
        </div>

        <form id="fooevents-express-check-in-search-form">
            <div class="fooevents-express-check-in-search-field-group">
                <span class="fooevents-express-check-in-primary"><label><input type="checkbox" id="fooevents-express-check-in-search" name="fooevents-express-check-in-search" class="fooevents-express-check-in-search fooevents-express-check-in-checkbox-option" value="auto-search" checked> <?php esc_attr_e('Auto Search', 'fooevents-express-check-in'); ?></label></span>
                <span class="fooevents-express-check-in-primary"><label><input type="checkbox" id="fooevents-express-check-in-auto-check-in" name="fooevents-express-check-in-auto-check-in" class="fooevents-express-check-in-auto-check-in fooevents-express-check-in-checkbox-option" value="auto-check-in"> <?php esc_attr_e('Auto Check-in', 'fooevents-express-check-in'); ?></label></span>
                <span class="fooevents-express-check-in-primary"><label><input type="checkbox" id="fooevents-express-check-in-enable-sounds" name="fooevents-express-check-in-enable-sounds" class="fooevents-express-check-in-enable-sounds fooevents-express-check-in-checkbox-option" value="enable-sounds"> <?php esc_attr_e('Audio Alerts', 'fooevents-express-check-in'); ?></label></span>
                <?php echo $multiday_options; ?>
            </div>
            <div class="fooevents-express-check-in-search-fields">
                <input type="text" id="fooevents-express-check-in-value" name="fooevents-express-check-in-value" autocomplete="off" />
                <input type="submit" id="fooevents-express-check-submit" class="button button-primary button-hero" name="fooevents-express-check-submit" value="<?php echo esc_attr__('Search Attendees', 'fooevents-express-check-in'); ?>" />
                <?php wp_nonce_field('fooevents-express-check-in-search', 'fooevents-express-check-in-search-nonce'); ?>
            </div>
        </form>
    </div>
    <div id="fooevents-express-check-in-message-wrapper" class=""></div>
    <div id="fooevents-express-check-in-output"></div>
</div>
