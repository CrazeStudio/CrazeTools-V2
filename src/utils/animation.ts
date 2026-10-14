import { animate } from 'animejs';

/**
 * Utility functions wrapping Anime.js v4 for React components
 */
export function animateFadeIn(
  target: Element | null | (Element | null)[],
  options: { y?: number; duration?: number; delay?: number } = {}
) {
  if (!target) return;
  const elements = Array.isArray(target) ? target.filter(Boolean) : [target];
  if (elements.length === 0) return;

  const { y = 12, duration = 300, delay = 0 } = options;
  try {
    animate(elements as Element[], {
      opacity: [0, 1],
      y: [y, 0],
      duration,
      delay,
      ease: 'outQuad',
    });
  } catch (err) {
    console.warn('Anime.js fadeIn failed:', err);
  }
}

export function animateScaleIn(
  target: Element | null | (Element | null)[],
  options: { duration?: number } = {}
) {
  if (!target) return;
  const elements = Array.isArray(target) ? target.filter(Boolean) : [target];
  if (elements.length === 0) return;

  const { duration = 280 } = options;
  try {
    animate(elements as Element[], {
      scale: [0.95, 1],
      opacity: [0, 1],
      duration,
      ease: 'outQuad',
    });
  } catch (err) {
    console.warn('Anime.js scaleIn failed:', err);
  }
}

export function animateRotate(
  target: Element | null,
  angle: number = 180,
  duration: number = 300
) {
  if (!target) return;
  try {
    animate(target, {
      rotate: [0, angle],
      duration,
      ease: 'outQuad',
    });
  } catch (err) {
    console.warn('Anime.js rotate failed:', err);
  }
}
