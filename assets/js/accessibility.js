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
    var langStatus = document.getElementById('eh-a11y-lang-status');

    function setLangStatus(text) {
        if (langStatus) langStatus.textContent = text || '';
    }

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

    // --- Traduction ---
    // L'ancien widget "Google Website Translator" embarqué dans la page est
    // un service que Google a cessé d'ouvrir aux nouveaux domaines : il se
    // charge sans erreur mais ne traduit jamais rien, en silence. On utilise
    // à la place le proxy translate.goog — le mécanisme que Google emploie
    // lui-même aujourd'hui pour ses liens "Traduire cette page" — nettement
    // plus fiable, au prix d'une navigation vers ce domaine proxy plutôt
    // qu'une traduction en place sur le site.
    function isOnTranslateProxy() {
        return /\.translate\.goog$/.test(window.location.hostname);
    }

    function buildProxyUrl(targetLang) {
        var loc = window.location;
        var proxyHost = loc.hostname.replace(/\./g, '-') + '.translate.goog';
        var params = new URLSearchParams(loc.search);
        params.set('_x_tr_sl', 'auto');
        params.set('_x_tr_tl', targetLang);
        params.set('_x_tr_hl', 'fr');
        params.set('_x_tr_pto', 'wapp');
        return loc.protocol + '//' + proxyHost + loc.pathname + '?' + params.toString() + loc.hash;
    }

    function buildOriginalUrlFromProxy() {
        var loc = window.location;
        var originalHost = loc.hostname.replace(/\.translate\.goog$/, '').replace(/-/g, '.');
        var params = new URLSearchParams(loc.search);
        params.delete('_x_tr_sl');
        params.delete('_x_tr_tl');
        params.delete('_x_tr_hl');
        params.delete('_x_tr_pto');
        var query = params.toString();
        return loc.protocol + '//' + originalHost + loc.pathname + (query ? '?' + query : '') + loc.hash;
    }

    function preselectLangFromUrl() {
        if (!langSelect) return;
        if (isOnTranslateProxy()) {
            var params = new URLSearchParams(window.location.search);
            langSelect.value = params.get('_x_tr_tl') || '';
        } else {
            langSelect.value = '';
        }
    }

    if (langSelect) {
        preselectLangFromUrl();
        langSelect.addEventListener('change', function () {
            var value = langSelect.value;
            if (value) {
                setLangStatus('Redirection…');
                window.location.href = buildProxyUrl(value);
            } else if (isOnTranslateProxy()) {
                setLangStatus('Redirection…');
                window.location.href = buildOriginalUrlFromProxy();
            }
        });
    }

    // --- Ouverture / fermeture du panneau, coordonnée avec le hub ---
    if (!panel) return;

    function openPanel() {
        panel.classList.add('eh-a11y-panel-open');
        preselectLangFromUrl();
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
