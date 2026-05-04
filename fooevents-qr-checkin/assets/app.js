(function () {
  const App = window.FooEventsQrScanner || {};
  const DEBUG = !!App.debug;
  const i18n = {
    noCamera: 'Keine Kamera verfuegbar',
    cameraDenied: 'Kamerazugriff verweigert',
    scannerUnsupported: 'QR-Erkennung nicht verfuegbar. Ticket-ID manuell eingeben.',
    invalidTicketId: 'Ungueltige Ticket-ID',
    ticketNotFound: 'Kein Ticket gefunden.',
    genericError: 'Unerwarteter Fehler',
    cancel: 'Abbrechen',
    checkIn: 'Einchecken',
    checkOut: 'Auschecken'
  };

  const state = {
    busy: false,
    stream: null,
    detector: null,
    scanTimer: null,
    lastValue: ''
  };

  function log(...args) {
    if (DEBUG) console.debug('[fooevents-qr-checkin]', ...args);
  }

  function setStatus(message) {
    const status = document.getElementById('feqc-status');
    if (status) status.textContent = message || '';
  }

  async function postForm(params) {
    const body = new URLSearchParams(params);
    const response = await fetch(App.ajaxUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString()
    });
    return response.text();
  }

  function parseTicketHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (doc.querySelector('.fooevents-express-check-in-notickets')) {
      return { success: false, error_code: 'ticket_not_found', message: i18n.ticketNotFound };
    }

    const row = doc.querySelector('table tbody tr');
    if (!row) return { success: false, error_code: 'invalid_response', message: i18n.genericError };

    const cols = row.querySelectorAll('td');
    const ticketNumber = (cols[0]?.textContent || '').replace('#', '').trim();
    const orderId = (cols[1]?.textContent || '').trim();
    const purchaser = (cols[2]?.textContent || '').trim();
    const attendee = (cols[3]?.textContent || '').trim();
    const variations = (cols[5]?.textContent || '').trim();
    const event = row.querySelector('.fooevents-express-check-in-event-name')?.textContent?.trim() || '';
    const date = row.querySelector('.fooevents-express-check-in-event-date')?.textContent?.trim() || '';
    const checkin_status = row.querySelector('.fooevents-express-check-in-status')?.textContent?.trim() || '';
    const confirmBtn = row.querySelector('[id^="fooevents-express-check-in-confirm-"]');
    const attendee_post_id = confirmBtn ? confirmBtn.id.split('-').pop() : '';

    return {
      success: true,
      ticket: { ticket_number: ticketNumber, attendee_post_id, order_id: orderId, purchaser, attendee, event, variations, date, checkin_status }
    };
  }

  async function validateTicket(ticketId, day) {
    const html = await postForm({
      action: 'fooevents_perform_search',
      value: ticketId,
      multiday: 'true',
      day,
      'fooevents-express-check-in-search-nonce': App.nonce
    });
    log('validation response', html);
    return parseTicketHtml(html);
  }

  async function changeStatus(mode, attendeeId, day) {
    const value = `fooevents-express-check-in-${mode}-${attendeeId}`;
    const raw = await postForm({
      action: 'change_ticket_status',
      value,
      multiday: 'true',
      day,
      'fooevents-express-check-in-search-nonce': App.nonce
    });
    try {
      return JSON.parse(raw);
    } catch {
      return { status: 'error', message: raw };
    }
  }

  function showError(message) {
    window.alert(message || i18n.genericError);
  }

  function flashSuccess() {
    document.body.classList.add('feqc-success-1');
    setTimeout(() => document.body.classList.remove('feqc-success-1'), 180);
    setTimeout(() => document.body.classList.add('feqc-success-2'), 260);
    setTimeout(() => document.body.classList.remove('feqc-success-2'), 420);
  }

  function normalizeTicketId(value) {
    const match = String(value || '').match(/\d{12}/);
    return match ? match[0] : '';
  }

  async function processTicket(rawTicketId) {
    const ticketId = normalizeTicketId(rawTicketId);
    const day = document.getElementById('feqc-day')?.value || App.defaultDay || 1;

    if (!new RegExp(App.ticketPattern).test(ticketId)) {
      showError(i18n.invalidTicketId);
      return;
    }

    state.busy = true;
    setStatus(ticketId);

    try {
      const result = await validateTicket(ticketId, day);
      if (!result.success) {
        showError(result.message);
        return;
      }

      const doCheckin = (result.ticket.checkin_status || '').toLowerCase().includes('not checked');
      const ok = window.confirm(`${result.ticket.event}\n${result.ticket.ticket_number}\n${doCheckin ? i18n.checkIn : i18n.checkOut}?`);
      if (!ok) return;

      const mode = doCheckin ? 'confirm' : 'cancel';
      const statusResult = await changeStatus(mode, result.ticket.attendee_post_id, day);
      if (statusResult.status === 'success') {
        flashSuccess();
        return;
      }

      showError(statusResult.message || i18n.genericError);
    } catch (err) {
      log(err);
      showError(i18n.genericError);
    } finally {
      state.busy = false;
      setTimeout(() => {
        state.lastValue = '';
      }, 1500);
    }
  }

  async function bootCamera() {
    const video = document.getElementById('feqc-video');
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      setStatus(i18n.noCamera);
      return;
    }

    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = state.stream;
      await video.play();
    } catch (err) {
      log(err);
      setStatus(i18n.cameraDenied);
      return;
    }

    if (!('BarcodeDetector' in window)) {
      setStatus(i18n.scannerUnsupported);
      return;
    }

    try {
      state.detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      state.scanTimer = window.setInterval(scanFrame, 350);
      setStatus('');
    } catch (err) {
      log(err);
      setStatus(i18n.scannerUnsupported);
    }
  }

  async function scanFrame() {
    const video = document.getElementById('feqc-video');
    if (!state.detector || !video || state.busy || video.readyState < 2) return;

    try {
      const codes = await state.detector.detect(video);
      const value = codes[0]?.rawValue || '';
      const ticketId = normalizeTicketId(value);
      if (!ticketId || ticketId === state.lastValue) return;

      state.lastValue = ticketId;
      await processTicket(ticketId);
    } catch (err) {
      log(err);
    }
  }

  function bindTestInput() {
    const form = document.getElementById('feqc-test-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.busy) return;

      const ticketId = document.getElementById('feqc-ticket-input').value.trim();
      await processTicket(ticketId);
    });
  }

  function registerSW() {
    if ('serviceWorker' in navigator && App.swUrl) {
      navigator.serviceWorker.register(App.swUrl).catch(log);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindTestInput();
    await bootCamera();
    registerSW();
  });
})();
