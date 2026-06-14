import requests
from odoo import http
from odoo.http import request
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
import mimetypes
import base64
import logging
import os
import re
import secrets

_logger = logging.getLogger(__name__)

# Validación básica de formato de correo electrónico.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CustomSignup(AuthSignupHome):

    @http.route('/web/signup', type='http', auth='public', website=True)
    def web_auth_signup(self, **post):
        # Registro básico con verificación de correo en DOS PASOS:
        #   Paso 1: correo · nombre · contraseña → se envía un código al correo
        #           (NO se crea el usuario todavía; los datos quedan en sesión).
        #   Paso 2: el usuario introduce el código → se crea el usuario portal,
        #           auto-login y redirect.
        # La acreditación de empresa (datos + documentos) se realiza como un
        # paso a paso dentro del checkout mayorista, no aquí.
        if not post.get('user_type'):
            return self._signup_basico(**post)

        error = None

        # Verificar si el módulo pyxel_import_backend está instalado
        import_backend_installed = request.env['ir.module.module'].sudo().search_count([
            ('name', '=', 'pyxel_import_backend'),
            ('state', '=', 'installed')
        ])

        # Solo validar reCAPTCHA si es una solicitud POST
        if request.httprequest.method == 'POST':
            try:
                # Datos comunes
                user_type = post.get('user_type')
                email = post.get('email') or post.get('email1')
                password = post.get('password')
                login = post.get('login')

                # Validar que el correo no exista
                existing_user = request.env['res.users'].sudo().search([('login', '=', login)], limit=1)
                if existing_user:
                    error = "Ya exisite un usuario con ese nombre de usuario."
                    return request.render('auth_signup.signup', {'error': error})

                # Datos del usuario
                partner_vals = {
                    'user_type': user_type,
                }

                # Si el módulo pyxel_import_backend está instalado Y es usuario natural, 
                # asignar valor por defecto al campo management_type
                if import_backend_installed and user_type == 'natural':
                    # Buscar el registro de tipo de gestión por defecto
                    # Ajusta 'importador' al valor exacto que necesitas (puede ser ID o nombre)
                    default_management_type = request.env['res.partner.management.type'].sudo().search([
                        ('name', '=', 'Persona Natural')  # Cambia esto por el valor correcto
                    ], limit=1)

                    if default_management_type:
                        partner_vals['management_type_id'] = default_management_type.id
                        _logger.info(
                            f"✅ Asignado tipo de gestión '{default_management_type.name}' a usuario natural {login}")
                    else:
                        _logger.warning(
                            f"⚠️ No se encontró el tipo de gestión 'Importador' para asignar a usuario natural")

                    default_contact_type = request.env['res.partner.contact.type'].sudo().search([
                        ('name', '=', 'Cliente nacional')
                    ], limit=1)

                    if default_contact_type:
                        partner_vals['contact_type_id'] = default_contact_type.id
                        _logger.info(
                            f"✅ Asignado tipo de contacto '{default_contact_type.name}' a usuario natural {login}")
                    else:
                        _logger.warning(
                            f"⚠️ No se encontró el tipo de contacto 'Cliente Nacional' para asignar a usuario natural")

                # Si es persona natural
                if user_type == 'natural':
                    partner_vals.update({
                        'name': post.get('name'),
                        'last_name': post.get('last_name'),
                        'vat': post.get('identification_num'),
                        'date_of_birth': post.get('date_of_birth'),
                        'phone': post.get('phone1'),
                        'phone2': post.get('phone2'),
                        'street': post.get('address1'),
                        'lang': request.context.get('lang', 'es_ES'),
                        'is_company': True,
                    })

                # Si es persona jurídica
                elif user_type == 'juridico':
                    # Campos obligatorios dependiendo de si el módulo está instalado
                    if import_backend_installed:
                        # Cuando el módulo está instalado, SOLO usuarios portal con datos básicos
                        # Los campos específicos de jurídico están ocultos, pero necesitamos un nombre
                        # Tomamos el nombre del formulario de registro básico
                        partner_vals.update({
                            'name': login,
                            'phone': post.get('phone1') or post.get('phone') or '',
                            'email': post.get('email1') or post.get('email') or '',
                            'user_type': user_type,
                        })
                    else:
                    # Cuando el módulo NO está instalado, todos los campos
                        partner_vals.update({
                            'name': post.get('name_entity'),
                            'name_entity': post.get('name_entity_short'),
                            'entity_type': post.get('entity_type'),
                            'street': post.get('address'),
                            'vat': post.get('nit'),
                            'reeup': post.get('reeup'),
                            'social_object': post.get('social_object'),
                            'phone': post.get('phone'),
                        })
                        c = request.env['res.country'].sudo().search([('code', '=', 'CU')], limit=1)

                        if post.get('res_municipality_id'):
                            municipio_id = post.get('res_municipality_id')
                            m = request.env['res.municipality'].sudo().search([('id', '=', municipio_id)], limit=1)

                            if m:
                                # 1. Asignar al campo res_municipality_id (heredado de l10n_cu_address)
                                partner_vals.update({
                                    'res_municipality_id': m.id,
                                })

                                # 2. Buscar o crear el municipio en res.city
                                city_domain = [
                                    ('name', 'ilike', m.name),
                                    ('state_id', '=', m.state_id.id),
                                    ('country_id', '=', c.id)
                                ]

                                city = request.env['res.city'].sudo().search(city_domain, limit=1)

                                if not city:
                                    # Crear el municipio en res.city si no existe
                                    city = request.env['res.city'].sudo().create({
                                        'name': m.name,
                                        'state_id': m.state_id.id,
                                        'country_id': c.id,
                                        # Si hay código postal en el modelo municipality, también puedes asignarlo
                                        'zipcode': m.zipcode if hasattr(m, 'zipcode') else False,
                                    })

                                # 3. Asignar el city_id al partner
                                partner_vals.update({
                                    'city': m.name,  # Campo char para compatibilidad
                                })

                        if post.get('state_id'):
                            provincia = post.get('state_id')
                            partner_vals.update({
                                'state_id': provincia,
                                'country_id': c.id,
                            })

                Partner = request.env['res.partner'].sudo()
                if 'x_studio_type_of_contect' in Partner._fields:
                    partner_vals.update({
                        'x_studio_type_of_contect': 'wholesale_customer',
                    })

                # Crear el contacto en res.partner
                partner = request.env['res.partner'].sudo().create(partner_vals)

                # CREAR OPORTUNIDAD (LEAD) EN CRM - SEGÚN LAS CONDICIONES
                # Solo crear oportunidad si:
                # 1. Es usuario natural (siempre crea oportunidad)
                # 2. Es usuario jurídico Y el módulo pyxel_import_backend NO está instalado
                create_opportunity = True
                if user_type == 'juridico' and import_backend_installed:
                    create_opportunity = False
                    _logger.info(
                        f"⚠️ No se crea oportunidad para usuario jurídico {partner.name} porque pyxel_import_backend está instalado")

                if create_opportunity:
                    # 🔥 LÓGICA MODIFICADA: Seleccionar etapa según si el módulo está instalado o no
                    if import_backend_installed:
                        # Si el módulo está instalado, buscar etapa con allows_sale = True
                        selected_stage = request.env['crm.stage'].sudo().search([
                            ('allows_sale', '=', True)
                        ], limit=1)

                        if selected_stage:
                            _logger.info(f"🔍 Módulo instalado - Usando etapa con allows_sale: '{selected_stage.name}'")
                        else:
                            # Fallback: si no encuentra, usa la primera etapa
                            selected_stage = request.env['crm.stage'].sudo().search([], limit=1)
                            _logger.warning(
                                f"⚠️ No se encontró etapa con 'allows_sale' marcado, usando primera etapa: {selected_stage.name if selected_stage else 'Ninguna'}")
                    else:
                        # Si el módulo NO está instalado, usar la primera etapa disponible (flujo normal)
                        selected_stage = request.env['crm.stage'].sudo().search([], limit=1)
                        _logger.info(
                            f"🔍 Módulo NO instalado - Usando primera etapa disponible: '{selected_stage.name if selected_stage else 'Ninguna'}'")

                    if selected_stage:
                        opportunity_vals = {
                            'partner_id': partner.id,
                            'stage_id': selected_stage.id,
                            'user_id': False,  # Asignar a un usuario si es necesario
                            'name': f'Oportunidad para {partner.name}',  # Nombre de la oportunidad
                        }
                        request.env['crm.lead'].sudo().create(opportunity_vals)
                        _logger.info(
                            f"✅ Oportunidad creada para {partner.name} en etapa '{selected_stage.name}' (allows_sale={selected_stage.allows_sale if hasattr(selected_stage, 'allows_sale') else 'N/A'})")
                    else:
                        _logger.error(f"❌ No se pudo crear oportunidad: No hay etapas disponibles en CRM")
                else:
                    _logger.info(
                        f"ℹ️ No se creó oportunidad para {partner.name} (Tipo: {user_type}, Módulo instalado: {import_backend_installed})")

                # Si es representante, crea el contacto hijo - SOLO cuando el módulo NO está instalado
                if post.get('is_representative') and not import_backend_installed:
                    representative_vals = {
                        'name': f"{post.get('representative_name', '')} {post.get('representative_last_name', '')}",
                        'email': post.get('representative_email'),
                        'phone': post.get('representative_phone'),
                        'representative_identification_num': post.get('representative_identification_num'),
                        'parent_id': partner.id,  # Muy importante
                        'type': 'contact',
                    }

                    

                    request.env['res.partner'].sudo().create(representative_vals)

                # 🔹 1️⃣ EXTRAER Y GUARDAR CUENTAS BANCARIAS 🔹
                if not import_backend_installed:
                    moneda_map = {
                        'corriente': 'CUP',
                        'gastos_cup': 'CUP',
                        'gastos_mlc': 'MLC',
                        'cuenta_usd_eur': 'USD',
                    }

                    # Recorrer claves del diccionario para buscar cuentas
                    for key, value in post.items():
                        if key.startswith('account_number_') and value.strip():
                            tipo_cuenta = key.replace('account_number_', '')  # Extraer el tipo
                            moneda = moneda_map.get(tipo_cuenta, 'CUP')  # Asignar moneda

                            # Buscar la moneda en Odoo
                            currency = request.env['res.currency'].sudo().search([('name', '=', moneda)], limit=1)

                            # Crear cuenta bancaria en res.partner.bank
                            request.env['res.partner.bank'].sudo().create({
                                'partner_id': partner.id,  # Asociar al contacto
                                'bank_id': False,  # Banco vacío
                                'acc_number': value.strip(),  # Número de cuenta
                                'currency_id': currency.id if currency else None,  # Moneda
                                'account_type': tipo_cuenta,  # Tipo de cuenta
                            })

                # 🔍 DIAGNÓSTICO INICIAL DE ARCHIVOS
                _logger.info("🔍 DIAGNÓSTICO INICIAL DE ARCHIVOS:")
                for field_name, file in request.httprequest.files.items():
                    if file and file.filename:
                        _logger.info(f"   📦 {field_name}: {file.filename} ({file.content_length} bytes)")
                    else:
                        _logger.info(f"   📦 {field_name}: Sin archivo")

                # Lista de extensiones permitidas (PDF y fotos)
                ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif']
                MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

                # Lista de campos de documentos que se van a cargar
                if user_type == 'juridico':
                    # 🔍 DETECTAR QUÉ TIPO DE DOCUMENTOS PROCESAR
                    entity_type = post.get('entity_type')
                    _logger.info(f"🔍 Tipo de entidad seleccionada: {entity_type}")

                    # MAPEO COMPLETO de documentos CON SUS TIPOS
                    DOCUMENTOS_MAPPING = {
                        # Documentos generales (siempre presentes en el formulario)
                        'documento_constitutivo': 'documento_constitutivo',
                        'documento_existencia': 'documento_existencia',
                        'documento_registro_mercantil': 'documento_registro_mercantil',
                        'documento_registro_contribuyente': 'documento_registro_contribuyente',
                        'documento_licencia_comercio': 'documento_licencia_comercio',
                        'documento_carta_timbrada': 'documento_carta_timbrada',
                        'documento_carnet_acorec': 'documento_carnet_acorec',
                        'documento_perfil_cliente': 'documento_perfil_cliente',

                        # Documentos específicos por tipo de entidad (si existen en el formulario)
                        'documento_estatal_1': 'documento_estatal_1',
                        'documento_estatal_2': 'documento_estatal_2',
                        'documento_firma_1': 'documento_firma_1',
                        'documento_firma_2': 'documento_firma_2',
                        'documento_mipime_1': 'documento_mipime_1',
                        'documento_mipime_2': 'documento_mipime_2',
                        'documento_tcp_1': 'documento_tcp_1',
                        'documento_tcp_2': 'documento_tcp_2',
                    }

                    _logger.info("📂 Procesando TODOS los documentos...")
                    documentos_subidos = False

                    # 🔄 PROCESAR TODOS LOS DOCUMENTOS (generales + específicos)
                    for field_name, doc_type in DOCUMENTOS_MAPPING.items():
                        file = request.httprequest.files.get(field_name)

                        # Validar si el archivo realmente fue subido
                        if not file or not file.filename or file.filename.strip() == '':
                            _logger.info(f"📭 No se subió archivo para '{field_name}'")
                            continue

                        try:

                            # ✅ VALIDAR EXTENSIÓN DEL ARCHIVO
                            file_extension = os.path.splitext(file.filename.lower())[1]
                            if file_extension not in ALLOWED_EXTENSIONS:
                                _logger.error(f"❌ Extensión no permitida para '{field_name}': {file_extension}")
                                error = f"Formato de archivo no válido para '{field_name}'. Solo se permiten PDF e imágenes."
                                return request.render('auth_signup.signup', {'error': error})

                            file_data = file.read()
                            file_name = file.filename

                            # ✅ VERIFICAR TAMAÑO DEL ARCHIVO
                            if len(file_data) > MAX_FILE_SIZE:
                                _logger.error(f"❌ Archivo demasiado grande para '{field_name}': {len(file_data)} bytes")
                                error = f"El archivo '{file_name}' es demasiado grande. El tamaño máximo es 10MB."
                                return request.render('auth_signup.signup', {'error': error})

                            # Verificar que el archivo no esté vacío
                            if len(file_data) == 0:
                                _logger.warning(f"⚠️ Archivo vacío para '{field_name}': {file_name}")
                                continue

                            # Crear el adjunto en Odoo CON EL document_type
                            attachment = request.env['ir.attachment'].sudo().create({
                                'name': file_name,
                                'datas': base64.b64encode(file_data),
                                'res_model': 'res.partner',
                                'res_id': partner.id,
                                'type': 'binary',
                                'document_type': doc_type,  # 🔥 ASIGNAR EL TIPO CORRESPONDIENTE
                            })

                            _logger.info(f"✅ Documento '{file_name}' subido como tipo '{doc_type}' para {partner.name}")
                            documentos_subidos = True

                        except Exception as e:
                            _logger.error(f"❌ Error al cargar el archivo '{field_name}': {str(e)}")

                    # 🔄 PROCESAR DOCUMENTOS ESPECÍFICOS DINÁMICOS (por tipo de entidad)
                    # Buscar archivos que empiecen con "documento_" pero no estén en el mapeo principal
                    files = request.httprequest.files
                    for field_name in files.keys():
                        # Si es un campo de documento que no está en nuestro mapeo principal
                        if (field_name.startswith('documento_') and
                                field_name not in DOCUMENTOS_MAPPING and
                                field_name != 'otros_documentos'):

                            file = files.get(field_name)
                            if file and file.filename and file.filename.strip() != '':
                                try:
                                    # ✅ VALIDAR EXTENSIÓN DEL ARCHIVO
                                    file_extension = os.path.splitext(file.filename.lower())[1]
                                    if file_extension not in ALLOWED_EXTENSIONS:
                                        _logger.error(f"❌ Extensión no permitida para '{field_name}': {file_extension}")
                                        error = f"Formato de archivo no válido para '{field_name}'. Solo se permiten PDF e imágenes."
                                        return request.render('auth_signup.signup', {'error': error})


                                    file_data = file.read()
                                    file_name = file.filename

                                    # ✅ VERIFICAR TAMAÑO DEL ARCHIVO
                                    if len(file_data) > MAX_FILE_SIZE:
                                        _logger.error(
                                            f"❌ Archivo demasiado grande para '{field_name}': {len(file_data)} bytes")
                                        error = f"El archivo '{file_name}' es demasiado grande. El tamaño máximo es 10MB."
                                        return request.render('auth_signup.signup', {'error': error})

                                    if len(file_data) == 0:
                                        continue

                                    # Determinar el tipo basado en el nombre del campo
                                    if field_name.startswith('documento_estatal'):
                                        doc_type = 'documento_estatal'
                                    elif field_name.startswith('documento_firma'):
                                        doc_type = 'documento_firma'
                                    elif field_name.startswith('documento_mipime'):
                                        doc_type = 'documento_mipime'
                                    elif field_name.startswith('documento_tcp'):
                                        doc_type = 'documento_tcp'
                                    else:
                                        doc_type = 'otros'  # Por defecto

                                    # Crear adjunto
                                    attachment = request.env['ir.attachment'].sudo().create({
                                        'name': file_name,
                                        'datas': base64.b64encode(file_data),
                                        'res_model': 'res.partner',
                                        'res_id': partner.id,
                                        'type': 'binary',
                                        'document_type': doc_type,
                                    })

                                    _logger.info(f"✅ Documento específico '{file_name}' subido como tipo '{doc_type}'")
                                    documentos_subidos = True

                                except Exception as e:
                                    _logger.error(f"❌ Error procesando documento específico '{field_name}': {str(e)}")

                    # 🔄 PROCESAR OTROS DOCUMENTOS MÚLTIPLES
                    otros_documentos = request.httprequest.files.getlist('otros_documentos')
                    for file in otros_documentos:
                        if file and file.filename and file.filename.strip() != '':
                            try:
                                # ✅ VALIDAR EXTENSIÓN DEL ARCHIVO
                                file_extension = os.path.splitext(file.filename.lower())[1]
                                if file_extension not in ALLOWED_EXTENSIONS:
                                    _logger.error(
                                        f"❌ Extensión no permitida para documento adicional: {file_extension}")
                                    error = "Formato de archivo no válido para documento adicional. Solo se permiten PDF e imágenes."
                                    return request.render('auth_signup.signup', {'error': error})

                                file_data = file.read()
                                file_name = file.filename

                                # ✅ VERIFICAR TAMAÑO DEL ARCHIVO
                                if len(file_data) > MAX_FILE_SIZE:
                                    _logger.error(
                                        f"❌ Archivo demasiado grande para documento adicional: {len(file_data)} bytes")
                                    error = f"El archivo '{file_name}' es demasiado grande. El tamaño máximo es 10MB."
                                    return request.render('auth_signup.signup', {'error': error})

                                if len(file_data) == 0:
                                    continue

                                # Crear adjunto marcado como "otros"
                                attachment = request.env['ir.attachment'].sudo().create({
                                    'name': file_name,
                                    'datas': base64.b64encode(file_data),
                                    'res_model': 'res.partner',
                                    'res_id': partner.id,
                                    'type': 'binary',
                                    'document_type': 'otros',  # 🔥 MARCAR COMO OTROS DOCUMENTOS
                                })

                                _logger.info(f"✅ Otro documento '{file_name}' subido para {partner.name}")
                                documentos_subidos = True

                            except Exception as e:
                                _logger.error(f"❌ Error al cargar documento adicional: {str(e)}")

                    # Mensaje final
                    if documentos_subidos:
                        _logger.info(f"🎉 Proceso de documentos completado para {partner.name}")
                    else:
                        _logger.info("📝 No se subió ningún documento para el usuario jurídico.")

                # Asignar usuario solo al grupo "Portal" (sin acceso administrativo)
                portal_group = request.env.ref('base.group_portal')  # Grupo de usuarios de sitio web

                user_vals = {
                    'email': email or post.get('email1') or post.get('email'),
                    'login': login,
                    'password': password,
                    'partner_id': partner.id,
                    'active': True,
                    'groups_id': [(6, 0, [portal_group.id])],  # Solo grupo "Portal"
                }
                request.env['res.users'].sudo().create(user_vals)

                return request.redirect('/web/login')

            except Exception as e:
                error = str(e)
                _logger.error(f"❌ ERROR GENERAL en registro: {error}", exc_info=True)

        return request.render('auth_signup.signup', {'error': error})

    # ══════════════════════════════════════════════════════════════════
    # Registro básico con verificación de correo en dos pasos
    # ══════════════════════════════════════════════════════════════════
    def _signup_basico(self, **post):
        # GET → mostrar el formulario estándar (correo · nombre · contraseña).
        if request.httprequest.method != 'POST':
            return super(CustomSignup, self).web_auth_signup(**post)

        # Paso 2: el usuario envía el código de verificación.
        if post.get('signup_step') == 'verify':
            return self._signup_verificar_codigo(**post)

        # Paso 1: validar datos y enviar el código.
        login = (post.get('login') or '').strip()
        name = (post.get('name') or '').strip()
        password = post.get('password') or ''
        confirm = post.get('confirm_password') or ''
        redirect = post.get('redirect') or ''

        qcontext = self.get_auth_signup_qcontext()
        qcontext.update({'login': login, 'name': name, 'redirect': redirect})

        def err(msg):
            qcontext['error'] = msg
            return request.render('auth_signup.signup', qcontext)

        if not (login and name and password):
            return err('Completa todos los campos.')
        if not EMAIL_RE.match(login):
            return err('Introduce un correo electrónico válido.')
        if password != confirm:
            return err('Las contraseñas no coinciden.')
        if request.env['res.users'].sudo().search_count([('login', '=', login)]):
            return err('Ya existe un usuario con ese correo.')

        # Verificación de correo por código (configurable). En desarrollo el flag
        # 'cevende.signup_email_verification' está apagado y se crea la cuenta
        # directamente (el código NO es obligatorio); en producción se activa y
        # entonces sí se exige introducir el código enviado al correo.
        if not self._signup_codigo_requerido():
            return (self._signup_crear_y_login(name, login, password, redirect)
                    or err('No se pudo crear la cuenta. Inténtalo de nuevo.'))

        code = ''.join(secrets.choice('0123456789') for _ in range(6))
        request.session['signup_pending'] = {
            'login': login, 'name': name, 'password': password,
            'code': code, 'redirect': redirect,
        }
        self._signup_enviar_codigo(login, name, code)
        return request.render('pyxel_cem_website_account.signup_verify_code', {
            'login': login, 'redirect': redirect,
        })

    def _signup_codigo_requerido(self):
        """¿Es obligatorio el código de verificación por correo? Controlado por
        el parámetro de sistema 'cevende.signup_email_verification' (apagado por
        defecto en desarrollo; encender en producción)."""
        val = request.env['ir.config_parameter'].sudo().get_param(
            'cevende.signup_email_verification', '0')
        return str(val).strip().lower() in ('1', 'true', 'yes', 'on')

    def _signup_crear_y_login(self, name, login, password, redirect):
        """Crea el usuario portal, lo autentica y devuelve la redirección.
        Devuelve None si falla la creación (el llamante muestra el error)."""
        try:
            portal_group = request.env.ref('base.group_portal')
            partner = request.env['res.partner'].sudo().create({
                'name': name,
                'email': login,
                'user_type': 'natural',
                'lang': request.context.get('lang', 'es_ES'),
            })
            request.env['res.users'].sudo().with_context(
                no_reset_password=True).create({
                'name': name,
                'login': login,
                'email': login,
                'password': password,
                'partner_id': partner.id,
                'active': True,
                'groups_id': [(6, 0, [portal_group.id])],
            })
            # Commit para que el usuario sea visible al autenticar (authenticate
            # abre un cursor nuevo y no vería los cambios sin confirmar).
            request.env.cr.commit()
        except Exception as e:
            _logger.error("Error creando usuario en registro: %s", e, exc_info=True)
            return None
        request.session.authenticate(request.env.cr.dbname, login, password)
        return request.redirect(redirect or '/shop')

    def _signup_verificar_codigo(self, **post):
        pending = request.session.get('signup_pending') or {}
        redirect = pending.get('redirect') or '/shop'
        if not pending:
            # Sin datos en sesión (expiró) → volver a empezar.
            return request.redirect('/web/signup')

        # Reenviar el código.
        if post.get('resend'):
            self._signup_enviar_codigo(pending['login'], pending['name'], pending['code'])
            return request.render('pyxel_cem_website_account.signup_verify_code', {
                'login': pending['login'], 'redirect': redirect,
                'info': 'Te enviamos un nuevo código a tu correo.',
            })

        code_in = (post.get('verify_code') or '').strip()
        if not code_in or code_in != pending.get('code'):
            return request.render('pyxel_cem_website_account.signup_verify_code', {
                'login': pending['login'], 'redirect': redirect,
                'error': 'Código incorrecto. Revisa tu correo e inténtalo de nuevo.',
            })

        # Código correcto → crear el usuario portal y entrar.
        resp = self._signup_crear_y_login(
            pending['name'], pending['login'], pending['password'], redirect)
        if resp:
            request.session.pop('signup_pending', None)
            return resp
        return request.render('pyxel_cem_website_account.signup_verify_code', {
            'login': pending['login'], 'redirect': redirect,
            'error': 'No se pudo crear la cuenta. Inténtalo de nuevo.',
        })

    def _signup_enviar_codigo(self, email, name, code):
        """Envía el código de verificación por correo (servidor SMTP de Odoo)."""
        try:
            body = (
                '<div style="font-family:Arial,sans-serif;color:#1F2937;">'
                '<p>Hola %s,</p>'
                '<p>Tu código de verificación para crear tu cuenta en CEVENDE es:</p>'
                '<p style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#2563EB;">%s</p>'
                '<p>Introduce este código en la página de registro para completar tu cuenta.</p>'
                '<p style="color:#6B7280;font-size:13px;">Si no solicitaste este registro, ignora este correo.</p>'
                '</div>'
            ) % (name or '', code)
            # Remitente: el usuario del servidor SMTP (Gmail exige que el From
            # coincida con la cuenta autenticada), con respaldos.
            mail_server = request.env['ir.mail_server'].sudo().search([], limit=1)
            sender = ((mail_server and mail_server.smtp_user)
                      or request.env.company.email
                      or 'no-reply@cevende.com')
            mail = request.env['mail.mail'].sudo().create({
                'subject': 'Tu código de verificación · CEVENDE',
                'email_from': sender,
                'email_to': email,
                'body_html': body,
            })
            mail.send()
        except Exception as e:
            _logger.error("No se pudo enviar el código de verificación a %s: %s", email, e)

    @http.route('/web/login', type='http', auth="public", website=True, sitemap=False)
    def web_login(self, redirect=None, **kw):
        # Destino tras el login: respeta el 'redirect' de la URL (p. ej. volver al
        # checkout mayorista que mandó al login). Si no hay redirect, va a /shop.
        target = redirect or '/shop'

        if request.session.uid:
            return request.redirect(target)

        response = super().web_login(redirect=target, **kw)

        # Si el login fue exitoso y no es una respuesta HTML directa
        if not isinstance(response, http.Response) and request.session.uid:
            return request.redirect(target)

        return response


class MunicipalityController(http.Controller):

    @http.route('/get_municipalities', type='json', auth='public')
    def get_municipalities(self, state_id):
        cities = request.env['res.municipality'].sudo().search([('state_id', '=', int(state_id))])
        return [{'id': city.id, 'name': city.name} for city in cities]

    @http.route('/check_user_login', type='json', auth='public')
    def check_user_login(self, login):
        user = request.env['res.users'].sudo().search([('login', '=', login)], limit=1)
        return {'exists': bool(user)}

    @http.route('/check_user_phone', type='json', auth='public')
    def check_user_phone(self, phone):
        user_phone = request.env['res.partner'].sudo().search([('phone', '=', phone)], limit=1)
        return {'exists': bool(user_phone)}

    @http.route('/check_user_email', type='json', auth='public')
    def check_user_email(self, email):
        user_email = request.env['res.users'].sudo().search([('email', '=', email)], limit=1)
        return {'exists': bool(user_email)}

    @http.route(['/check_cancelled_user'], type='json', auth='public', methods=['POST'], csrf=False)
    def check_cancelled_user(self, **kwargs):
        reeup = kwargs.get('reeup')
        nit = kwargs.get('nit')

        if reeup or nit:
            # Buscar el contacto por NIT o REEUP
            partner_domain = ['|', ('reeup', '=', reeup), ('vat', '=', nit)]
            partner = request.env['res.partner'].sudo().search(partner_domain, limit=1)

            if partner:
                # Buscar etapas canceladas
                cancelled_stage_ids = request.env['crm.stage'].sudo().search([('is_cancelled', '=', True)]).ids

                # Verificar si el contacto tiene oportunidades canceladas
                cancelled_opportunities = request.env['crm.lead'].sudo().search_count([
                    ('partner_id', '=', partner.id),
                    ('stage_id', 'in', cancelled_stage_ids)
                ])

                # También verificamos si el partner está inactivo (cancelado)
                if cancelled_opportunities > 0 or not partner.active:
                    return {'cancelled': True}

        return {'cancelled': False}
