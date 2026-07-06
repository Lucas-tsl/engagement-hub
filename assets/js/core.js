(function () {
    'use strict';

    var config = window.ehHubConfig || { items: [], isProduct: false };
    var fab = document.getElementById('eh-fab');
    var toggle = document.getElementById('eh-fab-toggle');
    var menu = document.getElementById('eh-fab-menu');

    if (!fab || !toggle || !menu) return;

    var scrollPercent = 0;
    var isOpen = false;

    function updateScrollPercent() {
        var doc = document.documentElement;
        var scrollTop = window.pageYOffset || doc.scrollTop;
        var height = (doc.scrollHeight - doc.clientHeight) || 1;
        scrollPercent = Math.min(100, Math.max(0, (scrollTop / height) * 100));
        fab.style.setProperty('--eh-scroll', String(scrollPercent));
    }

    function visibleItems() {
        return config.items.filter(function (item) {
            if (item.condition === 'is_product') return !!config.isProduct;
            if (item.condition === 'scroll') return scrollPercent >= (item.scrollThreshold || 100);
            return true;
        });
    }

    function handleAction(item) {
        if (item.action === 'scroll-top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        // Chaque module écoute cet événement pour déclencher sa propre action
        // (ex. ouvrir sa modale) sans que le noyau ait besoin de le connaître.
        document.dispatchEvent(new CustomEvent('eh:action', { detail: item }));
    }

    function renderMenu() {
        var items = visibleItems();
        menu.innerHTML = '';
        items.forEach(function (item, index) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'eh-fab-item';
            btn.style.setProperty('--eh-index', String(index));
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('title', item.label);
            btn.setAttribute('aria-label', item.label);
            // Icône dans un span dédié, séparé du fond blanc du bouton.
            // Un SVG (currentColor) est préféré à l'emoji : le rendu des
            // emojis varie trop d'un système à l'autre pour rester lisible
            // une fois désaturé — voir includes/core/class-eh-module-registry.php.
            var icon = document.createElement('span');
            icon.setAttribute('aria-hidden', 'true');
            if (item.iconSvg) {
                icon.className = 'eh-fab-item-icon eh-fab-item-icon--svg';
                icon.innerHTML = item.iconSvg;
            } else {
                icon.className = 'eh-fab-item-icon eh-fab-item-icon--emoji';
                icon.textContent = item.icon;
            }
            btn.appendChild(icon);
            btn.addEventListener('click', function () {
                // Retenu pour que le panneau ouvert par cette action "prenne
                // la forme" précisément de CETTE bulle (voir ehHub plus bas),
                // et non de l'engrenage lui-même, qui doit rester stable et
                // toujours visible.
                lastActiveItemEl = btn;
                handleAction(item);
                closeMenu();
            });
            menu.appendChild(btn);
        });
    }

    function openMenu() {
        isOpen = true;
        renderMenu();
        fab.classList.add('eh-fab-open');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        isOpen = false;
        fab.classList.remove('eh-fab-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', function (event) {
        if (isOpen && !fab.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isOpen) closeMenu();
    });

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            updateScrollPercent();
            if (isOpen) renderMenu();
            ticking = false;
        });
    }, { passive: true });

    updateScrollPercent();

    // Coordination des panneaux : chaque module (cookie, sticky cart, futurs
    // modules) affiche son propre panneau, mais un seul peut être ouvert à la
    // fois. Le noyau ne connaît pas leur contenu : il se contente de fermer
    // le panneau précédent et de "lier" visuellement l'engrenage (pulsation)
    // tant qu'un panneau est ouvert. L'engrenage lui-même reste toujours
    // visible et stable — c'est la BULLE du menu qu'on vient de cliquer
    // (lastActiveItemEl, capturée dans renderMenu() ci-dessus) qui se
    // transforme visuellement en panneau, pas l'engrenage.
    var activePanel = null;
    var lastActiveItemEl = null;

    // Nom de transition partagé : au moment où on l'assigne au panneau (et
    // qu'on le retire de la bulle cliquée, ou l'inverse), la View Transitions
    // API du navigateur interpole automatiquement position/taille/rayon
    // entre les deux — la bulle "devient" littéralement le panneau, sans
    // qu'on ait à coder l'animation image par image. Navigateur sans
    // support : repli silencieux sur un affichage instantané (rien ne casse).
    var MORPH_NAME = 'eh-fab-morph';

    function morph( applyFn ) {
        if ( typeof document.startViewTransition === 'function' ) {
            document.startViewTransition( applyFn );
        } else {
            applyFn();
        }
    }

    window.ehHub = {
        // panelEl : l'élément DOM du panneau (pour la fusion visuelle avec
        // la bulle cliquée). applyFn : callback du module qui bascule SA
        // propre classe d'affichage — doit s'exécuter à l'intérieur du morph
        // pour que le navigateur capture les bons états "avant/après".
        openPanel: function (id, panelEl, applyFn) {
            if (activePanel && activePanel !== id) {
                document.dispatchEvent(new CustomEvent('eh:panel-close', { detail: { id: activePanel } }));
            }
            activePanel = id;
            var sourceEl = (lastActiveItemEl && document.contains(lastActiveItemEl)) ? lastActiveItemEl : null;
            morph(function () {
                fab.classList.add('eh-fab-linked');
                if (sourceEl) sourceEl.style.viewTransitionName = '';
                if (panelEl) panelEl.style.viewTransitionName = MORPH_NAME;
                if (typeof applyFn === 'function') applyFn();
            });
            document.dispatchEvent(new CustomEvent('eh:panel-open', { detail: { id: id } }));
        },
        closePanel: function (id, panelEl, applyFn) {
            if (activePanel !== id) return;
            activePanel = null;
            // La bulle d'origine n'existe peut-être plus (menu rouvert entre
            // temps, qui régénère ses boutons) : dans ce cas repli sur un
            // simple fondu, sans point de départ précis pour la fusion.
            var sourceEl = (lastActiveItemEl && document.contains(lastActiveItemEl)) ? lastActiveItemEl : null;
            morph(function () {
                fab.classList.remove('eh-fab-linked');
                if (panelEl) panelEl.style.viewTransitionName = '';
                if (sourceEl) sourceEl.style.viewTransitionName = MORPH_NAME;
                if (typeof applyFn === 'function') applyFn();
            });
            document.dispatchEvent(new CustomEvent('eh:panel-close', { detail: { id: id } }));
            lastActiveItemEl = null;
        },
        // Conservé pour compatibilité : un module peut encore piloter le
        // "lien" visuel sans passer par un panneau à proprement parler.
        setLinked: function (active) {
            fab.classList.toggle('eh-fab-linked', !!active);
        }
    };
})();
