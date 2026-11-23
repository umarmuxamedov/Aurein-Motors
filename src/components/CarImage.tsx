import { useState } from 'react';
import { Car as CarIcon } from 'lucide-react';

interface CarImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CarImage({ src, alt, className = '' }: CarImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 text-stone-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        <CarIcon className="w-10 h-10 mb-2 stroke-[1.35] text-stone-400" />
        <span className="text-xs font-medium text-stone-500 px-4 text-center truncate max-w-full">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
