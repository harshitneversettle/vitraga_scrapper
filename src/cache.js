const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  data: null,
  fetchedAt: null,
};

export function getCache() {
  return cache;
}

export function setCache(data) {
  cache = { data, fetchedAt: Date.now() };
}

export function isCacheStale() {
  if (!cache.fetchedAt) return true;
  return Date.now() - cache.fetchedAt > CACHE_TTL_MS;
}
