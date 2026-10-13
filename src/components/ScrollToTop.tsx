import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the scroll position of the main page and any active layout content containers.
 * Does NOT reset sidebar, modals, dropdowns, or table scroll containers.
 */
export function resetScrollToTop(hash?: string) {
  if (hash) {
    const id = hash.replace(/^#/, '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView();
      return;
    }
  }

  // 1. Reset window and document scroll
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
  }

  // 2. Reset primary content scroll containers (e.g. DashboardLayout main content)
  const mainContainers = document.querySelectorAll<HTMLElement>(
    '#main-scroll-container, [data-main-scroll="true"], main.overflow-auto, main > .overflow-auto'
  );

  mainContainers.forEach((container) => {
    // Exclude sidebars and tables
    if (!container.closest('aside') && !container.classList.contains('overflow-x-auto')) {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      container.scrollTop = 0;
      container.scrollLeft = 0;
    }
  });
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    prevPathnameRef.current = pathname;

    // Handle hash links (e.g., #inventory)
    if (hash) {
      const id = hash.replace(/^#/, '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView();
        return;
      }
      const rafId = requestAnimationFrame(() => {
        const delayedEl = document.getElementById(id);
        if (delayedEl) {
          delayedEl.scrollIntoView();
        } else {
          resetScrollToTop();
        }
      });
      return () => cancelAnimationFrame(rafId);
    }

    // Reset scroll positions immediately
    resetScrollToTop();

    // Additional frame check to ensure any dynamic/deferred rendering starts at top
    const rafId = requestAnimationFrame(() => {
      resetScrollToTop();
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname, hash]);

  // Handle clicking navigation links that point to the current page
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.origin);
        if (targetUrl.origin === window.location.origin && targetUrl.pathname === window.location.pathname && !targetUrl.hash) {
          resetScrollToTop();
        }
      } catch {
        // Ignore URL parsing errors
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return null;
}
