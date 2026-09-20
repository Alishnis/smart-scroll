/**
 * SmartScroll i18n — lightweight EN/RU toggle.
 *
 * The original Russian markup is left in place as the source of truth.
 * Any element that also carries a `data-i18n-en*` attribute gets swapped
 * to its English text when the visitor picks EN, and swapped back when
 * they pick RU. No build step, no translation files — just one attribute
 * next to the text it translates.
 *
 * Usage in markup:
 *   <span data-i18n-en="Feed">Лента</span>
 *   <input placeholder="Поиск..." data-i18n-en-placeholder="Search...">
 *   <img alt="Логотип" data-i18n-en-alt="Logo">
 *   <a title="Настройки" data-i18n-en-title="Settings">...</a>
 *
 * A page only needs to include this file once:
 *   <script src="i18n.js" defer></script>
 *
 * A "language toggle" button is any element with class="i18n-toggle" —
 * clicking it flips the language. Its label is kept in sync automatically.
 */
(function () {
  var STORAGE_KEY = 'sscroll_lang';

  var ATTR_TO_PROP = {
    'data-i18n-en': 'textContent',
    'data-i18n-en-html': 'innerHTML',
    'data-i18n-en-placeholder': 'placeholder',
    'data-i18n-en-title': 'title',
    'data-i18n-en-value': 'value',
    'data-i18n-en-alt': 'alt',
    'data-i18n-en-aria-label': 'aria-label'
  };
  var ATTRS = Object.keys(ATTR_TO_PROP);

  var observer = null;

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ru';
  }

  function readProp(el, prop) {
    if (prop === 'aria-label') return el.getAttribute('aria-label') || '';
    return el[prop];
  }

  function writeProp(el, prop, value) {
    if (prop === 'aria-label') {
      el.setAttribute('aria-label', value);
    } else {
      el[prop] = value;
    }
  }

  // Stash the original Russian value on the element the first time we see
  // it, so switching back to RU is a plain restore rather than a re-parse.
  function applyLang(root) {
    var lang = getLang();

    ATTRS.forEach(function (attr) {
      var prop = ATTR_TO_PROP[attr];
      var stashKey = '_i18nRu_' + prop;
      var nodes = root.querySelectorAll('[' + attr + ']');

      nodes.forEach(function (el) {
        if (el[stashKey] === undefined) {
          el[stashKey] = readProp(el, prop);
        }
        var value = lang === 'en' ? el.getAttribute(attr) : el[stashKey];
        writeProp(el, prop, value);
      });
    });

    document.documentElement.setAttribute('lang', lang);
  }

  function syncToggleButtons() {
    var lang = getLang();
    var buttons = document.querySelectorAll('.i18n-toggle');
    buttons.forEach(function (btn) {
      // Label shows the language you'd switch TO.
      btn.textContent = lang === 'en' ? 'RU' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Russian' : 'Switch to English');
      btn.classList.toggle('i18n-toggle--en', lang === 'en');
      btn.style.background = lang === 'en'
        ? 'linear-gradient(135deg, #30CAA1 0%, #20A0FF 100%)'
        : 'rgba(0,0,0,0.85)';
      btn.style.borderColor = lang === 'en' ? 'transparent' : 'rgba(255,255,255,0.25)';
    });
  }

  // Re-applying is idempotent, but it does replace text nodes, which the
  // MutationObserver would otherwise see and react to. Disconnect around
  // our own writes so we don't trigger ourselves in a loop.
  function applyLangSafely(root) {
    if (observer) observer.disconnect();
    applyLang(root || document);
    syncToggleButtons();
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'ru');
    applyLangSafely(document);
  }

  function toggleLang() {
    setLang(getLang() === 'en' ? 'ru' : 'en');
  }

  // Several pages build their header from unified-navbar.html; several
  // others hardcode their own copy of it; a few have neither. Rather than
  // depend on any one page's markup/CSS, the toggle button injects itself
  // — same look and position everywhere, with its own inline styles so it
  // never depends on a stylesheet the current page may not have loaded.
  function ensureToggleButton() {
    if (document.querySelector('.i18n-toggle')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'i18n-toggle';
    btn.title = 'Switch language';
    btn.style.cssText = [
      // top:92px sits just below the 80px shared header so the toggle
      // never overlaps the search/currency controls in ss-header__right.
      'position:fixed', 'top:92px', 'right:12px', 'z-index:2147483647',
      'background:rgba(0,0,0,0.85)', 'color:#fff',
      'border:1px solid rgba(255,255,255,0.25)', 'border-radius:20px',
      'font:bold 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'letter-spacing:0.5px', 'padding:9px 14px', 'cursor:pointer',
      'box-shadow:0 4px 16px rgba(0,0,0,0.35)'
    ].join(';');

    document.body.appendChild(btn);
  }

  function boot() {
    ensureToggleButton();
    applyLangSafely(document);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.i18n-toggle');
      if (btn) toggleLang();
    });

    // Several pages inject shared components (e.g. the navbar) via
    // fetch() after load — catch that content too.
    observer = new MutationObserver(function (mutations) {
      var added = mutations.some(function (m) { return m.addedNodes && m.addedNodes.length; });
      if (added) applyLangSafely(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.SmartScrollI18N = {
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    // Call after injecting/changing data-i18n-en* attributes at runtime
    // (e.g. a script that sets a page title) so the new text is translated
    // immediately instead of waiting for the next DOM mutation.
    refresh: function () { applyLangSafely(document); }
  };
})();
