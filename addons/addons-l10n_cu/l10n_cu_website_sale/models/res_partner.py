import inspect
from collections import defaultdict

from odoo import models


class ResPartner(models.Model):
    _inherit = 'res.partner'

    def _prepare_display_address(self, without_company=False):
        """
        get the information that will be injected into the display format
        get the address format
        :param without_company:
        :return:
        """

        address_format, args = super(ResPartner, self)._prepare_display_address(without_company=without_company)
        args['municipality_name'] = self.res_municipality_id.name or ''
        return address_format, args
