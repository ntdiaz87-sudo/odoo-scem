/** @odoo-module **/

import { WebsiteSale } from '@website_sale/js/website_sale';

WebsiteSale.include({
    events: Object.assign({}, WebsiteSale.prototype.events, {
        'change select[name="state_id"]': '_changeStateAddress',
        'change select[name="municipality_id"]': '_onCityChange',
    }),

    /**
    * Method that displays the confirmation message when submitting the order_details form.
    */
    showConfirmationToast: function(event) {
        event.preventDefault(); 
        
        var toast = document.getElementById("confirmationToast");
        toast.style.display = "block";
        
        setTimeout(() => {
            toast.style.display = "none";
            event.target.submit();
        }, 4000);
        },
        
        // start: function() {
        //     this._super(...arguments);
        
        //     const form = document.querySelector('form[action="/notes_form"]');
        //     if (form) {
        //         form.onsubmit = this.showConfirmationToast.bind(this);
        //     }
        // },   

        start: function () {
            this._super(...arguments);

            const form = document.querySelector('form[action="/notes_form"]');
            if (form) {
                form.onsubmit = this.showConfirmationToast.bind(this);
            }

            // === INICIALIZAR CIUDADES EN FACTURACIÓN CUANDO YA HAY PAÍS ===
            const countrySelect = document.querySelector('#country_id');
            const modeTypeInput = document.querySelector('#mode_address_type');

            if (countrySelect && modeTypeInput && modeTypeInput.value === 'billing' && countrySelect.value) {
                // Esto hará la llamada a /shop/country_infos/<country_id> y rellenará states + cities
                this._changeCountry();
            }
        }, 
    
    _changeStateAddress: function () {
        var mode_address_action = $("input[id='mode_address_action']").val();
        var mode_address_type = $("input[id='mode_address_type']").val();
        
        if (mode_address_type == "shipping") {
            return;
        }
        
        var selectStates = $("select[name='state_id']");
        var selectcities = $("select[name='municipality_id']");
        
        selectcities.find("option").filter('[state-id!="' + selectStates.val() + '"]').hide();
        var options = selectcities.find("option").filter('[state-id="' + selectStates.val() + '"]');
        options.show();
        
        if (options.length > 0) {
            selectcities.val(options[0].value).change();
        }
    },

    _onCityChange: function () {
        var selectCity = $("select[name='municipality_id']");
        var cityValue = selectCity.find('option:selected').text(); 
        var cityInput = $("input[name='city']");

        if (cityInput.is(':hidden')) {
            cityInput.val(cityValue);
        }
    },

   
    _changeCountry: function () {
        const $country = $("#country_id");
        if (!$country.val()) {
            return;
        }

        const modeType = $("#mode_address_type").val() || "";
        const countryCode = $country.find(":selected").data("country-code") || "";

        // NO tocamos la dirección de envío: la gestionas con tu modal
        if (modeType === "shipping") {
            return;
        }

        return this.rpc("/shop/country_infos/" + $country.val(), {
            mode: $country.attr("mode"),
        }).then(function (data) {
            // ===== MODIFICACIÓN: Solo modificar teléfono si NO está instalado el módulo =====
            const $phoneInput = $("input[name='phone']");
            const currentPhoneValue = $phoneInput.val();

            // Verificar si el módulo importadora NO está instalado
            const shouldAutoFormatPhone = !window.pyxelImportInstalled;

            if (countryCode === "CU") {
                if (shouldAutoFormatPhone) {
                    // Comportamiento original: añadir prefijo 53 automáticamente
                    $phoneInput.attr("placeholder", "+53");
                    if (currentPhoneValue && !currentPhoneValue.startsWith('53') && !currentPhoneValue.startsWith('+53')) {
                        $phoneInput.val('53' + currentPhoneValue);
                    }
                } else {
                    // Módulo instalado: NO modificar el teléfono automáticamente
                    $phoneInput.attr("placeholder", "Número de teléfono");
                    // Si el teléfono tiene prefijo, lo dejamos como está
                    // No añadimos nada automáticamente
                }
            } else {
                $phoneInput.attr("placeholder", data.phone_code !== 0 ? "+" + data.phone_code : "");
                if (shouldAutoFormatPhone && currentPhoneValue && currentPhoneValue.startsWith('53')) {
                    $phoneInput.val(currentPhoneValue.replace(/^53/, ''));
                }
            }

            // ===== Provincias (state_id) - resto del código igual =====
            const $selectStates = $("select[name='state_id']");
            if ($selectStates.data("init") === 0 || $selectStates.find("option").length === 1) {
                if (data.states.length || data.state_required) {
                    $selectStates.empty();
                    data.states.forEach(function (x) {
                        const opt = $("<option>")
                            .text(x[1])
                            .attr("value", x[0])
                            .attr("data-code", x[2]);
                        $selectStates.append(opt);
                    });
                    $selectStates.parent("div").show();
                } else {
                    $selectStates.val("").parent("div").hide();
                }
                $selectStates.data("init", 0);
            } else {
                $selectStates.data("init", 0);
            }

            // ===== Municipios =====
            const $cityDivSelect = $(".div_city_select");
            const $cityDivInput  = $(".div_city");
            const $selectCities  = $("select[name='municipality_id']");

            const isBillingCuba = (modeType === "billing" && countryCode === "CU");
            const cityRequired  = data.city_required || isBillingCuba;

            if (cityRequired) {
                $cityDivSelect.removeClass("d-none");
                $cityDivInput.addClass("d-none");

                if ($selectCities.data("init") === 0 || $selectCities.find("option").length <= 1) {
                    $selectCities.empty();
                    $selectCities.append(
                        $("<option>").attr("value", "").text("Municipio...")
                    );

                    if (data.cities && data.cities.length) {
                        data.cities.forEach(function (x) {
                            const opt = $("<option>")
                                .text(x[1])
                                .attr("value", x[0])
                                .attr("data-code", x[2])
                                .attr("state-id", x[3]);
                            $selectCities.append(opt);
                        });
                    }

                    $selectCities.data("init", 0);
                } else {
                    $selectCities.data("init", 0);
                }

                const stateVal = $selectStates.val();
                if (!stateVal) {
                    $selectCities.find("option").not('[value=""]').hide();
                    $selectCities.val("");
                } else {
                    $selectCities
                        .find("option")
                        .filter('[state-id!="' + stateVal + '"]')
                        .hide();

                    const $options = $selectCities
                        .find("option")
                        .filter('[state-id="' + stateVal + '"]');

                    $options.show();

                    if ($options.length > 0) {
                        $selectCities.val($options[0].value).change();
                    }
                }
            } else {
                $cityDivSelect.addClass("d-none");
                $cityDivInput.removeClass("d-none");
            }

            // ===== Labels ZIP y Provincia =====
            const $zipLabel = $("label[for='zip']");
            if ($zipLabel.length) {
                $zipLabel.toggleClass("label-optional", !data.zip_required);
                $zipLabel.get(0).toggleAttribute("required", !!data.zip_required);
            }

            const $stateLabel = $("label[for='state_id']");
            if ($stateLabel.length) {
                $stateLabel.toggleClass("label-optional", !data.state_required);
                $stateLabel.get(0).toggleAttribute("required", !!data.state_required);
            }
        });
    },


});

