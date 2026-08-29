/**
 * Generador de WeChat Mini Program por tienda.
 *
 * Cada tienda de la fábrica produce el código fuente completo de su propio
 * mini programa, pintado con SUS tokens de diseño y apuntando a SU canal del
 * shop-api. El comerciante lo sube con su propia cuenta desde WeChat
 * DevTools — no depende de que la fábrica sea todavía proveedor certificado
 * (第三方平台). Cuando lo sea, el mismo código se despliega por API.
 *
 * Salida: mapa de rutas → contenido, listo para empaquetar.
 *
 * Recordatorio operativo (ver estudio de mercado): el dominio del API debe
 * tener registro ICP y el mini programa necesita su 备案 ante el MIIT. Esto
 * genera el código; los trámites son del comerciante y de la plataforma.
 */
import type { StoreDesign } from './designs';
import { inkOn } from './design-generator';

export interface MiniProgramOpts {
  slug: string;
  nombre: string;
  design: StoreDesign;
  /** Dominio del shop-api, con https y SIN barra final. Debe tener ICP. */
  apiUrl: string;
}

/** Escapa comillas para incrustar en JS/JSON generado. */
const q = (s: string) => JSON.stringify(s);

export function generarMiniProgram(o: MiniProgramOpts): Record<string, string> {
  const d = o.design;
  const acentoInk = inkOn(d.accent);
  const radio = parseInt(d.radius, 10) || 8;

  const archivos: Record<string, string> = {};

  /* ---------- configuración ---------- */
  archivos['app.json'] = JSON.stringify(
    {
      pages: ['pages/index/index', 'pages/cart/cart', 'pages/order/order'],
      window: {
        navigationBarTitleText: o.nombre,
        navigationBarBackgroundColor: d.brand,
        navigationBarTextStyle: inkOn(d.brand) === '#161616' ? 'black' : 'white',
        backgroundColor: d.bg,
      },
      tabBar: {
        color: d.inkSoft,
        selectedColor: d.brand,
        backgroundColor: d.surface,
        list: [
          { pagePath: 'pages/index/index', text: '首页' },
          { pagePath: 'pages/cart/cart', text: '购物车' },
          { pagePath: 'pages/order/order', text: '我的订单' },
        ],
      },
      style: 'v2',
      sitemapLocation: 'sitemap.json',
    },
    null,
    2,
  );

  archivos['project.config.json'] = JSON.stringify(
    {
      appid: 'REEMPLAZAR-CON-TU-APPID',
      projectname: o.slug,
      miniprogramRoot: './',
      setting: { urlCheck: true, es6: true, minified: true },
      compileType: 'miniprogram',
    },
    null,
    2,
  );

  archivos['sitemap.json'] = JSON.stringify({ rules: [{ action: 'allow', page: '*' }] }, null, 2);

  /* ---------- estilo global, con los tokens de la tienda ---------- */
  archivos['app.wxss'] = `/* ${o.nombre} — 由 fábrica 生成 */
page {
  background: ${d.bg};
  color: ${d.ink};
  font-family: -apple-system, "PingFang SC", "Noto Sans SC", sans-serif;
  font-size: 28rpx;
}
.marca { color: ${d.brand}; }
.tarjeta {
  background: ${d.surface};
  border-radius: ${radio * 2}rpx;
  overflow: hidden;
}
.btn {
  background: ${d.brand};
  color: ${d.brandInk};
  border-radius: ${radio * 2}rpx;
  font-weight: 700;
  text-align: center;
  padding: 24rpx 0;
  border: none;
}
.btn-acento { background: ${d.accent}; color: ${acentoInk}; }
.suave { color: ${d.inkSoft}; }
.precio { color: ${d.ink}; font-weight: 700; }
`;

  archivos['app.js'] = `// ${o.nombre} — 由 fábrica 生成
App({
  globalData: {
    api: ${q(o.apiUrl)},
    token: ${q(o.slug)},
    tienda: ${q(o.nombre)},
    sesion: '',
  },
  onLaunch() {
    const s = wx.getStorageSync('fabrica_sesion');
    if (s) this.globalData.sesion = s;
  },
});
`;

  /* ---------- cliente del shop-api ---------- */
  archivos['utils/api.js'] = `// Cliente del shop-api de la tienda. El canal viaja en vendure-token.
const app = getApp();

function gql(query, variables) {
  return new Promise((resolve, reject) => {
    const cab = { 'content-type': 'application/json', 'vendure-token': app.globalData.token };
    if (app.globalData.sesion) cab.authorization = 'Bearer ' + app.globalData.sesion;
    wx.request({
      url: app.globalData.api + '/shop-api',
      method: 'POST',
      header: cab,
      data: { query: query, variables: variables || {} },
      success(res) {
        const nuevo = res.header['vendure-auth-token'] || res.header['Vendure-Auth-Token'];
        if (nuevo) {
          app.globalData.sesion = nuevo;
          wx.setStorageSync('fabrica_sesion', nuevo);
        }
        if (res.data && res.data.errors && res.data.errors.length) {
          reject(new Error(res.data.errors[0].message));
          return;
        }
        resolve(res.data.data);
      },
      fail: reject,
    });
  });
}

function yuan(fen) {
  return '¥' + (fen / 100).toFixed(2);
}

module.exports = { gql: gql, yuan: yuan };
`;

  /* ---------- página: catálogo ---------- */
  archivos['pages/index/index.json'] = JSON.stringify({ navigationBarTitleText: o.nombre }, null, 2);
  archivos['pages/index/index.wxml'] = `<view class="envoltura">
  <view class="hero">
    <text class="hero-t">{{tienda}}</text>
    <text class="hero-d">手机下单，送货到家</text>
  </view>

  <view wx:if="{{cargando}}" class="aviso suave">加载中…</view>
  <view wx:elif="{{productos.length === 0}}" class="aviso suave">本店还没有上架商品。</view>

  <view class="rejilla">
    <view class="prod tarjeta" wx:for="{{productos}}" wx:key="id">
      <view class="prod-img">{{item.inicial}}</view>
      <view class="prod-cuerpo">
        <text class="prod-n">{{item.name}}</text>
        <text class="precio">{{item.precioTexto}}</text>
        <button class="btn prod-btn" size="mini" bindtap="anadir" data-id="{{item.variantId}}">
          加入购物车
        </button>
      </view>
    </view>
  </view>
</view>
`;
  archivos['pages/index/index.wxss'] = `.envoltura { padding: 0 24rpx 40rpx; }
.hero { padding: 48rpx 8rpx 36rpx; }
.hero-t { display: block; font-size: 52rpx; font-weight: 700; }
.hero-d { display: block; margin-top: 12rpx; color: ${d.inkSoft}; }
.aviso { padding: 60rpx 0; text-align: center; }
.rejilla { display: flex; flex-wrap: wrap; justify-content: space-between; }
.prod { width: 48%; margin-bottom: 24rpx; }
.prod-img {
  height: 220rpx; display: flex; align-items: center; justify-content: center;
  font-size: 72rpx; font-weight: 700;
  background: ${d.brand}; color: ${d.brandInk};
}
.prod-cuerpo { padding: 20rpx 20rpx 24rpx; }
.prod-n { display: block; font-size: 28rpx; margin-bottom: 8rpx; }
.prod-btn { margin-top: 18rpx; font-size: 26rpx; line-height: 1.8; }
`;
  archivos['pages/index/index.js'] = `const { gql, yuan } = require('../../utils/api.js');
const app = getApp();

Page({
  data: { productos: [], cargando: true, tienda: '' },
  onLoad() {
    this.setData({ tienda: app.globalData.tienda });
    this.cargar();
  },
  cargar() {
    const self = this;
    gql('{ products(options: { take: 24 }) { items { id name variants { id priceWithTax } } } }')
      .then(function (d) {
        const items = d.products.items.map(function (p) {
          const v = p.variants[0] || {};
          return {
            id: p.id,
            name: p.name,
            inicial: (p.name || '?').charAt(0),
            variantId: v.id,
            precioTexto: v.priceWithTax != null ? yuan(v.priceWithTax) : '—',
          };
        });
        self.setData({ productos: items, cargando: false });
      })
      .catch(function () {
        self.setData({ cargando: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },
  anadir(e) {
    const id = e.currentTarget.dataset.id;
    gql(
      'mutation A($id: ID!) { addItemToOrder(productVariantId: $id, quantity: 1) { __typename ... on ErrorResult { message } } }',
      { id: id }
    )
      .then(function (d) {
        const r = d.addItemToOrder;
        if (r.__typename === 'Order') wx.showToast({ title: '已加入购物车' });
        else wx.showToast({ title: r.message || '加入失败', icon: 'none' });
      })
      .catch(function () {
        wx.showToast({ title: '加入失败', icon: 'none' });
      });
  },
});
`;

  /* ---------- página: carrito ---------- */
  archivos['pages/cart/cart.json'] = JSON.stringify({ navigationBarTitleText: '购物车' }, null, 2);
  archivos['pages/cart/cart.wxml'] = `<view class="envoltura">
  <view wx:if="{{cargando}}" class="aviso suave">加载中…</view>
  <view wx:elif="{{lineas.length === 0}}" class="aviso suave">购物车是空的。</view>

  <view class="linea tarjeta" wx:for="{{lineas}}" wx:key="id">
    <view class="linea-img">{{item.inicial}}</view>
    <view class="linea-info">
      <text class="linea-n">{{item.nombre}}</text>
      <text class="suave">{{item.precioTexto}}</text>
    </view>
    <view class="cant">
      <text bindtap="menos" data-id="{{item.id}}" data-q="{{item.quantity}}">−</text>
      <text class="cant-n">{{item.quantity}}</text>
      <text bindtap="mas" data-id="{{item.id}}" data-q="{{item.quantity}}">+</text>
    </view>
  </view>

  <view wx:if="{{lineas.length > 0}}" class="total tarjeta">
    <text>合计</text>
    <text class="precio">{{totalTexto}}</text>
  </view>
  <button wx:if="{{lineas.length > 0}}" class="btn" bindtap="pagar">去结算</button>
</view>
`;
  archivos['pages/cart/cart.wxss'] = `.envoltura { padding: 24rpx 24rpx 60rpx; }
.aviso { padding: 80rpx 0; text-align: center; }
.linea { display: flex; align-items: center; padding: 20rpx; margin-bottom: 16rpx; }
.linea-img {
  width: 96rpx; height: 96rpx; border-radius: ${radio * 1.4}rpx; margin-right: 20rpx;
  display: flex; align-items: center; justify-content: center;
  background: ${d.brand}; color: ${d.brandInk}; font-size: 40rpx; font-weight: 700;
}
.linea-info { flex: 1; }
.linea-n { display: block; font-size: 28rpx; margin-bottom: 6rpx; }
.cant { display: flex; align-items: center; }
.cant text { padding: 0 20rpx; font-size: 36rpx; }
.cant-n { font-weight: 700; font-size: 28rpx; }
.total { display: flex; justify-content: space-between; padding: 28rpx 24rpx; margin: 24rpx 0; }
`;
  archivos['pages/cart/cart.js'] = `const { gql, yuan } = require('../../utils/api.js');

const CAMPOS =
  'id code totalQuantity subTotalWithTax totalWithTax lines { id quantity linePriceWithTax productVariant { name } }';

Page({
  data: { lineas: [], totalTexto: '', cargando: true },
  onShow() {
    this.cargar();
  },
  cargar() {
    const self = this;
    gql('{ activeOrder { ' + CAMPOS + ' } }')
      .then(function (d) {
        const o = d.activeOrder;
        if (!o) {
          self.setData({ lineas: [], cargando: false });
          return;
        }
        self.setData({
          lineas: o.lines.map(function (l) {
            return {
              id: l.id,
              quantity: l.quantity,
              nombre: l.productVariant.name,
              inicial: (l.productVariant.name || '?').charAt(0),
              precioTexto: yuan(l.linePriceWithTax),
            };
          }),
          totalTexto: yuan(o.subTotalWithTax),
          cargando: false,
        });
      })
      .catch(function () {
        self.setData({ cargando: false });
      });
  },
  ajustar(lineId, q) {
    const self = this;
    const m =
      q <= 0
        ? 'mutation R($l: ID!) { removeOrderLine(orderLineId: $l) { __typename } }'
        : 'mutation A($l: ID!, $q: Int!) { adjustOrderLine(orderLineId: $l, quantity: $q) { __typename } }';
    gql(m, q <= 0 ? { l: lineId } : { l: lineId, q: q }).then(function () {
      self.cargar();
    });
  },
  menos(e) {
    this.ajustar(e.currentTarget.dataset.id, e.currentTarget.dataset.q - 1);
  },
  mas(e) {
    this.ajustar(e.currentTarget.dataset.id, e.currentTarget.dataset.q + 1);
  },
  pagar() {
    wx.navigateTo({ url: '/pages/order/order' });
  },
});
`;

  /* ---------- página: pedido ---------- */
  archivos['pages/order/order.json'] = JSON.stringify({ navigationBarTitleText: '我的订单' }, null, 2);
  archivos['pages/order/order.wxml'] = `<view class="envoltura">
  <view class="tarjeta bloque">
    <text class="t">收货信息</text>
    <input class="campo" placeholder="姓名" bindinput="setNombre" />
    <input class="campo" placeholder="手机号" type="number" bindinput="setTel" />
    <input class="campo" placeholder="收货地址" bindinput="setDir" />
    <input class="campo" placeholder="城市" bindinput="setCiudad" />
  </view>

  <view class="tarjeta bloque">
    <text class="t">支付方式</text>
    <view class="pago {{pago === item.code ? 'sel' : ''}}" wx:for="{{pagos}}" wx:key="code"
          bindtap="elegirPago" data-code="{{item.code}}">
      {{item.name}}
    </view>
  </view>

  <button class="btn" bindtap="confirmar" disabled="{{enviando}}">
    {{enviando ? '提交中…' : '提交订单'}}
  </button>
  <text wx:if="{{aviso}}" class="aviso suave">{{aviso}}</text>
</view>
`;
  archivos['pages/order/order.wxss'] = `.envoltura { padding: 24rpx 24rpx 60rpx; }
.bloque { padding: 28rpx 24rpx; margin-bottom: 20rpx; }
.t { display: block; font-weight: 700; font-size: 30rpx; margin-bottom: 20rpx; }
.campo {
  border: 2rpx solid ${d.inkSoft}44; border-radius: ${radio * 1.4}rpx;
  padding: 20rpx; margin-bottom: 16rpx; font-size: 28rpx;
}
.pago {
  border: 2rpx solid ${d.inkSoft}44; border-radius: ${radio * 1.4}rpx;
  padding: 22rpx; margin-bottom: 14rpx; font-size: 28rpx;
}
.pago.sel { border-color: ${d.brand}; color: ${d.brand}; font-weight: 700; }
.aviso { display: block; margin-top: 24rpx; text-align: center; font-size: 24rpx; }
`;
  archivos['pages/order/order.js'] = `const { gql } = require('../../utils/api.js');

Page({
  data: { pagos: [], pago: '', enviando: false, aviso: '', nombre: '', tel: '', dir: '', ciudad: '' },
  onLoad() {
    const self = this;
    gql('{ eligiblePaymentMethods { code name isEligible } }')
      .then(function (d) {
        const ps = (d.eligiblePaymentMethods || []).filter(function (m) {
          return m.isEligible;
        });
        self.setData({ pagos: ps, pago: ps.length ? ps[0].code : '' });
      })
      .catch(function () {});
  },
  setNombre(e) { this.setData({ nombre: e.detail.value }); },
  setTel(e) { this.setData({ tel: e.detail.value }); },
  setDir(e) { this.setData({ dir: e.detail.value }); },
  setCiudad(e) { this.setData({ ciudad: e.detail.value }); },
  elegirPago(e) { this.setData({ pago: e.currentTarget.dataset.code }); },
  confirmar() {
    const self = this;
    if (!this.data.nombre || !this.data.tel || !this.data.dir) {
      wx.showToast({ title: '请填写收货信息', icon: 'none' });
      return;
    }
    this.setData({ enviando: true });
    gql(
      'mutation C($i: CreateCustomerInput!) { setCustomerForOrder(input: $i) { __typename } }',
      { i: { firstName: this.data.nombre, lastName: '-', emailAddress: this.data.tel + '@wx.local', phoneNumber: this.data.tel } }
    )
      .then(function () {
        return gql(
          'mutation D($i: CreateAddressInput!) { setOrderShippingAddress(input: $i) { __typename } }',
          { i: { fullName: self.data.nombre, streetLine1: self.data.dir, city: self.data.ciudad || '-', countryCode: 'CN', phoneNumber: self.data.tel } }
        );
      })
      .then(function () {
        return gql('{ eligibleShippingMethods { id } }');
      })
      .then(function (d) {
        const m = d.eligibleShippingMethods[0];
        if (!m) return null;
        return gql('mutation S($id: [ID!]!) { setOrderShippingMethod(shippingMethodId: $id) { __typename } }', { id: [m.id] });
      })
      .then(function () {
        return gql('mutation { transitionOrderToState(state: "ArrangingPayment") { __typename } }');
      })
      .then(function () {
        return gql(
          'mutation P($i: PaymentInput!) { addPaymentToOrder(input: $i) { __typename ... on Order { code } ... on ErrorResult { message } } }',
          { i: { method: self.data.pago, metadata: { canal: 'miniprogram' } } }
        );
      })
      .then(function (d) {
        const r = d.addPaymentToOrder;
        self.setData({ enviando: false });
        if (r.__typename === 'Order') {
          self.setData({ aviso: '下单成功，订单号 ' + r.code });
          wx.showToast({ title: '下单成功' });
        } else {
          wx.showToast({ title: r.message || '下单失败', icon: 'none' });
        }
      })
      .catch(function (err) {
        self.setData({ enviando: false });
        wx.showToast({ title: (err && err.message) || '下单失败', icon: 'none' });
      });
  },
});
`;

  /* ---------- instrucciones para el comerciante ---------- */
  archivos['README.md'] = `# ${o.nombre} · 微信小程序

本目录由 **fábrica** 自动生成，使用的是你商店的专属设计。

## 上传步骤

1. 在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序账号，获取 **AppID**。
2. 把 \`project.config.json\` 里的 \`appid\` 换成你的 AppID。
3. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开本目录。
4. 在公众平台「开发管理 → 服务器域名」把 \`${o.apiUrl}\` 加入 **request 合法域名**。
5. 完成 **小程序备案**（工信部要求），然后点「上传」提交审核。

## 说明

- 商品、库存、订单与网店、H5 **完全同步**：改一次，三个渠道一起更新。
- 域名必须已完成 **ICP 备案**，否则微信不允许配置。
- 支付方式来自你店铺后台的配置。
`;

  return archivos;
}
