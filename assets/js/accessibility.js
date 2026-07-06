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
