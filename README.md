# Engagement Hub 🧩

Plugin WordPress/WooCommerce unique qui regroupe, derrière **un seul bouton flottant** (icône engrenage, bas droite du site), plusieurs modules d'engagement client. Né de la fusion de deux plugins précédemment séparés (`banner-cookie-custom` et `sticky-cart`), conçu dès le départ pour accueillir de nouveaux modules sans toucher au noyau.

## 🎯 Origine : le schéma

Le design vient du croquis dans [`docs/schema.png`](docs/schema.png) :

- Un bouton **engrenage** fixe en bas à droite du site, qui tourne légèrement au scroll.
- Au clic, il déploie un petit menu d'icônes empilées (sélection de modules actifs sur la page courante).
- Chaque icône a sa propre condition d'apparition, et ouvre un **panneau ancré au bouton** (pas un widget indépendant) :
  - 🍪 **Cookies** — toujours visible, ouvre le panneau de préférences de consentement.
  - ↑ **Haut de page** — apparaît après 50% de scroll, remonte la page.
  - 🛒 **Ajout panier** — visible uniquement sur fiche produit, ouvre le panneau produit (image, variation, ajout au panier).
  - ♿ **Accessibilité** — toujours visible, ouvre le panneau langue (Google Traduction) / contraste / curseur agrandi.
  - ▶️ **Vidéo à la une** *(à venir)* — vidéo courte associée à une annonce produit.

L'implémentation actuelle du menu est un "speed dial" (pile d'icônes qui apparaît au-dessus du bouton) plutôt que le tracé radial en toile du croquis — même logique de déclenchement conditionnel, rendu plus simple à maintenir. Le style visuel (disposition en éventail, courbes) peut évoluer plus tard sans toucher à la mécanique.

**Panneaux ancrés, pas de widgets indépendants.** Cookies, panier et accessibilité s'affichent tous comme un panneau compact qui apparaît depuis le coin bas-droit du bouton engrenage (`transform-origin: bottom right`, même position `right: 20px; bottom: 90px`), et l'engrenage "pulse" tant qu'un panneau est ouvert — pour que tout se lise comme un seul système. Le panier reste **automatique** (s'ouvre au scroll sur fiche produit, comme avant) ; la toute première bannière de consentement cookie reste **indépendante et immédiate** (exigence RGPD : elle ne doit pas nécessiter un clic sur l'engrenage) — seule sa réouverture après coup passe par le panneau.

## 🏗️ Architecture

```
engagement-hub.php              # Bootstrap : constantes, charge le noyau puis les modules
includes/
  core/
    class-eh-module-registry.php  # Registre : chaque module s'y déclare (icône, condition, option d'activation…)
    helpers.php                   # Petits helpers partagés (enqueue, permissions, sanitisation)
    admin-menu.php                # Page "Réglages > Engagement Hub" : active/désactive les modules
    frontend.php                  # Enqueue des assets du noyau + construit la config JS du bouton flottant
  modules/
    cookie-consent/    # Consentement cookies + Google Consent Mode V2 (ex banner-cookie-custom)
    sticky-cart/        # Panneau produit (image, variation, ajout au panier), auto sur fiche produit (ex sticky-cart)
    accessibility/        # Panneau langue (Google Traduction), contraste, curseur agrandi
    video-ads/           # Module déclaré mais non développé (roadmap)
assets/
  css/core.css, js/core.js        # Bouton engrenage + menu
  css/*, js/*                     # Un fichier par module actif
docs/schema.png                  # Croquis d'origine
```

### Comment les modules communiquent avec le bouton central

Le noyau ne connaît **aucun détail** des modules. Il lit juste `EH_Module_Registry` pour savoir quelles icônes afficher, et quand l'une est cliquée il envoie un événement générique :

```js
document.dispatchEvent(new CustomEvent('eh:action', { detail: item }));
```

Chaque module écoute cet événement et réagit s'il reconnaît l'action (voir `assets/js/cookie-consent.js`, `assets/js/sticky-cart.js`, `assets/js/accessibility.js`). Ce découplage est ce qui permet d'ajouter un module sans modifier le noyau.

Le noyau expose aussi une petite API (`assets/js/core.js`) pour coordonner l'ouverture des panneaux, afin qu'un seul soit visible à la fois et que le bouton engrenage "pulse" tant que c'est le cas :

```js
window.ehHub.openPanel('mon-module');   // ferme le panneau précédent, fait pulser l'engrenage
window.ehHub.closePanel('mon-module');
// tout module doit écouter 'eh:panel-close' et se fermer si detail.id === son propre id
```

### Ajouter un nouveau module

1. Créer `includes/modules/mon-module/module.php`, y appeler `EH_Module_Registry::register('mon-module', [...])` avec une `icon`, une `fab_action`, et `'available' => true`.
2. Ajouter le require dans `engagement-hub.php`.
3. Créer les assets `assets/css/mon-module.css` / `assets/js/mon-module.js`, enqueués depuis le module comme le fait `sticky-frontend.php`.
4. Dessiner le panneau comme un panneau ancré (voir `assets/css/accessibility.css` pour le patron : `position: fixed; right: 20px; bottom: 90px; transform-origin: bottom right;`), avec un bouton de fermeture.
5. Dans le JS du module, écouter `document.addEventListener('eh:action', ...)` pour ouvrir le panneau (`window.ehHub.openPanel('mon-module')`), et `eh:panel-close` pour le refermer si un autre panneau s'ouvre.

Le module `video-ads` est déjà déclaré avec `'available' => false` : il apparaît dans le tableau de bord admin ("Bientôt disponible") mais n'a ni assets ni logique — prêt à être complété en suivant ce schéma (c'est exactement comme ça qu'`accessibility` a été construit).

## 🛠️ Développement

```bash
composer install   # PHP_CodeSniffer + WordPress Coding Standards
npm install         # ESLint + Stylelint

vendor/bin/phpcs    # Lint PHP
npm run lint        # Lint JS + CSS
```

## 🚀 CI/CD

`.github/workflows/ci.yml` :
- **CI** : à chaque push/PR sur `main` — syntaxe PHP, PHPCS, ESLint, Stylelint.
- **CD** : job `build` qui assemble un zip installable du plugin (fichiers de dev exclus via `.distignore`), publié comme artefact de build à chaque push, et attaché à une **Release GitHub** automatique quand un tag `vX.Y.Z` est poussé.

```bash
git tag v1.0.0
git push origin v1.0.0
# -> Release GitHub avec engagement-hub.zip prêt à uploader dans wp-content/plugins/
```

## ⚠️ À savoir : module Accessibilité

La traduction redirige vers le proxy **translate.goog** de Google (ex. `monsite-fr.translate.goog`) — le mécanisme utilisé par Google lui-même pour ses liens "Traduire cette page". L'ancien widget intégré à la page (`Google Website Translator`) a été abandonné : Google ne l'ouvre plus aux nouveaux domaines, il se charge sans erreur mais ne traduit jamais rien. Le proxy est plus fiable, mais implique une vraie navigation vers ce domaine Google le temps de la traduction ; les appels AJAX du thème/WooCommerce (ex. ajout au panier) peuvent s'y comporter différemment puisque la page n'est plus servie directement par le site. Si ça pose problème, WPML (déjà installé sur le site) resterait une alternative plus robuste pour ce module. Le contraste élevé et le curseur agrandi sont, eux, 100% CSS/JS maison (pas de dépendance externe) et mémorisés via `localStorage`.

## 📦 Installation sur le site

1. Télécharger `engagement-hub.zip` depuis une Release GitHub (ou lancer `npm run` / le job `build` en local).
2. L'uploader dans **Extensions > Ajouter** sur WordPress.
3. Activer le plugin, puis aller dans **Réglages > Engagement Hub** pour activer/désactiver les modules et accéder à leurs réglages spécifiques (ex. textes de la bannière cookie).
