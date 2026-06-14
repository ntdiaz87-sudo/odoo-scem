# -*- coding: utf-8 -*-
import logging

_logger = logging.getLogger(__name__)


def post_init_hook_vc_menu(env):
    """
    Hook para Odoo 17 - solo recibe env
    """
    _logger.info("=== INICIANDO post_init_hook_vc_menu ===")

    try:
        # Pequeña pausa para asegurar que todo está cargado
        import time
        time.sleep(1)

        _logger.info("🔧 Ajustando menú Virtual Contracts...")

        # Verificar si el método existe
        if hasattr(env['ir.ui.menu'], '_adjust_vc_menu_parent'):
            env['ir.ui.menu']._adjust_vc_menu_parent()
            _logger.info("✅ Menú ajustado correctamente")
        else:
            _logger.warning("⚠️ Método _adjust_vc_menu_parent no encontrado")

        # Limpiar caché
        env['ir.ui.menu'].clear_caches()
        _logger.info("🗑️  Caché limpiada")

    except Exception as e:
        _logger.error("❌ Error: %s", str(e), exc_info=True)

    _logger.info("=== FIN post_init_hook_vc_menu ===")
    return True