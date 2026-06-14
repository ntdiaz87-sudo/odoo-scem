# -*- coding: utf-8 -*-

from odoo import models, fields

class Website(models.Model):
    _inherit = 'website'

    # Home Banner 1
    # Slide 1 
    banner_image_1 = fields.Binary(string="Product Image (banner 1)", copy=False)
    responsive_banner_image_1 = fields.Binary(string="Product Responsive Image (banner 1)", copy=False)
    title_banner_1 = fields.Char(string="Product Title (banner 1)")
    category_banner_1 = fields.Char(string="Product Category (banner 1)")
    description_banner_1 = fields.Char(string="Product Description (banner 1)")
    url_button_1 = fields.Char(string="Button URL (banner 1)")
 
    # Slide 2
    banner_image_2 = fields.Binary(string="Product Image (banner 2)", copy=False)
    responsive_banner_image_2 = fields.Binary(string="Product Responsive Image (banner 2)", copy=False)
    title_banner_2 = fields.Char(string="Product Title (banner 2)")
    category_banner_2 = fields.Char(string="Product Category (banner 2)")
    description_banner_2 = fields.Char(string="Product Description (banner 2)")
    url_button_2 = fields.Char(string="Button URL (banner 2)")
 
    # Slide 3
    banner_image_3 = fields.Binary(string="Product Image (banner 3)", copy=False)
    responsive_banner_image_3 = fields.Binary(string="Product Responsive Image (banner 3)", copy=False)
    title_banner_3 = fields.Char(string="Product Title (banner 3)")
    category_banner_3 = fields.Char(string="Product Category (banner 3)")
    description_banner_3 = fields.Char(string="Product Description (banner 3)")
    url_button_3 = fields.Char(string="Button URL (banner 3)")
    
    
    #PROMO 1
    promo_image_1 = fields.Binary(string="Promo Image 1", copy=False)
    promo_image_responsive_1 = fields.Binary(string="Promo Image Responsive 1", copy=False)
    promo_url_1 = fields.Char(string="Promo URL 1")
    promo_title_1  = fields.Char(string="Promo Title 1")
    promo_text_1  = fields.Char(string="Promo Text 1")
    promo_button_1  = fields.Char(string="Promo Text Button 1")
    
    #PROMO 2
    promo_image_2 = fields.Binary(string="Promo Image 2", copy=False)
    promo_image_responsive_2 = fields.Binary(string="Promo Image Responsive 2", copy=False)
    promo_url_2 = fields.Char(string="Promo URL 2")
    promo_title_2  = fields.Char(string="Promo Title 2")
    promo_text_2  = fields.Char(string="Promo Text 2")
    promo_button_2  = fields.Char(string="Promo Text Button 2")
    
    #SERVICES
    img_services_1= fields.Binary(string="Service 1 Image", copy=False)
    title_services_1 = fields.Char(string="Service 1 Title")
    url_services_1 = fields.Char(string="Service 1 URL ")
    
    img_services_2= fields.Binary(string="Service 2 Image", copy=False)
    title_services_2 = fields.Char(string="Service 2 Title")
    url_services_2 = fields.Char(string="Service 2 URL ")
    
    img_services_3= fields.Binary(string="Service 3 Image", copy=False)
    title_services_3 = fields.Char(string="Service 3 Title")
    url_services_3 = fields.Char(string="Service 3 URL ")
    
    img_services_4= fields.Binary(string="Service 4 Image", copy=False)
    title_services_4 = fields.Char(string="Service 4 Title")
    url_services_4 = fields.Char(string="Service 4 URL ")
    
    img_services_5= fields.Binary(string="Service 5 Image", copy=False)
    title_services_5 = fields.Char(string="Service 5 Title")
    url_services_5 = fields.Char(string="Service 5 URL ")
    
    img_services_6= fields.Binary(string="Service 6 Image", copy=False)
    title_services_6 = fields.Char(string="Service 6 Title")
    url_services_6 = fields.Char(string="Service 6 URL ")
    
    
    #US
    us_title = fields.Char(string="Us title ")
    us_text = fields.Char(string="Us text")
    us_url = fields.Char(string="Us URL")
    us_img = fields.Binary(string="Us Image", copy=False)
  
    #REVIEWS
    # Review 1
    img_review_1 = fields.Binary(string="Review photo 1", copy=False)
    name_review_1 = fields.Char(string="Review name 1")
    position_review_1 = fields.Char(string="Review position 1")
    text_review_1 = fields.Char(string="Review text 1")
    date_review_1 = fields.Char(string="Review date 1")
    
    # Review 2
    img_review_2 = fields.Binary(string="Review photo 2", copy=False)
    name_review_2 = fields.Char(string="Review name 2")
    position_review_2 = fields.Char(string="Review position 2")
    text_review_2 = fields.Char(string="Review text 2")
    date_review_2 = fields.Char(string="Review date 2")
    
    # Review 3
    img_review_3 = fields.Binary(string="Review photo 3", copy=False)
    name_review_3 = fields.Char(string="Review name 3")
    position_review_3 = fields.Char(string="Review position 3")
    text_review_3 = fields.Char(string="Review text 3")
    date_review_3 = fields.Char(string="Review date 3")
    
    # Review 4
    img_review_4 = fields.Binary(string="Review photo 4", copy=False)
    name_review_4 = fields.Char(string="Review name 4")
    position_review_4 = fields.Char(string="Review position 4")
    text_review_4 = fields.Char(string="Review text 4")
    date_review_4 = fields.Char(string="Review date 4")
    
  