/** @odoo-module */
import publicWidget from '@web/legacy/js/public/public_widget';
import { jsonrpc } from '@web/core/network/rpc_service';

publicWidget.registry.DivepInbondModal = publicWidget.Widget.extend({
    selector: '.js_add_to_cart[data-product-type="in"]',
    events: {
        'click': '_onAddToCartClick',
    },

    start: function () {
        this._createInBondModal();
        return this._super.apply(this, arguments);
    },

    _createInBondModal: function () {
        if ($('#inBondModal').length === 0) {
            const modalHtml = `
                <div class="modal fade" id="inBondModal" tabindex="-1" aria-labelledby="inBondModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="inBondModalLabel">Solicitud de Importación</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p class="mb-0" id="inBondModalMessage">
                                    Este producto no se encuentra en consignación en estos momentos,
                                    usted debe hacer una solicitud de importación. Si desea continuar
                                    con el proceso, presiona Aceptar, si no presione Cancelar.
                                </p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmImportRequest">Aceptar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);
        }
    },

    _onAddToCartClick: function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var $button = $(ev.currentTarget);
        var productId = $button.data('product-id');
        var cartCount = parseInt($('.my_cart_quantity').text()) || 0;

        const buttonText = $button.text().trim();
        const isReserveButton = buttonText.includes('Reservar');

        if (isReserveButton) {
            if (cartCount > 0) {
                this._showCartConflictModal(productId);
            } else {
                this._showInBondModal(productId);
            }
        }
    },

    _showCartConflictModal: function (productId) {
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
            window.location.href = '/divep/cart/clear_and_add?product_id=' + productId + '&add_qty=1';
        });

        $('#cartTypeConflictModal').on('click', function(e) {
            if (e.target === this) {
                $(this).remove();
            }
        });
    },

    _showInBondModal: function (productId) {
        this._createInBondModal();

        var modalElement = document.getElementById('inBondModal');
        if (modalElement) {
            $(modalElement).data('product-id', productId);

            var confirmButton = document.getElementById('confirmImportRequest');
            if (confirmButton) {
                const self = this;
                $(confirmButton).off('click').on('click', function() {
                    self._createImportRequest(productId);
                });
            }

            $(modalElement).modal('show');
        }
    },

    _createImportRequest: function (productId) {
        var quantity = 1;
        var $qtyInput = $('input[name="add_qty"]');
        if ($qtyInput.length) {
            quantity = parseInt($qtyInput.val()) || 1;
        }

        this._showLoading(true, 'Procesando solicitud...');

        const self = this;

        jsonrpc('/divep/create_import_request', {
            product_id: productId,
            quantity: quantity
        }).then(function(result) {
            $('#inBondModal').modal('hide');
            self._showLoading(false);

            if (result.success) {
                self._showMessage('success', result.message || 'Solicitud de importación creada exitosamente');
                setTimeout(function() {
                    window.location.href = result.redirect_url || '/my/orders/by_state/requests';
                }, 2000);
            } else {
                if (result.requires_login) {
                    self._showMessage('warning', 'Debe iniciar sesión para continuar');
                    setTimeout(function() {
                        window.location.href = result.redirect_url || '/web/login';
                    }, 2000);
                } else if (result.requires_accreditation) {
                    self._showMessage('warning', 'No está acreditado para realizar importaciones');
                    setTimeout(function() {
                        window.location.href = result.redirect_url || '/my/profile';
                    }, 2000);
                } else {
                    self._showMessage('danger', result.message || 'Error al crear la solicitud');
                }
            }
        }).catch(function(error) {
            $('#inBondModal').modal('hide');
            self._showLoading(false);
            self._showMessage('danger', 'Error de conexión al crear la solicitud');
        });
    },

    _showLoading: function(show, message) {
        if (show) {
            $('#confirmImportRequest').prop('disabled', true);
            $('#inBondModalMessage').html(`<span class="fa fa-spinner fa-spin"></span> ${message}`);
            if ($('#import-loading-indicator').length === 0) {
                const loadingHtml = `
                    <div id="import-loading-indicator" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                        <div class="bg-white p-4 rounded shadow text-center">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mb-0">${message}</p>
                        </div>
                    </div>
                `;
                $('body').append(loadingHtml);
            }
        } else {
            $('#confirmImportRequest').prop('disabled', false);
            $('#inBondModalMessage').html('Este producto no se encuentra en consignación en estos momentos, usted debe hacer una solicitud de importación. Si desea continuar con el proceso, presiona Aceptar, si no presione Cancelar.');
            $('#import-loading-indicator').remove();
        }
    },

    _showMessage: function(type, message) {
        const bgColor = {
            'success': '#d4edda',
            'danger': '#f8d7da',
            'warning': '#fff3cd',
            'info': '#d1ecf1'
        }[type] || '#d1ecf1';

        const textColor = {
            'success': '#155724',
            'danger': '#721c24',
            'warning': '#856404',
            'info': '#0c5460'
        }[type] || '#0c5460';

        const messageHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 10001; background-color: ${bgColor}; color: ${textColor}; border-color: ${bgColor}; min-width: 300px;" role="alert">
                <i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('body').append(messageHtml);
        setTimeout(function() {
            $('.alert').alert('close');
        }, 3000);
    }
});

export default publicWidget.registry.DivepInbondModal;