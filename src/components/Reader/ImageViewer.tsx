/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DocumentItem, ReaderTheme } from '../../types/document';

interface ImageViewerProps {
  document: DocumentItem;
  theme: ReaderTheme;
  zoom: number;
  rotation: number;
  onToggleDistractionFree: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  document: doc,
  theme,
  zoom,
  rotation,
  onToggleDistractionFree,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (!doc.fileBlob) return;
    const url = URL.createObjectURL(doc.fileBlob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [doc.fileBlob]);

  const getContainerBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf0d9]';
      case 'dark':
        return 'bg-stone-900';
      case 'amoled':
        return 'bg-black';
      case 'light':
      default:
        return 'bg-stone-100 dark:bg-stone-950';
    }
  };

  return (
    <div
      onClick={onToggleDistractionFree}
      className={`relative flex-1 flex items-center justify-center overflow-auto p-4 cursor-pointer select-none ${getContainerBg()}`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={doc.name}
          className="max-w-none transition-transform duration-150 rounded-xl shadow-2xl"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
        />
      )}
    </div>
  );
};
