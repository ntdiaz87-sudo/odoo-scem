/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";
import { _t } from "@web/core/l10n/translation";

const NotificationBell = publicWidget.Widget.extend({
    selector: '#notification-bell-desktop, #notification-bell-mobile',
    events: {
        'click .notification-toggle': '_onTogglePopup',
        'click .notif-item': '_onNotificationClick',
    },

     start: function () {
        this._onOutsideClick = this._handleOutsideClick.bind(this);
        document.addEventListener('click', this._onOutsideClick);
        return this._initializeComponent();
    },

    destroy: function () {
        document.removeEventListener('click', this._onOutsideClick);
        this._super.apply(this, arguments);
    },

     _handleOutsideClick: function (ev) {
        const $popup = this.$el.find('.notif-popup');
        const isClickInside = this.el.contains(ev.target);
        if (!isClickInside && !$popup.hasClass('d-none')) {
            this._hidePopup();
        }
    },

    _initializeComponent: function () {
        this.$el.html(`
            <a href="#" class="nav-link notification-toggle">
                <i class="fa fa-bell"></i>
                <span class="notif-counter d-none">0</span>
            </a>
            <div class="notif-popup d-none">
                <div class="notification-loader">
                    <i class="fa fa-spinner fa-spin"></i> ${_t("Cargando...")}
                </div>
            </div>
        `);
        return this._loadNotifications();
    },

    _onNotificationClick: function (ev) {
        ev.preventDefault();
        const $item = $(ev.currentTarget);
        const notificationId = $item.data('id');

        // Marcar como leída
        this._makeRPC('/user/notifications/mark_read', {
            notification_id: notificationId
        }).then(() => {
            // Actualizar visualmente
            $item.removeClass('unread');
            const $counter = this.$el.find('.notif-counter');
            const newCount = parseInt($counter.text()) - 1;

            if (newCount > 0) {
                $counter.text(newCount);
            } else {
                $counter.addClass('d-none').text('0');
                this.$el.find('.notification-toggle').removeClass('has-unread');
            }
        }).catch(error => {
            console.error("Error marking notification as read:", error);
        });
    },

    _makeRPC: function (route, params = {}) {
        return new Promise((resolve, reject) => {
            const data = {
                jsonrpc: "2.0",
                method: "call",
                params: params,
                id: Math.floor(Math.random() * 1000),
            };

            fetch(route, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Odoo-Session-Id': odoo.session_id,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(response => {
                if (response.error) {
                    console.error("RPC Error:", response.error);
                    throw response.error;
                }
                resolve(response.result);
            })
            .catch(error => {
                console.error("Fetch Error:", error);
                reject({
                    code: 500,
                    message: "Could not connect to server",
                    data: { debug: error.message }
                });
            });
        });
    },

    _loadNotifications: async function() {
        try {
            const response = await this._makeRPC('/user/notifications');

            // Verificar si la respuesta contiene un error
            if (response && response.error) {
                throw response.error;
            }

            this._updateNotifications(response);
        } catch (error) {
            console.error("Error loading notifications:", error);
            let errorMessage = _t("Error al cargar notificaciones");

            if (error.data && error.data.debug) {
                errorMessage += `: ${error.data.debug}`;
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }

            this.$el.find('.notif-popup').html(`
                <div class="notification-error">${errorMessage}</div>
            `);
        }
    },

    _updateNotifications(data) {
        const $counter = this.$el.find('.notif-counter');
        const $iconLink = this.$el.find('.notification-toggle');
        const hasNotifications = data.count > 0;

        // Actualizar contador
        $counter.toggleClass('d-none', !hasNotifications).text(data.count);
        $iconLink.toggleClass('has-unread', hasNotifications);

        // Animación para nuevas notificaciones
        if (hasNotifications) {
            $iconLink.addClass('animate-bell');
            setTimeout(() => $iconLink.removeClass('animate-bell'), 700);
        }

        const $popup = this.$el.find('.notif-popup');
        if (!data.notifications?.length) {
            $popup.html(`<div class="text-center p-3">${_t("No hay notificaciones nuevas")}</div>`);
            return;
        }

        // Construir lista de notificaciones
        const items = data.notifications.map(notif => `
            <li class="notif-item ${notif.is_read ? '' : 'unread'} ${notif.notification_type || 'portal'}"
                data-id="${notif.id}">
                <div class="notif-message">${_t(this._escapeHTML(notif.message))}</div>
                ${notif.order_ref ? `
                <div class="notif-order-link">
                    <a href="/my/orders?search=${encodeURIComponent(notif.order_ref)}" target="_blank">
                        Ver orden
                    </a>
                </div>
            ` : ''}
                <div class="notification-date">${this._formatDate(notif.create_date)}</div>
            </li>
        `).join('');

        $popup.html(`<ul class="notification-list">${items}</ul>`);
    },

    _escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;

        // Convertir saltos de línea a <br> primero
        let result = div.innerHTML.replace(/\n/g, '<br>');

        // Luego manejar las demás etiquetas
        result = result
            .replace(/&lt;span class="notif-(order-name|products|confirmation|paid|sale)"&gt;/g, '<span class="notif-$1">')
            .replace(/&lt;\/span&gt;/g, '</span>')
            .replace(/ - - Products:/g, '<br><span class="notif-products">Productos:')
            .replace(/ - Products:/g, '<br><span class="notif-products">Productos:')
            .replace(/ - Order:/g, '<br><span class="notif-products">Orden:')
            .replace(/ - - Order:/g, '<br><span class="notif-products">Orden:');

        return result;
    },

    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString(navigator.language, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    _onTogglePopup(ev) {
        ev.preventDefault();
        const $popup = this.$el.find('.notif-popup');

        if ($popup.hasClass('d-none')) {
            this._showPopup();
            this._loadNotifications();
        } else {
            this._hidePopup();
        }
    },

    _showPopup() {
        const $popup = this.$el.find('.notif-popup');
        $popup.removeClass('d-none').addClass('fade-in');
        setTimeout(() => $popup.removeClass('fade-in'), 300);
    },

    _hidePopup() {
        const $popup = this.$el.find('.notif-popup');
        $popup.addClass('fade-out');
        setTimeout(() => $popup.removeClass('fade-out').addClass('d-none'), 300);
    },
});

publicWidget.registry.notificationBell = NotificationBell;

export default NotificationBell;