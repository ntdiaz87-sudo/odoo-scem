/** @odoo-module **/

import publicWidget from '@web/legacy/js/public/public_widget';

publicWidget.registry.AboutUsMenu = publicWidget.Widget.extend({
    selector: '.about-us-menu',
    events: {
        'click #next-slide': '_onNextSlide',
        'click #prev-slide': '_onPrevSlide',
        'click .menu-items li': '_onMenuItemClick',
    },

    start() {
        this.$menuItems   = this.$('.menu-items');
        this.$items       = this.$('.menu-items li');
        this.$wrapper     = this.$('.menu-wrapper');
        this.currentIndex = 0;

        this._updateDimensions();
        $(window).on('resize', this._updateDimensions.bind(this));
        this._updateArrows();

        this._activateFromHash();
        $(window).on('hashchange', this._activateFromHash.bind(this));

        $('body').on('click', '.footer-column.footer-js a', (ev) => {
            ev.preventDefault();
            const frag = ev.currentTarget.getAttribute('href').split('#')[1];
            history.replaceState(null, null, '#' + frag);
            this._activateFromHash();
        });

        return this._super(...arguments);
    },

    _updateDimensions() {
        this.itemWidth = this.$items.outerWidth(true);
        const wrapperWidth = this.$wrapper.width();
        this.visibleItems = Math.floor(wrapperWidth / this.itemWidth);
        this.visibleItems = Math.max(1, Math.min(this.visibleItems, this.$items.length));
        this.maxIndex = this.$items.length - this.visibleItems;
        this.currentIndex = Math.min(Math.max(0, this.currentIndex), this.maxIndex);
        this._slideMenu();
    },

    _onNextSlide() {
        if (this.currentIndex < this.maxIndex) {
            this.currentIndex++;
            this._slideMenu();
        }
    },

    _onPrevSlide() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._slideMenu();
        }
    },

    _slideMenu() {
        const translateX = -this.currentIndex * this.itemWidth;
        this.$menuItems.css('transform', `translateX(${translateX}px)`);
        this._updateArrows();
    },

    _updateArrows() {
        this.$('#prev-slide').css('opacity', this.currentIndex === 0 ? 0.5 : 1);
        this.$('#next-slide').css('opacity', this.currentIndex >= this.maxIndex ? 0.5 : 1);
    },

    _onMenuItemClick(ev) {
        const $li = $(ev.currentTarget);
        this.$items.removeClass('active');
        $li.addClass('active');

        const section = $li.data('section');
        this.$el.closest('.about-seric').find('.about-us-content > div').removeClass('active');
        this.$el.closest('.about-seric').find(`.about-us-content .${section}`).addClass('active');
        history.replaceState(null, null, '#' + section);
    },

    _activateFromHash() {
        const sec = window.location.hash.replace('#', '');
        if (!sec) { return; }

        const parentMap = {
            conditions: 'terms',  web_use: 'terms', priv: 'terms', delivery: 'terms',
            tracking: 'help',     time: 'help',     tarifa: 'help',   contact: 'help',
        };

        let $li = this.$items.filter((_, li) => $(li).data('section') === sec);
        let isSubsection = false;

        if (!$li.length && parentMap[sec]) {
            $li = this.$items.filter((_, li) => $(li).data('section') === parentMap[sec]);
            isSubsection = true;
        }

        if ($li.length) {
            this._onMenuItemClick({ currentTarget: $li.get(0) });
            const idx = this.$items.index($li);
            this.currentIndex = Math.min(Math.max(0, idx), this.maxIndex);
            this._slideMenu();

            if (isSubsection) {
                const target = document.getElementById(sec);
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
                }
            }
        }
    },
});

export default publicWidget.registry.AboutUsMenu;
