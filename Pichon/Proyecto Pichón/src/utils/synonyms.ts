/**
 * Diccionario de sinónimos construcción — foco en brecha Argentina ↔ CYPE (España)
 *
 * Cada grupo contiene términos equivalentes. Si la query coincide con cualquier
 * término del grupo, la búsqueda se expande para incluir todos los demás.
 *
 * Criterio de inclusión:
 *  - Término argentino común → término exacto que usa CYPE en el nombre de la tarea
 *  - Variantes regionales: AR / MX / CL / CO / ES
 *  - Abreviaturas de obra (HºAº, lpm, etc.)
 *  - Errores de tipeo frecuentes
 */
const SYNONYM_GROUPS: string[][] = [

  // ── INSTALACIONES SANITARIAS / PLOMERÍA ────────────────────────────────────
  // CYPE: "Fontanería" — AR dice: plomería, cañería, sanitaria
  ['fontaneria', 'plomeria', 'caneria', 'sanitaria', 'agua fria', 'agua caliente',
   'instalacion de agua', 'caño', 'tubo', 'tuberia', 'grifo', 'canilla', 'llave de paso'],

  // CYPE: "Salubridad y saneamiento" — AR: cloacas, desagüe, pluviales
  ['salubridad', 'saneamiento', 'cloaca', 'desague', 'pluvial', 'pileta de patio',
   'camara septica', 'pozo absorbente', 'pozo ciego', 'colector', 'boca de tormenta'],

  // ── CALEFACCIÓN / REFRIGERACIÓN ────────────────────────────────────────────
  // CYPE: "Calefacción, refrigeración y ACS"
  ['calefaccion', 'refrigeracion', 'acs', 'agua caliente sanitaria',
   'aire acondicionado', 'split', 'losa radiante', 'piso radiante',
   'radiador', 'caldera', 'termotanque', 'boiler', 'heat pump'],

  // CYPE: "Ventilación y climatización"
  ['ventilacion', 'climatizacion', 'extractor', 'ducto', 'conducto',
   'fancoil', 'recuperador de calor', 'hvac', 'difusor'],

  // ── ELECTRICIDAD ───────────────────────────────────────────────────────────
  // CYPE: "Electricidad"
  ['electricidad', 'electrico', 'instalacion electrica', 'cableado',
   'tablero', 'tablero electrico', 'disyuntor', 'termica', 'toma corriente',
   'enchufe', 'interruptor', 'luz', 'luminaria', 'cable'],

  // CYPE: "Iluminación interior"
  ['iluminacion', 'luminaria', 'lampara', 'led', 'spot', 'downlight',
   'artefacto', 'artefacto de luz', 'aplique'],

  // CYPE: "Telecomunicaciones"
  ['telecomunicaciones', 'internet', 'red', 'wifi', 'fibra optica',
   'telefonia', 'cctv', 'camaras', 'alarma', 'portero electrico', 'videoportero'],

  // CYPE: "Domótica"
  ['domotica', 'automatizacion', 'smart home', 'casa inteligente',
   'control de acceso', 'persiana automatica', 'sensor'],

  // CYPE: "Gas"
  ['gas', 'instalacion de gas', 'cañeria de gas', 'medidor de gas',
   'gasoducto', 'calefon', 'cocina a gas'],

  // CYPE: "Protección contra incendios"
  ['incendio', 'contra incendio', 'extintor', 'rociador', 'sprinkler',
   'detector de humo', 'alarma de incendio', 'matafuego'],

  // ── REVESTIMIENTOS DE PISO ─────────────────────────────────────────────────
  // CYPE: "Solados y pavimentos" — AR: pisos, cerámicos, porcellanato
  ['solado', 'pavimento', 'piso', 'ceramico', 'ceramica', 'porcellanato',
   'baldosa', 'mosaico', 'parquet', 'madera piso', 'vinilico',
   'microcemento', 'piso de cemento', 'piso pulido', 'granitina'],

  // CYPE: "Alicatados y chapados" — AR: revestimiento de pared, azulejo
  ['alicatado', 'chapado', 'revestimiento ceramico', 'azulejo', 'ceramico pared',
   'porcellanato pared', 'enchapado', 'revestimiento de bano', 'revestimiento de cocina'],

  // ── REVESTIMIENTOS DE PARED / TECHO ────────────────────────────────────────
  // CYPE: "Revoques y enlucidos" — AR: revoque, jaharro, frente, esbozo
  ['revoque', 'enlucido', 'jaharro', 'frente', 'esbozo', 'revocar',
   'mortero fino', 'grueso de revoque', 'revoque exterior', 'revoque interior'],

  // CYPE: "Pinturas interiores"
  ['pintura interior', 'latex interior', 'pintura de techo', 'pintura de pared',
   'pintura plastica', 'pintura al agua', 'latex', 'pintar interior'],

  // CYPE: "Pinturas exteriores"
  ['pintura exterior', 'latex exterior', 'pintura de fachada', 'hidrofugante',
   'revestimiento plastico', 'texturado', 'esmalte exterior', 'pintar exterior'],

  // CYPE: "Trasdosados de yeso" — AR: durlock, placas de yeso, cielorraso de yeso
  ['trasdosado', 'durlock', 'placa de yeso', 'yeso', 'cielorraso de yeso',
   'pladur', 'drywall', 'tabique de yeso', 'steel framing yeso'],

  // ── CIELORRASO ─────────────────────────────────────────────────────────────
  // No tiene categoría propia en CYPE — buscar en trasdosados y revestimientos
  ['cielorraso', 'cielo raso', 'cielorraso desmontable', 'cielorraso de yeso',
   'cielorraso suspendido', 'plafon', 'techo suspendido', 'falso techo'],

  // ── MAMPOSTERÍA / MUROS ────────────────────────────────────────────────────
  // CYPE: "Fachadas de fábrica", "Demolición de mampostería"
  ['mamposter ia', 'albanileria', 'ladrillo', 'muro de ladrillo', 'pared de ladrillo',
   'fabrica de ladrillo', 'ladrillo ceramico', 'ladrillo comun', 'ladrillo visto',
   'bloque de cemento', 'bloque', 'block'],

  // CYPE: "Particiones interiores" — AR: tabique, pared interior, medianera
  ['particion', 'tabique', 'pared interior', 'division', 'muro divisorio',
   'tabique de ladrillo', 'tabique de yeso', 'separacion de ambientes'],

  // ── HORMIGÓN ───────────────────────────────────────────────────────────────
  // CYPE: "Hormigón armado" — AR: HºAº, concreto (MX)
  ['hormigon armado', 'hoa', 'ha', 'concreto armado', 'concreto',
   'hormigon', 'hormigon en masa', 'colado de hormigon', 'vaciado'],

  // CYPE: "Cimentaciones superficiales" — AR: bases, zapatas, plateas
  ['zapata', 'platea', 'bases', 'fundacion', 'fundaciones', 'vigas de fundacion',
   'viga de encadenado', 'encadenado inferior', 'cimentacion superficial'],

  // ── ESTRUCTURA ─────────────────────────────────────────────────────────────
  // CYPE: Losas/Forjados — AR: losa, entrepiso
  ['losa', 'entrepiso', 'forjado', 'losa de entrepiso', 'losa de techo',
   'losa nervurada', 'losa con viguetas', 'losa maciza', 'placa'],

  // Columnas / Pilares
  ['columna', 'pilar', 'columna de hormigon', 'pilar metalico', 'poste'],

  // Vigas
  ['viga', 'viga de hormigon', 'viga metalica', 'dintel', 'viga de encadenado',
   'encadenado superior', 'viga pretensada'],

  // CYPE: "Estructuras de acero" — AR: estructura metálica, hierro
  ['estructura metalica', 'estructura de acero', 'hierro', 'perfil metalico',
   'perfil ipr', 'perfil c', 'correa metalica', 'caño estructural', 'tubo estructural'],

  // CYPE: "Estructuras de madera" — AR: madera, tirante, viga de madera
  ['estructura de madera', 'madera', 'tirante', 'viga de madera', 'pinotea',
   'pino', 'eucalipto', 'machimbre'],

  // ── CUBIERTA / TECHO ───────────────────────────────────────────────────────
  // CYPE: "Cubiertas inclinadas", "Azoteas" — AR: techo, terraza, cubierta
  ['cubierta', 'techo', 'terraza', 'azotea', 'cubierta inclinada',
   'techo de chapa', 'chapa', 'techo de teja', 'teja', 'membrana en techo',
   'cubierta plana', 'techo plano', 'losa de techo'],

  // ── IMPERMEABILIZACIÓN ─────────────────────────────────────────────────────
  // CYPE: "Impermeabilizaciones" — AR: membrana, impermeable, hidroizolación
  ['impermeabilizacion', 'membrana', 'membrana asfaltica', 'membrana liquida',
   'hidroizolacion', 'aislacion hidrofuga', 'impermeable', 'impermeabilizar',
   'pintura asfaltica', 'asfalto', 'betun', 'polietileno'],

  // ── AISLAMIENTO TÉRMICO / ACÚSTICO ────────────────────────────────────────
  // CYPE: "Sistemas de aislamiento", "Aislamiento en cubiertas"
  ['aislacion termica', 'aislacion acustica', 'aislante', 'aislamiento',
   'telgopor', 'poliestireno expandido', 'eps', 'poliestireno extruido', 'xps',
   'lana de vidrio', 'lana mineral', 'lana de roca', 'espuma de poliuretano'],

  // CYPE: "Sistemas SATE" — AR: revoque aislante exterior, aislación exterior
  ['sate', 'aislacion exterior', 'revoque aislante', 'etics',
   'termosistema', 'fachada ventilada'],

  // ── EXCAVACIÓN / MOVIMIENTO DE TIERRAS ────────────────────────────────────
  // CYPE: "Movimiento de tierras" — AR: excavación, movimiento de suelo
  ['movimiento de tierras', 'excavacion', 'zanjeo', 'zanja',
   'movimiento de suelo', 'nivelacion del terreno', 'desmonte',
   'excavacion mecanica', 'excavacion manual', 'pala mecanica'],

  // CYPE: "Bases y subbases" — AR: relleno, compactación, tosca
  ['relleno', 'compactacion', 'subbase', 'base compactada', 'tosca',
   'pedregullo', 'granza', 'ripio', 'cascote', 'arena de relleno'],

  // Pilotajes
  ['pilote', 'pilotaje', 'micropilote', 'pilote de hormigon',
   'fundacion profunda', 'pilote in situ'],

  // ── DEMOLICIÓN ─────────────────────────────────────────────────────────────
  ['demolicion', 'demoler', 'derribo', 'tirar', 'picar', 'picado',
   'retiro', 'saque', 'sacar', 'desmontaje', 'retiro de escombros'],

  // ── CARPINTERÍA ────────────────────────────────────────────────────────────
  // CYPE: "Carpintería exterior" — AR: ventana, carpintería de aluminio
  ['carpinteria exterior', 'ventana', 'carpinteria de aluminio',
   'ventana de aluminio', 'ventana de pvc', 'ventana corrediza',
   'ventana de abrir', 'marco', 'contramarco', 'persiana', 'mosquitero'],

  // CYPE: "Puertas de entrada" — AR: puerta exterior, puerta de ingreso
  ['puerta entrada', 'puerta exterior', 'puerta de acceso', 'porton',
   'puerta blindada', 'puerta de seguridad', 'puerta de chapa'],

  // CYPE: "Puertas interiores"
  ['puerta interior', 'puerta placa', 'puerta de madera', 'puerta tambor',
   'puerta corrediza interior', 'hoja de puerta'],

  // CYPE: "Vidrios y cristales" — AR: vidrio, doble vidriado
  ['vidrio', 'cristal', 'dvh', 'doble vidriado', 'doble vidriado hermetico',
   'vidrio templado', 'vidrio laminado', 'espejo'],

  // CYPE: "Particiones de vidrio" — AR: mampara, tabique de vidrio
  ['mampara', 'tabique de vidrio', 'particion de vidrio',
   'cerramiento de vidrio', 'mampara de bano'],

  // ── APARATOS SANITARIOS ────────────────────────────────────────────────────
  // CYPE: "Aparatos sanitarios"
  ['aparato sanitario', 'sanitario', 'inodoro', 'bidet', 'lavatorio',
   'bacha', 'pileta', 'duchero', 'banadera', 'hidromasaje',
   'grifo', 'canilla', 'mezcladora', 'monocomando', 'termostato'],

  // CYPE: "Equipamiento de cocinas"
  ['cocina', 'equipamiento de cocina', 'mesada', 'encimera',
   'bacha de cocina', 'pileta de cocina', 'campana', 'anafe',
   'horno', 'heladera', 'bajo mesada', 'alacena'],

  // ── CONTRAPISO ─────────────────────────────────────────────────────────────
  // No siempre aparece solo en CYPE — buscar en solados y rellenos
  ['contrapiso', 'contrapiso de hormigon', 'losa de piso', 'carpeta',
   'carpeta de cemento', 'nivelacion de piso', 'base de piso'],

  // ── HIERRO / ACERO DE REFUERZO ─────────────────────────────────────────────
  ['hierro', 'armadura', 'varilla', 'barra de acero', 'malla de acero',
   'malla electrosoldada', 'estribos', 'zunchos', 'ferreria'],

  // ── ÁRIDOS Y MATERIALES BÁSICOS ────────────────────────────────────────────
  ['cemento', 'portland', 'bolsa de cemento', 'cemento de albañileria'],
  ['arena', 'arena fina', 'arena gruesa', 'arena de rio', 'arido fino'],
  ['piedra', 'cascote', 'pedregullo', 'ripio', 'granza', 'arido grueso',
   'piedra partida', 'medialuna'],

  // ── CERCAS / PERÍMETRO ─────────────────────────────────────────────────────
  ['cerco', 'medianera', 'muro perimetral', 'paredon', 'cerramiento perimetral',
   'alambrado', 'reja', 'malla', 'muro de cerramiento'],

  // ── SOLADOS EXTERIORES ─────────────────────────────────────────────────────
  ['vereda', 'acera', 'banqueta', 'patio exterior', 'adoquin',
   'solado exterior', 'piso exterior', 'baldosa exterior',
   'piso de hormigon', 'piso calcareo'],

  // ── ESCALERA ───────────────────────────────────────────────────────────────
  ['escalera', 'escalon', 'peldaño', 'rampa', 'barandilla', 'baranda',
   'pasamano', 'escalera de hormigon', 'escalera metalica'],

  // ── ZÓCALO / RODAPIÉ ───────────────────────────────────────────────────────
  ['zocalo', 'rodapie', 'guardapolvo', 'perfil de piso',
   'zocalo ceramico', 'zocalo de madera'],

  // ── MESADA ─────────────────────────────────────────────────────────────────
  ['mesada', 'encimera', 'cubierta de cocina', 'granito', 'marmol',
   'silestone', 'mesada de cocina', 'mesada de bano'],

  // ── GRIETAS / FISURAS / REPARACIONES ──────────────────────────────────────
  ['fisura', 'grieta', 'rajadura', 'crack', 'reparacion', 'saneamiento',
   'inyeccion de grieta', 'parche'],

  // ── SEÑALIZACIÓN ───────────────────────────────────────────────────────────
  ['señalizacion', 'cartel', 'letrero', 'balizamiento',
   'demarcacion', 'pintura de piso'],
];

/** Quitar tildes y pasar a minúsculas para comparación */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** lookup: término normalizado → todos los sinónimos del grupo */
const SYNONYM_MAP = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(normalize);
  for (const term of normalized) {
    SYNONYM_MAP.set(term, normalized);
  }
}

/**
 * Expande la query con todos los sinónimos conocidos de cada palabra/frase.
 * Retorna una cadena compatible con Fuse.js en modo useExtendedSearch
 * (términos separados por " | " = OR logic).
 */
export function expandQuery(query: string): string {
  const norm = normalize(query);
  const extras = new Set<string>();

  // 1. Intentar match de frase completa
  const full = SYNONYM_MAP.get(norm);
  if (full) full.forEach(t => extras.add(t));

  // 2. Match por tokens (bi-gramas y unigramas)
  const tokens = norm.split(/\s+/).filter(w => w.length > 2);
  for (let i = 0; i < tokens.length; i++) {
    // unigrama
    const uni = SYNONYM_MAP.get(tokens[i]);
    if (uni) uni.forEach(t => extras.add(t));
    // bigrama
    if (i < tokens.length - 1) {
      const bi = tokens[i] + ' ' + tokens[i + 1];
      const biSyn = SYNONYM_MAP.get(bi);
      if (biSyn) biSyn.forEach(t => extras.add(t));
    }
  }

  if (extras.size === 0) return query;

  // Combinar query original + expansiones como OR para Fuse
  const all = [norm, ...Array.from(extras)];
  return Array.from(new Set(all)).join(' | ');
}
