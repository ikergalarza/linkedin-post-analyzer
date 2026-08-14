// Caso de prueba de `buscarMensajeEnviado`, contra LinkedIn de verdad.
//
// No hay framework de tests en el backend, así que esto es el script de un solo
// uso que exige la receta de depuración: reproduce el fallo con la lógica VIEJA
// (ventana fija de 10 mensajes, un solo chat) y comprueba que la NUEVA lo caza.
//
// Es de SOLO LECTURA: no manda ni un mensaje. Se puede correr las veces que haga
// falta.
//
//   npx tsx src/scripts/probarVerificacion.ts
//
// Los casos son los dos falsos negativos reales del 14/08 —el DM a Mario y el
// DM a Asier desde la cuenta de Unai, que ambos recibieron y la herramienta
// pintó en rojo— más un envío que ya se verificaba bien, para que el arreglo no
// se cargue lo que funcionaba.
import { unipileService } from '../services/unipile';
import { buscarMensajeEnviado, veredictoDeBusqueda } from '../services/verificarEnvio';

const CUENTA_UNAI = 'aamcUZmeRYCZ3Se9EP77DQ';

interface Caso {
  quien: string;
  providerId: string;
  texto: string;
  // Cuándo se mandó, que es lo que acota el barrido.
  desde: Date;
  // Lo que TIENE que salir. Los tres llegaron de verdad.
  esperado: true;
}

const CASOS: Caso[] = [
  {
    quien: 'Mario (posicion 11 del chat)',
    providerId: 'ACoAAEaCQAsBHk3K3NiWKjgP9dnRV2tKkfUPLJE',
    texto:
      'Bon diaa Mario! Aquí lo tienes, el recurso sobre cómo montar tu prospección con Claude:\nhttps://recursos.neety.com/vibe/\n\nEspero que te venga bien 💪',
    desde: new Date('2026-08-12T11:00:15Z'),
    esperado: true,
  },
  {
    quien: 'Asier (posicion 10, y tiene 2 chats)',
    providerId: 'ACoAADg_W2kBoSHWUnJdfHEgMJ50rGYG6MAEkyo',
    texto:
      'Aupaa Asier! Aquí lo tienes, el recurso sobre cómo montar tu prospección con Claude:\nhttps://recursos.neety.com/vibe/\n\nEspero que te venga bien 🙌',
    desde: new Date('2026-08-12T11:01:04Z'),
    esperado: true,
  },
  {
    quien: 'Daniel (ya se verificaba bien: no se puede romper)',
    providerId: 'ACoAAACNTNUBpgoB7MYcTrPP3PAZfWdJ1oD6CcE',
    texto: 'Holaa Daniel! Te paso el recurso sobre cómo montar tu prospección con Claude:',
    desde: new Date('2026-08-12T11:00:00Z'),
    esperado: true,
  },
  {
    quien: 'Marc (ya se verificaba bien: no se puede romper)',
    providerId: 'ACoAAFtosxgBubEccNg3xs3lEYgiPGck0t4Q5ZY',
    texto: 'Bon diaa Marc! Como te prometí, el recurso sobre cómo montar tu prospección con Claude:',
    desde: new Date('2026-08-12T11:00:00Z'),
    esperado: true,
  },
];

// La lógica VIEJA, tal cual estaba, para enseñar el fallo en vez de contarlo.
async function comoEstabaAntes(providerId: string, texto: string): Promise<boolean> {
  const chats = await unipileService.getChatsWithAttendee(providerId, CUENTA_UNAI, 3);
  const id = chats[0]?.id;
  if (!id) return false;
  const mensajes = await unipileService.getChatMessages(id, 10); // ← la ventana fija
  const buscado = texto.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60);
  return mensajes.some(
    (m: any) => Number(m?.is_sender) === 1 &&
      (m?.text || '').replace(/\s+/g, ' ').trim().toLowerCase().includes(buscado)
  );
}

async function main() {
  let fallos = 0;

  for (const c of CASOS) {
    console.log(`\n── ${c.quien}`);

    const antes = await comoEstabaAntes(c.providerId, c.texto);
    console.log(`   ANTES  → ${antes ? 'encontrado' : 'NO encontrado (falso negativo)'}`);

    const chats = await unipileService.getChatsWithAttendee(c.providerId, CUENTA_UNAI, 10);
    const chatIds = chats.map((ch: any) => ch.id).filter(Boolean);
    const r = await buscarMensajeEnviado(
      (chatId, cursor) => unipileService.getChatMessagesPage(chatId, { limit: 50, cursor }),
      { chatIds, texto: c.texto, desde: c.desde }
    );
    const v = veredictoDeBusqueda(r, chatIds.length === 0);
    console.log(
      `   AHORA  → ok=${v.ok} (chats=${chatIds.length}, mensajes mirados=${r.mirados}, concluyente=${r.concluyente})`
    );
    if (v.motivo) console.log(`            motivo: ${v.motivo}`);

    if (v.ok !== c.esperado) {
      console.log(`   ❌ ESPERABA ok=${c.esperado}`);
      fallos++;
    } else {
      console.log('   ✅');
    }
  }

  console.log(`\n${fallos === 0 ? '✅ TODOS PASAN' : `❌ ${fallos} FALLO(S)`}`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('el script se ha caído:', e);
  process.exit(1);
});
