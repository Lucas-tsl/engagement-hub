(function($) {
     'use strict';

     const stickyI18n = window.ehStickyCartI18n || {
         addToCartText: 'Ajouter au panier - ',
         addingText: 'Ajout en cours...',
         addedText: 'Ajouté',
         outOfStockText: 'Rupture de stock'
     };

     // De nombreux thèmes chargent les images de galerie en lazy-loading :
     // l'attribut "src" contient alors un espace réservé (vide, ou un tout
     // petit data-URI) tant que l'image n'est pas entrée dans le viewport, et
     // la vraie URL est dans un attribut data-*. On essaie plusieurs noms
     // usuels avant de se rabattre sur "src".
     function getImgSrc($img) {
         if (!$img || !$img.length) return '';
         const candidates = [
             $img.attr('data-lazy-src'),
             $img.attr('data-src'),
             $img.attr('data-srcset') ? $img.attr('data-srcset').split(' ')[0] : null,
             $img.attr('srcset') ? $img.attr('srcset').split(' ')[0] : null,
             $img.attr('src')
         ];
         for (let i = 0; i < candidates.length; i++) {
             const value = candidates[i];
             // Ignore les placeholders data-URI (souvent un gif/svg transparent 1x1).
             if (value && value.indexOf('data:image') !== 0) {
                 return value;
             }
         }
         return '';
     }

     // Pour un produit simple (sans variations), WooCommerce n'expose pas de
     // stock par variation : on se base sur ce qu'il affiche déjà sur la page.
     function isSimpleProductOutOfStock() {
         if ($('body').hasClass('outofstock')) return true;
         return $('.stock.out-of-stock').not('#stickyVariationBar *').length > 0;
     }

     // Retire complètement le bouton du DOM visible en rupture de stock (au
     // lieu d'un simple bouton désactivé) : impossible de le cliquer par
     // erreur ou de déclencher l'animation de chargement pour un produit (ou
     // une variation) indisponible. Un texte "Rupture de stock" le remplace.
     function setStickyOutOfStock($stickyBar, outOfStock) {
         const $btn = $stickyBar.find('.sticky-add-to-cart');
         const $label = $stickyBar.find('.sticky-out-of-stock');
         $btn.prop('disabled', outOfStock);
         if (outOfStock) {
             $btn.hide();
             $label.show();
         } else {
             $btn.show();
             $label.hide();
         }
     }

     // Confirmation brève après un ajout au panier réussi : sans elle, le
     // bouton revenait directement à son texte d'origine, sans qu'aucun
     // signal explicite ne confirme l'ajout si le mini-panier n'est pas dans
     // le champ de vision de l'utilisateur.
     function showAddedConfirmation($btn, originalText) {
         $btn.removeClass('loading').addClass('added').prop('disabled', false);
         $btn.html('<span class="added-text">✓ ' + (stickyI18n.addedText || 'Ajouté') + '</span>');
         setTimeout(function() {
             $btn.removeClass('added');
             $btn.html(originalText);
         }, 900);
     }

     // Créer le HTML du sticky bar
     function createStickyBar() {
         const stickyHTML = `
             <div class="sticky-variation-bar" id="stickyVariationBar" tabindex="-1">
                 <button type="button" class="sticky-panel-close" aria-label="Fermer">✕</button>
                 <div class="sticky-panel-scroll">
                     <div class="sticky-variation-content">
                         <!-- Image à gauche (agrandie), nom à droite : le
                              sélecteur de variation redescend en pleine
                              largeur juste en dessous (et non plus coincé
                              dans cette colonne étroite, où il manquait de
                              place et se retrouvait empilé en colonne). -->
                         <div class="sticky-product-row">
                             <div class="sticky-product-image">
                                 <img src="" alt="" class="sticky-product-img">
                             </div>
                             <div class="sticky-product-info">
                                 <div class="sticky-product-name"></div>
                             </div>
                         </div>
                         <div class="sticky-variation-options">
                             <div class="sticky-variation-buttons"></div>
                         </div>
                         <!-- role="status" + aria-live : le prix et le
                              passage bouton <-> rupture de stock changent
                              sans rechargement de page, un lecteur d'écran
                              a besoin d'être informé de ces mises à jour. -->
                         <div class="sticky-availability" role="status" aria-live="polite">
                             <button class="sticky-add-to-cart" disabled>
                                <span class="sticky-button-text">${stickyI18n.addToCartText}</span> &nbsp;
                                 <span class="sticky-price"></span>
                             </button>
                             <div class="sticky-out-of-stock" style="display:none;">${stickyI18n.outOfStockText}</div>
                         </div>
                     </div>
                 </div>
             </div>
         `;

         // Injecté directement dans le slot partagé #eh-fab-detail (voir
         // includes/core/frontend.php, assets/css/core.css) : ce panneau
         // n'est plus un élément fixed indépendant, mais un contenu du même
         // objet visuel que l'engrenage.
         var $detailSlot = $('#eh-fab-detail');
         if ($detailSlot.length) {
             $detailSlot.append(stickyHTML);
         } else {
             $('body').append(stickyHTML);
         }
     }


     // Fonction pour mettre à jour le prix
     function updateStickyPrice() {
         const $variationForm = $('form.variations_form');
         const $stickyPrice = $('#stickyVariationBar').find('.sticky-price');
         const $stickyAddToCart = $('#stickyVariationBar').find('.sticky-add-to-cart');

         if (!$variationForm.length) return;

         // Récupérer la variation sélectionnée
         const selectedValue = $variationForm.find('.variations select').val();

         // Si aucune variation n'est sélectionnée, ne pas mettre à jour
         if (!selectedValue) {
             return;
         }

         // Chercher le prix - plusieurs stratégies (chercher d'abord le conteneur .price complet)
         let priceHTML = null;

         // 1. Chercher le conteneur .price en priorité (contient la structure del/ins)
         let $priceElement = $variationForm.find('.price').first();
         if (!$priceElement.length) {
             $priceElement = $('p.price').first();
         }

         // 2. Si pas trouvé, chercher dans le summary
         if (!$priceElement.length) {
             $priceElement = $('.summary .price').first();
         }

         // 3. Fallback sur woocommerce-Price-amount
         if (!$priceElement.length) {
             $priceElement = $variationForm.find('.woocommerce-Price-amount.amount').first();
         }

         // 4. Chercher partout
         if (!$priceElement.length) {
             $priceElement = $('.woocommerce-Price-amount.amount').first();
         }

         if ($priceElement.length) {
             const $clone = $priceElement.clone();
             $clone.find('.screen-reader-text').remove();
             $clone.find('a, button, input').remove();

             // Prioriser le prix promo (balise <ins>), sinon utiliser le prix normal
             let $ins = $clone.find('ins').first();
             if ($ins.length) {
                 // Extraire juste le contenu de la balise <ins>
                 priceHTML = $ins.html();
             } else {
                 // Supprimer le prix barré (del) si présent et prendre le reste
                 $clone.find('del').remove();
                 priceHTML = $clone.html();
             }

             if (priceHTML && priceHTML.trim()) {
                 $stickyPrice.html(priceHTML);
                 $stickyAddToCart.prop('disabled', false);
                 return true;
             }
         }

         return false;
     }

     // Synchroniser les variations avec le sticky bar
     function syncVariations() {
         const $variationForm = $('form.variations_form');
         const $stickyBar = $('#stickyVariationBar');
         const $stickyButtons = $stickyBar.find('.sticky-variation-buttons');
         const $stickyPrice = $stickyBar.find('.sticky-price');
         const $stickyAddToCart = $stickyBar.find('.sticky-add-to-cart');
         const $productName = $stickyBar.find('.sticky-product-name');
         const $productImg = $stickyBar.find('.sticky-product-img');

         if (!$variationForm.length) return;

         // Récupérer les variations
         const variations = $variationForm.data('product_variations');
         const attributeName = $variationForm.find('.variations select').first().data('attribute_name');

         // Nettoyer les boutons existants
         $stickyButtons.empty();

         // Définir l'ordre de priorité pour les variations (15ml, 30ml, 100ml)
         const priorityOrder = ['15ml', '30ml', '100ml'];

         // Créer un objet pour stocker les variations uniques avec leurs valeurs
         const variationsByValue = {};
         variations.forEach(variation => {
             const attrValue = variation.attributes[attributeName];
             if (!variationsByValue[attrValue]) {
                 variationsByValue[attrValue] = variation;
             }
         });

         // Trier les clés selon l'ordre de priorité
         const sortedValues = Object.keys(variationsByValue).sort((a, b) => {
             const indexA = priorityOrder.indexOf(a);
             const indexB = priorityOrder.indexOf(b);

             // Si les deux sont dans la liste de priorité, utiliser cet ordre
             if (indexA !== -1 && indexB !== -1) {
                 return indexA - indexB;
             }
             // Si seulement 'a' est dans la liste, il vient en premier
             if (indexA !== -1) return -1;
             // Si seulement 'b' est dans la liste, il vient en premier
             if (indexB !== -1) return 1;
             // Sinon, garder l'ordre alphabétique
             return a.localeCompare(b);
         });

         // Créer les boutons de variation avec image, dans l'ordre trié
         sortedValues.forEach(attrValue => {
             const variation = variationsByValue[attrValue];

             // Récupérer l'image de la variation
             let variationImgSrc = '';
             let variationUnitPrice = '';

             // 1. Chercher dans les div.product-var-cust avec id correspondant (ex: id="15ml", id="100ml")
             const $customVarDiv = $(`.product-var-cust#${attrValue}`);
             const $customVarImg = $customVarDiv.find('.product-var-cust-img img');
             if ($customVarImg.length) {
                 variationImgSrc = $customVarImg.attr('src');
             }
             const $customUnitPrice = $customVarDiv.find('.variant-price-per-unit').first();
             if ($customUnitPrice.length) {
                 variationUnitPrice = $customUnitPrice.text().trim();
             }

             // 2. Si pas trouvé, chercher avec data-value
             if (!variationImgSrc) {
                 const $customImg = $(`.product-var-cust-img[data-value="${attrValue}"] img`).first();
                 if ($customImg.length) {
                     variationImgSrc = $customImg.attr('src');
                 }
             }
             if (!variationUnitPrice) {
                 const $customUnitPriceByValue = $(`.product-var-cust[data-value="${attrValue}"] .variant-price-per-unit`).first();
                 if ($customUnitPriceByValue.length) {
                     variationUnitPrice = $customUnitPriceByValue.text().trim();
                 }
             }

             // 3. Fallback : utiliser l'image de variation WooCommerce
             if (!variationImgSrc && variation.image && variation.image.thumb_src) {
                 variationImgSrc = variation.image.thumb_src;
             }

             const button = $(`
                 <button class="sticky-variation-btn" data-value="${attrValue}" aria-pressed="false">
                     <div class="sticky-var-left">
                         ${variationImgSrc ? `<img src="${variationImgSrc}" alt="${attrValue}" class="eh-sticky-var-img">` : ''}
                     </div>
                     <div class="sticky-var-right">
                         <span class="sticky-var-label">${attrValue}</span>
                         ${variationUnitPrice ? `<span class="sticky-var-unit-price">${variationUnitPrice}</span>` : ''}
                     </div>
                 </button>
             `);

             $stickyButtons.append(button);
         });

         // ==========================================================
         // Récupérer le nom du produit
         // ==========================================================
         let productNameHTML = $('h1.product_title').html();
         if (!productNameHTML) {
             productNameHTML = $('h1.wp-block-post-title').html();
         }
         if (!productNameHTML) {
             productNameHTML = $('.product_title').html();
         }
         if (!productNameHTML) {
             productNameHTML = $('h1').first().text();
         }

         // Récupérer le texte pur pour l'attribut data (mobile)
         let productNameText = $('h1.product_title').text() || $('h1.wp-block-post-title').text() || $('.product_title').text() || $('h1').first().text();

         if (productNameHTML) {
             $productName.html(productNameHTML);
         }

         // Ajouter le nom en data-attribute pour le mobile
         const $variationLabelDiv = $stickyBar.find('.sticky-variation-label');
         $variationLabelDiv.attr('data-product-name', productNameText.trim());

         // ==========================================================
         // Récupérer l'image du produit
         // ==========================================================
         const imgSelectorsVariable = [
             '.wc-block-woocommerce-product-gallery-large-image__image',
             '.wc-block-product-gallery-large-image__image-element img',
             '.woocommerce-product-gallery__image img',
             '.woocommerce-product-gallery__wrapper img',
             '.wp-post-image'
         ];
         let productImgSrc = '';
         for (let selector of imgSelectorsVariable) {
             productImgSrc = getImgSrc($(selector).first());
             if (productImgSrc) break;
         }

         // Ajouter l'image en background pour le mobile (via style inline)
         if (productImgSrc) {
             $variationLabelDiv.css('--product-img', `url(${productImgSrc})`);
         }
         if (productImgSrc) {
             $productImg.attr('src', productImgSrc);
         }

         // Gérer les clics sur les boutons de variation
         $stickyButtons.on('click', '.sticky-variation-btn', function(e) {
             e.preventDefault();
             e.stopPropagation();
             e.stopImmediatePropagation();

             // Signaler que le clic vient de la sticky bar
             if (typeof window.stickyBarSetClickFromBar === 'function') {
                 window.stickyBarSetClickFromBar();
             }

             const value = $(this).data('value');

             // Mettre à jour la classe active (aria-pressed pour les
             // technologies d'assistance, la classe seule ne suffit pas).
             $stickyButtons.find('.sticky-variation-btn').removeClass('active').attr('aria-pressed', 'false');
             $(this).addClass('active').attr('aria-pressed', 'true');

             // Mettre à jour l'opacité des éléments .product-var-cust sur la page
             $('.product-var-cust').css('opacity', '0.5');
             $(`.product-var-cust#${value}`).css('opacity', '1');

             // Sauvegarder la position de scroll AVANT le changement
             const savedScrollTop = $(window).scrollTop();

             // Changer la valeur du select
             const $select = $variationForm.find('.variations select');
             $select.val(value).trigger('change');

             // Restaurer la position de scroll immédiatement et après un délai
             // (WooCommerce peut essayer de scroller après le trigger)
             $(window).scrollTop(savedScrollTop);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 10);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 50);
             setTimeout(function() {
                 $(window).scrollTop(savedScrollTop);
             }, 100);

             // Refléter immédiatement la disponibilité de la variation choisie
             // (found_variation la confirmera juste après) plutôt que
             // d'activer le bouton en aveugle pour une variation en rupture.
             const chosenVariation = variationsByValue[value];
             setStickyOutOfStock($stickyBar, chosenVariation ? chosenVariation.is_in_stock === false : false);

             // Vider le prix affiché tout de suite : sans ça, le prix de
             // l'ANCIENNE variation reste visible le temps que WooCommerce
             // mette à jour le DOM, ce qui donne l'impression trompeuse qu'on
             // voit encore la variation précédente. Le rattrapage du nouveau
             // prix est déjà assuré par l'écouteur 'found_variation' plus bas
             // (déclenché par le trigger('change') ci-dessus), pas besoin
             // d'une seconde cascade de délais ici.

             return false;
         });

         // Synchroniser avec les changements du formulaire principal
         $variationForm.on('found_variation', function(event, variation) {
             updateStickyPrice();
             setStickyOutOfStock($stickyBar, variation.is_in_stock === false);

             // Filet de sécurité unique : 'found_variation' est aussi écouté
             // par le script de variations de WooCommerce lui-même, qui met à
             // jour le DOM du prix affiché sur la page. Si notre lecture
             // arrive avant la sienne (deux écouteurs sur le même événement,
             // ordre non garanti), ce court retry suffit à rattraper la valeur
             // finale sans empiler plusieurs délais devinés au hasard.
             setTimeout(updateStickyPrice, 100);

             // Mettre à jour le bouton actif (classe + aria-pressed)
             const selectedValue = $variationForm.find('.variations select').val();
             $stickyButtons.find('.sticky-variation-btn').removeClass('active').attr('aria-pressed', 'false');
             $stickyButtons.find(`[data-value="${selectedValue}"]`).addClass('active').attr('aria-pressed', 'true');
         });

         $variationForm.on('reset_data', function() {
             $stickyAddToCart.prop('disabled', true);
             $stickyButtons.find('.sticky-variation-btn').removeClass('active').attr('aria-pressed', 'false');
         });

         // Ajouter des écouteurs supplémentaires pour capturer les mises à jour de prix
         // après un ajout au panier ou une modification du formulaire
         $variationForm.on('woocommerce_variation_has_changed', function() {
             updateStickyPrice();
             setTimeout(updateStickyPrice, 100);
         });

         $(document.body).on('updated_wc_div', function() {
             updateStickyPrice();
             setTimeout(updateStickyPrice, 100);
         });

         // Vérifier le prix quand une variation est reset aussi
         $(document.body).on('woocommerce_variation_reset_data', function() {
             updateStickyPrice();
         });

         // Sélectionner une variation par défaut : d'abord celle indiquée dans
         // l'URL (convention WooCommerce attribute_{nom}=valeur), sinon celle
         // déjà présélectionnée par WooCommerce sur le formulaire principal,
         // sinon la première de la liste triée. Générique à n'importe quel
         // produit/attribut, plutôt qu'une liste ('15ml'/'30ml'/'100ml') et un
         // repli ('100ml') qui ne valaient que pour un seul produit du catalogue.
         setTimeout(function() {
             const params = new URLSearchParams(window.location.search);
             const urlValue = (params.get(`attribute_${attributeName}`) || '').toLowerCase();
             const currentValue = ($variationForm.find('.variations select').val() || '').toLowerCase();

             const targetValue = sortedValues.find(v => v.toLowerCase() === urlValue)
                 || sortedValues.find(v => v.toLowerCase() === currentValue)
                 || sortedValues[0];

             const $btnTarget = $stickyButtons.find(`[data-value="${targetValue}"]`);
             if ($btnTarget.length) {
                 $btnTarget.trigger('click');
             }
         }, 700);

         // Gérer l'ajout au panier depuis le sticky bar
         $stickyAddToCart.off('click').on('click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             e.stopImmediatePropagation();

             const $btn = $(this);

             // Empêcher les doubles clics, et par sécurité un ajout au panier
             // pour un produit en rupture (le bouton est normalement masqué
             // dans ce cas, voir setStickyOutOfStock, mais on se protège
             // aussi ici au cas où l'état n'aurait pas encore été appliqué).
             if ($btn.hasClass('loading') || $btn.prop('disabled')) {
                 return false;
             }

             // Ajouter l'état de chargement
             $btn.addClass('loading').prop('disabled', true);
             const originalText = $btn.html();
             $btn.html(`<span class="loading-text">${stickyI18n.addingText}</span>`);

             // Chercher le bouton original UNIQUEMENT dans le form.cart principal de la page
             // Exclure explicitement les boutons du mini-cart, widget, header
             const $originalBtn = $('form.cart button[type="submit"], form.cart .single_add_to_cart_button')
                 .not('.mini-cart *, .widget *, .cart-contents *, header *, .site-header *, #stickyVariationBar *, .woocommerce-mini-cart *, .cart_list *')
                 .first();

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 showAddedConfirmation($btn, originalText);
             });

             // Timeout de sécurité (5 secondes max)
             setTimeout(function() {
                 if ($btn.hasClass('loading')) {
                     $btn.removeClass('loading').prop('disabled', false);
                     $btn.html(originalText);
                 }
             }, 5000);

             return false;
         });
     }

     // ================================================================
     // PRODUITS SIMPLES - Fonction complète refaite
     // ================================================================
     function syncSimpleProduct() {
         const $stickyBar = $('#stickyVariationBar');
         const $stickyPrice = $stickyBar.find('.sticky-price');
         const $stickyAddToCart = $stickyBar.find('.sticky-add-to-cart');
         const $productName = $stickyBar.find('.sticky-product-name');
         const $productImg = $stickyBar.find('.sticky-product-img');
         const $variationOptions = $stickyBar.find('.sticky-variation-options');

         // Ajouter une classe pour identifier les produits simples
         $stickyBar.addClass('simple-product');

         // Supprimer complètement le bloc des options de variation (pas juste le cacher)
         $variationOptions.remove();

         // ========================================
         // Récupérer le nom du produit
         // ========================================
         let productNameText = '';

         // Essayer plusieurs sélecteurs
         const $h1ProductTitle = $('h1.product_title');
         const $h1BlockTitle = $('h1.wp-block-post-title');
         const $productTitle = $('.product_title');
         const $h1First = $('h1').first();

         if ($h1ProductTitle.length) {
             productNameText = $h1ProductTitle.text().trim();
         } else if ($h1BlockTitle.length) {
             productNameText = $h1BlockTitle.text().trim();
         } else if ($productTitle.length) {
             productNameText = $productTitle.text().trim();
         } else if ($h1First.length) {
             productNameText = $h1First.text().trim();
         }

         if (productNameText) {
             $productName.text(productNameText);
         }

         // ========================================
         // Récupérer l'image du produit
         // ========================================
         let productImgSrc = '';

         // Sélecteurs pour les blocs Gutenberg et WooCommerce classique
         const imgSelectors = [
             '.wc-block-woocommerce-product-gallery-large-image__image',
             '.wc-block-product-gallery-large-image__image-element img',
             '.woocommerce-product-gallery__image img',
             '.wp-post-image',
             '.product .attachment-woocommerce_single img',
             '.product img.wp-post-image'
         ];

         for (let selector of imgSelectors) {
             productImgSrc = getImgSrc($(selector).first());
             if (productImgSrc) break;
         }

         if (productImgSrc) {
             $productImg.attr('src', productImgSrc).attr('alt', productNameText);
         }

         // ========================================
         // Récupérer le prix du produit
         // ========================================
         let priceText = '';

         // Chercher le prix UNIQUEMENT dans la zone produit, pas dans le mini-cart
        // Ordre de priorité : 1. Prix custom Saito, 2. Blocs Gutenberg, 3. WooCommerce classique
        const priceSelectors = [
            '.saito-shortcode-price',                                               // Prix custom Saito (priorité 1)
            '.product .summary .saito-shortcode-price',                             // Prix Saito dans summary
            '.colonne-droite .saito-shortcode-price',                               // Prix Saito dans colonne droite
            '.wp-block-woocommerce-product-price .wc-block-components-product-price', // Blocs Gutenberg
            '.product .summary p.price',                                            // WooCommerce classique
            '.product .summary .price',
            '.colonne-droite .price',                                               // Colonne droite custom
            '.entry-content .wp-block-woocommerce-product-price',
            '.product-infos-sizing .price'                                          // Bloc custom du thème
        ];

        let $priceElement = null;
        for (let selector of priceSelectors) {
            // Exclure EXPLICITEMENT tous les éléments du mini-cart, widget, header, sticky bar lui-même
            const $el = $(selector)
                .not('.mini-cart *, .cart-contents *, .widget *, header *, .site-header *, #stickyVariationBar *, .woocommerce-mini-cart *, .cart_list *, aside *, .sidebar *')
                .filter(function() {
                    // Vérifier que l'élément n'est pas dans un conteneur à exclure
                    return !$(this).closest('.mini-cart, .cart-contents, .widget, header, .site-header, #stickyVariationBar, .woocommerce-mini-cart, .cart_list, aside, .sidebar').length;
                })
                .first();

            if ($el.length) {
                $priceElement = $el;
                break;
            }
        }

        if ($priceElement && $priceElement.length) {
            // Cloner et nettoyer
            const $clone = $priceElement.clone();
            $clone.find('.screen-reader-text').remove();
            // Supprimer tous les liens et boutons pour éviter les clics accidentels
            $clone.find('a, button, input').remove();
            priceText = $clone.html();

        } else {
        }

        if (priceText && priceText.trim()) {
            // Nettoyer le HTML du prix - supprimer les attributs href et onclick
            const $tempDiv = $('<div>').html(priceText);
            $tempDiv.find('a').each(function() {
                $(this).replaceWith($(this).text());
            });
            $stickyPrice.html($tempDiv.html());
        } else {
        }

        // Activer le bouton pour les produits simples, sauf rupture de stock
        setStickyOutOfStock($stickyBar, isSimpleProductOutOfStock());

         // ========================================
         // Gérer le clic sur le bouton
         // ========================================
         $stickyAddToCart.off('click').on('click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             e.stopImmediatePropagation();

             const $btn = $(this);

             // Empêcher les doubles clics, et par sécurité un ajout au panier
             // pour un produit en rupture (le bouton est normalement masqué
             // dans ce cas, voir setStickyOutOfStock, mais on se protège
             // aussi ici au cas où l'état n'aurait pas encore été appliqué).
             if ($btn.hasClass('loading') || $btn.prop('disabled')) {
                 return false;
             }

             // Ajouter l'état de chargement
             $btn.addClass('loading').prop('disabled', true);
             const originalText = $btn.html();
             $btn.html(`<span class="loading-text">${stickyI18n.addingText}</span>`);

             // Chercher le bouton original UNIQUEMENT dans le form.cart principal de la page
             // Exclure explicitement les boutons du mini-cart, widget, header
             const $originalBtn = $('form.cart button[type="submit"], form.cart .single_add_to_cart_button')
                 .not('.mini-cart *, .widget *, .cart-contents *, header *, .site-header *, #stickyVariationBar *, .woocommerce-mini-cart *, .cart_list *')
                 .first();

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 showAddedConfirmation($btn, originalText);
             });

             // Timeout de sécurité (5 secondes max)
             setTimeout(function() {
                 if ($btn.hasClass('loading')) {
                     $btn.removeClass('loading').prop('disabled', false);
                     $btn.html(originalText);
                 }
             }, 5000);

             return false;
         });
     }

     // Gérer l'affichage/masquage du sticky bar
    function handleStickyVisibility() {
        const $stickyBar = $('#stickyVariationBar');
        let visibilityCheckTimeout = null;
        let isUpdating = false; // Verrouillage pendant les mises à jour WooCommerce
        let clickedFromStickyBar = false; // Indicateur si le clic vient de la sticky bar

        // Le panneau panier est le même objet visuel que l'engrenage (voir
        // assets/js/core.js) : l'afficher fait grandir #eh-fab jusqu'à l'état
        // détail. `manual` distingue une fermeture voulue par l'utilisateur
        // (croix : revient au choix des icônes) d'une fermeture automatique
        // liée au scroll (referme entièrement, pas d'intérêt à rouvrir le
        // menu tout seul).
        function setStickyBarVisible(visible, manual) {
            if (!window.ehHub) {
                $stickyBar.toggleClass('visible', visible);
                return;
            }
            if (visible) {
                window.ehHub.showDetail('sticky-cart', function () {
                    $stickyBar.addClass('visible');
                });
            } else if (manual) {
                window.ehHub.backToMenu('sticky-cart', function () {
                    $stickyBar.removeClass('visible');
                });
            } else {
                window.ehHub.hideDetail('sticky-cart', function () {
                    $stickyBar.removeClass('visible');
                });
            }
        }

        // Le hub s'est refermé entièrement (clic extérieur, Échap, un autre
        // module affiché...) pendant que ce panneau était actif : on remet à
        // jour notre propre état d'affichage sans redéclencher de fermeture.
        document.addEventListener('eh:closed', function (event) {
            if (event.detail && event.detail.id === 'sticky-cart') {
                $stickyBar.removeClass('visible');
            }
        });

        $stickyBar.on('click', '.sticky-panel-close', function () {
            setStickyBarVisible(false, true);
        });

        function findAddToCartBtn() {
            // Chercher le bouton d'ajout au panier dans tous les contextes possibles
            // Priorité 1: Dans le conteneur de variations
            let $btn = $('.woocommerce-variation-add-to-cart-enabled button.single_add_to_cart_button').first();
            if ($btn.length && !$btn.closest('.mini-cart, .widget, header').length) {
                return $btn;
            }

            // Priorité 2: Bouton "add-to-cart" simple
            $btn = $('button[name="add-to-cart"]').not('.mini-cart *, .widget *, header *, .woocommerce-mini-cart *').first();
            if ($btn.length) {
                return $btn;
            }

            // Priorité 3: Autres sélecteurs
            const selectors = [
                'button.single_add_to_cart_button',
                '.wc-block-components-product-add-to-cart-button',
                'form.cart button[type="submit"]'
            ];

            for (let selector of selectors) {
                $btn = $(selector).not('.mini-cart *, .widget *, header *, .woocommerce-mini-cart *').first();
                if ($btn.length) {
                    return $btn;
                }
            }

            return null;
        }

        function checkVisibility() {
            // Si on est en train de mettre à jour, ignorer cette vérification
            if (isUpdating) {
                return;
            }

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const windowBottom = scrollTop + windowHeight;
            const docHeight = $(document).height();

            // Rechercher le bouton à chaque check
            const $addToCartBtn = findAddToCartBtn();


            // 1. Vérifier si on approche du footer - MASQUER la sticky bar
            const $footer = $('footer, footer.wp-block-template-part, [role="contentinfo"]');
            if ($footer.length) {
                const footerTop = $footer.first().offset().top;

                // Si on chevauche le footer, masquer
                if (windowBottom >= footerTop) {
                    setStickyBarVisible(false);
                    return;
                }
            } else {
                // Si pas de footer, masquer les 200px avant la fin
                const nearEnd = docHeight - windowBottom <= 200;
                if (nearEnd) {
                    setStickyBarVisible(false);
                    return;
                }
            }

            // 2. Vérifier si le bouton "Ajouter au panier" réel est visible - MASQUER la sticky bar
            if ($addToCartBtn && $addToCartBtn.length) {
                const btnOffset = $addToCartBtn.offset();
                const btnTop = btnOffset.top;
                const btnHeight = $addToCartBtn.outerHeight() || 50;
                const btnBottom = btnTop + btnHeight;
                const isBtnVisible = $addToCartBtn.is(':visible');


                // Le bouton est visible si au moins une partie est dans le viewport ET visible
                const isBtnInViewport = (btnTop < windowBottom) && (btnBottom > scrollTop) && isBtnVisible;


                if (isBtnInViewport) {
                    setStickyBarVisible(false);
                    return;
                }
            } else {
            }

            // 3. Sinon, AFFICHER la sticky bar
            setStickyBarVisible(true);
        }

        // Fonction debounced pour éviter les appels multiples rapides
        function debouncedCheckVisibility(delay) {
            if (visibilityCheckTimeout) {
                clearTimeout(visibilityCheckTimeout);
            }
            visibilityCheckTimeout = setTimeout(function() {
                isUpdating = false; // Débloquer après le délai
                checkVisibility();
            }, delay || 100);
        }

         // Throttle par requestAnimationFrame (même pattern que le noyau,
         // assets/js/core.js) : sans lui, checkVisibility() relit des
         // offsets/hauteurs (footer, bouton d'origine) de façon synchrone à
         // chaque évènement scroll/touchmove, ce qui peut saccader le
         // défilement sur des appareils bas de gamme.
         let stickyTicking = false;
         function throttledCheckVisibility() {
             if (stickyTicking) return;
             stickyTicking = true;
             window.requestAnimationFrame(function() {
                 if (!isUpdating) checkVisibility();
                 stickyTicking = false;
             });
         }

         // Bindé sur scroll et resize (pas de verrouillage pour le scroll)
         $(window).off('scroll.stickyBar resize.stickyBar').on('scroll.stickyBar resize.stickyBar', throttledCheckVisibility);

         // Aussi écouter les événements touch pour mobile
         $(window).off('touchmove.stickyBar').on('touchmove.stickyBar', throttledCheckVisibility);

         // Écouter les changements de variation WooCommerce avec verrouillage
         $('form.variations_form').on('found_variation reset_data woocommerce_variation_has_changed', function() {
             isUpdating = true; // Verrouiller immédiatement

             // Si le clic vient de la sticky bar, ne pas la masquer
             if (!clickedFromStickyBar) {
                 setStickyBarVisible(false); // Masquer pendant la mise à jour
             } else {
             }

             // Utiliser un délai plus long pour laisser WooCommerce finir toutes ses mises à jour
             debouncedCheckVisibility(500);
         });

         // Écouter les clics sur les boutons de variation personnalisés avec verrouillage
         $('.product-var-cust').on('click', function() {
             isUpdating = true; // Verrouiller immédiatement
             clickedFromStickyBar = false; // Ce clic vient de la page
             setStickyBarVisible(false); // Masquer pendant la mise à jour
             debouncedCheckVisibility(500);
         });

         // Exposer la fonction pour permettre à syncVariations de l'appeler
         window.stickyBarSetClickFromBar = function() {
             clickedFromStickyBar = true;
             // Réinitialiser après un délai
             setTimeout(function() {
                 clickedFromStickyBar = false;
             }, 1000);
         };

         // Exécuter immédiatement
         setTimeout(function() {
             checkVisibility();
         }, 100);

         // Re-exécuter après des délais
         setTimeout(checkVisibility, 300);
         setTimeout(checkVisibility, 500);
         setTimeout(checkVisibility, 1000);
     }

     // Initialisation
     $(document).ready(function() {
         initStickyBar();
     });

     // Aussi initialiser quand la fenêtre est complètement chargée (images, etc.)
     $(window).on('load', function() {
         // Vérifier si le sticky bar n'a pas déjà été créé
         if (!$('#stickyVariationBar').length) {
             initStickyBar();
         }
     });

     function initStickyBar() {
         // Attendre un peu que la page soit complètement chargée
         setTimeout(function() {
             // Vérifier si le sticky bar existe déjà
             if ($('#stickyVariationBar').length) {
                 return;
             }

             // Vérifier si on est sur une page produit avec variations
             if ($('form.variations_form').length) {
                 createStickyBar();

                 // Attendre que WooCommerce charge les variations
                 setTimeout(function() {
                     syncVariations();
                     handleStickyVisibility();
                 }, 500);
             } else {
                 // Si pas de variations, vérifier pour les produits simples
                 const hasCartForm = $('form.cart').length > 0;
                 const hasWooBlock = $('.wc-block-add-to-cart-form, .wp-block-woocommerce-add-to-cart-form').length > 0;
                 const hasAddToCartButton = $('.single_add_to_cart_button, button[name="add-to-cart"]').length > 0;
                 const isProductPage = $('body').hasClass('single-product') ||
                                       $('body').hasClass('woocommerce') ||
                                       $('.product').length > 0 ||
                                       $('.wp-block-woocommerce-product-image').length > 0;


                 if ((hasCartForm || hasWooBlock || hasAddToCartButton) && isProductPage) {
                     createStickyBar();
                     syncSimpleProduct();
                     handleStickyVisibility();
                 }
             }
         }, 300);

         // Empêcher WooCommerce de remonter vers le select de variation
         $(document).on('focus', '.variations_form select', function(e) {
             e.preventDefault();
             this.blur();
         });
     }

 })(jQuery);
