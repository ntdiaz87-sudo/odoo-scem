/** @odoo-module **/

import animation from "@website/js/content/snippets.animation";
import { _t } from "@web/core/l10n/translation";
import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc, RPCError } from "@web/core/network/rpc_service";
$(document).ready(function(){
    if($(".oe_website_sale").length === 0){
        $("div#wrap").addClass("oe_website_sale");
    }
    if($(".js_sale").length === 0){
        $("div#wrap").addClass("js_sale");
    }
});
    animation.registry.oe_cat_slider = animation.Class.extend({
        selector: ".oe_cat_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $cate_slider = $('#wrapwrap').find('#theme_scita_custom_category_slider');
                var cat_name = _t("Category Slider")
                $cate_slider.each(function(){

                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + cat_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-cat-slider-id');
                jsonrpc("/theme_scita/category_get_dynamic_slider", {
                    'slider-id': self.$target.attr('data-cat-slider-id') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".oe_cat_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.second_cat_slider = animation.Class.extend({
        selector: ".second_cat_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $cate_slider = $('#wrapwrap').find('#second_custom_category_slider');
                var cat_name = _t("Category Slider")
                $cate_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + cat_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-cat-slider-id');
                jsonrpc("/theme_scita/second_get_dynamic_cat_slider", {
                    'slider-id': self.$target.attr('data-cat-slider-id') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".second_cat_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.theme_scita_product_slider = animation.Class.extend({
        selector: ".oe_prod_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $prod_slider = $('#wrapwrap').find('#theme_scita_custom_product_slider');
                var prod_name = _t("Products Slider")
                $prod_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + prod_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-prod-slider-id');
                jsonrpc("/theme_scita/product_get_dynamic_slider",{
                    'slider-id': self.$target.attr('data-prod-slider-id') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".oe_prod_slider").removeClass('o_hidden');
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        jsonrpc('/theme_scita/product_image_effect_config', {
                            'slider_id': slider_id
                        }).then(function(res) {
                            $('div#' + res.s_id).owlCarousel({
                                margin: 10,
                                responsiveClass: true,
                                items: res.counts,
                                loop: false,
                                rewind:true,
                                nav:true,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    420: {
                                        items: 2,
                                    },
                                    768: {
                                        items: 3,
                                    },
                                    1000: {
                                        items: res.counts,
                                    },
                                    1500: {
                                        items: res.counts,
                                    },
                                },
                            });
                            
                        });
                    }
                });
            }
        }
    });
    animation.registry.scita_multi_cat_custom_snippet = animation.Class.extend({
        selector: ".oe_multi_category_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.oe_multi_category_slider');
                var multi_cat_name = _t("Multi Product Slider")
                $multi_cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1"><span>'+ multi_cat_name+'</span></h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-multi-cat-slider-type');
                jsonrpc("/retial/product_multi_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-multi-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".oe_multi_category_slider").removeClass('hidden');
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        jsonrpc('/theme_scita/product_multi_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('div.retail_featured_product_1 .owl-carousel').owlCarousel({
                                loop:false,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                margin:30,
                                nav:false,
                                rewind:true,
                                items: 4,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    420: {
                                        items: 2,
                                    },
                                    767: {
                                        items: 3,
                                    },
                                    1000: {
                                        items: 4,
                                    },
                                
                                },
                            });
                            $(document).ajaxComplete(function() {
                                setTimeout(function(){
                                    var divWidth = $('.retail_featured_product_1 .cs-product .pwp-img a').width();
                                    if (divWidth == 0) {
                                        divWidth = $('.retail_featured_product_1 .cs-product .pwp-img a:visible').width();
                                    }
                                    $('.retail_featured_product_1 .cs-product .pwp-img a').height(divWidth);
                                },100);
                            });
                        });

                    }
                });
            }
        }
    });
    animation.registry.fashion_multi_cat_custom_snippet = animation.Class.extend({
        selector: ".fashion_multi_category_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.fashion_multi_category_slider');
                var multi_cat_name = _t("Multi Product Slider")
                $multi_cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1"><span>'+ multi_cat_name+'</span></h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-multi-cat-slider-type');
                jsonrpc("/fashion/fashion_product_multi_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-multi-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".fashion_multi_category_slider").removeClass('hidden');
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        var WebsiteSale = new publicWidget.registry.WebsiteSale();
                        WebsiteSale.init();
                        jsonrpc('/theme_scita/product_multi_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('div.fashion_featured_product_1 .fashion_cro ').owlCarousel({
                                loop:false,
                                rewind:true,
                                autoplay: false,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                margin:0,
                                items: 5,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    375: {
                                        items: 2,
                                        margin: 0
                                    },
                                    767: {
                                        items: 3,
                                    },
                                    1000: {
                                        items: 4,
                                    },
                                    1600: {
                                        items: 5,
                                    },
                                },
                            });
                        });
                        $(document).on('change', 'input[name="add_qty"]', function(ev){
                            WebsiteSale._onChangeAddQuantity(ev);
                        });
                        $(document).on('click', '.dropdown-plus', function(ev){
                                ev.stopPropagation();
                                ev.stopImmediatePropagation();
                                $(ev.currentTarget).next().toggleClass("o_hidden")
                            });
                        
                        $(document).ajaxComplete(function() {
                            setTimeout(function(){
                                var divWidth = $('.fashion_featured_product_1 .cs-product .pwp-img a').width();
                                if (divWidth == 0) {
                                    divWidth = $('.retail_featured_product_1 .cs-product .pwp-img a:visible').width();
                                }
                                $('.fashion_featured_product_1 .cs-product .pwp-img a').height(divWidth);
                            },100);
                        });
                    }
                });
            }
        }
    });
    // // for brand slider 
    animation.registry.prod_brands = animation.Class.extend({
        selector: ".oe_brand_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                $('.oe_brand_slider .owl-carousel').empty();
                var $brand_snip = $('#wrapwrap').find('.oe_brand_slider .owl-carousel');
                // $.each($brand_snip, function(single) {
                $brand_snip.each(function(){
                    $(this).empty();
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-brand-config-type');
                jsonrpc("/shop/get_brand_slider", {
                    'slider-type': slider_type || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".oe_brand_slider").removeClass('o_hidden');
                        $('.sct-brand-snip').owlCarousel({
                            margin: 10,
                            items:6,
                            loop:false,
                            rewind:true,
                            autoplay:true,
                            autoplayTimeout:4000,
                            autoplayHoverPause:true,
                            rtl: sct_rtl,
                            responsive: {
                                0: {
                                    items: 2
                                },
                                480: {
                                    items: 3
                                },
                                768: {
                                    items: 4
                                },
                                1024: {
                                    items: 6
                                },
                                1500: {
                                    items: 6
                                },
                            },
                        });
                    }
                });
            }
        }
    });
    // // for box brand slider 
    animation.registry.brands_box_slider_4 = animation.Class.extend({
        selector: ".box_brand_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                $('.oe_brand_slider .owl-carousel').empty();
                var $brand_snip = $('#wrapwrap').find('.box_brand_slider .owl-carousel');
                var brand_name = _t("Brand Slider");
                // $.each($brand_snip, function(single) {
                $brand_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + brand_name + '</h3>\
                                                    </div>\
                                                </div>');
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-brand-config-type');
                jsonrpc("/shop/get_box_brand_slider", {
                    'slider-type': slider_type || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty().append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".box_brand_slider").removeClass('o_hidden');
                        $('.sct-brand-slider-2').owlCarousel({
                            margin: 10,
                            items:6,
                            loop:false,
                            autoplay:true,
                            rewind:true,
                            dots:false,
                            autoplayTimeout:5000,
                            autoplayHoverPause:true,
                            rtl: sct_rtl,
                            responsive: {
                                0: {
                                    items: 2
                                },
                                480: {
                                    items: 3
                                },
                                768: {
                                    items: 4
                                },
                                1024: {
                                    items: 6
                                },
                                1500: {
                                    items: 6
                                },
                            },
                        });
                    }
                });
            }
        }
    });
    // // for brand slider 
    animation.registry.it_prod_brands = animation.Class.extend({
        selector: ".it_brand_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                $('.oe_brand_slider .owl-carousel').empty();
                var $brand_snip = $('#wrapwrap').find('.it_brand_slider .our-brands');
                $brand_snip.each(function(){
                    $(this).empty();
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-brand-config-type');
                jsonrpc("/shop/get_it_brand", {
                    'slider-type': slider_type || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.empty().append(data);
                        $(".it_brand_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.theme_scita_blog_custom_snippet = animation.Class.extend({
        selector: ".scita_blog_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrap').find('.scita_blog_slider');
                var blog_name = _t("Blog Slider")
                
                // $.each($blog_snip, function (single){
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {

                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".scita_blog_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.health_blog_custom_snippet = animation.Class.extend({
        selector: ".health_blog_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#health_custom_blog_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/health_blog_get_dynamic_slider",{
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".health_blog_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.blog_2_custom_snippet = animation.Class.extend({
        selector: ".blog_2_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_2_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){    
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/second_blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".blog_2_custom").removeClass('o_hidden');
                        jsonrpc('/theme_scita/blog_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('#blog_2_owl_carosel').owlCarousel({
                                margin: 30,
                                items: 3,
                                loop: false,
                                dots:false,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                rtl: sct_rtl,
                                nav: false,
                                rewind:true,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    420: {
                                        items: 2,
                                    },
                                    768: {
                                        items: 3,
                                    },
                                    1000: {
                                        items: 3,
                                    },
                                    1500: {
                                        items: 3,
                                    }
                                },
                            });
                        });
                    }
                });
            }
        }
    });
    animation.registry.blog_3_custom_snippet = animation.Class.extend({
        selector: ".blog_3_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_3_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/third_blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".blog_3_custom").removeClass('o_hidden');
                        jsonrpc('/theme_scita/blog_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('#blog_3_owl_carosel').owlCarousel({
                                margin: 40,
                                items: 3,
                                loop: false,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                nav: false,
                                dots:false,
                                rewind:true,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    576: {
                                        items: 2,
                                    },
                                    1000: {
                                        items: 3,
                                    }
                                },
                            });
                        });
                    }
                });
            }
        }
    });
    animation.registry.blog_4_custom_snippet = animation.Class.extend({
        selector: ".blog_4_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_4_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/forth_blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".blog_4_custom").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.blog_6_custom_snippet = animation.Class.extend({
        selector: ".blog_6_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_6_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/six_blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".blog_4_custom").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.blog_5_custom_snippet = animation.Class.extend({
        selector: ".blog_5_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_5_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/fifth_blog_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".blog_5_custom").removeClass('o_hidden');
                        jsonrpc('/theme_scita/blog_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('#blog_5_owl_carosel').owlCarousel({
                                margin: 30,
                                items: 3,
                                loop: false,
                                dots:false,
                                rewind:true,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                nav: false,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    576: {
                                        items: 2,
                                    },
                                    1000: {
                                        items: 3,
                                    }
                                },
                            });
                        });
                    }
                });
            }
        }
    });
    animation.registry.blog_8_custom_snippet = animation.Class.extend({
        selector: ".blog_8_custom",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $blog_snip = $('#wrapwrap').find('#blog_custom_8_snippet');
                var blog_name = _t("Blog Slider")
                $blog_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + blog_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-blog-slider-type');
                jsonrpc("/theme_scita/eight_blog_get_dynamic_slider",{
                    'slider-type': self.$target.attr('data-blog-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".blog_8_custom").removeClass('o_hidden');
                        jsonrpc('/theme_scita/blog_image_effect_config', {
                            'slider_type': slider_type
                        }).then(function(res) {
                            $('#blog_8_owl_carosel').owlCarousel({
                                margin: 30,
                                items: 3,
                                loop: false,
                                autoplay: res.auto_rotate,
                                autoplayTimeout:res.auto_play_time,
                                autoplayHoverPause:true,
                                rewind:true,
                                nav: false,
                                dots:true,
                                rtl: sct_rtl,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    768: {
                                        items: 2,
                                    },
                                    1000: {
                                        items: 3,
                                    }
                                },
                            });
                        });
                    }
                });
            }
        }
    });
    // // Client sliders 
    animation.registry.s_theme_scita_client_slider_snippet = animation.Class.extend({
        selector: ".our-client-slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $client_slider = $('#wrapwrap').find('#theme_scita_custom_client_slider');
                var client_name = _t("Client Slider")
                $client_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + client_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                jsonrpc("/theme_scita/get_clients_dynamically_slider",{}).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $('div#scita-client-slider').owlCarousel({
                            loop: false,
                            margin: 40,
                            nav: false,
                            rewind:true,
                            autoplay:true,
                            dots:false,
                            autoplayTimeout:4000,
                            autoplayHoverPause:true,
                            rtl: sct_rtl,
                            responsive: {
                                0: {
                                    items: 1,
                                },
                                420: {
                                    items: 2,
                                },
                                768: {
                                    items: 4,
                                },
                                1000: {
                                    items: 6,
                                },
                                1500: {
                                    items: 6,
                                }
                            }
                        });
                    }
                });
            }
        }
    });
    // // Client sliders 2
    animation.registry.second_client_slider_snippet = animation.Class.extend({
        selector: ".our-partner-client-slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $client_slider = $('#wrapwrap').find('#second_custom_client_slider');
                var client_name = _t("Our Partners")
                $client_slider.each(function(){
                    $(this).empty().append('')
                });
            }
            if (!this.editableMode) {
                jsonrpc("/theme_scita/second_get_clients_dynamically_slider", {}).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                    }
                });
            }
        }
    });
    // // Client sliders 2
    animation.registry.third_client_slider_snippet = animation.Class.extend({
        selector: ".testimonial-client-slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $client_slider = $('#wrapwrap').find('#our_partner_testimonial');
                var client_name = _t("Our Partners")
                $client_slider.each(function(){
                    $(this).empty().append('')
                });
            }
            if (!this.editableMode) {
                jsonrpc("/theme_scita/third_get_clients_dynamically_slider", {}).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                    }
                });
            }
        }
    });
    animation.registry.it_our_team = animation.Class.extend({
        selector: ".our_team_1",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#it_our_team');
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_one/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:6,
                        dots:false,
                        rewind:true,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:3
                            },
                            1000:{
                                items:4
                            },
                            1200:{
                                items:5
                            },
                            1600:{
                                items:6
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_2 = animation.Class.extend({
        selector: ".our_team_2",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_2');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_two/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_2_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:4,
                        rewind:true,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        dots:false,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:3
                            },
                            1000:{
                                items:4
                            },
                            1200:{
                                items:4
                            },
                            1600:{
                                items:4
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_3 = animation.Class.extend({
        selector: ".our_team_3",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_3');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_three/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_3_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:3,
                        dots:false,
                        rewind:true,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:3
                            },
                            1000:{
                                items:3
                            },
                            1200:{
                                items:3
                            },
                            1600:{
                                items:3
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_4 = animation.Class.extend({
        selector: ".our_team_4",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_4');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_four/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_4_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:4,
                        autoplay:true,
                        rewind:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        dots:false,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            576:{
                                items:2
                            },
                            992:{
                                items: 3
                            },
                            1200:{
                                items:4
                            },
                            1600:{
                                items:4
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_5 = animation.Class.extend({
        selector: ".our_team_5",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_5');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_five/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_5_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:3,
                        autoplay:true,
                        rewind:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        dots:false,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:2
                            },
                            768:{
                                items:3
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_6 = animation.Class.extend({
        selector: ".our_team_6",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_6');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_six/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_6_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        rewind:true,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        items:3,
                        dots:false,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:2
                            },
                            1000:{
                                items:3
                            },
                            1200:{
                                items:3
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.our_team_varient_7 = animation.Class.extend({
        selector: ".our_team_7",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $team_one = $('#wrapwrap').find('#our_team_varient_7');

                // $.each($team_one, function (single){
                $team_one.each(function(){
                    $(this).empty().append('');
                });
            }
            if (!this.editableMode) {
                jsonrpc("/biztech_emp_data_seven/employee_data", {}).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    $('#v_7_myourteam').owlCarousel({
                        loop:false,
                        margin:30,
                        nav:false,
                        items:2,
                        rewind:true,
                        dots:false,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        autoHeight: false,
                        rtl: sct_rtl,
                        responsive:{
                            0:{
                                items:1
                            },
                            600:{
                                items:2
                            },
                            1000:{
                                items:2
                            },
                            1200:{
                                items:2
                            },
                            1600:{
                                items:2
                            }
                        }
                    });
                })
            }
        }
    });
    animation.registry.cat_slider_3 = animation.Class.extend({
        selector: ".cat_slider_3",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $cate_slider = $('#wrapwrap').find('#theme_scita_custom_category_slider_3');
                var cat_name = _t("Category Slider")
                // $.each($cate_slider, function (single){

                $cate_slider.each(function(){  
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + cat_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-cat-slider-id');
                jsonrpc("/theme_scita/category_slider_3",{
                    'slider-id': self.$target.attr('data-cat-slider-id') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".cat_slider_3").removeClass('o_hidden');
                        $('div#carousel_category').owlCarousel({
                            loop:false,
                            margin:20,
                            nav:true,
                            autoplay:true,
                            rewind:true,
                            dots:false,
                            autoplayTimeout:2500,
                            autoplayHoverPause:true,
                            rtl: sct_rtl,
                            responsive:{
                                400:{
                                    items:2
                                },
                                767:{
                                    items:3
                                },
                                992:{
                                    items:4
                                },
                                1400:{
                                    items:6
                                }
                            }
                        })
                    }
                });
            }
        }
    });
    animation.registry.cat_slider_4 = animation.Class.extend({
        selector: ".cat_slider_4",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $cate_slider = $('#wrapwrap').find('#theme_scita_custom_category_slider_4');
                var cat_name = _t("Category Slider")
                // $.each($cate_slider, function (single){
                $cate_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + cat_name + '</h3>\
                                                    </div>\
                                                </div>')
                });
            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-cat-slider-id');
                jsonrpc("/theme_scita/category_slider_4", {
                    'slider-id': self.$target.attr('data-cat-slider-id') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        $(".cat_slider_4").removeClass('o_hidden');
                        $('div#cat_slider_4_owl').owlCarousel({
                            loop:false,
                            margin:20,
                            nav:false,
                            autoplay:true,
                            rewind:true,
                            dots:false,
                            autoplayTimeout:2500,
                            autoplayHoverPause:true,
                            rtl: sct_rtl,
                            responsive:{
                                0:{
                                    items:1
                                },
                                400:{
                                    items:2
                                },
                                767:{
                                    items:3
                                },
                                992:{
                                    items:4
                                }
                            }
                        })
                    }
                });
            }
        }
    });
    // // new brand and product/category snippet
    animation.registry.custom_scita_product_category_slider = animation.Class.extend({

        selector: ".custom_oe_pro_cat_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $cat_slider = $('#wrapwrap').find('.custom_oe_pro_cat_slider');
                var cat_name = _t("Product/Category Slider")
                // $.each($cat_slider, function (single){
                $cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row oe_our_slider">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1">\
                                                                <span>'+ cat_name+'</span>\
                                                            </h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-prod-cat-slider-type');
                jsonrpc("/theme_scita/custom_pro_get_dynamic_slider", {
                    'slider-type': self.$target.attr('data-prod-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".custom_oe_pro_cat_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    animation.registry.custom_scita_brand_custom_slider = animation.Class.extend({

        selector: ".custom_scita_pro_brand_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $brand_slider = $('#wrapwrap').find('.custom_scita_pro_brand_slider');
                var brand_name = _t("Our Brands")
                // $.each($brand_slider, function (single){
                $brand_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-brands">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 class="section-title style1" id="snippet-title">\
                                                                <span>'+ brand_name +'</span>\
                                                            </h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-brand-config-type');
                jsonrpc("/theme_scita/custom_get_brand_slider", {
                    'slider-type': slider_type || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".custom_scita_pro_brand_slider").removeClass('o_hidden');
                    }
                });
            }
        }
    });
    // // brand and product/category snippet end
    animation.registry.product_category_img_slider_config = animation.Class.extend({
        selector: ".multi_product_and_category_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.multi_product_and_category_slider');
                var multi_cat_name = _t("Image Product/Category Snippet")

                // $.each($multi_cat_slider, function (single){
                $multi_cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1"><span>'+ multi_cat_name+'</span></h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-multi-cat-slider-type');
                jsonrpc("/product_category_img_slider", {
                    'slider-type': self.$target.attr('data-multi-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".multi_product_and_category_slider").removeClass('hidden');
                        $(document).ajaxComplete(function() {
                            $(document).on('click', '.dropdown-plus', function(ev){
                                ev.stopPropagation();
                                ev.stopImmediatePropagation();
                                $(ev.currentTarget).next().toggleClass("o_hidden")
                            });
                        })
                    }
                });
            }
        }
    });
    animation.registry.sct_product_snippet_1 = animation.Class.extend({
        selector: ".sct_product_snippet_1",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.sct_product_snippet_1');
                var multi_cat_name = _t("Multi Product")

                // $.each($multi_cat_slider, function (single){
                $multi_cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1"><span>'+ multi_cat_name+'</span></h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-multi-cat-slider-type');
                jsonrpc("/product_column_five", {
                    'slider-type': self.$target.attr('data-multi-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".sct_product_snippet_1").removeClass('hidden');
                        setTimeout(function(){
                            var divWidth = $('.sct_product_snippet_1 .cs-product .pwp-img a').width(); 
                            $('.sct_product_snippet_1 .cs-product .pwp-img a').height(divWidth);
                        },400);
                    }
                });
            }
        }
    });


    animation.registry.sct_product_snippet_2 = animation.Class.extend({
        selector: ".sct_product_snippet_2",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.sct_product_snippet_2');
                var multi_cat_name = _t("Multi Product")

                // $.each($multi_cat_slider, function (single){
                $multi_cat_slider.each(function(){
                    $(this).empty().append('<div class="container">\
                                                <div class="row our-categories">\
                                                    <div class="col-md-12">\
                                                        <div class="title-block">\
                                                            <h4 id="snippet-title" class="section-title style1"><span>'+ multi_cat_name+'</span></h4>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>')
                });

            }
            if (!this.editableMode) {
                var slider_type = self.$target.attr('data-multi-cat-slider-type');
                jsonrpc("/product/product_snippet_data_two", {
                    'slider-type': self.$target.attr('data-multi-cat-slider-type') || '',
                }).then(function(data) {
                    if (data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".sct_product_snippet_2").removeClass('hidden');
                        setTimeout(function(){
                            var divWidth = $('.sct_product_snippet_2 .cs-product .pwp-img a').width(); 
                            $('.sct_product_snippet_2 .cs-product .pwp-img a').height(divWidth);
                        },400);
                    }
                });
            }
        }
    });
    
    // // Dynamic Video banner js start
    animation.registry.dynamic_video_banner = animation.Class.extend({
        selector: ".dynamic_video_banner",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            if (this.editableMode) {
                var $vid_snip = $('#wrapwrap').find('.dynamic_video_banner');
                var video_title = _t("Video Banner")
                // $.each($vid_snip, function(single) {
                $vid_snip.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + video_title + '</h3>\
                                                    </div>\
                                                </div>');
                });
                

            }
            if (!this.editableMode) {
                $.get("/video/video_url_get", {
                    'video_url': self.$target.attr('data-video-url'),
                }).then(function(data) {
                    if (data) {
                        self.$target.empty().append(data);
                        $(".dynamic_video_banner").removeClass('o_hidden');
                    }
                });
            }
        }
    });
//     Dynamic Video banner js End
        // Dynamic Top Dealers Snippet Start
        animation.registry.dynamic_top_dealers = animation.Class.extend({
            selector: ".oe_top_dealers_section",
            disabledInEditableMode: false,
            start: function(){
                var self = this;
                if (this.editableMode) {
                    self.$target.each(function(){
                    $(this).empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">Top Dealers</h3>\
                                                    </div>\
                                                </div>');
                });
                }
                if (!this.editableMode) {
                    $.get("/theme_scita/top_dealers", {
                    }).then(function(data) {
                        self.$target.empty();
                        self.$target.append(data);
                    });
                }
            },
        });
    // Dynamic Top Dealers Snippet End
        // Dynamic Trending Products Snippet Start
    animation.registry.dynamic_trending_products = animation.Class.extend({
        selector: ".oe_trending_products_section",
        disabledInEditableMode: false,
        start: function(){
            var self = this;
            if (this.editableMode) {
                self.$target.each(function(){
                    $(this).empty().append('<div class="retail_trending_products">\
                                                <div class="container">\
                                                    <div class="lns-inner latest-trendy-section">\
                                                        <div class="row">\
                                                            <div class="lns-post">\
                                                                <div class="psb-inner">\
                                                                    <div class="title-block ">\
                                                                        <h2 class="section-title style1">\
                                                                            Trending Products\
                                                                        </h2>\
                                                                    </div>\
                                                                </div>\
                                                            </div>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>');
                });

            }
            if (!this.editableMode) {
                var slider_id = self.$target.attr('data-cat-slider-id');
                $.get("/theme_scita/trending_products_categories", {
                    'slider-id': self.$target.attr('data-cat-slider-id') || '',
                }).then(function(data) {
                    self.$target.empty();
                    self.$target.append(data);
                    const categoryId = $(".trend_prod_tab")[0].getAttribute('data-category-id');
                     $.get("/theme_scita/get_trending_prducts", {
                        'category': categoryId,
                        'slider-id': self.$target.attr('data-cat-slider-id') || '',
                    }).then(function(data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".theme_scita_trending_products").removeClass('o_hidden');
                        $('div#product_slider').owlCarousel({
                            margin: 30,
                            items:6,
                            loop:false,
                            autoplay:true,
                            rewind:true,
                            dots:false,
                            autoplayTimeout:5000,
                            autoplayHoverPause:true,
                            nav: true,
                            responsive: {
                                0: {
                                    items: 2
                                },
                                480: {
                                    items: 3
                                },
                                768: {
                                    items: 4
                                },
                                1024: {
                                    items: 3
                                },
                                1500: {
                                    items: 3
                                },
                            },
                        });
                    });
                });
                $(document).on("click", ".trend_prod_tab", function (ev) {
                    const categoryId = ev.currentTarget.getAttribute('data-category-id');
                    $(ev.currentTarget).find('a').addClass('active')
                    $.get("/theme_scita/get_trending_prducts", {
                        'category': categoryId,
                        'slider-id': self.$target.attr('data-cat-slider-id') || '',
                    }).then(function(data) {
                        self.$target.empty();
                        self.$target.append(data);
                        $(".theme_scita_trending_products").removeClass('o_hidden');
                        for(let ele of $("#trending_products_categories").find("li.trend_prod_tab > a")){
                            if(ele.classList.contains("active") && ele.classList.contains("show")){
                                ele.classList.remove("active");
                                ele.classList.remove("show");
                            }
                            if(ele.parentElement.getAttribute('data-category-id') == ev.currentTarget.getAttribute('data-category-id')){
                                ele.classList.add("show","active")
                            }
                        }
                        $('div#product_slider').owlCarousel({
                            margin: 30,
                            items:6,
                            loop:false,
                            autoplay:true,
                            rewind:true,
                            dots:false,
                            autoplayTimeout:5000,
                            autoplayHoverPause:true,
                            nav: true,
                            responsive: {
                                0: {
                                    items: 2
                                },
                                480: {
                                    items: 3
                                },
                                768: {
                                    items: 4
                                },
                                1024: {
                                    items: 3
                                },
                                1500: {
                                    items: 3
                                },
                            },
                        });
                    });
                });
            }
        },
    });
    // Dynamic Trending Products Snippet End
// });
