/** @odoo-module **/
import publicWidget from '@web/legacy/js/public/public_widget';
import { jsonrpc } from '@web/core/network/rpc_service';

publicWidget.registry.DynamicCities = publicWidget.Widget.extend({
    selector: 'form.o_portal_details',
    events: {
        'change #custom_state_id': '_onStateChange',
    },

    start: function () {
        this._super.apply(this, arguments);
        this._setupInitialCity();
        return this;
    },

    _setupInitialCity: function () {
        const citySelect = this.el.querySelector('#city');
        if (!citySelect) return;

        const selectedState = this.el.querySelector('#custom_state_id').value;
        if (selectedState) {
            this._loadCities(selectedState).then(() => {
                // Restore selected city by name
                const initialCity = citySelect.dataset.initialCity;
                if (initialCity) {
                    citySelect.value = initialCity;
                }
            });
        }
    },

    _onStateChange: function (ev) {
        const stateId = ev.target.value;
        this._loadCities(stateId);
    },

    _loadCities: function (stateId) {
        const citySelect = this.el.querySelector('#city');
        if (!citySelect) return Promise.resolve();

        citySelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione municipio...';
        citySelect.appendChild(defaultOption);

        if (!stateId) return Promise.resolve();

        return jsonrpc('/get_cities', {
            state_id: stateId,
        }).then((data) => {
            data.cities.forEach((city) => {
                const option = document.createElement('option');
                option.value = city.id; // Ahora es el nombre
                option.textContent = city.name;
                citySelect.appendChild(option);
            });
        });
    },
});