from odoo.api import Environment, SUPERUSER_ID


def post_init_hook(env):
    settings = env['res.config.settings'].create({})
    settings.set_default_scem_settings()
