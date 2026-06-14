# Guía de Instalación - Pyxel Sales Managers

## Requisitos Previos

- Odoo 17.0 instalado y funcionando
- Acceso de administrador a Odoo
- Módulos base de Odoo instalados:
  - Contactos
  - Ventas
  - Facturación
  - CRM

## Métodos de Instalación

### Método 1: Instalación Manual

1. **Descargar el módulo**
   - Descarga el archivo ZIP del módulo
   - Extrae el contenido

2. **Copiar a la carpeta de addons**
   ```bash
   cp -r pyxel_sales_managers /path/to/odoo/addons/
   ```

3. **Establecer permisos**
   ```bash
   sudo chown -R odoo:odoo /path/to/odoo/addons/pyxel_sales_managers
   sudo chmod -R 755 /path/to/odoo/addons/pyxel_sales_managers
   ```

4. **Reiniciar servicio de Odoo**
   ```bash
   sudo systemctl restart odoo
   # o
   sudo service odoo restart
   ```

5. **Activar modo desarrollador en Odoo**
   - Ir a Ajustes
   - Scroll hasta el final
   - Click en "Activar el modo de desarrollador"

6. **Actualizar lista de aplicaciones**
   - Ir a Aplicaciones
   - Click en el menú de opciones (tres puntos)
   - Seleccionar "Actualizar lista de aplicaciones"
   - Confirmar la actualización

7. **Instalar el módulo**
   - Buscar "Pyxel Sales Managers"
   - Click en "Instalar"
   - Esperar a que se complete la instalación

### Método 2: Instalación desde línea de comandos

```bash
# Navegar al directorio de Odoo
cd /path/to/odoo

# Instalar el módulo
./odoo-bin -c /etc/odoo/odoo.conf -d your_database -i pyxel_sales_managers --stop-after-init

# Reiniciar Odoo
sudo systemctl restart odoo
```

### Método 3: Instalación en entorno Docker

```bash
# Si estás usando Docker Compose
docker-compose down
docker-compose up -d

# O si usas Docker directamente
docker restart odoo_container_name
```

## Configuración Post-Instalación

### 1. Configurar Permisos de Usuario

1. Ir a **Ajustes > Usuarios y Compañías > Usuarios**
2. Seleccionar un usuario
3. En la pestaña "Derechos de Acceso"
4. Buscar "Gestores de Ventas"
5. Asignar el nivel apropiado:
   - **Usuario**: Solo lectura
   - **Gestor**: Lectura y escritura
   - **Administrador**: Acceso completo

### 2. Configurar Opciones del Módulo

1. Ir a **Ventas > Configuración > Ajustes**
2. Buscar la sección **"Gestores de Ventas"**
3. Configurar:
   - ☑ **Asignar Gestor Automáticamente**: Asigna automáticamente el gestor del cliente
   - ☑ **Gestor de Ventas Requerido**: Hace obligatorio el campo en órdenes
   - ☑ **Habilitar Jerarquía de Gestores**: Permite definir gestores superiores
   - **Tasa de Comisión por Defecto**: Valor predeterminado (ej: 5.0%)
4. Guardar cambios

### 3. Crear Gestores de Ventas Iniciales

1. Ir a **Ventas > Gestores de Ventas > Gestores**
2. Click en "Crear"
3. Completar información:
   - Nombre del gestor
   - Contacto asociado (crear uno nuevo si es necesario)
   - Tasa de comisión
   - Equipo de ventas
   - Fechas de vigencia
4. Guardar

### 4. Asignar Gestores a Clientes Existentes

Opción A - Individual:
1. Ir a **Contactos**
2. Abrir un contacto cliente
3. Pestaña "Ventas y Compras"
4. Seleccionar "Gestor de Ventas Principal"
5. Guardar

Opción B - Masiva (si tienes datos demo):
1. Ir a **Aplicaciones**
2. Buscar "Pyxel Sales Managers"
3. Activar datos de demostración si están disponibles

### 5. Verificar la Instalación

Comprueba que todo funciona correctamente:

- [ ] Menú "Gestores de Ventas" visible en Ventas
- [ ] Puede crear un nuevo gestor
- [ ] Campo "Gestor de Ventas" visible en contactos
- [ ] Campo "Gestor de Ventas" visible en órdenes de venta
- [ ] Campo "Gestor de Ventas" visible en facturas
- [ ] Reporte "Análisis de Gestores" accesible
- [ ] Configuración visible en Ajustes > Ventas

## Solución de Problemas

### El módulo no aparece en la lista

**Solución:**
```bash
# Verificar que el módulo está en la carpeta correcta
ls -la /path/to/odoo/addons/pyxel_sales_managers

# Verificar permisos
sudo chown -R odoo:odoo /path/to/odoo/addons/pyxel_sales_managers

# Limpiar caché y reiniciar
rm -rf ~/.local/share/Odoo/sessions/*
sudo systemctl restart odoo
```

### Error al instalar: Dependencias no encontradas

**Solución:**
1. Verificar que están instalados:
   - Contactos
   - Ventas (sale_management)
   - Facturación (account)
   - CRM
2. Instalar módulos faltantes
3. Reintentar instalación

### Errores de permisos

**Solución:**
```bash
# Establecer propietario correcto
sudo chown -R odoo:odoo /path/to/odoo/addons/pyxel_sales_managers

# Establecer permisos correctos
sudo chmod -R 755 /path/to/odoo/addons/pyxel_sales_managers

# Reiniciar Odoo
sudo systemctl restart odoo
```

### No se ven los menús

**Solución:**
1. Verificar que el usuario tiene permisos
2. Cerrar sesión y volver a iniciar
3. Limpiar caché del navegador
4. Verificar que el módulo está instalado (no solo descargado)

### Error en la base de datos

**Solución:**
```bash
# Actualizar el módulo
./odoo-bin -c /etc/odoo/odoo.conf -d your_database -u pyxel_sales_managers --stop-after-init

# Si persiste, desinstalar y reinstalar
./odoo-bin -c /etc/odoo/odoo.conf -d your_database --uninstall pyxel_sales_managers --stop-after-init
./odoo-bin -c /etc/odoo/odoo.conf -d your_database -i pyxel_sales_managers --stop-after-init
```

## Actualización del Módulo

Si ya tienes una versión anterior instalada:

1. **Hacer backup de la base de datos**
   ```bash
   pg_dump your_database > backup_$(date +%Y%m%d).sql
   ```

2. **Reemplazar archivos del módulo**
   ```bash
   rm -rf /path/to/odoo/addons/pyxel_sales_managers
   cp -r pyxel_sales_managers_new /path/to/odoo/addons/pyxel_sales_managers
   ```

3. **Actualizar el módulo**
   ```bash
   ./odoo-bin -c /etc/odoo/odoo.conf -d your_database -u pyxel_sales_managers --stop-after-init
   ```

4. **Reiniciar Odoo**
   ```bash
   sudo systemctl restart odoo
   ```

## Desinstalación

Si necesitas desinstalar el módulo:

1. **Desde la interfaz:**
   - Ir a Aplicaciones
   - Buscar "Pyxel Sales Managers"
   - Click en "Desinstalar"
   - Confirmar

2. **Desde línea de comandos:**
   ```bash
   ./odoo-bin -c /etc/odoo/odoo.conf -d your_database --uninstall pyxel_sales_managers --stop-after-init
   ```

**Nota:** La desinstalación eliminará:
- Todos los registros de gestores de ventas
- Las relaciones gestor-cliente
- Los datos en órdenes de venta y facturas permanecerán pero sin el gestor asignado

## Contacto y Soporte

Para soporte técnico o consultas:
- **Website:** https://www.pyxel.com
- **Email:** support@pyxel.com

## Notas Importantes

- **Backup:** Siempre haz backup antes de instalar módulos nuevos
- **Ambiente de prueba:** Prueba primero en un ambiente de desarrollo
- **Compatibilidad:** Este módulo es compatible con Odoo 17.0
- **Datos demo:** El módulo incluye datos de demostración para testing

## Recursos Adicionales

- [Documentación de Odoo](https://www.odoo.com/documentation/17.0/)
- [Guía de Desarrollo de Módulos](https://www.odoo.com/documentation/17.0/developer.html)
- README.md del módulo para información detallada de uso
