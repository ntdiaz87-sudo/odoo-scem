/** @odoo-module **/

if (document.readyState !== 'loading') {
    initCategoryButtons();
} else {
    document.addEventListener('DOMContentLoaded', initCategoryButtons);
}

function initCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-button');

    if (!categoryButtons.length) {
        return;
    }

    categoryButtons.forEach(button => {
        const img = button.querySelector('img'); 
        const redImg = button.getAttribute('data-img-red'); 
        const whiteImg = button.getAttribute('data-img-white'); 

        if (!img || !redImg || !whiteImg) {
            return;
        }

        button.addEventListener('mouseover', () => {
            img.src = whiteImg;
        });

        button.addEventListener('mouseout', () => {
            img.src = redImg;
        });
    });
}