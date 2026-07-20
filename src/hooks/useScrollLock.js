import { useEffect } from 'react';

// Blocheaza scroll-ul paginii (body + containerul principal .scroll-area) cat timp
// un panou/modal fixed e deschis. Fara asta, iOS Safari scroleaza containerul din
// spate cand utilizatorul face swipe pe panou (arata scrollbar si "mananca" primul tap).
export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;

    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const scrollEl = document.querySelector('main.scroll-area');
    let prevOverflow, prevOverscroll, prevTouchAction;
    if (scrollEl) {
      prevOverflow = scrollEl.style.overflow;
      prevOverscroll = scrollEl.style.overscrollBehavior;
      prevTouchAction = scrollEl.style.touchAction;
      scrollEl.style.overflow = 'hidden';
      scrollEl.style.overscrollBehavior = 'none';
      scrollEl.style.touchAction = 'none';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (scrollEl) {
        scrollEl.style.overflow = prevOverflow;
        scrollEl.style.overscrollBehavior = prevOverscroll;
        scrollEl.style.touchAction = prevTouchAction;
      }
    };
  }, [active]);
}
