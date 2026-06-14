odoo.define('theme_scita.see_more_brand_js',[], function(require) {
   "use strict";
    $(document).ready(function() {
        var size_div = $("#myList div").length;
        var x = 7;
        
        $('#myList div:lt('+x+')').show();
        $('#myList div').not(':lt('+x+')').hide();
        if (size_div > 7){
            $('a#loadMore').removeClass('o_hidden');
        }
        $('a#loadMore').click(function() {
            x= (x+5 <= size_div) ? x+5 : size_div;
            $('#myList div:lt('+x+')').show();
            $('a#showLess').removeClass('o_hidden');
            if (x == size_div){
                $('a#loadMore').addClass('o_hidden');
            }
        });
        $('a#showLess').click(function() {
            x=(x-5<0) ? 3 : x-5;
            $('#myList div').not(':lt('+x+')').hide();
            if (x <= 7){
                $('a#showLess').addClass('o_hidden');
                $('a#loadMore').removeClass('o_hidden');
            }
            if (x <= 7){
                $('#myList div:lt('+7+')').show();
            }
        });
    });

});