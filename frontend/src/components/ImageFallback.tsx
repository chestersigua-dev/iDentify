'use client';

import { useEffect } from 'react';

export const PLACEHOLDER_PHOTO = '/placeholder-photo.svg';

/**
 * Global safety net: any <img> that fails to load (broken URL, deleted file) or has
 * no usable src is swapped for a placeholder so pages never show broken-image icons.
 */
export function ImageFallback() {
  useEffect(() => {
    const swap = (img: HTMLImageElement) => {
      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = PLACEHOLDER_PHOTO;
      img.removeAttribute('srcset');
    };

    const isMissing = (img: HTMLImageElement) => {
      const src = img.getAttribute('src');
      return !src || src.trim() === '' || src === 'null' || src === 'undefined';
    };

    const check = (img: HTMLImageElement) => {
      if (isMissing(img) || (img.complete && img.naturalWidth === 0 && img.getAttribute('src'))) {
        swap(img);
      }
    };

    const onError = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLImageElement) swap(t);
    };
    // 'error' does not bubble, so listen in the capture phase.
    document.addEventListener('error', onError, true);

    document.querySelectorAll('img').forEach(check);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target instanceof HTMLImageElement) {
          if (isMissing(m.target)) swap(m.target);
        }
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) check(n);
          else if (n instanceof HTMLElement) n.querySelectorAll('img').forEach(check);
        });
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    return () => {
      document.removeEventListener('error', onError, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
