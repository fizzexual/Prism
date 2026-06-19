let counter = 0;

/** Generate a short, collision-resistant id with a semantic prefix. */
export function newId(prefix = 'el') {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter}${rand}`;
}
