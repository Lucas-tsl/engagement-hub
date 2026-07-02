# Engagement Hub 🧩

Plugin WordPress/WooCommerce unique qui regroupe, derrière **un seul bouton flottant** (icône engrenage, bas droite du site), plusieurs modules d'engagement client. Né de la fusion de deux plugins précédemment séparés (`banner-cookie-custom` et `sticky-cart`), conçu dès le départ pour accueillir de nouveaux modules sans toucher au noyau.

## 🎯 Origine : le schéma

Le design vient du croquis dans [`docs/schema.png`](docs/schema.png) :

- Un bouton **engrenage** fixe en bas à droite du site, qui tourne légèrement au scroll.
- Au clic, il déploie un petit menu d'icônes empilées (sélection de modules actifs sur la page courante).
- Chaque icône a sa propre condition d'apparition :
  - 🍪 **Cookies** — toujours visible, ouvre les préférences de consentement.
  - ↑ **Haut de page** — apparaît après 70% de scroll.
  - 🛒 **Ajout panier** — visible uniquement sur fiche produit, déclenche l'ajout au panier depuis la barre sticky.
  - ▶️ **Vidéo à la une** *(à venir)* — vidéo courte associée à une annonce produit.
  - ♿ **Accessibilité** *(à venir)* — langue, police, contraste.

L'implémentation actuelle du menu est un "speed dial" (pile d'icônes qui apparaît au-dessus du bouton) plutôt que le tracé radial en toile du croquis — même logique de déclenchement conditionnel, rendu plus simple à maintenir. Le style visuel (disposition en éventail, courbes) peut évoluer plus tard sans toucher à la mécanique.

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
    sticky-cart/        # Barre sticky d'ajout au panier (ex sticky-cart)
    video-ads/           # Module déclaré mais non développé (roadmap)
    accessibility/        # Module déclaré mais non développé (roadmap)
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

Chaque module écoute cet événement et réagit s'il reconnaît l'action (voir `assets/js/cookie-consent.js` et `assets/js/sticky-cart.js`). Ce découplage est ce qui permet d'ajouter un module sans modifier le noyau.

### Ajouter un nouveau module

1. Créer `includes/modules/mon-module/module.php`, y appeler `EH_Module_Registry::register('mon-module', [...])` avec une `icon`, une `fab_action`, et `'available' => true`.
2. Ajouter le require dans `engagement-hub.php`.
3. Créer les assets `assets/css/mon-module.css` / `assets/js/mon-module.js`, enqueués depuis le module comme le fait `sticky-frontend.php`.
4. Dans le JS du module, écouter `document.addEventListener('eh:action', ...)` et réagir à ta `fab_action`.

Les modules `video-ads` et `accessibility` sont déjà déclarés avec `'available' => false` : ils apparaissent dans le tableau de bord admin ("Bientôt disponible") mais n'ont ni assets ni logique — prêts à être complétés en suivant ce schéma.

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

## 📦 Installation sur le site

1. Télécharger `engagement-hub.zip` depuis une Release GitHub (ou lancer `npm run` / le job `build` en local).
2. L'uploader dans **Extensions > Ajouter** sur WordPress.
3. Activer le plugin, puis aller dans **Réglages > Engagement Hub** pour activer/désactiver les modules et accéder à leurs réglages spécifiques (ex. textes de la bannière cookie).
