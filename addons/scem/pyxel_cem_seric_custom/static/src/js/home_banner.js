/** @odoo-module **/

if (document.readyState !== 'loading') {
    initBannerCarousel();
} else {
    document.addEventListener('DOMContentLoaded', initBannerCarousel);
}

function initBannerCarousel() {
    const bannerContainer = document.getElementById('banner-container');
    const prevBtn = document.getElementById('banner-prev');
    const nextBtn = document.getElementById('banner-next');
    const bannerTitle = document.getElementById('banner-title');
    const bannerCategory = document.getElementById('banner-category');
    const bannerDescription = document.getElementById('banner-description');
    const bannerButton = document.getElementById('banner-button');
    const progressBar = document.querySelector('.banner-line-progress');
    const progressContainer = document.querySelector('.banner-progress');

    if (
        !bannerContainer ||
        !prevBtn ||
        !nextBtn ||
        !bannerTitle ||
        !bannerCategory ||
        !bannerDescription ||
        !bannerButton ||
        !progressBar ||
        !progressContainer
    ) {
        return;
    }

    const slides = window.bannerSlides || [];

    console.log('Slides:', slides);
    console.log('Número de slides:', slides.length);

    if (!slides.length) {
        return;
    }

    let currentSlide = 0;
    let autoplayInterval = null;

    const updateProgress = () => {
        if (slides.length <= 1) {
            progressBar.style.transform = 'translateX(0px)';
            return;
        }

        const containerWidth = progressContainer.offsetWidth;
        const progressBarMaxTranslate = containerWidth - progressBar.offsetWidth;
        const step = progressBarMaxTranslate / (slides.length - 1);
        const translateX = currentSlide * step;

        progressBar.style.transform = `translateX(${translateX}px)`;
    };

    const updateBanner = () => {
        console.log('Current Slide:', currentSlide);

        const slide = slides[currentSlide];

        bannerContainer.classList.add('banner-fade');
        bannerTitle.classList.add('banner-fade');
        bannerCategory.classList.add('banner-fade');
        bannerDescription.classList.add('banner-fade');
        bannerButton.classList.add('banner-fade');

        setTimeout(() => {
            bannerContainer.style.backgroundImage = slide.image
                ? `url("${slide.image}")`
                : 'none';

            bannerTitle.textContent = slide.title || '';
            bannerCategory.textContent = slide.category || '';
            bannerDescription.textContent = slide.description || '';
            bannerButton.href = slide.url || '#';

            bannerContainer.classList.remove('banner-fade');
            bannerTitle.classList.remove('banner-fade');
            bannerCategory.classList.remove('banner-fade');
            bannerDescription.classList.remove('banner-fade');
            bannerButton.classList.remove('banner-fade');

            updateProgress();
        }, 600);
    };

    const goToPrevSlide = () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateBanner();
    };

    const goToNextSlide = () => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateBanner();
    };

    prevBtn.addEventListener('click', goToPrevSlide);
    nextBtn.addEventListener('click', goToNextSlide);

    if (slides.length > 1) {
        autoplayInterval = setInterval(goToNextSlide, 5000);
    }

    window.addEventListener('resize', updateProgress);

    updateBanner();
}