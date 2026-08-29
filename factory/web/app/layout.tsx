import type { Metadata } from 'next';
import './globals.css';
import { HTML_LANG, LOCALE, t } from '../lib/i18n';

export const metadata: Metadata =
  LOCALE === 'zh'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={HTML_LANG}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href={
            LOCALE === 'zh'
              ? 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@600;700&display=swap'
              : 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap'
          }
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
