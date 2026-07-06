# Changelog

Toutes les versions notables du plugin sont documentées ici. Ce fichier est
mis à jour à chaque Release (voir README, section Workflow).

## [1.3.1]

- Correctif : dans le panneau détaillé (cookies/panier/accessibilité), la
  zone de défilement ne s'activait jamais (bouton "Annuler" inaccessible)
  car elle dépendait d'une hauteur en pourcentage résolue contre un ancêtre
  en `height: auto`. Chaque panneau porte maintenant sa propre limite de
  hauteur (`max-height`), indépendante de `#eh-fab`.
- Contraste renforcé entre le fond du menu (choix des icônes) et les bulles
  blanches, difficiles à distinguer l'une de l'autre.

## [1.3.0]

- Refonte du bouton flottant : engrenage, choix des icônes et contenu d'un
  module ne sont plus 3 éléments visuels distincts, mais un seul objet
  (`#eh-fab`) qui grandit à travers 3 états (fermé → choix des icônes →
  contenu détaillé), plutôt qu'un menu séparé flottant au-dessus d'un panneau
  lui-même séparé.
- La croix de fermeture d'un panneau (cookies/panier/accessibilité) revient
  désormais au choix des icônes plutôt que de tout refermer d'un coup ; un
  clic en dehors ou Échap referme entièrement.
- Les panneaux ne sont plus des éléments `position: fixed` indépendants avec
  leur propre habillage (fond flouté, ombre, bordure) : ce sont maintenant de
  simples blocs de contenu affichés dans le même objet visuel que
  l'engrenage, qui seul porte la position et l'habillage.

## [1.2.0]

- Renommé "LSG Hub" (en-tête du plugin, menu admin) — reste identifié en
  interne comme `engagement-hub` (préfixe `eh_`, text-domain, dépôt).
- Rattachement au menu "Saito" retiré : le plugin gère désormais son propre
  menu de premier niveau, entièrement indépendant de tout autre plugin.
- Animation d'ouverture des panneaux (cookies/panier/accessibilité) revue :
  remplace la View Transitions API (support navigateur incertain, aucun
  effet visible constaté) par un calcul de position réelle de la bulle
  cliquée (getBoundingClientRect) + une transition CSS scale() classique,
  fiable sur tous les navigateurs.

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
