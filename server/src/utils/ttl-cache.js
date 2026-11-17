// Caché en memoria con vencimiento (TTL), tamaño máximo y "de-duplicación" de peticiones en
// curso: si 5 usuarios piden lo mismo a la vez, solo se hace UNA llamada real y todos
// comparten el resultado. Los errores nunca se guardan.
function createTtlCache({ maxEntries = 5000, now = Date.now } = {}) {
  const store = new Map(); // clave → { value, expiresAt }
  const inflight = new Map(); // clave → Promise
  const stats = { hits: 0, misses: 0, shared: 0 };

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      store.delete(key);
      return undefined;
    }
    // Se reinserta para marcarla como "usada recientemente".
    store.delete(key);
    store.set(key, entry);
    return entry.value;
  }

  function set(key, value, ttlMs) {
    store.delete(key);
    while (store.size >= maxEntries) {
      store.delete(store.keys().next().value); // la menos usada recientemente
    }
    store.set(key, { value, expiresAt: now() + ttlMs });
  }

  /**
   * Devuelve el valor guardado o ejecuta `loader()` una sola vez. `ttlMs` puede ser un
   * número o una función (valor) => número para decidir el vencimiento según el resultado.
   */
  function getOrLoad(key, ttlMs, loader) {
    const cached = get(key);
    if (cached !== undefined) {
      stats.hits += 1;
      return Promise.resolve(cached);
    }

    if (inflight.has(key)) {
      stats.shared += 1;
      return inflight.get(key);
    }

    stats.misses += 1;
    const promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        set(key, value, typeof ttlMs === 'function' ? ttlMs(value) : ttlMs);
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, promise);
    return promise;
  }

  return {
    get,
    set,
    getOrLoad,
    clear: () => {
      store.clear();
      inflight.clear();
    },
    size: () => store.size,
    stats: () => ({ ...stats }),
  };
}

// Ejecuta como máximo `max` tareas a la vez; las demás esperan en cola. Evita lanzar de golpe
// decenas de peticiones a un proveedor que limita las llamadas por segundo.
function createConcurrencyLimiter(max) {
  let active = 0;
  const queue = [];

  function next() {
    if (active >= max || queue.length === 0) return;
    active += 1;
    const { task, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active -= 1;
        next();
      });
  }

  return function run(task) {
    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
  };
}

module.exports = { createTtlCache, createConcurrencyLimiter };
