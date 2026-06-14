/** @odoo-module **/

function setupCounter() {
    // Manejo de botones "-" y "+"
    document.body.addEventListener('click', function (event) {
        if (event.target.matches('.btn-less-home')) {
            const input = event.target
                .closest('.form-buy-counter')
                .querySelector('.counter-qty-home');
            const minValue = parseInt(input.getAttribute('min')) || 1;
            let current = parseInt(input.value) || 0;
            if (current > minValue) {
                input.value = current - 1;
                updateAddToCartButtonState(input);
            }
        }
        if (event.target.matches('.btn-more-home')) {
            const input = event.target
                .closest('.form-buy-counter')
                .querySelector('.counter-qty-home');
            const maxValue = parseInt(input.getAttribute('max'));
            let current = parseInt(input.value) || 0;
            if (typeof maxValue === 'number' && !isNaN(maxValue)) {
                if (current < maxValue) {
                    input.value = current + 1;
                    updateAddToCartButtonState(input);
                }
            } else {
                input.value = current + 1;
                updateAddToCartButtonState(input);
            }
        }
    });

    // Manejo de cambios manuales en el input
    document.body.addEventListener('change', function (event) {
        if (event.target.matches('.counter-qty-home')) {
            const input = event.target;
            const minValue = parseInt(input.getAttribute('min')) || 1;
            const maxValue = parseInt(input.getAttribute('max'));
            let current = parseInt(input.value) || 0;
            if (current < minValue) {
                input.value = minValue;
            }
            if (!isNaN(maxValue) && current > maxValue) {
                input.value = maxValue;
            }
            updateAddToCartButtonState(input);
        }
    });

    // Inicialización de botones al cargar la página
    document.querySelectorAll('.counter-qty-home').forEach(input => {
        updateAddToCartButtonState(input);
    });
}

function updateAddToCartButtonState(input) {
    const form = input.closest('form');
    const addToCartBtn = form.querySelector('.js_add_to_cart');
    const productId = form.querySelector('input[name="product_id"]').value;
    const currentQty = parseInt(input.value) || 0;
    const maxQty = parseInt(input.getAttribute('max')) || 0;

    // Fetch cart quantity
    fetch(`/shop/cart/product_qty/${productId}`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            const cartQty = data.qty_in_cart || 0;
            const totalQty = cartQty + currentQty;

            if (totalQty > maxQty) {
                addToCartBtn.disabled = true;
                addToCartBtn.classList.add('disabled');
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.classList.remove('disabled');
            }
        })
        .catch(error => {
            console.error('Error fetching cart quantity:', error);
            addToCartBtn.disabled = true; // Deshabilitar por seguridad en caso de error
            addToCartBtn.classList.add('disabled');
        });
}

// Inicialización
if (document.readyState !== 'loading') {
    setupCounter();
} else {
    document.addEventListener('DOMContentLoaded', setupCounter);
}

// Escuchar evento de producto añadido al carrito (si Odoo lo dispara)
document.body.addEventListener('product_added', function (event) {
    const productId = event.detail.product_id;
    const quantity = event.detail.quantity;
    document.querySelectorAll(`input[name="product_id"][value="${productId}"]`).forEach(input => {
        const form = input.closest('form');
        const qtyInput = form.querySelector('.counter-qty-home');
        updateAddToCartButtonState(qtyInput);
    });
});

