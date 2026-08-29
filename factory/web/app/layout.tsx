import type { Metadata } from 'next';
import './globals.css';
import { getLocale } from '../lib/i18n-server';
import { getTema } from '../lib/tema-server';
import { LocaleProvider } from './locale-provider';
import { TemaProvider } from './tema-provider';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === 'zh'
    ? {
        title: 'fábrica · 你的 AI 商店工厂',
        description:
          '一句话生成你的完整商店：网店、H5 和微信小程序，配专属设计和 AI 团队。0 平台交易佣金。',
      }
    : {
        title: 'fábrica — tu tienda online en minutos',
        description:
          'Crea tu tienda online con un diseño único generado por IA, publícala con tu dominio y véndela en web y apps. Sin programadores.',
      };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, tema] = await Promise.all([getLocale(), getTema()]);
  return (
    // Sin data-theme manda la preferencia del sistema. Resolverlo en el
    // servidor evita el parpadeo de tema al cargar.
    <html lang={locale === 'zh' ? 'zh-CN' : 'es'} {...(tema ? { 'data-theme': tema } : {})}>
      <body>
        <TemaProvider inicial={tema}>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
