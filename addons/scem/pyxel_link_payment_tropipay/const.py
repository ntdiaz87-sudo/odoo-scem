# Part of Odoo. See LICENSE file for full copyright and licensing details.

TROPIPAY_CODE = 'tropipay'
token_action = 'login'
payment_action = 'payment'

API_URLS = {
    'production': {
        token_action: 'https://www.tropipay.com/api/v3/access/token',
        payment_action: 'https://www.tropipay.com/api/v3/paymentcards'
    },
    'test': {
        token_action: 'https://sandbox.tropipay.me/api/v3/access/token',
        payment_action: 'https://sandbox.tropipay.me/api/v3/paymentcards'

    # 'test': {
    #     token_action: 'https://stoplight.io/mocks/tpp/tropipay-api-doc/5969711/access/token',
    #     payment_action: 'https://stoplight.io/mocks/tpp/tropipay-api-doc/5969711/movements/in/with_tpp_url'
    # }

    }
    # 'test': {
    #     token_action: 'https://tropipay-dev.herokuapp.com/api/v3/access/token',
    #     payment_action: 'https://tropipay-dev.herokuapp.com/api/v3/paymentcards'
    # }
}
