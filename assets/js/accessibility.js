(function () {
    'use strict';

    var STORAGE_CONTRAST = 'eh_a11y_contrast';
    var STORAGE_CURSOR = 'eh_a11y_cursor';

    var html = document.documentElement;
    var panel = document.getElementById('eh-a11y-panel');
    var closeBtn = panel ? panel.querySelector('.eh-a11y-close') : null;
    var contrastToggle = document.getElementById('eh-a11y-contrast-toggle');
    var cursorToggle = document.getElementById('eh-a11y-cursor-toggle');
    var langSelect = document.getElementById('eh-a11y-lang');

    // --- Préférences persistantes (contraste / curseur), appliquées dès le chargement ---
    function readPref(key) {
        try {
            return window.localStorage.getItem(key) === '1';
        } catch (e) {
            return false;
        }
    }

    function writePref(key, active) {
        try {
            window.localStorage.setItem(key, active ? '1' : '0');
        } catch (e) {
            // Stockage indisponible (navigation privée...) : le réglage ne sera
            // simplement pas mémorisé d'une page à l'autre.
        }
    }

    function applyToggleState(className, storageKey, button) {
        var active = readPref(storageKey);
        html.classList.toggle(className, active);
        if (button) button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    applyToggleState('eh-a11y-contrast', STORAGE_CONTRAST, contrastToggle);
    applyToggleState('eh-a11y-large-cursor', STORAGE_CURSOR, cursorToggle);

    if (contrastToggle) {
        contrastToggle.addEventListener('click', function () {
            var active = !html.classList.contains('eh-a11y-contrast');
            html.classList.toggle('eh-a11y-contrast', active);
            contrastToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
            writePref(STORAGE_CONTRAST, active);
        });
    }

    if (cursorToggle) {
        cursorToggle.addEventListener('click', function () {
            var active = !html.classList.contains('eh-a11y-large-cursor');
            html.classList.toggle('eh-a11y-large-cursor', active);
            cursorToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
            writePref(STORAGE_CURSOR, active);
        });
    }

    // --- Traduction (widget Google, chargé à la demande uniquement) ---
    function getGoogTransCookie() {
        var match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function preselectLangFromCookie() {
        if (!langSelect) return;
        var current = getGoogTransCookie(); // format "/fr/en"
        var target = current.split('/')[2] || '';
        langSelect.value = target;
    }

    function loadGoogleTranslate(callback) {
        if (window.google && window.google.translate) {
            callback();
            return;
        }
        window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'fr',
                    includedLanguages: 'en,es,de,it,pt,fr',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                },
                'google_translate_element'
            );
            callback();
        };
        var script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
    }

    function resetTranslation() {
        var expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; ' + expire;
        document.cookie = 'googtrans=; ' + expire + ' domain=.' + window.location.hostname + ';';
        window.location.reload();
    }

    function translateTo(langCode) {
        loadGoogleTranslate(function () {
            var tries = 0;
            var interval = window.setInterval(function () {
                var combo = document.querySelector('select.goog-te-combo');
                tries++;
                if (combo) {
                    window.clearInterval(interval);
                    combo.value = langCode;
                    combo.dispatchEvent(new Event('change'));
                } else if (tries > 40) {
                    window.clearInterval(interval); // ~10s : le widget n'a pas répondu, on abandonne.
                }
            }, 250);
        });
    }

    if (langSelect) {
        preselectLangFromCookie();
        langSelect.addEventListener('change', function () {
            var value = langSelect.value;
            if (value) {
                translateTo(value);
            } else {
                resetTranslation();
            }
        });
    }

    // --- Ouverture / fermeture du panneau, coordonnée avec le hub ---
    if (!panel) return;

    function openPanel() {
        panel.classList.add('eh-a11y-panel-open');
        preselectLangFromCookie();
        if (window.ehHub) window.ehHub.openPanel('accessibility');
    }

    function closePanel() {
        panel.classList.remove('eh-a11y-panel-open');
        if (window.ehHub) window.ehHub.closePanel('accessibility');
    }

    document.addEventListener('eh:action', function (event) {
        if (event.detail && event.detail.action === 'open-accessibility-panel') {
            openPanel();
        }
    });

    document.addEventListener('eh:panel-close', function (event) {
        if (event.detail && event.detail.id === 'accessibility') {
            panel.classList.remove('eh-a11y-panel-open');
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
    }

    document.addEventListener('click', function (event) {
        if (!panel.classList.contains('eh-a11y-panel-open')) return;
        if (panel.contains(event.target)) return;
        var fab = document.getElementById('eh-fab');
        if (fab && fab.contains(event.target)) return;
        closePanel();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && panel.classList.contains('eh-a11y-panel-open')) {
            closePanel();
        }
    });
})();
