from odoo import models, fields, api

class ResPartnerBank(models.Model):
    _inherit = 'res.partner.bank'

    currency_id = fields.Many2one(
        'res.currency',
        string='Moneda',
        help='Moneda asociada a la cuenta bancaria',
        # QUITADO el related — permite valor independiente
        store=True,
        readonly=False
    )

    account_type = fields.Selection([
        ('corriente', 'Corriente'),
        ('gastos_cup', 'Gastos CUP'),
        ('gastos_mlc', 'Gastos MLC'),
        ('cuenta_usd_eur', 'Cuenta USD/EUR')],
        string="Tipo de Cuenta",
        help="Tipo de cuenta bancaria preferida del contacto"
    )

    titular_id = fields.Many2one(
        'res.partner',
        string='Titular',
        help='Titular de la cuenta bancaria'
    )

    swift_code = fields.Char(
        string='Código SWIFT',
        help='Código SWIFT/BIC de la cuenta bancaria'
    )

    bank_id = fields.Many2one(
        'res.bank',
        string='Banco',
        help='Banco asociado a la cuenta'
    )