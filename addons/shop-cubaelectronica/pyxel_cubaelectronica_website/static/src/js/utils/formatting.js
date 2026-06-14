/** @odoo-module **/

// Función para formatear precios en el formato 1,500.00
function formatPrice(price) {
    if (price === undefined || price === null) {
        return '0.00';
    }

    // Convertir a número
    const numericPrice = typeof price === 'string' ?
        parseFloat(price.replace(/,/g, '')) : price;

    if (isNaN(numericPrice)) {
        return '0.00';
    }

    // Formatear el número con comas para miles y punto para decimales
    return numericPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Función para aplicar formato a todos los precios en la página
function applyPriceFormatting() {
    // Selectores para encontrar elementos de precio
    const priceSelectors = [
        '.product-price-carousel',
        '.discounted-price-best-selling',
        '.discounted-price-offers-discounts'
    ];

    priceSelectors.forEach(selector => {
        const priceElements = document.querySelectorAll(selector);

        priceElements.forEach(element => {
            // Obtener el texto actual
            const currentText = element.textContent.trim();

            // Extraer solo la parte numérica (ya debería estar formateada desde Python)
            const priceMatch = currentText.match(/\$?\s*([\d.,]+)/);

            if (priceMatch && priceMatch[1]) {
                // Si ya tiene el formato correcto (con comas), no hacer nada
                if (priceMatch[1].includes(',')) {
                    return;
                }

                // Si no está formateado, aplicar formato
                const priceValue = parseFloat(priceMatch[1]);
                if (!isNaN(priceValue)) {
                    element.textContent = element.textContent.replace(
                        priceMatch[1],
                        formatPrice(priceValue)
                    );
                }
            }
        });
    });
}

// Exportar funciones para uso en otros módulos
export { formatPrice, applyPriceFormatting };