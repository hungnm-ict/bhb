/**
 * Tiny DOM helper.
 *
 * Upstream built its panels from long `innerHTML` strings with inline styles,
 * which made every visual tweak a search through markup. Here structure is
 * built with `el()` and appearance lives in one stylesheet.
 */

/**
 * @param {string} tag
 * @param {{ class?: string, text?: string, title?: string, style?: Record<string,string> }} [props]
 * @param {Array<Node | string | null | undefined>} [children]
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  if (props.class) {
    node.className = props.class;
  }
  if (props.text !== undefined) {
    node.textContent = props.text;
  }
  if (props.title) {
    node.title = props.title;
  }
  if (props.style) {
    Object.assign(node.style, props.style);
  }

  for (const child of children) {
    if (child === null || child === undefined) {
      continue;
    }
    node.append(child);
  }

  return node;
}

/** Attach to `documentElement`: the game may replace `body` while loading. */
export function mount(node) {
  (document.documentElement || document.body).append(node);
  return node;
}

/**
 * A segmented control: every choice visible at once, one tap to switch.
 *
 * A `<select>` hides the other choices behind a click and a scroll, which is
 * wasted motion for something like a language with only two answers. Kept to
 * a handful of options on purpose — past four or five this is a wall of
 * buttons, and the dropdown it replaced is the one that still scales.
 *
 * @param {object} config
 * @param {Array<{ value: string, label: string, title?: string, disabled?: boolean }>} config.options
 * @param {string} config.value the option currently chosen
 * @param {(value: string) => void} config.onChange
 * @param {string} [config.className] extra class on the wrapping row
 * @returns {HTMLElement}
 */
export function chipGroup({ options, value, onChange, className = '' }) {
  const wrap = el('div', { class: `bhb-chips ${className}`.trim() });
  for (const option of options) {
    const chip = el('button', {
      class: `bhb-chip ${option.value === value ? 'is-active' : ''}`.trim(),
      text: option.label,
      title: option.title,
    });
    chip.type = 'button';
    chip.disabled = Boolean(option.disabled);
    chip.addEventListener('click', () => {
      if (option.value !== value) {
        onChange(option.value);
      }
    });
    wrap.append(chip);
  }
  return wrap;
}
