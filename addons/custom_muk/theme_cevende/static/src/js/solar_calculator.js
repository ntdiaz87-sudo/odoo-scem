/* ============================================================
   CEVENDE - Calculadora solar (esqueleto)
   Lógica: consumo mensual (kWh) -> paneles recomendados + ahorro.
   Ajustar las constantes a los valores reales del negocio.
   ============================================================ */
odoo.define('theme_cevende.solar_calculator', function (require) {
    'use strict';

    const publicWidget = require('web.public.widget');

    publicWidget.registry.CevendeSolarCalculator = publicWidget.Widget.extend({
        selector: '.cv-solar',
        events: {
            'click .cv-solar__calc': '_onCalculate',
        },

        // Constantes de cálculo (placeholder - ajustar a datos reales)
        PANEL_WATTS: 550,            // W por panel
        SUN_HOURS: 5,                // horas pico de sol/día (Cuba)
        KWH_PRICE_USD: 0.30,         // precio estimado kWh

        _onCalculate: function (ev) {
            ev.preventDefault();
            const monthlyKwh = parseFloat(this.$('.cv-solar__consumo').val()) || 0;
            if (!monthlyKwh) { return; }

            const dailyKwh = monthlyKwh / 30;
            const panels = Math.ceil(dailyKwh / (this.PANEL_WATTS / 1000 * this.SUN_HOURS));
            const annualSaving = (monthlyKwh * 12 * this.KWH_PRICE_USD).toFixed(0);

            this.$('.cv-solar__panels-out').text(panels + ' unidades');
            this.$('.cv-solar__saving-out').text(annualSaving + ' USD');
        },
    });

    return publicWidget.registry.CevendeSolarCalculator;
});
