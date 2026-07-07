# Changelog

Toutes les versions notables du plugin sont documentées ici. Ce fichier est
mis à jour à chaque Release (voir README, section Workflow).

## [1.4.0]

Passage d'audit UX/accessibilité complet sur les 3 panneaux (cookies, panier,
accessibilité), suivi d'une refonte de l'identité visuelle du bouton flottant.

### Accessibilité
- Lien d'évitement "Aller au contenu" (WCAG 2.4.1), absent jusqu'ici.
- Nouveau réglage de taille du texte (+/-, mémorisé comme les autres).
- Nouvelle bascule "Souligner les liens".
- Bouton "Réinitialiser les réglages" (contraste, curseur, soulignage, taille).
- Filtre de contraste élevé adouci, complété d'un soulignement systématique
  des liens (un filtre seul ne garantit aucun ratio de contraste précis).

### Consentement cookies
- "Tout Accepter" et "Tout Refuser" ont désormais la même prééminence
  visuelle (conformité CNIL) ; "Personnaliser" devient un lien secondaire.
- Bannière et case "Strictement nécessaires" correctement annoncées aux
  lecteurs d'écran (rôle ARIA, `<label>` manquant).
- Confirmation "Préférences enregistrées" après un choix.
- Nouveau shortcode `[eh_cookie_preferences_link]` pour un lien "Gérer les
  cookies" en pied de page.
- Corrigé : "Personnaliser mes choix" se refermait dans le même clic que
  celui qui l'ouvrait, à la toute première apparition de la bannière.
- Bordures et ombres adoucies pour coller au thème réel du site.

### Ajout au panier
- Icône retirée du menu de l'engrenage : le panneau s'affiche déjà tout
  seul au scroll sur une fiche produit, l'entrée manuelle était redondante.
- Prix et disponibilité fiabilisés sur les événements WooCommerce plutôt que
  des délais devinés ; défilement optimisé (throttle par requestAnimationFrame).
- Variation par défaut dérivée génériquement (URL / sélection WooCommerce)
  au lieu d'une liste codée en dur propre à un seul produit.
- `aria-live` sur le prix/la rupture de stock, `aria-pressed` sur les
  boutons de variation, confirmation "✓ Ajouté" après un ajout réussi.
- Disposition revue : image et nom du produit sur une rangée, sélecteur de
  variation dans la même colonne sur desktop/tablette (le panneau a sa
  propre largeur, 480px) et en pleine largeur sur mobile.
- Corrigé une collision de nom de classe avec le sélecteur de variation
  propre au thème du site (les deux composants partageaient `.sticky-var-img`).

### Bouton flottant (noyau)
- Focus clavier déplacé automatiquement à l'ouverture de n'importe lequel
  des 3 panneaux (auparavant seulement les cookies).
- Lien d'évitement dédié pour atteindre le bouton sans tabuler toute la page.
- Position du bouton réglable (bas gauche/droite) depuis le tableau de bord,
  pour éviter une collision avec un widget tiers (chat, WhatsApp...).
- Identité visuelle revue pour coller au thème réel du site (palette et
  police tirées de son theme.json) plutôt qu'un style générique : bordures
  fines, aucune ombre dure, bouton fermé réduit.
- Les tailles de police du plugin sont passées de px à rem : le réglage
  "taille du texte" du panneau accessibilité s'applique désormais aussi à
  l'interface du plugin elle-même, pas seulement au reste du site.

## [1.3.3]

- Croix de fermeture des panneaux (cookies/panier/accessibilité) éloignée
  de la barre de défilement, qui pouvait la rendre difficile à cliquer
  précisément une fois le contenu assez long pour défiler.
- Agrandissement de l'objet ralenti et adouci (durée plus longue, courbe de
  décélération progressive) : le mouvement précédent était jugé trop brusque.
- Corrigé un effet de bord perturbant à l'ouverture du menu : les icônes
  apparaissaient brièvement à la ligne (verticales) avant que la largeur
  finale ne soit atteinte et qu'elles ne se remettent en ligne. Elles restent
  maintenant invisibles le temps que l'agrandissement soit terminé.

## [1.3.2]

- Fond du menu (choix des icônes) redevenu transparent (`0%` d'opacité,
  flou conservé), sur demande explicite — remplace le fond gris clair de
  la 1.3.1.
- Ajout d'une croix de fermeture à droite des icônes du menu, pour revenir
  directement à l'engrenage (état 1) sans devoir cliquer en dehors ou
  faire Échap.

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
