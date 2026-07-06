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
            // Icône dans un span dédié : le filtre CSS qui la rend monochrome
            // (assets/css/core.css) ne doit pas s'appliquer au fond blanc du
            // bouton lui-même.
            var icon = document.createElement('span');
            icon.className = 'eh-fab-item-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = item.icon;
            btn.appendChild(icon);
            btn.addEventListener('click', function () {
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
    // modules) affiche son propre panneau ancré à l'engrenage, mais un seul
    // peut être ouvert à la fois. Le noyau ne connaît pas leur contenu : il
    // se contente de fermer le panneau précédent et de "lier" visuellement
    // l'engrenage (pulsation) tant qu'un panneau est ouvert.
    var activePanel = null;

    window.ehHub = {
        openPanel: function (id) {
            if (activePanel && activePanel !== id) {
                document.dispatchEvent(new CustomEvent('eh:panel-close', { detail: { id: activePanel } }));
            }
            activePanel = id;
            fab.classList.add('eh-fab-linked');
            document.dispatchEvent(new CustomEvent('eh:panel-open', { detail: { id: id } }));
        },
        closePanel: function (id) {
            if (activePanel !== id) return;
            activePanel = null;
            fab.classList.remove('eh-fab-linked');
            document.dispatchEvent(new CustomEvent('eh:panel-close', { detail: { id: id } }));
        },
        // Conservé pour compatibilité : un module peut encore piloter le
        // "lien" visuel sans passer par un panneau à proprement parler.
        setLinked: function (active) {
            fab.classList.toggle('eh-fab-linked', !!active);
        }
    };
})();
