// Caso de prueba de `cerradoSinPedirlo`, con comentarios REALES de 4 lead
// magnets nuestros.
//
//   npx tsx scripts/probar-accionable.ts
//
// ⛔ EL FALLO QUE ARREGLA (Iker, 2026-08-25). En el post de la lista del 22/07,
// Josu Yuguero comenta para CORREGIR un dato de plantilla de DANOBAT. No pide
// nada, no escribe la palabra, y Unai ya le contesto. Y aun asi el panel lo
// pinta como el unico "1 para actuar" del post.
//
// La sospecha de Iker era que alguna palabra del comentario disparaba un
// trigger, o la mencion a varias empresas. **Medido: `accionable` NO LEE EL
// TEXTO DEL COMENTARIO NI UNA VEZ.** La regla real, para alguien de 1er grado,
// es solo esta: "¿tiene fila de envio? no -> hay trabajo". Josu era el unico de
// los 18 sin fila, porque a los otros 17 ya se les habia mandado algo. Por eso
// salia solo el, y solo en ese post.
//
// LA TERCERA CONDICION ES EL GUARDARRAIL Y NO SE PUEDE QUITAR. Desde el
// 05/08 el `Comenta "X"` vive en la FOTO (`post-workflow §4.5.0-CTA-IMAGEN`),
// asi que los posts nuevos NO llevan la palabra en el texto y `extractKeyword`
// devuelve ''. Sin la condicion de "el post tiene palabra", la regla excluiria
// a TODO el que este contestado en esos posts, y eso es perder leads en
// silencio: no da error, simplemente no aparece. Es el peor modo de fallo que
// hay, y es justo el que la receta manda evitar.
import { cerradoSinPedirlo } from '../src/components/accounts/leadMagnetCopy';

interface Caso {
  quien: string;
  texto: string;
  keyword: string;
  answered: boolean;
  // true = se cierra, o sea DEJA de salir en «Para actuar».
  esperado: boolean;
}

const CASOS: Caso[] = [
  // ── EL CASO QUE LO MOTIVA
  {
    quien: 'CASO REAL · Josu Yuguero corrige un dato, ya contestado, post CON palabra',
    texto:
      'Unai muchas gracias por ayudar a tantas personas. Un pequeño apunte. DANOBATGROUP formada por ' +
      'SORALUCE | Milling, Boring & Multitasking Machines y @DANOBAT cuenta con una plantilla de 1.500 personas.',
    keyword: 'lista',
    answered: true,
    esperado: true,
  },

  // ── Opiniones reales de otros dos lead magnets. Tampoco piden nada.
  {
    quien: 'CASO REAL · opinion sobre el seguimiento (post "clientes")',
    texto: 'Justo con el tiempo aprendes que el seguimiento que aporta es el que menos molesta',
    keyword: 'clientes',
    answered: true,
    esperado: true,
  },
  {
    quien: 'CASO REAL · opinion sobre los perfiles (post "destripa")',
    texto: 'Es muy complicado tener un perfil de LinkedIn perfecto, siempre hay algo que mejorar',
    keyword: 'destripa',
    answered: true,
    esperado: true,
  },

  // ── LOS QUE SI PIDEN: no se pueden perder por nada del mundo.
  {
    quien: 'CASO REAL · peticion limpia "Clientes marzo"',
    texto: 'Clientes marzo ',
    keyword: 'clientes',
    answered: true,
    esperado: false,
  },
  {
    quien: 'CASO REAL · peticion limpia "destripa ventas"',
    texto: 'destripa ventas',
    keyword: 'destripa',
    answered: true,
    esperado: false,
  },
  {
    quien: 'CASO REAL · peticion con emoji "Clientes junio 🤩"',
    texto: 'Clientes junio 🤩',
    keyword: 'clientes',
    answered: true,
    esperado: false,
  },

  // ── GUARDARRAILES. Cada uno tapa una forma de perder un lead en silencio.
  {
    quien: 'GUARDARRAIL 1 · post SIN palabra (CTA en la foto): NO se cierra a nadie',
    texto: 'Me interesa muchisimo, justo estoy con esto',
    keyword: '',
    answered: true,
    esperado: false,
  },
  {
    quien: 'GUARDARRAIL 2 · no pide pero AUN NO le has contestado: sigue saliendo',
    texto: 'Vaya pasada de post, Unai',
    keyword: 'lista',
    answered: false,
    esperado: false,
  },
  {
    quien: 'GUARDARRAIL 3 · pide sin la palabra exacta pero SIN contestar: sigue saliendo',
    texto: 'yo lo quiero, vendo maquinaria industrial',
    keyword: 'lista',
    answered: false,
    esperado: false,
  },
  {
    quien: 'GUARDARRAIL 4 · la palabra dentro de otra palabra NO cuenta como peticion',
    texto: 'Buen listado, muy completo. Enhorabuena',
    keyword: 'lista',
    answered: true,
    esperado: true,
  },
];

function main() {
  let fallos = 0;

  for (const c of CASOS) {
    const salida = cerradoSinPedirlo(c.texto, c.keyword, c.answered);
    const ok = salida === c.esperado;

    console.log(`\n── ${c.quien}`);
    console.log(`   texto    → ${JSON.stringify(c.texto.slice(0, 70))}`);
    console.log(`   palabra  → ${JSON.stringify(c.keyword)} · respondido: ${c.answered}`);
    console.log(`   ${salida ? 'SE CIERRA (sale de «Para actuar»)' : 'SIGUE en «Para actuar»'}`);

    if (!ok) {
      console.log(`   ❌ ESPERABA ${c.esperado ? 'que se cerrara' : 'que siguiera'}`);
      fallos++;
    } else {
      console.log('   ✅');
    }
  }

  console.log(`\n${fallos === 0 ? '✅ TODOS PASAN' : `❌ ${fallos} FALLO(S)`}`);
  process.exit(fallos === 0 ? 0 : 1);
}

main();
