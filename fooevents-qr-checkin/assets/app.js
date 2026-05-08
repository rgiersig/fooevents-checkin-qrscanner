(function ($) {
  var multiday = false;
  var day = 1;
  var nonceVal = $('input[name=fooevents-express-check-in-search-nonce]').val();
  var inputTimer;
  var finishTypingTime = 800;
  var $input = $('#fooevents-express-check-in-value');

  $('#fooevents-express-check-in-search').change(function () {
    fooevents_express_check_in_search_check();
  });

  setTimeout(function () {
    $input.focus();
  }, 0);

  fooevents_express_check_in_search_check();

  if ($('#fooevents-express-check-in-day').length) {
    multiday = true;
    day = $('#fooevents-express-check-in-day').val();

    $('#fooevents-express-check-in-day').on('change', function () {
      day = $('#fooevents-express-check-in-day').val();
    });
  }

  $input.on('keyup', function () {
    clearTimeout(inputTimer);
    if ($('#fooevents-express-check-in-search').is(':checked')) {
      inputTimer = setTimeout(fooevents_express_check_in_search, finishTypingTime, $input.val(), multiday, day, nonceVal);
    }
  });

  $input.on('keydown', function () {
    clearTimeout(inputTimer);
  });

  $('#fooevents-express-check-in-search-form').on('submit', function () {
    fooevents_express_check_in_search($input.val(), multiday, day, nonceVal);
    return false;
  });

  $('#fooevents-express-check-submit').on('click', function () {
    fooevents_express_check_in_search($input.val(), multiday, day, nonceVal);
    return false;
  });

  $('.fooevents-express-check-in-checkbox-option').on('change', function () {
    setTimeout(function () {
      $input.focus();
    }, 0);
  });

  $('#fooevents-express-check-in-output').delegate('.fooevents-express-check-in-control', 'click', function () {
    fooevents_express_check_in_change_status($(this).attr('id'), multiday, day, nonceVal);
    setTimeout(function () {
      $input.focus();
    }, 0);
  });

  $('#fooevents-express-check-in-message-wrapper').delegate('.fooevents-express-check-in-undo', 'click', function () {
    var data = {
      action: 'undo_check_in',
      value: $(this).attr('id'),
      multiday: multiday,
      day: day,
      'fooevents-express-check-in-search-nonce': nonceVal
    };

    $.post(ajaxurl, data, function (response) {
      var obj = $.parseJSON(response);

      if (obj.status === 'success') {
        $('<div class="notice notice-success is-dismissible fooevents-express-check-in-message-success fooevents-express-check-in-message-' + obj.status + '"><p>' + obj.status_message + '</p></div>')
          .appendTo('#fooevents-express-check-in-message-wrapper')
          .delay(6000)
          .fadeOut('slow');
      }
    });

    return false;
  });

  $('#fooevents-express-check-in-output').delegate('.fooevents-express-check-in-show-actions', 'click', function () {
    $(this).closest('tr').find('.fooevents-express-check-in-actions-group').toggle();
  });

  bootQrScanner(function (ticketValue) {
    $input.val(ticketValue);

    if ($('#fooevents-express-check-in-search').is(':checked')) {
      fooevents_express_check_in_search(ticketValue, multiday, day, nonceVal);
      return;
    }

    $input.focus();
  });
})(jQuery);

function fooevents_express_check_in_search_check() {
  if (!jQuery('#fooevents-express-check-in-search').length) {
    return false;
  }

  if (jQuery('#fooevents-express-check-in-search').is(':checked')) {
    jQuery('#fooevents-express-check-submit').prop('disabled', true);
    return true;
  }

  jQuery('#fooevents-express-check-submit').prop('disabled', false);
  return false;
}

function fooevents_express_check_in_search(value, multiday, day, nonceVal) {
  jQuery('#fooevents-express-check-in-value').prop('disabled', true);
  jQuery('#fooevents-express-check-in-value').addClass('fooevents-express-check-in-loading');
  jQuery('#fooevents-express-check-in-output').html('');

  var data = {
    action: 'fooevents_perform_search',
    value: value,
    multiday: multiday,
    'fooevents-express-check-in-search-nonce': nonceVal,
    day: day
  };

  jQuery.post(ajaxurl, data, function (response) {
    jQuery('#fooevents-express-check-in-output').html(response);
  });

  if (jQuery('#fooevents-express-check-in-auto-check-in').is(':checked')) {
    fooevents_express_check_in_change_status_auto_complete(value, multiday, day, nonceVal);
  }

  jQuery('#fooevents-express-check-in-value').focus(function () {
    jQuery(this).select();
  });

  jQuery('#fooevents-express-check-in-value').val('');
  setTimeout(function () {
    jQuery('#fooevents-express-check-in-value').focus();
  }, 0);

  jQuery('#fooevents-express-check-in-value').removeClass('fooevents-express-check-in-loading');
  jQuery('#fooevents-express-check-in-value').prop('disabled', false);
}

function fooevents_express_check_in_change_status(controlId, multiday, day, nonceVal) {
  var data = {
    action: 'change_ticket_status',
    value: controlId,
    multiday: multiday,
    day: day,
    'fooevents-express-check-in-search-nonce': nonceVal
  };

  jQuery.post(ajaxurl, data, function (response) {
    var enableSounds = jQuery('#fooevents-express-check-in-enable-sounds').is(':checked');
    var obj = jQuery.parseJSON(response);

    if (obj.status === 'success') {
      if (enableSounds) {
        new Audio(FooEventsExpressObj.soundsURL + 'fooevents-success.mp3').play();
      }

      if (obj.message === 'Checked In') {
        jQuery('#' + obj.ID).removeClass('button-primary');
        jQuery('#fooevents-express-check-in-status-' + obj.ticket).removeClass('fooevents-express-check-in-status-not-checked-in fooevents-express-check-in-status-canceled').addClass('fooevents-express-check-in-status-checked-in');
      }

      if (obj.message === 'Not Checked In') {
        jQuery('#fooevents-express-check-in-confirm-' + obj.ticket).addClass('button-primary');
        jQuery('#fooevents-express-check-in-status-' + obj.ticket).removeClass('fooevents-express-check-in-status-checked-in fooevents-express-check-in-status-canceled').addClass('fooevents-express-check-in-status-not-checked-in');
      }

      if (obj.message === 'Canceled') {
        jQuery('#fooevents-express-check-in-confirm-' + obj.ticket).addClass('button-primary');
        jQuery('#fooevents-express-check-in-status-' + obj.ticket).removeClass('fooevents-express-check-in-status-checked-in fooevents-express-check-in-status-canceled').addClass('fooevents-express-check-in-status-canceled');
      }

      jQuery('#fooevents-express-check-in-status-' + obj.ticket).html(obj.message);
      jQuery('<div class="notice notice-success is-dismissible fooevents-express-check-in-message-success fooevents-express-check-in-message-' + obj.status + '"><p>' + FooEventsExpressObj.successTicketText + ' #' + obj.ticketID + FooEventsExpressObj.hasBeenUpdatedText + '</p></div>')
        .appendTo('#fooevents-express-check-in-message-wrapper')
        .delay(6000)
        .fadeOut('slow');
      return;
    }

    if (enableSounds) {
      new Audio(FooEventsExpressObj.soundsURL + 'fooevents-error.mp3').play();
    }

    jQuery('<div class="notice notice-error is-dismissible fooevents-express-check-in-message-error fooevents-express-check-in-message-' + obj.status + '"><p>' + obj.status_message + '</p></div>')
      .appendTo('#fooevents-express-check-in-message-wrapper')
      .delay(6000)
      .fadeOut('slow');
  });
}

function fooevents_express_check_in_change_status_auto_complete(value, multiday, day, nonceVal) {
  var data = {
    action: 'change_ticket_status_auto_complete',
    value: value,
    multiday: multiday,
    day: day,
    'fooevents-express-check-in-search-nonce': nonceVal
  };

  jQuery.post(ajaxurl, data, function (response) {
    var enableSounds = jQuery('#fooevents-express-check-in-enable-sounds').is(':checked');
    var obj = jQuery.parseJSON(response);

    if (obj.status === 'success') {
      if (enableSounds) {
        new Audio(FooEventsExpressObj.soundsURL + 'fooevents-success.mp3').play();
      }

      jQuery('<div class="notice notice-success is-dismissible fooevents-express-check-in-message-success fooevents-express-check-in-message-' + obj.status + '"><p>' + obj.status_message + '</p></div>')
        .appendTo('#fooevents-express-check-in-message-wrapper')
        .delay(6000)
        .fadeOut('slow');
      jQuery('#fooevents-express-check-in-confirm-' + obj.ticket).removeClass('button-primary');
      jQuery('#fooevents-express-check-in-status-' + obj.ticket).html(obj.message);
      return;
    }

    if (enableSounds) {
      new Audio(FooEventsExpressObj.soundsURL + 'fooevents-error.mp3').play();
    }

    jQuery('<div class="notice notice-error is-dismissible fooevents-express-check-in-message-error fooevents-express-check-in-message-' + obj.status + '"><p>' + obj.status_message + '</p></div>')
      .appendTo('#fooevents-express-check-in-message-wrapper')
      .delay(6000)
      .fadeOut('slow');
  });
}

function bootQrScanner(onDetected) {
  var video = document.getElementById('fooevents-qr-checkin-video');
  var status = document.getElementById('fooevents-qr-checkin-status');
  var detector = null;
  var canvas = null;
  var context = null;
  var mode = '';
  var busy = false;
  var lastValue = '';

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function normalizeTicketValue(rawValue) {
    var value = String(rawValue || '').trim();
    var match = value.match(/\d{12}/);
    return match ? match[0] : value;
  }

  function handleValue(rawValue) {
    var value = normalizeTicketValue(rawValue);

    if (!value || value === lastValue || busy) {
      return;
    }

    busy = true;
    lastValue = value;
    setStatus('QR erkannt: ' + value);
    onDetected(value);

    setTimeout(function () {
      busy = false;
      lastValue = '';
    }, 2000);
  }

  async function scanFrame() {
    if (!video || video.readyState < 2 || busy) {
      return;
    }

    try {
      if (mode === 'native' && detector) {
        var codes = await detector.detect(video);
        handleValue(codes[0] && codes[0].rawValue);
        return;
      }

      if (mode === 'jsqr' && canvas && context) {
        var width = video.videoWidth;
        var height = video.videoHeight;

        if (!width || !height) {
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        var imageData = context.getImageData(0, 0, width, height);
        var code = window.jsQR(imageData.data, imageData.width, imageData.height);
        handleValue(code && code.data);
      }
    } catch (err) {
      if (window.console) {
        console.debug('[fooevents-qr-checkin]', err);
      }
    }
  }

  async function start() {
    if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Keine Kamera verfuegbar.');
      return;
    }

    try {
      video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      await video.play();
    } catch (err) {
      setStatus('Kamerazugriff verweigert oder nicht verfuegbar.');
      return;
    }

    if ('BarcodeDetector' in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        mode = 'native';
      } catch (err) {
        mode = '';
      }
    }

    if (!mode && typeof window.jsQR === 'function') {
      canvas = document.createElement('canvas');
      context = canvas.getContext('2d', { willReadFrequently: true });
      mode = 'jsqr';
    }

    if (!mode) {
      setStatus('QR-Erkennung nicht verfuegbar. Ticket-ID manuell eingeben.');
      return;
    }

    setStatus('QR-Code scannen oder Ticket-ID manuell eingeben.');
    window.setInterval(scanFrame, 350);
  }

  start();
}
