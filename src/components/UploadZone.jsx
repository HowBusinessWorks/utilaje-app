import React, { useRef } from 'react';
import { IconClip } from './icons';

export default function UploadZone({ onUpload, accept = "image/*", label = "Adauga poze", multiple = true }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => onUpload(file));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => onUpload(file));
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className="group cursor-pointer rounded-xl border-2 border-dashed border-ink-200 p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-ink-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleFileChange} />
      <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-400 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600 dark:bg-ink-800 dark:group-hover:bg-brand-500/15">
        <IconClip size={20} />
      </span>
      <p className="text-sm font-medium text-ink-600 dark:text-ink-300">{label}</p>
      <p className="mt-0.5 text-xs text-ink-400">Click sau trage fisierele aici</p>
    </div>
  );
}
