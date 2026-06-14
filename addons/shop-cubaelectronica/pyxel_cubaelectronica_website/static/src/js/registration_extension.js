/** @odoo-module */
import publicWidget from '@web/legacy/js/public/public_widget';

const EMAIL_REGEX = /^[a-z][a-z0-9]*(\.[a-z0-9]+)*@[a-z0-9]+\.[a-z]+$/;

// Extender el widget original de registro
publicWidget.registry.RegistrationForm.include({

    start: function () {
        console.log('Pyxel Cubaelectronica - RegistrationForm extension loaded');

        const result = this._super.apply(this, arguments);

        this._initDocumentosEspecificos();
        this._initReeupVisibility();
        this._setDefaultUserType();

        // Forzar actualización de la barra de progreso
        setTimeout(() => {
            this._syncProgressBar();
        }, 200);

        return result;
    },

    _syncProgressBar: function() {
        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        if (userType === 'juridico' && !isJuridicoWithModule) {
            const step2 = document.getElementById('step-2');
            const step3 = document.getElementById('step-3');
            const step4 = document.getElementById('step-4');
            const step5 = document.getElementById('step-5');
            const step6 = document.getElementById('step-6');

            if (step2) step2.style.display = '';
            if (step3) step3.style.display = this.isBankAccountsStepVisible ? '' : 'none';
            if (step4) {
                step4.style.display = '';
                const step4Name = step4.querySelector('.step-name');
                if (step4Name) step4Name.textContent = 'Documentación';
            }
            if (step5) {
                step5.style.display = '';
                const step5Name = step5.querySelector('.step-name');
                if (step5Name) step5Name.textContent = 'Representante';
            }
            if (step6) {
                step6.style.display = '';
                const step6Name = step6.querySelector('.step-name');
                if (step6Name) step6Name.textContent = 'Seguridad';
            }

            const step7 = document.getElementById('step-7');
            if (step7) {
                step7.style.display = '';
                const step7Name = step7.querySelector('.step-name');
                if (step7Name) step7Name.textContent = 'Final';
            }
        }

        this.updateProgress(userType);
    },

    _setDefaultUserType: function() {
        const juridicoRadio = document.querySelector('input[name="user_type"][value="juridico"]');
        if (juridicoRadio) {
            juridicoRadio.checked = true;
            console.log('✅ Tipo de usuario establecido como jurídico por defecto');
        }

        if (this.currentStep === 1) {
            this.currentStep = 2;
            const step1 = document.getElementById('step1');
            const step2Juridico = document.getElementById('step2_juridico');

            if (step1) step1.style.display = 'none';
            if (step2Juridico) step2Juridico.style.display = 'block';

            const step2Comun = document.getElementById('step2_comun');
            const step3Juridico = document.getElementById('step3_juridico');
            const step5Juridico = document.getElementById('step5_juridico');
            const step4Comun = document.getElementById('step4_comun');
            const step5Natural = document.getElementById('step5_natural');

            if (step2Comun) step2Comun.style.display = 'none';
            if (step3Juridico) step3Juridico.style.display = 'none';
            if (step5Juridico) step5Juridico.style.display = 'none';
            if (step4Comun) step4Comun.style.display = 'none';
            if (step5Natural) step5Natural.style.display = 'none';
        }

        this.updateProgress('juridico');
    },

    _onClickNext: async function (event) {
        event.preventDefault();

        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        if (userType === 'juridico' && !isJuridicoWithModule) {
            if (!await this.validateFields()) {
                return;
            }

            let nextStep = this.currentStep + 1;
            let currentStepId = '';
            let nextStepId = '';

            switch (this.currentStep) {
                case 2:
                    currentStepId = 'step2_juridico';
                    if (this.isBankAccountsStepVisible) {
                        nextStepId = 'step2_comun';
                    } else {
                        nextStepId = 'step3_juridico';
                        nextStep = 4;
                    }
                    break;
                case 3:
                    currentStepId = 'step2_comun';
                    nextStepId = 'step3_juridico';
                    break;
                case 4:
                    currentStepId = 'step3_juridico';
                    nextStepId = 'step5_juridico';
                    break;
                case 5:
                    currentStepId = 'step5_juridico';
                    nextStepId = 'step4_comun';
                    break;
                case 6:
                    currentStepId = 'step4_comun';
                    nextStepId = 'step5_natural';
                    break;
                case 7:
                    this._submitForm();
                    return;
                default:
                    return;
            }

            if (currentStepId) {
                const currentStep = document.getElementById(currentStepId);
                if (currentStep) currentStep.style.display = 'none';
            }

            if (nextStepId) {
                const nextStepElement = document.getElementById(nextStepId);
                if (nextStepElement) {
                    nextStepElement.style.display = 'block';
                    this.currentStep = nextStep;
                }
            }

            const nextButton = document.getElementById('next-button');
            if (nextButton && this.currentStep === 7) {
                nextButton.textContent = 'Finalizar';
            } else if (nextButton) {
                nextButton.textContent = 'Siguiente';
            }

            this.updateProgress(userType);
            return;
        }

        return this._super.apply(this, arguments);
    },

    _onClickPrev: function (event) {
        event.preventDefault();

        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        if (userType === 'juridico' && !isJuridicoWithModule) {
            let prevStep = this.currentStep - 1;
            let currentStepId = '';
            let prevStepId = '';

            switch (this.currentStep) {
                case 3:
                    currentStepId = 'step2_comun';
                    prevStepId = 'step2_juridico';
                    break;
                case 4:
                    currentStepId = 'step3_juridico';
                    if (this.isBankAccountsStepVisible) {
                        prevStepId = 'step2_comun';
                        prevStep = 3;
                    } else {
                        prevStepId = 'step2_juridico';
                        prevStep = 2;
                    }
                    break;
                case 5:
                    currentStepId = 'step5_juridico';
                    prevStepId = 'step3_juridico';
                    prevStep = 4;
                    break;
                case 6:
                    currentStepId = 'step4_comun';
                    prevStepId = 'step5_juridico';
                    prevStep = 5;
                    break;
                case 7:
                    currentStepId = 'step5_natural';
                    prevStepId = 'step4_comun';
                    prevStep = 6;
                    break;
                default:
                    if (this.currentStep <= 2) return;
                    return;
            }

            if (currentStepId) {
                const currentStep = document.getElementById(currentStepId);
                if (currentStep) currentStep.style.display = 'none';
            }

            if (prevStepId) {
                const prevStepElement = document.getElementById(prevStepId);
                if (prevStepElement) {
                    prevStepElement.style.display = 'block';
                    this.currentStep = prevStep;
                }
            }

            const nextButton = document.getElementById('next-button');
            if (nextButton && this.currentStep < 7) {
                nextButton.textContent = 'Siguiente';
            } else if (nextButton && this.currentStep === 7) {
                nextButton.textContent = 'Finalizar';
            }

            this.updateProgress(userType);
            return;
        }

        return this._super.apply(this, arguments);
    },

    async validateFields() {
        if (this.currentStep === 1) {
            return true;
        }

        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        if (userType === 'juridico' && !isJuridicoWithModule) {
            return this._validateJuridicoFields();
        }

        try {
            return await this._super.apply(this, arguments);
        } catch (error) {
            console.error('Error en validateFields:', error);
            return true;
        }
    },

    _validateJuridicoFields: async function() {
        const errorMessage = document.getElementById('error-message');

        if (this.currentStep === 2) {
            const entityName = document.getElementById('name_entity')?.value.trim();
            const entityType = document.getElementById('entity_type')?.value;
            const address = document.getElementById('address')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const nit = document.getElementById('nit')?.value.trim();
            const reeup = document.getElementById('reeup')?.value.trim();
            const state_id = document.getElementById('state_id')?.value;
            const municipality_id = document.getElementById('res_municipality_id')?.value;
            const socialObject = document.getElementById('social_object')?.value.trim();
            const email = document.getElementById('email')?.value.trim();

            const nitRegex = /^\d+$/;

            if (!entityName) {
                errorMessage.textContent = "El nombre de la entidad es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!entityType) {
                errorMessage.textContent = "El tipo de entidad es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!nit) {
                errorMessage.textContent = "El NIT es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!nitRegex.test(nit) || nit.length !== 11) {
                errorMessage.textContent = "El NIT debe tener 11 dígitos numéricos.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!phone) {
                errorMessage.textContent = "El teléfono es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!email) {
                errorMessage.textContent = "El correo electrónico es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!EMAIL_REGEX.test(email)) {
                errorMessage.textContent = "El correo no es válido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!address) {
                errorMessage.textContent = "La dirección es requerida.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!state_id) {
                errorMessage.textContent = "La provincia es requerida.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!municipality_id) {
                errorMessage.textContent = "El municipio es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!socialObject) {
                errorMessage.textContent = "El objeto social es requerido.";
                errorMessage.style.display = 'inline';
                return false;
            }

            if (entityType === 'estatal' && !reeup) {
                errorMessage.textContent = "El código REEUP es requerido para entidades estatales.";
                errorMessage.style.display = 'inline';
                return false;
            }

            const phoneExists = await this.checkPhoneExists(phone);
            if (phoneExists) {
                errorMessage.textContent = "Este número de teléfono ya está en uso.";
                errorMessage.style.display = 'inline';
                return false;
            }

            const emailExists = await this.checkEmailExists(email);
            if (emailExists) {
                errorMessage.textContent = "Este correo electrónico ya está en uso.";
                errorMessage.style.display = 'inline';
                return false;
            }

        } else if (this.currentStep === 3 && this.isBankAccountsStepVisible) {
            const accountInputs = document.querySelectorAll('.account-number-group input');
            const nitRegex = /^\d+$/;

            for (const input of accountInputs) {
                const accountNumber = input.value.trim();
                if (!accountNumber) {
                    errorMessage.textContent = "Por favor, complete todos los números de cuenta.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!nitRegex.test(accountNumber) || accountNumber.length !== 16) {
                    errorMessage.textContent = "El número de cuenta debe tener 16 dígitos numéricos.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
            }

        } else if (this.currentStep === 4) {
            // Validar documentos específicos
            /*const entityType = document.getElementById('entity_type')?.value;
            const documentos = this._getDocumentosByEntityType(entityType);

            for (let i = 0; i < documentos.length; i++) {
                const input = document.getElementById(`documento_${i + 1}`);
                if (input && !input.files.length) {
                    errorMessage.textContent = `El documento "${documentos[i]}" es requerido.`;
                    errorMessage.style.display = 'inline';
                    return false;
                }
            }*/
            return true;

        } else if (this.currentStep === 5) {
            const isRepresentative = document.getElementById('is_representative')?.checked;

            if (isRepresentative) {
                const repName = document.getElementById('representative_name')?.value.trim();
                const repLastName = document.getElementById('representative_last_name')?.value.trim();
                const repId = document.getElementById('representative_id_number')?.value.trim();
                const repPhone = document.getElementById('representative_phone')?.value.trim();
                const repEmail = document.getElementById('representative_email')?.value.trim();

                const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;

                if (!repName) {
                    errorMessage.textContent = "El nombre del representante es requerido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!onlyLettersRegex.test(repName)) {
                    errorMessage.textContent = "El nombre solo debe contener letras.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!repLastName) {
                    errorMessage.textContent = "El apellido del representante es requerido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!repId) {
                    errorMessage.textContent = "El CI o pasaporte del representante es requerido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!repPhone) {
                    errorMessage.textContent = "El contacto del representante es requerido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!repEmail) {
                    errorMessage.textContent = "El correo del representante es requerido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
                if (!EMAIL_REGEX.test(repEmail)) {
                    errorMessage.textContent = "El correo no es válido.";
                    errorMessage.style.display = 'inline';
                    return false;
                }
            }

        } else if (this.currentStep === 6) {
            const login = document.getElementById('login')?.value.trim();
            const password = document.getElementById('password')?.value.trim();
            const confirmPassword = document.getElementById('confirm_password')?.value.trim();

            if (!login) {
                errorMessage.textContent = "Por favor, introduzca el usuario.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!password) {
                errorMessage.textContent = "Por favor, introduzca la contraseña.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (password.length < 8) {
                errorMessage.textContent = "La contraseña debe tener un mínimo de 8 caracteres.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (!confirmPassword) {
                errorMessage.textContent = "Por favor, introduzca la confirmación de la contraseña.";
                errorMessage.style.display = 'inline';
                return false;
            }
            if (password !== confirmPassword) {
                errorMessage.textContent = "Las contraseñas no coinciden.";
                errorMessage.style.display = 'inline';
                return false;
            }

            const loginExists = await this.checkLoginExists(login);
            if (loginExists) {
                errorMessage.textContent = "Este nombre de usuario ya está en uso.";
                errorMessage.style.display = 'inline';
                return false;
            }

        } else if (this.currentStep === 7) {
            const acceptedTerms = document.getElementById('accept_terms')?.checked;
            if (!acceptedTerms) {
                errorMessage.textContent = "Debes aceptar los términos y condiciones para continuar.";
                errorMessage.style.display = 'inline';
                return false;
            }
        }

        return true;
    },

    updateProgress: function (userType = null) {
        if (!userType) {
            const selectedRadio = document.querySelector('input[name="user_type"]:checked');
            userType = selectedRadio ? selectedRadio.value : 'juridico';
        }

        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        const step1Element = document.getElementById('step-1');
        if (step1Element) {
            step1Element.style.display = 'none';
        }

        if (userType === 'juridico' && !isJuridicoWithModule) {
            const totalSteps = this.isBankAccountsStepVisible ? 7 : 6;

            for (let i = 2; i <= totalSteps; i++) {
                const stepElement = document.getElementById('step-' + i);
                if (!stepElement) continue;

                stepElement.style.display = '';

                if (i < this.currentStep) {
                    stepElement.classList.add('completed');
                    stepElement.classList.remove('active');
                } else if (i === this.currentStep) {
                    stepElement.classList.add('active');
                    stepElement.classList.remove('completed');
                } else {
                    stepElement.classList.remove('active', 'completed');
                }
            }

            for (let i = totalSteps + 1; i <= 7; i++) {
                const stepElement = document.getElementById('step-' + i);
                if (stepElement) stepElement.style.display = 'none';
            }
        } else {
            this._super.apply(this, arguments);
        }

        const prevButton = document.querySelector('.prev');
        if (prevButton) {
            prevButton.disabled = (this.currentStep === 2);
        }
    },

    _initReeupVisibility: function() {
        console.log('Inicializando visibilidad de REEUP...');
        const entityTypeSelect = document.getElementById('entity_type');
        if (entityTypeSelect) {
            entityTypeSelect.addEventListener('change', this._toggleReeupVisibility.bind(this));
            setTimeout(() => {
                this._toggleReeupVisibility();
            }, 100);
        }
    },

    _toggleReeupVisibility: function() {
        const entityType = document.getElementById('entity_type')?.value;
        const reeupField = document.getElementById('reeup');
        if (!reeupField) return;
        const reeupContainer = reeupField.closest('.form-group');
        if (entityType === 'estatal') {
            if (reeupContainer) reeupContainer.style.display = 'block';
            reeupField.required = true;
        } else {
            if (reeupContainer) reeupContainer.style.display = 'none';
            reeupField.required = false;
            reeupField.value = '';
        }
    },

    _initDocumentosEspecificos: function() {
        console.log('Inicializando documentos específicos...');
        // ELIMINAR documentos generales y sus alertas
        this._eliminarDocumentosGeneralesYAlertas();

        const entityTypeSelect = document.getElementById('entity_type');
        if (entityTypeSelect) {
            entityTypeSelect.removeEventListener('change', this._onEntityTypeChange.bind(this));
        }
        this._ocultarDocumentosGenerales();
        if (entityTypeSelect) {
            entityTypeSelect.addEventListener('change', this._onEntityTypeChange.bind(this));
            setTimeout(() => {
                this._onEntityTypeChange({ target: entityTypeSelect });
            }, 100);
        }
        this._configurarEventListenersUpload();
    },

    _configurarEventListenersUpload: function() {
        const self = this;
        $(this.el).off('click', '.upload-btn');
        $(this.el).off('click', '.remove-btn');
        $(this.el).off('change', 'input[type="file"][name^="documento_"]');

        $(this.el).on('click', '.upload-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const inputId = $(this).data('input-id');
            const fileInput = document.getElementById(inputId);
            if (fileInput) fileInput.click();
        });

        $(this.el).on('click', '.remove-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const inputId = $(this).data('input-id');
            self._eliminarArchivo(inputId);
        });

        $(this.el).on('change', 'input[type="file"][name^="documento_"]', function(e) {
            e.stopPropagation();
            const fileName = this.name;
            const docNumber = fileName.split('_')[1];
            self._actualizarEstadoDocumento(docNumber, this.files.length > 0);
            if (this.files.length > 0) {
                self._mostrarNombreArchivo(this, this.files[0].name);
                self._mostrarBotonEliminar(this.name, true);
            }
        });
    },

    _mostrarNombreArchivo: function(fileInput, fileName) {
        const container = fileInput.closest('.upload-container');
        if (!container) return;
        this._ocultarNombreArchivo(fileInput.id);
        const fileDisplay = document.createElement('span');
        fileDisplay.className = 'file-name-display';
        fileDisplay.style.cssText = 'margin-left: 10px; font-size: 12px; color: #28a745; font-weight: 500;';
        fileDisplay.textContent = `📄 ${fileName}`;
        const actionsContainer = container.querySelector('.upload-actions');
        if (actionsContainer) actionsContainer.appendChild(fileDisplay);
    },

    _eliminarArchivo: function(inputId) {
        const fileInput = document.getElementById(inputId);
        if (fileInput) {
            fileInput.value = '';
            const docNumber = inputId.split('_')[1];
            this._actualizarEstadoDocumento(docNumber, false);
            this._ocultarNombreArchivo(inputId);
            this._mostrarBotonEliminar(inputId, false);
        }
    },

    _mostrarBotonEliminar: function(inputId, show) {
        const removeBtn = document.querySelector(`.remove-btn[data-input-id="${inputId}"]`);
        if (removeBtn) {
            removeBtn.style.display = show ? 'inline-flex' : 'none';
        }
        const uploadBtn = document.querySelector(`.upload-btn[data-input-id="${inputId}"]`);
        if (uploadBtn) {
            uploadBtn.style.display = show ? 'none' : 'inline-block';
        }
    },

    _ocultarNombreArchivo: function(inputId) {
        const container = document.getElementById(inputId)?.closest('.upload-container');
        if (!container) return;
        const existingDisplay = container.querySelector('.file-name-display');
        if (existingDisplay) existingDisplay.remove();
    },

    _ocultarDocumentosGenerales: function() {
        const documentosGeneralesIds = [
            'documento_constitutivo', 'documento_existencia', 'documento_registro_mercantil',
            'documento_registro_contribuyente', 'documento_licencia_comercio',
            'documento_carta_timbrada', 'documento_carnet_acorec', 'documento_perfil_cliente'
        ];
        documentosGeneralesIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const container = input.closest('.upload-container');
                if (container) {
                    container.style.display = 'none';
                    input.required = false;
                }
            }
        });
    },

    _onEntityTypeChange: function(event) {
        const entityType = event.target.value;
        this._mostrarDocumentosEspecificos(entityType);
        this._toggleReeupVisibility();
    },

    _mostrarDocumentosEspecificos: function(entityType) {
        const documentosSection = document.querySelector('.documentos-especificos');
        const documentosContainer = document.getElementById('documentos_especificos_container');
        const documentosList = document.getElementById('documentos_requeridos_list');

        if (!documentosSection || !documentosContainer || !documentosList) return;

        if (entityType) {
            documentosSection.style.display = 'block';
            const documentos = this._getDocumentosByEntityType(entityType);

            if (documentos.length > 0) {
                documentosList.innerHTML = `
                    <strong>Documentos requeridos para ${this._getEntityTypeLabel(entityType)}:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        ${documentos.map((doc, index) => `
                            <li style="font-size: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                                <span style="flex: 1; min-width: 0; word-wrap: break-word;">${doc}</span>
                                <span id="status_doc_${index + 1}" class="document-status" style="color: #dc3545; font-size: 10px; flex-shrink: 0;">(Pendiente)</span>
                            </li>
                        `).join('')}
                    </ul>
                `;

                // Generar campos de documento dinámicamente
                this._generarCamposDocumentos(documentos);
                documentosContainer.style.display = 'block';
            } else {
                documentosList.innerHTML = '<p style="margin: 0; font-size: 13px; color: #6c757d;">No se requieren documentos específicos para este tipo de entidad.</p>';
                documentosContainer.style.display = 'none';
            }
        } else {
            documentosSection.style.display = 'none';
        }
    },

    // NUEVO: Generar campos de documento con su alerta de formatos debajo de cada uno
    _generarCamposDocumentos: function(documentos) {
        const container = document.getElementById('documentos_especificos_container');
        if (!container) return;

        // Limpiar container
        container.innerHTML = '';

        // Generar un campo por cada documento
        for (let i = 0; i < documentos.length; i++) {
            const docNumber = i + 1;
            const docName = documentos[i];

            // Crear estructura del documento
            const docDiv = document.createElement('div');
            docDiv.className = 'document-row upload-container';
            docDiv.style.cssText = 'flex-direction: column; align-items: stretch; margin-bottom: 20px;';

            // Contenido del documento
            docDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <span class="document-label" id="label_documento_${docNumber}" style="flex: 1; min-width: 200px;">${docName}</span>
                    <div class="upload-actions" style="display: flex; gap: 10px;">
                        <button class="upload-btn" data-input-id="documento_${docNumber}" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Subir documento</button>
                        <button class="remove-btn" data-input-id="documento_${docNumber}" style="display: none; background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;"> Eliminar</button>
                    </div>
                </div>
                <input type="file" name="documento_${docNumber}" id="documento_${docNumber}" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff" style="opacity: 0; position: absolute; left: -9999px;"/>
                <div class="alert alert-info format-alert" style="margin-top: 10px; font-size: 11px; padding: 5px 10px; background: #e8f4f8; border-left: 3px solid #17a2b8; border-radius: 3px;">
                    <i class="fa fa-info-circle me-2"></i>
                    Formatos permitidos: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF. Tamaño máximo: 10MB por archivo.
                </div>
            `;

            container.appendChild(docDiv);
        }

        // Reconfigurar event listeners para los nuevos elementos
        this._configurarEventListenersUpload();

        // Actualizar estados de documentos si ya había archivos subidos
        for (let i = 0; i < documentos.length; i++) {
            const docNumber = i + 1;
            const input = document.getElementById(`documento_${docNumber}`);
            if (input && input.files && input.files.length > 0) {
                this._actualizarEstadoDocumento(docNumber, true);
                this._mostrarNombreArchivo(input, input.files[0].name);
                this._mostrarBotonEliminar(`documento_${docNumber}`, true);
            }
        }
    },
    _eliminarDocumentosGeneralesYAlertas: function() {
        // Buscar el contenedor de documentos generales
        const step3Juridico = document.getElementById('step3_juridico');
        if (!step3Juridico) return;

        const formSectionContainer = step3Juridico.querySelector('.form-section-container');
        if (!formSectionContainer) return;

        // Eliminar todas las alertas de formatos
        const alerts = formSectionContainer.querySelectorAll('.alert.alert-info');
        alerts.forEach(alert => {
            if (alert.textContent.includes('Formatos permitidos')) {
                alert.remove();
            }
        });

        // Eliminar todos los contenedores de documentos generales
        const uploadContainers = formSectionContainer.querySelectorAll('.upload-container');
        uploadContainers.forEach(container => {
            container.remove();
        });

        console.log('✅ Documentos generales y alertas eliminados');
    },

    _getDocumentContainer: function(docNumber) {
        return document.querySelector(`.upload-container input#documento_${docNumber}`)?.closest('.upload-container');
    },

    _getDocumentInput: function(docNumber) {
        return document.getElementById(`documento_${docNumber}`);
    },

    _getDocumentLabel: function(docNumber) {
        return document.getElementById(`label_documento_${docNumber}`);
    },

    _actualizarEstadoDocumento: function(docNumber, isUploaded) {
        const statusElement = document.getElementById(`status_doc_${docNumber}`);
        if (statusElement) {
            statusElement.textContent = isUploaded ? '(Completado)' : '(Pendiente)';
            statusElement.style.color = isUploaded ? '#28a745' : '#dc3545';
        }
    },

    _getEntityTypeLabel: function(entityType) {
        const labels = { 'estatal': 'Entidad Estatal', 'firma': 'Firma', 'mipime': 'MIPYME', 'tcp': 'TCP' };
        return labels[entityType] || entityType;
    },

    _getDocumentosByEntityType: function(entityType) {
        switch (entityType) {
            case 'estatal':
                return ["RESOLUCIÓN DE CONSTITUCIÓN", "NIT", "REEUP", "CERTIFICO LEGAL", "CERTIFICO DE CUENTAS BANCARIAS"];
            case 'firma':
                return ["DOCUMENTO CONSTITUTIVO", "INSCRIPCIÓN EN EL REGISTRO NACIONAL", "PERMISO OFAC, SI ES DE EEUU, PARA COMERCIALIZAR CON CUBA", "INSCRIPCIÓN EN LOS REGISTROS DE TRIBUTARIOS"];
            case 'mipime':
                return ["ESCRITURA PUBLICA DE CONSTITUCIÓN", "NIT", "CERTIFICADO DE INSCRIPCIÓN DEL REGISTRO MERCANTIL", "CERTIFICO LEGAL, SI POSEE"];
            case 'tcp':
                return ["PROYECTO DE TRABAJO", "NIT"];
            default:
                return [];
        }
    },

    _getUserType: function() {
        const selectedRadio = document.querySelector('input[name="user_type"]:checked');
        return selectedRadio ? selectedRadio.value : 'juridico';
    },

    _showError: function(message) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'inline';
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
        }
    },

    _showInfo: function(message) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'inline';
            errorMessage.style.color = '#ffc107';
            errorMessage.style.backgroundColor = '#f8f9fa';
            errorMessage.style.border = '1px solid #ffc107';
            setTimeout(() => {
                errorMessage.style.display = 'none';
                errorMessage.style.color = '';
                errorMessage.style.backgroundColor = '';
                errorMessage.style.border = '';
            }, 3000);
        }
    },

    _submitForm: async function() {
        console.log('Pyxel Cubaelectronica - _submitForm interceptado');
        return this._super.apply(this, arguments);
    },

    checkLoginExists: async function(login) {
        try {
            const result = await this.rpc('/check_user_login', { login });
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el usuario:', error);
            return false;
        }
    },

    checkPhoneExists: async function(phone) {
        try {
            const result = await this.rpc('/check_user_phone', { phone });
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el teléfono:', error);
            return false;
        }
    },

    checkEmailExists: async function(email) {
        try {
            const result = await this.rpc('/check_user_email', { email });
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el email:', error);
            return false;
        }
    },

});