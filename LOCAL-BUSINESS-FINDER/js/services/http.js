const queues = new Map();
export class HttpError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'HttpError'; this.status = status; }
}

// One in-flight request per public service; no autocomplete and no automatic retry.
export async function requestJson(url, { method = 'GET', body, timeout = 30000, signal, minInterval = 1200 } = {}) {
  const host = new URL(url).origin;
  const previous = queues.get(host) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const tail = previous.then(() => gate);
  queues.set(host, tail);
  await previous;
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Délai dépassé', 'TimeoutError')), timeout);
  try {
    if (controller.signal.aborted) throw controller.signal.reason;
    const response = await fetch(url, { method, body, signal: controller.signal, headers: { Accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' });
    if (!response.ok) {
      if (response.status === 429) throw new HttpError('La limite gratuite du service est atteinte. Attendez avant une nouvelle recherche ; aucune requête automatique ne sera relancée.', 429);
      if (response.status === 403) throw new HttpError('Le service public refuse cette requête. Consultez les conditions d’utilisation dans la documentation.', 403);
      throw new HttpError(`Le service a répondu une erreur ${response.status}. Réessayez plus tard.`, response.status);
    }
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Recherche annulée', 'AbortError');
    if (error.name === 'TimeoutError') throw new HttpError('Le service met trop de temps à répondre. Réduisez la zone ou réessayez plus tard.');
    if (error.name === 'AbortError') throw error;
    if (error instanceof HttpError) throw error;
    throw new HttpError('Connexion impossible. Vérifiez Internet ; vos fiches enregistrées restent disponibles.');
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort);
    await new Promise((resolve) => setTimeout(resolve, minInterval));
    release();
    if (queues.get(host) === tail) queues.delete(host);
  }
}
