/** @odoo-module **/

function setupCounter() {
    // Manejo de botones "-" y "+"
    document.body.addEventListener('click', function (event) {
        if (event.target.matches('.btn-less-card')) {
            const input = event.target
                .closest('.counter-buy-btns')
                .querySelector('.counter-qty');
            const minValue = parseInt(input.getAttribute('min')) || 1;
            let current = parseInt(input.value) || 0;
            if (current > minValue) {
                input.value = current - 1;
                updateAddToCartButtonState(input);
            }
        }
        if (event.target.matches('.btn-more-card')) {
            const input = event.target
                .closest('.counter-buy-btns')
                .querySelector('.counter-qty');
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
        if (event.target.matches('.counter-qty')) {
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
    document.querySelectorAll('.counter-qty').forEach(input => {
        updateAddToCartButtonState(input);
    });
}

function updateAddToCartButtonState(input) {
    const form = input.closest('form');
    const addToCartBtn = form.querySelector('.js_add_to_cart');
    if (!addToCartBtn) {
        console.warn('No se encontró el botón agregar al carrito en el formulario', form);
        return;
    }
    const productInput = form.querySelector('input[name="product_id"]');
    if (!productInput) {
        console.warn('No se encontró el input product_id en el formulario', form);
        return;
    }

    const productId = productInput.value;
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
        const qtyInput = form.querySelector('.counter-qty');
        updateAddToCartButtonState(qtyInput);
    });
});



// /** @odoo-module **/

// // JS so that the input and the (+) and (-) product buttons respect the minimum purchase.
// function setupCounter() {
//     document.body.addEventListener('click', function (event) {
//         if (event.target.matches('.btn-less')) {
//             const input = event.target.parentElement.querySelector('.counter-qty');
//             let currentValue = parseInt(input.value) || 0;
//             let minValue = parseInt(input.getAttribute('min')) || 1;
//             if (currentValue > minValue) {
//                 input.value = currentValue - 1;
//             }
//         }
//         if (event.target.matches('.btn-more')) {
//             const input = event.target.parentElement.querySelector('.counter-qty');
//             let currentValue = parseInt(input.value) || 0;
//             input.value = currentValue + 1;
//         }
//     });

//     document.body.addEventListener('change', function (event) {
//         if (event.target.matches('.counter-qty')) {
//             const input = event.target;
//             const minValue = parseInt(input.getAttribute('min')) || 1;
//             let currentValue = parseInt(input.value) || 0;
//             if (currentValue < minValue) {
//                 input.value = minValue;
//             }
//         }
//     });
    
// }

// if (document.readyState !== 'loading') {
//     setupCounter();
// } else {
//     document.addEventListener('DOMContentLoaded', setupCounter);
// }

