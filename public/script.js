/* =========================================================
   ASHWAT ENTERPRISES — app.js
   View switching + contact copy buttons + booking form
   ========================================================= */
(function () {
  'use strict';

  var views = {
    home: document.getElementById('view-home'),
    contact: document.getElementById('view-contact'),
    service: document.getElementById('view-service'),
    booking: document.getElementById('view-booking')
  };

  var navButtons = document.querySelectorAll('[data-target]');
  var navlinksEl = document.getElementById('navlinks');
  var burger = document.getElementById('burger');
  var current = 'home';

  function setActiveNav(target) {
    document.querySelectorAll('.navlinks button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-target') === target);
    });
  }

  function goTo(target) {
    if (!views[target] || target === current) {
      closeMenu();
      return;
    }
    views[current].classList.remove('active');
    views[target].classList.add('active');
    current = target;
    setActiveNav(target);
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var target = btn.getAttribute('data-target');
      if (target) {
        // don't intercept real tel:/mailto: links etc — only buttons with data-target navigate
        if (btn.tagName === 'BUTTON') goTo(target);
      }
    });
  });

  function closeMenu() { navlinksEl.classList.remove('open'); }
  burger.addEventListener('click', function () { navlinksEl.classList.toggle('open'); });

  /* =========================================================
     CONTACT — copy to clipboard
     ========================================================= */
  document.querySelectorAll('.icon-btn[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var tip = btn.querySelector('.tip');
      var reset = function (label) {
        setTimeout(function () { tip.textContent = label; tip.classList.remove('show'); }, 1400);
      };
      var originalLabel = tip.textContent;

      function showCopied() {
        tip.textContent = 'Copied!';
        tip.classList.add('show');
        reset(originalLabel);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(function () {
          fallbackCopy(text);
          showCopied();
        });
      } else {
        fallbackCopy(text);
        showCopied();
      }
    });

    // show tooltip label on hover too
    btn.addEventListener('mouseenter', function () {
      btn.querySelector('.tip').classList.add('show');
    });
    btn.addEventListener('mouseleave', function () {
      btn.querySelector('.tip').classList.remove('show');
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
  }

  /* =========================================================
     BOOKING FORM
     Posts to /api/book — the Telegram bot token lives only
     on the server (.env), never in this file.
     ========================================================= */
  var form = document.getElementById('booking-form');
  var confirmBox = document.getElementById('confirm');
  var errorBox = document.getElementById('submit-error');
  var submitBtn = form.querySelector('button[type="submit"]');

  var fields = {
    name: { el: document.getElementById('f-name'), validate: function (v) { return v.trim().length > 1; } },
    phone: { el: document.getElementById('f-phone'), validate: function (v) { return /^[0-9+\-\s()]{7,15}$/.test(v.trim()); } },
    email: { el: document.getElementById('f-email'), validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
    address: { el: document.getElementById('f-address'), validate: function (v) { return v.trim().length > 4; } },
    service: { el: document.getElementById('f-service'), validate: function (v) { return v !== ''; } },
    date: { el: document.getElementById('f-date'), validate: function (v) { return v !== ''; } },
    time: { el: document.getElementById('f-time'), validate: function (v) { return v !== ''; } }
  };

  function fieldWrap(key) { return fields[key].el.closest('.field'); }

  function validateField(key) {
    var ok = fields[key].validate(fields[key].el.value);
    fieldWrap(key).classList.toggle('invalid', !ok);
    return ok;
  }

  Object.keys(fields).forEach(function (key) {
    var evt = (fields[key].el.tagName === 'SELECT') ? 'change' : 'input';
    fields[key].el.addEventListener(evt, function () { validateField(key); });
  });

  function showError(msg) { errorBox.textContent = msg; errorBox.classList.add('show'); }
  function hideError() { errorBox.classList.remove('show'); errorBox.textContent = ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var allValid = true;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(key)) allValid = false;
    });

    if (!allValid) {
      var firstInvalid = form.querySelector('.field.invalid input, .field.invalid select');
      if (firstInvalid) firstInvalid.focus();
      confirmBox.classList.remove('show');
      return;
    }

    var data = {
      name: fields.name.el.value.trim(),
      phone: fields.phone.el.value.trim(),
      email: fields.email.el.value.trim(),
      address: fields.address.el.value.trim(),
      service: fields.service.el.value,
      date: fields.date.el.value,
      time: fields.time.el.value,
      notes: document.getElementById('f-notes').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (result) {
        if (!result.ok || !result.json.success) {
          throw new Error((result.json && result.json.error) || 'Something went wrong. Please try again.');
        }

        var ref = result.json.ref;
        document.getElementById('c-name').textContent = data.name.split(' ')[0];
        document.getElementById('c-ref').textContent = ref;
        document.getElementById('c-service').textContent = data.service;
        document.getElementById('c-slot').textContent = formatDate(data.date) + ' — ' + data.time;
        document.getElementById('c-address').textContent = data.address;
        document.getElementById('c-contact').textContent = data.phone + ' · ' + data.email;

        confirmBox.classList.add('show');
        confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.reset();
      })
      .catch(function (err) {
        showError(err.message || 'Could not send your booking. Please try again or call us directly.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reserve My Slot';
      });
  });

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    var opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return d.toLocaleDateString('en-IN', opts);
  }

  var dateInput = document.getElementById('f-date');
  if (dateInput) {
    var today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
})();
