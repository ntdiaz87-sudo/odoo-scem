/** @odoo-module **/

if (document.readyState !== 'loading') {
    initProductCarousels();
} else {
    document.addEventListener('DOMContentLoaded', initProductCarousels);
}

function initProductCarousels() {
    setupProductCarousel({
        containerSelector: '.some-products-container:not(.best-sellers-products-container):not(.suggestions-products-container)',
        nextSelector: '#some-products-next-btn',
        prevSelector: '#some-products-prev-btn',
        progressBarSelector: '.some-products-line-progress:not(.best-sellers-line-progress):not(.suggestions-line-progress)',
        progressContainerSelector: '.some-products-progress:not(.best-sellers-progress):not(.suggestions-progress)',
    });

    setupProductCarousel({
        containerSelector: '.best-sellers-products-container',
        nextSelector: '#best-sellers-next-btn',
        prevSelector: '#best-sellers-prev-btn',
        progressBarSelector: '.best-sellers-line-progress',
        progressContainerSelector: '.best-sellers-progress',
    });

    setupProductCarousel({
        containerSelector: '.suggestions-products-container',
        nextSelector: '#suggestions-next-btn',
        prevSelector: '#suggestions-prev-btn',
        progressBarSelector: '.suggestions-line-progress',
        progressContainerSelector: '.suggestions-progress',
    });
}

function setupProductCarousel({
    containerSelector,
    nextSelector,
    prevSelector,
    progressBarSelector,
    progressContainerSelector,
}) {
    const container = document.querySelector(containerSelector);
    const nextBtn = document.querySelector(nextSelector);
    const prevBtn = document.querySelector(prevSelector);
    const progressBar = document.querySelector(progressBarSelector);
    const progressContainer = document.querySelector(progressContainerSelector);

    if (!container || !nextBtn || !prevBtn || !progressBar || !progressContainer) {
        return;
    }

    const cards = container.querySelectorAll('.home-product-card');

    if (!cards.length) {
        return;
    }

    const getGap = () => {
        const styles = window.getComputedStyle(container);
        return parseFloat(styles.gap || styles.columnGap || 15) || 15;
    };

    const maxScroll = () => {
        return Math.max(0, container.scrollWidth - container.clientWidth);
    };

    const calculateScrollAmount = () => {
        const cardWidth = cards[0].offsetWidth;
        const gap = getGap();

        if (window.innerWidth <= 430) {
            return cardWidth + gap;
        }

        let visibleCards = 5;

        if (window.innerWidth <= 768) {
            visibleCards = 2;
        } else if (window.innerWidth <= 991) {
            visibleCards = 3;
        } else if (window.innerWidth <= 1201) {
            visibleCards = 4;
        }

        return cardWidth * visibleCards + gap * (visibleCards - 1);
    };

    const updateProgressBar = () => {
        const maxScrollValue = maxScroll();
        const scrollPosition = container.scrollLeft;

        const progressContainerWidth = progressContainer.offsetWidth;
        const progressBarWidth = progressBar.offsetWidth;
        const progressBarMaxTranslate = progressContainerWidth - progressBarWidth;

        let progressFraction = maxScrollValue > 0 ? scrollPosition / maxScrollValue : 0;
        progressFraction = Math.min(1, Math.max(0, progressFraction));

        const translateX = progressFraction * progressBarMaxTranslate;
        progressBar.style.transform = `translateX(${translateX}px)`;
    };

    nextBtn.addEventListener('click', () => {
        const scrollAmount = calculateScrollAmount();
        const maxScrollValue = maxScroll();

        let nextPosition = container.scrollLeft + scrollAmount;

        if (nextPosition >= maxScrollValue - 2) {
            nextPosition = 0;
        }

        container.scrollTo({
            left: nextPosition,
            behavior: 'smooth',
        });
    });

    prevBtn.addEventListener('click', () => {
        const scrollAmount = calculateScrollAmount();
        const maxScrollValue = maxScroll();

        let nextPosition = container.scrollLeft - scrollAmount;

        if (nextPosition <= 2) {
            nextPosition = maxScrollValue;
        }

        container.scrollTo({
            left: nextPosition,
            behavior: 'smooth',
        });
    });

    container.addEventListener('scroll', updateProgressBar);

    window.addEventListener('resize', () => {
        updateProgressBar();
    });

    container.scrollLeft = 0;
    updateProgressBar();
}