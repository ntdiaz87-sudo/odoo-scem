/** @odoo-module **/
import publicWidget from '@web/legacy/js/public/public_widget';

publicWidget.registry.LeadValidation = publicWidget.Widget.extend({
    //  Namespace ".lead_val" for my event
    selector: '.js_add_to_cart',
    events: { 'click.lead_val': '_onValidateLead' },

    init() {
        this._super(...arguments);
        this.rpc = this.bindService('rpc');
    },

    async _onValidateLead(ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();

        if (!document.getElementById('o_logout')) {
            window.location.href = '/web/login';
            return;
        }

        const resp = await this.rpc('/shop/has_lead', { method: 'call', params: {} });

        if (!resp.has_lead)       return this._showClientModal(resp.acreditation_url);
        if (!resp.allowed_sale)   return this._showAcreditationModal();

        // Remove our handler
        this.$el.off('click.lead_val');

        // Triggers the asynchronous click again to avoid recursion
        setTimeout(() => this.el.click());
    },

    /**
     * Modal for users without opportunity (non-approved client)
     */
    _showClientModal(acreditation_url) {
        const $modal = $(`
            <div class="modal fade" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Atención</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <p>Para realizar compras en la tienda mayorista usted debe estar aprobado en nuestra cartera de clientes.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="btn-start-acreditation" style="padding: 10px 15px;">Iniciar proceso de acreditación</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        $modal.appendTo('body').modal('show');

        // Assign the redirect to the accreditation button
        $modal.find('#btn-start-acreditation').on('click', function(){
            window.location.href = acreditation_url;
        });

        $modal.on('hidden.bs.modal', () => {
            $modal.remove();
        });
    },

    /**
     * Modal for users who have the opportunity, but have not yet been accredited
     */
    _showAcreditationModal() {
        const $modal = $(`
            <div class="modal fade" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Atención</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <p>Para comenzar a comprar en la tienda mayorista debe esperar a que se apruebe su acreditación.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        $modal.appendTo('body').modal('show');
        $modal.on('hidden.bs.modal', () => {
            $modal.remove();
        });
    },
});
