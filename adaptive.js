const MIN_CHUNK = 256 * 1024;
const MAX_CHUNK = 4 * 1024 * 1024;

export function chooseChunkBytes() {
  const memory = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 2);
  const byMemory = memory <= 2 ? MIN_CHUNK : memory <= 4 ? 512 * 1024 : memory <= 8 ? 1024 * 1024 : 2 * 1024 * 1024;
  const byCores = cores <= 2 ? MIN_CHUNK : cores <= 4 ? 512 * 1024 : MAX_CHUNK;
  return Math.max(MIN_CHUNK, Math.min(MAX_CHUNK, byMemory, byCores));
}

export function formatByteSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
