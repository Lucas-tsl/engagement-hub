(function($) {
     'use strict';

     const stickyI18n = window.ehStickyCartI18n || {
         addToCartText: 'Ajouter au panier - ',
         addingText: 'Ajout en cours...',
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

     // Créer le HTML du sticky bar
     function createStickyBar() {
         const stickyHTML = `
             <div class="sticky-variation-bar" id="stickyVariationBar">
                 <button type="button" class="sticky-panel-close" aria-label="Fermer">✕</button>
                 <div class="sticky-panel-scroll">
                     <div class="sticky-variation-content">
                         <!-- Bloc gauche : Image + Nom du produit -->
                         <div class="sticky-left-block">
                             <div class="sticky-product-image">
                                 <img src="" alt="" class="sticky-product-img">
                             </div>
                             <div class="sticky-product-name"></div>
                         </div>
                         <!-- Bloc droite : Variations + Bouton -->
                         <div class="sticky-right-block">
                             <div class="sticky-variation-options">
                                  <!--  <div class="sticky-variation-label"><span class="variation-name">Sélectionner une option</span></div>-->                            <div class="sticky-variation-buttons"></div>
                             </div>
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

         $('body').append(stickyHTML);
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
                 console.log('✓ Prix mis à jour pour la variation:', selectedValue, 'Prix:', priceHTML);
                 $stickyAddToCart.prop('disabled', false);
                 return true;
             }
         }

         console.warn('✗ Aucun élément price trouvé pour:', selectedValue);
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
         const $variationLabel = $stickyBar.find('.variation-name');

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
                 <button class="sticky-variation-btn" data-value="${attrValue}">
                     <div class="sticky-var-left">
                         ${variationImgSrc ? `<img src="${variationImgSrc}" alt="${attrValue}" class="sticky-var-img">` : ''}
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

             // Mettre à jour la classe active
             $stickyButtons.find('.sticky-variation-btn').removeClass('active');
             $(this).addClass('active');

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
             // l'ANCIENNE variation reste visible pendant les ~200-400ms où
             // WooCommerce n'a pas encore mis à jour le DOM, ce qui donne
             // l'impression trompeuse qu'on voit encore la variation précédente.
             $stickyPrice.empty();

             // Mettre à jour le prix après les délais de WooCommerce
             setTimeout(function() {
                 console.log('Mise à jour du prix après 200ms');
                 updateStickyPrice();
             }, 200);

             setTimeout(function() {
                 console.log('Mise à jour du prix après 400ms');
                 updateStickyPrice();
             }, 400);

             return false;
         });

         // Synchroniser avec les changements du formulaire principal
         $variationForm.on('found_variation', function(event, variation) {
             console.log('Variation trouvée:', variation.attributes[attributeName], 'ID variation:', variation.variation_id);

             // Mettre à jour immédiatement ET après plusieurs délais pour être sûr
             updateStickyPrice();
             setStickyOutOfStock($stickyBar, variation.is_in_stock === false);

             // Re-vérifier après plusieurs délais
             setTimeout(function() {
                 console.log('Re-vérification après 50ms');
                 updateStickyPrice();
             }, 50);

             setTimeout(function() {
                 console.log('Re-vérification après 150ms');
                 updateStickyPrice();
             }, 150);

             setTimeout(function() {
                 console.log('Re-vérification après 300ms');
                 updateStickyPrice();
             }, 300);

             // Mettre à jour le bouton actif
             const selectedValue = $variationForm.find('.variations select').val();
             $stickyButtons.find('.sticky-variation-btn').removeClass('active');
             $stickyButtons.find(`[data-value="${selectedValue}"]`).addClass('active');
         });

         $variationForm.on('reset_data', function() {
             //$stickyPrice.html('Sélectionner une option');
             $stickyAddToCart.prop('disabled', true);
             $stickyButtons.find('.sticky-variation-btn').removeClass('active');
         });

         // Ajouter des écouteurs supplémentaires pour capturer les mises à jour de prix
         // après un ajout au panier ou une modification du formulaire
         $variationForm.on('woocommerce_variation_has_changed', function() {
             console.log('Variation a changé');
             updateStickyPrice();
             // Re-vérifier après un délai
             setTimeout(updateStickyPrice, 50);
         });

         $(document.body).on('updated_wc_div', function() {
             console.log('WC div updated');
             updateStickyPrice();
             setTimeout(updateStickyPrice, 50);
         });

         // Vérifier le prix quand une variation est reset aussi
         $(document.body).on('woocommerce_variation_reset_data', function() {
             console.log('Variation reset');
             updateStickyPrice();
         });

         // Sélectionner la variation par défaut en fonction de l'URL
         setTimeout(function() {
             const params = new URLSearchParams(window.location.search);
             const urlValue = (params.get('attribute_pa_contenance') || '').toLowerCase();
             const allowedDefaults = ['15ml', '30ml', '100ml'];
             const targetValue = allowedDefaults.includes(urlValue) ? urlValue : '100ml';

             const $btnTarget = $stickyButtons.find(`[data-value="${targetValue}"]`);
             if ($btnTarget.length) {
                 $btnTarget.trigger('click');
                 console.log(`✓ ${targetValue} sélectionné par défaut`);
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

             console.log('Original button found:', $originalBtn.length ? $originalBtn[0] : 'NOT FOUND');

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     console.log('Submitting form:', $form[0]);
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 $btn.removeClass('loading').prop('disabled', false);
                 $btn.html(originalText);
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
         const $stickyContent = $stickyBar.find('.sticky-variation-content');
         const $stickyPrice = $stickyBar.find('.sticky-price');
         const $stickyAddToCart = $stickyBar.find('.sticky-add-to-cart');
         const $productName = $stickyBar.find('.sticky-product-name');
         const $productImg = $stickyBar.find('.sticky-product-img');
         const $rightBlock = $stickyBar.find('.sticky-right-block');
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
                console.log('Prix trouvé avec sélecteur:', selector);
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

            console.log('Prix HTML récupéré:', priceText);
        } else {
            console.warn('Aucun élément prix trouvé pour le produit simple');
        }

        if (priceText && priceText.trim()) {
            // Nettoyer le HTML du prix - supprimer les attributs href et onclick
            const $tempDiv = $('<div>').html(priceText);
            $tempDiv.find('a').each(function() {
                $(this).replaceWith($(this).text());
            });
            $stickyPrice.html($tempDiv.html());
            console.log('Prix affiché dans sticky bar:', $tempDiv.html());
        } else {
            console.warn('Prix vide ou invalide');
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

             console.log('Original button found:', $originalBtn.length ? $originalBtn[0] : 'NOT FOUND');

             if ($originalBtn.length) {
                 // Utiliser un click natif pour éviter les propagations jQuery
                 $originalBtn[0].click();
             } else {
                 // Fallback: soumettre le formulaire directement
                 const $form = $('form.cart').not('.mini-cart form, .widget form, .woocommerce-mini-cart form').first();
                 if ($form.length) {
                     console.log('Submitting form:', $form[0]);
                     $form.submit();
                 }
             }

             // Attendre la fin de l'AJAX WooCommerce
             $(document.body).one('added_to_cart wc_cart_button_updated', function() {
                 $btn.removeClass('loading').prop('disabled', false);
                 $btn.html(originalText);
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

         console.log('Sticky bar simple product initialized:', {
             name: productNameText,
             image: productImgSrc,
             price: priceText
         });
     }

     // Gérer l'affichage/masquage du sticky bar
    function handleStickyVisibility() {
        const $stickyBar = $('#stickyVariationBar');
        let visibilityCheckTimeout = null;
        let isUpdating = false; // Verrouillage pendant les mises à jour WooCommerce
        let clickedFromStickyBar = false; // Indicateur si le clic vient de la sticky bar

        // Le panneau panier est coordonné avec le bouton engrenage : l'ouvrir
        // ferme tout autre panneau du hub (cookies, etc.) et fait "pulser"
        // l'engrenage, pour que ça se lise comme un seul système plutôt
        // qu'une barre qui apparaît de nulle part.
        function setStickyBarVisible(visible) {
            $stickyBar.toggleClass('visible', visible);
            if (!window.ehHub) return;
            if (visible) {
                window.ehHub.openPanel('sticky-cart');
            } else {
                window.ehHub.closePanel('sticky-cart');
            }
        }

        // Un autre panneau du hub (ex. cookies) vient de s'ouvrir : on se referme.
        document.addEventListener('eh:panel-close', function (event) {
            if (event.detail && event.detail.id === 'sticky-cart') {
                $stickyBar.removeClass('visible');
            }
        });

        // Ouverture manuelle depuis l'icône 🛒 du bouton engrenage.
        document.addEventListener('eh:action', function (event) {
            if (event.detail && event.detail.action === 'open-sticky-panel') {
                setStickyBarVisible(true);
            }
        });

        $stickyBar.on('click', '.sticky-panel-close', function () {
            setStickyBarVisible(false);
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
                console.log('⏸️ CHECK SKIPPED - Update in progress');
                return;
            }

            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const windowBottom = scrollTop + windowHeight;
            const docHeight = $(document).height();

            // Rechercher le bouton à chaque check
            const $addToCartBtn = findAddToCartBtn();

            console.log('=== CHECK VISIBILITY ===');
            console.log('scrollTop:', scrollTop, 'windowBottom:', windowBottom, 'docHeight:', docHeight);
            console.log('Button found:', $addToCartBtn !== null && $addToCartBtn.length > 0);

            // 1. Vérifier si on approche du footer - MASQUER la sticky bar
            const $footer = $('footer, footer.wp-block-template-part, [role="contentinfo"]');
            if ($footer.length) {
                const footerTop = $footer.first().offset().top;
                console.log('Footer found at:', footerTop);

                // Si on chevauche le footer, masquer
                if (windowBottom >= footerTop) {
                    console.log('>>> ACTION: HIDING - near/in footer');
                    setStickyBarVisible(false);
                    return;
                }
            } else {
                // Si pas de footer, masquer les 200px avant la fin
                const nearEnd = docHeight - windowBottom <= 200;
                console.log('No footer found, near end:', nearEnd);
                if (nearEnd) {
                    console.log('>>> ACTION: HIDING - near end of page');
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

                console.log('Button details:');
                console.log('  - Top:', btnTop, 'Bottom:', btnBottom);
                console.log('  - Visible:', isBtnVisible);
                console.log('  - In viewport: top < bottom?', btnTop < windowBottom, ', bottom > scroll?', btnBottom > scrollTop);

                // Le bouton est visible si au moins une partie est dans le viewport ET visible
                const isBtnInViewport = (btnTop < windowBottom) && (btnBottom > scrollTop) && isBtnVisible;

                console.log('  => Button in viewport:', isBtnInViewport);

                if (isBtnInViewport) {
                    console.log('>>> ACTION: HIDING - button is visible');
                    setStickyBarVisible(false);
                    return;
                }
            } else {
                console.log('Add to cart button NOT found');
            }

            // 3. Sinon, AFFICHER la sticky bar
            console.log('>>> ACTION: SHOWING sticky bar');
            setStickyBarVisible(true);
            console.log('');
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

         // Bindé sur scroll et resize (pas de verrouillage pour le scroll)
         $(window).off('scroll.stickyBar resize.stickyBar').on('scroll.stickyBar resize.stickyBar', function() {
             // Ne pas bloquer le scroll, mais utiliser le debounce quand même
             if (!isUpdating) {
                 checkVisibility();
             }
         });

         // Aussi écouter les événements touch pour mobile
         $(window).off('touchmove.stickyBar').on('touchmove.stickyBar', function() {
             if (!isUpdating) {
                 checkVisibility();
             }
         });

         // Écouter les changements de variation WooCommerce avec verrouillage
         $('form.variations_form').on('found_variation reset_data woocommerce_variation_has_changed', function() {
             console.log('🔒 Variation event detected - Locking updates');
             isUpdating = true; // Verrouiller immédiatement

             // Si le clic vient de la sticky bar, ne pas la masquer
             if (!clickedFromStickyBar) {
                 setStickyBarVisible(false); // Masquer pendant la mise à jour
             } else {
                 console.log('✅ Click from sticky bar - keeping it visible');
             }

             // Utiliser un délai plus long pour laisser WooCommerce finir toutes ses mises à jour
             debouncedCheckVisibility(500);
         });

         // Écouter les clics sur les boutons de variation personnalisés avec verrouillage
         $('.product-var-cust').on('click', function() {
             console.log('🔒 Variation button clicked - Locking updates');
             isUpdating = true; // Verrouiller immédiatement
             clickedFromStickyBar = false; // Ce clic vient de la page
             setStickyBarVisible(false); // Masquer pendant la mise à jour
             debouncedCheckVisibility(500);
         });

         // Exposer la fonction pour permettre à syncVariations de l'appeler
         window.stickyBarSetClickFromBar = function() {
             clickedFromStickyBar = true;
             console.log('🎯 Click registered from sticky bar');
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

                 console.log('Simple product check:', { hasCartForm, hasWooBlock, hasAddToCartButton, isProductPage });

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
