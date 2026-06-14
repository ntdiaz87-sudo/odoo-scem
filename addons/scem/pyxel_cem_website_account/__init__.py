# -*- coding: utf-8 -*-
from psycopg2 import sql
import json
import logging

from . import models
from . import controllers
_logger = logging.getLogger(__name__)


def pre_init_hook(cr):
    """
    Hook ejecutado antes de la instalación/actualización
    """
    try:
        from .pre_init_hook import pre_init_hook as pre_hook
        pre_hook(cr)
    except Exception as e:
        _logger.warning(f"Error en pre_init_hook: {str(e)}")
        # Continuar incluso si hay error en el hook

def post_init_hook(env):
    """ Se usa esta variante para sobreescribir la traducción al español del email template set_password_email pues
    empleando la herencia no modifica la traducción al español"""

    # Primero verificar si l10n_cu_address está instalado
    # y manejarlo adecuadamente si es necesario
    try:
        # Verificar si el módulo está instalado
        l10n_cu_module = env['ir.module.module'].search([
            ('name', '=', 'l10n_cu_address'),
            ('state', '=', 'installed')
        ], limit=1)

        if not l10n_cu_module:
            _logger.info("Módulo l10n_cu_address no encontrado, continuando...")
    except Exception as e:
        _logger.warning(f"No se pudo verificar l10n_cu_address: {str(e)}")


    template = env.ref('auth_signup.set_password_email', raise_if_not_found=False)
    if template:
        es_body = """<p>
                <strong>Hola</strong>
                <font style="color: rgb(255, 0, 0);">
                    <span t-out="object.name">Marc Demo</span>
                </font>
            </p>
            <p>Bienvenido/a a <span t-out="object.company_id.name"></span>. Estamos muy contentos de tenerte como parte de nuestra comunidad
                de clientes
                mayoristas.
            </p>
            <p>
                Queremos agradecerle por elegirnos como su proveedor de diversos productos.
                 Nos comprometemos a ofrecerle la mejor calidad, variedad y precios competitivos para impulsar su negocio.

            </p>
            <p>
                <div style="margin: 16px 0px 16px 0px;">
                    <a t-att-href="object.signup_url" style="background-color: #875A7B; padding: 8px 16px 8px 16px; text-decoration: none; color: #fff; border-radius: 5px; font-size:13px;">
                        ¡EMPIEZA AHORA!
                    </a>
                </div>
            </p>
            <p>
                Aquí hay algunas cosas que puedes hacer para empezar a aprovechar al máximo tu cuenta en 
                <span t-out="object.company_id.name"></span>:
            </p>
            <ul>
                <li><strong>Explore nuestro catálogo: </strong>Descubra nuestra amplia selección de frutas importadas y nacionales,
                    desde las clásicas hasta las más exóticas.
                </li>
                <li><strong>Consulta nuestros precios mayoristas: </strong>Accede a tarifas exclusivas para clientes registrados y 
                    aprovecha nuestras promociones especiales.
                </li>
                <li><strong>Haz tu primer pedido: </strong>Disfrute de un proceso de compra fácil y seguro, 
                    con opciones de entrega flexibles que se adaptan a sus necesidades.
                </li>
                <li><strong>Contacta con nuestro equipo de soporte: </strong>Si tiene alguna pregunta o necesita ayuda, no dude en contactarnos. 
                    Estamos aquí para apoyarle en cada paso del proceso.
                </li>
            </ul>
            <p>

            </p>
            <p>Como nuevo cliente, te ofrecemos [Opcional: Incluye un descuento, una oferta especial o un beneficio adicional para nuevos clientes]. 
                Usa el código [Código de descuento/oferta] al realizar tu primer pedido.
            </p>
            <p>Esperamos construir una relación duradera y exitosa con usted.
                 Gracias por unirse a la familia 
                <span t-out="object.company_id.name">.</span>
            </p>
            <p>Sinceramente,</p>
            <p>
                <strong>El Equipo 
                    <span t-out="object.company_id.name"></span>
                </strong>
            </p>
            <div class="o_logo">
                <img t-attf-src="/web/binary/company_logo?company={{ object.company_id.id }}" alt="object.company_id.name"/>
            </div>
        """
        sql_query = "UPDATE mail_template SET body_html = jsonb_set(body_html, '{es_ES}', '%s', TRUE) " \
                    "WHERE id = %s"
        query = sql.SQL(sql_query % (json.dumps(es_body), template.id))
        env.cr.execute(query)
