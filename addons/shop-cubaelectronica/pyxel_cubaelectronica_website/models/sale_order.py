from odoo import models, fields, api

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Mantener como related pero con store=True
    customer_id_code = fields.Char(string="ID de Cliente", related='partner_id.seq_code_id_client', store=True)
    reeup_code = fields.Char(string="Código REEUP", related='partner_id.reeup', store=True)
    entity_type = fields.Char(string="Tipo de Entidad", related='partner_id.entity_type', store=True)
    # Campo relacionado con el contrato virtual
    contract_number = fields.Char(string="No. Contrato", compute='_compute_contract_number', store=True)

    description_report = fields.Char(string="Descripción")
    observations = fields.Char(string="Observaciones")

    @api.depends('partner_id')
    def _compute_contract_number(self):
        """Obtener el código del contrato virtual activo del partner"""
        for order in self:
            if order.partner_id:
                # Buscar el contrato virtual confirmado más reciente del partner
                active_contract = self.env['cem.virtual.contract'].search([
                    ('partner_id', '=', order.partner_id.id),
                    ('state', '=', 'confirmed')  # Solo contratos confirmados/activos
                ], order='confirm_date desc', limit=1)

                order.contract_number = active_contract.code if active_contract else False
            else:
                order.contract_number = False

    def _prepare_invoice(self):
        vals = super()._prepare_invoice()
        order = self[:1]
        vals.update({
            'description_report': order.description_report or False,
            'observations': order.observations or False,
        })
        return vals