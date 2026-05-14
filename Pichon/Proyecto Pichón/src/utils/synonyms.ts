/**
 * Synonym groups for construction terminology.
 * Covers Argentina, México, España, Colombia, Chile variations.
 * Each array is a group — any word in a query matching one entry
 * will also match all other entries in the group.
 */
const SYNONYM_GROUPS: string[][] = [
  // Hormigón / Concreto
  ['hormigon', 'concreto', 'portland', 'hc', 'ha'],
  // Mampostería / Albañilería
  ['mamposteria', 'albanileria', 'muro', 'pared', 'tabique', 'ladrillo', 'block', 'bloque'],
  // Losa / Entrepiso
  ['losa', 'forjado', 'placa', 'entrepiso', 'techo losa', 'loseta', 'vigueta'],
  // Cubierta / Techo
  ['cubierta', 'techo', 'tejado', 'azotea', 'terraza', 'cielorraso', 'cielo raso', 'plafon', 'techo plano'],
  // Piso / Solado
  ['piso', 'solado', 'pavimento', 'contrapiso', 'baldosa', 'ceramico', 'ceramica', 'porcellanato', 'parquet', 'madera piso'],
  // Revestimiento
  ['revestimiento', 'recubrimiento', 'chapado', 'enchapado', 'azulejo', 'ceramica pared'],
  // Pintura
  ['pintura', 'pintado', 'latex', 'esmalte', 'barniz', 'recubrimiento pintura'],
  // Revoque / Yeso / Enlucido
  ['revoque', 'revocar', 'yeso', 'enlucido', 'estuco', 'mortero fino', 'jaharro', 'frente'],
  // Impermeabilización
  ['impermeabilizacion', 'membrana', 'hidroizolacion', 'aislacion hidrofuga', 'impermeable', 'asfalto', 'betun'],
  // Aislación térmica / acústica
  ['aislacion', 'aislante', 'espuma', 'poliestireno', 'telgopor', 'lana de vidrio', 'lana mineral', 'placa yeso', 'durlock'],
  // Excavación
  ['excavacion', 'zanja', 'pozo', 'movimiento tierra', 'terraplén', 'terraplenado', 'desmonte', 'limpieza terreno'],
  // Relleno / Compactación
  ['relleno', 'compactacion', 'nivelacion', 'backfill', 'cascote', 'piedra triturada', 'tosca'],
  // Demolición
  ['demolicion', 'derribo', 'picado', 'retiro', 'desmontaje'],
  // Cimientos / Fundaciones
  ['cimientos', 'fundaciones', 'fundacion', 'zapata', 'vigas de fundacion', 'pilotes', 'bases'],
  // Viga
  ['viga', 'vigueta', 'dintel', 'cabio', 'cercha', 'trama'],
  // Columna / Pilar
  ['columna', 'pilar', 'poste', 'soporte'],
  // Hierro / Acero / Armadura
  ['hierro', 'acero', 'armadura', 'ferreria', 'varilla', 'malla', 'estribos', 'barras'],
  // Cañería / Plomería
  ['caneria', 'tuberia', 'caño', 'tubo', 'plomeria', 'sanitaria', 'desague', 'agua'],
  // Instalación eléctrica
  ['electrico', 'electricidad', 'instalacion electrica', 'cableado', 'tablero', 'luz'],
  // Ventana / Carpintería aluminio
  ['ventana', 'carpinteria aluminio', 'vidrio', 'cristal', 'marco', 'celosía', 'persiana'],
  // Puerta
  ['puerta', 'hoja', 'marco madera', 'portal', 'portón'],
  // Mesada / Encimera
  ['mesada', 'meseta', 'encimera', 'mostrador', 'granito'],
  // Zócalo / Rodapié
  ['zocalo', 'rodapie', 'guardapolvo', 'perfil piso'],
  // Escalera
  ['escalera', 'peldaño', 'escalon', 'rampa', 'pasillo'],
  // Vereda / Acera
  ['vereda', 'acera', 'banqueta', 'paseo'],
  // Arena
  ['arena', 'arido fino', 'arido', 'arena fina', 'arena gruesa'],
  // Piedra / Árido grueso
  ['piedra', 'arido grueso', 'granza', 'ripio', 'pedregullo', 'gravel'],
  // Cerco / Muro perimetral
  ['cerco', 'muro perimetral', 'medianera', 'paredón', 'cerramiento'],
  // Pisos exteriores
  ['patio', 'exterior', 'vereda', 'solado exterior', 'empedrado', 'adoquin'],
  // Fisuras / Grietas
  ['fisura', 'grieta', 'raja', 'reparacion', 'saneamiento'],
];

/** Strip accents and lowercase for comparison */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/** Build a flat lookup: normalized word → all synonyms (normalized) */
const SYNONYM_MAP = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(normalize);
  for (const term of normalized) {
    SYNONYM_MAP.set(term, normalized);
  }
}

/**
 * Given a raw query string, return an expanded version that includes
 * all synonym variants of each word/phrase found in the dictionary.
 */
export function expandQuery(query: string): string {
  const norm = normalize(query);
  const extras: string[] = [];

  // Try full phrase first, then individual words
  const synonymsFull = SYNONYM_MAP.get(norm);
  if (synonymsFull) {
    extras.push(...synonymsFull);
  }

  const words = norm.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const synonyms = SYNONYM_MAP.get(word);
    if (synonyms) {
      extras.push(...synonyms);
    }
  }

  if (extras.length === 0) return query;

  // Deduplicate and combine original query with expanded terms
  const unique = Array.from(new Set([norm, ...extras]));
  return unique.join(' | ');
}
