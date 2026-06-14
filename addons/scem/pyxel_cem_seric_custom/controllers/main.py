# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.website.controllers.form import WebsiteForm


class HomePageController(http.Controller):
    @http.route('/', type='http', auth='public', website=True)
    def home_page(self, **kwargs):
        return request.render('pyxel_cem_seric_custom.home_template')
        
        
class CustomWebsiteForm(WebsiteForm):
    def _handle_website_form(self, model_name, **kwargs):
        if model_name == 'mail.mail':
            body = """
            <p>Se publicó este mensaje en su sitio web.</p>
            <p>___________</p>
            <p>Nombre: {name}</p>
            <p>Apellidos: {lastname}</p>
            <p>Teléfono: {phone}</p>
            <p>Correo: {email_from}</p>
            <p>Asunto: {subject}</p>
            <p>Mensaje: {description}</p>
            """.format(
                name=kwargs.get('name', ''),
                lastname=kwargs.get('lastname', ''),
                phone=kwargs.get('phone', ''),
                email_from=kwargs.get('email_from', ''),
                subject=kwargs.get('subject', ''),
                description=kwargs.get('description', '')
            )

            kwargs['body_html'] = body
            if not kwargs.get('email_to'):
                kwargs['email_to'] = request.env.company.email

            record = request.env['mail.mail'].sudo().create({
                'email_from':   kwargs['email_from'],
                'subject':      kwargs.get('subject'),
                'body_html':    kwargs['body_html'],
                'email_to':     kwargs['email_to'],
            })
            record.send()

            return request.redirect('/contactus-thank-you')

        return super(CustomWebsiteForm, self)._handle_website_form(model_name, **kwargs)
    

class AboutUsController(http.Controller):
    @http.route('/about/seric', type='http', auth='public', website=True, methods=['GET', 'POST'])
    def about_us(self, **kwargs):
        return request.render('pyxel_cem_seric_custom.about_seric')
    
