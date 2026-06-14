/** @odoo-module **/

import publicWidget from '@web/legacy/js/public/public_widget';

publicWidget.registry.OrderRequestPayment = publicWidget.Widget.extend({
    selector: '#payment-method-form',
    events: {
        'click .btn-check': '_onPaymentMethodSelect',
        'submit': '_onFormSubmit',
    },

    /**
     * Inicialización del widget
     */
    start: function () {
        this._super.apply(this, arguments);

        // Deshabilitar submit por defecto hasta que se seleccione un método
        const submitBtn = this.$el.find('button[type="submit"]');
        if (submitBtn.length) {
            submitBtn.prop('disabled', true);
        }

        // Verificar si ya hay un método seleccionado
        const selectedMethod = this.$el.find('input[name="payment_method_id"]:checked');
        if (selectedMethod.length > 0) {
            this._enableSubmitButton();
        }

        console.log('OrderRequestPayment widget initialized');
        return this._super();
    },

    /**
     * Cuando se selecciona un método de pago
     */
    _onPaymentMethodSelect: function (ev) {
        const $input = $(ev.currentTarget);
        const methodId = $input.val();
        const methodName = $input.next('label').find('h6').text().trim();

        console.log(`Método de pago seleccionado: ${methodName} (ID: ${methodId})`);

        // Habilitar el botón de submit
        this._enableSubmitButton();

        // Opcional: Mostrar información adicional del método seleccionado
        this._showSelectedMethodInfo(methodName);
    },

    /**
     * Cuando se envía el formulario
     */
    _onFormSubmit: function (ev) {
        const form = this.$el[0];
        const submitBtn = this.$el.find('button[type="submit"]');

        // Validar que se haya seleccionado un método de pago
        const selectedMethod = this.$el.find('input[name="payment_method_id"]:checked');
        if (selectedMethod.length === 0) {
            ev.preventDefault();
            this._showError('Por favor seleccione un método de pago');
            return;
        }

        // Deshabilitar el botón para evitar doble envío
        submitBtn.prop('disabled', true);
        submitBtn.html('<i class="fa fa-spinner fa-spin me-2"></i> Procesando...');

        // Mostrar mensaje de procesamiento
        this._showProcessingMessage();
    },

    /**
     * Habilitar el botón de submit
     */
    _enableSubmitButton: function () {
        const submitBtn = this.$el.find('button[type="submit"]');
        submitBtn.prop('disabled', false);
    },

    /**
     * Mostrar información del método seleccionado
     */
    _showSelectedMethodInfo: function (methodName) {
        // Puedes agregar aquí lógica para mostrar información adicional
        // sobre el método de pago seleccionado
        console.log(`Método seleccionado: ${methodName}`);
    },

    /**
     * Mostrar mensaje de error
     */
    _showError: function (message) {
        // Remover mensajes de error previos
        this.$el.find('.alert-danger').remove();

        // Crear nuevo mensaje de error
        const errorAlert = `
            <div class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
                <i class="fa fa-exclamation-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Insertar antes del formulario
        this.$el.prepend(errorAlert);

        // Hacer scroll al mensaje de error
        $('html, body').animate({
            scrollTop: this.$el.find('.alert-danger').offset().top - 100
        }, 300);
    },

    /**
     * Mostrar mensaje de procesamiento
     */
    _showProcessingMessage: function () {
        // Remover mensajes previos
        this.$el.find('.alert-info').remove();

        // Crear mensaje de procesamiento
        const processingAlert = `
            <div class="alert alert-info alert-dismissible fade show mt-3" role="alert">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Procesando su solicitud. Por favor espere...
            </div>
        `;

        // Insertar antes del formulario
        this.$el.prepend(processingAlert);
    },
});

// Registro automático cuando se carga la página
$(document).ready(function () {
    if ($('#payment-method-form').length) {
        const widget = new publicWidget.registry.OrderRequestPayment();
        widget.appendTo($('#payment-method-form').parent());
    }
});