/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

// Orden canónico de los pasos
const STEPS = ['cart', 'address', 'payment', 'confirmation'];

// Mapa URL → paso (incluyendo tu ruta order_request)
const URL_STEP_MAP = [
    { pattern: /\/shop\/cart/,                      step: 'cart'         },
    { pattern: /\/shop\/(checkout|address)/,        step: 'address'      },
    { pattern: /\/shop\/payment/,                   step: 'payment'      },
    { pattern: /\/shop\/order_request/,             step: 'payment'      },
    { pattern: /\/set_delivery_address/,            step: 'address'      },
    { pattern: /\/shop\/(confirmation|confirm_order)/, step: 'confirmation' },
];

// URLs de navegación para cada paso
const STEP_URLS = {
    'cart': '/shop/cart',
    'address': '/shop/checkout',
    'payment': '/shop/payment',  // Para order_request se maneja aparte
    'confirmation': '/shop/confirmation',
};

publicWidget.registry.checkoutProgressBar = publicWidget.Widget.extend({
    selector: '.o_wsale_checkout_progress_bar',
    events: {
        'click .cpb-step.completed .cpb-step-inner': '_onCompletedStepClick',
    },

    // ── Inicialización ──────────────────────────────────────────
    init() {
        this._super(...arguments);
        this.currentStep = this._detectCurrentStep();
    },

    start() {
        this._updateProgressBar();
        this._updateTrackFill();
        this._fixStepLinks();  // ← Corregir los href de los pasos
        return this._super(...arguments);
    },

    // ── Corrige los href de los pasos según el paso actual ──────
    _fixStepLinks() {
        const currentIndex = STEPS.indexOf(this.currentStep);

        this.el.querySelectorAll('.cpb-step').forEach((stepEl, index) => {
            const step = stepEl.dataset.step;
            const link = stepEl.querySelector('.cpb-step-inner');
            if (!link) return;

            // Si el paso es anterior al actual o está completado, habilitar el enlace
            if (index < currentIndex) {
                link.href = STEP_URLS[step] || '#';
                link.style.cursor = 'pointer';
                link.style.pointerEvents = 'auto';
            }
            // Si es el paso de pago pero estamos en order_request, mantener comportamiento
            else if (step === 'payment' && window.location.pathname.includes('/shop/order_request')) {
                link.href = '#';
                link.style.cursor = 'default';
            }
            // Pasos futuros: deshabilitados
            else if (index > currentIndex) {
                link.href = '#';
                link.style.cursor = 'default';
                link.style.pointerEvents = 'none';
            }
            // Paso actual: sin enlace
            else {
                link.href = '#';
                link.style.cursor = 'default';
            }
        });
    },

    // ── Maneja clic en pasos completados ────────────────────────
    _onCompletedStepClick(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');

        // Prevenir si es # o está vacío
        if (!href || href === '#') {
            event.preventDefault();
            return;
        }

        // Si estamos en order_request y el usuario quiere ir a address, permitir
        // La navegación normal ocurrirá
    },

    // ── Detección del paso según la URL actual ──────────────────
    _detectCurrentStep() {
        const path = window.location.pathname;
        for (const { pattern, step } of URL_STEP_MAP) {
            if (pattern.test(path)) return step;
        }
        return 'cart';
    },

    // ── Actualiza clases CSS de cada step ───────────────────────
    _updateProgressBar() {
        const currentIndex = STEPS.indexOf(this.currentStep);

        this.el.querySelectorAll('.cpb-step').forEach((stepEl) => {
            const step      = stepEl.dataset.step;
            const stepIndex = STEPS.indexOf(step);

            stepEl.classList.remove('active', 'completed');

            if (step === this.currentStep) {
                stepEl.classList.add('active');
            } else if (stepIndex < currentIndex) {
                stepEl.classList.add('completed');
            }
        });
    },

    // ── Anima la línea de progreso con width dinámico ────────────
    _updateTrackFill() {
        const fill = this.el.querySelector('#cpb_track_fill');
        if (!fill) return;

        const currentIndex = STEPS.indexOf(this.currentStep);
        const total        = STEPS.length - 1;

        // Porcentaje: 0 en el 1er paso, 100 en el último
        const pct = total > 0 ? (currentIndex / total) * 100 : 0;

        requestAnimationFrame(() => {
            fill.style.width = pct + '%';
        });
    },
});

export default publicWidget;