from . import controllers
from . import models


def post_init_hook(env):
    """Deja la raíz del dominio apuntando al marketplace.

    Sin esto, quien teclea el dominio aterriza en la página «Home» vacía
    que el módulo website crea de serie, y se va. Pasó en el primer
    despliegue: trade.enetradex.com servía un Odoo en blanco mientras el
    marketplace vivía en /market.

    No se hace con un registro XML porque el sitio ya existe cuando este
    módulo se instala: con noupdate="1" nunca se aplicaría, y sin él, cada
    actualización del módulo pisaría lo que hubiera configurado el cliente.

    Sólo toca lo que está a medio hacer: si alguien ya eligió portada o
    renombró el sitio, se respeta.
    """
    sitio = env['website'].search([], limit=1)
    if not sitio:
        return
    if not sitio.homepage_url:
        sitio.homepage_url = '/market'
    if sitio.name in ('My Website', 'Website'):
        sitio.name = 'PYXEL Cuba Trade OS'
