/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

const WebsiteSale = publicWidget.registry.WebsiteSale;

WebsiteSale.include({
    onChangeVariant: async function (ev) {
        const result = this._super.apply(this, arguments);

        const $product = $(ev.currentTarget).closest('.js_product');

        const $selected = $product
            .find('input.js_variant_change:checked, select.js_variant_change option:selected')
            .filter(function () {
                return $(this).data('attribute_name') === "Formato";
            });

        if (!$selected.length) return result;

        const ptavId = $selected.data('value_id');

        // Llamada al controller
        const uom_min = await jsonrpc('/ptav/get_uom_min', { ptav_id: ptavId });

        if (uom_min) {
            const $qty = $product.find('input[name="add_qty"]');

            // Solo se asigna si el usuario no ha modificado manualmente
            if (!$qty.data('user_changed')) {
                $qty.attr('min', uom_min).val(uom_min);
            }

            // Escuchar cambios manuales del usuario
            $qty.off('input.uom_min').on('input.uom_min', function () {
                $(this).data('user_changed', true);
            });
        }

        console.log('PTAV:', ptavId, 'uom_min:', uom_min);

        return result;
    },
});
