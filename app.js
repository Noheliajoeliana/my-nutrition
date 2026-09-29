import { GROUPS, DISPLAY_ORDER, MACRO_LABELS, calculate, parseGrams } from './portions.js';

const INPUTS = ['protein', 'carbs', 'fat'];
const HINT = 'Ingresa los gramos por porción de la tabla nutricional.';
const INVALID = 'Usa solo números de 0 a 1000, por ejemplo 12,5.';
const NO_VALUE = '–';

const $ = (id) => document.getElementById(id);
const form = $('form');
const fmt = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

// Los textos siempre entran con textContent/append: nada se interpreta como HTML.
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// Filas de resultado: se crean una vez y luego solo se actualizan.
const rows = new Map(
  DISPLAY_ORDER.map((id) => {
    const group = GROUPS.find((g) => g.id === id);
    const name = el('span', 'name', group.label);
    const value = el('span', 'value', NO_VALUE);
    const row = el('li', 'result');
    row.append(name, value);
    $('results').append(row);
    return [id, { row, value }];
  }),
);

function setMessage(text, isError = false) {
  const msg = $('msg');
  msg.textContent = text;
  msg.classList.toggle('error', isError);
}

function showResults(groups) {
  for (const [id, { row, value }] of rows) {
    const portions = groups?.find((g) => g.id === id)?.portions;
    value.textContent = portions == null ? NO_VALUE : fmt.format(portions);
    row.classList.toggle('has', portions > 0);
  }
}

const usedText = (grams) =>
  Object.keys(MACRO_LABELS)
    .filter((macro) => grams[macro] > 0)
    .map((macro) => `${fmt.format(grams[macro])} g de ${MACRO_LABELS[macro]}`)
    .join(', ');

function showSteps(groups, left) {
  const items = groups
    .filter((g) => g.raw > 0)
    .map((g) => el('li', null, `${g.label}: ${fmt.format(g.raw)} → ${fmt.format(g.portions)}${g.portions ? ` (usa ${usedText(g.used)})` : ''}`));
  const leftover = usedText(left);
  items.push(el('li', null, leftover ? `Sobra: ${leftover}.` : 'No sobra nada.'));
  $('steps').replaceChildren(...items);
}

function update() {
  const values = {};
  for (const name of INPUTS) {
    const input = form.elements[name];
    values[name] = parseGrams(input.value);
    input.setAttribute('aria-invalid', String(Number.isNaN(values[name])));
  }

  if (INPUTS.some((name) => Number.isNaN(values[name]))) {
    setMessage(INVALID, true);
    showResults(null);
    $('steps').replaceChildren();
    return;
  }
  if (INPUTS.every((name) => !form.elements[name].value.trim())) {
    setMessage(HINT);
    showResults(null);
    $('steps').replaceChildren();
    return;
  }

  setMessage('');
  const { groups, left } = calculate({ ...values, dairy: form.elements.dairy.checked });
  showResults(groups);
  showSteps(groups, left);
}

form.addEventListener('input', update);
form.addEventListener('submit', (e) => e.preventDefault()); // Enter en el teclado móvil
$('clear').addEventListener('click', () => {
  form.reset();
  update();
  form.elements.protein.focus();
});

update();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
