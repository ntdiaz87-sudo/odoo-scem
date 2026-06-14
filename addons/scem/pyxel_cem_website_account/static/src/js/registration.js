/** @odoo-module */

import publicWidget from '@web/legacy/js/public/public_widget';

// function getRecaptchaToken() {
//     if (!window.grecaptcha) {
//         return '';  // la API del captcha todavía no está cargada
//     }
//
//     return window.grecaptcha.getResponse();
// }

publicWidget.registry.RegistrationForm = publicWidget.Widget.extend({
    selector: '.register-form',
    events: {
        'click .upload-btn': '_onUploadBtnClick',  // Cuando el botón de subir se hace clic
        'click .next': '_onClickNext',
        'click .prev': '_onClickPrev',
        'change #is_representative': '_onRepresentativeToggle',
        'change #account_type': '_onAccountTypeChange', 'change input[name="user_type"]': '_onUserTypeChange',  // Nuevo evento para cambio de tipo de usuario
        'click .toggle-password': '_onTogglePasswordClick',     // Evento para mostrar/ocultar contraseña
        'click .remove-upload-btn': '_removeUploadedFile', // nuevo evento
        'change #state_id': '_onProvinceChange', // ← Evento agregado
    },

    init() {
        this._super(...arguments);
        this.rpc = this.bindService("rpc");  // forma correcta en Odoo 17
        // Definir extensiones permitidas y tamaño máximo
        this.ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif'];
        this.MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    },

        start: function () {
        this.currentStep = 1;
        this.selectedAccounts = [];
        this.availableAccountTypes = [
            {value: 'x', label: 'Seleccione una cuenta'},
            {value: 'corriente', label: 'Corriente'},
            {value: 'gastos_cup', label: 'Gastos CUP'},
            {value: 'gastos_mlc', label: 'Gastos MLC'},
            {value: 'cuenta_usd_eur', label: 'Cuenta USD/EUR'},
        ];

        // 🔥 CORRECCIÓN: Detectar si el módulo está instalado
        const importBackendDiv = document.querySelector('[data-is-import-backend-installed]');
        this.isImportBackendInstalled = importBackendDiv ?
            importBackendDiv.dataset.isImportBackendInstalled === 'true' :
            document.getElementById('step2_juridico').classList.contains('d-none');

        // Para usuario natural, determinar si debe mostrar datos bancarios
        // 🔥 IMPORTANTE: Para usuario natural, SOLO mostrar datos bancarios si el módulo NO está instalado
        this.isBankAccountsStepVisible = false; // Por defecto oculto, se actualizará en _onUserTypeChange

        // 🔥 LIMPIAR MENSAJE DE ERROR AL INICIAR
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }

        this.updateProgress();

        // Inicializar selector de cuentas
        this._initAccountSelector();
        this._updateStepNames();
    },

    // NUEVA FUNCIÓN: Validar archivo al cambiar
    _onFileChange: function (event) {
        const fileInput = event.target;
        const file = fileInput.files[0];

        if (!file) return;

        // Validar extensión
        const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
        if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
            this._showFileError(fileInput, 'Formato de archivo no válido. Solo se permiten PDF e imágenes.');
            return;
        }

        // Validar tamaño
        if (file.size > this.MAX_FILE_SIZE) {
            this._showFileError(fileInput, 'El archivo es demasiado grande. El tamaño máximo es 10MB.');
            return;
        }

        // Si pasa todas las validaciones, limpiar error
        this._clearFileError(fileInput);
    },

    // NUEVA FUNCIÓN: Mostrar error de archivo
    _showFileError: function (fileInput, message) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'inline';
            errorMessage.style.color = '#dc3545';
        }

        // Limpiar el input file
        fileInput.value = '';

        // Si hay un botón de subir, mostrarlo de nuevo
        const uploadBtn = fileInput.previousElementSibling;
        if (uploadBtn && uploadBtn.classList.contains('upload-btn')) {
            uploadBtn.style.display = 'inline-block';
        }

        // Eliminar visualización del archivo
        const fileDisplay = fileInput.closest('.upload-container').querySelector('.uploaded-file-display');
        if (fileDisplay) {
            fileDisplay.remove();
        }
    },

    // NUEVA FUNCIÓN: Limpiar error de archivo
    _clearFileError: function (fileInput) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }
    },

        _onUserTypeChange: function (event) {
        const userType = event.target.value;

        // 🔥 LIMPIAR MENSAJE DE ERROR AL CAMBIAR TIPO DE USUARIO
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Ocultar todos los pasos de contenido primero
        document.querySelectorAll('[id^="step"]').forEach(step => {
            if (step.id !== 'step1' && !step.id.includes('-')) {
                step.style.display = 'none';
            }
        });

        // Mostrar paso 1 si estaba oculto
        document.getElementById('step1').style.display = 'block';

        // 🔥 CORRECCIÓN: Determinar visibilidad de datos bancarios según tipo de usuario y módulo
        if (userType === 'natural') {
            // Para usuario natural: SOLO mostrar datos bancarios si el módulo NO está instalado
            this.isBankAccountsStepVisible = !this.isImportBackendInstalled;
            console.log('Usuario natural - Módulo instalado:', this.isImportBackendInstalled,
                        '- Mostrar datos bancarios:', this.isBankAccountsStepVisible);
        } else if (userType === 'juridico') {
            // Para jurídico, solo mostrar datos bancarios si el módulo NO está instalado
            this.isBankAccountsStepVisible = !this.isImportBackendInstalled;
        }

        this._updateStepNames(userType);

        // Reiniciar progreso
        this.currentStep = 1;

        // Actualizar el botón "Siguiente" a texto normal
        const nextButton = document.getElementById('next-button');
        if (nextButton) {
            nextButton.textContent = 'Siguiente';
        }

        this.updateProgress(userType);
    },

        _updateStepNames: function (userType = null) {
        if (!userType) {
            const selectedUserType = document.querySelector('input[name="user_type"]:checked');
            if (selectedUserType) {
                userType = selectedUserType.value;
            }
        }

        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        // Actualizar nombres de los pasos según el caso
        if (isJuridicoWithModule) {
            // Para jurídico con módulo: Inicio → Seguridad → Final
            const step4Element = document.querySelector('#step-4');
            const step5Element = document.querySelector('#step-5');

            if (step4Element) {
                const step4Name = step4Element.querySelector('.step-name');
                if (step4Name) step4Name.textContent = 'Seguridad';
            }

            if (step5Element) {
                const step5Name = step5Element.querySelector('.step-name');
                if (step5Name) step5Name.textContent = 'Final';
            }
        } else {
            // Para otros casos, usar nombres normales
            const step4Element = document.querySelector('#step-4');
            const step5Element = document.querySelector('#step-5');
            const step6Element = document.querySelector('#step-6');

            if (step4Element) {
                const step4Name = step4Element.querySelector('.step-name');
                if (step4Name) {
                    step4Name.textContent = (userType === 'juridico') ? 'Documentación' : 'Contacto';
                }
            }

            if (step5Element) {
                const step5Name = step5Element.querySelector('.step-name');
                if (step5Name) {
                    step5Name.textContent = (userType === 'juridico') ? 'Representante' : 'Seguridad';
                }
            }

            if (step6Element) {
                const step6Name = step6Element.querySelector('.step-name');
                if (step6Name) {
                    step6Name.textContent = (userType === 'juridico') ? 'Seguridad' : 'Final';
                }
            }
        }
    },

    _initAccountSelector: function () {
        const accountNumbersDiv = document.getElementById('account_numbers');
        if (accountNumbersDiv) {
            this._addAccountTypeSelector(accountNumbersDiv, this.availableAccountTypes);
        }
    },

    _addAccountTypeSelector: function (container, accountTypes) {
        const accountInputDiv = document.createElement('div');
        accountInputDiv.className = 'form-group account-selector-group';

        const label = document.createElement('label');
        label.textContent = 'Seleccione un tipo de cuenta';
        accountInputDiv.appendChild(label);

        const select = document.createElement('select');
        select.className = 'account-type-select';
        select.required = true;
        select.style.color = 'black';

        accountTypes.forEach(account => {
            const option = document.createElement('option');
            option.value = account.value;
            option.textContent = account.label;
            select.appendChild(option);
        });

        accountInputDiv.appendChild(select);
        container.appendChild(accountInputDiv);

        // Bind event listener for change
        select.addEventListener('change', this._onAccountTypeChange.bind(this));
    },

    _onAccountTypeChange: function (event) {
        const selectedOption = event.target.value;
        const accountNumbersDiv = document.getElementById('account_numbers');

        event.target.parentElement.style.display = 'none';

        this.selectedAccounts.push(selectedOption);
        this.availableAccountTypes = this.availableAccountTypes.filter(account => account.value !== selectedOption);

        this._addAccountNumberInput(accountNumbersDiv, selectedOption);

        // Añadir la variable que indica si se seleccionó una cuenta
        const isAccountSelected = this.selectedAccounts.length > 0;
        console.log('¿Se seleccionó una cuenta?', isAccountSelected);

        // Si se han seleccionado 4 cuentas, oculta el selector
        if (this.selectedAccounts.length >= 4) {
            const accountSelectors = accountNumbersDiv.querySelectorAll('.account-selector-group');
            accountSelectors.forEach(selector => selector.style.display = 'none');
        } else {
            this._addAccountTypeSelector(accountNumbersDiv, this.availableAccountTypes);
        }
    },

    _addAccountNumberInput: function (container, accountType) {
        const accountInputDiv = document.createElement('div');
        accountInputDiv.className = 'form-group account-number-group';

        const label = document.createElement('label');
        label.textContent = `Número de cuenta para ${this._getAccountLabel(accountType)} *`;

        const inputDiv = document.createElement('div');
        inputDiv.style.display = 'flex'; // Usar flexbox para alinear el input y la "X"

        const input = document.createElement('input');
        input.type = 'text';
        input.name = `account_number_${accountType}`;
        input.id = `account_number_${accountType}`;
        input.dataset.accountType = accountType;
        input.placeholder = `Ingrese el número de cuenta para ${this._getAccountLabel(accountType)}`;
        input.required = true;
        input.maxLength = 16;


        const removeBtn = document.createElement('span'); // Cambia a span para hacer la "X"
        removeBtn.className = 'remove-account-type';
        removeBtn.textContent = '✖'; // Utiliza una X para eliminar
        removeBtn.dataset.accountType = accountType;
        removeBtn.style.cursor = 'pointer'; // Cambia el cursor al pasar sobre la "X"
        removeBtn.style.color = 'red'; // Color para la "X"
        removeBtn.style.marginLeft = '8px'; // Espacio entre el input y la "X"

        inputDiv.appendChild(input);
        inputDiv.appendChild(removeBtn);
        accountInputDiv.appendChild(label);
        accountInputDiv.appendChild(inputDiv);
        container.appendChild(accountInputDiv);

        // Bind event listener for remove button
        removeBtn.addEventListener('click', this._onRemoveAccountType.bind(this));
    },

    _onRemoveAccountType: function (event) {
        event.preventDefault();
        const accountType = event.target.dataset.accountType;
        const accountNumbersDiv = document.getElementById('account_numbers');

        this.selectedAccounts = this.selectedAccounts.filter(account => account !== accountType);

        this.availableAccountTypes.push({
            value: accountType,
            label: this._getAccountLabel(accountType)
        });

        event.target.parentElement.parentElement.remove(); // Modificado para remover el div completo

        this._refreshAccountSelectors(accountNumbersDiv);
    },

    _refreshAccountSelectors: function (container) {
        const existingSelectors = container.querySelectorAll('.account-selector-group');
        existingSelectors.forEach(selector => selector.remove());

        if (this.availableAccountTypes.length > 0) {
            this._addAccountTypeSelector(container, this.availableAccountTypes);
        }
    },

    _getAccountLabel: function (accountType) {
        const accountLabels = {
            'corriente': 'Corriente',
            'gastos_cup': 'Gastos CUP',
            'gastos_mlc': 'Gastos MLC',
            'cuenta_usd_eur': 'Gastos USD/EUR'
        };
        return accountLabels[accountType] || accountType;
    },

    // Función de validación
    async validateFields() {
        let isValid = true; // Asumir que es válido al principio
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'none'; // Ocultar el mensaje de error

        // Expresión regular para solo letras
        const onlyLettersRegex = /^[A-Za-zÀ-ÿ\s]+$/;
        // Expresión regular para letras y números (para nombre de entidad jurídica)
        const lettersAndNumbersRegex = /^[A-Za-zÀ-ÿ0-9\s]+$/;
        // Expresión regular solo números
        const nitRegex = /^\d+$/;
        // Para validar correos electrónicos
        const emailRegex = /^[a-z][a-z0-9]*(\.[a-z0-9]+)*@[a-z0-9]+\.[a-z]+$/;

        const isBankAccountsVisible = this.isBankAccountsStepVisible;
        const userType = this._getUserType();

                // Si el módulo está instalado y es usuario jurídico, omitir validación de ciertos pasos
        if (this.isImportBackendInstalled && userType === 'juridico') {
            if (this.currentStep === 2 || this.currentStep === 3 || this.currentStep === 4) {
                // Pasos ocultos para jurídico con módulo, no validar
                return true;
            }
        }

        if (this.currentStep === 2) {
            if (document.getElementById('step2_natural').style.display !== 'none') {
                // Validar campos para usuario natural
                const name = document.getElementById('name').value.trim();
                const lastName = document.getElementById('lastName').value.trim();

                if (!name) {
                    isValid = false;
                    errorMessage.textContent = "El nombre es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!onlyLettersRegex.test(name)) {
                    isValid = false;
                    errorMessage.textContent = "El nombre solo debe contener letras.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!lastName) {
                    isValid = false;
                    errorMessage.textContent = "El apellido es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!onlyLettersRegex.test(lastName)) {
                    isValid = false;
                    errorMessage.textContent = "El apellido solo debe contener letras.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                }
            } else if (document.getElementById('step2_juridico').style.display !== 'none') {
                // Validar campos para usuario jurídico
                const entityName = document.getElementById('name_entity').value.trim();
                const entityType = document.getElementById('entity_type').value.trim();
                const address = document.getElementById('address').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const nit = document.getElementById('nit').value.trim();
                const reeup = document.getElementById('reeup').value.trim();
                const state_id = document.getElementById('state_id').value.trim();
                const municipality_id = document.getElementById('res_municipality_id').value.trim();
                const socialObject = document.getElementById('social_object').value.trim();
                const email = document.getElementById('email').value.trim();
                const isStep1Visible = document.getElementById('step-1')?.offsetParent !== null;

                if (!entityName) {
                    isValid = false;
                    errorMessage.textContent = "El nombre de la entidad es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!lettersAndNumbersRegex.test(entityName)) {
                    isValid = false;
                    errorMessage.textContent = "El nombre de la entidad solo debe contener letras y números.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!entityType) {
                    isValid = false;
                    errorMessage.textContent = "El tipo de FGNE es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!nit) {
                    isValid = false;
                    errorMessage.textContent = "El NIT es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!nitRegex.test(nit)) {
                    isValid = false;
                    errorMessage.textContent = "El NIT solo admite dígitos numéricos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (nit.length !== 11) {
                    isValid = false;
                    errorMessage.textContent = "El NIT debe tener 11 dígitos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!phone) {
                    isValid = false;
                    errorMessage.textContent = "El teléfono es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!nitRegex.test(phone)) {
                    isValid = false;
                    errorMessage.textContent = "El teléfono solo admite dígitos numéricos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (phone.length < 8) {
                    isValid = false;
                    errorMessage.textContent = "El teléfono debe tener mínimo 8 dígitos numéricos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!email) {
                    isValid = false;
                    errorMessage.textContent = "El campo correo es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!emailRegex.test(email)) {
                    isValid = false;
                    errorMessage.textContent = "El Correo no es valido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!address) {
                    isValid = false;
                    errorMessage.textContent = "La dirreción es requerida.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!state_id) {
                    isValid = false;
                    errorMessage.textContent = "La provincia es requerida.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!municipality_id) {
                    isValid = false;
                    errorMessage.textContent = "El municipio es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (isStep1Visible) {
                    if (!socialObject) {
                        isValid = false;
                        errorMessage.textContent = "El objeto social es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
                if (!isBankAccountsVisible) {
                    const valorentityType = document.getElementById('entity_type').value;
                    if (valorentityType === 'estatal') {
                        if (!reeup) {
                            isValid = false;
                            errorMessage.textContent = "El código REEUP es requerido para entidades estatales.";
                            errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                        } else if (!nitRegex.test(reeup)) {
                            isValid = false;
                            errorMessage.textContent = "El código REEUP solo admite dígitos numéricos.";
                            errorMessage.style.display = 'inline';
                        }
                    }
                }

                // ✅ Validar si el phone y  email ya existen
                if (isValid) {
                    const phoneExists = await this.checkPhoneExists(phone);
                    const emailExists = await this.checkEmailExists(email);

                    if (phoneExists) {
                        isValid = false;
                        errorMessage.textContent = "Este número de teléfono ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (emailExists) {
                        isValid = false;
                        errorMessage.textContent = "Este correo electrónico ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
            }
        } else if (this.currentStep === 3 ) {
            const userType = this._getUserType();
            const shouldValidateBankAccounts = (userType === 'natural') ||
                                               (userType === 'juridico' && !this.isImportBackendInstalled);

            if (shouldValidateBankAccounts) {
                const accountInputs = document.querySelectorAll('.account-number-group input');
                accountInputs.forEach(input => {
                    const accountType = input.dataset.accountType;
                    const accountNumber = input.value.trim();
                    if (!accountNumber) {
                        isValid = false;
                        errorMessage.textContent = `Por favor, complete el número de cuenta para ${this._getAccountLabel(accountType)}.`;
                        errorMessage.style.display = 'block';
                    } else if (!nitRegex.test(accountNumber)) {
                        isValid = false;
                        errorMessage.textContent = "El número de cuenta solo admite dígitos numéricos.";
                        errorMessage.style.display = 'inline';
                    } else if (accountNumber.length !== 16) {
                        isValid = false;
                        errorMessage.textContent = `El número de cuenta para ${this._getAccountLabel(accountType)} debe tener 16 caracteres.`;
                        errorMessage.style.display = 'inline';
                    }
                });
            }
        } else if (this.currentStep === 4) {
           if (document.getElementById('step3_juridico').style.display !== 'none') {
                // 🔍 VALIDAR ARCHIVOS PARA USUARIO JURÍDICO
                const fileInputs = document.querySelectorAll('#step3_juridico input[type="file"]');
                let hasInvalidFile = false;

                fileInputs.forEach(input => {
                    if (input.files.length > 0) {
                        const file = input.files[0];

                        // Validar extensión
                        const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
                        if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
                            isValid = false;
                            hasInvalidFile = true;
                            errorMessage.textContent = `Formato no válido para ${input.name.replace('documento_', '').replace('_', ' ')}. Solo se permiten PDF e imágenes.`;
                            errorMessage.style.display = 'inline';
                            return;
                        }

                        // Validar tamaño
                        if (file.size > this.MAX_FILE_SIZE) {
                            isValid = false;
                            hasInvalidFile = true;
                            errorMessage.textContent = `El archivo ${file.name} es demasiado grande. El tamaño máximo es 10MB.`;
                            errorMessage.style.display = 'inline';
                            return;
                        }
                    }
                });

                if (hasInvalidFile) return false;

            } else if (document.getElementById('step3_natural').style.display !== 'none') {
                // Validar campos para usuario natural
                const identification_num = document.getElementById('identification_num').value.trim();
                const date_of_birth = document.getElementById('date_of_birth').value.trim();
                const phone = document.getElementById('phone1').value.trim();
                const phone2 = document.getElementById('phone2').value.trim();
                const email = document.getElementById('email1').value.trim();
                const address = document.getElementById('address1').value.trim();

                if (!identification_num) {
                    isValid = false;
                    errorMessage.textContent = "El CI o pasaporte es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (identification_num.length < 8) {
                    isValid = false;
                    errorMessage.textContent = "El CI o pasaporte es invalido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!date_of_birth) {
                    isValid = false;
                    errorMessage.textContent = "La fecha de nacimiento es requerida.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!phone) {
                    isValid = false;
                    errorMessage.textContent = "El contacto1 es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!nitRegex.test(phone)) {
                    isValid = false;
                    errorMessage.textContent = "El contacto solo admite dígitos numéricos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (phone.length < 8) {
                    isValid = false;
                    errorMessage.textContent = "El contacto debe tener mínimo 8 dígitos numéricos.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (phone2) {
                    if (!nitRegex.test(phone2)) {
                        isValid = false;
                        errorMessage.textContent = "El contacto solo admite dígitos numéricos.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (phone < 8) {
                        isValid = false;
                        errorMessage.textContent = "El contacto debe tener mínimo 8 dígitos numéricos.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                } else if (!email) {
                    isValid = false;
                    errorMessage.textContent = "El correo es requerido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!emailRegex.test(email)) {
                    isValid = false;
                    errorMessage.textContent = "El correo no es valido.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!address) {
                    isValid = false;
                    errorMessage.textContent = "La dirección es requerida.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else {
                    // Validar edad (mayor a 18 y menor a 100 años)
                    const birthDate = new Date(date_of_birth);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();

                    if (age < 18 || age > 100) {
                        isValid = false;
                        errorMessage.textContent = "La edad debe ser mayor a 18 años y menor a 100 años.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }

                // ✅ Validar si el phone y  email ya existen
                if (isValid) {
                    const phoneExists = await this.checkPhoneExists(phone);
                    const emailExists = await this.checkEmailExists(email);

                    if (phoneExists) {
                        isValid = false;
                        errorMessage.textContent = "Este número de teléfono ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (emailExists) {
                        isValid = false;
                        errorMessage.textContent = "Este correo electrónico ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
            }
        } else if (this.currentStep === 5) {
            if (document.getElementById('step4_comun').style.display !== 'none') {
                // Validar campos para usuario natural
                const login = document.getElementById('login').value.trim();
                const password = document.getElementById('password').value.trim();
                const confirm_password = document.getElementById('confirm_password').value.trim();

                if (!login) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca el usuario."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!password) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca la contaseña."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (password.length < 8) {
                    isValid = false;
                    errorMessage.textContent = "La contraseña debe tener un mínimo de 8 caracteres.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!confirm_password) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca la confirmación de la contaseña."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (password !== confirm_password) {
                    isValid = false;
                    errorMessage.textContent = "Las contaseñas no coinciden."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                }

                // ✅ Validar si el login ya existe
                if (isValid) {
                    const loginExists = await this.checkLoginExists(login);
                    if (loginExists) {
                        isValid = false;
                        errorMessage.textContent = "Este nombre de usuario ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
            } else if (document.getElementById('step5_juridico').style.display !== 'none') {
                const is_representative = document.getElementById('is_representative').checked;
                // Si el checkbox está marcado, validar los campos
                if (is_representative) {
                    const representative_name = document.getElementById('representative_name').value.trim();
                    const representative_last_name = document.getElementById('representative_last_name').value.trim();
                    const representative_id_number = document.getElementById('representative_id_number').value.trim();
                    const representative_phone = document.getElementById('representative_phone').value.trim();
                    const representative_email = document.getElementById('representative_email').value.trim();

                    if (!representative_name) {
                        isValid = false;
                        errorMessage.textContent = "El nombre del representante es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!onlyLettersRegex.test(representative_name)) {
                        isValid = false;
                        errorMessage.textContent = "El nombre del representante solo debe contener letras.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!representative_last_name) {
                        isValid = false;
                        errorMessage.textContent = "El apellido del representante es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!onlyLettersRegex.test(representative_last_name)) {
                        isValid = false;
                        errorMessage.textContent = "El apellido del representante solo debe contener letras.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!representative_id_number) {
                        isValid = false;
                        errorMessage.textContent = "El CI o pasaporte del representante es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (representative_id_number.length < 8) {
                        isValid = false;
                        errorMessage.textContent = "El CI o Pasaporte es invalido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!representative_phone) {
                        isValid = false;
                        errorMessage.textContent = "El contacto del representante es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!nitRegex.test(representative_phone)) {
                        isValid = false;
                        errorMessage.textContent = "El contacto solo admite dígitos numéricos.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (representative_phone.length < 8) {
                        isValid = false;
                        errorMessage.textContent = "El contacto debe tener mínimo 8 dígitos numéricos.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!representative_email) {
                        isValid = false;
                        errorMessage.textContent = "El campo correo del representante es requerido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    } else if (!emailRegex.test(representative_email)) {
                        isValid = false;
                        errorMessage.textContent = "El correo no es valido.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
            }
        } else if (this.currentStep === 6) {
            if (document.getElementById('step5_natural').style.display !== 'none') {// Validar que se haya aceptado los términos
                const acceptedTerms = document.getElementById('accept_terms').checked;

                if (!acceptedTerms) {
                    isValid = false;
                    errorMessage.textContent = "Debes aceptar los términos y condiciones para continuar.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                }
            } else if (document.getElementById('step4_comun').style.display !== 'none') {
                // Validar campos para usuario natural
                const login = document.getElementById('login').value.trim();
                const password = document.getElementById('password').value.trim();
                const confirm_password = document.getElementById('confirm_password').value.trim();

                if (!login) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca el usuario."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!password) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca la contaseña."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (password.length < 8) {
                    isValid = false;
                    errorMessage.textContent = "La contraseña debe tener un mínimo de 8 caracteres.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (!confirm_password) {
                    isValid = false;
                    errorMessage.textContent = "Por favor, introduzca la confirmación de la contaseña."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                } else if (password !== confirm_password) {
                    isValid = false;
                    errorMessage.textContent = "Las contaseñas no coinciden."
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                }

                // ✅ Validar si el login ya existe
                if (isValid) {
                    const loginExists = await this.checkLoginExists(login);
                    if (loginExists) {
                        isValid = false;
                        errorMessage.textContent = "Este nombre de usuario ya está en uso.";
                        errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                    }
                }
            }
        } else if (this.currentStep === 7) {
            if (document.getElementById('step5_natural').style.display !== 'none') {// Validar que se haya aceptado los términos
                const acceptedTerms = document.getElementById('accept_terms').checked;

                if (!acceptedTerms) {
                    isValid = false;
                    errorMessage.textContent = "Debes aceptar los términos y condiciones para continuar.";
                    errorMessage.style.display = 'inline'; // Mostrar mensaje de error
                }
            }
        }

        return isValid; // Devuelve el resultado de la validación
    },

    async checkLoginExists(login) {
        try {
            const result = await this.rpc('/check_user_login', {login});
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el usuario:', error);
            return false; // en caso de error, asumir que no existe para no bloquear
        }
    },

    async checkPhoneExists(phone) {
        try {
            const result = await this.rpc('/check_user_phone', {phone});
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el usuario:', error);
            return false; // en caso de error, asumir que no existe para no bloquear
        }
    },

    async checkEmailExists(email) {
        try {
            const result = await this.rpc('/check_user_email', {email});
            return result.exists;
        } catch (error) {
            console.error('Error al verificar el usuario:', error);
            return false; // en caso de error, asumir que no existe para no bloquear
        }
    },

    _onClickNext: async function (event) {
        event.preventDefault();

        // Ocultar el mensaje de error si existe
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        const userType = this._getUserType();
        const selectedRadio = document.querySelector('input[name="user_type"]:checked');
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        // Si estamos en el paso 1, validar selección
        if (this.currentStep === 1) {
            if (!selectedRadio) {
                errorMessage.textContent = "Seleccione un tipo de usuario.";
                errorMessage.style.display = 'inline';
                return;
            }
        }

        // Validar campos según el paso actual
        if (!await this.validateFields()) {
            return; // Detener si no es válido
        }

        // CASO ESPECIAL: Persona Jurídica con módulo instalado
        // Flujo simplificado: Inicio → Seguridad → Final
        if (isJuridicoWithModule) {
            if (this.currentStep === 1) {
                // Paso 1: Inicio → Saltar directamente a Seguridad (paso 4)
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step4_comun').style.display = 'block';
                this.currentStep = 4; // Saltar a Seguridad
            } else if (this.currentStep === 4) {
                // Paso 4: Seguridad → Final
                document.getElementById('step4_comun').style.display = 'none';
                document.getElementById('step5_natural').style.display = 'block';
                this.currentStep = 5; // Mover a Final
                // Cambiar botón a "Finalizar"
                const nextButton = document.getElementById('next-button');
                if (nextButton) {
                    nextButton.textContent = 'Finalizar';
                }
            } else if (this.currentStep === 5) {
                // Paso 5: Enviar formulario
                this._submitForm();
                return;
            }
            this.updateProgress(userType);
            return;
        }

        // CASO NORMAL: Persona Natural o Jurídico sin módulo
        // Determinar el siguiente paso según la lógica normal
        let nextStep = this.currentStep + 1;
        let nextStepId = '';
        let currentStepId = '';

        // 🔥 CORRECCIÓN: La lógica debe incluir datos bancarios SOLO cuando corresponda
        switch (this.currentStep) {
            case 1:
                currentStepId = 'step1';
                nextStepId = userType === 'natural' ? 'step2_natural' : 'step2_juridico';
                break;
            case 2:
                currentStepId = userType === 'natural' ? 'step2_natural' : 'step2_juridico';
                // 🔥 CORRECCIÓN: Determinar si mostrar datos bancarios según configuración
                if (this.isBankAccountsStepVisible) {
                    // Mostrar datos bancarios si está habilitado
                    nextStepId = 'step2_comun';
                } else {
                    // Saltar datos bancarios
                    nextStepId = userType === 'natural' ? 'step3_natural' : 'step3_juridico';
                    nextStep = 3; // Ajustar número de paso
                }
                break;
            case 3:
                currentStepId = 'step2_comun';
                nextStepId = userType === 'natural' ? 'step3_natural' : 'step3_juridico';
                break;
            case 4:
                currentStepId = userType === 'natural' ? 'step3_natural' : 'step3_juridico';
                nextStepId = userType === 'natural' ? 'step4_comun' : 'step5_juridico';
                break;
            case 5:
                currentStepId = userType === 'natural' ? 'step4_comun' : 'step5_juridico';
                if (userType === 'natural') {
                    nextStepId = 'step5_natural';
                } else {
                    nextStepId = 'step4_comun';
                }
                break;
            case 6:
                if (userType === 'juridico' && !this.isImportBackendInstalled) {
                    currentStepId = 'step4_comun';
                    nextStepId = 'step5_natural';
                    nextStep = 7;
                } else if (userType === 'natural') {
                    this._submitForm();
                    return;
                }
                break;
            case 7:
                this._submitForm();
                return;
        }

        // Ocultar paso actual y mostrar siguiente
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

        // Cambiar texto del botón si estamos en el último paso
        const nextButton = document.getElementById('next-button');
        if (nextButton) {
            const isLastStepNatural = (userType === 'natural' && this.currentStep === 6);
            const isLastStepJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled && this.currentStep === 5);
            const isLastStepJuridicoWithoutModule = (userType === 'juridico' && !this.isImportBackendInstalled && this.currentStep === 7);

            if (isLastStepNatural || isLastStepJuridicoWithModule || isLastStepJuridicoWithoutModule) {
                nextButton.textContent = 'Finalizar';
            } else {
                nextButton.textContent = 'Siguiente';
            }
        }

        this.updateProgress(userType);
    },

    _saveStep2Data: function () {
        // Guardamos en this._formData para usarlos después
        this._formData = this._formData || {};

        const reeupInput = document.getElementById('reeup');
        const nitInput = document.getElementById('nit');

        if (reeupInput) this._formData.reeup = reeupInput.value.trim();
        if (nitInput) this._formData.nit = nitInput.value.trim();
    },

    _showNextStep: function (userType, currentStepId, nextStepIds) {
        // Solo agregamos verificaciones de existencia de elementos
        const currentStep = document.getElementById(currentStepId);
        if (currentStep) {
            currentStep.style.display = 'none';
        }

        const nextStep = document.getElementById(userType === 'natural' ? nextStepIds[0] : nextStepIds[1]);
        if (nextStep) {
            nextStep.style.display = 'block';
        }
    },

    _showCommonStep: function (naturalStepId, juridicoStepId, nextStepId) {
        // Solo agregamos verificaciones de existencia de elementos
        const naturalStep = document.getElementById(naturalStepId);
        const juridicoStep = document.getElementById(juridicoStepId);
        const nextStep = document.getElementById(nextStepId);

        if (naturalStep) naturalStep.style.display = 'none';
        if (juridicoStep) juridicoStep.style.display = 'none';
        if (nextStep) nextStep.style.display = 'block';
    },

    _onClickPrev: function (event) {
        event.preventDefault();

        // 🔥 LIMPIAR MENSAJE DE ERROR AL RETROCEDER
        const errorMessage = document.getElementById('error-message');
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        // CASO ESPECIAL: Persona Jurídica con módulo instalado
        if (isJuridicoWithModule) {
            if (this.currentStep === 5) { // Si estamos en Final
                // Ocultar Final
                document.getElementById('step5_natural').style.display = 'none';
                // Mostrar Seguridad
                document.getElementById('step4_comun').style.display = 'block';
                this.currentStep = 4;
            } else if (this.currentStep === 4) { // Si estamos en Seguridad
                // Ocultar Seguridad
                document.getElementById('step4_comun').style.display = 'none';
                // Mostrar Inicio
                document.getElementById('step1').style.display = 'block';
                this.currentStep = 1;
            }
            this.updateProgress(userType);
            return;
        }

        // CASO NORMAL: Persona Natural o Jurídico sin módulo
        // Lógica para retroceder en el flujo normal
        let prevStep = this.currentStep - 1;
        let prevStepId = '';
        let currentStepId = '';

        // Primero ocultar el paso actual
        switch (this.currentStep) {
            case 2:
                currentStepId = userType === 'natural' ? 'step2_natural' : 'step2_juridico';
                prevStepId = 'step1';
                break;
            case 3:
                currentStepId = 'step2_comun';
                prevStepId = userType === 'natural' ? 'step2_natural' : 'step2_juridico';
                break;
            case 4:
                currentStepId = userType === 'natural' ? 'step3_natural' : 'step3_juridico';
                // 🔥 CORRECCIÓN: Al retroceder desde paso 4, verificar si debe ir a datos bancarios
                if (this.isBankAccountsStepVisible) {
                    prevStepId = 'step2_comun';
                } else {
                    prevStepId = userType === 'natural' ? 'step2_natural' : 'step2_juridico';
                    prevStep = 2; // Saltar paso 3
                }
                break;
            case 5:
                currentStepId = userType === 'natural' ? 'step4_comun' : 'step5_juridico';
                prevStepId = userType === 'natural' ? 'step3_natural' : 'step3_juridico';
                break;
            case 6:
                if (userType === 'natural') {
                    currentStepId = 'step5_natural';
                    prevStepId = 'step4_comun';
                } else {
                    currentStepId = 'step4_comun';
                    prevStepId = 'step5_juridico';
                }
                break;
            case 7:
                currentStepId = 'step5_natural';
                prevStepId = 'step4_comun';
                break;
            default:
                return;
        }

        // Ocultar paso actual
        if (currentStepId) {
            const currentStep = document.getElementById(currentStepId);
            if (currentStep) currentStep.style.display = 'none';
        }

        // 🔥 IMPORTANTE: También ocultar cualquier otro paso que pueda estar visible
        // Especialmente para usuarios naturales cuando los datos bancarios están ocultos
        if (userType === 'natural' && !this.isBankAccountsStepVisible) {
            // Asegurarse de que el paso de datos bancarios esté oculto
            const step2Comun = document.getElementById('step2_comun');
            if (step2Comun) step2Comun.style.display = 'none';
        }

        // Mostrar paso anterior
        if (prevStepId) {
            const prevStepElement = document.getElementById(prevStepId);
            if (prevStepElement) {
                prevStepElement.style.display = 'block';
                this.currentStep = prevStep;
            }
        }

        // Actualizar texto del botón "Siguiente" si es necesario
        const nextButton = document.getElementById('next-button');
        if (nextButton) {
            if (this.currentStep < (userType === 'juridico' ? 7 : 6)) {
                nextButton.textContent = 'Siguiente';
            } else {
                nextButton.textContent = 'Finalizar';
            }
        }

        this.updateProgress(userType);
    },

// Nueva función auxiliar para mostrar el paso activo actual
    _showActiveStep: function () {
        const userType = this._getUserType();
        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        // CASO ESPECIAL: Persona Jurídica con módulo instalado
        if (isJuridicoWithModule) {
            // Definir pasos para jurídico con módulo
            const steps = ['step1', null, null, 'step4_comun', 'step5_natural'];

            // Ocultar todos los pasos primero
            document.querySelectorAll('[id^="step"]').forEach(step => {
                if (step.id.startsWith('step') && !step.id.includes('-')) {
                    step.style.display = 'none';
                }
            });

            // Mostrar solo el paso actual
            const currentStepId = steps[this.currentStep - 1];
            if (currentStepId) {
                const currentStep = document.getElementById(currentStepId);
                if (currentStep) currentStep.style.display = 'block';
            }
            return;
        }

        // CASO NORMAL: Persona Natural o Jurídico sin módulo
        // Construir lista de pasos según visibilidad de datos bancarios
        let allSteps = ['step1'];

        if (userType === 'natural') {
            allSteps.push('step2_natural');
            if (this.isBankAccountsStepVisible) {
                allSteps.push('step2_comun');
            }
            allSteps.push('step3_natural');
            allSteps.push('step4_comun');
            allSteps.push('step5_natural');
        } else { // jurídico sin módulo
            allSteps.push('step2_juridico');
            if (this.isBankAccountsStepVisible) {
                allSteps.push('step2_comun');
            }
            allSteps.push('step3_juridico');
            allSteps.push('step5_juridico');
            allSteps.push('step4_comun');
            allSteps.push('step5_natural');
        }

        // Ocultar todos los pasos primero
        document.querySelectorAll('[id^="step"]').forEach(step => {
            if (step.id.startsWith('step') && !step.id.includes('-')) {
                step.style.display = 'none';
            }
        });

        // 🔥 Asegurarse de que los pasos que no deberían estar visibles estén ocultos
        if (userType === 'natural' && !this.isBankAccountsStepVisible) {
            const step2Comun = document.getElementById('step2_comun');
            if (step2Comun) step2Comun.style.display = 'none';
        }

        // Mostrar solo el paso actual
        const currentStepId = allSteps[this.currentStep - 1];
        if (currentStepId) {
            const currentStep = document.getElementById(currentStepId);
            if (currentStep) {
                currentStep.style.display = 'block';
            }
        }
    },

    _showPreviousStep: function (currentStepId, previousStepId) {
        const current = document.getElementById(currentStepId);
        const previous = document.getElementById(previousStepId);
        if (current && previous) {
            current.style.display = 'none';
            previous.style.display = 'block';
        }
    },

    _getStepForUserType: function (naturalStepId, juridicoStepId) {
        return this._getUserType() === 'natural' ? naturalStepId : juridicoStepId;
    },

   _getUserType: function () {
        const isStep1Visible = document.getElementById('step-1')?.offsetParent !== null;
        if (!isStep1Visible) {
            return 'juridico';
        }
        const selectedRadio = document.querySelector('input[name="user_type"]:checked');
        return selectedRadio ? selectedRadio.value : 'juridico';
    },

        updateProgress: function (userType = null) {
        if (!userType) {
            const selectedRadio = document.querySelector('input[name="user_type"]:checked');
            userType = selectedRadio ? selectedRadio.value : 'juridico';
        }

        const isJuridicoWithModule = (userType === 'juridico' && this.isImportBackendInstalled);

        // Para usuario natural o jurídico sin módulo: mostrar todos los pasos según configuración
        // Para jurídico con módulo: solo mostrar pasos 1, 4, 5
        for (let i = 1; i <= 6; i++) {
            const stepElement = document.getElementById('step-' + i);
            if (!stepElement) continue;

            // Determinar qué pasos mostrar según el tipo de usuario
            if (isJuridicoWithModule) {
                // Para jurídico con módulo, solo mostrar pasos 1, 4, 5
                if (i === 2 || i === 3) {
                    stepElement.style.display = 'none'; // Ocultar datos generales y bancarios
                    continue;
                } else {
                    stepElement.style.display = ''; // Mostrar paso
                }
            } else {
                // Para otros casos, mostrar pasos según configuración
                if (i === 2) {
                    stepElement.style.display = ''; // Mostrar datos generales
                } else if (i === 3) {
                    // Mostrar datos bancarios solo si está habilitado
                    stepElement.style.display = this.isBankAccountsStepVisible ? '' : 'none';
                } else if (i >= 4) {
                    stepElement.style.display = ''; // Mostrar resto de pasos
                }
            }

            // Actualizar estado del paso según currentStep
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

        // Manejar botón anterior
        const prevButton = document.querySelector('.prev');
        if (isJuridicoWithModule) {
            // Para jurídico con módulo, solo deshabilitar en paso 1
            prevButton.disabled = (this.currentStep === 1);
        } else {
            // Para otros casos, deshabilitar en paso 1
            prevButton.disabled = (this.currentStep === 1);
        }
    },

    _submitForm: async function () {
        this._collectAccountDetails();

        const reeup = this._formData?.reeup || '';
        const nit = this._formData?.nit || '';

        if (reeup || nit) {
            try {
                // Hacer la llamada RPC para verificar si el usuario está cancelado
                const response = await this.rpc('/check_cancelled_user', {
                    reeup: reeup,
                    nit: nit,
                });

                if (response.cancelled) {
                    const $errorModal = $(`
                        <div class="modal fade" tabindex="-1" role="dialog" id="cancelledUserModal">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content border-danger">
                                    <div class="modal-header bg-danger text-white">
                                        <h5 class="modal-title">❌ Registro Cancelado</h5>
                                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>Usted fue cancelado en nuestro sistema, por lo que no podrá registrarse de nuevo.</p>
                                        <p>Ante cualquier reclamación por favor dirigirse presencialmente a nuestras oficinas o contactar con el equipo comercial.</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" id="cancelledModalCloseBtn">Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);

                    $errorModal.appendTo('body').modal('show');

                    // Al cerrar el modal redirige al home
                    $errorModal.find('#cancelledModalCloseBtn').on('click', () => {
                        $errorModal.modal('hide');
                    });

                    $errorModal.on('hidden.bs.modal', () => {
                        $errorModal.remove();
                        window.location.href = '/';
                    });

                    return;  // Para que no siga el proceso
                }

            } catch (error) {
                console.error('Error al verificar usuario cancelado:', error);
                // Continuar con el registro si hay error en la verificación
            }
        }

        // Resto del código para enviar el formulario...
        const $modal = $(`
        <div class="modal fade" tabindex="-1" role="dialog" id="userRegisteredModal">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">✅ Registro Exitoso</h5>
                    </div>
                    <div class="modal-body">
                        <p>Su usuario ha sido creado satisfactoriamente.</p>
                        ${!document.getElementById('o_logout') ? `
                            <div class="alert alert-info mt-3">
                                Ahora puede iniciar sesión con su cuenta recién creada.
                            </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `);

        $modal.appendTo('body').modal('show');

        $modal.on('hidden.bs.modal', () => {
            $modal.remove();
        });

        setTimeout(() => {
            const form = document.querySelector('.register-form');
            if (form) {
                form.submit();
            }
        }, 3000);
    },

    _collectAccountDetails: function () {
        var accountDetails = Array.from(document.querySelectorAll('input[name^="account_number_"]'))
            .filter(input => input.value.trim() !== '') // Filtrar entradas vacías
            .map(input => {
                return {
                    type: input.getAttribute('data-account-type'), // Obtener tipo de cuenta
                    number: input.value.trim()
                };
            });

        if (accountDetails.length > 0) {
            var accountDetailsInput = document.createElement('input');
            accountDetailsInput.type = 'hidden';
            accountDetailsInput.name = 'account_details';
            accountDetailsInput.value = JSON.stringify(accountDetails);
            document.querySelector('form').appendChild(accountDetailsInput);
        }
    },

    _onRepresentativeToggle: function () {
        var isRepresentativeChecked = document.getElementById('is_representative').checked;
        document.getElementById('representative_name_group').style.display = isRepresentativeChecked ? 'block' : 'none';
        document.getElementById('representative_last_name_group').style.display = isRepresentativeChecked ? 'block' : 'none';
        document.getElementById('representative_id_number_group').style.display = isRepresentativeChecked ? 'block' : 'none';
        document.getElementById('representative_phone_group').style.display = isRepresentativeChecked ? 'block' : 'none';
        document.getElementById('representative_email_group').style.display = isRepresentativeChecked ? 'block' : 'none';
    },

    _onUploadBtnClick: function (event) {
        event.preventDefault();
        const $button = $(event.currentTarget);
        const inputId = $button.data('input-id');
        const $inputFile = $(`#${inputId}`);

        // Agregar atributo accept para restringir en el navegador
        $inputFile.attr('accept', '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif');

        $inputFile.click();

        // Eliminar cualquier handler anterior y agregar uno nuevo
        $inputFile.off('change').on('change', () => {
            if ($inputFile[0].files.length > 0) {
                const fileName = $inputFile[0].files[0].name;
                const $container = $button.closest('.upload-container');

                $button.hide();

                const $fileDisplay = $(`
                <div class="uploaded-file-display" style="display: flex; gap: 10px; align-items: center;">
                    <span class="file-name" style="font-size: 14px;">📎 ${fileName}</span>
                    <button type="button" class="remove-upload-btn" data-input-id="${inputId}" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px;">Eliminar</button>
                </div>
            `);

                $container.append($fileDisplay);
            }
        });
    },

    _removeUploadedFile: function (event) {
        event.preventDefault();
        const $removeBtn = $(event.currentTarget);
        const inputId = $removeBtn.data('input-id');
        const $container = $removeBtn.closest('.upload-container');
        const $fileInput = $(`#${inputId}`);
        const $uploadBtn = $container.find(`.upload-btn[data-input-id="${inputId}"]`);

        // Limpiar input file
        $fileInput.val('');

        // Mostrar el botón de subir archivo de nuevo y eliminar visualización del archivo
        $uploadBtn.show();
        $container.find('.uploaded-file-display').remove();
    },

    _onTogglePasswordClick: function (event) {
        const button = event.currentTarget;
        const targetSelector = button.dataset.target;
        const input = document.querySelector(targetSelector);

        if (input) {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            // Cambiar el ícono de ojo
            button.querySelector('i').classList.toggle('fa-eye');
            button.querySelector('i').classList.toggle('fa-eye-slash');
        }
    },

    // 🔁 Carga dinámica de municipios según la provincia seleccionada
    _onProvinceChange: async function (event) {
        const stateId = parseInt(event.target.value);
        const $municipalitySelect = this.$('#res_municipality_id');

        $municipalitySelect.empty().append(
            $('<option>', {value: '', text: 'Cargando municipios...'})
        );

        if (stateId) {
            try {
                const data = await this.rpc('/get_municipalities', {state_id: stateId});
                $municipalitySelect.empty().append(
                    $('<option>', {value: '', text: 'Seleccione el municipio'})
                );
                data.forEach(city => {
                    $municipalitySelect.append(
                        $('<option>', {value: city.id, text: city.name})
                    );
                });
            } catch (error) {
                console.error('Error cargando municipios:', error);
                $municipalitySelect.empty().append(
                    $('<option>', {value: '', text: 'Error al cargar municipios'})
                );
            }
        } else {
            $municipalitySelect.empty().append(
                $('<option>', {value: '', text: 'Seleccione el municipio'})
            );
        }
    },
});

return publicWidget.registry.RegistrationForm;

