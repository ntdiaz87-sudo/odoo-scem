import { NextRequest, NextResponse } from 'next/server';
import { generateProposals, RUBRO_KEYS, ESTILO_KEYS, MODO_KEYS } from '../../../lib/design-generator';
import { takenDesignKeys } from '../../../lib/design-registry';

export async function POST(req: NextRequest) {
  let payload: { rubro?: string; estilo?: string; modo?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }
  const rubro = RUBRO_KEYS.includes(payload.rubro || '') ? payload.rubro! : 'otro';
  const estilo = ESTILO_KEYS.includes(payload.estilo || '') ? payload.estilo! : 'calido';
  const modo = MODO_KEYS.includes(payload.modo || '') ? payload.modo! : 'claro';

  try {
    const taken = await takenDesignKeys();
    const proposals = generateProposals({ rubro, estilo, modo }, taken, 3);
    return NextResponse.json({ proposals });
  } catch (err) {
    console.error('[designs] Error generando propuestas:', err);
    return NextResponse.json(
      { error: 'No se pudieron generar propuestas. Inténtalo de nuevo.' },
      { status: 500 },
    );
  }
}
