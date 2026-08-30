// PYXEL — Portada del marketplace.
//
// JavaScript plano a propósito: la API de "interactions" de Odoo cambió
// entre versiones recientes y este módulo aún no se ha podido ejecutar en
// un Odoo 19 real. Delegación de eventos sobre document, sin dependencias
// del sistema de módulos, funciona igual en cualquier versión.

(function () {
    "use strict";

    // Los ejemplos bajo el buscador rellenan el campo y lanzan la búsqueda.
    // Son <button> y no <a>: actúan sobre el formulario en lugar de navegar,
    // así siguen siendo accesibles con teclado sin prometer una URL que no
    // existe.
    document.addEventListener("click", function (ev) {
        var ejemplo = ev.target.closest(".js-px-example");
        if (!ejemplo) {
            return;
        }
        var contenedor = ejemplo.closest(".px-intent");
        var campo = contenedor && contenedor.querySelector(".px-intent__input");
        if (!campo || !campo.form) {
            return;
        }
        campo.value = ejemplo.textContent.trim();
        campo.form.submit();
    });
})();
