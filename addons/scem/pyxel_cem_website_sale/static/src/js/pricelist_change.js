/** @odoo-module **/

/**
 * PRICELIST WIDGET — sin localStorage
 *
 * El servidor es la única fuente de verdad.
 * El JS solo construye el href con la URL actual completa y redirige.
 * El t-nocache en el template garantiza que el header siempre
 * re-evalúa la sesión al renderizar.
 */

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.PricelistChangeWidget = publicWidget.Widget.extend({
    selector: '.o_pricelist_dropdown',
    events: {
        'click .js_change_currency': '_onChangeCurrency',
    },

    _onChangeCurrency: function (ev) {
        ev.preventDefault();
        const $link = $(ev.currentTarget);
        const plId = $link.data('pl-id');
        if (!plId) return;

        // URL actual completa: path + query string (preserva access_token, etc.)
        const returnUrl = window.location.pathname + window.location.search;
        const href = `/shop/change_pricelist/${plId}?r=${encodeURIComponent(returnUrl)}`;

        // Feedback visual
        this.$('.dropdown-toggle').addClass('disabled').css('opacity', '0.6');

        setTimeout(() => { window.location.href = href; }, 80);
    },

    start: function () {
        this._super.apply(this, arguments);
        // Sincronizar texto del botón con el item activo que puso el servidor
        const $active = this.$('.dropdown-item.active .switcher_pricelist');
        const $btn = this.$('.dropdown-toggle small');
        if ($active.length && $btn.length) {
            const txt = $active.text().trim();
            if (txt && $btn.text().trim() !== txt) $btn.text(txt);
        }
        return Promise.resolve();
    },
});

export default publicWidget.registry.PricelistChangeWidget;