/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

/**
 * 1) Asegurar que DELETE pone qty=0 y dispara change (como tu módulo base).
 *    Esto permite que /shop/cart/update lo quite.
 */
publicWidget.registry.websiteSaleCart = publicWidget.registry.websiteSaleCart.extend({
    _onClickDeleteProduct(ev) {
        ev.preventDefault();
        const $line = $(ev.currentTarget).closest(".o_cart_product");
        const $input = $line.find(".js_quantity");

        $input.data("isDeleting", true);
        $input.val(0).trigger("change");
    },
});

const WebsiteSale = publicWidget.registry.WebsiteSale;

WebsiteSale.include({
    /**
     * Modal personalizado (EN) sin párrafo
     */
    _showMaxQtyWarning(maxQty, uomName) {
        const $modal = $(`
            <div class="modal fade" tabindex="-1" role="dialog" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content text-dark">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <i class="fa fa-exclamation-triangle fa-3x"></i>
                            </div>
                            <h5 class="modal-title mb-3">Maximum Quantity Exceeded!</h5>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $modal.appendTo("body").modal("show");
        setTimeout(() => {
            $modal.modal("hide");
            $modal.on("hidden.bs.modal", () => $modal.remove());
        }, 3000);
    },

    /**
     * Validar stock en BASE (cajas) usando:
     * uom_reference = input(packs) * data-packaging-uom-min
     */
    _onChangeCartQuantity(ev) {
        const $input = $(ev.currentTarget);

        // ✅ A) Si viene de DELETE => dejar pasar (NO normalizar a minQty)
        const rawVal = ($input.val() ?? "").toString().trim();
        if (rawVal !== "" && parseFloat(rawVal) === 0) {
            return this._super.apply(this, arguments);
        }
        if ($input.data("isDeleting")) {
            $input.removeData("isDeleting");
            return this._super.apply(this, arguments);
        }

        const productId   = parseInt($input.data("productId"));
        const minQty      = parseFloat($input.attr("min")) || 1;          // unidad visible (packs)
        const maxQtyBase  = parseFloat($input.data("qtyAvailable"));      // stock real (cajas)
        const uomNameBase = $input.data("uomName") || "unidades";

        const step   = _getIncrement($input); // step en unidad visible
        const curQty = parseFloat($input.val()) || 0;

        // Normaliza a múltiplo de step
        let value = Math.round((curQty || minQty) / step) * step;

        // Mínimo por línea (igual que original)
        if (value < minQty) {
            // si quieres también traducir este modal, sobreescribe _showMinQtyWarning similar al de max.
            this._showMinQtyWarning(minQty, uomNameBase);
            value = minQty;
        }

        // Si no hay max, deja pasar
        if (!isFinite(maxQtyBase)) {
            $input.val(value);
            return this._super.apply(this, arguments);
        }

        // ✅ conversión packs->cajas
        const mult = _getPackagingMult($input); // data-packaging-uom-min

        // total de otras líneas del mismo producto en cajas
        const otherBase = _getTotalReferenceQtyInCart(productId, $input);

        // stock restante en cajas
        const remainingBase = Math.max(0, maxQtyBase - otherBase);

        // máximo permitido para ESTA línea, en packs (unidad visible), respetando step
        const maxLineQty = Math.floor((remainingBase / mult) / step) * step;

        // Si no cabe ni un step, warning y clamp
        if (maxLineQty < step) {
            this._showMaxQtyWarning(maxQtyBase, uomNameBase);
            value = Math.min(value, maxLineQty);
        } else if (value > maxLineQty) {
            this._showMaxQtyWarning(maxQtyBase, uomNameBase);
            value = maxLineQty;
        }

        // ✅ importante: si clamp dio 0 por falta de stock, NO lo subas a minQty aquí
        // (si el usuario quiere borrar, debe usar el botón borrar; pero si queda 0 por clamp,
        //  Odoo puede interpretarlo como delete. Si no quieres eso, dime y lo forzamos a minQty.)
        $input.val(value);

        return this._super.apply(this, arguments);
    },
});

/**
 * Intercepta botones +/- del carrito ANTES que el handler original:
 * usamos listener en document (capturing) y paramos la propagación.
 */
function installCartCounterOverride() {
    if (installCartCounterOverride._installed) return;
    installCartCounterOverride._installed = true;

    document.addEventListener(
        "click",
        (ev) => {
            // ✅ NO interceptar delete real
            if ($(ev.target).closest(".js_delete_product").length) {
                return;
            }

            const $btn = $(ev.target).closest(".js_add_cart_json");
            if (!$btn.length) return;

            // Si NO hay input asociado, puede ser markup raro: fallback a delete
            const $input = $btn.closest(".css_quantity").find(".js_quantity");
            if (!$input.length) {
                const $line = $btn.closest(".o_cart_product");
                const $lineInput = $line.find(".js_quantity");
                if ($lineInput.length) {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    $lineInput.data("isDeleting", true);
                    $lineInput.val(0).trigger("change");
                }
                return;
            }

            // ✅ bloquear handler original (que suele estar en body capturing)
            ev.preventDefault();
            ev.stopImmediatePropagation();

            const productId   = parseInt($input.data("productId"));
            const step        = _getIncrement($input);
            const minQty      = parseFloat($input.attr("min")) || step;

            const maxQtyBase  = parseFloat($input.data("qtyAvailable"));
            const uomNameBase = $input.data("uomName") || "unidades";

            const curQty = parseFloat($input.val()) || minQty;

            const mult = _getPackagingMult($input);
            const otherBase = _getTotalReferenceQtyInCart(productId, $input);
            const remainingBase = isFinite(maxQtyBase) ? Math.max(0, maxQtyBase - otherBase) : Infinity;

            let newQty = curQty;

            const isPlus = $btn.find(".fa-plus").length > 0;
            if (isPlus) {
                // validar por base: necesito (step * mult) cajas disponibles
                const needBase = step * mult;
                if (remainingBase < needBase) {
                    new WebsiteSale()._showMaxQtyWarning(maxQtyBase, uomNameBase);
                    return;
                }
                newQty = curQty + step;
            } else {
                newQty = Math.max(curQty - step, minQty);
            }

            if (newQty !== curQty) {
                $input.val(newQty).trigger("change"); // tu _onChangeCartQuantity hace el clamp final
            }
        },
        true
    );
}

function _getPackagingMult($input) {
    // data-packaging-uom-min => jQuery: data("packagingUomMin")
    const mult = parseFloat($input.data("packagingUomMin") || 1) || 1;
    return mult > 0 ? mult : 1;
}

// step EXACTO del módulo base (no lo cambiamos)
function _getIncrement($input) {
    const raw = $input.data("isUomMin");
    const isUomMin = raw === true || raw === "true";
    const uomMin = parseInt($input.data("uomMin")) || 1;
    return isUomMin ? 1 : uomMin;
}

// suma en BASE (cajas): sum(packs * packaging_uom_min)
function _getTotalReferenceQtyInCart(productId, $excludeInput = null) {
    let total = 0;
    $(".js_quantity").each(function () {
        const $inp = $(this);
        if (parseInt($inp.data("productId")) === productId) {
            if ($excludeInput && $excludeInput[0] === this) return;
            const packs = parseFloat($inp.val()) || 0;
            total += packs * _getPackagingMult($inp);
        }
    });
    return total;
}

if (document.readyState !== "loading") {
    installCartCounterOverride();
} else {
    document.addEventListener("DOMContentLoaded", installCartCounterOverride);
}