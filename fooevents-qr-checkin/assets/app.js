(function () {
  const App = window.FooEventsQrScanner || {};
  const DEBUG = !!App.debug;
  const i18n = {
    noCamera: 'Keine Kamera verfügbar',
    cameraDenied: 'Kamerazugriff verweigert',
    invalidTicketId: 'Ungültige Ticket-ID',
    ticketNotFound: 'Kein Ticket gefunden.',
    genericError: 'Unerwarteter Fehler',
    cancel: 'Abbrechen',
    checkIn: 'Einchecken',
    checkOut: 'Auschecken'
  };

  const state = { busy: false, stream: null };

  function log(...args) { if (DEBUG) console.debug('[fooevents-qr-checkin]', ...args); }

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
    return { success: true, ticket: { ticket_number: ticketNumber, attendee_post_id, order_id: orderId, purchaser, attendee, event, variations, date, checkin_status } };
  }

  async function validateTicket(ticketId, day) {
    const html = await postForm({ action: 'fooevents_perform_search', value: ticketId, multiday: 'true', day, 'fooevents-express-check-in-search-nonce': App.nonce });
    log('validation response', html);
    return parseTicketHtml(html);
  }

  async function changeStatus(mode, attendeeId, day) {
    const value = `fooevents-express-check-in-${mode}-${attendeeId}`;
    const raw = await postForm({ action: 'change_ticket_status', value, multiday: 'true', day, 'fooevents-express-check-in-search-nonce': App.nonce });
    try { return JSON.parse(raw); } catch { return { status: 'error', message: raw }; }
  }

  function showError(message) { window.alert(message || i18n.genericError); }

  function flashSuccess() {
    document.body.classList.add('feqc-success-1');
    setTimeout(() => document.body.classList.remove('feqc-success-1'), 180);
    setTimeout(() => document.body.classList.add('feqc-success-2'), 260);
    setTimeout(() => document.body.classList.remove('feqc-success-2'), 420);
  }

  async function bootCamera() {
    const video = document.getElementById('feqc-video');
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = state.stream;
    } catch (err) {
      log(err);
      document.getElementById('feqc-status').textContent = i18n.cameraDenied;
    }
  }

  async function bindTestInput() {
    const form = document.getElementById('feqc-test-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.busy) return;
      const ticketId = document.getElementById('feqc-ticket-input').value.trim();
      const day = document.getElementById('feqc-day').value;
      if (!new RegExp(App.ticketPattern).test(ticketId)) return showError(i18n.invalidTicketId);
      state.busy = true;
      const result = await validateTicket(ticketId, day);
      if (!result.success) { state.busy = false; return showError(result.message); }
      const doCheckin = (result.ticket.checkin_status || '').toLowerCase().includes('not checked');
      const ok = window.confirm(`${result.ticket.event}\n${result.ticket.ticket_number}\n${doCheckin ? i18n.checkIn : i18n.checkOut}?`);
      if (!ok) { state.busy = false; return; }
      const mode = doCheckin ? 'confirm' : 'cancel';
      const statusResult = await changeStatus(mode, result.ticket.attendee_post_id, day);
      state.busy = false;
      if (statusResult.status === 'success') return flashSuccess();
      showError(statusResult.message || i18n.genericError);
    });
  }

  function registerSW() {
    if ('serviceWorker' in navigator && App.swUrl) {
      navigator.serviceWorker.register(App.swUrl).catch(log);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await bootCamera();
    await bindTestInput();
    registerSW();
  });
})();
