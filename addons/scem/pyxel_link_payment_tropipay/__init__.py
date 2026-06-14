# -*- coding: utf-8 -*-
#############################################################################
#
#   TropiPay.
#   soporte@tropipay.com
#   
#
#############################################################################


from . import models
from . import controllers
from . import wizards

from odoo.addons.payment import setup_provider, reset_payment_provider
from odoo.addons.pyxel_link_payment_tropipay.const import  TROPIPAY_CODE


def post_init_hook(cr):
    setup_provider(cr, TROPIPAY_CODE)


def uninstall_hook(cr):
    reset_payment_provider(cr, TROPIPAY_CODE)