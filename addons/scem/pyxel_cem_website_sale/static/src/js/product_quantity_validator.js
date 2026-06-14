/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

// MIXIN COMPARTIDO para lógica común de cantidad
const QuantityMixin = {
    _getMinQty() {
        let minQty = parseFloat(this.qtyInput.attr('data-uom-min'));

        if (!minQty || isNaN(minQty)) {
            minQty = parseFloat(this.qtyInput.attr('data-sale-min-qty'));
        }

        if (!minQty || isNaN(minQty)) {
            minQty = parseFloat(this.qtyInput.attr('min'));
        }

        if (!minQty || isNaN(minQty)) {
            minQty = 1;
        }

        console.log(`Min qty calculado: ${minQty}`);
        return minQty;
    },

    _setInitialQty() {
        this.minQty = this._getMinQty();
        const currentValue = parseFloat(this.qtyInput.val()) || 0;

        if (currentValue < this.minQty || currentValue === 0) {
            this.qtyInput.val(this.minQty);
            console.log(`Cantidad inicial establecida: ${this.minQty} (era: ${currentValue})`);
        } else {
            console.log(`Cantidad inicial correcta: ${currentValue}`);
        }
    },

    _validateAndCorrectQty() {
        let qty = parseFloat(this.qtyInput.val());

        if (isNaN(qty) || qty < this.minQty) {
            qty = this.minQty;
            this.qtyInput.val(qty);
            console.log(`Cantidad corregida a mínimo: ${qty}`);
        }

        if (this.maxQty && qty > this.maxQty) {
            qty = this.maxQty;
            this.qtyInput.val(qty);
            console.log(`Cantidad corregida a máximo: ${qty}`);
        }

        return qty;
    }
};

// WIDGET PRINCIPAL - Vista de detalle del producto
publicWidget.registry.ProductQuantityValidator = publicWidget.Widget.extend({
    selector: '#add_to_cart_form',

    events: {
        'click .btn-less-detail': '_onClickMinus',
        'click .btn-more-detail': '_onClickPlus',
        'input input[name="add_qty"]': '_onInputQty',
        'click .js_add_to_cart_authenticated': '_onAddToCartAuthenticated',
    },

    async start() {
        await this._super(...arguments);
        this.authenticated = false;
        this._checkAuthentication();

        this.qtyInput = this.$('input[name="add_qty"]');
        this.availableQtyInput = this.$('input[name="available_qty"]');
        this.addToCartBtn = this.$('#add_to_cart');
        this.warningMessage = this.$('#qty-warning-message');
        this.$priceContainer = this.$('#price_container');
        this.$priceValue = this.$priceContainer.find('.oe_currency_value').first();

        this.availableQty = parseFloat(this.availableQtyInput.val()) || 0;
        this.unitPrice = 0;
        this.cartQty = 0;
        this.currentVariantId = null;
        this._isInitializing = true;

        this.currencyCode = this.$priceContainer
            .find('[itemprop="priceCurrency"]')
            .text() || this.$priceValue.data('currency') || 'USD';
        this.currencySymbol = this.$priceContainer.data('currency-symbol') || (this.currencyCode === 'USD' ? '$' : '€');
        this.currencyPosition = this.$priceContainer.data('currency-position') || (this.currencyCode === 'USD' ? 'before' : 'after');

        console.log('Inicializando vista de DETALLE con manejo de variantes');

        // PRIMERO: Seleccionar el formato por defecto
        await this._selectDefaultFormatOnLoad();

        this._setInitialQty();
        await this._fetchVariantData();
        this._fetchCartQty();
        this._updateButtonState();
        this._setupVariantObserver();

        $(document.body).on('product_added.product_qty_validator', (ev, data) => {
            const variantId = parseInt(this.$('input[name="product_id"]').val());
            if (parseInt(data.product_id) !== variantId) {
                return;
            }
            this.cartQty += parseFloat(data.quantity) || 0;
            const maxAllowed = Math.max(this.minQty, this.availableQty - this.cartQty);
            const newQty = Math.min(this.minQty, maxAllowed);
            this.qtyInput.val(newQty);
            this._updateButtonState(newQty);
        });

        // Configurar listener para cambios en el formato
        this._setupFormatChangeListener();

        // Ya terminamos de inicializar
        this._isInitializing = false;
    },

    ...QuantityMixin,

    /**
     * Configurar listener para cambios en el formato
     */
    _setupFormatChangeListener() {
        console.log('Configurando listener de cambios de formato...');

        const $allSelects = this.$('select.js_variant_change');

        console.log(`Total de selects de variantes: ${$allSelects.length}`);

        $allSelects.each((index, selectElement) => {
            const $select = $(selectElement);

            const $firstOption = $select.find('option').first();
            const attrName = $firstOption.data('attribute_name');

            console.log(`  Select #${index + 1}: attribute="${attrName}"`);

            if (attrName === 'Formato') {
                console.log('  Este es el SELECT de Formato, agregando listener');

                $select.off('change.format_detector').on('change.format_detector', async (ev) => {
                    if (this._isInitializing) {
                        console.log('Ignorando change durante inicialización');
                        return;
                    }

                    await this._onFormatChanged(ev);
                });
            }
        });
    },

    /**
     * Manejar cambio de formato
     */
    async _onFormatChanged(ev) {
        const $select = $(ev.currentTarget);
        const $selectedOption = $select.find('option:selected');
        const ptavId = $selectedOption.data('value_id');
        const formatName = $selectedOption.text().trim();

        console.log('========================================');
        console.log('CAMBIO DE FORMATO DETECTADO');
        console.log(`De: (cualquiera) -> A: ${formatName}`);
        console.log(`ptav_id: ${ptavId}`);
        console.log('========================================');

        if (!ptavId) {
            console.log('No se encontró ptav_id en la opción seleccionada');
            return;
        }

        await this._processFormatChange(ptavId, formatName);
    },

    /**
     * Procesar el cambio de formato
     */
    async _processFormatChange(ptavId, formatName) {
        console.log(`Obteniendo datos del formato "${formatName}" (ptav_id: ${ptavId})...`);

        try {
            // Obtener datos del formato desde el servidor
            const formatData = await jsonrpc('/ptav/get_formato_data', {
                ptav_id: ptavId
            });

            console.log('Datos del formato recibidos:');
            console.log(`  Nombre: ${formatData.name}`);
            console.log(`  uom_min: ${formatData.uom_min}`);
            console.log(`  is_uom_min: ${formatData.is_uom_min}`);

            if (formatData && formatData.uom_min) {
                const uom_min = parseFloat(formatData.uom_min);
                const is_uom_min = formatData.is_uom_min || false;

                // Actualizar atributos del input
                this.qtyInput.attr({
                    'min': uom_min,
                    'data-uom-min': uom_min,
                    'data-is_uom_min': is_uom_min
                });

                // Actualizar minQty local
                this.minQty = uom_min;

                // IMPORTANTE: Establecer la cantidad ANTES de fetchVariantData
                this.qtyInput.val(uom_min);

                console.log(`Cantidad actualizada: ${uom_min}`);
                console.log(`Mínimo establecido: ${uom_min}`);
            } else {
                console.log('No se recibieron datos válidos del formato');
            }
        } catch (error) {
            console.error('Error obteniendo datos del formato:', error);
        }

        // Esperar un momento para que Odoo procese el cambio de variante
        await new Promise(resolve => setTimeout(resolve, 200));

        // Obtener datos actualizados de la variante (precio, stock, etc)
        console.log('Actualizando precio y datos de variante...');
        await this._fetchVariantData();

        // IMPORTANTE: Volver a establecer la cantidad después de fetchVariantData
        // porque fetchVariantData puede sobrescribirla
        if (this.minQty) {
            this.qtyInput.val(this.minQty);
            console.log(`Cantidad reestablecida después de fetch: ${this.minQty}`);
        }

        this._updateButtonState();

        console.log('========================================\n');
    },

    async _selectDefaultFormatOnLoad() {
        console.log('========== Seleccionando formato por defecto al cargar ==========');

        const productTmplId = this.$('input[name="product_template_id"]').val();

        if (!productTmplId) {
            console.log('No se encontró product_template_id');
            return;
        }

        console.log(`Producto ID: ${productTmplId}`);

        try {
            const defaultFormat = await jsonrpc('/ptav/get_formato_data', {
                product_tmpl_id: parseInt(productTmplId)
            });

            console.log('Respuesta del servidor:', defaultFormat);

            if (defaultFormat && defaultFormat.ptav_id) {
                console.log(`Formato por defecto: ${defaultFormat.name}`);
                console.log(`  ptav_id: ${defaultFormat.ptav_id}`);
                console.log(`  uom_min: ${defaultFormat.uom_min}`);

                const $select = this._findFormatSelect();

                if ($select) {
                    console.log('SELECT de formato encontrado');

                    const $option = $select.find('option').filter(function() {
                        return $(this).data('value_id') == defaultFormat.ptav_id;
                    });

                    if ($option.length) {
                        console.log(`Opción encontrada: "${$option.text()}"`);

                        $select.val($option.val());
                        $select.find('option').removeAttr('selected');
                        $option.attr('selected', 'selected');

                        console.log('Disparando evento change...');
                        $select.trigger('change');

                        await new Promise(resolve => setTimeout(resolve, 500));

                        this.qtyInput.attr({
                            'min': defaultFormat.uom_min,
                            'data-uom-min': defaultFormat.uom_min,
                            'data-is_uom_min': true
                        });

                        this.minQty = defaultFormat.uom_min;
                        this.qtyInput.val(defaultFormat.uom_min);

                        console.log(`FORMATO SELECCIONADO: ${defaultFormat.name}`);
                        console.log(`CANTIDAD ESTABLECIDA: ${defaultFormat.uom_min}`);
                    }
                }
            } else {
                console.log('No hay formato con is_uom_min=True');
            }
        } catch (error) {
            console.error('Error:', error);
        }

        console.log('='.repeat(60));
    },

    _findFormatSelect() {
        const $allSelects = this.$('select.js_variant_change');

        let $formatSelect = null;

        $allSelects.each(function(index) {
            const $select = $(this);
            const $firstOption = $select.find('option').first();
            const attrName = $firstOption.data('attribute_name');

            if (attrName === 'Formato') {
                $formatSelect = $select;
                return false;
            }
        });

        return $formatSelect;
    },

    _checkAuthentication() {
        const authenticated = document.querySelector('.o_user_menu') !== null ||
                             document.querySelector('.oe_systray') !== null;
        this.authenticated = authenticated;
        return authenticated;
    },

    async _onAddToCartAuthenticated(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if (!this._checkAuthentication()) {
            this._redirectToLogin();
            return;
        }

        await this._addToCart();
    },

    _redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.href);
        const loginUrl = `/web/login?redirect=${currentUrl}`;

        this._showLoginMessage().then(() => {
            window.location.href = loginUrl;
        });
    },

    _showLoginMessage() {
        return new Promise((resolve) => {
            if (confirm('Para solicitar productos, necesitas iniciar sesión. ¿Deseas ir a la página de inicio de sesión?')) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    },

    async _addToCart() {
        const $form = this.$el;
        const productId = this.$('.js_add_to_cart_authenticated').data('product-id');
        const quantity = parseFloat($form.find('input[name="add_qty"]').val()) || 1;

        try {
            const hasLeadResponse = await this._checkUserHasLead();

            if (!hasLeadResponse.has_lead || !hasLeadResponse.allowed_sale) {
                this._handleLeadRestriction(hasLeadResponse);
                return;
            }

            const response = await fetch('/shop/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: new URLSearchParams({
                    'product_id': productId,
                    'add_qty': quantity,
                    'csrf_token': $form.find('input[name="csrf_token"]').val(),
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.cart_quantity !== undefined) {
                    this._onProductAdded(data);
                }
            } else {
                throw new Error('Error al agregar al carrito');
            }
        } catch (error) {
            console.error('Error:', error);
            this._showError('Error al agregar el producto al carrito');
        }
    },

    async _checkUserHasLead() {
        try {
            const response = await fetch('/shop/has_lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                return await response.json();
            }
            return { has_lead: false, allowed_sale: false };
        } catch (error) {
            console.error('Error checking lead:', error);
            return { has_lead: false, allowed_sale: false };
        }
    },

    _handleLeadRestriction(leadResponse) {
        if (!leadResponse.has_lead) {
            const message = 'Necesitas completar tu proceso de acreditación antes de poder solicitar productos.';
            if (leadResponse.acreditation_url) {
                if (confirm(`${message} ¿Deseas ir a la página de acreditación?`)) {
                    window.location.href = leadResponse.acreditation_url;
                }
            } else {
                alert(message);
            }
        } else if (!leadResponse.allowed_sale) {
            const message = 'Tu proceso de acreditación está en revisión. Podrás solicitar productos una vez sea aprobado.';
            alert(message);
        }
    },

    _onProductAdded(data) {
        this.trigger('product_added', data);
        this._showSuccess('Producto agregado al carrito exitosamente');

        const $cartQuantity = $('.my_cart_quantity');
        if ($cartQuantity.length) {
            $cartQuantity.text(data.cart_quantity);
        }
    },

    _showSuccess(message) {
        console.log('Success:', message);
    },

    _showError(message) {
        console.error('Error:', message);
        alert(message);
    },

    _formatPrice(amount) {
        const formattedAmount = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        const result = this.currencyPosition === 'before'
            ? `${this.currencySymbol} ${formattedAmount}`
            : `${formattedAmount} ${this.currencySymbol}`;

        return result;
    },

    _updateTotalPrice(qty = null) {
        const effectiveQty = qty !== null ? qty : parseFloat(this.qtyInput.val()) || this.minQty;
        const total = this.unitPrice * effectiveQty;

        console.log(`Actualizando precio: ${effectiveQty} × ${this.unitPrice} = ${total}`);

        this.$priceValue.text(this._formatPrice(total));

        this.$priceContainer
            .find('.oe_price')
            .contents()
            .filter((i, node) => node.nodeType === 3)
            .remove();
    },

    _disableAddBtn() {
        if (this.addToCartBtn.is('a')) {
            this.addToCartBtn
                .addClass('disabled o_disabled')
                .css('pointer-events', 'none');
        } else {
            this.addToCartBtn.prop('disabled', true);
        }
    },

    _enableAddBtn() {
        if (this.addToCartBtn.is('a')) {
            this.addToCartBtn
                .removeClass('disabled o_disabled')
                .css('pointer-events', '');
        } else {
            this.addToCartBtn.prop('disabled', false);
        }
    },

    _updateButtonState(qty = null) {
        const currentQty = qty !== null ? qty : (parseFloat(this.qtyInput.val()) || 0);
        const totalDesired = currentQty + this.cartQty;

        if (totalDesired > this.availableQty || currentQty < this.minQty) {
            this._disableAddBtn();
            this.qtyInput.addClass('is-invalid');
            this.warningMessage
                .text(`Cantidad disponible: ${this.availableQty}.`)
                .removeClass('d-none');
        } else {
            this._enableAddBtn();
            this.qtyInput.removeClass('is-invalid');
            this.warningMessage.addClass('d-none');
        }
        this._updateTotalPrice(currentQty);
    },

    _onInputQty(ev) {
        this._validateAndCorrectQty();
        this._updateButtonState();
    },

    _onClickMinus(ev) {
        ev.preventDefault();
        const currentQty = parseFloat(this.qtyInput.val()) || 0;
        const increment = this._getIncrementValue();
        const newQty = Math.max(this.minQty, currentQty - increment);

        this.qtyInput.val(newQty);
        this._updateButtonState(newQty);
    },

    _onClickPlus(ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const currentQty = parseFloat(this.qtyInput.val()) || 0;
        const increment = this._getIncrementValue();
        const newQty = currentQty + increment;
        const totalQty = newQty + this.cartQty;

        if (totalQty <= this.availableQty && newQty >= this.minQty) {
            this.qtyInput.val(newQty);
            this._updateButtonState(newQty);
        } else {
            this.qtyInput.addClass('is-invalid');
            this._disableAddBtn();
            this.warningMessage
                .text(`Cantidad disponible: ${this.availableQty}.`)
                .removeClass('d-none');
        }
    },

    _getIncrementValue() {
        const isUomMin = this.qtyInput.attr('data-is_uom_min') === 'true';
        const increment = isUomMin ? 1 : this.minQty;
        console.log(`Incremento calculado: ${increment} (is_uom_min: ${isUomMin})`);
        return increment;
    },

    _fetchCartQty(variantId = null) {
        const id = variantId || parseInt(this.$('input[name="product_id"]').val());
        if (!id) {
            return Promise.resolve();
        }
        return fetch(`/shop/cart/product_qty/${id}`, { method: 'GET' })
            .then(r => r.json())
            .then(data => {
                this.cartQty = data.qty_in_cart || 0;
                console.log(`Cantidad en carrito: ${this.cartQty}`);
                this._updateButtonState();
            })
            .catch(err => console.error('Cart qty error', err));
    },

    _fetchVariantData() {
        const productIdInput = this.$('input[name="product_id"]');
        const variantId = parseInt(productIdInput.val());

        if (!variantId) {
            console.warn('No se encontró variant ID');
            return Promise.resolve();
        }

        console.log(`Obteniendo datos de variante ID: ${variantId}`);

        return fetch('/shop/get_variant_data/' + variantId, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error en datos de variante:', data.error);
                return;
            }

            console.log('Datos de variante recibidos:', data);

            this.availableQty = data.qty_available || 0;
            this.availableQtyInput.val(this.availableQty);

            this.unitPrice = data.unit_price || 0;
            console.log(`Precio unitario: ${this.unitPrice}`);

            if (data.sale_min_qty) {
                const saleMinQty = parseFloat(data.sale_min_qty);
                this.qtyInput.attr('data-sale-min-qty', saleMinQty);
            }

            if (data.uom_min !== undefined && data.uom_min !== null) {
                const uomMin = parseFloat(data.uom_min);
                const isUomMin = data.is_uom_min || false;

                this.qtyInput.attr({
                    'data-uom-min': uomMin,
                    'data-is_uom_min': isUomMin
                });

                // NO sobrescribir minQty si ya está establecido desde el cambio de formato
                if (!this.minQty || this.minQty === 0) {
                    this.minQty = uomMin;
                }
                console.log(`uom_min: ${uomMin}, is_uom_min: ${isUomMin}`);
            }

            if (!this.minQty || this.minQty === 0) {
                this.minQty = this._getMinQty();
            }

            // NO sobrescribir la cantidad si el usuario ya la cambió manualmente
            const currentQty = parseFloat(this.qtyInput.val()) || 0;
            if (currentQty === 0) {
                this.qtyInput.val(this.minQty);
                console.log(`Cantidad inicial establecida: ${this.minQty}`);
            }

            this._updateTotalPrice();
            this.currentVariantId = variantId;

            return this._fetchCartQty(variantId);
        })
        .then(() => {
            this._updateButtonState();
        })
        .catch(error => console.error('Error fetching variant data:', error));
    },

    _setupVariantObserver() {
        const productIdInput = this.$('input[name="product_id"]');
        if (productIdInput.length) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        const newVariantId = parseInt(productIdInput.val());
                        if (newVariantId && newVariantId !== this.currentVariantId) {
                            console.log(`Variante cambiada: ${this.currentVariantId} -> ${newVariantId}`);
                            this._fetchVariantData();
                        }
                    }
                });
            });
            observer.observe(productIdInput[0], { attributes: true });
        }
    },
});

// Widget de tarjetas
publicWidget.registry.ProductCardQuantitySync = publicWidget.Widget.extend({
    selector: '.tp-cart-form, form[action="/shop/cart/update"]:not(#add_to_cart_form)',
    events: {
        'click .btn-less-card': '_onClickMinus',
        'click .btn-more-card': '_onClickPlus',
        'input input[name="add_qty"]': '_onInputQty',
        'click #add_to_cart': '_onAddToCartCard',
    },
    start() {
        this._super(...arguments);
        this.qtyInput = this.$('input[name="add_qty"]');
        this.maxQty = parseFloat(this.qtyInput.attr('max')) || 9999;
        this._setInitialQty();
    },
    ...QuantityMixin,
    async _onAddToCartCard(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const $form = this.$el;
        const productTmplId = $form.find('input[name="product_template_id"]').val();
        if (!productTmplId) {
            $form.submit();
            return;
        }
        try {
            const defaultFormat = await jsonrpc('/ptav/get_formato_data', {
                product_tmpl_id: parseInt(productTmplId)
            });
            if (defaultFormat && defaultFormat.ptav_id) {
                const $select = this._changeFormatSelect(defaultFormat.ptav_id);
                if ($select) {
                    $select.trigger('change');
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                const variantId = await this._getVariantId(productTmplId, defaultFormat.ptav_id);
                if (variantId) {
                    $form.find('input[name="product_id"]').val(variantId);
                }
                const currentQty = parseFloat(this.qtyInput.val());
                this.qtyInput.attr('min', defaultFormat.uom_min);
                if (currentQty < defaultFormat.uom_min) {
                    this.qtyInput.val(defaultFormat.uom_min);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
        $form.submit();
    },
    _changeFormatSelect(ptavId) {
        const $productCard = this.$el.closest('.oe_product_card, .product-card, .js_product, [itemscope]');
        const $allSelects = $productCard.length ? $productCard.find('select') : $('select');
        let $formatSelect = null;
        $allSelects.each(function() {
            const $select = $(this);
            const $options = $select.find('option');
            let isFormatoSelect = false;
            $options.each(function() {
                if ($(this).data('attribute_name') === 'Formato') {
                    isFormatoSelect = true;
                }
            });
            if (isFormatoSelect) {
                const $targetOption = $select.find('option').filter(function() {
                    return $(this).data('value_id') == ptavId;
                });
                if ($targetOption.length) {
                    $select.val($targetOption.val());
                    $select.find('option').removeAttr('selected');
                    $targetOption.attr('selected', 'selected');
                    $formatSelect = $select;
                }
            }
        });
        return $formatSelect;
    },
    async _getVariantId(productTmplId, ptavId) {
        try {
            const variantData = await jsonrpc('/shop/get_variant_from_ptav', {
                product_tmpl_id: parseInt(productTmplId),
                ptav_id: ptavId
            });
            return variantData && variantData.product_id ? variantData.product_id : null;
        } catch (error) {
            return null;
        }
    },
    _onInputQty(ev) {
        this._validateAndCorrectQty();
    },
    _onClickMinus(ev) {
        ev.preventDefault();
        const currentQty = parseFloat(this.qtyInput.val()) || this.minQty;
        const newQty = Math.max(this.minQty, currentQty - this.minQty);
        this.qtyInput.val(newQty);
    },
    _onClickPlus(ev) {
        ev.preventDefault();
        const currentQty = parseFloat(this.qtyInput.val()) || this.minQty;
        const newQty = currentQty + this.minQty;
        if (newQty <= this.maxQty) {
            this.qtyInput.val(newQty);
        } else {
            this.qtyInput.val(this.maxQty);
        }
    },
});