from odoo import models, fields, api
import json


class ResPartner(models.Model):
    _inherit = 'res.partner'

    user_type = fields.Selection([
        ('natural', 'Persona Natural'),
        ('juridico', 'Persona Jurídica')
    ], string="Tipo de Usuario",default='juridico', required=True)

    # Persona Natural
    address = fields.Char(string="Dirrección general")
    last_name = fields.Char(string="Apellidos")
    identification_num = fields.Char(string="CI o Pasaporte")
    date_of_birth = fields.Date(string="Fecha de Nacimiento")
    phone1 = fields.Char(string="Teléfono 1")
    phone2 = fields.Char(string="Teléfono 2")

    # Persona Jurídica
    name_entity = fields.Char(string="Nombre de la Entidad")
    entity_type = fields.Selection([
        ('estatal', 'Estatal'),
        ('firma', 'Firma'),
        ('mipime', 'MIPYME'),
        ('tcp', 'TCP')
    ], string="Tipo de entidad")
    nit = fields.Char(string="NIT")
    reeup = fields.Char(string='REEUP')
    social_object = fields.Text(string="Objeto Social")

    # Representante
    is_representative = fields.Boolean(string="¿Tiene Representante?")
    representative_name = fields.Char(string="Nombre del Representante")
    representative_last_name = fields.Char(string="Apellido del Representante")
    representative_identification_num = fields.Char(string="CI o Pasaporte del Representante")
    representative_phone = fields.Char(string="Teléfono del Representante")
    representative_email = fields.Char(string="Correo del Representante")

    currency_id = fields.Many2one(
        'res.currency',
        string='Moneda',
        help='Moneda preferida del contacto'
    )

    account_type = fields.Selection([
        ('corriente', 'Corriente'),
        ('gastos_cup', 'Gastos CUP'),
        ('gastos_mlc', 'Gastos MLC'),
        ('cuenta_usd_eur', 'Cuenta USD/EUR')],
        string="Tipo de Cuenta",
        help="Tipo de cuenta bancaria preferida del contacto"
    )
    account_details = fields.Text(string='Account Details',
                                  help="Stores multiple account types and their numbers as a serialized string")

    hide_entity_type = fields.Boolean(
        string="Ocultar Tipo Entidad",
        compute='_compute_hide_entity_type',
        store=False
    )

    @api.depends()
    def _compute_hide_entity_type(self):
        """Computa si debe ocultarse el campo entity_type basado en si el módulo está instalado"""
        pyxel_installed = self.env['ir.module.module'].sudo().search_count([
            ('name', '=', 'pyxel_import_backend'),
            ('state', '=', 'installed')
        ]) > 0

        for record in self:
            record.hide_entity_type = pyxel_installed

    def get_account_details(self):
        """Helper method to deserialize account details"""
        if self.account_details:
            try:
                return json.loads(self.account_details)
            except json.JSONDecodeError:
                pass
        return []

        # Relación One2many para asociar los archivos a res.partner

    attachment_ids = fields.Many2many(
        'ir.attachment', string="Documents",
        relation="partner_attachment_rel", column1="partner_id", column2="attachment_id",
        domain=[('type', '=', 'binary')], help="Attachments related to this partner."
    )
    # NO VA
    # hide_peppol_fields = fields.Boolean()

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'user_type' not in vals:
                vals['user_type'] = 'juridico' if vals.get('is_company') else 'natural'
        return super().create(vals_list)

    def write(self, vals):
        if 'is_company' in vals and 'user_type' not in vals:
            for partner in self:
                inferred_vals = vals.copy()
                inferred_vals['user_type'] = 'juridico' if inferred_vals.get('is_company') else 'natural'
                super(ResPartner, partner).write(inferred_vals)
            return True
        return super().write(vals)