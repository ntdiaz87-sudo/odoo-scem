/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

// ── H1 Override ────────────────────────────────────────────────────────────
// window._seoH1Text se inyecta server-side desde seo_website_layout_extension.xml
// Solo se ejecuta si el backend definió un H1 personalizado para este record.
(function () {
    function applyH1Override() {
        var customH1 = window._seoH1Text;
        if (!customH1) return;
        var h1 = document.querySelector('h1');
        if (h1) {
            h1.textContent = customH1;
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyH1Override);
    } else {
        applyH1Override();
    }
})();

// ── Frontend SEO Validator widget ──────────────────────────────────────────
publicWidget.registry.SeoFrontendValidator = publicWidget.Widget.extend({
    selector: '.o_seo_meta_form',
    events: {
        'input input.seo-title-input': '_onTitleInput',
        'input textarea.seo-description-input': '_onDescriptionInput',
    },

    start() {
        this._initValidation();
        return this._super(...arguments);
    },

    _initValidation() {
        this.$titleInput = this.$el.find('.seo-title-input');
        this.$descriptionInput = this.$el.find('.seo-description-input');
        if (this.$titleInput.length) {
            this._validateTitle(this.$titleInput.val());
        }
        if (this.$descriptionInput.length) {
            this._validateDescription(this.$descriptionInput.val());
        }
    },

    _onTitleInput(event) {
        this._validateTitle(event.target.value);
    },

    _onDescriptionInput(event) {
        this._validateDescription(event.target.value);
    },

    _validateTitle(value) {
        const length = value ? value.length : 0;
        let message, className;
        if (length === 0) {
            message = 'Ingrese un título (se recomienda de 50 a 60 caracteres)';
            className = 'text-muted';
        } else if (length < 50) {
            message = `Título corto: ${length} caracteres (recomendado 50-60)`;
            className = 'text-warning';
        } else if (length > 60) {
            message = `Título largo: ${length} caracteres (recomendado 50-60)`;
            className = 'text-warning';
        } else {
            message = `Longitud perfecta: ${length} caracteres`;
            className = 'text-success';
        }
        this._setFeedback('seo-title-feedback', '.seo-title-input', message, className);
    },

    _validateDescription(value) {
        const length = value ? value.length : 0;
        let message, className;
        if (length === 0) {
            message = 'Ingrese una meta descripción (se recomienda entre 50 y 160 caracteres)';
            className = 'text-muted';
        } else if (length < 50) {
            message = `Descripción corta: ${length} caracteres (mínimo 50)`;
            className = 'text-warning';
        } else if (length > 160) {
            message = `Descripción larga: ${length} caracteres (máximo 160)`;
            className = 'text-danger';
        } else if (length >= 120) {
            message = `Longitud excelente: ${length} caracteres`;
            className = 'text-success';
        } else {
            message = `Buena longitud: ${length} caracteres (óptimo 120-160)`;
            className = 'text-info';
        }
        this._setFeedback('seo-description-feedback', '.seo-description-input', message, className);
    },

    _setFeedback(feedbackClass, inputSelector, message, className) {
        let $feedback = this.$el.find(`.${feedbackClass}`);
        if (!$feedback.length) {
            $feedback = $(`<div class="${feedbackClass} small mt-1"></div>`);
            this.$el.find(inputSelector).after($feedback);
        }
        $feedback.html(`<span class="${className}">${message}</span>`);
    },
});