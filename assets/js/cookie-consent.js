document.addEventListener("DOMContentLoaded", function() {
    const banner = document.getElementById("bcc-banner-card");
    const modal = document.getElementById("bcc-modal-overlay");
    const modalBox = modal ? modal.querySelector(".bcc-modal") : null;

    let lastFocusedElement = null;

    function getFocusableModalElements() {
        return modalBox.querySelectorAll('button, input:not([disabled]), a[href]');
    }

    function handleModalKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = getFocusableModalElements();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function openModal(trigger) {
        if (!modal || !modalBox) return;
        lastFocusedElement = trigger || document.activeElement;
        modal.classList.add("bcc-modal-overlay-open");
        modalBox.focus();
        document.addEventListener("keydown", handleModalKeydown);
        if (window.ehHub) window.ehHub.openPanel("cookie-consent");
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("bcc-modal-overlay-open");
        document.removeEventListener("keydown", handleModalKeydown);
        if (lastFocusedElement) lastFocusedElement.focus();
        if (window.ehHub) window.ehHub.closePanel("cookie-consent");
    }

    function setConsent(stats, mkt) {
        const expires = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        // "secure" est ignoré silencieusement par le navigateur en HTTP : ne l'ajouter
        // qu'en HTTPS, sinon le cookie n'est jamais posé (boucle infinie en dev/staging).
        const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
        const consentVersion = (typeof ehCookieConfig !== "undefined" && ehCookieConfig.consentVersion) ? ehCookieConfig.consentVersion : "1";
        document.cookie = `bcc_consent_stats=${stats}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
        document.cookie = `bcc_consent_mkt=${mkt}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
        document.cookie = `bcc_consent_version=${consentVersion}; expires=${expires}; path=/; samesite=strict${secureFlag}`;
        document.cookie = `bcc_consent_all=1; expires=${expires}; path=/; samesite=strict${secureFlag}`;

        let statsStatus = stats === 1 ? 'granted' : 'denied';
        let mktStatus = mkt === 1 ? 'granted' : 'denied';

        if(typeof gtag === 'function') {
            gtag('consent', 'update', {
                'ad_storage': mktStatus,
                'ad_user_data': mktStatus,
                'ad_personalization': mktStatus,
                'analytics_storage': statsStatus
            });
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'event': 'cookie_consent_updated' });

        if(banner) banner.style.display = "none";
        document.removeEventListener("keydown", handleModalKeydown);
        if (modal) modal.classList.remove("bcc-modal-overlay-open");
        if (window.ehHub) window.ehHub.closePanel("cookie-consent");
    }

    const btnAccepter = document.getElementById("bcc-btn-accepter");
    const btnRefuser = document.getElementById("bcc-btn-refuser");
    const btnPrefs = document.getElementById("bcc-btn-prefs");
    const btnSavePrefs = document.getElementById("bcc-btn-save-prefs");
    const btnCloseModal = document.getElementById("bcc-btn-close-modal");
    const btnModalCross = modal ? modal.querySelector(".bcc-modal-close") : null;

    if(btnAccepter) btnAccepter.addEventListener("click", () => setConsent(1, 1));
    if(btnRefuser) btnRefuser.addEventListener("click", () => setConsent(0, 0));

    if(btnPrefs) btnPrefs.addEventListener("click", () => {
        banner.style.display = "none";
        openModal(btnPrefs);
    });

    // Clic en dehors du panneau (mais pas sur le bouton engrenage lui-même,
    // qui gère déjà ses propres clics) : on referme.
    document.addEventListener("click", (event) => {
        if (!modal || !modal.classList.contains("bcc-modal-overlay-open")) return;
        if (modal.contains(event.target)) return;
        const fab = document.getElementById("eh-fab");
        if (fab && fab.contains(event.target)) return;
        closeModal();
    });

    if(btnCloseModal) btnCloseModal.addEventListener("click", () => {
        if(!document.cookie.includes('bcc_consent_all')) banner.style.display = "block";
        closeModal();
    });

    // Croix de fermeture en coin, cohérente avec les panneaux panier et
    // accessibilité (assets/js/sticky-cart.js, assets/js/accessibility.js).
    if(btnModalCross) btnModalCross.addEventListener("click", () => {
        if(!document.cookie.includes('bcc_consent_all')) banner.style.display = "block";
        closeModal();
    });

    if(btnSavePrefs) btnSavePrefs.addEventListener("click", () => {
        const stats = document.getElementById("chk-stats").checked ? 1 : 0;
        const mkt = document.getElementById("chk-mkt").checked ? 1 : 0;
        setConsent(stats, mkt);
    });

    // Réouverture de la modale depuis l'icône 🍪 du bouton flottant central (hub)
    document.addEventListener("eh:action", function(event) {
        if (event.detail && event.detail.action === "open-cookie-modal") {
            if (banner) banner.style.display = "none";
            openModal();
        }
    });

    // Un autre panneau du hub (ex. panier) vient de s'ouvrir : on se referme.
    document.addEventListener("eh:panel-close", function(event) {
        if (event.detail && event.detail.id === "cookie-consent") {
            if (modal) modal.classList.remove("bcc-modal-overlay-open");
            document.removeEventListener("keydown", handleModalKeydown);
        }
    });
});
