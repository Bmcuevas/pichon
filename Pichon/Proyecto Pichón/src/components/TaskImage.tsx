import React, { useState } from 'react';
import imageMap from '../data/subcategory-images.json';
import { ImageOff } from 'lucide-react';

interface TaskImageProps {
  subcategoryId?: string;
  categoryId?: string;
  alt: string;
  className?: string;
  /** 'cover' fills the container; 'banner' is a fixed-height strip */
  variant?: 'cover' | 'banner';
}

const map = imageMap as Record<string, string>;

export const TaskImage: React.FC<TaskImageProps> = ({
  subcategoryId,
  categoryId,
  alt,
  className = '',
  variant = 'banner',
}) => {
  const [failed, setFailed] = useState(false);

  const src = (subcategoryId && map[subcategoryId])
    ?? (categoryId && map[categoryId])
    ?? null;

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${variant === 'banner' ? 'h-36' : 'w-full h-full'} ${className}`}>
        <ImageOff size={28} />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${variant === 'banner' ? 'h-36' : 'w-full h-full'} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
};
