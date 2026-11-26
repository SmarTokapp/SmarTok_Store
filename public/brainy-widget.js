/* ── Brainy floating chat widget — shared across SmarTok sites ──────────────
 * Expects window.BRAINY_WIDGET = { site, gifsBase, chips, subtitle, bubble, api }
 * set by an inline <script> before this file loads.
 */
(function () {
  'use strict';

  var CFG = window.BRAINY_WIDGET || {};
  var SITE = CFG.site || 'website';
  var GIFS = CFG.gifsBase || '/brainy/';
  var API = CFG.api || 'https://smartok-backend.onrender.com/api/public-brainy/chat';
  var QUOTA_API = CFG.quotaApi || 'https://smartok-backend.onrender.com/api/public-brainy/quota';
  var CHIPS = CFG.chips || [];
  var SUBTITLE = CFG.subtitle || 'SmarTok Assistant';
  var DAILY_LIMIT = 15;

  // ── persistent visitor identity + cached quota ────────────────────────────
  function utcToday() { return new Date().toISOString().slice(0, 10); }

  var VISITOR_ID;
  try {
    VISITOR_ID = localStorage.getItem('brainy_visitor_id');
    if (!VISITOR_ID) {
      VISITOR_ID = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem('brainy_visitor_id', VISITOR_ID);
    }
  } catch (e) {
    VISITOR_ID = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function readQuotaCache() {
    try {
      var c = JSON.parse(localStorage.getItem('brainy_quota_cache') || 'null');
      if (c && c.date === utcToday() && typeof c.remaining === 'number') return c.remaining;
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeQuotaCache(remaining) {
    try {
      localStorage.setItem('brainy_quota_cache', JSON.stringify({ date: utcToday(), remaining: remaining }));
    } catch (e) { /* ignore */ }
  }

  // ── tiny i18n for widget chrome (welcome bubble, placeholders, errors) ──
  var STR = {
    en: { bubble: 'Hi! Need help? Ask Brainy!', placeholder: 'Ask Brainy…', welcome: "Hi! I'm Brainy, SmarTok's mascot. Ask me anything about this page!", limit: "Daily limit reached (15/15). Come back tomorrow!", error: 'Oops — something went wrong. Please try again.', thinking: 'Brainy is thinking…', remaining: 'left today' },
    es: { bubble: '¡Hola! ¿Necesitas ayuda? ¡Pregúntale a Brainy!', placeholder: 'Pregúntale a Brainy…', welcome: '¡Hola! Soy Brainy, la mascota de SmarTok. ¡Pregúntame lo que quieras sobre esta página!', limit: 'Límite diario alcanzado (15/15). ¡Vuelve mañana!', error: 'Ups — algo salió mal. Inténtalo de nuevo.', thinking: 'Brainy está pensando…', remaining: 'restantes hoy' },
    fr: { bubble: 'Salut ! Besoin d’aide ? Demandez à Brainy !', placeholder: 'Demandez à Brainy…', welcome: 'Salut ! Je suis Brainy, la mascotte de SmarTok. Posez-moi vos questions sur cette page !', limit: 'Limite quotidienne atteinte (15/15). Revenez demain !', error: 'Oups — une erreur est survenue. Réessayez.', thinking: 'Brainy réfléchit…', remaining: 'restants aujourd’hui' },
    de: { bubble: 'Hallo! Brauchst du Hilfe? Frag Brainy!', placeholder: 'Frag Brainy…', welcome: 'Hallo! Ich bin Brainy, das Maskottchen von SmarTok. Frag mich alles über diese Seite!', limit: 'Tageslimit erreicht (15/15). Komm morgen wieder!', error: 'Ups — etwas ist schiefgelaufen. Bitte erneut versuchen.', thinking: 'Brainy denkt nach…', remaining: 'heute übrig' },
    pt: { bubble: 'Oi! Precisa de ajuda? Pergunte ao Brainy!', placeholder: 'Pergunte ao Brainy…', welcome: 'Oi! Sou o Brainy, o mascote do SmarTok. Pergunte-me qualquer coisa sobre esta página!', limit: 'Limite diário atingido (15/15). Volte amanhã!', error: 'Ops — algo deu errado. Tente novamente.', thinking: 'Brainy está pensando…', remaining: 'restantes hoje' },
    it: { bubble: 'Ciao! Serve aiuto? Chiedi a Brainy!', placeholder: 'Chiedi a Brainy…', welcome: 'Ciao! Sono Brainy, la mascotte di SmarTok. Chiedimi pure qualsiasi cosa su questa pagina!', limit: 'Limite giornaliero raggiunto (15/15). Torna domani!', error: 'Ops — qualcosa è andato storto. Riprova.', thinking: 'Brainy sta pensando…', remaining: 'rimasti oggi' },
    ja: { bubble: 'こんにちは！お困りですか？Brainyに聞いてみて！', placeholder: 'Brainyに聞く…', welcome: 'こんにちは！SmarTokのマスコット、Brainyです。このページについて何でも聞いてください！', limit: '1日の上限に達しました（15/15）。また明日どうぞ！', error: 'エラーが発生しました。もう一度お試しください。', thinking: 'Brainyが考えています…', remaining: '本日の残り' },
    zh: { bubble: '你好！需要帮助吗？问问 Brainy 吧！', placeholder: '问问 Brainy…', welcome: '你好！我是 Brainy，SmarTok 的吉祥物。关于这个页面有什么想问的尽管问我！', limit: '今日限额已达上限（15/15）。请明天再来！', error: '出错了，请重试。', thinking: 'Brainy 正在思考…', remaining: '今日剩余' },
    ar: { bubble: 'مرحباً! هل تحتاج مساعدة؟ اسأل Brainy!', placeholder: 'اسأل Brainy…', welcome: 'مرحباً! أنا Brainy، تميمة SmarTok. اسألني أي شيء عن هذه الصفحة!', limit: 'تم بلوغ الحد اليومي (15/15). عد غداً!', error: 'حدث خطأ ما. حاول مرة أخرى.', thinking: 'Brainy يفكر…', remaining: 'متبقية اليوم' },
    hi: { bubble: 'नमस्ते! मदद चाहिए? Brainy से पूछें!', placeholder: 'Brainy से पूछें…', welcome: 'नमस्ते! मैं Brainy हूँ, SmarTok का मैस्कट। इस पेज के बारे में कुछ भी पूछें!', limit: 'दैनिक सीमा पूरी (15/15)। कल फिर आएं!', error: 'कुछ गलत हो गया। कृपया फिर कोशिश करें।', thinking: 'Brainy सोच रहा है…', remaining: 'आज शेष' },
    ko: { bubble: '안녕하세요! 도움이 필요하세요? Brainy에게 물어보세요!', placeholder: 'Brainy에게 물어보기…', welcome: '안녕하세요! 저는 SmarTok의 마스코트 Brainy입니다. 이 페이지에 대해 무엇이든 물어보세요!', limit: '일일 한도 도달 (15/15). 내일 다시 방문해 주세요!', error: '오류가 발생했습니다. 다시 시도해 주세요.', thinking: 'Brainy가 생각 중…', remaining: '오늘 남은 횟수' },
  ru: { bubble: 'Привет! Нужна помощь? Спросите Brainy!', placeholder: 'Спросите Brainy…', welcome: 'Привет! Я Brainy, маскот SmarTok. Спрашивайте что угодно об этой странице!', limit: 'Дневной лимит исчерпан (15/15). Возвращайтесь завтра!', error: 'Упс — что-то пошло не так. Попробуйте ещё раз.', thinking: 'Brainy думает…', remaining: 'осталось сегодня' }
  };

  function pageLang() {
    var candidates = [
      window.i18next && window.i18next.language,
      null,
      null,
      document.documentElement.lang,
      navigator.language
    ];
    try {
      candidates.push(localStorage.getItem('i18nextLng'));
      candidates.push(localStorage.getItem('smartok_website_lang'));
    } catch (e) { /* storage unavailable */ }
    candidates.push(navigator.language);
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (!c) continue;
      var code = String(c).toLowerCase().replace(/_/g, '-').slice(0, 2);
      if (STR[code]) return code;
    }
    return 'en';
  }
  var LANG = pageLang();
  var T = STR[LANG];

  // ── build DOM ────────────────────────────────────────────────────────────
  var root = document.createElement('div');
  root.className = 'brainy-widget';
  root.innerHTML =
    '<div class="brainy-launcher">' +
      '<div class="brainy-bubble" id="brainyBubble" role="button" aria-label="Open Brainy chat">' +
        '<div class="brainy-bubble-inner">' +
          '<span class="brainy-bubble-text"></span>' +
          '<button class="brainy-bubble-close" aria-label="Dismiss">×</button>' +
        '</div>' +
      '</div>' +
      '<button class="brainy-fab" id="brainyFab" aria-label="Open Brainy chat">' +
        '<img id="brainyFabImg" src="" alt="Brainy">' +
      '</button>' +
    '</div>' +
    '<div class="brainy-chat" id="brainyChat" role="dialog" aria-label="Brainy chat">' +
      '<div class="brainy-chat-head">' +
        '<div class="brainy-chat-avatar"><img id="brainyHeadImg" src="" alt="Brainy"></div>' +
        '<div class="brainy-chat-head-text">' +
          '<div class="brainy-chat-name">Brainy</div>' +
          '<div class="brainy-chat-sub"></div>' +
        '</div>' +
        '<span class="brainy-quota" id="brainyQuota"></span>' +
        '<button class="brainy-chat-close" id="brainyChatClose" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="brainy-chat-msgs" id="brainyMsgs"></div>' +
      '<div class="brainy-chips" id="brainyChips"></div>' +
      '<div class="brainy-input-row">' +
        '<input class="brainy-input" id="brainyInput" maxlength="500" autocomplete="off" />' +
        '<button class="brainy-send" id="brainySend" aria-label="Send">➤</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var els = {
    bubble: root.querySelector('#brainyBubble'),
    bubbleText: root.querySelector('.brainy-bubble-text'),
    bubbleClose: root.querySelector('.brainy-bubble-close'),
    fab: root.querySelector('#brainyFab'),
    fabImg: root.querySelector('#brainyFabImg'),
    chat: root.querySelector('#brainyChat'),
    headImg: root.querySelector('#brainyHeadImg'),
    sub: root.querySelector('.brainy-chat-sub'),
    quota: root.querySelector('#brainyQuota'),
    close: root.querySelector('#brainyChatClose'),
    msgs: root.querySelector('#brainyMsgs'),
    chips: root.querySelector('#brainyChips'),
    input: root.querySelector('#brainyInput'),
    send: root.querySelector('#brainySend')
  };

  els.fabImg.src = GIFS + 'BrainyIdle.gif';
  els.headImg.src = GIFS + 'BrainyIdle.gif';
  els.bubbleText.textContent = T.bubble;
  els.sub.textContent = SUBTITLE;
  els.input.placeholder = T.placeholder;

  // Restore the last-known quota instantly (survives reloads), then sync the
  // authoritative count from PostgreSQL — the server enforces IP + visitorId.
  var cachedRemaining = readQuotaCache();
  updateQuota(cachedRemaining == null ? DAILY_LIMIT : cachedRemaining);

  // ── state ────────────────────────────────────────────────────────────────
  var history = [];       // last turns: {role:'user'|'model', text}
  var remaining = DAILY_LIMIT;
  var busy = false;
  var welcomed = false;
  var limitNotified = false;

  function setAvatar(state) {
    var file = state === 'thinking' ? 'BrainyThinking.gif'
             : state === 'responding' ? 'BrainyResponding.gif'
             : 'BrainyIdle.gif';
    els.fabImg.src = GIFS + file;
    els.headImg.src = GIFS + file;
  }

  function updateQuota(n) {
    remaining = Math.max(0, n);
    writeQuotaCache(remaining);
    els.quota.textContent = remaining + '/' + DAILY_LIMIT + ' ' + T.remaining;
    var exhausted = remaining <= 0;
    els.input.disabled = exhausted;
    els.send.disabled = exhausted || busy;
    if (exhausted) {
      renderChips(); // clears chips — they stay hidden while limit is hit
      if (!limitNotified && els.chat.classList.contains('open')) {
        limitNotified = true;
        addMsg(T.limit, 'error');
      }
    }
  }

  function scrollBottom() {
    requestAnimationFrame(function () { els.msgs.scrollTop = els.msgs.scrollHeight; });
  }

  function addMsg(text, cls) {
    var div = document.createElement('div');
    div.className = 'brainy-msg ' + cls;
    div.textContent = text;
    els.msgs.appendChild(div);
    scrollBottom();
    return div;
  }

  function renderChips() {
    els.chips.innerHTML = '';
    if (!CHIPS.length || busy || remaining <= 0) return;
    CHIPS.forEach(function (chip) {
      var b = document.createElement('button');
      b.className = 'brainy-chip';
      b.type = 'button';
      b.textContent = chip;
      b.addEventListener('click', function () { send(chip); });
      els.chips.appendChild(b);
    });
  }

  function renderWelcome() {
    if (welcomed) return;
    welcomed = true;
    addMsg(T.welcome, 'bot');
    renderChips();
  }

  function openChat() {
    els.chat.classList.add('open');
    els.bubble.style.display = 'none';
    renderWelcome();
    scrollBottom();
    setTimeout(function () { els.input.focus(); }, 120);
  }

  function closeChat() {
    els.chat.classList.remove('open');
    if (!sessionStorage.getItem('brainy_bubble_dismissed')) {
      els.bubble.style.display = '';
    }
  }

  // ── send ─────────────────────────────────────────────────────────────────
  function send(text) {
    var msg = (text || '').trim();
    if (!msg || busy || remaining <= 0) return;
    busy = true;
    els.send.disabled = true;
    els.input.value = '';
    renderChips();

    addMsg(msg, 'user');
    history.push({ role: 'user', text: msg });
    if (history.length > 12) history = history.slice(-12);

    var typing = addMsg(T.thinking, 'bot typing');
    setAvatar('thinking');

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: history.slice(0, -1), site: SITE, lang: LANG, visitorId: VISITOR_ID })
    })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      })
      .then(function (res) {
        typing.remove();
        if (res.body && typeof res.body.remainingToday === 'number') {
          updateQuota(res.body.remainingToday); // server count already includes this message
        }
        if (res.status === 429 || (res.body && res.body.code === 'daily_limit_reached')) {
          updateQuota(0);
          addMsg(T.limit, 'error');
          return;
        }
        if (!res.body || res.body.ok !== true || !res.body.reply) {
          addMsg(T.error, 'error');
          return;
        }
        history.push({ role: 'model', text: res.body.reply });
        addMsg(res.body.reply, 'bot');
        setAvatar('responding');
        setTimeout(function () { setAvatar('idle'); }, 2700);
      })
      .catch(function () {
        typing.remove();
        addMsg(T.error, 'error');
        setAvatar('idle');
      })
      .finally(function () {
        busy = false;
        els.send.disabled = remaining <= 0;
        renderChips();
        if (remaining > 0) els.input.focus();
      });
  }

  // ── events ───────────────────────────────────────────────────────────────
  els.fab.addEventListener('click', openChat);
  els.bubble.addEventListener('click', openChat);
  els.close.addEventListener('click', closeChat);
  els.bubbleClose.addEventListener('click', function (e) {
    e.stopPropagation();
    els.bubble.style.display = 'none';
    sessionStorage.setItem('brainy_bubble_dismissed', '1');
  });
  els.send.addEventListener('click', function () { send(els.input.value); });
  els.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); send(els.input.value); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeChat();
  });

  // Sync the authoritative remaining count from the server on every load.
  // GET /quota never increments — safe to call on init.
  fetch(QUOTA_API + '?site=' + encodeURIComponent(SITE) + '&visitorId=' + encodeURIComponent(VISITOR_ID))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && j.ok && typeof j.remainingToday === 'number') {
        updateQuota(j.remainingToday);
      }
    })
    .catch(function () { /* offline / CORS — keep cached value */ });

  // Auto-settle the welcome bubble after 10s (reappears next page load).
  setTimeout(function () {
    if (!sessionStorage.getItem('brainy_bubble_dismissed') && !els.chat.classList.contains('open')) {
      els.bubble.style.display = 'none';
    }
  }, 10000);
})();
