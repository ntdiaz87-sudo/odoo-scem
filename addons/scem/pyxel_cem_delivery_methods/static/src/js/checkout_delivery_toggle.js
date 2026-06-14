/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

publicWidget.registry.WebsiteSaleDeliveryToggle = publicWidget.Widget.extend({
    selector: '#wrapwrap',

    events: {
        'change #need_home_delivery': '_onChangeNeedHomeDelivery',
        'click a[name="website_sale_main_button"]': '_onClickMainButton',
    },

    start() {
        this._toggleShippingBlock();
        return this._super(...arguments);
    },

    async _saveNeedHomeDelivery() {
        const checkbox = document.querySelector('#need_home_delivery');
        if (!checkbox) {
            return;
        }
        const checked = !!checkbox.checked;
        await jsonrpc('/shop/set_need_home_delivery', {
            need_home_delivery: checked,
        });
    },

    async _onChangeNeedHomeDelivery() {
        await this._saveNeedHomeDelivery();
        this._toggleShippingBlock();
    },

    async _onClickMainButton(ev) {
        const btn = ev.currentTarget;
        const href = btn.getAttribute('href') || '';

        // Solo nos interesa el avance desde checkout/extra_info hacia confirm_order
        if (!href.includes('/shop/confirm_order')) {
            return;
        }

        // Si no hay checkbox, no hacemos nada especial
        if (!document.querySelector('#need_home_delivery')) {
            return;
        }

        ev.preventDefault();
        await this._saveNeedHomeDelivery();
        window.location.href = href;
    },

    _toggleShippingBlock() {
        const checkbox = document.querySelector('#need_home_delivery');
        if (!checkbox) {
            return;
        }

        const shippingBlock = document.querySelector('.all_shipping');
        const shippingTitle = Array.from(document.querySelectorAll('h4'))
            .find(el => ['Shipping', 'Direcciones de Entrega'].includes(el.textContent.trim()));

        const show = checkbox.checked;

        if (shippingBlock) {
            shippingBlock.style.display = show ? '' : 'none';
        }
        if (shippingTitle && shippingTitle.closest('.row')) {
            shippingTitle.closest('.row').style.display = show ? '' : 'none';
        }
    },
});