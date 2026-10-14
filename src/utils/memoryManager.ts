/**
 * Memory Management Utility
 * Ensures low browser RAM usage by cleaning up Blob URLs and GPU Canvas buffers.
 */

const activeBlobUrls = new Set<string>();

/**
 * Register a Blob URL to track it for cleanup
 */
export function registerBlobUrl(url: string): string {
  activeBlobUrls.add(url);
  return url;
}

/**
 * Revoke a specific Blob URL and free memory
 */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (!url) return;
  try {
    if (activeBlobUrls.has(url)) {
      URL.revokeObjectURL(url);
      activeBlobUrls.delete(url);
    }
  } catch (err) {
    console.warn('Failed to revoke blob URL:', err);
  }
}

/**
 * Clean up all tracked Blob URLs
 */
export function cleanupAllBlobUrls(): void {
  activeBlobUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
  activeBlobUrls.clear();
}

/**
 * Free offscreen canvas memory buffers
 */
export function releaseCanvasMemory(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Setting dimensions to 1x1 drops underlying GPU texture allocations
    canvas.width = 1;
    canvas.height = 1;
  } catch (err) {
    console.warn('Canvas release error:', err);
  }
}
