// ─── STATE ────────────────────────────────────────────────
const state = {
  currentStep: 1,
  tcAccepted: false,
  privacyAccepted: false,
  date: null,
  time: null,
  covers: null,
  isCustomCovers: false,
  reminderEnabled: false,
};

// ─── STEP NAVIGATION ──────────────────────────────────────
function goToStep(n) {
  // hide all panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));

  // show target panel
  const target = n === 'success' ? 'step-success' : `step-${n}`;
  document.getElementById(target).classList.add('active');

  // update progress indicators
  const total = 4;
  for (let i = 1; i <= total; i++) {
    const si = document.getElementById(`si-${i}`);
    si.classList.remove('active', 'completed');
    if (n === 'success') {
      si.classList.add('completed');
    } else if (i < n) {
      si.classList.add('completed');
    } else if (i === n) {
      si.classList.add('active');
    }
  }

  state.currentStep = n;

  // scroll to top of card
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── STEP 1: TERMS ────────────────────────────────────────
document.getElementById('chk-tc').addEventListener('change', function () {
  state.tcAccepted = this.checked;
  checkStep1();
});

document.getElementById('chk-privacy').addEventListener('change', function () {
  state.privacyAccepted = this.checked;
  checkStep1();
});

function checkStep1() {
  const btn = document.getElementById('btn-step1');
  btn.disabled = !(state.tcAccepted && state.privacyAccepted);
}

// ─── STEP 2: DATE & TIME ──────────────────────────────────
// Set min date to today
(function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').min = today;
})();

function selectTime(btn) {
  document.querySelectorAll('.time-pill').forEach(p => p.classList.remove('selected'));
  btn.classList.add('selected');
  state.time = btn.dataset.time;
  hideError('err-time');
}

function validateStep2() {
  let valid = true;

  const dateVal = document.getElementById('booking-date').value;
  if (!dateVal) {
    showError('err-date');
    valid = false;
  } else {
    state.date = dateVal;
    hideError('err-date');
  }

  if (!state.time) {
    showError('err-time');
    valid = false;
  }

  if (valid) goToStep(3);
}

// ─── STEP 3: COVERS ───────────────────────────────────────
function selectCover(btn) {
  document.querySelectorAll('.cover-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  hideError('err-covers');

  if (btn.dataset.covers === 'custom') {
    state.isCustomCovers = true;
    state.covers = null;
    document.getElementById('custom-input-wrap').classList.add('visible');
    document.getElementById('custom-covers').focus();
    checkCoverAlert();
  } else {
    state.isCustomCovers = false;
    state.covers = parseInt(btn.dataset.covers);
    document.getElementById('custom-input-wrap').classList.remove('visible');
    checkCoverAlert();
  }
}

function updateCustomCovers() {
  const val = parseInt(document.getElementById('custom-covers').value);
  if (!isNaN(val) && val > 0) {
    state.covers = val;
    checkCoverAlert();
  } else {
    state.covers = null;
  }
}

function checkCoverAlert() {
  const alert = document.getElementById('cc-alert');
  const covers = state.covers;
  if (covers && covers > 6) {
    alert.classList.add('visible');
  } else if (state.isCustomCovers) {
    alert.classList.add('visible');
  } else {
    alert.classList.remove('visible');
  }
}

function validateStep3() {
  if (!state.covers && !(state.isCustomCovers && state.covers === null)) {
    // no selection at all
    if (!document.querySelector('.cover-btn.selected')) {
      showError('err-covers');
      return;
    }
  }

  if (state.isCustomCovers) {
    const val = parseInt(document.getElementById('custom-covers').value);
    if (!val || val < 1) {
      showError('err-covers');
      document.getElementById('err-covers').textContent = 'Inserisci un numero valido';
      return;
    }
    state.covers = val;
  }

  if (!state.covers) {
    showError('err-covers');
    return;
  }

  // Update recap
  updateRecap();
  // Show/hide credit card section
  toggleCCSection();
  goToStep(4);
}

// ─── STEP 4: PERSONAL DATA ────────────────────────────────
function updateRecap() {
  // Parse date safely: "YYYY-MM-DD" → parts to avoid TZ offset issues
  const [y, m, d] = state.date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dateFormatted = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  // Capitalize first letter
  const dateCap = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  document.getElementById('recap-date').textContent = dateCap;
  document.getElementById('recap-time').textContent = state.time;
  document.getElementById('recap-covers').textContent = state.covers + ' ' + (state.covers === 1 ? 'persona' : 'persone');

  // success screen
  document.getElementById('s-date').textContent = dateCap;
  document.getElementById('s-time').textContent = state.time;
  document.getElementById('s-covers').textContent = state.covers + ' ' + (state.covers === 1 ? 'persona' : 'persone');
}

function toggleCCSection() {
  const ccSection = document.getElementById('cc-section');
  if (state.covers > 6) {
    ccSection.classList.add('visible');
  } else {
    ccSection.classList.remove('visible');
  }
}

function validateStep4() {
  let valid = true;

  const nome = document.getElementById('f-nome').value.trim();
  const cognome = document.getElementById('f-cognome').value.trim();
  const tel = document.getElementById('f-telefono').value.trim();
  const email = document.getElementById('f-email').value.trim();

  if (!nome) { showError('err-nome'); valid = false; } else hideError('err-nome');
  if (!cognome) { showError('err-cognome'); valid = false; } else hideError('err-cognome');
  if (!tel || tel.replace(/[\s+\-()]/g, '').length < 8) {
    showError('err-telefono'); valid = false;
  } else hideError('err-telefono');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showError('err-email'); valid = false;
  } else hideError('err-email');

  // Credit card validation if > 6 covers
  if (state.covers > 6) {
    const ccNum = document.getElementById('cc-numero').value.replace(/\s/g, '');
    const ccName = document.getElementById('cc-intestatario').value.trim();
    const ccExp = document.getElementById('cc-scadenza').value.trim();
    const ccCvv = document.getElementById('cc-cvv').value.trim();

    if (!ccNum || ccNum.length < 13) {
      showError('err-cc-numero'); valid = false;
    } else hideError('err-cc-numero');

    if (!ccName) {
      showError('err-cc-intestatario'); valid = false;
    } else hideError('err-cc-intestatario');

    const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expRegex.test(ccExp)) {
      showError('err-cc-scadenza'); valid = false;
    } else hideError('err-cc-scadenza');

    if (!ccCvv || ccCvv.length < 3) {
      showError('err-cc-cvv'); valid = false;
    } else hideError('err-cc-cvv');
  }

  if (!valid) return;

  // Schedule reminder if requested
  if (state.reminderEnabled) {
    scheduleReminder(nome, cognome);
  }

  // Update success screen name
  document.getElementById('s-name').textContent = nome + ' ' + cognome;

  // Show reminder success message
  if (state.reminderEnabled) {
    document.getElementById('success-reminder-msg').style.display = 'block';
  } else {
    document.getElementById('success-reminder-msg').style.display = 'none';
  }

  // Animate button
  const btn = document.getElementById('btn-prenota');
  btn.disabled = true;
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Invio in corso…';

  // Simulate submission (replace with real API call)
  setTimeout(() => {
    goToStep('success');
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Prenota il Tavolo';
  }, 1800);
}

// ─── CC INPUT FORMATTING ───────────────────────────────────
function formatCardNumber(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) {
    v = v.slice(0, 2) + '/' + v.slice(2);
  }
  input.value = v;
}

// ─── HELPERS ──────────────────────────────────────────────
function showError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}

// Spin animation for loading
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// ─── REMINDER NOTIFICATION ───────────────────────────────────────────
const chkReminder = document.getElementById('chk-reminder');
if (chkReminder) {
  chkReminder.addEventListener('change', async function () {
    const noteEl = document.getElementById('reminder-note');
    if (this.checked) {
      if (!('Notification' in window)) {
        noteEl.textContent = '⚠️ Il tuo browser non supporta le notifiche.';
        noteEl.className = 'reminder-note reminder-note--warn';
        this.checked = false;
        state.reminderEnabled = false;
        return;
      }
      if (Notification.permission === 'denied') {
        noteEl.textContent = '❌ Notifiche bloccate. Abilita i permessi nelle impostazioni del browser.';
        noteEl.className = 'reminder-note reminder-note--error';
        this.checked = false;
        state.reminderEnabled = false;
        return;
      }
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          noteEl.textContent = '❌ Permesso negato. Non potremo inviarti il reminder.';
          noteEl.className = 'reminder-note reminder-note--error';
          this.checked = false;
          state.reminderEnabled = false;
          return;
        }
      }
      state.reminderEnabled = true;
      noteEl.textContent = '✅ Reminder attivato! Riceverai una notifica alle 10:00 del giorno della prenotazione.';
      noteEl.className = 'reminder-note reminder-note--ok';
    } else {
      state.reminderEnabled = false;
      noteEl.textContent = '';
      noteEl.className = 'reminder-note';
    }
  });
}

function scheduleReminder(nome, cognome) {
  if (!state.date || !('Notification' in window)) return;

  const [y, m, d] = state.date.split('-').map(Number);
  // Reminder at 10:00 AM on booking day
  const reminderTime = new Date(y, m - 1, d, 10, 0, 0, 0);
  const now = new Date();
  const msUntil = reminderTime.getTime() - now.getTime();

  if (msUntil <= 0) {
    // Already past 10:00 on that day – notify immediately as a fallback
    new Notification('🍽 Calderisi Mare — Promemoria Prenotazione', {
      body: `Ciao ${nome}! Oggi hai prenotato un tavolo alle ${state.time} per ${state.covers} ${state.covers === 1 ? 'persona' : 'persone'}. Ti aspettiamo!`,
      icon: 'https://www.calderisimare.com/favicon.ico',
      badge: 'https://www.calderisimare.com/favicon.ico'
    });
    return;
  }

  // Schedule via setTimeout
  // Note: works only while browser tab is open. For persistent reminders a Service Worker is needed.
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('🍽 Calderisi Mare — Promemoria Prenotazione', {
        body: `Ciao ${nome}! Oggi hai prenotato un tavolo alle ${state.time} per ${state.covers} ${state.covers === 1 ? 'persona' : 'persone'}. Ti aspettiamo!`,
        icon: 'https://www.calderisimare.com/favicon.ico',
        badge: 'https://www.calderisimare.com/favicon.ico'
      });
    }
  }, msUntil);
}
