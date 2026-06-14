from odoo import models, fields
from odoo.exceptions import ValidationError, UserError


class CrmStage(models.Model):
    _inherit = 'crm.stage'

    is_cancelled = fields.Boolean(string='Cancelado')

class CrmLead(models.Model):
    _inherit = 'crm.lead'

    def write(self, vals):
        for lead in self:
            # Buscamos si la etapa destino es diferente y está cancelado
            if lead.stage_id and lead.stage_id.is_cancelled:
                if 'stage_id' in vals and vals['stage_id'] != lead.stage_id.id:
                    raise UserError("No puedes mover una oportunidad en estado Cancelado a otra etapa.")
        return super(CrmLead, self).write(vals)
