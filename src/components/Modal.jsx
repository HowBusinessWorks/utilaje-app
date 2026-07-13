import React, { useEffect } from 'react';
import { IconClose } from './icons';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`relative flex max-h-[95vh] w-full flex-col rounded-t-2xl bg-white shadow-pop animate-sheet-up dark:bg-ink-900 sm:max-h-[94vh] sm:rounded-2xl ${sizeClass}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink-200/80 px-5 py-3 dark:border-ink-800">
          <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            aria-label="Inchide"
          >
            <IconClose size={18} />
          </button>
        </div>
        <div className="scroll-area flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
