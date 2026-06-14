/** @odoo-module **/

document.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".o_toggle_password");
    if (!btn) return;

    const selector = btn.getAttribute("data-target");
    if (!selector) return;

    const input = document.querySelector(selector);
    if (!input) return;

    const icon = btn.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        btn.setAttribute("aria-label", "Hide password");
        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    } else {
        input.type = "password";
        btn.setAttribute("aria-label", "Show password");
        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
});
