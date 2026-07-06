# Changelog

Toutes les versions notables du plugin sont documentées ici. Ce fichier est
mis à jour à chaque Release (voir README, section Workflow).

## [1.1.0]

- Panneaux (cookies, panier, accessibilité) : design unifié (fond translucide
  flouté, ombre douce, coins carrés), croix de fermeture cohérente, focus
  clavier visible, largeurs adaptées desktop/laptop/mobile.
- Icônes du menu remplacées par des SVG monochromes dessinés (fiabilité
  cross-navigateur, l'emoji restant un repli pour un module sans icône dédiée).
- Fusion visuelle entre la bulle du menu cliquée et le panneau qui s'ouvre,
  via la View Transitions API (repli silencieux si non supportée).
- Module accessibilité : contraste élevé, curseur agrandi, langue pilotée par
  WPML (détection de la langue active, sans dépendance à un service Google).
- Rupture de stock : le bouton "Ajouter au panier" est remplacé par un texte,
  plus fiable qu'un bouton simplement désactivé.
- Traduction du plugin lui-même auto-suffisante (dictionnaire PHP interne,
  détection de la langue WPML), sans fichier .mo ni plugin supplémentaire.
- Rattachement automatique au menu admin "Saito" s'il est présent et
  réellement enregistré (vérification robuste, plus fiable qu'un simple
  `function_exists()`).
- Détection de l'image produit renforcée (galeries en lazy-loading).

## [1.0.0]

- Fusion des plugins `banner-cookie-custom` et `sticky-cart` en un hub unique
  piloté par un bouton flottant (moteur de modules, registre commun).
- Modules cookies (consentement RGPD + Google Consent Mode V2) et panier
  (sticky add-to-cart) migrés depuis les plugins d'origine.
- CI/CD GitHub Actions : lint PHP/JS/CSS, build d'un zip installable.
