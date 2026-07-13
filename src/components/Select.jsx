import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconSelect, IconCheck } from './icons';

// Fully-coded dropdown — keyboard accessible, portalled so it never clips inside
// scrolling containers or modals. Drop-in replacement for a native <select>.
//
// Props:
//   value      current value (string)
//   onChange   (value) => void   — receives the value directly, not an event
//   options    [{ value, label }] | string[]
//   placeholder  shown when nothing is selected
//   size       'sm' | 'md'
//   disabled
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Selecteaza',
  size = 'md',
  disabled = false,
  className = '',
  id,
}) {
  const norm = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = norm.find(o => String(o.value) === String(value));

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const place = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = (e) => {
      if (listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = norm.findIndex(o => String(o.value) === String(value));
      setActive(idx);
    }
  }, [open]); // eslint-disable-line

  const commit = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, norm.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(norm.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (norm[active]) commit(norm[active]);
    }
  };

  useEffect(() => {
    if (open && active >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${active}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const sizeCls = size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-[38px] px-3 text-sm';

  return (
    <>
      <button
        type="button"
        id={id}
        ref={btnRef}
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex w-full items-center justify-between gap-2 rounded-lg border bg-white text-left
          transition-colors dark:bg-ink-900
          ${open ? 'border-brand-500 ring-4 ring-brand-500/15' : 'border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${sizeCls} ${className}`}
      >
        <span className={`truncate ${selected ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400 dark:text-ink-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconSelect
          size={size === 'sm' ? 14 : 16}
          weight="bold"
          className="shrink-0 text-ink-400 group-hover:text-ink-500 dark:text-ink-500"
        />
      </button>

      {open && rect && createPortal(
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="scroll-area fixed z-[60] max-h-72 overflow-y-auto rounded-xl border border-ink-200 bg-white p-1.5
            shadow-pop animate-pop-in dark:border-ink-700 dark:bg-ink-900"
          style={{
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
          }}
        >
          {norm.length === 0 && (
            <div className="px-3 py-2 text-sm text-ink-400">Fara optiuni</div>
          )}
          {norm.map((opt, i) => {
            const isSel = String(opt.value) === String(value);
            const isActive = i === active;
            return (
              <div
                key={opt.value ?? i}
                data-idx={i}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(opt)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm
                  ${isActive ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200' : 'text-ink-700 dark:text-ink-200'}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSel && <IconCheck size={15} weight="bold" className="shrink-0 text-brand-600 dark:text-brand-400" />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
