import { Post } from '../models/post';

export function calculateEngagement(post: { likes_count: number; comments_count: number; reposts_count: number }): number {
  return post.likes_count + post.comments_count * 2 + post.reposts_count * 3;
}

export function calculateAverageEngagement(posts: { engagement_score: number }[]): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, p) => sum + p.engagement_score, 0);
  return total / posts.length;
}

export function calculateOutlierRatio(postEngagement: number, avgEngagement: number): number {
  return avgEngagement > 0 ? postEngagement / avgEngagement : 0;
}

export function isOutlier(ratio: number): boolean {
  return ratio >= 3.0;
}

// Extract hook (first line)
export function extractHook(text: string | null): string | null {
  if (!text) return null;
  const firstLine = text.split(/\r?\n/)[0].trim();
  return firstLine.substring(0, 300);
}

// Count words
export function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Extract hashtags
export function extractHashtags(text: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches || [];
}

// Detect emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;

export function hasEmoji(text: string | null): boolean {
  if (!text) return false;
  return emojiRegex.test(text);
}

// Detect CTA
const ctaPatterns = [
  /\bcomenta\b/i, /\bcomparte\b/i, /\bqu[eé] opinas\b/i,
  /\blink en (los )?comentarios\b/i, /\bs[ií]gueme\b/i,
  /\bguarda este post\b/i, /\bcomparte si\b/i,
  /\bcomment\b/i, /\bshare\b/i, /\bwhat do you think\b/i,
  /\bfollow me\b/i, /\blink in (the )?comments?\b/i,
  /\bsave this\b/i, /\brepost\b/i, /\bagree\?\b/i,
  /\blet me know\b/i, /\bwhat['']?s your\b/i,
  /\bdrop a\b/i, /\btag someone\b/i,
];

export function hasCTA(text: string | null): boolean {
  if (!text) return false;
  return ctaPatterns.some((p) => p.test(text));
}

// Character count
export function countChars(text: string | null): number {
  if (!text) return 0;
  return text.length;
}

// Line breaks and spacing analysis
export function countLineBreaks(text: string | null): number {
  if (!text) return 0;
  return (text.match(/\n/g) || []).length;
}

export function hasAggressiveSpacing(text: string | null): boolean {
  if (!text) return false;
  // Aggressive spacing = multiple consecutive blank lines or very short lines with frequent breaks
  const doubleBreaks = (text.match(/\n\s*\n/g) || []).length;
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  // If >40% of the post is line breaks relative to content lines, it's aggressive
  return doubleBreaks >= 3 || (countLineBreaks(text) / lines.length) > 1.5;
}

// Hook type classification — expanded to minimize "other"
export function classifyHook(text: string | null): string {
  if (!text) return 'other';
  const hook = text.split(/\r?\n/)[0].trim();
  const h = hook.toLowerCase();

  // Question — any hook ending or containing ?
  if (/\?/.test(h)) return 'question';

  // List/framework — "X things/ways/tips" or starts with number + noun
  if (/^\d+\s+\w/i.test(h)) return 'list';

  // Data/statistic — percentages, numbers with context, studies
  if (/^\d|%|\bstat\b|\bdata\b|\bstudy\b|\bestudio\b|\bdato\b|\bresearch\b|\bsurvey\b|\baccording\b|\bsegún\b|\bresult\b/i.test(h)) return 'statistic';

  // Controversy / unpopular opinion
  if (/unpopular opinion|hot take|controversial|impopular|polémic|nobody talks|nadie habla|disagree|i don['']t care what|me da igual|harsh truth|verdad incómoda|i['']ll say it|lo digo/i.test(h)) return 'controversy';

  // Bold statement / provocative assertion
  if (/^(stop|never|always|don['']t|no one|the truth|la verdad|forget|you['']re wrong|estás equivocado|enough|basta|quit|wake up|despierta|this is broken|the problem with|el problema de)/i.test(h)) return 'bold_statement';

  // Prediction / future-oriented
  if (/^(in \d+ years|en \d+ años|the future|el futuro|by 20\d\d|will (become|replace|die|disappear)|prediction|predic|mark my words|va a (cambiar|desaparecer|morir))/i.test(h)) return 'prediction';

  // Confession / vulnerability
  if (/^(i failed|i lost|i was wrong|i quit|i got fired|me equivoqué|fracasé|perdí|me despidieron|truth is|la verdad es|i['']m scared|i almost|confession|confesión|i['']ll be honest|my biggest mistake|mi mayor error)/i.test(h)) return 'confession';

  // How-to / educational
  if (/^(how to|how i|cómo|here['']?s how|the guide|a guide|tutorial|step[- ]by[- ]step|paso a paso|the framework|the system|el sistema|the method|el método|the playbook|learn to|aprende a)/i.test(h)) return 'how_to';

  // POV
  if (/^pov[\s:]/i.test(h) || /^point of view/i.test(h)) return 'pov';

  // Storytelling — personal narratives, temporal markers
  if (/^(i |yo |cuando |when |last (year|month|week)|el (año|mes) pasado|hace \d|one day|un día|yesterday|ayer|the day|2 years ago|this morning|esta mañana|back in|en 20\d\d|it was|era )/i.test(h)) return 'storytelling';

  // Social proof / authority
  if (/^(i['']ve (helped|worked|built|coached|trained|sold|generated|managed)|after \d+|helped \d+|tras \d+|he ayudado|he trabajado|llevo \d+|\d+ (years|años|clients|clientes|companies|empresas))/i.test(h)) return 'social_proof';

  // Challenge / dare
  if (/^(i challenge|i dare|try this|prueba esto|do this for|haz esto|take the|el reto|the challenge|30[- ]day|7[- ]day)/i.test(h)) return 'challenge';

  // Announcement / news
  if (/^(announcing|just launched|big news|exciting|i['']m thrilled|we just|acabamos de|anuncio|gran noticia|new:|nuevo:|just released|breaking|update:|launching)/i.test(h)) return 'announcement';

  // Analogy / metaphor
  if (/^(\w+ (is|are|es) (like|the new|como|el nuevo))|^(imagine|imagina|think of|piensa en)|( is the new | es el nuevo )/i.test(h)) return 'analogy';

  // Contrarian / myth-busting
  if (/^(myth:|mito:|wrong[.!]|lies|mentiras|overrated|sobrevalorado|you don['']t need|no necesitas|forget everything|olvida todo|everything you know about|todo lo que sabes de)/i.test(h)) return 'contrarian';

  // Relatable / humor
  if (/^(me:|yo:|that feeling|esa sensación|when you|cuando tu|nobody:|nadie:|pov:|we all|todos|real talk|raise your hand|levanta la mano)/i.test(h)) return 'relatable';

  // Curiosity gap — things that make you want to read more
  if (/secret|nobody knows|no one told|nadie te dijo|most people|la mayoría|this is why|por esto|what nobody|lo que nadie|the real reason|la verdadera razón|what I wish|you won['']t believe|here['']s what|esto es lo que/i.test(h)) return 'curiosity';

  // Motivational / inspirational
  if (/^(you can|tú puedes|believe|cree en|don['']t give up|no te rindas|keep going|sigue|it['']s possible|es posible|you deserve|mereces|your time|tu momento|dream|sueña|greatness)/i.test(h)) return 'motivational';

  // Observation / insight — "I noticed", "Here's the thing"
  if (/^(i noticed|i realized|here['']s the thing|here['']s what|the thing about|something i|lo que noté|me di cuenta|hay algo que|the best .* i['']ve seen)/i.test(h)) return 'observation';

  // Direct address — "You" focused hooks
  if (/^(you |your |if you|si tú|si tu|dear |querido)/i.test(h)) return 'direct_address';

  return 'other';
}

// Text psychology / tone analysis — broad pattern matching to minimize "neutral"
export function classifyTone(text: string | null): string {
  if (!text || text.length < 20) return 'neutral';
  const t = text.toLowerCase();

  // Each pattern list uses loose matching (no \b, partial matches OK)
  // weighted: strong signals = 3pts, medium = 2pts, weak/common = 1pt
  const dimensions: { name: string; patterns: [RegExp, number][] }[] = [
    {
      name: 'educational',
      patterns: [
        // Strong
        [/here['']?s (how|why|what|the)/i, 3],
        [/step[- ]by[- ]step|paso a paso/i, 3],
        [/guide |guía |tutorial|playbook|framework/i, 3],
        [/the (key|secret|trick|hack) (is|to)/i, 3],
        [/let me (explain|break|show|teach)/i, 3],
        [/te (explico|enseño|muestro|cuento)/i, 3],
        // Medium
        [/tip[s]?[: ]/i, 2], [/consejo[s]?[: ]/i, 2],
        [/lesson|lección/i, 2], [/example|ejemplo/i, 2],
        [/instead[, ]|en vez de/i, 2], [/avoid |evita /i, 2],
        [/the difference between|la diferencia entre/i, 2],
        [/breakdown|desglose/i, 2], [/mistake.* make|error.* comet/i, 2],
        [/here['']?s what (most|many|people)/i, 2],
        [/think of it (as|like)/i, 2], [/piensa en esto/i, 2],
        // Weak
        [/learn|aprend/i, 1], [/understand|entend/i, 1],
        [/know |saber |sabe /i, 1], [/use |usa |utiliz/i, 1],
        [/try |prueba |intent/i, 1], [/should|deberí/i, 1],
        [/important|importante/i, 1], [/remember|recuerda/i, 1],
        [/focus on|enfóca/i, 1], [/rule |regla /i, 1],
      ],
    },
    {
      name: 'aspirational',
      patterns: [
        [/dream |sueñ/i, 3], [/freedom|libertad/i, 3],
        [/transform|transforma/i, 3], [/next level|siguiente nivel/i, 3],
        [/life[- ]changing|cambiar.* vida/i, 3], [/unlock|desbloque/i, 3],
        [/6[- ]figure|7[- ]figure/i, 3], [/millonari|wealth/i, 3],
        [/success |éxito /i, 2], [/achieve|lograr|logré/i, 2],
        [/grow |crec |growth|crecimiento/i, 2], [/scale |escal/i, 2],
        [/build |construi/i, 2], [/potential|potencial/i, 2],
        [/opportunity|oportunidad/i, 2], [/impact|impacto/i, 2],
        [/career |carrera /i, 2], [/promotion|ascenso/i, 2],
        [/level up|subir de nivel/i, 2], [/upgrade|mejora/i, 2],
        [/empower|empoder/i, 2], [/inspire|inspir/i, 2],
        [/goal |meta |objetiv/i, 1], [/future|futuro/i, 1],
        [/better|mejor/i, 1], [/progress|progres/i, 1],
        [/vision|visión/i, 1], [/passion|pasión/i, 1],
        [/reward|recompens/i, 1], [/win |ganar/i, 1],
        [/amazing|increíble/i, 1], [/powerful|poderoso/i, 1],
      ],
    },
    {
      name: 'provocative',
      patterns: [
        [/unpopular opinion|hot take/i, 3], [/controversial/i, 3],
        [/truth bomb|bomba de verdad/i, 3], [/wake up|despierta/i, 3],
        [/fight me|pelea conmigo/i, 3], [/bs |bullshit/i, 3],
        [/wrong|equivocad/i, 2], [/lie |mentir/i, 2],
        [/toxic|tóxic/i, 2], [/overrated|sobrevalorad/i, 2],
        [/disagree|desacuerd/i, 2], [/hate |odio |odi/i, 2],
        [/tired of|harto|cansad.* de/i, 2], [/sick of/i, 2],
        [/enough|basta/i, 2], [/brutal |harsh/i, 2],
        [/nobody |nadie /i, 2], [/stop (doing|saying|pretend)/i, 2],
        [/deja de |para de /i, 2], [/the problem (is|with)/i, 2],
        [/el problema (es|de)/i, 2], [/not okay|no está bien/i, 2],
        [/don['']t @ me/i, 2], [/i said what i said/i, 2],
        [/scam |estafa/i, 2], [/fake |falso/i, 2],
        [/never |nunca /i, 1], [/worst|peor/i, 1],
        [/can['']t believe|no puedo creer/i, 1], [/ridiculous|ridícul/i, 1],
        [/absurd/i, 1], [/crazy |loc/i, 1],
      ],
    },
    {
      name: 'vulnerable',
      patterns: [
        [/i failed|fracasé|fallé/i, 3], [/i cried|lloré/i, 3],
        [/got fired|me despid/i, 3], [/i quit|renuncié/i, 3],
        [/depressed|deprimid/i, 3], [/anxiety|ansiedad/i, 3],
        [/imposter|impostor/i, 3], [/burnout/i, 3],
        [/confession|confesión/i, 3], [/i was broke|estaba arruinad/i, 3],
        [/scared|miedo|asust/i, 2], [/ashamed|vergüenza/i, 2],
        [/rejected|rechazad/i, 2], [/vulnerable/i, 2],
        [/doubt |dud/i, 2], [/insecure|insegur/i, 2],
        [/i lost|perdí/i, 2], [/mistake|error/i, 2],
        [/honest(ly)?|honestamente/i, 2], [/admit|admito/i, 2],
        [/i struggle|lucho con/i, 2], [/rock bottom|tocar fondo/i, 2],
        [/broke down|me derrumbé/i, 2], [/i['']m not perfect|no soy perfect/i, 2],
        [/painful|doloroso/i, 1], [/tears|lágrimas/i, 1],
        [/alone|sol[oa] /i, 1], [/overwhelm|agobiad/i, 1],
        [/difficult|difícil/i, 1], [/hard truth|verdad dura/i, 1],
      ],
    },
    {
      name: 'empathy',
      patterns: [
        [/i understand|entiendo/i, 3], [/been there|he estado ahí/i, 3],
        [/not alone|no estás sol/i, 3], [/i feel you|te entiendo/i, 3],
        [/it['']s ok(ay)?|está bien/i, 3], [/we['']ve all|todos hemos/i, 3],
        [/i know (how|what) (it|that) feel/i, 3], [/sé lo que se siente/i, 3],
        [/struggle|lucha/i, 2], [/tough|dur[oa]/i, 2],
        [/pain |dolor/i, 2], [/you['']re not (the only|alone)/i, 2],
        [/it happens|pasa|sucede/i, 2], [/take your time|tómate tu tiempo/i, 2],
        [/give yourself|date permiso/i, 2], [/be kind to|sé amable contigo/i, 2],
        [/compassion|compasión/i, 2], [/breathe|respira/i, 2],
        [/support|apoy/i, 1], [/care |import/i, 1],
        [/matter |vales/i, 1], [/gentle|suave/i, 1],
        [/human|human/i, 1], [/emotion|emoción/i, 1],
        [/mental health|salud mental/i, 2], [/patience|paciencia/i, 1],
        [/hear you|te escucho/i, 2], [/safe space|espacio seguro/i, 2],
      ],
    },
    {
      name: 'urgency',
      patterns: [
        [/right now|ahora mismo/i, 3], [/stop scrolling|para de scroll/i, 3],
        [/urgent|urgente/i, 3], [/last chance|última oportunidad/i, 3],
        [/before it['']s too late|antes de que sea tarde/i, 3],
        [/deadline/i, 3], [/asap/i, 3], [/hurry|date prisa/i, 3],
        [/now |ahora /i, 2], [/today|hoy/i, 2],
        [/immediately|inmediatamente/i, 2], [/don['']t wait|no esperes/i, 2],
        [/limited|limitad/i, 2], [/running out|se acaba/i, 2],
        [/time is |el tiempo/i, 2], [/act fast|actúa rápido/i, 2],
        [/quickly|rápidamente/i, 1], [/fast |rápid/i, 1],
        [/soon|pronto/i, 1], [/early|tempran/i, 1],
        [/critical|crític/i, 1], [/essential|esencial/i, 1],
        [/must |debes /i, 1], [/need to|necesitas/i, 1],
        [/can['']t afford|no puedes permitir/i, 2], [/waiting|esperando/i, 1],
      ],
    },
    {
      name: 'authority',
      patterns: [
        [/years? (of )?experience|años? de experiencia/i, 3],
        [/expert|experto/i, 3], [/certified|certificad/i, 3],
        [/proven|probad/i, 3], [/data shows|los datos muestran/i, 3],
        [/research shows|la investigación/i, 3], [/according to|según/i, 3],
        [/i['']ve (helped|built|led|managed|trained|coached|worked with)/i, 3],
        [/he (ayudado|construido|liderado|gestionado|formado)/i, 3],
        [/\d+ (years|años|clients|clientes|companies|empresas|projects|proyectos)/i, 2],
        [/framework|sistema|method|método/i, 2],
        [/science|ciencia/i, 2], [/study|estudio/i, 2],
        [/evidence|evidencia/i, 2], [/strategy|estrategia/i, 2],
        [/industry|industria|sector/i, 1], [/professional|profesional/i, 1],
        [/experience|experiencia/i, 1], [/leader|líder/i, 1],
        [/founder|fundador/i, 2], [/ceo |cto |cmo /i, 2],
        [/built |construí /i, 1], [/results|resultados/i, 1],
        [/revenue|facturación|ingresos/i, 2], [/roi |retorno/i, 2],
      ],
    },
    {
      name: 'social_proof',
      patterns: [
        [/everyone|todos (lo|los|están|dicen)/i, 3],
        [/thousand|miles de/i, 3], [/viral/i, 3],
        [/trending/i, 3], [/sold out|agotad/i, 3],
        [/client|cliente/i, 2], [/compan(y|ies)|empresa/i, 2],
        [/people (are|have|say)|la gente (está|dice|ha)/i, 2],
        [/testimonial|testimonio/i, 2], [/case study|caso de éxito/i, 2],
        [/most (successful|popular)|más (exitoso|popular)/i, 2],
        [/top \d+|best seller/i, 2], [/community|comunidad/i, 1],
        [/team|equipo/i, 1], [/network|red /i, 1],
        [/follower|seguidor/i, 1], [/audience|audiencia/i, 1],
        [/user|usuario/i, 1], [/customer|consumidor/i, 1],
        [/trust|confían|confianza/i, 1], [/recommend|recomend/i, 2],
        [/shared|compartido/i, 1], [/growing|creciendo/i, 1],
      ],
    },
    {
      name: 'fomo',
      patterns: [
        [/miss out|te (lo )?pierd/i, 3], [/left behind|quedar(se)? atrás/i, 3],
        [/don['']t miss|no te pierdas/i, 3],
        [/falling behind|quedándote atrás/i, 3],
        [/while (you|others)|mientras (tú|otros)/i, 2],
        [/competitor|competencia/i, 2], [/everyone else|los demás/i, 2],
        [/the ones who|los que no/i, 2], [/if you['']re not|si no estás/i, 2],
        [/still (haven['']t|don['']t|not)|todavía no/i, 2],
        [/already|ya (lo|están)/i, 2], [/catching up|ponerse al día/i, 2],
        [/ahead of|por delante/i, 1], [/behind|atrás/i, 1],
        [/opportunity|oportunidad.* perder/i, 1], [/regret|arrepent/i, 2],
        [/too late|demasiado tarde/i, 2], [/window|ventana/i, 1],
        [/rare|escas/i, 1], [/exclusive|exclusiv/i, 2],
        [/only \d+|solo \d+/i, 1], [/spots left|plazas/i, 2],
      ],
    },
    {
      name: 'humorous',
      patterns: [
        [/😂|🤣|😅|🤡|💀/i, 3], [/lol|lmao|rofl/i, 3],
        [/jaja|haha|jeje/i, 3], [/plot twist/i, 3],
        [/spoiler alert/i, 3], [/irony|ironía/i, 2],
        [/joke|chiste|broma/i, 2], [/funny|gracioso|divertid/i, 2],
        [/literally me|yo literal/i, 2], [/ngl |no cap/i, 2],
        [/bruh/i, 2], [/imagine |imagina /i, 1],
        [/narrator:|narrador:/i, 3], [/spoiler:/i, 3],
        [/me: |yo: /i, 2], [/also me|también yo/i, 2],
        [/nobody: |nadie: /i, 2], [/unexpected|inesperado/i, 1],
        [/awkward|incómod/i, 1], [/oops|ups/i, 2],
        [/sarcas|sarcás/i, 2], [/meme/i, 2],
        [/clown|payaso/i, 2], [/comic|cómic/i, 1],
      ],
    },
  ];

  const scores: Record<string, number> = {};
  for (const dim of dimensions) {
    let score = 0;
    for (const [pattern, weight] of dim.patterns) {
      const matches = t.match(new RegExp(pattern.source, 'gi'));
      if (matches) score += matches.length * weight;
    }
    scores[dim.name] = score;
  }

  // Pick the dominant tone — require at least 2 points to avoid noise
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] < 2) return 'neutral';
  return sorted[0][0];
}

// Post structure pattern detection
export function classifyStructure(text: string | null): string {
  if (!text) return 'other';
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lineCount = lines.length;

  // Check for list structure (numbered or bulleted items)
  const listLines = lines.filter((l) => /^\s*(\d+[\.\)]\s|[-•]\s|→|✅|❌|▸)/.test(l));
  if (listLines.length >= 3 && listLines.length / lineCount > 0.4) return 'list';

  // Problem → Solution → CTA
  const hasProblem = /problem|issue|struggle|challenge|mistake|error|problema|reto|difícil|wrong/i.test(lower);
  const hasSolution = /solution|instead|here['']?s how|así es como|the fix|try this|do this|la solución/i.test(lower);
  if (hasProblem && hasSolution) return 'problem_solution';

  // Story → Lesson
  const hasStory = /^(i |yo |cuando |when |last |one day|un día)/i.test(lines[0]?.trim() || '');
  const hasLesson = /lesson|takeaway|moraleja|aprendí|learned|the point|lo que aprendí/i.test(lower);
  if (hasStory || (lineCount > 5 && hasLesson)) return 'story_lesson';

  // Short and punchy (under 50 words, few lines)
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 50 && lineCount <= 5) return 'short_punchy';

  // Thread/long-form
  if (wordCount > 300) return 'long_form';

  return 'other';
}

// Engagement ratios
export function commentLikeRatio(comments: number, likes: number): number {
  if (likes === 0) return 0;
  return Math.round((comments / likes) * 1000) / 1000;
}

export function shareLikeRatio(reposts: number, likes: number): number {
  if (likes === 0) return 0;
  return Math.round((reposts / likes) * 1000) / 1000;
}

// Simple language detection (heuristic — franc is ESM-only, so we use a simple approach)
const spanishWords = ['que', 'los', 'las', 'del', 'por', 'una', 'con', 'para', 'como', 'más', 'pero', 'este', 'esta', 'cuando', 'también', 'puede', 'todos', 'así', 'nos', 'entre'];
const englishWords = ['the', 'and', 'that', 'have', 'for', 'are', 'with', 'this', 'from', 'your', 'will', 'been', 'they', 'would', 'about', 'could', 'which', 'their', 'than', 'other'];
const frenchWords = ['les', 'des', 'que', 'une', 'pour', 'dans', 'qui', 'est', 'sur', 'avec', 'pas', 'plus', 'par', 'tout', 'mais', 'sont', 'nous', 'comme', 'cette', 'vous'];

export function detectLanguage(text: string | null): string {
  if (!text) return 'unknown';
  const words = text.toLowerCase().split(/\s+/);
  const counts = { es: 0, en: 0, fr: 0 };

  for (const w of words) {
    if (spanishWords.includes(w)) counts.es++;
    if (englishWords.includes(w)) counts.en++;
    if (frenchWords.includes(w)) counts.fr++;
  }

  const max = Math.max(counts.es, counts.en, counts.fr);
  if (max === 0) return 'unknown';
  if (counts.en === max) return 'en';
  if (counts.es === max) return 'es';
  return 'fr';
}

// Enrich a normalized post with computed metadata
export function enrichPost(post: {
  content_text: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}) {
  const text = post.content_text;
  const hashtags = extractHashtags(text);
  const engagement = calculateEngagement(post);

  return {
    engagement_score: engagement,
    hook_text: extractHook(text),
    word_count: countWords(text),
    char_count: countChars(text),
    line_break_count: countLineBreaks(text),
    has_aggressive_spacing: hasAggressiveSpacing(text),
    hook_type: classifyHook(text),
    post_structure: classifyStructure(text),
    has_hashtags: hashtags.length > 0,
    hashtags,
    has_emoji: hasEmoji(text),
    has_call_to_action: hasCTA(text),
    language: detectLanguage(text),
    comment_like_ratio: commentLikeRatio(post.comments_count, post.likes_count),
    share_like_ratio: shareLikeRatio(post.reposts_count, post.likes_count),
    text_tone: classifyTone(post.content_text),
  };
}

// Recalculate outlier status for all posts of a creator
export function recalculateOutliers(posts: { engagement_score: number }[]) {
  const avg = calculateAverageEngagement(posts);
  return posts.map((p) => {
    const ratio = calculateOutlierRatio(p.engagement_score, avg);
    return {
      ...p,
      outlier_ratio: Math.round(ratio * 100) / 100,
      is_outlier: isOutlier(ratio),
    };
  });
}
