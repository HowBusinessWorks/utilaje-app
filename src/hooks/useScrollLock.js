import { useEffect } from 'react';

// Blocheaza scroll-ul paginii (body + containerul principal .scroll-area) cat timp
// un panou/modal fixed e deschis. Fara asta, iOS Safari scroleaza containerul din
// spate cand utilizatorul face swipe pe panou (arata scrollbar si "mananca" primul tap).
//
// Contorizam lock-urile (ref-count) ca sa mergem corect si cand doua modale sunt
// deschise simultan (ex. formularul + dialogul de confirmare). Altfel, al doilea lock
// captura valoarea "hidden" deja setata de primul si la inchidere pagina ramanea blocata.
let lockCount = 0;
let saved = null;

function applyLock() {
  if (lockCount === 0) {
    const scrollEl = document.querySelector('main.scroll-area');
    saved = {
      bodyOverflow: document.body.style.overflow,
      scrollEl,
      overflow: scrollEl?.style.overflow,
      overscroll: scrollEl?.style.overscrollBehavior,
      touchAction: scrollEl?.style.touchAction,
    };
    document.body.style.overflow = 'hidden';
    if (scrollEl) {
      scrollEl.style.overflow = 'hidden';
      scrollEl.style.overscrollBehavior = 'none';
      scrollEl.style.touchAction = 'none';
    }
  }
  lockCount++;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && saved) {
    document.body.style.overflow = saved.bodyOverflow;
    const { scrollEl } = saved;
    if (scrollEl) {
      scrollEl.style.overflow = saved.overflow;
      scrollEl.style.overscrollBehavior = saved.overscroll;
      scrollEl.style.touchAction = saved.touchAction;
    }
    saved = null;
  }
}

export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    applyLock();
    return releaseLock;
  }, [active]);
}
