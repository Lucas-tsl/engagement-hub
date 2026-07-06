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
    // (lastActiveItemEl, capturée dans renderMenu() ci-dessus) qui doit
    // visuellement "devenir" le panneau.
    //
    // Technique : au lieu d'une API expérimentale (View Transitions, retirée
    // ici faute de rendu fiable/vérifiable), on calcule la position réelle de
    // la bulle cliquée (getBoundingClientRect) et on positionne le point
    // d'origine ("transform-origin") du panneau exactement dessus avant de
    // lancer sa propre transition CSS scale() — 100% CSS/JS standard, sans
    // dépendance à un support navigateur incertain.
    var activePanel = null;
    var lastActiveItemEl = null;

    function setMorphOrigin(panelEl, sourceEl) {
        if (!panelEl) return;
        if (!sourceEl || !document.contains(sourceEl)) {
            // Pas de bulle d'origine connue (ex. panneau ouvert automatiquement,
            // sans clic sur le menu) : repli sur le coin bas-droit du panneau,
            // là où se trouve l'engrenage.
            panelEl.style.transformOrigin = '100% 100%';
            return;
        }
        // Le panneau est actuellement réduit (transform: scale(0.05) tant que
        // .visible/.open n'est pas encore ajouté) : getBoundingClientRect()
        // refléterait cette taille réduite, pas la taille réelle du panneau
        // ouvert. On neutralise le transform le temps de la mesure (toujours
        // invisible, opacity:0, donc aucun flash visuel).
        var previousTransform = panelEl.style.transform;
        panelEl.style.transform = 'none';
        var sourceRect = sourceEl.getBoundingClientRect();
        var panelRect = panelEl.getBoundingClientRect();
        panelEl.style.transform = previousTransform;
        var originX = (sourceRect.left + sourceRect.width / 2) - panelRect.left;
        var originY = (sourceRect.top + sourceRect.height / 2) - panelRect.top;
        panelEl.style.transformOrigin = originX + 'px ' + originY + 'px';
    }

    window.ehHub = {
        // panelEl : l'élément DOM du panneau (pour calculer le point de
        // départ de l'animation). applyFn : callback du module qui bascule
        // SA propre classe d'affichage.
        openPanel: function (id, panelEl, applyFn) {
            if (activePanel && activePanel !== id) {
                document.dispatchEvent(new CustomEvent('eh:panel-close', { detail: { id: activePanel } }));
            }
            activePanel = id;
            fab.classList.add('eh-fab-linked');
            setMorphOrigin(panelEl, lastActiveItemEl);
            if (typeof applyFn === 'function') applyFn();
            document.dispatchEvent(new CustomEvent('eh:panel-open', { detail: { id: id } }));
        },
        closePanel: function (id, panelEl, applyFn) {
            if (activePanel !== id) return;
            activePanel = null;
            fab.classList.remove('eh-fab-linked');
            if (typeof applyFn === 'function') applyFn();
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
