/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

// Validate the minimum and maximum quantity of the product on the cart page
publicWidget.registry.websiteSaleCart = publicWidget.registry.websiteSaleCart.extend({
    _onClickDeleteProduct(ev) {
        ev.preventDefault();
        const $line = $(ev.currentTarget).closest('.o_cart_product');
        const $input = $line.find('.js_quantity');

        $input.data('isDeleting', true);
        $input.val(0).trigger('change');
    },
});

const WebsiteSale = publicWidget.registry.WebsiteSale;
WebsiteSale.include({
    _showMinQtyWarning: function (minQty, uomName) {
        const $modal = $(`
            <div class="modal fade" tabindex="-1" role="dialog" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content text-dark">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <i class="fa fa-exclamation-triangle fa-3x"></i>
                            </div>
                            <h5 class="modal-title mb-3">¡Cantidad Mínima Requerida!</h5>
                            <p class="mb-0">La cantidad mínima de compra permitida para ese producto es <strong>${minQty}</strong> ${uomName}.</p>
                        </div>
                    </div>
                </div>
            </div>
        `);
        $modal.appendTo('body').modal('show');
        setTimeout(() => {
            $modal.modal('hide');
            $modal.on('hidden.bs.modal', () => $modal.remove());
        }, 3000);
    },

    _showMaxQtyWarning: function (maxQty, uomName) {
        const $modal = $(`
            <div class="modal fade" tabindex="-1" role="dialog" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content text-dark">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <i class="fa fa-exclamation-triangle fa-3x"></i>
                            </div>
                            <h5 class="modal-title mb-3">¡Cantidad Máxima Excedida!</h5>
                            <p class="mb-0">En este momento solo quedan <strong>${maxQty}</strong> ${uomName} disponibles.</p>
                        </div>
                    </div>
                </div>
            </div>
        `);
        $modal.appendTo('body').modal('show');
        setTimeout(() => {
            $modal.modal('hide');
            $modal.on('hidden.bs.modal', () => $modal.remove());
        }, 3000);
    },

    _onChangeCartQuantity(ev) {
        const $input   = $(ev.currentTarget);

        /* delete → dejar pasar */
        if ($input.data('isDeleting')) {
            $input.removeData('isDeleting');
            return this._super.apply(this, arguments);
        }

        const productId = parseInt($input.data('productId'));
        const minQty    = parseInt($input.attr('min')) || 1;
        const maxQty    = parseInt($input.data('qtyAvailable')) || Infinity;
        const uomName   = $input.data('uomName') || 'unidades';
        const step      = _getIncrement($input);

        let value = Math.round((parseInt($input.val()) || minQty) / step) * step;

        /* mínimo por línea */
        if (value < minQty) {
            this._showMinQtyWarning(minQty, uomName);
            value = minQty;
        }

        /* máximo GLOBAL del producto */
        const qtyInOtherLines = _getTotalQtyInCart(productId, $input);
        let allowed = maxQty - qtyInOtherLines;   // stock que queda

        if (allowed < step) {                  // si no cabe un paso
            this._showMaxQtyWarning(maxQty, uomName);
            value = Math.min(curQty, allowed); // permanece en curQty
        } else {
            const maxLineQty = Math.floor(allowed / step) * step;   // múltiplo 
            if (value > maxLineQty) {
                this._showMaxQtyWarning(maxQty, uomName);
                value = maxLineQty;            // se ajusta al múltiplo válido
            }
        }


        $input.val(value);
        return this._super.apply(this, arguments);
    },
});

function _getIncrement($input) {
    const isUomMin = $input.data('isUomMin');
    const uomMin = parseInt($input.data('uomMin')) || 1;
    const increment = isUomMin ? 1 : uomMin;
    console.log(`_getIncrement: isUomMin=${isUomMin}, uomMin=${uomMin}, increment=${increment}`);
    return increment;
}

/* Devuelve la cantidad TOTAL ya puesta en el carrito para un product_id,
   pudiendo excluir el <input> que estamos editando.                   */
function _getTotalQtyInCart(productId, $excludeInput = null) {
    let total = 0;
    $('.js_quantity').each(function () {
        const $inp = $(this);
        if (parseInt($inp.data('productId')) === productId) {
            if ($excludeInput && $excludeInput[0] === this) { return; }
            total += parseInt($inp.val()) || 0;
        }
    });
    return total;
}


/* --- Botones +/- del carrito --- */
function setupCartCounter() {
    document.body.addEventListener('click', (ev) => {
        const $btn = $(ev.target).closest('.js_add_cart_json');
        if (!$btn.length) return;

        console.log(`Click en botón: ${$btn.find('.fa-minus').length ? 'Minus' : 'Plus'}`);

        /* Interceptar antes que Odoo */
        ev.preventDefault();
        ev.stopImmediatePropagation();

        const $input = $btn.closest('.css_quantity').find('.js_quantity');
        const increment = _getIncrement($input);
        const minQty = parseInt($input.attr('min')) || increment;
        const maxQty = parseInt($input.data('qtyAvailable')) || Infinity;
        const curQty = parseInt($input.val()) || minQty;
        const uomName = $input.attr('data-uom-name') || 'unidades';

        let newQty;
        const productId       = parseInt($input.data('productId'));
        const qtyInOtherLines = _getTotalQtyInCart(productId, $input);
        const remaining       = maxQty - qtyInOtherLines;

        /* PLUS ------------------------------------------------------------ */
        if ($btn.find('.fa-plus').length) {
            if (remaining < increment) {
                new WebsiteSale()._showMaxQtyWarning(maxQty, uomName)
                return;
            }
            newQty = curQty + increment;
        }
        /* MINUS ---------------------------------------- */
        else {
            newQty = Math.max(curQty - increment, minQty);
        }


        if (newQty === curQty) {            // ya no queda stock o llegó al mínimo
            if (newQty >= remaining) {
                new WebsiteSale()._showMaxQtyWarning(maxQty, uomName);
            } else {
                new WebsiteSale()._showMinQtyWarning(minQty, uomName);
            }
            return;
        }

        if (newQty !== curQty) {
            $input.val(newQty).trigger('change');
        }
    }, true);
}

if (document.readyState !== 'loading') {
    setupCartCounter();
} else {
    document.addEventListener('DOMContentLoaded', setupCartCounter);
}