import { NextRequest, NextResponse } from 'next/server';
import { generarMiniProgram } from '../../../../lib/miniprogram';
import { loadStoreInfo } from '../../../../lib/store-design';
import { rootDomain } from '../../../../lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * Devuelve el código fuente del mini programa de una tienda.
 *
 * - `?formato=json` (por defecto): mapa de rutas → contenido, para que el
 *   panel lo muestre o lo empaquete en el navegador.
 * - `?archivo=pages/index/index.js`: un solo archivo en crudo.
 *
 * No requiere credenciales de WeChat: el comerciante sube el resultado con
 * su propia cuenta. Cuando la fábrica sea proveedor certificado, el mismo
 * generador alimentará el despliegue por API.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) {
    return NextResponse.json({ error: '未找到该商店' }, { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;
  const archivos = generarMiniProgram({
    slug,
    nombre: info.name,
    design: info.design,
    apiUrl: base.replace(/\/$/, ''),
  });

  const uno = req.nextUrl.searchParams.get('archivo');
  if (uno) {
    const contenido = archivos[uno];
    if (contenido == null) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }
    return new NextResponse(contenido, {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  return NextResponse.json({
    tienda: info.name,
    slug,
    apiUrl: base,
    archivos: Object.keys(archivos).length,
    ficheros: archivos,
  });
}
