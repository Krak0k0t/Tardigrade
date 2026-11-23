import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TranslationKeys } from '../i18n/translations';

interface FullscreenButtonProps {
  t: TranslationKeys;
  className?: string;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ t, className = '' }) => {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback safely when embedded in restricted sandboxes
      setIsFs((prev) => !prev);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFs ? t.exitFullscreen : t.fullscreen}
      title={isFs ? t.exitFullscreen : t.fullscreen}
      tabIndex={-1}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#0d1914]/90 border border-emerald-200/20 text-emerald-100 hover:bg-[#172b22] hover:border-emerald-300/45 transition-colors cursor-pointer shrink-0 ${className}`}
    >
      {isFs ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
    </button>
  );
};
