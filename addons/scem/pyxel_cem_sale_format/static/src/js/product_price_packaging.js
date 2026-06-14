/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const PQV = publicWidget.registry.ProductQuantityValidator;

if (PQV) {
    PQV.include({
        async start() {
            await this._super(...arguments);

            // refs (pueden cambiar si website_sale re-renderiza)
            this._refreshPriceDomRefs();

            // Observa cambios de precio (cuando website_sale lo pisa)
            this._setupPriceObserver();

            // Recalcular al terminar init
            this._schedulePriceRecompute();

            // Cuando cambia cualquier atributo (incluye tu packaging no-variant)
            this.$el.on("change", "select.js_variant_change, input.js_variant_change", () => {
                // website_sale puede re-renderizar async -> re-aplicar varias veces
                this._schedulePriceRecompute();
            });

            // Si el usuario escribe qty manualmente (además del handler original)
            this.$el.on("input change", "input[name='add_qty']", () => {
                this._schedulePriceRecompute();
            });
        },

        // ----------------------------------------------------
        // Helpers DOM/Observer
        // ----------------------------------------------------
        _refreshPriceDomRefs() {
            // re-leer porque website_sale puede reemplazar nodos internos
            this.$priceContainer = this.$("#price_container");
            this.$priceValue = this.$priceContainer.find(".oe_currency_value").first();
        },

        _setupPriceObserver() {
            // si ya existe, no duplicar
            if (this._packPriceObserver) return;

            // Observa el contenedor (más estable que el span)
            const containerEl = this.$("#price_container")[0];
            if (!containerEl) return;

            this._packPriceObserver = new MutationObserver(() => {
                // Si el cambio fue causado por nosotros, ignora
                if (this._suppressPriceObserver) return;

                // website_sale acaba de reescribir el precio => reaplica tu fórmula
                this._schedulePriceRecompute();
            });

            this._packPriceObserver.observe(containerEl, {
                subtree: true,
                childList: true,
                characterData: true,
            });
        },

        _schedulePriceRecompute() {
            // re-sync refs por si website_sale reemplazó nodos
            this._refreshPriceDomRefs();
            this._setupPriceObserver();

            // Debounce simple
            if (this._recomputeTimer) {
                clearTimeout(this._recomputeTimer);
            }

            // 1) próximo tick
            this._recomputeTimer = setTimeout(() => this._updateButtonState(), 0);

            // 2) después de que website_sale termine renders async (ajusta si tu server es lento)
            setTimeout(() => this._updateButtonState(), 60);
            setTimeout(() => this._updateButtonState(), 200);

            // 3) RAF por si hay repaint en medio
            if (window.requestAnimationFrame) {
                requestAnimationFrame(() => this._updateButtonState());
            }
        },

        // ----------------------------------------------------
        // Tu lógica (uom_min selected)
        // ----------------------------------------------------
        _getPackagingUomMin() {
            const $sel = this.$el
                .find("select.js_variant_change option:selected, input.js_variant_change:checked")
                .filter((i, el) => String($(el).data("is_packaging")) === "1")
                .first();

            const uomMin = parseFloat($sel.data("uom_min") || 1) || 1;
            return uomMin > 0 ? uomMin : 1;
        },

        _updateTotalPrice(qty = null) {
            // si por alguna razón todavía no están refs (primer paint), reobtén
            if (!this.$priceValue || !this.$priceValue.length) {
                this._refreshPriceDomRefs();
            }

            const effectiveQty = qty !== null
                ? qty
                : (parseFloat(this.qtyInput?.val?.() || 0) || this.minQty || 1);

            const uomMin = this._getPackagingUomMin();
            const referenceQty = effectiveQty * uomMin;

            const total = (this.unitPrice || 0) * referenceQty;

            // Evita que el observer se dispare por tu propio write
            this._suppressPriceObserver = true;
            this.$priceValue.text(this._formatPrice(total));

            this.$priceContainer
                .find(".oe_price")
                .contents()
                .filter((i, node) => node.nodeType === 3)
                .remove();

            setTimeout(() => { this._suppressPriceObserver = false; }, 0);
        },

        // ----------------------------------------------------
        // Mantén tu _addToCart serializando todo el form (OK)
        // ----------------------------------------------------
        async _addToCart() {
            const $form = this.$el;
            const quantity = parseFloat($form.find("input[name='add_qty']").val()) || 1;

            try {
                const hasLeadResponse = await this._checkUserHasLead();
                if (!hasLeadResponse.has_lead || !hasLeadResponse.allowed_sale) {
                    this._handleLeadRestriction(hasLeadResponse);
                    return;
                }

                const body = new URLSearchParams($form.serialize());
                body.set("add_qty", String(quantity));

                const response = await fetch("/shop/cart/update", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body,
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.cart_quantity !== undefined) {
                        this._onProductAdded(data);
                    }
                } else {
                    throw new Error("Error al agregar al carrito");
                }
            } catch (error) {
                console.error("Error:", error);
                this._showError("Error al agregar el producto al carrito");
            }
        },
    });
}