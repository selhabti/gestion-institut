// Path: src/components/LazyImage.tsx
import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [src, onLoad, onError]);

  if (hasError) {
    return (
      <div
        className={`${className} bg-slate-200 flex items-center justify-center rounded-lg`}
      >
        <Users className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          {placeholder || (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${className} transition-all duration-300 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
      />
    </div>
  );
};
export default LazyImage;
