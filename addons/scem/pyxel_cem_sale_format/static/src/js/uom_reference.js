/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.ProductUomReference = publicWidget.Widget.extend({
    selector: "#add_to_cart_form",

    events: {
        "change select.js_variant_change": "_scheduleRecompute",
        "change input.js_variant_change": "_scheduleRecompute",

        "input input[name='add_qty']": "_recompute",
        "change input[name='add_qty']": "_recompute",
    },

    start() {
        const res = this._super(...arguments);

        // root robusto
        this.$root = this.$el.closest("#product_details");
        if (!this.$root.length) {
            this.$root = $("#product_details");
        }

        // Listener CAPTURE: no lo mata stopImmediatePropagation()
        this._onDocClickCapture = (ev) => {
            const btn = ev.target.closest(".qty-update-more, .qty-update-less, .btn-more-detail, .btn-less-detail, .btn-more, .btn-less");
            if (!btn) return;

            // Solo si el click fue dentro de ESTE form
            if (!this.el.contains(btn)) return;

            // Recalcular después de que el otro handler cambie el input
            this._scheduleRecompute();
        };
        document.addEventListener("click", this._onDocClickCapture, true);

        this._recompute();
        return res;
    },

    destroy() {
        if (this._onDocClickCapture) {
            document.removeEventListener("click", this._onDocClickCapture, true);
        }
        this._clearTimers();
        return this._super(...arguments);
    },

    _clearTimers() {
        if (this._t0) clearTimeout(this._t0);
        if (this._t1) clearTimeout(this._t1);
        this._t0 = null;
        this._t1 = null;
    },

    _scheduleRecompute() {
        // cancela re-computes anteriores para evitar “saltos”
        this._clearTimers();

        // 1) siguiente tick (después de que el otro JS haga qtyInput.val(...))
        this._t0 = setTimeout(() => this._recompute(), 0);

        // 2) un “seguro” por si hay otra corrección posterior (validación/min/max)
        this._t1 = setTimeout(() => this._recompute(), 30);
    },

    _getSelectedPackagingElement() {
        return this.$el
            .find("select.js_variant_change option:selected, input.js_variant_change:checked")
            .filter((i, el) => String($(el).data("is_packaging")) === "1");
    },

    _recompute() {
        const $wrap = this.$root.find(".js_uom_reference_wrapper");
        const $out = this.$root.find(".js_uom_reference_value");

        const qty = parseFloat(this.$el.find("input[name='add_qty']").val() || 0) || 0;

        // Valor seleccionado del atributo packaging (de aquí sale uom_min)
        const $selected = this._getSelectedPackagingElement();
        if (!$selected.length) {
            $wrap.addClass("d-none");
            $out.text("0");
            return;
        }

        const uomMin = parseFloat($selected.data("uom_min") || 0) || 0;
        const uomRef = qty * uomMin;

        // ✅ Nombre FIJO: el que tenga is_uom_min=true (ej. "caja")
        let unitName = this._getReferenceUnitName();

        // plural simple
        if (unitName) {
            const isSingular = Math.abs(uomRef - 1) < 1e-9;
            if (!isSingular && !/s$/i.test(unitName)) {
                unitName = unitName + "s";
            }
        }

        $wrap.removeClass("d-none");

        const formatted = Number.isInteger(uomRef) ? String(uomRef) : String(uomRef);
        $out.text(unitName ? `${formatted} ${unitName}` : formatted);
    },

    _getReferenceUnitName() {
        // Busca el único valor del atributo packaging marcado is_uom_min=true
        const $ref = this.$el
            .find("select.js_variant_change option, input.js_variant_change")
            .filter((i, el) =>
                String($(el).data("is_packaging")) === "1" &&
                String($(el).data("is_uom_min")) === "true"
            )
            .first();

        if (!$ref.length) {
            return "";
        }

        let name = ($ref.data("value_name") || "").toString().trim();

        // fallback si es <option> y no hubiera data-value_name
        if (!name && $ref.is("option")) {
            name = ($ref.text() || "").trim();
        }
        return name;
    }
});
