# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError, RedirectWarning


class ResPartner(models.Model):
    _inherit = 'res.partner'

    # Campos de Gestor de Ventas Externo
    is_sales_manager = fields.Boolean(
        string='Vendedor Externo/Gestor de Ventas',
        tracking=True,
        help='Marcar si este contacto es un gestor de ventas externo'
    )

    sales_manager_code = fields.Char(
        related='sales_manager_id.code',
        readonly=True,
        copy=False,
        tracking=True,

    )

    active_sales_manager = fields.Boolean(
        string='Gestor Activo',
        default=True,
        tracking=True,
        help='Indica si el gestor de ventas está activo'
    )

    # Relación con pyxel.sales.manager
    pyxel_sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Registro Gestor de Ventas',
        readonly=True,
        copy=False,
        help='Enlace al registro de pyxel.sales.manager'
    )

    # Campos existentes
    sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor de Ventas Principal'
    )

    sales_manager_ids = fields.Many2many(
        'pyxel.sales.manager',
        'res_partner_sales_manager_rel',
        'partner_id',
        'sales_manager_id',
        string='Gestores de Ventas'
    )

    sales_manager_count = fields.Integer(
        string='# Gestores',
        compute='_compute_sales_manager_count'
    )

    show_sales_manager = fields.Boolean(
        compute='_compute_show_sales_manager',
        string='Mostrar Gestor'
    )
    # 1. Campo ÚNICO que permite SELECCIONAR O TECLEAR número de cuenta
    supplier_payment_account = fields.Char(
        string='Número de Cuenta',
        help='Seleccione una cuenta existente o escriba el número de cuenta'
    )

    # Campo oculto para almacenar la cuenta bancaria seleccionada
    supplier_bank_id = fields.Many2one(
        'res.partner.bank',
        string='Cuenta Bancaria',
        domain="[('partner_id', '=', id)]",
        help='Cuenta bancaria seleccionada'
    )

    # 2. Moneda - Selector de todas las monedas del sistema
    supplier_payment_currency_id = fields.Many2one(
        'res.currency',
        string='Moneda',
        help='Moneda para pagos al proveedor'
    )

    # 3. Tipo de cuenta - Se llena automático o queda vacío
    supplier_payment_account_type = fields.Char(
        string='Tipo de Cuenta',
        readonly=True,
        help='Tipo de cuenta bancaria'
    )

    @api.onchange('supplier_bank_id')
    def _onchange_supplier_bank_id(self):
        """
        Cuando se selecciona una cuenta del selector:
        1. Actualiza el número de cuenta
        2. Asigna la MONEDA de la cuenta seleccionada
        3. Asigna el TIPO DE CUENTA
        """
        if self.supplier_bank_id:
            # 1. Llenar el número de cuenta
            self.supplier_payment_account = self.supplier_bank_id.acc_number

            # 2. Asignar la MONEDA de la cuenta seleccionada (si tiene)
            if self.supplier_bank_id.currency_id:
                self.supplier_payment_currency_id = self.supplier_bank_id.currency_id

            # 3. Asignar el TIPO DE CUENTA
            if self.supplier_bank_id.acc_type:
                tipo_dict = dict(self.supplier_bank_id._fields['acc_type'].selection)
                self.supplier_payment_account_type = tipo_dict.get(
                    self.supplier_bank_id.acc_type,
                    self.supplier_bank_id.acc_type
                )
            else:
                self.supplier_payment_account_type = ''

    @api.onchange('supplier_payment_account')
    def _onchange_supplier_payment_account(self):
        """
        Si el usuario ESCRIBE manualmente el número de cuenta:
        1. Limpiar la referencia a cuenta bancaria
        2. VACIAR el tipo de cuenta (porque es manual)
        3. La moneda se mantiene o el usuario la selecciona
        """
        # Buscar si existe una cuenta con ese número
        if self.supplier_payment_account and self.id:
            cuenta = self.env['res.partner.bank'].search([
                ('partner_id', '=', self.id),
                ('acc_number', '=', self.supplier_payment_account)
            ], limit=1)

            if cuenta:
                # Si existe, actualizar la referencia
                if self.supplier_bank_id != cuenta:
                    self.supplier_bank_id = cuenta
                    # Trigger del onchange de supplier_bank_id
                    self._onchange_supplier_bank_id()
            else:
                # Si NO existe (es manual), limpiar cuenta y tipo
                if self.supplier_bank_id:
                    self.supplier_bank_id = False
                # 3. VACIAR tipo de cuenta porque es manual
                self.supplier_payment_account_type = ''

    @api.onchange('supplier')
    def _onchange_supplier(self):
        """Limpiar campos cuando se desactiva el checkbox de proveedor"""
        if not self.supplier:
            self.supplier_payment_account = False
            self.supplier_bank_id = False
            self.supplier_payment_currency_id = False
            self.supplier_payment_account_type = False

    @api.depends('sales_manager_ids')
    def _compute_sales_manager_count(self):
        """Cuenta cuántos gestores tiene asignados"""
        for record in self:
            record.sales_manager_count = len(record.sales_manager_ids)

    @api.depends_context('company')
    def _compute_show_sales_manager(self):
        """Determina si se debe mostrar el campo de gestor de ventas"""
        show = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        show_bool = show == 'True'
        for record in self:
            record.show_sales_manager = show_bool

    @api.onchange('is_sales_manager')
    def _onchange_is_sales_manager(self):
        """Validar cuando se intenta marcar/desmarcar el campo is_sales_manager"""

        # CASO 1: Se está marcando como gestor (False -> True)
        if self.is_sales_manager and not self._origin.is_sales_manager:
            # Asegurar que active_sales_manager esté en True
            self.active_sales_manager = True
            return
        # CASO 2: Se está desmarcando (True -> False)
        if not self.is_sales_manager and self._origin.is_sales_manager and self._origin.id:
            validation_result = self._validate_unmark_sales_manager()

            if validation_result == 'allow':
                # Sin documentos - permitir desmarcar
                self.active_sales_manager = False
                return
            else:
                # Tiene documentos - revertir y mostrar warning
                self.is_sales_manager = True

                if validation_result == 'deactivate_active':
                    message = _(
                        'Este gestor tiene documentos activos por lo que no puede ser '
                        'desvinculado como gestor. Solo se puede desactivar.\n\n'
                        'Para desactivarlo, use el botón "Desvincular/Desactivar Gestor" abajo.'
                    )
                else:
                    message = _(
                        'Este gestor contiene documentos cancelados por lo que no puede '
                        'desmarcarse.\n\n'
                        'Para desactivarlo, use el botón "Desvincular/Desactivar Gestor" abajo.'
                    )

                return {
                    'warning': {
                        'title': _('Acción Requerida'),
                        'message': message,
                    }
                }

    @api.model
    def create(self, vals):
        """Generar código de gestor al crear"""
        # if vals.get('is_sales_manager') and not vals.get('sales_manager_code'):
        #     vals['sales_manager_code'] = self.env['ir.sequence'].next_by_code(
        #         'res.partner.sales.manager'
        #     ) or 'GV00001'
        # if 'active_sales_manager' not in vals:
        #     vals['active_sales_manager'] = True

        partner = super(ResPartner, self).create(vals)

        # Crear registro en pyxel.sales.manager si is_sales_manager es True
        if partner.is_sales_manager:
            partner._sync_pyxel_sales_manager()

        return partner

    def write(self, vals):
        """Validar al modificar is_sales_manager"""
        # Verificar si viene del wizard (para evitar loops)
        if self.env.context.get('from_unmark_wizard'):
            return super(ResPartner, self).write(vals)

        for record in self:
            # Si se está marcando como gestor y no tiene código
            # if vals.get('is_sales_manager') and not record.sales_manager_code:
            #     vals['sales_manager_code'] = self.env['ir.sequence'].next_by_code(
            #         'res.partner.sales.manager'
            #     ) or 'GV00001'
            # if 'active_sales_manager' not in vals:
            #     vals['active_sales_manager'] = True

            # Si se está desmarcando is_sales_manager
            if 'is_sales_manager' in vals and not vals['is_sales_manager'] and record.is_sales_manager:
                validation_result = record._validate_unmark_sales_manager()

                if validation_result in ('deactivate_active', 'deactivate_cancelled'):
                    # Tiene documentos - bloquear y pedir usar wizard
                    raise UserError(_(
                        'Este gestor tiene documentos asociados.\n\n'
                        'Use el botón "Desvincular/Desactivar Gestor" para continuar.'
                    ))
                elif validation_result == 'allow':
                    # Sin documentos - permitir desmarcar
                    vals['active_sales_manager'] = False

        result = super(ResPartner, self).write(vals)

        # Sincronizar con pyxel.sales.manager después del write
        for record in self:
            if 'is_sales_manager' in vals or 'active_sales_manager' in vals:
                record._sync_pyxel_sales_manager()

        return result

    def _sync_pyxel_sales_manager(self):
        """Sincronizar registro en pyxel.sales.manager"""
        self.ensure_one()

        # IMPORTANTE: Evitar loop si viene de la sincronización del sales.manager
        if self.env.context.get('from_sales_manager_sync'):
            return

        # Solo sincronizar si el partner ya está guardado (tiene ID real)
        if not self.id or isinstance(self.id, models.NewId):
            return

        # Buscar registro existente en pyxel.sales.manager (activo o inactivo)
        sales_manager = self.env['pyxel.sales.manager'].with_context(active_test=False).search([
            ('partner_id', '=', self.id)
        ], limit=1)

        if self.is_sales_manager:
            if sales_manager:
                # Ya existe un gestor: SOLO actualizar el estado active
                sales_manager.with_context(from_partner_sync=True).write({
                    'active': self.active_sales_manager
                })
                self.sales_manager_id = sales_manager
            else:
                # NO existe: crear nuevo registro
                vals = {
                    'partner_id': self.id,
                    'name': self.name or 'Gestor',
                    'active': self.active_sales_manager,
                    'date_start': fields.Date.context_today(self),
                }

                # Agregar usuario si existe
                if self.user_id:
                    vals['user_id'] = self.user_id.id

                # Crear con contexto para evitar loop
                new_sales_manager = self.env['pyxel.sales.manager'].with_context(
                    from_partner_sync=True
                ).create(vals)
                self.sales_manager_id = new_sales_manager
        else:
            # Si ya no es gestor, desactivar el registro (no eliminar)
            if sales_manager:
                sales_manager.with_context(from_partner_sync=True).write({'active': False})

    def _validate_unmark_sales_manager(self):
        """
        Valida si se puede desmarcar el campo is_sales_manager
        """
        self.ensure_one()

        partner_id = self._origin.id if self._origin.id else self.id

        if not partner_id or isinstance(partner_id, models.NewId):
            return 'allow'

        # Buscar el registro de pyxel.sales.manager
        sales_manager = self.env['pyxel.sales.manager'].search([
            ('partner_id', '=', partner_id)
        ], limit=1)

        if not sales_manager:
            return 'allow'

        sale_orders = self.env['sale.order'].search([
            ('sales_manager_id', '=', sales_manager.id)
        ])

        invoices = self.env['account.move'].search([
            ('sales_manager_id', '=', sales_manager.id),
            ('move_type', 'in', ['out_invoice', 'out_refund'])
        ])

        active_orders = sale_orders.filtered(lambda so: so.state != 'cancel')
        active_invoices = invoices.filtered(lambda inv: inv.state != 'cancel')

        if active_orders or active_invoices:
            return 'deactivate_active'
        elif sale_orders or invoices:
            return 'deactivate_cancelled'
        else:
            return 'allow'

    def action_open_unmark_wizard(self):
        """Abrir wizard para desvincular/desactivar gestor"""
        self.ensure_one()

        validation_result = self._validate_unmark_sales_manager()

        return {
            'name': _('Desvincular/Desactivar Gestor'),
            'type': 'ir.actions.act_window',
            'res_model': 'sales.manager.unmark.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_partner_id': self.id,
                'default_validation_result': validation_result,
            }
        }

    def action_view_sales_managers(self):
        """Acción para ver los gestores asignados"""
        self.ensure_one()
        return {
            'name': _('Gestores de Ventas'),
            'type': 'ir.actions.act_window',
            'res_model': 'pyxel.sales.manager',
            'view_mode': 'tree,form',
            'domain': [('id', 'in', self.sales_manager_ids.ids)],
        }