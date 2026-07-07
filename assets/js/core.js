(function () {
    'use strict';

    // :focus-visible seul ne suffit pas partout : certains navigateurs
    // affichent quand même l'anneau de focus après un clic souris sur nos
    // boutons (croix de fermeture, etc.). On détecte nous-mêmes la dernière
    // modalité utilisée (souris vs clavier) pour le masquer de façon fiable
    // (voir la règle html.eh-mouse-user dans assets/css/core.css).
    var htmlEl = document.documentElement;
    document.addEventListener('mousedown', function () {
        htmlEl.classList.add('eh-mouse-user');
    }, true);
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Tab') {
            htmlEl.classList.remove('eh-mouse-user');
        }
    }, true);

    var config = window.ehHubConfig || { items: [], isProduct: false };
    var fab = document.getElementById('eh-fab');
    var toggle = document.getElementById('eh-fab-toggle');
    var menu = document.getElementById('eh-fab-menu');
    var detail = document.getElementById('eh-fab-detail');

    if (!fab || !toggle || !menu || !detail) return;

    // #eh-fab est UN SEUL objet qui traverse 3 états (voir assets/css/core.css) :
    // 'closed' (engrenage), 'menu' (choix des icônes), 'detail' (contenu du
    // module choisi). Ce n'est jamais deux blocs distincts qui se suivent.
    var state = 'closed';
    var activeDetail = null;
    var scrollPercent = 0;

    // Les panneaux de cookie-consent et accessibilité sont rendus par PHP
    // ailleurs dans la page (wp_footer) : on les déplace une fois dans le
    // slot partagé #eh-fab-detail, pour qu'ils deviennent littéralement une
    // partie du même objet plutôt que des éléments fixed indépendants. Le
    // panneau sticky-cart, lui, est créé plus tard par assets/js/sticky-cart.js
    // directement à l'intérieur de #eh-fab-detail (rien à déplacer).
    ['bcc-modal-overlay', 'eh-a11y-panel'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) detail.appendChild(el);
    });

    function setState(newState) {
        state = newState;
        fab.setAttribute('data-state', newState);
        toggle.setAttribute('aria-expanded', newState === 'closed' ? 'false' : 'true');
        if (newState === 'closed') {
            fab.removeAttribute('data-detail');
        }
    }

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
                if (item.action === 'scroll-top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    forceClose();
                    return;
                }
                // Le module concerné écoute cet événement pour afficher son
                // propre contenu dans le slot détail (ehHub.showDetail), sans
                // que le noyau ait besoin de connaître ce contenu.
                document.dispatchEvent(new CustomEvent('eh:action', { detail: item }));
            });
            menu.appendChild(btn);
        });

        // Croix de sortie, à droite des bulles : referme entièrement et
        // retrouve l'engrenage de départ (état 1), sans devoir cliquer en
        // dehors ou faire Échap.
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'eh-fab-menu-close';
        closeBtn.style.setProperty('--eh-index', String(items.length));
        closeBtn.setAttribute('aria-label', config.closeLabel || 'Fermer');
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', function () {
            forceClose();
        });
        menu.appendChild(closeBtn);
    }

    function openMenu() {
        renderMenu();
        setState('menu');
    }

    // Fermeture complète (état 1) : utilisée pour le clic en dehors, Échap,
    // et un nouveau clic sur l'engrenage pendant que menu/détail est ouvert.
    function forceClose() {
        if (state === 'closed') return;
        var closingId = activeDetail;
        activeDetail = null;
        setState('closed');
        if (closingId) {
            // Le module qui était affiché doit remettre à jour son propre
            // indicateur interne (ex. classe .visible), même s'il n'est pas
            // celui qui a demandé cette fermeture (clic extérieur, Échap...).
            document.dispatchEvent(new CustomEvent('eh:closed', { detail: { id: closingId } }));
        }
    }

    toggle.addEventListener('click', function () {
        if (state === 'closed') {
            openMenu();
        } else {
            forceClose();
        }
    });

    document.addEventListener('click', function (event) {
        if (state !== 'closed' && !fab.contains(event.target)) forceClose();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && state !== 'closed') forceClose();
    });

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            updateScrollPercent();
            if (state === 'menu') renderMenu();
            ticking = false;
        });
    }, { passive: true });

    updateScrollPercent();

    // API exposée aux modules (cookie, sticky cart, accessibilité...) pour
    // afficher/masquer LEUR contenu dans le slot #eh-fab-detail. Le noyau ne
    // connaît pas ce contenu : chaque module bascule sa propre classe
    // d'affichage via applyFn, le noyau se charge uniquement de faire
    // grandir/rétrécir l'objet partagé et de choisir quel contenu montrer.
    // Déplace le focus clavier dans le contenu qui vient de s'afficher : le
    // premier enfant de #eh-fab-detail dont le CSS le rend visible (voir les
    // sélecteurs par data-detail dans assets/css/core.css) porte lui-même un
    // tabindex="-1" (cookie-consent, sticky-cart, accessibility), ce fichier
    // n'a donc pas besoin de connaître la structure interne de chaque module.
    function focusActiveDetail() {
        var children = detail.children;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (window.getComputedStyle(child).display !== 'none') {
                if (typeof child.focus === 'function') child.focus();
                return;
            }
        }
    }

    window.ehHub = {
        // Affiche le contenu du module `id` (état 3). À utiliser aussi bien
        // pour une ouverture manuelle (icône cliquée) qu'automatique (ex. le
        // panier qui apparaît au scroll sur une fiche produit).
        showDetail: function (id, applyFn) {
            activeDetail = id;
            fab.setAttribute('data-detail', id);
            setState('detail');
            if (typeof applyFn === 'function') applyFn();
            focusActiveDetail();
        },
        // Fermeture AUTOMATIQUE (ex. la barre panier qui se masque au scroll,
        // sans action explicite de l'utilisateur) : retour direct à l'état
        // fermé, pas d'intérêt à réafficher le choix des icônes.
        hideDetail: function (id, applyFn) {
            if (activeDetail !== id) return;
            activeDetail = null;
            setState('closed');
            if (typeof applyFn === 'function') applyFn();
        },
        // Croix de fermeture À L'INTÉRIEUR du contenu détaillé (état 3) :
        // revient au choix des icônes (état 2), comportement confirmé plutôt
        // qu'une fermeture totale.
        backToMenu: function (id, applyFn) {
            if (activeDetail !== id) return;
            activeDetail = null;
            renderMenu();
            setState('menu');
            if (typeof applyFn === 'function') applyFn();
        }
    };
})();
