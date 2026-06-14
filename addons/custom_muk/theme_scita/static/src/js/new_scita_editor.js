/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import { renderToElement } from "@web/core/utils/render";
import { jsonrpc, RPCError } from "@web/core/network/rpc_service";
import { _t } from "@web/core/l10n/translation";
import snippetsEditor from "@web_editor/js/editor/snippets.editor";


options.registry.deal_seller_multi_product_custom_snippet = options.Class.extend({

    start: function(editMode) {
        var self = this;
        this._super();
        this.$target.removeClass("hidden");
        this.$target.find('.deal_multi_product_slider .owl-carousel').empty();
        if (!editMode) {
            self.$el.find(".deal_multi_product_slider").on("click", $.bind(self.multi_category_slider, self));
        }
    },

    onBuilt: function() {
        var self = this;
        this._super();
        if (this.multi_category_slider()) {
            this.multi_category_slider().fail(function() {
                self.getParent()._removeSnippet();
            });
        }
    },

    cleanForSave: function() {
        $('.deal_multi_product_slider .owl-carousel').empty();
    },

    multi_category_slider: function(type, value) {
        var self = this;
        if (type != undefined && type == false || type == undefined) {
            self.$modal = $(renderToElement("theme_scita.multi_product_deal_custom_slider_configuration"));
            // self.$modal.find("input#date").min=today;

            self.$modal.appendTo('body');
            self.$modal.modal('show');
            var $slider_deals = self.$modal.find("#slider_deals"),
                $cancel = self.$modal.find("#cancel"),
                $snippnet_submit = self.$modal.find("#snippnet_submit");
            jsonrpc('/theme_scita/deal_get_options', {}).then(function(res) {
                $("select[id='slider_deals'] option").remove();
                $.each(res, function(y) {
                    $("select[id='slider_deals']").append($('<option>', {
                        value: res[y]["id"],
                        text: res[y]["name"]
                    }));
                });
            });

            $snippnet_submit.on('click', function() {
                // var type = '';
                var date = new Date(self.$modal.find("input#date").val());
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();

                var $mins_ret = self.$modal.find("input[name='minutes']")
                var count_hours = parseInt(self.$modal.find("input#hours").val());
                var count_min = parseInt(self.$modal.find("input#minutes").val());
                var count_sec = parseInt(self.$modal.find("input#second").val());
                var monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                                        ];

                var formated_date = monthShortNames[month] + ' ' + day + ',' + year + ' ' + count_hours + ':' + count_min + ':' + count_sec;

                if(date == 'Invalid Date')
                    {
                        alert("Invalid Time Format. Please enter correct format of Time")
                        self.$target.attr("data-date","nan");
                        self.$target.attr("data-msg", self.$modal.find("input#sale_over").val());
                        self.$modal.modal('hide');
                        self.date_configure('click')
                    }
                else
                    {
                        self.$target.attr("data-date", formated_date);
                        self.$target.attr("data-msg", self.$modal.find("input#sale_over").val());
                        self.$modal.modal('hide');
                    }

                self.$target.attr('data-multi-deal-of-day-type', $slider_deals.val());
                // self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                self.$target.attr('data-multi-cat-dealer-id', 'multi-cat-myowl' + $slider_deals.val());
                if ($('select#slider_deals').find(":selected").text()) {
                    var type = '';
                    type = _t($('select#slider_deals').find(":selected").text());
                } else {
                    var type = '';
                    type = _t("Multi Product Deal Slider");
                }
                self.$target.empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 class="section-title style1">\
                                                                <span>' + type + '</span>\
                                                            </h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>');
            });
        } else {
            return;
        }
    },
});

options.registry.oe_category_slider = options.Class.extend({

    start: function(editMode) {
        var self = this;
        this._super();
        this.$target.removeClass("hidden");
        this.$target.find(".oe_category_slider .owl-carousel").empty();

         if (!editMode) {
            self.$el.find(".oe_category_slider").on("click", $.bind(self.scita_category_slider, self));
        }
    },

    onBuilt: function() {
        var self = this;
        this._super();
        if (this.scita_category_slider()) {
            this.scita_category_slider().fail(function() {
                self.getParent()._removeSnippet();
            });
        }
    },

    cleanForSave: function() {
        $('.oe_category_slider .owl-carousel').empty();
    },

    scita_category_slider: function(type, value) {
        var self = this;
        if (type != undefined && type == false || type == undefined) {
            self.$modal = $(renderToElement("theme_scita.scita_category_gray_slider_configration"));
            self.$modal.appendTo('body');
            self.$modal.modal('show');
            var $slider_type = self.$modal.find("#slider_type"),
                $cancel = self.$modal.find("#cancel"),
                $color = self.$modal.find("#color"),
                $category_sub_data = self.$modal.find("#pro_category_sub_data");

            jsonrpc('/theme_scita/category_get_options', {}).then(function(res) {
                $('#slider_type option[value!="0"]').remove();
                $.each(res, function(y) {
                    $("select[id='slider_type']").append($('<option>', {
                        value: res[y]["id"],
                        text: res[y]["name"]
                    }));
                });
            });

            $category_sub_data.on('click', function() {
                var type = '';
                self.$target.attr('data-category-config-type', $slider_type.val());
                self.$target.attr('data-category-config-id', $slider_type.val());
                self.$target.attr('data-category-color', $color.val());
                if ($('select#slider_type').find(":selected").text()) {
                    type = _t($('select#slider_type').find(":selected").text());
                } else {
                    type = _t("Our Brands");
                }
                self.$target.empty().append('<div class="container">\
                                                <div class="row oe_our_slider">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 class="section-title style1">\
                                                                <span>' + type + '</span>\
                                                            </h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>');
            });
        } else {
            return;
        }
    },
});
options.registry.oe_deal_of_the_day = options.Class.extend({
    start: function(editMode) {
        var self = this;
        this._super();
        this.$target.removeClass("hidden");
        this.$target.find('.oe_deal_of_the_day .deal_day_bottom_inner').empty();
        if (!editMode) {
            self.$el.find(".oe_deal_of_the_day").on("click", $.bind(self.set_deal_of_the_day_products, self));
        }
    },

    onBuilt: function() {
        var self = this;
        this._super();
        if (this.set_deal_of_the_day_products()) {
            this.set_deal_of_the_day_products().fail(function() {
                self.getParent()._removeSnippet();
            });
        }
    },

    cleanForSave: function() {
        $('.oe_deal_of_the_day .deal_day_bottom_inner').empty();
    },

    set_deal_of_the_day_products: function(type, value) {
        var self = this;
        if (type != undefined && type == false || type == undefined) {
            self.$modal = $(renderToElement("theme_scita.deal_of_the_day_configration"));
            self.$modal.appendTo('body');
            self.$modal.modal('show');
            var $slider_deals = self.$modal.find("#slider_deals_select"),
                $cancel = self.$modal.find("#cancel"),
                $snippnet_submit = self.$modal.find("#snippnet_submit");
            jsonrpc('/theme_scita/deal_get_options', {}).then(function(res) {
                $("select[id='slider_deals_select'] option").remove();
                $.each(res, function(y) {
                    $("select[id='slider_deals_select']").append($('<option>', {
                        value: res[y]["id"],
                        text: res[y]["name"]
                    }));
                });
            });

            $snippnet_submit.on('click', function() {
                var date = new Date(self.$modal.find("input#date").val());
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();
                var $mins_ret = self.$modal.find("input[name='minutes']")
                var count_hours = parseInt(self.$modal.find("input#hours").val());
                var count_min = parseInt(self.$modal.find("input#minutes").val());
                var count_sec = parseInt(self.$modal.find("input#second").val());
                var monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                                        ];
                var formated_date = monthShortNames[month] + ' ' + day + ',' + year + ' ' + count_hours + ':' + count_min + ':' + count_sec;
                if(date == 'Invalid Date')
                    {
                        alert("Invalid Time Format. Please enter correct format of Time")
                        self.$target.attr("data-date","nan");
                        self.$target.attr("data-msg", self.$modal.find("input#sale_over").val());
                        self.$modal.modal('hide');
                        self.date_configure('click')
                    }
                else
                    {
                        self.$target.attr("data-date", formated_date);
                        self.$target.attr("data-msg", self.$modal.find("input#sale_over").val());
                        self.$modal.modal('hide');
                    }
                self.$target.attr('data-deal-snippet-id', $slider_deals.val());
                if ($('select#slider_deals_select').find(":selected").text()) {
                    var type = '';
                    type = _t($('select#slider_deals_select').find(":selected").text());
                } else {
                    var type = '';
                    type = _t("Deal Of The Day");
                }
                self.$target.empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 class="section-title style1">\
                                                                <span>' + type + '</span>\
                                                            </h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>');
            });
        } else {
            return;
        }
    },
});