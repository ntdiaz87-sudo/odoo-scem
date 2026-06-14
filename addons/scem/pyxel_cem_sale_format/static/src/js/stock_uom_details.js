/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const PQV = publicWidget.registry.ProductQuantityValidator;

if (PQV) {
    PQV.include({
        async start() {
            await this._super(...arguments);

            // qty del carrito en unidades base (cajas)
            this.cartQtyRef = 0;
            await this._fetchCartQtyReference();
            this._updateButtonState();

            // Cuando cambia el packaging (no-variant), revalidar contra stock
            this.$el.on("change", "select.js_variant_change, input.js_variant_change", async (ev) => {
                const $t = $(ev.currentTarget);
                const $opt = $t.is("select") ? $t.find("option:selected") : $t;

                if (String($opt.data("is_packaging")) === "1") {
                    // Cambió el pack -> uom_min cambia -> recalcula validación
                    this._updateButtonState();
                }
            });

            // Cuando se agrega al carrito, refresca qty_ref desde servidor (robusto)
            $(document.body).on("product_added.product_qty_validator_ref", async (ev, data) => {
                const variantId = parseInt(this.$('input[name="product_id"]').val());
                if (parseInt(data.product_id) !== variantId) {
                    return;
                }
                await this._fetchCartQtyReference(variantId);
                this._updateButtonState();
            });
        },

        _getSelectedPackagingUomMin() {
            const $sel = this.$el
                .find("select.js_variant_change option:selected, input.js_variant_change:checked")
                .filter((i, el) => String($(el).data("is_packaging")) === "1")
                .first();

            const uomMin = parseFloat($sel.data("uom_min") || 1) || 1;
            return uomMin > 0 ? uomMin : 1;
        },

        _getCurrentReferenceQty(packQty) {
            const qty = packQty !== undefined && packQty !== null
                ? packQty
                : (parseFloat(this.qtyInput.val()) || 0);

            return qty * this._getSelectedPackagingUomMin();
        },

        async _fetchCartQtyReference(variantId = null) {
            const id = variantId || parseInt(this.$('input[name="product_id"]').val());
            if (!id) {
                this.cartQtyRef = 0;
                return;
            }
            try {
                const r = await fetch(`/shop/cart/product_qty_reference/${id}`, { method: "GET" });
                const data = await r.json();
                this.cartQtyRef = parseFloat(data.qty_in_cart_reference) || 0;
            } catch (e) {
                console.error("Cart qty reference error:", e);
                this.cartQtyRef = 0;
            }
        },

        // ✅ importante: cuando cambia la variante, el core llama _fetchCartQty(variantId)
        // aquí nos aseguramos de mantener cartQtyRef actualizado también.
        _fetchCartQty(variantId = null) {
            return this._super(...arguments).then(async () => {
                await this._fetchCartQtyReference(variantId);
            });
        },

        // ✅ VALIDACIÓN basada en uom_reference
        _updateButtonState(qty = null) {
            const currentPackQty = qty !== null ? qty : (parseFloat(this.qtyInput.val()) || 0);

            // Base requested = uom_reference
            const currentRefQty = this._getCurrentReferenceQty(currentPackQty);
            const totalRefDesired = currentRefQty + (this.cartQtyRef || 0);

            const available = this.availableQty || 0;

            // Mantén tu validación de mínimo igual
            const violatesMin = currentPackQty < this.minQty;
            const violatesStock = totalRefDesired > available;

            if (violatesStock || violatesMin) {
                this._disableAddBtn();
                this.qtyInput.addClass("is-invalid");
                if (violatesStock) {
                    this.warningMessage
                        .text(`Insufficient stock`)
                        .removeClass("d-none");
                } else {
                    this.warningMessage
                        .text(`Minimum quantity: ${this.minQty}.`)
                        .removeClass("d-none");
                }
            } else {
                this._enableAddBtn();
                this.qtyInput.removeClass("is-invalid");
                this.warningMessage.addClass("d-none");
            }

            // Mantén tu cálculo de precio como lo tengas (si ya usa reference, perfecto)
            this._updateTotalPrice(currentPackQty);
        },

        // ✅ El + también debe validar con reference, si no, seguirá dejando pasar
        _onClickPlus(ev) {
            ev.preventDefault();
            ev.stopImmediatePropagation();

            const currentQty = parseFloat(this.qtyInput.val()) || 0;
            const increment = this._getIncrementValue();
            const newQty = currentQty + increment;

            const newRefQty = this._getCurrentReferenceQty(newQty);
            const totalRefDesired = newRefQty + (this.cartQtyRef || 0);

            if (totalRefDesired <= (this.availableQty || 0) && newQty >= this.minQty) {
                this.qtyInput.val(newQty);
                this._updateButtonState(newQty);
            } else {
                this.qtyInput.addClass("is-invalid");
                this._disableAddBtn();
                this.warningMessage
                    .text(`Insufficient stock`)
                    .removeClass("d-none");
            }
        },
    });
}