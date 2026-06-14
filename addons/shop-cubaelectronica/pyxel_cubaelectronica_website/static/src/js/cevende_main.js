/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

// Helper: llamada JSON-RPC a un endpoint type='json' de Odoo (sin dependencias)
async function cvJsonRpc(route, params) {
    const resp = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: params || {} }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.data && data.error.data.message || 'RPC error');
    return data.result;
}

// ══════════════════════════════════════════════════════════════════════
// AÑADIR AL CARRITO (AJAX) desde las tarjetas de producto
// Añade sin recargar, actualiza el contador del header y muestra un toast.
// ══════════════════════════════════════════════════════════════════════
publicWidget.registry.CevendeAddToCart = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click .cv-add-to-cart': '_onAddToCart',
    },

    async _onAddToCart(ev) {
        ev.preventDefault();
        const btn = ev.currentTarget;
        if (btn.classList.contains('is-loading')) return;

        const productId = parseInt(btn.dataset.productId);
        const qty = parseInt(btn.dataset.qty) || 1;
        if (!productId) return;

        btn.classList.add('is-loading');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"/>';

        try {
            await this._addToCart(productId, qty);
        } finally {
            btn.classList.remove('is-loading');
            btn.innerHTML = original;
        }
    },

    // Lógica común de añadido: post AJAX + contador + toast + señal al drawer.
    async _addToCart(productId, qty) {
        try {
            const data = await cvJsonRpc('/shop/cart/update_json', {
                product_id: productId,
                add_qty: qty,
                display: false,
            });
            this._updateCartCount(data.cart_quantity);
            this._toast('Producto añadido al carrito', 'ok');
            // Señal para el drawer (Fase 2): abrirlo si existe
            document.body.dispatchEvent(new CustomEvent('cv-cart-updated', { detail: data }));
        } catch (e) {
            this._toast('No se pudo añadir. Revisa el producto.', 'err');
        }
    },

    _updateCartCount(qty) {
        document.querySelectorAll('.my_cart_quantity').forEach(el => {
            el.textContent = qty;
            el.classList.remove('d-none');
            el.classList.add('cv-cart-bump');
            setTimeout(() => el.classList.remove('cv-cart-bump'), 350);
        });
    },

    _toast(msg, type) {
        let t = document.querySelector('.cv-toast');
        if (!t) {
            t = document.createElement('div');
            t.className = 'cv-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.className = 'cv-toast cv-toast--' + (type || 'ok') + ' is-visible';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { t.className = 'cv-toast'; }, 2600);
    },
});

// ══════════════════════════════════════════════════════════════════════
// CHECKOUT: Municipio dependiente de Provincia (Provincia → Municipio)
// Al cambiar la provincia, carga sus municipios (res.municipality) y los
// pone en el desplegable de municipio. Sólo seleccionar, sin texto libre.
// ══════════════════════════════════════════════════════════════════════
publicWidget.registry.CevendeCheckoutCities = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'change #cv_state': '_onStateChange',
    },

    async _onStateChange(ev) {
        const stateId = ev.target.value;
        const citySel = document.getElementById('cv_city');
        if (!citySel) return;
        if (!stateId) {
            citySel.innerHTML = '<option value="">Selecciona provincia primero...</option>';
            return;
        }
        citySel.innerHTML = '<option value="">Cargando...</option>';
        try {
            const cities = await cvJsonRpc('/cevende/municipalities', { state_id: parseInt(stateId) });
            citySel.innerHTML = '<option value="">Selecciona...</option>';
            const current = citySel.dataset.current;
            cities.forEach(c => {
                const o = document.createElement('option');
                o.value = c.id;
                o.textContent = c.name;
                if (current && String(current) === String(c.id)) o.selected = true;
                citySel.appendChild(o);
            });
        } catch (e) {
            citySel.innerHTML = '<option value="">No se pudieron cargar los municipios</option>';
        }
    },
});

// ══════════════════════════════════════════════════════════════════════
// CHECKOUT MAYORISTA: direcciones (facturación / entrega)
// - Muestra el formulario de "nueva dirección" al elegir esa opción.
// - Municipio dependiente de la provincia, por sección (facturación/entrega).
// ══════════════════════════════════════════════════════════════════════
publicWidget.registry.CevendeMayoristaAddr = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'change input[name="billing_id"]': '_onBillingToggle',
        'change input[name="delivery_id"]': '_onDeliveryToggle',
        'change .cv-addr-state': '_onStateChange',
        'change .cv-addr-country': '_onCountryChange',
    },

    _toggleForm(prefix, isNew) {
        const form = document.querySelector('.cv-addr-form[data-prefix="' + prefix + '"]');
        if (form) form.classList.toggle('is-open', !!isNew);
    },
    _onBillingToggle(ev) { this._toggleForm('billing', ev.target.classList.contains('cv-addr-newtoggle')); },
    _onDeliveryToggle(ev) { this._toggleForm('delivery', ev.target.classList.contains('cv-addr-newtoggle')); },

    async _onStateChange(ev) {
        const sel = ev.target;
        const prefix = sel.dataset.prefix;
        const citySel = document.querySelector('.cv-addr-city[data-prefix="' + prefix + '"]');
        if (!citySel) return;
        const stateId = sel.value;
        if (!stateId) {
            citySel.innerHTML = '<option value="">Selecciona provincia primero…</option>';
            return;
        }
        citySel.innerHTML = '<option value="">Cargando…</option>';
        try {
            const cities = await cvJsonRpc('/cevende/municipalities', { state_id: parseInt(stateId) });
            citySel.innerHTML = '<option value="">Selecciona…</option>';
            cities.forEach(c => {
                const o = document.createElement('option');
                o.value = c.id; o.textContent = c.name;
                citySel.appendChild(o);
            });
        } catch (e) {
            citySel.innerHTML = '<option value="">No se pudieron cargar los municipios</option>';
        }
    },

    // Facturación internacional: País → Estado/Provincia (desplegable dependiente).
    async _onCountryChange(ev) {
        const sel = ev.target;
        const prefix = sel.dataset.prefix;
        const stateSel = document.querySelector('.cv-addr-istate[data-prefix="' + prefix + '"]');
        if (!stateSel) return;
        const countryId = sel.value;
        if (!countryId) {
            stateSel.innerHTML = '<option value="">Selecciona país primero…</option>';
            return;
        }
        stateSel.innerHTML = '<option value="">Cargando…</option>';
        try {
            const states = await cvJsonRpc('/cevende/country_states', { country_id: parseInt(countryId) });
            if (states.length) {
                stateSel.innerHTML = '<option value="">Selecciona…</option>';
                states.forEach(s => {
                    const o = document.createElement('option');
                    o.value = s.id; o.textContent = s.name;
                    stateSel.appendChild(o);
                });
            } else {
                stateSel.innerHTML = '<option value="">(Sin estados; indica la ciudad)</option>';
            }
        } catch (e) {
            stateSel.innerHTML = '<option value="">No se pudieron cargar los estados</option>';
        }
    },
});

// ══════════════════════════════════════════════════════════════════════
// DRAWER LATERAL DEL CARRITO (Fase 2)
// ══════════════════════════════════════════════════════════════════════
function cvMoney(n, sym) {
    return (sym || '$') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

publicWidget.registry.CevendeCartDrawer = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click .o_wsale_my_cart': '_onCartIconClick',
        'click #cvCartClose': '_close',
        'click #cvCartOverlay': '_close',
        'click #cvCartContinue': '_close',
        'click .cv-cart-line__inc': '_onInc',
        'click .cv-cart-line__dec': '_onDec',
        'click .cv-cart-line__remove': '_onRemove',
    },

    start() {
        this.drawer = document.getElementById('cvCartDrawer');
        this.overlay = document.getElementById('cvCartOverlay');
        this._currency = '$';
        // Abrir el drawer cuando se añade un producto desde una tarjeta
        document.body.addEventListener('cv-cart-updated', () => this.open());
        return this._super(...arguments);
    },

    _onCartIconClick(ev) {
        ev.preventDefault();   // no navegar a /shop/cart, abrir el drawer
        this.open();
    },

    open() {
        if (!this.drawer) return;
        this.drawer.classList.add('is-open');
        this.overlay.classList.add('is-open');
        this.drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        this._load();
    },

    _close() {
        if (!this.drawer) return;
        this.drawer.classList.remove('is-open');
        this.overlay.classList.remove('is-open');
        this.drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    },

    async _load() {
        const body = document.getElementById('cvCartBody');
        body.innerHTML = '<div class="cv-cart-drawer__loading"><i class="fa fa-spinner fa-spin"/></div>';
        try {
            const data = await cvJsonRpc('/cevende/cart/data', {});
            this._currency = data.currency || '$';
            this._render(data);
        } catch (e) {
            body.innerHTML = '<p class="cv-cart-drawer__empty">No se pudo cargar el carrito.</p>';
        }
    },

    _render(data) {
        const body = document.getElementById('cvCartBody');
        const foot = document.getElementById('cvCartFoot');
        document.getElementById('cvCartCount').textContent = data.quantity || 0;
        if (!data.lines || !data.lines.length) {
            body.innerHTML = '<div class="cv-cart-drawer__empty">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="54" height="54"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>' +
                '<p>Tu carrito está vacío</p></div>';
            foot.style.display = 'none';
            return;
        }
        foot.style.display = '';
        body.innerHTML = data.lines.map(l =>
            '<div class="cv-cart-line" data-line-id="' + l.line_id + '" data-product-id="' + l.product_id + '">' +
              '<a href="' + l.url + '" class="cv-cart-line__img"><img src="' + l.image + '" alt=""/></a>' +
              '<div class="cv-cart-line__info">' +
                '<a href="' + l.url + '" class="cv-cart-line__name">' + l.name + '</a>' +
                '<div class="cv-cart-line__price">' + cvMoney(l.price, this._currency) + '</div>' +
                '<div class="cv-cart-line__qty">' +
                  '<button type="button" class="cv-cart-line__dec" aria-label="Quitar uno">−</button>' +
                  '<span class="cv-cart-line__num">' + l.qty + '</span>' +
                  '<button type="button" class="cv-cart-line__inc" aria-label="Añadir uno">+</button>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="cv-cart-line__remove" aria-label="Eliminar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>' +
              '</button>' +
            '</div>'
        ).join('');
        document.getElementById('cvCartTotal').textContent = cvMoney(data.amount, this._currency);
    },

    async _setQty(lineEl, newQty) {
        const lineId = parseInt(lineEl.dataset.lineId);
        const productId = parseInt(lineEl.dataset.productId);
        try {
            const data = await cvJsonRpc('/shop/cart/update_json', {
                line_id: lineId, product_id: productId, set_qty: newQty,
            });
            this._updateHeaderCount(data.cart_quantity);
            this._load();
        } catch (e) { /* noop */ }
    },

    _onInc(ev) {
        const line = ev.currentTarget.closest('.cv-cart-line');
        const n = parseInt(line.querySelector('.cv-cart-line__num').textContent) || 0;
        this._setQty(line, n + 1);
    },
    _onDec(ev) {
        const line = ev.currentTarget.closest('.cv-cart-line');
        const n = parseInt(line.querySelector('.cv-cart-line__num').textContent) || 0;
        if (n > 1) this._setQty(line, n - 1);
        else this._setQty(line, 0);
    },
    _onRemove(ev) {
        const line = ev.currentTarget.closest('.cv-cart-line');
        this._setQty(line, 0);
    },

    _updateHeaderCount(qty) {
        document.querySelectorAll('.my_cart_quantity').forEach(el => {
            el.textContent = qty;
            if (qty > 0) el.classList.remove('d-none');
        });
    },
});

// ══════════════════════════════════════════════════════════════════════
// CALCULADORA SOLAR
// Consumo mensual (kWh) → paneles recomendados + ahorro anual estimado.
// ══════════════════════════════════════════════════════════════════════
publicWidget.registry.CevendeSolarCalculator = publicWidget.Widget.extend({
    selector: '.cv-solar',
    events: {
        'click .cv-solar__calc': '_onCalculate',
    },

    // Constantes del negocio
    PANEL_WATTS: 550,       // W por panel
    SUN_HOURS: 5,           // horas pico de sol/día (Cuba)
    KWH_PRICE_USD: 0.30,    // precio estimado del kWh

    _onCalculate(ev) {
        ev.preventDefault();
        const input = this.el.querySelector('.cv-solar__consumo');
        const monthlyKwh = parseFloat(input && input.value) || 0;
        if (!monthlyKwh) return;

        const dailyKwh = monthlyKwh / 30;
        const panels = Math.ceil(dailyKwh / (this.PANEL_WATTS / 1000 * this.SUN_HOURS));
        const annualSaving = Math.round(monthlyKwh * 12 * this.KWH_PRICE_USD);

        const consumoOut = this.el.querySelector('.cv-solar__consumo-out');
        const panelsOut = this.el.querySelector('.cv-solar__panels-out');
        const savingOut = this.el.querySelector('.cv-solar__saving-out');

        if (consumoOut) consumoOut.textContent = monthlyKwh + ' kWh';
        if (panelsOut) panelsOut.textContent = panels + ' unidades';
        if (savingOut) savingOut.textContent = annualSaving.toLocaleString('en-US') + ' USD';
    },
});

// ══════════════════════════════════════════════════════════════════════
// COMPRA RÁPIDA MAYORISTA — tabs SKU / CSV
// ══════════════════════════════════════════════════════════════════════
publicWidget.registry.CevendeWholesaleTabs = publicWidget.Widget.extend({
    selector: '#cvWbQuick',
    events: {
        'click .cv-wb-tab': '_onTab',
    },

    _onTab(ev) {
        const tab = ev.currentTarget;
        const target = tab.getAttribute('data-wbtab');

        this.el.querySelectorAll('.cv-wb-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');

        this.el.querySelectorAll('[data-wbpanel]').forEach(panel => {
            panel.style.display = panel.getAttribute('data-wbpanel') === target ? '' : 'none';
        });
    },
});
