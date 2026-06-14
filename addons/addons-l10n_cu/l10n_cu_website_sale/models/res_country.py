from odoo import api, fields, models, _
from odoo.exceptions import UserError


class ResCountry(models.Model):
    _inherit = 'res.country'

    city_required = fields.Boolean(default=True, string='City Required')
    municipality_required = fields.Boolean(default=False, string='Municipality Required')

    @api.constrains('address_format')
    def _check_address_format(self):
        """
         Override
        :return:
        """
        for record in self:
            if record.address_format:
                address_fields = self.env['res.partner']._formatting_address_fields() + ['state_code', 'state_name',
                                                                                         'country_code',
                                                                                         'country_name', 'company_name',
                                                                                         'municipality_name']
                try:
                    record.address_format % {i: 1 for i in address_fields}
                except (ValueError, KeyError):
                    raise UserError(_('The layout contains an invalid format key'))
