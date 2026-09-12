import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map<string, { x: number; y: number }>();

export default function RouteScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const saved = navigationType === 'POP' ? positions.get(location.key) : undefined;
    let restoring = true;
    let frame = 0;
    const record = () => {
      if (!restoring) positions.set(location.key, { x: window.scrollX, y: window.scrollY });
    };
    const restore = () => {
      // Catalogues fetch their products after mounting. Restoring before they
      // finish would clamp the saved position to the short loading screen.
      if (document.querySelector('[data-product-catalogue][aria-busy="true"]')) {
        frame = window.requestAnimationFrame(restore);
        return;
      }
      if (saved) {
        window.scrollTo({ left: saved.x, top: saved.y, behavior: 'instant' });
      } else {
        let targetId = location.hash.slice(1);
        try { targetId = decodeURIComponent(targetId); } catch { /* Keep malformed hashes literal. */ }
        const target = targetId ? document.getElementById(targetId) : null;
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      restoring = false;
      record();
    };
    const cancelRestore = () => {
      if (!restoring) return;
      window.cancelAnimationFrame(frame);
      restoring = false;
      record();
    };
    window.addEventListener('scroll', record, { passive: true });
    window.addEventListener('wheel', cancelRestore, { passive: true });
    window.addEventListener('touchstart', cancelRestore, { passive: true });
    frame = window.requestAnimationFrame(restore);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', record);
      window.removeEventListener('wheel', cancelRestore);
      window.removeEventListener('touchstart', cancelRestore);
    };
  }, [location.key, location.hash, navigationType]);

  return null;
}
