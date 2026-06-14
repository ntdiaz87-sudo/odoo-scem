from odoo import models, fields, api
from datetime import datetime


class ResPartner(models.Model):
    _inherit = 'res.partner'

    etapa_compra = fields.Selection([
        ('nuevo', 'Nuevo'),
        ('interesado', 'Interesado'),
        ('listo_comprar', 'Listo para comprar'),
        ('comprado', 'Comprado'),
    ], string="Etapa de Compra", default='nuevo', compute='_compute_etapa_compra')


    # customer_id_code = fields.Char(string="ID de Cliente")
    # reeup_code = fields.Char(string="Código REEUP")
    entity_type = fields.Char(string="Tipo de Entidad")
    ci_number = fields.Char(string="CI")

    # Campos adicionales para documentos específicos según tipo de entidad
    documento_1 = fields.Binary(string="Documento 1")
    documento_1_filename = fields.Char(string="Nombre Documento 1")

    documento_2 = fields.Binary(string="Documento 2")
    documento_2_filename = fields.Char(string="Nombre Documento 2")

    documento_3 = fields.Binary(string="Documento 3")
    documento_3_filename = fields.Char(string="Nombre Documento 3")

    documento_4 = fields.Binary(string="Documento 4")
    documento_4_filename = fields.Char(string="Nombre Documento 4")

    documento_5 = fields.Binary(string="Documento 5")
    documento_5_filename = fields.Char(string="Nombre Documento 5")

    # Campo para mapear tipo de entidad con documentos requeridos
    documentos_requeridos = fields.Text(
        string="Documentos Requeridos",
        compute='_compute_documentos_requeridos',
        store=False
    )

    seq_code_id_client = fields.Char(
        string="ID Cliente",
        readonly=True,
        copy=False,
        index=True,
        help="Se asigna automáticamente cuando el partner tenga al menos un lead en etapa allows_sale=True o posterior."
    )

    
    _sql_constraints = [
        ('seq_code_id_client_unique', 'unique(seq_code_id_client)', 'El ID Cliente debe ser único.')
    ]


    # Logica para generar el id del cliente
    def _get_allowed_stage_info(self):
        """Devuelve (ids_etapas_allows_sale, min_sequence)"""
        Stage = self.env['crm.stage'].sudo()
        stages = Stage.search([('allows_sale', '=', True)])
        allowed_ids = stages.ids
        min_seq = min(stages.mapped('sequence')) if stages else None
        return allowed_ids, min_seq

    def _partner_has_lead_at_or_after_threshold(self, partner_ids):
        """{partner_id: True/False} si tiene lead en etapa allows_sale=True o con sequence >= min_seq."""
        result = {pid: False for pid in partner_ids}
        if not partner_ids:
            return result

        allowed_ids, min_seq = self._get_allowed_stage_info()

        if not allowed_ids and min_seq is None:
            return result  

        domain = [('partner_id', 'in', partner_ids)]
        if allowed_ids and min_seq is not None:
            domain += ['|', ('stage_id', 'in', allowed_ids), ('stage_id.sequence', '>=', min_seq)]
        elif allowed_ids:
            domain += [('stage_id', 'in', allowed_ids)]
        else:
            domain += [('stage_id.sequence', '>=', min_seq)]

        rows = self.env['crm.lead'].sudo().read_group(domain, ['partner_id'], ['partner_id'])
        found = {r['partner_id'][0]: (r['partner_id_count'] > 0) for r in rows}
        result.update(found)
        return result

    def _assign_seq_code_id_client_if_needed(self):
        """Asigna seq_code_id_client solo a los partners SIN seq_code_id_client que cumplan la condición. Una sola vez."""
        partners = self.filtered(lambda p: not p.seq_code_id_client)
        if not partners:
            return

        mapping = self._partner_has_lead_at_or_after_threshold(partners.ids)
        to_assign = partners.filtered(lambda p: mapping.get(p.id, False))
        if not to_assign:
            return

        seq = self.env['ir.sequence'].sudo()
        for p in to_assign:
            if not p.seq_code_id_client:
                code = seq.next_by_code('res.partner.seq_code_id_client') or ''
                p.sudo().write({'seq_code_id_client': code})

    @api.model
    def create(self, vals):
        partner = super().create(vals)
        partner._assign_seq_code_id_client_if_needed()
        return partner

    def write(self, vals):
        res = super().write(vals)
        if 'seq_code_id_client' not in vals:
            self._assign_seq_code_id_client_if_needed()
        return res


    @api.depends('opportunity_ids.stage_id')
    def _compute_etapa_compra(self):
        stage_mapping = {
            'nuevo': ['New', 'Qualified'],
            'interesado': ['Proposition', 'Negotiation'],
            'listo_comprar': ['Won', 'Ready to Purchase'],
            'comprado': ['Closed Won', 'Purchased']
        }

        for partner in self:
            partner.etapa_compra = 'nuevo'  # Valor por defecto
            if partner.opportunity_ids:
                # Tomar la etapa de la oportunidad más reciente
                last_stage = partner.opportunity_ids.sorted('create_date')[-1].stage_id.name
                for etapa, stage_names in stage_mapping.items():
                    if last_stage in stage_names:
                        partner.etapa_compra = etapa
                        break

    _DOCUMENTOS_MAP = {
        'estatal': [
            "RESOLUCIÓN DE CONSTITUCIÓN",
            "NIT",
            "REEUP",
            "CERTIFICO LEGAL",
            "CERTIFICO DE CUENTAS BANCARIAS",
        ],
        'firma': [
            "DOCUMENTO CONSTITUTIVO",
            "INSCRIPCIÓN EN EL REGISTRO NACIONAL",
            "PERMISO OFAC, SI ES DE EEUU, PARA COMERCIALIZAR CON CUBA",
            "INSCRIPCIÓN EN LOS REGISTROS DE TRIBUTARIOS",
        ],
        'mipime': [
            "ESCRITURA PUBLICA DE CONSTITUCIÓN",
            "NIT",
            "CERTIFICADO DE INSCRIPCIÓN DEL REGISTRO MERCANTIL",
            "CERTIFICO LEGAL, SI POSEE",
        ],
        'tcp': [
            "PROYECTO DE TRABAJO",
            "NIT",
        ],
    }

    @api.model
    def get_documentos_by_type(self, entity_type):
        return self._DOCUMENTOS_MAP.get(entity_type, [])

    @api.depends('entity_type')
    def _compute_documentos_requeridos(self):
        for partner in self:
            documentos = self.get_documentos_by_type(partner.entity_type)
            partner.documentos_requeridos = "\n".join([
                f"{i + 1}. {doc}" for i, doc in enumerate(documentos)
            ]) if documentos else "No se requieren documentos específicos"

