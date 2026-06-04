import React, { useRef } from 'react';

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
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleFileChange} />
      <p className="text-2xl mb-1">📎</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click sau trage fisierele aici</p>
    </div>
  );
}
