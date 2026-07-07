(function () {
    'use strict';

    var STORAGE_CONTRAST = 'eh_a11y_contrast';
    var STORAGE_CURSOR = 'eh_a11y_cursor';
    var STORAGE_UNDERLINE = 'eh_a11y_underline';
    var STORAGE_TEXTSIZE = 'eh_a11y_textsize_index';
    var TEXT_SIZES = [100, 112, 125, 137, 150];

    var html = document.documentElement;
    var panel = document.getElementById('eh-a11y-panel');
    var closeBtn = panel ? panel.querySelector('.eh-a11y-close') : null;
    var contrastToggle = document.getElementById('eh-a11y-contrast-toggle');
    var cursorToggle = document.getElementById('eh-a11y-cursor-toggle');
    var underlineToggle = document.getElementById('eh-a11y-underline-toggle');
    var langSelect = document.getElementById('eh-a11y-lang');
    var textDecBtn = document.getElementById('eh-a11y-textsize-dec');
    var textIncBtn = document.getElementById('eh-a11y-textsize-inc');
    var textValueEl = document.getElementById('eh-a11y-textsize-value');
    var resetBtn = document.getElementById('eh-a11y-reset');

    // --- Préférences persistantes (contraste / curseur), appliquées dès le chargement ---
    function readPref(key) {
        try {
            return window.localStorage.getItem(key) === '1';
        } catch {
            return false;
        }
    }

    function writePref(key, active) {
        try {
            window.localStorage.setItem(key, active ? '1' : '0');
        } catch {
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
    applyToggleState('eh-a11y-underline-links', STORAGE_UNDERLINE, underlineToggle);

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

    if (underlineToggle) {
        underlineToggle.addEventListener('click', function () {
            var active = !html.classList.contains('eh-a11y-underline-links');
            html.classList.toggle('eh-a11y-underline-links', active);
            underlineToggle.setAttribute('aria-pressed', active ? 'true' : 'false');
            writePref(STORAGE_UNDERLINE, active);
        });
    }

    // --- Taille du texte : applique un pourcentage sur la racine (rem),
    // mémorisé au même titre que le contraste et le curseur. ---
    var textSizeIndex = 0;

    function applyTextSize(index) {
        textSizeIndex = Math.min(Math.max(index, 0), TEXT_SIZES.length - 1);
        html.style.fontSize = TEXT_SIZES[textSizeIndex] + '%';
        if (textValueEl) textValueEl.textContent = TEXT_SIZES[textSizeIndex] + '%';
        if (textDecBtn) textDecBtn.disabled = (textSizeIndex === 0);
        if (textIncBtn) textIncBtn.disabled = (textSizeIndex === TEXT_SIZES.length - 1);
    }

    function readTextSizeIndex() {
        try {
            var parsed = parseInt(window.localStorage.getItem(STORAGE_TEXTSIZE), 10);
            return isNaN(parsed) ? 0 : parsed;
        } catch {
            return 0;
        }
    }

    function writeTextSizeIndex(index) {
        try {
            window.localStorage.setItem(STORAGE_TEXTSIZE, String(index));
        } catch {
            // Stockage indisponible (navigation privée...) : le réglage ne
            // sera simplement pas mémorisé d'une page à l'autre.
        }
    }

    applyTextSize(readTextSizeIndex());

    if (textDecBtn) {
        textDecBtn.addEventListener('click', function () {
            applyTextSize(textSizeIndex - 1);
            writeTextSizeIndex(textSizeIndex);
        });
    }

    if (textIncBtn) {
        textIncBtn.addEventListener('click', function () {
            applyTextSize(textSizeIndex + 1);
            writeTextSizeIndex(textSizeIndex);
        });
    }

    // --- Réinitialisation groupée : sans elle, l'utilisateur devait rouvrir
    // chaque bascule une à une pour revenir à l'état par défaut. ---
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            html.classList.remove('eh-a11y-contrast', 'eh-a11y-large-cursor', 'eh-a11y-underline-links');
            writePref(STORAGE_CONTRAST, false);
            writePref(STORAGE_CURSOR, false);
            writePref(STORAGE_UNDERLINE, false);
            if (contrastToggle) contrastToggle.setAttribute('aria-pressed', 'false');
            if (cursorToggle) cursorToggle.setAttribute('aria-pressed', 'false');
            if (underlineToggle) underlineToggle.setAttribute('aria-pressed', 'false');

            applyTextSize(0);
            writeTextSizeIndex(0);
        });
    }

    // --- Lien d'évitement (includes/modules/accessibility/public-display.php) ---
    // Ce plugin ne connaît pas la structure du thème actif : on cherche le
    // premier repère de contenu principal usuel plutôt que de supposer un id
    // particulier, et on lui ajoute un tabindex si besoin pour que le focus
    // y atterrisse même s'il n'est pas nativement focusable.
    var skipLink = document.querySelector('.eh-a11y-skip-link');
    if (skipLink) {
        var mainContent = document.querySelector('main, [role="main"], #content, #main, #primary');
        if (mainContent) {
            if (!mainContent.id) mainContent.id = 'eh-a11y-main-content';
            if (!mainContent.hasAttribute('tabindex')) mainContent.setAttribute('tabindex', '-1');
            skipLink.setAttribute('href', '#' + mainContent.id);
        }
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
        function apply() {
            panel.classList.add('eh-a11y-panel-open');
        }
        if (window.ehHub) {
            window.ehHub.showDetail('accessibility', apply);
        } else {
            apply();
        }
    }

    // Fermeture manuelle (croix) : revient au choix des icônes (état 2),
    // voir assets/js/core.js.
    function closePanel() {
        function apply() {
            panel.classList.remove('eh-a11y-panel-open');
        }
        if (window.ehHub) {
            window.ehHub.backToMenu('accessibility', apply);
        } else {
            apply();
        }
    }

    document.addEventListener('eh:action', function (event) {
        if (event.detail && event.detail.action === 'open-accessibility-panel') {
            openPanel();
        }
    });

    // Le hub s'est refermé entièrement pendant que ce panneau était actif
    // (clic extérieur, Échap, un autre module affiché...) : on remet à jour
    // notre propre état d'affichage sans redéclencher de fermeture.
    document.addEventListener('eh:closed', function (event) {
        if (event.detail && event.detail.id === 'accessibility') {
            panel.classList.remove('eh-a11y-panel-open');
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
    }

    // Le clic en dehors et la touche Échap sont désormais gérés de façon
    // centralisée par le noyau (assets/js/core.js), puisque ce panneau est
    // maintenant un contenu du même objet #eh-fab plutôt qu'un élément
    // indépendant.
})();
