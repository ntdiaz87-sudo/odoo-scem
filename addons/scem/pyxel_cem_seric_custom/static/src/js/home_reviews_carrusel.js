/** @odoo-module **/

if (document.readyState !== 'loading') {
    initReviewsCarousel();
} else {
    document.addEventListener('DOMContentLoaded', initReviewsCarousel);
}

function initReviewsCarousel() {
    const container = document.querySelector('.review-container');
    const prevBtn = document.getElementById('reviews-prev-btn');
    const nextBtn = document.getElementById('reviews-next-btn');
    const progressBar = document.querySelector('.line-progress');
    const cards = document.querySelectorAll('.card-review');

    if (!container || !prevBtn || !nextBtn || !progressBar || !cards.length) {
        return;
    }

    const totalCards = cards.length; 

    //Define numero de targetas visibles
    const getCardsPerView = () => {
        const containerWidth = container.clientWidth;
        const cardWidth = document.querySelector('.card-review').offsetWidth;
        const gap = 25; 

        let visibleCards = Math.floor(containerWidth / (cardWidth + gap)) || 1;
        if (window.innerWidth <= 730) {
            visibleCards = 1; 
        } else {
            visibleCards = Math.min(2, visibleCards); 
        }
        return visibleCards;
    };

    // Calcula cuánto desplazar el carrusel basado en las tarjetas visibles
    const scrollAmount = () => {
        const cardWidth = document.querySelector('.card-review').offsetWidth;
        const gap = 25; 
        const cardsPerView = getCardsPerView();
        return (cardWidth + gap) * cardsPerView; 
    };

    // Calcula el desplazamiento máximo del contenedor
    const maxScroll = () => {
        const cardWidth = document.querySelector('.card-review').offsetWidth;
        const gap = 25;
        const totalWidth = (cardWidth + gap) * totalCards - gap; 
        const scrollMax = totalWidth - container.clientWidth; 
        return Math.max(0, scrollMax); 
    };

    // Actualiza la barra de progreso según la posición del scroll
    const updateProgressBar = () => {
        const scrollPosition = container.scrollLeft;
        const maxScrollValue = maxScroll();
        const progressBarMaxTranslate = 150; 

        let progressFraction = maxScrollValue > 0 ? scrollPosition / maxScrollValue : 0;
        progressFraction = Math.min(1, Math.max(0, progressFraction)); 

        const translateX = progressFraction * progressBarMaxTranslate;

        progressBar.style.transform = `translateX(${translateX}px)`;
    };

    // Botón "anterior" 
    prevBtn.addEventListener('click', () => {
        container.scrollBy({
            left: -scrollAmount(),
            behavior: 'smooth'
        });

        // Ajuste para asegurarse de no pasar el inicio
        setTimeout(() => {
            if (container.scrollLeft < 0) {
                container.scrollTo({
                    left: 0,
                    behavior: 'smooth'
                });
            }
        }, 100);
    });

    // Botón "siguiente" 
    nextBtn.addEventListener('click', () => {
        container.scrollBy({
            left: scrollAmount(),
            behavior: 'smooth'
        });

        // Ajuste para asegurarse de no pasar el final
        setTimeout(() => {
            const maxScrollValue = maxScroll();
            if (container.scrollLeft >= maxScrollValue) {
                container.scrollTo({
                    left: maxScrollValue,
                    behavior: 'smooth'
                });
            }
        }, 100);
    });

    container.addEventListener('scroll', updateProgressBar);

    container.scrollLeft = 0;
    updateProgressBar(); 
}

