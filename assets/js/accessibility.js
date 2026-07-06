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

    // --- Traduction (WPML) ---
    // Les options du sélecteur contiennent déjà l'URL traduite calculée par
    // WPML côté serveur (voir includes/modules/accessibility/public-display.php,
    // filtre officiel 'wpml_active_languages') : il n'y a qu'à naviguer.
    // Le sélecteur n'existe même pas dans le HTML si WPML n'est pas actif.
    if (langSelect) {
        langSelect.addEventListener('change', function () {
            var url = langSelect.value;
            if (url) window.location.href = url;
        });
    }

    // --- Ouverture / fermeture du panneau, coordonnée avec le hub ---
    if (!panel) return;

    function openPanel() {
        panel.classList.add('eh-a11y-panel-open');
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
