/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import { renderToElement } from "@web/core/utils/render";
import { jsonrpc, RPCError } from "@web/core/network/rpc_service";
import { _t } from "@web/core/l10n/translation";
import snippetsEditor from "@web_editor/js/editor/snippets.editor";
import { Dialog } from "@web/core/dialog/dialog";
import { CodeEditor } from "@web/core/code_editor/code_editor";

    snippetsEditor.SnippetsMenu.include({
        async start() {
            await this._super(...arguments);
            this.waitForElementToDisplay("div#scita_snippets",1000);
        },
        waitForElementToDisplay(selector, time) {
            var self = this;
            if(document.querySelector(selector)!=null) {
                $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                $("select#selSnippetCat").on('change',function(){
                    if($("select#selSnippetCat").val()=='banner')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='newsletter')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='deal_days')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='blog')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='our_team')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='testimonial')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='service')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='portfolio')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='advbanner')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='pricing_table')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='trust_icon')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='contact_us')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='how_it_works')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='statistics')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='content_block')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='client_snippet')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='category_snippet')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='case_study')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='brand')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='about_us')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='accordion')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='timeline')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='timeline')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='multi_product')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp1=multi_product]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");

                    }
                    else if($("select#selSnippetCat").val()=='google_map_snippet')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().removeClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().addClass("o_hidden");
                    }
                    else if($("select#selSnippetCat").val()=='html_builder')
                    {
                        $("#scita_snippets [data-disp=banner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=newsletter]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=deal_days]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=blog]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=our_team]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=testimonial]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=service]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=portfolio]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=advbanner]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=pricing_table]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=trust_icon]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=contact_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=how_it_works]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=statistics]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=content_block]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=client_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=category_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=case_study]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=brand]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=about_us]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=accordion]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=timeline]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=multi_product]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=google_map_snippet]").parent().addClass("o_hidden");
                        $("#scita_snippets [data-disp=html_builder]").parent().removeClass("o_hidden");
                    }
                });
                return;
            }
            else {
                setTimeout(function() {
                    self.waitForElementToDisplay(selector, time);
                }, time);
            }
        },
    });
    options.registry.oe_cat_slider = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".oe_cat_slider").empty();
            if (!editMode) {
                self.$el.find(".oe_cat_slider").on("click", $.bind(self.cat_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.cat_slider()) {
                this.cat_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.oe_cat_slider').empty();
        },

        cat_slider: function(type, value) {
            var self = this;
            
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_category_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $category_slider_delete = self.$modal.find("#cancel"),
                    $pro_cat_sub_data = self.$modal.find("#cat_sub_data");
                jsonrpc('/theme_scita/category_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $pro_cat_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-cat-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Category Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $category_slider_delete.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });

    
    options.registry.second_cat_slider = options.Class.extend({
        start: function(editMode) {
            var self = this;

            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".second_cat_slider").empty();
            if (!editMode) {
                self.$el.find(".second_cat_slider").on("click", $.bind(self.cat_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.cat_slider()) {
                this.cat_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.second_cat_slider').empty();
        },

        cat_slider: function(type, value) {
            var self = this;
            
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_category_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $category_slider_delete = self.$modal.find("#cancel"),
                    $pro_cat_sub_data = self.$modal.find("#cat_sub_data");
                jsonrpc('/theme_scita/category_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $pro_cat_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-cat-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Category Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $category_slider_delete.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.theme_scita_product_slider = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find(".oe_prod_slider").empty();
            if (!editMode) {
                self.$el.find(".oe_prod_slider").on("click", $.bind(self.prod_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.prod_slider()) {
                this.prod_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.oe_prod_slider').empty();
        },

        prod_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_product_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $product_slider_cancel = self.$modal.find("#cancel"),
                    $pro_sub_data = self.$modal.find("#prod_sub_data");

                jsonrpc('/theme_scita/product_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $pro_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-prod-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Product Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $product_slider_cancel.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                });
            } else {
                return;
            }
        },
    });
    options.registry.scita_multi_cat_custom_snippet = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find('.oe_multi_category_slider').empty();
            if (!editMode) {
                self.$el.find(".oe_multi_category_slider").on("click", $.bind(self.multi_category_slider, self));
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
            $('.oe_multi_category_slider').empty();
        },

        multi_category_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.multi_product_custom_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $snippnet_submit = self.$modal.find("#snippnet_submit");

                jsonrpc('/theme_scita/product_multi_get_options', {}).then(function(res) {
                    $("select[id='slider_type'] option").remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $snippnet_submit.on('click', function() {
                    // var type = '';
                    self.$target.attr('data-multi-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        var type = '';
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        var type = '';
                        type = _t("Multi Product Slider");
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
    options.registry.fashion_multi_cat_custom_snippet = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find('.fashion_multi_category_slider .owl-carousel').empty();
            if (!editMode) {
                self.$el.find(".fashion_multi_category_slider").on("click", $.bind(self.multi_category_slider, self));
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
            $('.fashion_multi_category_slider .owl-carousel').empty();
        },

        multi_category_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.multi_product_custom_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $snippnet_submit = self.$modal.find("#snippnet_submit");

                jsonrpc('/theme_scita/product_multi_get_options', {}).then(function(res) {
                    $("select[id='slider_type'] option").remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $snippnet_submit.on('click', function() {
                    // var type = '';
                    self.$target.attr('data-multi-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        var type = '';
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        var type = '';
                        type = _t("Multi Product Slider");
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
    options.registry.prod_brands = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find(".oe_brand_slider .owl-carousel").empty();

             if (!editMode) {
                self.$el.find(".oe_brand_slider").on("click", $.bind(self.scita_brand_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.scita_brand_slider()) {
                this.scita_brand_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.oe_brand_slider .owl-carousel').empty();
        },

        scita_brand_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_brand_configration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $brand_sub_data = self.$modal.find("#pro_brand_sub_data");

                jsonrpc('/theme_scita/brand_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $brand_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-brand-config-type', $slider_type.val());
                    self.$target.attr('data-brand-config-id', $slider_type.val());
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
    // box Brand 
    options.registry.brands_box_slider_4 = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find(".box_brand_slider .owl-carousel").empty();

            if (!editMode) {
                self.$el.find(".box_brand_slider").on("click", $.bind(self.box_brand_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.box_brand_slider()) {
                this.box_brand_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.box_brand_slider .owl-carousel').empty();
        },

        box_brand_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_brand_configration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $brand_sub_data = self.$modal.find("#pro_brand_sub_data");

                jsonrpc('/theme_scita/brand_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $brand_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-brand-config-type', $slider_type.val());
                    self.$target.attr('data-brand-config-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Brand snippet");
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
    // for brand slider
    options.registry.it_prod_brands = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".it_brand_slider").empty();
            if (!editMode) {
                self.$el.find(".it_brand_slider").on("click", $.bind(self.brand_it_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.brand_it_slider()) {
                this.brand_it_slider().fail(function() {
                    self.getParent()._removeSnippet();

                });
            }
        },
        cleanForSave: function() {
            $('.it_brand_slider .owl-carousel').empty();
        },

        brand_it_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_brand_configration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $brand_sub_data = self.$modal.find("#pro_brand_sub_data");

                jsonrpc('/theme_scita/brand_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $brand_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-brand-config-type', $slider_type.val());
                    self.$target.attr('data-brand-config-id', $slider_type.val());
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
    options.registry.health_blog_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.health_blog_slider').empty();
            
            if (!editMode) {
                self.$el.find(".health_blog_slider").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.health_blog_slider').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.theme_scita_blog_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.scita_blog_slider').empty();
           
            if (!editMode) {
                self.$el.find(".scita_blog_slider").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.scita_blog_slider').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.blog_2_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_2_custom').empty();
            
            if (!editMode) {
                self.$el.find(".blog_2_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_2_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.blog_3_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_3_custom').empty();
            
            if (!editMode) {
                self.$el.find(".blog_3_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_3_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    
    options.registry.blog_4_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_4_custom').empty();
           
            if (!editMode) {
                self.$el.find(".blog_4_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_4_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.blog_6_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_6_custom').empty();
           
            if (!editMode) {
                self.$el.find(".blog_6_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_6_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.blog_5_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_5_custom').empty();
            if (!editMode) {
                self.$el.find(".blog_5_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_5_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.blog_8_custom_snippet = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find('.blog_8_custom').empty();
            if (!editMode) {
                self.$el.find(".blog_8_custom").on("click", $.bind(self.theme_scita_blog_slider, self));
            }
        },
        onBuilt: function() {
            var self = this;
            this._super();
            if (this.theme_scita_blog_slider()) {
                this.theme_scita_blog_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },
        cleanForSave: function() {
            $('.blog_8_custom').empty();
        },
        theme_scita_blog_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_blog_slider_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#blog_slider_type"),
                    $blog_slider_cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#blog_sub_data");

                jsonrpc('/theme_scita/blog_get_options', {}).then(function(res) {
                    $('#blog_slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='blog_slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-blog-slider-type', $slider_type.val());
                    self.$target.attr('data-blog-slider-id', 'blog-myowl' + $slider_type.val());
                    if ($('select#blog_slider_type').find(":selected").text()) {
                        type = _t($('select#blog_slider_type').find(":selected").text());
                    } else {
                        type = _t("Blog Post Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $blog_slider_cancel.on('click', function() {
                    // self.$modal.modal('hide')
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    options.registry.cat_slider_3 = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".cat_slider_3").empty();
            if (!editMode) {
                self.$el.find(".cat_slider_3").on("click", $.bind(self.cat_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.cat_slider()) {
                this.cat_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.cat_slider_3').empty();
        },

        cat_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_category_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $category_slider_delete = self.$modal.find("#cancel"),
                    $pro_cat_sub_data = self.$modal.find("#cat_sub_data");
                jsonrpc('/theme_scita/category_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $pro_cat_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-cat-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Category Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $category_slider_delete.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });

    options.registry.cat_slider_4 = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".cat_slider_4").empty();
            if (!editMode) {
                self.$el.find(".cat_slider_4").on("click", $.bind(self.cat_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.cat_slider()) {
                this.cat_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.cat_slider_4').empty();
        },

        cat_slider: function(type, value) {
            var self = this;
            
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_category_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $category_slider_delete = self.$modal.find("#cancel"),
                    $pro_cat_sub_data = self.$modal.find("#cat_sub_data");
                jsonrpc('/theme_scita/category_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $pro_cat_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-cat-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Category Slider");
                    }
                    self.$target.empty().append('<div class="container">\
                                                    <div class="block-title">\
                                                        <h3 class="fancy">' + type + '</h3>\
                                                    </div>\
                                                </div>');
                });
                $category_slider_delete.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });
    // new brand and product/category snippet
    options.registry.custom_scita_product_category_slider = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".custom_oe_pro_cat_slider").empty();
            if (!editMode) {
                self.$el.find(".custom_oe_pro_cat_slider").on("click", $.bind(self.custom_pro_cat_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.custom_pro_cat_slider()) {
                this.custom_pro_cat_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.oe_pro_cat_slider').empty();
        },

        custom_pro_cat_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_product_slider"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $pro_cat_sub_data = self.$modal.find("#prod_sub_data");

                jsonrpc('/theme_scita/pro_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });
                $pro_cat_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-prod-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-prod-cat-slider-id', 'prod-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Product/Category Slider");
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
    options.registry.custom_scita_brand_custom_slider = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".custom_scita_pro_brand_slider").empty();
            if (!editMode) {
                self.$el.find(".custom_scita_pro_brand_slider").on("click", $.bind(self.custom_scita_brand_slider, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.custom_scita_brand_slider()) {
                this.custom_scita_brand_slider().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.custom_scita_pro_brand_slider').empty();
        },

        custom_scita_brand_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_brand_configration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $brand_sub_data = self.$modal.find("#pro_brand_sub_data");

                jsonrpc('/theme_scita/brand_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $brand_sub_data.on('click', function() {
                    var type = '';
                    self.$target.attr('data-brand-config-type', $slider_type.val());
                    self.$target.attr('data-brand-config-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Brand snippet");
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
    //  brand and product/category snippet end
    options.registry.product_category_img_slider_config = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find('.multi_product_and_category_slider .owl-carousel').empty();
            if (!editMode) {
                self.$el.find(".multi_product_and_category_slider").on("click", $.bind(self.multi_category_slider, self));
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
            $('.multi_product_and_category_slider .owl-carousel').empty();
        },

        multi_category_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_product_category_img_slider_config"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $snippnet_submit = self.$modal.find("#snippnet_submit");
                jsonrpc('/theme_scita/product_category_slider', {}).then(function(res) {
                    $("select[id='slider_type'] option").remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $snippnet_submit.on('click', function() {
                    self.$target.attr('data-multi-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        var type = '';
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        var type = '';
                        type = _t("Image Product/Category Snippet");
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





    options.registry.sct_product_snippet_1 = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find('.sct_product_snippet_1 .owl-carousel').empty();
            if (!editMode) {
                self.$el.find(".sct_product_snippet_1").on("click", $.bind(self.multi_category_slider, self));
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
            $('.sct_product_snippet_1 .owl-carousel').empty();
        },

        multi_category_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_product_snippet_configuration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $snippnet_submit = self.$modal.find("#snippnet_submit");
                jsonrpc('/theme_scita/product_configuration', {}).then(function(res) {
                    $("select[id='slider_type'] option").remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $snippnet_submit.on('click', function() {
                    self.$target.attr('data-multi-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        var type = '';
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        var type = '';
                        type = _t("Multi Product Slider");
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
    options.registry.sct_product_snippet_2 = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find('.sct_product_snippet_2 .owl-carousel').empty();
            if (!editMode) {
                self.$el.find(".sct_product_snippet_2").on("click", $.bind(self.multi_category_slider, self));
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
            $('.sct_product_snippet_2 .owl-carousel').empty();
        },

        multi_category_slider: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_dynamic_product_snippet_configuration"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $cancel = self.$modal.find("#cancel"),
                    $snippnet_submit = self.$modal.find("#snippnet_submit");
                jsonrpc('/theme_scita/product_configuration', {}).then(function(res) {
                    $("select[id='slider_type'] option").remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $snippnet_submit.on('click', function() {
                    self.$target.attr('data-multi-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-multi-cat-slider-id', 'multi-cat-myowl' + $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        var type = '';
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        var type = '';
                        type = _t("Multi Product Slider");
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
    // Dynamic Video banner js start
    options.registry.dynamic_video_banner = options.Class.extend({

        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("hidden");
            this.$target.find(".dynamic_video_banner").empty();

            if (!editMode) {
                self.$el.find(".dynamic_video_banner").on("click", $.bind(self.dynamic_video_banner, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.dynamic_video_banner()) {
                this.dynamic_video_banner().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.dynamic_video_banner').empty();
        },

        dynamic_video_banner: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.video_banner_block"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var modification = this.$target.html()
                var $video_url = self.$modal.find("#video-url"),
                    $cancel = self.$modal.find("#cancel"),
                    $sub_data = self.$modal.find("#video_sub_data");
                $video_url.val(self.$target.attr('data-video-url'));
                $sub_data.on('click', function() {
                    var type = _t("Video Banner");

                    self.$target.attr("data-video-url", $video_url.val());

                    self.$target.empty().append('<div class="container">\
                                                    <div class="row our-brands">\
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
    options.registry.animaion_effect = options.Class.extend({
        start: function () {
            var self = this;
            if(this.$target.parent().attr('class') != undefined)
            {
                var parentclassName = this.$target.parent().attr('class').match("sct_img_effect(.)")
                if(parentclassName){
                    this.$target.addClass(parentclassName[0]);
                }    
            }
            return this._super.apply(this, arguments);
        },
        _computeWidgetState(methodName, params) {
            this.$target.parent().removeClass('sct_img_effect1 sct_img_effect2 sct_img_effect3 sct_img_effect4 sct_img_effect5')
            if(this.$target.attr('class') != undefined)
            {
                var newclassName = this.$target.attr('class').match("sct_img_effect(.)");
                if(newclassName){
                    this.$target.parent().addClass(newclassName[0])
                    this.$target.addClass(newclassName[0])
                }    
            }
            return this._super(...arguments);
        },
    });
    // Animation effects for Theme js End
    // Trending Products Start
    options.registry.theme_scita_trending_products = options.Class.extend({
        start: function(editMode) {
            var self = this;
            this._super();
            this.$target.removeClass("o_hidden");
            this.$target.find(".theme_scita_trending_products").empty();
            if (!editMode) {
                self.$el.find(".theme_scita_trending_products").on("click", $.bind(self.trending_products, self));
            }
        },

        onBuilt: function() {
            var self = this;
            this._super();
            if (this.trending_products()) {
                this.trending_products().fail(function() {
                    self.getParent()._removeSnippet();
                });
            }
        },

        cleanForSave: function() {
            $('.theme_scita_trending_products').empty();
        },

        trending_products: function(type, value) {
            var self = this;
            if (type != undefined && type == false || type == undefined) {
                self.$modal = $(renderToElement("theme_scita.scita_trending_products_modal"));
                self.$modal.appendTo('body');
                self.$modal.modal('show');
                var $slider_type = self.$modal.find("#slider_type"),
                    $trending_products_category_delete = self.$modal.find("#cancel"),
                    $trending_category_data_submit = self.$modal.find("#trending_category_data_submit");
                jsonrpc('/theme_scita/trending_category_get_options', {}).then(function(res) {
                    $('#slider_type option[value!="0"]').remove();
                    $.each(res, function(y) {
                        $("select[id='slider_type']").append($('<option>', {
                            value: res[y]["id"],
                            text: res[y]["name"]
                        }));
                    });
                });

                $trending_category_data_submit.on('click', function() {
                    var type = '';
                    // self.$target.attr('data-cat-slider-type', $slider_type.val());
                    self.$target.attr('data-cat-slider-id', $slider_type.val());
                    if ($('select#slider_type').find(":selected").text()) {
                        type = _t($('select#slider_type').find(":selected").text());
                    } else {
                        type = _t("Trending Products");
                    }
                    self.$target.empty().append('<div class="retail_trending_products">\
                                                    <div class="container">\
                                                        <div class="lns-inner latest-trendy-section">\
                                                            <div class="row">\
                                                                <div class="lns-post">\
                                                                    <div class="psb-inner">\
                                                                        <div class="title-block ">\
                                                                            <h2 class="section-title style1">' + type +
                                                                            '</h2>\
                                                                        </div>\
                                                                    </div>\
                                                                </div>\
                                                            </div>\
                                                        </div>\
                                                    </div>\
                                                </div>')
                });
                $trending_products_category_delete.on('click', function() {
                    self.getParent()._onRemoveClick($.Event("click"))
                })
            } else {
                return;
            }
        },
    });