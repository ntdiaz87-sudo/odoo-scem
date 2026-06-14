/** @odoo-module **/

import publicWidget from '@web/legacy/js/public/public_widget';
import { WebsiteSale } from '@website_sale/js/website_sale';

// Variable global para saber si el módulo está instalado (se setea desde el backend)
window.pyxelImportInstalled = window.pyxelImportInstalled || false;

if (!window.pyxelImportInstalled) {
    publicWidget.registry.WebsiteSalePhonePrefix = publicWidget.Widget.extend({
        selector: '.checkout_autoformat',
        events: {
            'change #country_id': '_onCountryChange',
            'input #phone':     '_onPhoneInput',
            'click .a-submit':  '_onSubmitClick',
        },

        _onCountryChange(ev) {
            const country = $(ev.currentTarget).find(':selected').data('country-code') || '';
            const $phone  = this.$('#phone');
            const val     = $phone.val() || '';

            if (country === 'CU') {
                $phone.attr('data-country-code', '53');
                if (!val.startsWith('53')) {
                    $phone.val('53' + val.replace(/^53/, ''));
                }
            } else {
                $phone.removeAttr('data-country-code');
                if (val.startsWith('53')) {
                    $phone.val(val.replace(/^53/, ''));
                }
            }
            this._validatePhone();
        },

        _onPhoneInput(ev) {
            const $phone = $(ev.currentTarget);
            const prefix = $phone.attr('data-country-code');
            let val = $phone.val() || '';

            if (prefix === '53' && !val.startsWith('53')) {
                const rest = val.replace(/\D/g, '').slice(prefix.length);
                $phone.val('53' + rest);
            }
            this._validatePhone();
        },

        _validatePhone() {
            const $phone  = this.$('#phone');
            const country = this.$('#country_id').find(':selected').data('country-code') || '';
            const val     = $phone.val() || '';
            const digits  = val.replace(/^53/, '').replace(/\D/g, '');
            const $cont   = $phone.closest('#div_phone');
            $cont.find('.phone-error-message').remove();
            $phone.removeClass('is-invalid');

            if (country === 'CU' && digits.length !== 8) {
                $phone.addClass('is-invalid');
                $cont.append(`
                  <div class="phone-error-message text-danger small mt-1">
                    El número debe tener 8 dígitos tras el prefijo 53.
                  </div>`);
                return false;
            }
            return true;
        },

        _onSubmitClick(ev) {
            if (!this._validatePhone()) {
                ev.preventDefault();
                return false;
            }
        },
    });
} else {
    // Si el módulo está instalado, registramos un widget vacío que no hace nada
    publicWidget.registry.WebsiteSalePhonePrefix = publicWidget.Widget.extend({
        selector: '.checkout_autoformat',
        events: {},
        start: function() {
            // Desactivamos cualquier autocompletado del navegador
            this.$('#phone').attr('autocomplete', 'off');
            this.$('#phone').attr('autocorrect', 'off');
            this.$('#phone').attr('autocapitalize', 'off');
            this.$('#phone').attr('spellcheck', 'false');
        }
    });
}

export default publicWidget.registry.WebsiteSalePhonePrefix;


