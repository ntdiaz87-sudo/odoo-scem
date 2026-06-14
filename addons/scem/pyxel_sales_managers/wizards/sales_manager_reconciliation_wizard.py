# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import base64
from io import BytesIO
import xlsxwriter


class SalesManagerReconciliationWizard(models.TransientModel):
    _name = 'sales.manager.reconciliation.wizard'
    _description = 'Asistente de Conciliación de Gestores de Ventas'

    date_from = fields.Date(
        string='Fecha Desde',
        required=True,
        default=fields.Date.context_today
    )

    date_to = fields.Date(
        string='Fecha Hasta',
        required=True,
        default=fields.Date.context_today
    )

    sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor de Ventas',
        domain=[('active', '=', True)],
        help='Dejar vacío para incluir todos los gestores activos'
    )

    document_type = fields.Selection([
        ('sale_order', 'Pedidos de Venta'),
        ('invoice', 'Facturas'),
        ('both', 'Ambos')
    ], string='Tipo de Documento', default='both', required=True)

    product_id = fields.Many2one(
        'product.product',
        string='Producto',
        help='Filtrar por producto específico (opcional)'
    )

    state = fields.Selection([
        ('draft', 'Borrador'),
        ('confirmed', 'Confirmado')
    ], string='Estado', default='confirmed')

    # Campos para descargar Excel
    excel_file = fields.Binary(
        string='Archivo Excel',
        readonly=True
    )

    excel_filename = fields.Char(
        string='Nombre del Archivo',
        readonly=True
    )

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        """Validar que la fecha desde sea menor o igual a fecha hasta"""
        for wizard in self:
            if wizard.date_from > wizard.date_to:
                raise UserError(_('La fecha desde no puede ser mayor a la fecha hasta.'))

    def action_generate_report(self):
        self.ensure_one()

        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        if enabled != 'True':
            raise UserError(_(
                'El módulo de Gestores de Ventas no está habilitado.\n'
                'Active la opción en Configuración > Ajustes > Gestores de Ventas.'
            ))

        data = self._get_report_data()

        if not data:
            raise UserError(_(
                'No se encontraron registros para el período y filtros seleccionados.'
            ))

        # 🔹 NO crear registros, solo pasar data
        return self.env.ref(
            'pyxel_sales_managers.action_report_sales_manager_reconciliation_pdf'
        ).report_action(self, data={'lines': data})

    def action_print_pdf(self):
        """Imprimir reporte en PDF"""
        self.ensure_one()

        # Validar que el módulo esté habilitado
        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        if enabled != 'True':
            raise UserError(_(
                'El módulo de Gestores de Ventas no está habilitado.'
            ))

        data = self._get_report_data()

        if not data:
            raise UserError(_(
                'No se encontraron registros para el período y filtros seleccionados.'
            ))

        return self.env.ref(
            'pyxel_sales_managers.action_report_sales_manager_reconciliation_pdf'
        ).report_action(self)

    def action_generate_excel(self):
        """Generar archivo Excel"""
        self.ensure_one()

        # Validar que el módulo esté habilitado
        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        if enabled != 'True':
            raise UserError(_(
                'El módulo de Gestores de Ventas no está habilitado.'
            ))

        data = self._get_report_data()

        if not data:
            raise UserError(_(
                'No se encontraron registros para el período y filtros seleccionados.'
            ))

        # Generar Excel
        excel_file = self._generate_excel_file(data)

        # Guardar el archivo en el wizard
        filename = f'Conciliacion_Gestores_{self.date_from.strftime("%Y%m%d")}_{self.date_to.strftime("%Y%m%d")}.xlsx'
        self.write({
            'excel_file': excel_file,
            'excel_filename': filename
        })

        # Retornar acción para descargar
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content?model={self._name}&id={self.id}&field=excel_file&filename_field=excel_filename&download=true',
            'target': 'self',
        }

    def _generate_excel_file(self, data):
        """Generar archivo Excel manualmente"""
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        sheet = workbook.add_worksheet('Conciliación Gestores')

        # Formatos
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'center',
            'valign': 'vcenter'
        })

        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D3D3D3',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })

        manager_header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1,
            'font_size': 12
        })

        cell_format = workbook.add_format({
            'border': 1,
            'valign': 'vcenter'
        })

        number_format = workbook.add_format({
            'border': 1,
            'num_format': '#,##0.00',
            'align': 'right'
        })

        percent_format = workbook.add_format({
            'border': 1,
            'num_format': '0.00"%"',
            'align': 'right'
        })

        total_format = workbook.add_format({
            'bold': True,
            'bg_color': '#E0E0E0',
            'border': 1,
            'num_format': '#,##0.00',
            'align': 'right'
        })

        # Título
        sheet.merge_range('A1:I1', 'CONCILIACIÓN DE GESTORES DE VENTAS', title_format)
        sheet.write('A2', f'Período: {self.date_from.strftime("%d/%m/%Y")} - {self.date_to.strftime("%d/%m/%Y")}')

        doc_type_label = dict(self._fields['document_type'].selection).get(self.document_type)
        sheet.write('A3', f'Tipo: {doc_type_label}')

        # Configurar anchos de columna
        sheet.set_column('A:A', 20)  # Documento
        sheet.set_column('B:B', 12)  # Fecha
        sheet.set_column('C:C', 15)  # Cód. Producto
        sheet.set_column('D:D', 40)  # Producto
        sheet.set_column('E:E', 12)  # Cantidad
        sheet.set_column('F:F', 12)  # P. Unit.
        sheet.set_column('G:G', 15)  # Subtotal
        sheet.set_column('H:H', 10)  # Com. %
        sheet.set_column('I:I', 15)  # Imp. Com.

        # Agrupar por gestor
        managers = {}
        for item in data:
            manager_id = item['sales_manager_id']
            if manager_id not in managers:
                managers[manager_id] = []
            managers[manager_id].append(item)

        row = 4
        grand_total_sales = 0
        grand_total_commission = 0

        # Procesar cada gestor
        for manager_id, manager_lines in managers.items():
            first_line = manager_lines[0]

            # Encabezado del gestor
            sheet.merge_range(row, 0, row, 8,
                              f"GESTOR: {first_line['sales_manager_name']} ({first_line['sales_manager_code']})",
                              manager_header_format)
            row += 1

            # Encabezados de columna
            headers = ['Documento', 'Fecha', 'Cód. Prod.', 'Producto',
                       'Cantidad', 'P. Unit.', 'Subtotal', 'Com. %', 'Imp. Com.']
            for col, header in enumerate(headers):
                sheet.write(row, col, header, header_format)
            row += 1

            # Líneas del gestor
            manager_total_sales = 0
            manager_total_commission = 0

            for line in manager_lines:
                sheet.write(row, 0, line['document_name'], cell_format)
                sheet.write(row, 1, line['document_date'].strftime('%d/%m/%Y') if line['document_date'] else '',
                            cell_format)
                sheet.write(row, 2, line['product_code'], cell_format)
                sheet.write(row, 3, line['product_name'], cell_format)
                sheet.write(row, 4, line['quantity'], number_format)
                sheet.write(row, 5, line['price_unit'], number_format)
                sheet.write(row, 6, line['price_subtotal'], number_format)
                sheet.write(row, 7, line['product_commission_percent'] / 100, percent_format)
                sheet.write(row, 8, line['commission_amount'], number_format)

                manager_total_sales += line['price_subtotal']
                manager_total_commission += line['commission_amount']
                row += 1

            # Total del gestor
            sheet.merge_range(row, 0, row, 5, 'TOTAL GESTOR:', total_format)
            sheet.write(row, 6, manager_total_sales, total_format)
            sheet.write(row, 7, '', total_format)
            sheet.write(row, 8, manager_total_commission, total_format)
            row += 2

            grand_total_sales += manager_total_sales
            grand_total_commission += manager_total_commission

        # Total general
        sheet.merge_range(row, 0, row, 5, 'TOTAL GENERAL:', total_format)
        sheet.write(row, 6, grand_total_sales, total_format)
        sheet.write(row, 7, '', total_format)
        sheet.write(row, 8, grand_total_commission, total_format)

        workbook.close()
        output.seek(0)

        return base64.b64encode(output.read())

    def _get_report_data(self):
        """Obtener datos para el reporte"""
        self.ensure_one()

        data = []

        # Procesar Pedidos de Venta
        if self.document_type in ('sale_order', 'both'):
            sale_orders = self._get_sale_orders()
            for order in sale_orders:
                for line in order.order_line.filtered(lambda l: not l.display_type):
                    # Aplicar filtro de producto si existe
                    if self.product_id and line.product_id != self.product_id:
                        continue

                    # Obtener comisión del producto
                    product_commission = line.product_id.sales_manager_commission or 0.0
                    commission_amount = line.price_subtotal * (product_commission / 100)

                    data.append({
                        'sales_manager_id': order.sales_manager_id.id,
                        'sales_manager_name': order.sales_manager_id.partner_id.name,
                        'sales_manager_code': order.sales_manager_id.partner_id.sales_manager_code or '',
                        'document_type': 'sale_order',
                        'document_name': order.name,
                        'document_id': order.id,
                        'document_date': order.date_order,
                        'confirmation_date': order.date_order,
                        'sales_proof': order.sales_proof,
                        'sales_proof_filename': order.sales_proof_filename,
                        'product_id': line.product_id.id,
                        'product_name': line.product_id.display_name,
                        'product_code': line.product_id.default_code or '',
                        'quantity': line.product_uom_qty,
                        'price_unit': line.price_unit,
                        'price_subtotal': line.price_subtotal,
                        'product_commission_percent': product_commission,
                        'commission_amount': commission_amount,
                        'currency_id': order.currency_id.id,
                        'currency_symbol': order.currency_id.symbol,
                        'state': order.state,
                    })

        # Procesar Facturas
        if self.document_type in ('invoice', 'both'):
            invoices = self._get_invoices()
            for invoice in invoices:
                for line in invoice.invoice_line_ids.filtered(lambda l: not l.display_type):
                    # Aplicar filtro de producto si existe
                    if self.product_id and line.product_id != self.product_id:
                        continue

                    # Obtener comisión del producto
                    product_commission = line.product_id.sales_manager_commission or 0.0
                    commission_amount = line.price_subtotal * (product_commission / 100)

                    data.append({
                        'sales_manager_id': invoice.sales_manager_id.id,
                        'sales_manager_name': invoice.sales_manager_id.partner_id.name,
                        'sales_manager_code': invoice.sales_manager_id.partner_id.sales_manager_code or '',
                        'document_type': 'invoice',
                        'document_name': invoice.name,
                        'document_id': invoice.id,
                        'document_date': invoice.invoice_date,
                        'confirmation_date': invoice.invoice_date,
                        'sales_proof': invoice.sales_proof,
                        'sales_proof_filename': invoice.sales_proof_filename,
                        'product_id': line.product_id.id,
                        'product_name': line.product_id.display_name,
                        'product_code': line.product_id.default_code or '',
                        'quantity': line.quantity,
                        'price_unit': line.price_unit,
                        'price_subtotal': line.price_subtotal,
                        'product_commission_percent': product_commission,
                        'commission_amount': commission_amount,
                        'currency_id': invoice.currency_id.id,
                        'currency_symbol': invoice.currency_id.symbol,
                        'state': invoice.state,
                    })

        return data

    def _get_sale_orders(self):
        """Obtener pedidos de venta según filtros"""
        domain = [
            ('date_order', '>=', self.date_from),
            ('date_order', '<=', self.date_to),
            ('sales_manager_id', '!=', False),
            ('sales_manager_id.active', '=', True),
        ]

        # Estado
        if self.state == 'confirmed':
            domain.append(('state', 'in', ['sale', 'done']))
        else:
            domain.append(('state', '!=', 'cancel'))

        # Gestor específico
        if self.sales_manager_id:
            domain.append(('sales_manager_id', '=', self.sales_manager_id.id))

        return self.env['sale.order'].search(domain)

    def _get_invoices(self):
        """Obtener facturas según filtros"""
        domain = [
            ('invoice_date', '>=', self.date_from),
            ('invoice_date', '<=', self.date_to),
            ('move_type', '=', 'out_invoice'),
            ('sales_manager_id', '!=', False),
            ('sales_manager_id.active', '=', True),
        ]

        # Estado
        if self.state == 'confirmed':
            domain.append(('state', '=', 'posted'))
        else:
            domain.append(('state', '!=', 'cancel'))

        # Gestor específico
        if self.sales_manager_id:
            domain.append(('sales_manager_id', '=', self.sales_manager_id.id))

        return self.env['account.move'].search(domain)

    def _create_report_lines(self, data):
        """
        Preparar líneas del reporte (sin usar ORM sobre report.*)
        """
        lines = []
        for item in data:
            lines.append(item)
        return lines
