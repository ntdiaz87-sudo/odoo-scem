/** @odoo-module **/
(function() {
    'use strict';

    function initDualPriceSlider() {
        var minRange = document.getElementById('price-range-min');
        var maxRange = document.getElementById('price-range-max');
        var minInput = document.getElementById('price-min-input');
        var maxInput = document.getElementById('price-max-input');
        var actualMinEl = document.getElementById('actual-min-price');
        var actualMaxEl = document.getElementById('actual-max-price');

        var minRangeResp = document.getElementById('price-range-min-responsive');
        var maxRangeResp = document.getElementById('price-range-max-responsive');
        var minInputResp = document.getElementById('price-min-input-responsive');
        var maxInputResp = document.getElementById('price-max-input-responsive');
        var actualMinResp = document.getElementById('actual-min-price-responsive');
        var actualMaxResp = document.getElementById('actual-max-price-responsive');

        if (!minRange || !maxRange) return;

        var container = document.querySelector('.tp-price-filter');
        var currencySymbol = container?.dataset?.currencySymbol || 'CUP';
        var decimalPlaces = parseInt(container?.dataset?.decimalPlaces || 2);

        // Función para formatear precio con formato español (punto para miles, coma para decimales)
        function formatPriceEs(val) {
            if (val === undefined || val === null || isNaN(val) || val === 0) {
                return currencySymbol + ' 0,00';
            }

            // Separar parte entera y decimal
            var num = parseFloat(val);
            var parts = num.toFixed(decimalPlaces).split('.');
            var integerPart = parts[0];
            var decimalPart = parts[1];

            // Agregar separador de miles (punto) a la parte entera
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

            // Formato final: "CUP 2.611.392,00"
            return currencySymbol + ' ' + integerPart + ',' + decimalPart;
        }

        // Función para parsear precio desde string con formato español
        function parsePriceEs(value) {
            if (!value) return 0;
            // Eliminar símbolo de moneda
            var cleaned = value.toString()
                .replace(new RegExp('^' + currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
                .trim();
            // Eliminar puntos de miles y reemplazar coma decimal por punto
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
            var parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }

        var actualMin = parseFloat(actualMinEl?.value || 0);
        var actualMax = parseFloat(actualMaxEl?.value || 1000);

        function updateInputs(minVal, maxVal, isResponsive) {
            var minInp = isResponsive ? minInputResp : minInput;
            var maxInp = isResponsive ? maxInputResp : maxInput;
            if (minInp) minInp.value = formatPriceEs(minVal);
            if (maxInp) maxInp.value = formatPriceEs(maxVal);
        }

        var timeout;
        function updatePriceFilter(minVal, maxVal) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                var url = new URL(window.location.href);

                // Usar punto decimal para la URL (formato estándar)
                if (minVal > actualMin) {
                    url.searchParams.set('min_price', minVal.toFixed(decimalPlaces).replace(',', '.'));
                } else {
                    url.searchParams.delete('min_price');
                }

                if (maxVal < actualMax) {
                    url.searchParams.set('max_price', maxVal.toFixed(decimalPlaces).replace(',', '.'));
                } else {
                    url.searchParams.delete('max_price');
                }

                window.location.href = url.toString();
            }, 500);
        }

        function setupDualSlider(minSlider, maxSlider, minInp, maxInp, isResponsive) {
            var aMin = isResponsive ? parseFloat(actualMinResp?.value || 0) : actualMin;
            var aMax = isResponsive ? parseFloat(actualMaxResp?.value || 1000) : actualMax;

            // Leer parámetros de URL (vienen con punto decimal)
            var params = new URLSearchParams(window.location.search);
            var startMin = params.get('min_price') ? parseFloat(params.get('min_price')) : aMin;
            var startMax = params.get('max_price') ? parseFloat(params.get('max_price')) : aMax;

            // Validar rangos
            startMin = Math.max(aMin, Math.min(startMin, aMax));
            startMax = Math.min(aMax, Math.max(startMax, aMin));
            if (startMin > startMax) { startMin = aMin; startMax = aMax; }

            // Configurar sliders
            var step = 0.01;

            minSlider.min = aMin;
            minSlider.max = aMax;
            minSlider.step = step;
            minSlider.value = startMin;

            maxSlider.min = aMin;
            maxSlider.max = aMax;
            maxSlider.step = step;
            maxSlider.value = startMax;

            updateInputs(startMin, startMax, isResponsive);

            minSlider.addEventListener('input', function() {
                var minVal = parseFloat(this.value);
                var maxVal = parseFloat(maxSlider.value);
                if (minVal > maxVal) {
                    this.value = maxVal;
                    minVal = maxVal;
                }
                updateInputs(minVal, maxVal, isResponsive);
            });

            minSlider.addEventListener('change', function() {
                var minVal = parseFloat(this.value);
                var maxVal = parseFloat(maxSlider.value);
                if (minVal > maxVal) {
                    this.value = maxVal;
                    minVal = maxVal;
                }
                updatePriceFilter(minVal, maxVal);
            });

            maxSlider.addEventListener('input', function() {
                var minVal = parseFloat(minSlider.value);
                var maxVal = parseFloat(this.value);
                if (maxVal < minVal) {
                    this.value = minVal;
                    maxVal = minVal;
                }
                updateInputs(minVal, maxVal, isResponsive);
            });

            maxSlider.addEventListener('change', function() {
                var minVal = parseFloat(minSlider.value);
                var maxVal = parseFloat(this.value);
                if (maxVal < minVal) {
                    this.value = minVal;
                    maxVal = minVal;
                }
                updatePriceFilter(minVal, maxVal);
            });

            if (minInp) {
                minInp.addEventListener('change', function() {
                    var val = parsePriceEs(this.value);
                    if (isNaN(val)) val = aMin;
                    val = Math.max(aMin, Math.min(val, parseFloat(maxSlider.value)));
                    minSlider.value = val;
                    updateInputs(val, parseFloat(maxSlider.value), isResponsive);
                    updatePriceFilter(val, parseFloat(maxSlider.value));
                });
            }

            if (maxInp) {
                maxInp.addEventListener('change', function() {
                    var val = parsePriceEs(this.value);
                    if (isNaN(val)) val = aMax;
                    val = Math.min(aMax, Math.max(val, parseFloat(minSlider.value)));
                    maxSlider.value = val;
                    updateInputs(parseFloat(minSlider.value), val, isResponsive);
                    updatePriceFilter(parseFloat(minSlider.value), val);
                });
            }
        }

        setupDualSlider(minRange, maxRange, minInput, maxInput, false);
        if (minRangeResp && maxRangeResp) {
            setupDualSlider(minRangeResp, maxRangeResp, minInputResp, maxInputResp, true);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDualPriceSlider);
    } else {
        initDualPriceSlider();
    }
})();