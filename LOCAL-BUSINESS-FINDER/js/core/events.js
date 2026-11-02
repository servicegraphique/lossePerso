const listeners = new Map();
export const events = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name)?.delete(fn);
  },
  emit(name, detail) { for (const fn of listeners.get(name) || []) fn(detail); },
};
