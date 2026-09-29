/**
 * Lógica de porciones. No toca el DOM, así que se puede probar con Node.
 */

// Las porciones se aproximan a la media más cercana; en empate (x.25 / x.75) se sube.
export const STEP = 0.5;
export const MAX_GRAMS = 1000;

// El orden del arreglo es el orden de cálculo.
// - need:  gramos por porción; el macro más escaso define cuántas porciones caben.
// - extra: gramos que la porción consume si existen, pero que no la limitan.
export const GROUPS = [
  { id: 'lacteo',   label: 'Lácteos',   dairyOnly: true, need: { carbs: 12, protein: 8 }, extra: { fat: 3 } },
  { id: 'almidon',  label: 'Almidones',                  need: { carbs: 15 },            extra: { protein: 3 } },
  { id: 'proteina', label: 'Proteínas',                  need: { protein: 7 },           extra: { fat: 3 } },
  { id: 'grasa',    label: 'Grasas',                     need: { fat: 5 } },
];

export const DISPLAY_ORDER = ['almidon', 'proteina', 'grasa', 'lacteo'];
export const MACRO_LABELS = { protein: 'proteína', carbs: 'carbohidratos', fat: 'grasa' };

const EPSILON = 1e-9; // evita que 0.7499999999 caiga del lado equivocado
const round2 = (n) => Math.round(n * 100) / 100;
export const roundToStep = (n) => Math.round(n / STEP + EPSILON) * STEP;

/**
 * Convierte texto a gramos. Vacío = 0. Acepta coma o punto decimal.
 * Devuelve NaN si no es un número válido entre 0 y MAX_GRAMS.
 */
export function parseGrams(text) {
  const s = String(text ?? '').trim();
  if (s === '') return 0;
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(s)) return NaN;
  const n = Number(s.replace(',', '.'));
  return n <= MAX_GRAMS ? n : NaN;
}

/**
 * @param {{carbs:number, protein:number, fat:number, dairy?:boolean}} input gramos por porción de la etiqueta
 * @returns {{groups: Array, left: {carbs:number, protein:number, fat:number}}}
 */
export function calculate({ carbs, protein, fat, dairy = false }) {
  const left = { carbs, protein, fat };

  const groups = GROUPS.map(({ id, label, dairyOnly, need, extra }) => {
    if (dairyOnly && !dairy) return { id, label, raw: 0, portions: 0, used: {} };

    const raw = Math.min(...Object.entries(need).map(([macro, per]) => left[macro] / per));
    const portions = roundToStep(raw);

    // Cada porción descuenta lo que pide, pero nunca más de lo que queda.
    const used = {};
    for (const [macro, per] of Object.entries({ ...extra, ...need })) {
      used[macro] = round2(Math.min(left[macro], portions * per));
      left[macro] = round2(left[macro] - used[macro]);
    }
    return { id, label, raw: round2(raw), portions, used };
  });

  return { groups, left };
}
