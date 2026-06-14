/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.CartUomReference = publicWidget.Widget.extend({
    selector: ".oe_website_sale", // o "#wrapwrap" si prefieres

    start() {
        const res = this._super(...arguments);

        // recalcular al cargar
        this._recomputeAll();

        // recalcular cuando cambie qty (tu código dispara change)
        this.$el.on("change input", ".js_quantity", (ev) => {
            const $input = $(ev.currentTarget);
            const $line = $input.closest(".o_cart_product");
            this._recomputeLine($line);
        });

        return res;
    },

    _recomputeAll() {
        this.$(".o_cart_product").each((_, el) => this._recomputeLine($(el)));
    },

    _recomputeLine($line) {
        const $input = $line.find(".js_quantity");
        const $wrap = $line.find(".js_cart_uom_reference_wrapper");
        const $val = $line.find(".js_cart_uom_reference_value");

        if (!$input.length || !$wrap.length || !$val.length) return;

        const packs = parseFloat($input.val() || 0) || 0;

        // data-packaging-uom-min => jQuery: data("packagingUomMin")
        const mult = parseFloat($input.data("packagingUomMin") || 1) || 1;
        const ref = packs * (mult > 0 ? mult : 1);

        // pinta entero si aplica
        $val.text(Number.isInteger(ref) ? String(ref) : String(ref));

        // nombre fijo (caja) desde data-ref-unit-name (si lo pasaste)
        const unitName = (
            ($input.data("refUnitName") || $wrap.data("refPtavName") || "")
        ).toString().trim();

        let $name = $wrap.find(".js_cart_uom_reference_unit");
        if (!$name.length) {
            $name = $(`<span class="ms-1 js_cart_uom_reference_unit"></span>`).appendTo($wrap);
        }
        $name.text(unitName);

    },
});
