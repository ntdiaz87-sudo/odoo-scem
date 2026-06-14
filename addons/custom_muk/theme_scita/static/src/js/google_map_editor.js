/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import { renderToElement } from "@web/core/utils/render";
import { jsonrpc, RPCError } from "@web/core/network/rpc_service";
import { _t } from "@web/core/l10n/translation";

    options.registry.s_google_map = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.find(".google_map_v1").empty();
            if (!editMode) {
                self.$el.find(".google_map_v1").on("click", $.bind(self.map, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.map()) {
                this.map().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        map: function(type, value) {
            var self = this;
            self.$modal = $(renderToElement("theme_scita.s_google_map_modal"));
            self.$modal.appendTo('body');
            self.$modal.modal('show');
            // address_html_code
            var $address_data = self.$modal.find("#set_map_data");
            $address_data.on('click', function() {
                var html_code = self.$modal.find("textarea#address_html_code").val();
                self.$target.empty().append(html_code);
            });
        }

    });
    options.registry.s_google_map_content = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.find(".google_map_v2").empty();
            if (!editMode) {
                self.$el.find(".google_map_v2").on("click", $.bind(self.map_section, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.map_section()) {
                this.map_section().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        map_section: function(type, value) {
            var self = this;
            self.$modal = $(renderToElement("theme_scita.s_google_map_content_modal"));
            self.$modal.appendTo('body');
            self.$modal.modal('show');
            var $address_set_btn = self.$modal.find("#set_map_data_content");
            $address_set_btn.on('click', function() {
                var html_ecode = self.$modal.find("textarea#address_content_html_code").val();
                self.$target.find(".map_data_container").empty().append(html_ecode)
            });
        }
    });