/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.ProfilePasswordValidation = publicWidget.Widget.extend({
    selector: ".oe_reset_password_form",
    events: {
        submit: "_onSubmit",
    },

    async _onSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        const form = ev.currentTarget;

        // Limpia estados previos
        this._clearErrors(form);

        const oldVal = form.querySelector('input[name="old"]')?.value || "";
        const new1 = form.querySelector('input[name="new1"]')?.value || "";
        const new2 = form.querySelector('input[name="new2"]')?.value || "";

        // 1) Validación client-side (no refresh)
        if (new1 !== new2) {
            this._setFieldError(form, "new2", "The new password and its confirmation must be identical.");
            return;
        }

        // 2) Enviar al backend por AJAX para que valide current password y haga el cambio
        try {
            const res = await fetch(form.action, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: new URLSearchParams(new FormData(form)),
            });

            let data;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                // útil para debug: console.log(text)
                this._setFormError(form, "Server did not return JSON. Check controller AJAX response.");
                return;
            }


            if (data.success) {
                // OK: limpia campos por seguridad y muestra success
                form.querySelector('input[name="old"]').value = "";
                form.querySelector('input[name="new1"]').value = "";
                form.querySelector('input[name="new2"]').value = "";

                this._showSuccess(form);
                return;
            }

            // Error(s) backend (ej. password.old incorrecta)
            const errors = data.errors || {};
            this._applyBackendErrors(form, errors);

            // Por seguridad NO “persistimos” old; lo vaciamos
            form.querySelector('input[name="old"]').value = "";

        } catch (e) {
            // fallback: error inesperado
            this._setFormError(form, "An unexpected error occurred. Please try again.");
        }
    },

    // ---------------- Helpers ----------------

    _clearErrors(form) {
        // quitar is-invalid
        form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));

        // limpiar feedbacks custom
        form.querySelectorAll(".js-password-feedback").forEach(el => (el.textContent = ""));

        // ocultar alert form-level si existe
        const alert = form.querySelector(".js-password-form-alert");
        if (alert) {
            alert.classList.add("d-none");
            alert.textContent = "";
        }

        // ocultar success si existe
        const ok = form.closest("#security-section")?.querySelector(".js-password-success");
        if (ok) ok.classList.add("d-none");
    },

    _setFieldError(form, fieldName, message) {
        // Mapea name -> id que usas
        const idMap = { old: "#current", new1: "#new", new2: "#new2" };
        const input = form.querySelector(idMap[fieldName] || `input[name="${fieldName}"]`);
        if (input) input.classList.add("is-invalid");

        // feedback debajo del campo (usa contenedores dedicados)
        const fb = form.querySelector(`.js-${fieldName}-feedback`);
        if (fb) fb.textContent = message;
        else this._setFormError(form, message);
    },

    _setFormError(form, message) {
        const alert = form.querySelector(".js-password-form-alert");
        if (alert) {
            alert.textContent = message;
            alert.classList.remove("d-none");
        }
    },

    _applyBackendErrors(form, errors) {
        // errors viene como {"password.old": "...", "password.new2": "..."}
        for (const [key, msg] of Object.entries(errors)) {
            if (!key.startsWith("password.")) continue;
            const short = key.split(".")[1]; // old/new1/new2
            this._setFieldError(form, short, msg);
        }
    },

    _showSuccess(form) {
        const ok = form.closest("#security-section")?.querySelector(".js-password-success");
        if (ok) ok.classList.remove("d-none");
    },
});

