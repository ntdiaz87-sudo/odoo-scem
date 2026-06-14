/** @odoo-module **/
import { registry } from "@web/core/registry";

export const seoValidationService = {
    dependencies: ["notification"],

    start(env, { notification }) {
        return {
            validateMetaDescription(description) {
                const length = description ? description.length : 0;
                let isValid = true;
                let message = "";

                if (length === 0) {
                    message = "La meta descripción está vacía (se recomienda de 50 a 160 caracteres)";
                    isValid = false;
                } else if (length < 50) {
                    message = `Description too short: ${length} characters (minimum 50)`;
                    isValid = false;
                } else if (length > 160) {
                    message = `Description too long: ${length} characters (maximum 160)`;
                    isValid = false;
                } else if (length >= 120 && length <= 160) {
                    message = `Excellent length: ${length} characters`;
                } else {
                    message = `Good length: ${length} characters (optimal is 120-160)`;
                }

                return { isValid, message, length };
            },

            validateTitle(title) {
                const length = title ? title.length : 0;
                let isValid = true;
                let message = "";

                if (length === 0) {
                    message = "El título está vacío (se recomienda de 50 a 60 caracteres)";
                    isValid = false;
                } else if (length < 50) {
                    message = `Title too short: ${length} characters (50-60 recommended)`;
                    isValid = false;
                } else if (length > 60) {
                    message = `Title too long: ${length} characters (50-60 recommended)`;
                    isValid = false;
                } else {
                    message = `Perfect length: ${length} characters`;
                }

                return { isValid, message, length };
            }
        };
    }
};

registry.category("services").add("seo_validation", seoValidationService);