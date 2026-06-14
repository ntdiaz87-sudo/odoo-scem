# Pyxel Sales Managers - Módulo Odoo 17

## Descripción

Módulo completo para la gestión de gestores de ventas en Odoo 17. Permite registrar, organizar y analizar el desempeño de los gestores de ventas con integración completa en los módulos de Contactos, Ventas y Facturación.

## Características Principales

### 1. Gestión de Gestores de Ventas
- **Registro completo** de información del gestor
- **Código único** autogenerado para cada gestor
- **Tasa de comisión** configurable por gestor
- **Jerarquía de gestores** (gestor superior)
- **Relación con usuarios** de Odoo
- **Asignación de clientes** específicos a cada gestor
- **Integración con equipos de ventas**

### 2. Integración con Contactos
- Campo de **gestor de ventas principal** en contactos
- **Múltiples gestores** asignados por contacto
- Vista de estadísticas de gestores en contactos
- Búsqueda y filtrado por gestor

### 3. Integración con Ventas
- **Campo de gestor** en órdenes de venta
- **Cálculo automático de comisiones** basado en la tasa del gestor
- Asignación automática desde el cliente (opcional)
- Análisis de ventas por gestor
- Filtros y agrupaciones por gestor

### 4. Integración con Facturación
- Campo de gestor en facturas
- Cálculo de comisiones en facturas
- Análisis de facturación por gestor
- Herencia de gestor en notas de crédito

### 5. Reportes y Análisis
- **Reporte de análisis** de gestores con vistas:
  - Tabla con totales
  - Gráficos de barras
  - Tabla dinámica (pivot)
- Métricas incluidas:
  - Total de ventas
  - Total facturado
  - Total de comisiones
  - Número de órdenes
  - Número de facturas

### 6. Configuración Flexible
Opciones configurables en Ajustes > Ventas:
- **Asignación automática** de gestor desde el cliente
- **Gestor requerido** en órdenes de venta
- **Jerarquía de gestores** habilitada/deshabilitada
- **Tasa de comisión por defecto**

### 7. Seguridad por Roles
Tres niveles de acceso:
- **Usuario**: Lectura de todos los gestores
- **Gestor**: Lectura, escritura y creación
- **Administrador**: Acceso completo incluyendo eliminación

## Estructura del Módulo

```
pyxel_sales_managers/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── sales_manager.py          # Modelo principal
│   ├── res_partner.py             # Extensión de contactos
│   ├── sale_order.py              # Extensión de ventas
│   ├── account_move.py            # Extensión de facturas
│   └── res_config_settings.py    # Configuración
├── views/
│   ├── sales_manager_views.xml
│   ├── res_partner_views.xml
│   ├── sale_order_views.xml
│   ├── account_move_views.xml
│   ├── res_config_settings_views.xml
│   └── menu_views.xml
├── reports/
│   ├── __init__.py
│   ├── sales_manager_report.py
│   └── sales_manager_report_views.xml
├── security/
│   ├── sales_manager_security.xml
│   └── ir.model.access.csv
├── data/
│   └── sales_manager_data.xml
├── demo/
│   └── sales_manager_demo.xml
└── README.md
```

## Instalación

1. Copiar el módulo en la carpeta `addons` de Odoo
2. Actualizar la lista de aplicaciones
3. Buscar "Pyxel Sales Managers"
4. Hacer clic en "Instalar"

## Configuración Inicial

1. Ir a **Ventas > Configuración > Ajustes**
2. Buscar la sección **"Gestores de Ventas"**
3. Configurar las opciones según necesidades:
   - Asignación automática
   - Gestor requerido
   - Jerarquía
   - Tasa de comisión por defecto

## Uso

### Crear un Gestor de Ventas

1. Ir a **Ventas > Gestores de Ventas > Gestores**
2. Hacer clic en **"Crear"**
3. Completar la información:
   - Nombre del gestor
   - Contacto asociado
   - Tasa de comisión
   - Equipo de ventas
   - Gestor superior (opcional)
4. Asignar clientes en la pestaña **"Clientes Asignados"**
5. Guardar

### Asignar Gestor a un Cliente

1. Ir a **Contactos**
2. Abrir un contacto cliente
3. En la pestaña **"Ventas y Compras"**
4. Seleccionar el **"Gestor de Ventas Principal"**
5. Opcionalmente agregar gestores adicionales
6. Guardar

### Crear Orden de Venta con Gestor

1. Ir a **Ventas > Órdenes > Presupuestos**
2. Crear nueva orden
3. Seleccionar cliente (el gestor se asigna automáticamente si está configurado)
4. Verificar/cambiar el **"Gestor de Ventas"** si es necesario
5. La comisión se calcula automáticamente

### Ver Reportes

1. Ir a **Ventas > Gestores de Ventas > Análisis de Gestores**
2. Seleccionar la vista deseada (Gráfico, Pivot o Lista)
3. Aplicar filtros por fecha, gestor, equipo, etc.
4. Analizar métricas de rendimiento

## Campos Principales

### Modelo pyxel.sales.manager

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | Char | Nombre del gestor |
| `code` | Char | Código único autogenerado |
| `partner_id` | Many2one | Contacto asociado |
| `user_id` | Many2one | Usuario de Odoo |
| `commission_rate` | Float | Tasa de comisión (%) |
| `sales_team_id` | Many2one | Equipo de ventas |
| `manager_id` | Many2one | Gestor superior |
| `customer_ids` | Many2many | Clientes asignados |
| `date_start` | Date | Fecha de inicio |
| `date_end` | Date | Fecha de fin |
| `total_sales` | Monetary | Total de ventas |
| `total_invoiced` | Monetary | Total facturado |

## Dependencias

- `base` - Módulo base de Odoo
- `contacts` - Gestión de contactos
- `sale_management` - Gestión de ventas
- `account` - Contabilidad y facturación
- `crm` - CRM

## Compatibilidad

- **Versión de Odoo**: 17.0
- **Edición**: Community y Enterprise
- **Licencia**: LGPL-3

## Soporte y Desarrollo

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de desarrollo de Pyxel.

## Autor

**Pyxel**
- Website: https://www.pyxel.com

## Licencia

Este módulo está licenciado bajo LGPL-3.

## Changelog

### Versión 17.0.1.0.0 (2025-01-12)
- Versión inicial
- Gestión completa de gestores de ventas
- Integración con Contactos, Ventas y Facturación
- Sistema de comisiones
- Reportes y análisis
- Configuración flexible
- Sistema de seguridad por roles
