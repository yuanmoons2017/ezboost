/* ========================================================================
   CoffeeBoost — Dashboard Application Logic
   ======================================================================== */

(function () {
  'use strict';

  // --- Auth check: redirect to login if not authenticated ---
  fetch('/api/auth/me')
    .then(function (res) {
      if (!res.ok) {
        window.location.href = '/login.html';
        return null;
      }
      return res.json();
    })
    .then(function (data) {
      if (!data) return;
      var p = data.profile;
      var navUsername = document.getElementById('nav-username');
      var navAvatar = document.getElementById('nav-avatar');
      if (navUsername) navUsername.textContent = p.personaname;
      if (navAvatar) {
        if (p.avatarmedium) {
          navAvatar.innerHTML = '<img src="' + p.avatarmedium + '" style="width:30px;height:30px;border-radius:50%;" alt="">';
        } else {
          navAvatar.textContent = p.personaname.substring(0, 2).toUpperCase();
        }
      }
    })
    .catch(function () {
      window.location.href = '/login.html';
    });

  // --- Demo account data ---
  const demoAccounts = [
    {
      id: 'a1',
      username: 'darkroast_77',
      authType: 'email',
      status: 'online',
      uptimeHours: 71.17,
      uptimeMins: 4270,
      uptimeSecs: 256228,
      timeGainedHours: 427.05,
      timeGainedMins: 25623,
      timeGainedSecs: 1537368,
      games: [730, 570, 440, 252490, 578080, 1172470],
      maxGames: 32
    },
    {
      id: 'a2',
      username: 'steamfroth_k',
      authType: '2fa',
      status: 'online',
      uptimeHours: 6.9,
      uptimeMins: 414,
      uptimeSecs: 24841,
      timeGainedHours: 207.01,
      timeGainedMins: 12421,
      timeGainedSecs: 745230,
      games: Array.from({ length: 30 }, (_, i) => 700 + i),
      maxGames: 32
    },
    {
      id: 'a3',
      username: 'espresso_shot',
      authType: 'email',
      status: 'offline',
      uptimeHours: 0,
      uptimeMins: 0,
      uptimeSecs: 0,
      timeGainedHours: 0,
      timeGainedMins: 0,
      timeGainedSecs: 0,
      games: Array.from({ length: 10 }, (_, i) => 400 + i),
      maxGames: 32
    }
  ];

  const MAX_ACCOUNTS = 10;

  // --- SVG icon helpers ---
  const icons = {
    email: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6l8 5 8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="5" y="1" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="15" r="1" fill="currentColor"/><line x1="7" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    stats: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="3" height="7" rx="0.5" fill="currentColor"/><rect x="6" y="4" width="3" height="11" rx="0.5" fill="currentColor"/><rect x="11" y="1" width="3" height="14" rx="0.5" fill="currentColor"/></svg>',
    restart: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 .01 3.58.01 8S3.58 16 8 16c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 018 14 6 6 0 018 2c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.05 3.05l1.41 1.41M13.54 13.54l1.41 1.41M3.05 14.95l1.41-1.41M13.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    power: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v6M12.36 3.64a6 6 0 11-8.72 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  // --- DOM references ---
  const grid = document.getElementById('accounts-grid');
  const emptyState = document.getElementById('empty-state');
  const counterEl = document.getElementById('account-counter');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const form = document.getElementById('add-account-form');

  // --- State ---
  let accounts = [...demoAccounts];

  // --- Format helpers ---
  function fmtNum(n) {
    return n.toLocaleString('en-US');
  }

  function fmtHours(h) {
    if (h === 0) return '<span class="account-data-value">--<span> hrs</span></span>';
    return `<span class="account-data-value">${h.toFixed(2)}<span> hrs</span></span>`;
  }

  function fmtSub(mins, secs) {
    if (mins === 0 && secs === 0) return '<span class="account-data-sub">-- mins / -- secs</span>';
    return `<span class="account-data-sub">${fmtNum(mins)} mins / ${fmtNum(secs)} secs</span>`;
  }

  // --- Render a single account card ---
  function renderCard(acc) {
    const statusDotClass = acc.status === 'online' ? 'status-dot--active' : 'status-dot--inactive';
    const authIcon = acc.authType === 'email' ? icons.email : acc.authType === 'qr' ? icons.phone : icons.phone;
    const gamesPercent = Math.min((acc.games.length / acc.maxGames) * 100, 100);

    return `
      <div class="account-card" data-id="${acc.id}">
        <div class="account-auth" title="${acc.authType === 'email' ? 'Email Guard' : 'Mobile 2FA'}">
          ${authIcon}
        </div>
        <div class="account-identity">
          <div class="account-name">${acc.username}</div>
          <div class="account-status">
            <span class="status-dot ${statusDotClass}"></span>
            <span class="account-status-text">${acc.status}</span>
          </div>
        </div>
        <div class="account-data">
          <span class="account-data-label">Uptime</span>
          ${fmtHours(acc.uptimeHours)}
          ${fmtSub(acc.uptimeMins, acc.uptimeSecs)}
        </div>
        <div class="account-data">
          <span class="account-data-label">Time Gained</span>
          ${fmtHours(acc.timeGainedHours)}
          ${fmtSub(acc.timeGainedMins, acc.timeGainedSecs)}
        </div>
        <div class="account-games">
          <span class="games-count">${acc.games.length}<small> / ${acc.maxGames}</small></span>
          <div class="games-bar">
            <div class="games-bar-fill" style="width: ${gamesPercent}%"></div>
          </div>
        </div>
        <div class="account-actions">
          <button class="btn-icon" title="Statistics">${icons.stats}</button>
          <button class="btn-icon" title="Restart">${icons.restart}</button>
          <button class="btn-icon" title="Toggle Power">${icons.power}</button>
          <button class="btn-icon btn-icon--danger" title="Delete" data-delete="${acc.id}">${icons.trash}</button>
          <button class="btn-icon btn-icon--settings" title="Settings">${icons.settings}</button>
        </div>
      </div>
    `;
  }

  // --- Render all cards ---
  function renderAccounts() {
    if (accounts.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
    } else {
      grid.style.display = 'flex';
      emptyState.style.display = 'none';
      grid.innerHTML = accounts.map(renderCard).join('');
    }
    counterEl.textContent = `${accounts.length} / ${MAX_ACCOUNTS}`;
  }

  // --- Delete handler (event delegation) ---
  grid.addEventListener('click', function (e) {
    const deleteBtn = e.target.closest('[data-delete]');
    if (!deleteBtn) return;
    const id = deleteBtn.dataset.delete;
    const card = deleteBtn.closest('.account-card');

    card.style.transition = 'all 0.35s var(--ease-out)';
    card.style.opacity = '0';
    card.style.transform = 'translateX(30px)';

    setTimeout(function () {
      accounts = accounts.filter(function (a) { return a.id !== id; });
      renderAccounts();
      showToast('Account removed', 'success');
    }, 350);
  });

  // --- Modal open/close ---
  var selectedGameId = null;
  var selectedGameName = null;

  var gameNames = {
    730: 'CS2', 570: 'Dota 2', 440: 'TF2', 252490: 'Rust',
    1172470: 'Apex Legends', 578080: 'PUBG', 1245620: 'Elden Ring', 892970: 'Valheim'
  };

  function openModal() {
    selectedGameId = null;
    selectedGameName = null;
    showStep(1);
    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
    selectedGameId = null;
    selectedGameName = null;
    document.getElementById('selected-game-preview').style.display = 'none';
    document.getElementById('btn-next-step').disabled = true;
  }

  function showStep(step) {
    var step1 = document.getElementById('step-game-setup');
    var step2 = document.getElementById('step-steam-signin');
    var stepIndicators = document.querySelectorAll('.modal-step');

    if (step === 1) {
      step1.style.display = '';
      step2.style.display = 'none';
      stepIndicators[0].classList.add('active');
      stepIndicators[1].classList.remove('active');
    } else {
      step1.style.display = 'none';
      step2.style.display = '';
      stepIndicators[0].classList.add('active', 'completed');
      stepIndicators[1].classList.add('active');
      simulateQrLoading();
    }
  }

  function selectGame(appId, name) {
    selectedGameId = appId;
    selectedGameName = name;
    var preview = document.getElementById('selected-game-preview');
    document.getElementById('selected-game-name').textContent = name;
    document.getElementById('selected-game-appid').textContent = 'App ID: ' + appId;
    preview.style.display = 'flex';
    document.getElementById('btn-next-step').disabled = false;
  }

  function simulateQrLoading() {
    var loading = document.getElementById('qr-loading');
    var status = document.getElementById('qr-status');
    loading.style.display = 'flex';
    status.innerHTML = '<span class="status-dot status-dot--warning"></span><span>Generating QR code...</span>';

    setTimeout(function () {
      loading.style.display = 'none';
      status.innerHTML = '<span class="status-dot status-dot--active"></span><span>QR code ready — scan with Steam app</span>';
    }, 1500);
  }

  // Game chip radio selection
  var gameChips = document.querySelectorAll('#game-chips input[name="game"]');
  gameChips.forEach(function (chip) {
    chip.addEventListener('change', function () {
      var appId = parseInt(this.value, 10);
      var name = gameNames[appId] || 'App ' + appId;
      selectGame(appId, name);
    });
  });

  document.getElementById('btn-add-account').addEventListener('click', function () {
    if (accounts.length >= MAX_ACCOUNTS) {
      showToast('Maximum accounts reached (' + MAX_ACCOUNTS + ')', 'error');
      return;
    }
    openModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
  });

  // Step navigation
  document.getElementById('btn-next-step').addEventListener('click', function () {
    if (!selectedGameId) return;
    showStep(2);
  });
  document.getElementById('btn-back-step').addEventListener('click', function () {
    showStep(1);
  });

  // --- Form submission (Add Game) ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!selectedGameId) return;

    var newAccount = {
      id: 'a' + Date.now(),
      username: selectedGameName,
      authType: 'qr',
      status: 'online',
      uptimeHours: 0,
      uptimeMins: 0,
      uptimeSecs: 0,
      timeGainedHours: 0,
      timeGainedMins: 0,
      timeGainedSecs: 0,
      games: [selectedGameId],
      maxGames: 32
    };

    accounts.push(newAccount);
    closeModal();
    renderAccounts();
    showToast('Game "' + selectedGameName + '" added for boosting', 'success');
  });

  // --- Custom game ID ---
  document.getElementById('add-custom-game').addEventListener('click', function () {
    var input = document.getElementById('custom-game-id');
    var val = parseInt(input.value, 10);
    if (!val || val < 1) return;

    // Uncheck any previously selected radio
    var radios = document.querySelectorAll('#game-chips input[name="game"]');
    radios.forEach(function (r) { r.checked = false; });

    var name = gameNames[val] || 'App ' + val;
    selectGame(val, name);
    input.value = '';
  });

  // --- Refresh button ---
  document.getElementById('btn-refresh').addEventListener('click', function () {
    var btn = this;
    btn.style.pointerEvents = 'none';
    btn.querySelector('svg').style.transition = 'transform 0.6s var(--ease-out)';
    btn.querySelector('svg').style.transform = 'rotate(360deg)';

    setTimeout(function () {
      btn.querySelector('svg').style.transform = '';
      btn.style.pointerEvents = '';
      showToast('Dashboard refreshed', 'success');
    }, 700);
  });

  // --- Toast notification ---
  function showToast(message, type) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast--' + type : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });

    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 400);
    }, 2800);
  }

  // --- Live connected count ticker ---
  var connectedEl = document.getElementById('connected-count');
  var connectedBase = 47391208;
  setInterval(function () {
    connectedBase += Math.floor(Math.random() * 7) - 3;
    connectedEl.textContent = connectedBase.toLocaleString('en-US');
  }, 3000);

  // --- Simulated uptime ticking for online accounts ---
  setInterval(function () {
    accounts.forEach(function (acc) {
      if (acc.status !== 'online') return;
      acc.uptimeSecs += 5;
      acc.uptimeMins = Math.floor(acc.uptimeSecs / 60);
      acc.uptimeHours = parseFloat((acc.uptimeSecs / 3600).toFixed(2));
      acc.timeGainedSecs += 5;
      acc.timeGainedMins = Math.floor(acc.timeGainedSecs / 60);
      acc.timeGainedHours = parseFloat((acc.timeGainedSecs / 3600).toFixed(2));
    });
    // Update existing DOM without full re-render for smooth experience
    accounts.forEach(function (acc) {
      var card = document.querySelector('[data-id="' + acc.id + '"]');
      if (!card) return;
      var dataEls = card.querySelectorAll('.account-data');
      if (dataEls[0]) {
        dataEls[0].querySelector('.account-data-value').innerHTML = acc.uptimeHours === 0 ? '--<span> hrs</span>' : acc.uptimeHours.toFixed(2) + '<span> hrs</span>';
        dataEls[0].querySelector('.account-data-sub').textContent = (acc.uptimeMins === 0 ? '--' : fmtNum(acc.uptimeMins)) + ' mins / ' + (acc.uptimeSecs === 0 ? '--' : fmtNum(acc.uptimeSecs)) + ' secs';
      }
      if (dataEls[1]) {
        dataEls[1].querySelector('.account-data-value').innerHTML = acc.timeGainedHours === 0 ? '--<span> hrs</span>' : acc.timeGainedHours.toFixed(2) + '<span> hrs</span>';
        dataEls[1].querySelector('.account-data-sub').textContent = (acc.timeGainedMins === 0 ? '--' : fmtNum(acc.timeGainedMins)) + ' mins / ' + (acc.timeGainedSecs === 0 ? '--' : fmtNum(acc.timeGainedSecs)) + ' secs';
      }
    });
  }, 5000);

  // --- Init ---
  renderAccounts();

})();
