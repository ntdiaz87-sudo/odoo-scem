/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.DivepCartTypeValidator = publicWidget.Widget.extend({
    selector: '.js_add_to_cart:not([data-product-type="in"])',
    events: {
        'click': '_onAddToCartClick',
    },

    start: function () {
        console.log('✅ DivepCartTypeValidator iniciado');
        return this._super.apply(this, arguments);
    },

    _onAddToCartClick: function (ev) {
        const $button = $(ev.currentTarget);
        let productType = $button.data('product-type');
        const cartCount = parseInt($('.my_cart_quantity').text()) || 0;

        if (!productType) {
            productType = 'con';
        }

        if (cartCount > 0 && this._hasCartTypeConflict(productType)) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            this._showCartTypeConflictModal($button);
        }
    },

    _hasCartTypeConflict: function (newProductType) {
        const cartHasProducts = parseInt($('.my_cart_quantity').text()) > 0;

        if (!cartHasProducts) {
            return false;
        }

        if (newProductType === 'con' && cartHasProducts) {
            return true;
        }

        return false;
    },

    _showCartTypeConflictModal: function ($originalButton) {
        const modalHtml = `
            <div class="modal fade show d-block" id="cartTypeConflictModal" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Conflicto en el Carrito</h5>
                            <button type="button" class="btn-close" id="closeCartModal"></button>
                        </div>
                        <div class="modal-body">
                            <p>No puedes mezclar productos <strong>In-Bond</strong> con productos en <strong>Consignación</strong>.</p>
                            <p>¿Deseas vaciar el carrito y agregar este producto?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelAddToCart">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirmReplaceCart">Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#cartTypeConflictModal').remove();
        $('body').append(modalHtml);

        const self = this;

        $('#cancelAddToCart, #closeCartModal').on('click', function() {
            $('#cartTypeConflictModal').remove();
        });

        $('#confirmReplaceCart').on('click', function() {
            $('#cartTypeConflictModal').remove();
            self._redirectToCartClear($originalButton);
        });

        $('#cartTypeConflictModal').on('click', function(e) {
            if (e.target === this) {
                $(this).remove();
            }
        });
    },

    _redirectToCartClear: function ($button) {
        const $form = $button.closest('form');
        const productId = $form.find('input[name="product_id"]').val() || $button.data('product-id');
        const addQty = $form.find('input[name="add_qty"]').val() || 1;

        window.location.href = '/divep/cart/clear_and_add?product_id=' + productId + '&add_qty=' + addQty;
    }
});

export default publicWidget.registry.DivepCartTypeValidator;