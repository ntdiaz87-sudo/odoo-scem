/** @odoo-module **/

import animation from "@website/js/content/snippets.animation";
import { _t } from "@web/core/l10n/translation";
import { jsonrpc, RPCError } from "@web/core/network/rpc_service";


animation.registry.deal_seller_multi_product_custom_snippet = animation.Class.extend({
        selector: ".deal_multi_product_slider",
        disabledInEditableMode: false,
        start: function() {
            var self = this;
            this.redrow();
            if (this.editableMode) {
                var $multi_cat_slider = $('#wrapwrap').find('.deal_multi_product_slider');
                var multi_cat_name = _t("Multi Deals Slider")

                // _.each($multi_cat_slider, function (single){
                // $multi_cat_slider.each(function(){
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
                var slider_deals = self.$target.attr('data-multi-deal-of-day-type');
                jsonrpc("/deal/product_multi_get_dynamic_seller", {
                    'slider-deal': self.$target.attr('data-multi-deal-of-day-type') || '',
                }).then(function(data) {
                    if (data) {
                        var sct_rtl = false;
                        if ($('#wrapwrap').hasClass('o_rtl')) {
                            sct_rtl = true;
                        }
                        self.$target.empty();
                        self.$target.append(data);
                        $(".deal_multi_product_slider").removeClass('hidden');

                        jsonrpc('/theme_scita/product_multi_deal_seller_config', {
                            'slider_deals': slider_deals,
                        }).then(function(res) {
                            $('div.product-slider ').owlCarousel({
                                loop:false,
                                rewind:true,
                                margin:25,
                                items: 5,
                                rtl: sct_rtl,
                                nav:true,
                                autoplay:true,
                                autoplayTimeout:4000,
                                autoplayHoverPause:true,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    375: {
                                        items: 1,
                                    },
                                    767: {
                                        items: 1,
                                    },
                                    1000: {
                                        items: 1,
                                    },
                                    1600: {
                                        items: 1,
                                    },
                                },
                            });
                            $('div.deal-slider').owlCarousel({
                                loop:false,
                                rewind:true,
                                margin:25,
                                items: 5,
                                rtl: sct_rtl,
                                nav:true,
                                autoplay:true,
                                autoplayTimeout:4000,
                                autoplayHoverPause:true,
                                responsive: {
                                    0: {
                                        items: 1,
                                    },
                                    375: {
                                        items: 1
                                    },
                                    767: {
                                        items: 1,
                                    },
                                    1000: {
                                        items: 1,
                                    },
                                    1600: {
                                        items: 1,
                                    },
                                },
                            });
                        });
                    }
                });
            }
        },
        stop: function(){
            this.clean();
        },
        redrow: function(debug){
            this.clean(debug);
            this.build(debug);
        },

        clean:function(debug){
            this.$target.empty();
        },
        build: function(debug)
        {
              var self = this;
              var date = self.$target.data("date");
              if(date != "nan"){
                  var toDate = new Date(date).getTime();
                  var x = setInterval(function() {
                        
                        // Get todays date and time
                        var now = new Date().getTime();
                        
                        // Find the diffrence between now an the count down date
                        var diffrence = toDate - now;// Time calculations for days, hours, minutes and seconds
                        
                        if (diffrence > 0) {
                                var days = Math.floor(diffrence / (1000 * 60 * 60 * 24));
                                var hours = Math.floor((diffrence % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                var minutes = Math.floor((diffrence % (1000 * 60 * 60)) / (1000 * 60));
                                var seconds = Math.floor((diffrence % (1000 * 60)) / 1000);
                                
                                if ((seconds+'').length == 1) {
                                    seconds = "0" + seconds;
                                }
                                if ((days+'').length == 1) {
                                    days = "0" + days;
                                }
                                if ((hours+'').length == 1) {
                                    hours = "0" + hours;
                                }
                                if ((minutes+'').length == 1) {
                                    minutes = "0" + minutes;
                                }
                        
                        }
                        // If the count down is over, write some text
                        if (diffrence <= 0) 
                        {
                            clearInterval(x);
                            seconds = "00" ;
                            days = "00";
                            minutes = "00";
                            hours = "00";
                            self.$target.find(".counter_timer_main_div").addClass("time_out");
                            self.$target.find(".counter_timer_main_div").append("<div class='time_over_msg'><p>"+self.$target.data("msg")+"</p></div>");
                        }
                        else
                        {   
                            self.$target.find(".counter_timer_main_div").removeClass("time_out");
                        }
                         
                        
                            if(self.$target.find(".counter_timer_div"))
                            {
                                self.$target.find(".counter_timer_div").remove()
                                var append_data="<div class='counter_timer_div'><span class='col-3 text-center box_degit_wrapper'><div class='box_degit'><span id='days' class='d-count  t_days_hr_min_sec_digit o_default_snippet_text'>"+    days +"</span><span id='day_lbl' class='d-block'>DAYS</span></div></span><span class='col-3 text-center box_degit_wrapper'><div class='box_degit'><span id='hours' class='d-count  t_days_hr_min_sec_digit o_default_snippet_text'>"+hours+"</span><span id='h_lbl' class='d-block'>HOURS</span></div></span><span class='col-3 text-center box_degit_wrapper'><div class='box_degit'><span id='minutes' class='d-count t_days_hr_min_sec_digit o_default_snippet_text'>"+minutes+"</span><span id='m_lbl' class=' d-block'>MINS</span></div></span><span class='col-3 text-center box_degit_wrapper'><div class='box_degit'><span id='seconds' class='d-count t_days_hr_min_sec_digit o_default_snippet_text'>"+seconds+"</span><span id='s_lbl' class='d-block'>SECS</span></div></span></div>";
                                self.$target.find(".counter_timer_div").css("display","block")
                                self.$target.find(".counter_timer_main_div").append(append_data)    
                            }
                        }
                        , 1000);
                   }      
        }
    });
animation.registry.oe_category_slider = animation.Class.extend({
    selector: ".oe_category_slider",
    disabledInEditableMode: false,
    start: function() {
        var self = this;
        if (this.editableMode) {
            $('.oe_category_slider .owl-carousel').empty();
            var $brand_snip = $('#wrapwrap').find('.oe_category_slider .owl-carousel');
            // $.each($brand_snip, function(single) {
            $brand_snip.each(function(){
                $(this).empty();
            });
        }
        if (!this.editableMode) {
            var slider_type = self.$target.attr('data-category-config-type');
            var color = self.$target.attr('data-category-color');
            jsonrpc("/theme_scita/dynamic_color_category_slider", {
                'slider-id': slider_type || '',
                'color': color || '',
            }).then(function(data) {
                if (data) {
                    var sct_rtl = false;
                    if ($('#wrapwrap').hasClass('o_rtl')) {
                        sct_rtl = true;
                    }
                    self.$target.empty();
                    self.$target.append(data);
                    $(".oe_brand_slider").removeClass('o_hidden');
                    $('.sct-category').owlCarousel({
                        nav:true,
                        margin: 10,
                        items:7,
                        loop:false,
                        rewind:true,
                        autoplay:true,
                        autoplayTimeout:4000,
                        autoplayHoverPause:true,
                        rtl: sct_rtl,
                        dots:false,
                        responsive: {
                                0:{
                                    items:2
                                },
                                400:{
                                    items:3
                                },
                                768:{
                                    items:5,
                                    margin:10
                                },
                                1024:{
                                    items:6,
                                    margin:10
                                },
                                1266:{
                                    items:7,
                                    margin:20
                                },
                                1440:{
                                    items:7,
                                    margin:30
                                },
                        },
                    });
                }
            });
        }
    }
});
animation.registry.oe_deal_of_the_day = animation.Class.extend({
    selector: ".oe_deal_of_the_day",
    disabledInEditableMode: false,
    start: function() {
        var self = this;
        if (this.editableMode) {
            var $multi_cat_slider = $('#wrapwrap').find('.oe_deal_of_the_day');
            var multi_cat_name = _t("Deal of the day")
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
            var slider_deals = self.$target.attr('data-deal-snippet-id');
            jsonrpc("/deal/deal_of_the_day_new", {
                'slider-deal': self.$target.attr('data-deal-snippet-id') || '',
            }).then(function(data) {
                if (data) {
                    self.$target.empty();
                    self.$target.append(data);
                    $(".oe_deal_of_the_day").removeClass('hidden');

                    self.set_timer();
                }
            });
        }
    },
    stop: function(){
        this.clean();
    },
    redrow: function(debug){
        this.clean(debug);
        this.build(debug);
    },

    clean:function(debug){
        this.$target.empty();
    },

    set_timer: function() {
        var self = this;
        var date = self.$target.data("date");
        if(date != "nan"){
            var toDate = new Date(date).getTime();
            var x = setInterval(function() {
                var now = new Date().getTime();
                var diffrence = toDate - now;// Time calculations for days, hours, minutes and seconds
                if (diffrence > 0) {
                        var days = Math.floor(diffrence / (1000 * 60 * 60 * 24));
                        var hours = Math.floor((diffrence % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        var minutes = Math.floor((diffrence % (1000 * 60 * 60)) / (1000 * 60));
                        var seconds = Math.floor((diffrence % (1000 * 60)) / 1000);
                        
                        if ((seconds+'').length == 1) {
                            seconds = "0" + seconds;
                        }
                        if ((days+'').length == 1) {
                            days = "0" + days;
                        }
                        if ((hours+'').length == 1) {
                            hours = "0" + hours;
                        }
                        if ((minutes+'').length == 1) {
                            minutes = "0" + minutes;
                        }
                }
                // If the count down is over, write some text
                if (diffrence <= 0) {
                    clearInterval(x);
                    seconds = "00" ;
                    days = "00";
                    minutes = "00";
                    hours = "00";
                    self.$target.find('.counter_timer_main_div').addClass("time_out");
                    self.$target.find('.deal_day_top_inner').addClass("title_time_out");
                    self.$target.find('.counter_timer_main_div').append("<div class='time_over_msg'><p>"+self.$target.data("msg")+"</p></div>");
                } else {
                    self.$target.find('.counter_timer_main_div').removeClass("time_out");
                    self.$target.find('.deal_day_top_inner').removeClass("title_time_out");
                }
                if(self.$target.find('.counter_timer_main_div').find(".counter_timer_div")){
                    self.$target.find('.counter_timer_main_div').find(".counter_timer_div").remove()
                    var append_data="<div class='counter_timer_div'><span class='col-lg-3 col-md-3 col-sm-3 col-3 text-center'><div class='box_degit'><span id='days' class='d-count  t_days_hr_min_sec_digit o_default_snippet_text'>"+    days +"</span><span id='day_lbl' class='d-block'>D</span></div></span><span class='col-lg-3 col-md-3 col-sm-3 col-3 text-center'><div class='box_degit'><span id='hours' class='d-count  t_days_hr_min_sec_digit o_default_snippet_text'>"+hours+"</span><span id='h_lbl' class='d-block'>H</span></div></span><span class='col-lg-3 col-md-3 col-sm-3 col-3 text-center'><div class='box_degit'><span id='minutes' class='d-count t_days_hr_min_sec_digit o_default_snippet_text'>"+minutes+"</span><span id='m_lbl' class=' d-block'>M</span></div></span><span class='col-lg-3 col-md-3 col-sm-3 col-3 text-center'><div class='box_degit'><span id='seconds' class='d-count t_days_hr_min_sec_digit o_default_snippet_text'>"+seconds+"</span><span id='s_lbl' class='d-block'>S</span></div></span></div>";
                    self.$target.find('.counter_timer_main_div').find('counter_timer_div').css("display","block")
                    self.$target.find('.counter_timer_main_div').append(append_data)
                }
            }, 1000);
        }
    },
    build: function(debug){
        this.set_timer();
    },
});