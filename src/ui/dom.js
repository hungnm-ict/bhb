/**
 * Tiny DOM helper.
 *
 * Upstream built its panels from long `innerHTML` strings with inline styles,
 * which made every visual tweak a search through markup. Here structure is
 * built with `el()` and appearance lives in one stylesheet.
 */

/**
 * @param {string} tag
 * @param {{ class?: string, text?: string, style?: Record<string,string> }} [props]
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
