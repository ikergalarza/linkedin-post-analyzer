// Caso de prueba de `extractSector`, con comentarios REALES de un post nuestro.
//
// Mismo idioma que `backend/src/scripts/probarVerificacion.ts`: no hay framework
// de tests en el frontend, asi que la receta de depuracion se cumple con un
// script que reproduce el fallo y comprueba que el arreglo lo caza.
//
// Es de SOLO LECTURA y no toca la red: los comentarios van pegados abajo.
//
//   npx tsx scripts/probar-sector.ts
//
// ⛔ EL FALLO QUE ARREGLA (Iker, 2026-08-25). `extractSector` nacio el 22/07,
// cuando la lista de comentarios estaba FILTRADA por la palabra clave: todo lo
// que le llegaba era, por construccion, una peticion del recurso. El 11/08 se
// quito ese filtro a proposito (05d2ea0, "se acabo la palabra clave"), porque
// con el gate muerto nadie escribe la palabra y filtrar dejaba la lista vacia.
// **La precondicion desaparecio y la funcion se quedo asumiendola.**
//
// Desde entonces, a un comentario que NO pide nada se le extrae como "sector"
// el comentario entero sin las palabras de relleno. El caso real: Josu Yuguero
// corrigiendo un dato de plantilla de DANOBAT acabo con el sector
// "Unai muchas ayudar tantas personas. pequeno apunte. DANOBATGROUP formada
// SORALUCE Milling Boring Multitasking Machines DANOBAT cuenta p...", y con el
// boton de "Generar lista" activo para mandarle una lista que no habia pedido.
//
// Los 18 comentarios son los del post de la lista de Unai del 22/07. El corte es
// limpio y por eso vale de test: los 15 que llevan la palabra dan un sector de
// verdad, y los 3 que no la llevan son justo los que no piden nada (dos apoyos
// de los jefes y la correccion de Josu).
import { extractSector } from '../src/components/accounts/leadMagnetCopy';

const KEYWORD = 'lista';

interface Caso {
  quien: string;
  texto: string;
  // Lo que TIENE que salir. `null` = cadena vacia, o sea "aqui no hay sector".
  esperado: string | null;
}

const CASOS: Caso[] = [
  // ── Los que SI piden: el sector se extrae y tiene que seguir saliendo igual.
  { quien: 'Marco Cocchiarella', texto: 'lista bicicletas', esperado: 'bicicletas' },
  { quien: 'Javier Caldera', texto: 'Lista HR Tech', esperado: 'HR Tech' },
  { quien: 'Helena Baviera', texto: 'lista SaaS B2B', esperado: 'SaaS B2B' },
  { quien: 'Ana Vega', texto: 'Lista para ventas B2B industrial', esperado: 'ventas B2B industrial' },
  { quien: 'Marc Ibanez (con relleno)', texto: 'lista porfa, me interesa mucho IA', esperado: 'IA' },

  // ── Los que NO piden nada. Son el fallo, y los tres son reales.
  {
    quien: 'CASO REAL · Josu Yuguero corrige un dato de plantilla',
    texto:
      'Unai muchas gracias por ayudar a tantas personas. Un pequeño apunte. DANOBATGROUP formada por ' +
      'SORALUCE | Milling, Boring & Multitasking Machines y @DANOBAT cuenta con una plantilla ' +
      'compuesta por unas 1.500 personas.',
    esperado: null,
  },
  {
    quien: 'CASO REAL · Asier apoyando el post',
    texto:
      'Es como cambiar el bucle infinito de búsqueda por una query bien filtrada, me quedo con eso',
    esperado: null,
  },
  {
    quien: 'CASO REAL · Iker apoyando el post',
    texto:
      'Como comercial esto es oro. No necesitas más empresas, necesitas saber a cuál llamar',
    esperado: null,
  },

  // ── El borde que NO se puede romper: sin palabra clave configurada no hay
  //    forma de saber si el comentario pide algo, asi que tampoco hay sector.
  {
    quien: 'BORDE · sin palabra clave configurada (post nuevo, cfg.keyword vacia)',
    texto: 'me interesa, vendo maquinaria',
    esperado: null,
  },
];

function main() {
  let fallos = 0;

  for (const c of CASOS) {
    const kw = c.quien.startsWith('BORDE') ? '' : KEYWORD;
    const salida = extractSector(c.texto, kw);
    const esperado = c.esperado ?? '';
    const ok = salida === esperado;

    console.log(`\n── ${c.quien}`);
    console.log(`   entra  → ${JSON.stringify(c.texto.slice(0, 78))}`);
    console.log(`   sale   → ${JSON.stringify(salida.slice(0, 78))}`);

    if (!ok) {
      console.log(`   ❌ ESPERABA ${JSON.stringify(esperado)}`);
      fallos++;
    } else {
      console.log('   ✅');
    }
  }

  console.log(`\n${fallos === 0 ? '✅ TODOS PASAN' : `❌ ${fallos} FALLO(S)`}`);
  process.exit(fallos === 0 ? 0 : 1);
}

main();
