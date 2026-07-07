# LSG Hub 🧩 (dépôt "Engagement Hub")

Plugin WordPress/WooCommerce unique qui regroupe, derrière **un seul bouton flottant** (icône engrenage, bas droite du site), plusieurs modules d'engagement client. Né de la fusion de deux plugins précédemment séparés (`banner-cookie-custom` et `sticky-cart`), conçu dès le départ pour accueillir de nouveaux modules sans toucher au noyau.

Nommé **"LSG Hub"** dans WordPress (liste des extensions, menu admin) ; le nom de code interne (préfixe `eh_`, text-domain `engagement-hub`, dépôt Git) reste `engagement-hub` pour ne pas renommer des centaines de références sans bénéfice fonctionnel. Entièrement indépendant : ne se rattache à aucun autre plugin/menu.

## 🎯 Origine : le schéma

Le design vient du croquis dans [`docs/schema.png`](docs/schema.png) :

- Un bouton **engrenage** fixe en bas à droite du site, qui tourne légèrement au scroll.
- Au clic, il déploie un petit menu d'icônes empilées (sélection de modules actifs sur la page courante).
- Chaque icône a sa propre condition d'apparition, et ouvre un **panneau ancré au bouton** (pas un widget indépendant) :
  - 🍪 **Cookies** — toujours visible, ouvre le panneau de préférences de consentement.
  - ↑ **Haut de page** — apparaît après 50% de scroll, remonte la page.
  - ♿ **Accessibilité** — toujours visible, ouvre le panneau langue (WPML) / taille du texte / contraste / curseur agrandi / soulignage des liens.
  - ▶️ **Vidéo à la une** *(à venir)* — vidéo courte associée à une annonce produit.
  - 🛒 **Ajout panier** — n'est **pas** une icône du menu : sur fiche produit, le panneau produit (image, variation, ajout au panier) s'affiche et se masque tout seul selon le scroll, comme le fait le bouton "Haut de page" mais sans jamais passer par le choix des icônes.

**Un seul objet, 3 états, pas trois blocs séparés.** Le bouton engrenage (`#eh-fab`) n'ouvre pas un menu flottant au-dessus d'un panneau lui-même indépendant : c'est le même élément DOM qui grandit successivement — (1) fermé (petit cercle avec l'engrenage), (2) menu (le cercle s'agrandit et révèle le choix des icônes en son sein), (3) détail (il s'agrandit encore pour montrer le contenu du module choisi : cookies, panier ou accessibilité). Une croix de fermeture dans le contenu détaillé revient à l'étape 2 (choix des icônes) ; un clic en dehors ou Échap referme tout d'un coup. Le panier reste **automatique** (s'ouvre au scroll sur fiche produit, en sautant directement à l'étape 3) ; la toute première bannière de consentement cookie reste **indépendante et immédiate** (exigence RGPD : elle ne doit pas nécessiter un clic sur l'engrenage) — seule sa réouverture après coup passe par le panneau.

## 🏗️ Architecture

```
engagement-hub.php              # Bootstrap : constantes, charge le noyau puis les modules
includes/
  core/
    class-eh-module-registry.php  # Registre : chaque module s'y déclare (icône, condition, option d'activation…)
    helpers.php                   # Petits helpers partagés (enqueue, permissions, sanitisation)
    admin-menu.php                # Menu top-level "LSG Hub" : active/désactive les modules
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

Le noyau expose aussi une petite API (`assets/js/core.js`) pour afficher le contenu d'un module dans le slot partagé `#eh-fab-detail`, seul endroit où `#eh-fab` grandit jusqu'à l'état 3 :

```js
window.ehHub.showDetail('mon-module', applyFn);   // affiche le module, fait grandir #eh-fab (état 3)
window.ehHub.backToMenu('mon-module', applyFn);   // fermeture MANUELLE (croix) : revient au choix des icônes (état 2)
window.ehHub.hideDetail('mon-module', applyFn);   // fermeture AUTOMATIQUE (ex. scroll) : referme entièrement (état 1)
// applyFn bascule la classe d'affichage propre au module (ex. .visible) ; à écouter aussi : 'eh:closed'
// (le hub s'est refermé alors que ce module était actif, ex. clic en dehors) pour remettre à jour cette classe.
```

### Ajouter un nouveau module

1. Créer `includes/modules/mon-module/module.php`, y appeler `EH_Module_Registry::register('mon-module', [...])` avec une `icon`, une `fab_action`, et `'available' => true`.
2. Ajouter le require dans `engagement-hub.php`.
3. Créer les assets `assets/css/mon-module.css` / `assets/js/mon-module.js`, enqueués depuis le module comme le fait `sticky-frontend.php`.
4. Le contenu du panneau (rendu en PHP dans `wp_footer`) est un simple bloc qui remplit son conteneur (`width: 100%; height: 100%;`, voir `assets/css/accessibility.css` pour le patron) : position, taille et habillage viennent de `#eh-fab` lui-même, pas du module. `assets/js/core.js` déplace automatiquement tout élément rendu en PHP vers `#eh-fab-detail` au chargement (voir la liste d'ids à la fin de ce fichier) ; un panneau créé dynamiquement en JS (comme `sticky-cart.js`) doit s'y injecter directement.
5. Dans le JS du module, écouter `document.addEventListener('eh:action', ...)` pour afficher le panneau (`window.ehHub.showDetail('mon-module', applyFn)`), avec un bouton de fermeture qui appelle `window.ehHub.backToMenu('mon-module', applyFn)`.

Le module `video-ads` est déjà déclaré avec `'available' => false` : il apparaît dans le tableau de bord admin ("Bientôt disponible") mais n'a ni assets ni logique — prêt à être complété en suivant ce schéma (c'est exactement comme ça qu'`accessibility` a été construit).

## 🛠️ Développement

```bash
composer install   # PHP_CodeSniffer + WordPress Coding Standards
npm install         # ESLint + Stylelint

vendor/bin/phpcs    # Lint PHP
npm run lint        # Lint JS + CSS
```

## 🌍 Traduction du plugin (auto-suffisante, sans plugin supplémentaire)

Toutes les chaînes du plugin passent par `__()`/`_e()`/`esc_html__()`/`esc_html_e()`/`esc_attr__()`/`esc_attr_e()` avec le text-domain `engagement-hub`. Plutôt que de dépendre d'un fichier `.mo` compilé (WordPress Coding Standards habituelles, mais qui demande un outil externe — WP-CLI, Poedit, ou un plugin comme Loco Translate), `includes/core/i18n.php` intercepte directement ces chaînes via le filtre `gettext` de WordPress et les traduit depuis un dictionnaire PHP embarqué dans le plugin :

- La langue active est détectée via l'API officielle de WPML (`wpml_current_language`), qui gère elle-même l'URL quel que soit le format configuré (sous-dossier, sous-domaine, paramètre) — le plugin n'a pas besoin de parser l'URL lui-même.
- Sans WPML, la détection retombe sur la locale WordPress (`get_locale()`), et si aucun dictionnaire ne correspond, les chaînes françaises d'origine s'affichent normalement : rien ne casse sur un site sans WPML.
- Aucune installation supplémentaire, aucune compilation : le dictionnaire anglais (`eh_dictionary_en()`) est actif dès l'activation du plugin.

`languages/engagement-hub.pot` et `engagement-hub-en_US.po` restent fournis en complément (utiles pour un traducteur qui préfère l'outillage gettext standard, ou pour repartir sur WPML String Translation), mais ne sont **pas** le mécanisme utilisé en pratique sur ce site.

**Ajouter une langue** : dupliquer le motif de `eh_dictionary_en()` dans `includes/core/i18n.php` (ex. `eh_dictionary_de()`), l'ajouter au tableau `$dictionaries` dans `eh_translate_strings()` avec la clé de langue WPML correspondante (ex. `'de'`), et traduire les valeurs.

## 🚀 Workflow de contribution & CI/CD

### Branches, issues, PR

- Une idée/un bug → une **Issue** GitHub (modèles disponibles : Bug, Fonctionnalité).
- Une branche par sujet, préfixée par son type : `feat/xxx`, `fix/xxx`, `style/xxx`, `chore/xxx`.
- Une **Pull Request** vers `main` pour chaque branche (même en solo : ça déclenche la CI — lint PHP/JS/CSS + build — avant la fusion, et garde un historique clair). `main` doit rester dans un état déployable en permanence : c'est ce qui part automatiquement en staging.

### Versions

- Numéro de version tenu à jour à **deux endroits synchronisés** dans `engagement-hub.php` : l'en-tête `Version:` et la constante `EH_VERSION`.
- `CHANGELOG.md` : une entrée par version, résumant les changements côté utilisateur (pas un copier-coller des messages de commit).
- Semver simple : `MAJOR.MINOR.PATCH` (`PATCH` pour un correctif, `MINOR` pour une fonctionnalité, `MAJOR` pour un changement qui casse la compatibilité).

### CI/CD (`.github/workflows/ci.yml`)

| Déclencheur | Jobs exécutés |
|---|---|
| Push ou PR sur `main` | `php`, `js-css` (lint), `build` (assemble le zip, sans déployer) |
| Push sur `main` | + `deploy-staging` (SFTP automatique) |
| Release GitHub publiée (tag `vX.Y.Z`) | + `deploy-production` (SFTP, gate manuelle possible — voir ci-dessous) |

**Mettre en production** (une fois le staging vérifié) :
```bash
# 1. Bumper la version dans engagement-hub.php (en-tête + EH_VERSION) et CHANGELOG.md, commiter sur main
# 2. Créer la release (déclenche deploy-production) :
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --generate-notes
```

### Mise en place des secrets SFTP (à faire une seule fois, dans GitHub)

Cette partie ne peut être faite que par toi, dans les réglages du dépôt — je n'ai jamais accès à tes identifiants SFTP.

1. **Settings > Environments** du dépôt GitHub → créer deux environnements : `staging` et `production`.
2. Dans **production**, cocher **Required reviewers** et t'ajouter toi-même : chaque déploiement production sera alors mis en pause jusqu'à ce que tu cliques "Approve" dans l'onglet Actions — c'est le "après vérification du staging, on peut ou non lancer en prod" demandé.
3. Dans chaque environnement, ajouter ces secrets (Settings > Environments > *nom* > Environment secrets) :
   - `STAGING_SFTP_HOST` / `STAGING_SFTP_USERNAME` / `STAGING_SFTP_PASSWORD` / `STAGING_SFTP_REMOTE_PATH` (ex. `/www/lessenteursgourmandesv2_421/public/wp-content/plugins/engagement-hub`)
   - `PRODUCTION_SFTP_HOST` / `PRODUCTION_SFTP_USERNAME` / `PRODUCTION_SFTP_PASSWORD` / `PRODUCTION_SFTP_REMOTE_PATH`

Une fois ces 8 secrets renseignés, chaque merge sur `main` se déploie seul en staging, et chaque Release GitHub se déploie en production après ton approbation.

## ⚠️ À savoir : module Accessibilité

La traduction s'appuie sur **WPML** (filtre officiel `wpml_active_languages`) : le sélecteur de langue liste les langues actives du site avec leurs vraies URLs traduites, calculées côté serveur. Si WPML n'est pas actif, le sélecteur n'apparaît pas du tout — pas de solution de repli vers un service Google, après deux échecs en conditions réelles (le widget `Google Website Translator` intégré à la page est abandonné par Google pour les nouveaux domaines depuis 2019 ; son proxy `translate.goog` ne peut pas non plus joindre un environnement d'hébergement non standard comme un staging Kinsta). Taille du texte, contraste élevé, curseur agrandi et soulignage des liens restent 100% CSS/JS maison (pas de dépendance externe) et mémorisés via `localStorage`.

## ⚙️ Réglages

Depuis le menu **LSG Hub** (voir Installation ci-dessous) :

- **Activation par module** — chaque module (cookies, panier, accessibilité, vidéo) peut être désactivé indépendamment.
- **Position du bouton** — bas droite (par défaut) ou bas gauche, utile si un widget tiers (chat, WhatsApp...) occupe déjà le bas droite du site.

Réglages spécifiques à un module :

- **Cookies** — texte de la bannière, logo, URLs politique de confidentialité/mentions légales (sous-menu "Cookies"). Le lien de réouverture des préférences n'est pas qu'une icône du bouton flottant : le shortcode `[eh_cookie_preferences_link]` (option `text="..."` pour changer le libellé, par défaut "Gérer les cookies") permet d'en poser un directement dans le footer du site ou n'importe quelle page/widget.

## 📦 Installation sur le site

1. Télécharger `engagement-hub.zip` depuis une Release GitHub (ou lancer `npm run` / le job `build` en local).
2. L'uploader dans **Extensions > Ajouter** sur WordPress.
3. Activer le plugin, puis aller dans le menu **LSG Hub** (premier niveau, indépendant de tout autre plugin) pour activer/désactiver les modules et accéder à leurs réglages spécifiques (ex. textes de la bannière cookie).
