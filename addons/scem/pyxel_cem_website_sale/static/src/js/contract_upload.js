/** @odoo-module **/

// Para el frontend/portal, podemos usar un approach más simple
const { onMounted } = owl;

export class ContractUploadManager {
    constructor() {
        console.log('✅ contract_upload.js: Constructor ejecutado');

        this.CONFIG = {
            MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
            ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif'],
            ALLOWED_MIME_TYPES: [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/bmp',
                'image/tiff'
            ],
            UPLOAD_ENDPOINT: '/my/contract/do_upload'
        };

        this.currentFile = null;
        this.init();
    }

    init() {
        console.log('🚀 contract_upload.js: Inicializando manager...');

        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.setup.bind(this));
        } else {
            this.setup();
        }
    }

    setup() {

        this.contractForm = document.querySelector('form[action="/my/contract/do_upload"]');
        this.fileInput = document.getElementById('contract_file');
        this.uploadButton = this.contractForm?.querySelector('button[type="submit"]');

        console.log('🔍 contract_upload.js: Elementos encontrados:', {
            form: this.contractForm,
            fileInput: this.fileInput,
            uploadButton: this.uploadButton
        });

        if (!this.contractForm || !this.fileInput) {
            console.warn('⚠️ contract_upload.js: Formulario o input file no encontrados');
            return;
        }

        this.setupEventListeners();
        this.setupFileValidation();
        this.handleServerMessages();

    }

    setupEventListeners() {
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.contractForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.contractForm.addEventListener('dragover', this.preventDefault.bind(this));
        this.contractForm.addEventListener('drop', this.handleFileDrop.bind(this));

    }

    setupFileValidation() {

         this.fileInput.setAttribute('accept', '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif');
        this.fileInput.setAttribute('data-max-size', this.CONFIG.MAX_FILE_SIZE.toString());
    }

    handleFileSelect(event) {

        const file = event.target.files[0];
        if (!file) {
            console.log('📁 contract_upload.js: No se seleccionó archivo');
            return;
        }

        console.log('🔍 contract_upload.js: Validando archivo:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        const validation = this.validateFile(file);

        if (!validation.isValid) {
            console.error('❌ contract_upload.js: Validación fallida:', validation.message);
            this.showError(validation.message);
            this.resetFileInput();
            return;
        }

        this.currentFile = file;
        this.showSuccess(`Archivo seleccionado: ${file.name} (${this.formatFileSize(file.size)})`);
        this.updateFileInfo(file);
    }

    handleFileDrop(event) {
        this.preventDefault(event);

        const files = event.dataTransfer.files;

        if (files.length > 0) {
            this.fileInput.files = files;
            // Disparar evento change manualmente
            const changeEvent = new Event('change', { bubbles: true });
            this.fileInput.dispatchEvent(changeEvent);
        }
    }

    handleFormSubmit(event) {

        if (!this.currentFile) {
            console.warn('⚠️ contract_upload.js: No hay archivo seleccionado');
            event.preventDefault();
            this.showError('Por favor, seleccione un archivo');
            return;
        }

        const validation = this.validateFile(this.currentFile);
        if (!validation.isValid) {
            console.error('❌ contract_upload.js: Validación fallida en submit:', validation.message);
            event.preventDefault();
            this.showError(validation.message);
            return;
        }
        this.showLoadingState();
    }

    validateFile(file) {

        // Validar tipo de archivo
        const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
        console.log('🔍 contract_upload.js: Extensión del archivo:', fileExtension);

        if (!this.CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
            console.error('❌ contract_upload.js: Extensión no permitida');
            return {
                 isValid: false,
                message: `Formato no permitido. Formatos aceptados: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF`
            };
        }

        // Validar tamaño
        console.log('🔍 contract_upload.js: Tamaño del archivo:', file.size, 'bytes');
        if (file.size > this.CONFIG.MAX_FILE_SIZE) {
            console.error('❌ contract_upload.js: Archivo demasiado grande');
            return {
                isValid: false,
                message: `Archivo demasiado grande. Tamaño máximo: ${this.formatFileSize(this.CONFIG.MAX_FILE_SIZE)}`
            };
        }

        // Validar nombre (caracteres peligrosos)
        const dangerousChars = /[<>:"/\\|?*]/;
        if (dangerousChars.test(file.name)) {
            console.error('❌ contract_upload.js: Nombre con caracteres peligrosos');
            return {
                isValid: false,
                message: 'El nombre del archivo contiene caracteres no permitidos'
            };
        }

        console.log('✅ contract_upload.js: Archivo validado correctamente');
        return { isValid: true, message: '' };
    }

    showError(message) {
        console.error('❌ contract_upload.js: Mostrando error:', message);
        this.clearMessages();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <i class="fa fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.contractForm.parentNode.insertBefore(errorDiv, this.contractForm);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        console.log('✅ contract_upload.js: Mostrando éxito:', message);
        this.clearMessages();

        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        successDiv.innerHTML = `
            <i class="fa fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.contractForm.parentNode.insertBefore(successDiv, this.contractForm);
    }

    showLoadingState() {

        if (this.uploadButton) {
            const originalText = this.uploadButton.innerHTML;
            this.uploadButton.disabled = true;
            this.uploadButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Subiendo...
            `;

            // Restaurar después de 30 segundos (timeout)
            setTimeout(() => {
                if (this.uploadButton.disabled) {
                    this.uploadButton.disabled = false;
                    this.uploadButton.innerHTML = originalText;
                }
            }, 30000);
        }
    }

    updateFileInfo(file) {

        let fileInfo = this.contractForm.querySelector('.file-info');
        if (!fileInfo) {
            fileInfo = document.createElement('div');
            fileInfo.className = 'file-info mt-2';
            this.contractForm.appendChild(fileInfo);
        }

        fileInfo.innerHTML = `
            <div class="card">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${file.name}</strong>
                            <div class="text-muted small">${this.formatFileSize(file.size)}</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="contractUploadManager.removeFile()">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    removeFile() {
        this.resetFileInput();
        this.currentFile = null;

        const fileInfo = this.contractForm.querySelector('.file-info');
        if (fileInfo) {
            fileInfo.remove();
            console.log('✅ contract_upload.js: Información del archivo eliminada');
        }

        this.clearMessages();
        console.log('✅ contract_upload.js: Archivo completamente eliminado');
    }

    resetFileInput() {
        this.fileInput.value = '';
        this.currentFile = null;
    }

    clearMessages() {
        const alerts = this.contractForm.parentNode.querySelectorAll('.alert');
        console.log(`🧹 contract_upload.js: Encontrados ${alerts.length} mensajes para limpiar`);
        alerts.forEach(alert => alert.remove());
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    preventDefault(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    handleServerMessages() {

        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const success = urlParams.get('success');

        console.log('🌐 contract_upload.js: Parámetros URL - error:', error, 'success:', success);

        if (error) {
            console.log('🌐 contract_upload.js: Mostrando error del servidor:', error);
            this.showServerError(error);
        }

        if (success === 'contract_uploaded') {
            console.log('🌐 contract_upload.js: Mostrando éxito del servidor');
            this.showServerSuccess();
        }
    }

    showServerError(errorType) {
        console.log('🌐 contract_upload.js: Procesando error del servidor:', errorType);

        const messages = {
            'no_file': 'Por favor, seleccione un archivo para subir',
            'invalid_format': 'Formato de archivo no válido. Solo se permiten PDF e imágenes (JPG, PNG, GIF, BMP, TIFF)',
            'no_contract': 'No hay contrato disponible para subir',
            'upload_error': 'Error al subir el contrato. Por favor, intente nuevamente',
            'file_too_large': 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB'
        };

        const message = messages[errorType] || 'Error desconocido';
        console.log('🌐 contract_upload.js: Mensaje de error:', message);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <i class="fa fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const contractSection = document.getElementById('contract-section');
        if (contractSection) {
            contractSection.insertBefore(errorDiv, contractSection.firstChild);
            console.log('✅ contract_upload.js: Error del servidor mostrado en el DOM');
        } else {
            console.error('❌ contract_upload.js: No se encontró la sección de contratos');
        }

        this.cleanUrlParams();
    }

    showServerSuccess() {

        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        successDiv.innerHTML = `
            <i class="fa fa-check-circle me-2"></i>
            Contrato subido exitosamente
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const contractSection = document.getElementById('contract-section');
        if (contractSection) {
            contractSection.insertBefore(successDiv, contractSection.firstChild);
            console.log('✅ contract_upload.js: Éxito del servidor mostrado en el DOM');
        } else {
            console.error('❌ contract_upload.js: No se encontró la sección de contratos');
        }

        this.cleanUrlParams();
    }

    cleanUrlParams() {
        const url = new URL(window.location);
        url.searchParams.delete('error');
        url.searchParams.delete('success');
        window.history.replaceState({}, '', url);
    }
}

// Inicialización automática cuando el módulo se carga
let contractUploadManager;

try {
    contractUploadManager = new ContractUploadManager();

    // Hacer disponible globalmente
    window.contractUploadManager = contractUploadManager;

} catch (error) {
    console.error('❌ contract_upload.js: Error inicializando manager:', error);
}