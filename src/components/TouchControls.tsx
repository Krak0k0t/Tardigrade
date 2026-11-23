import React, { useRef, useState } from 'react';
import { TranslationKeys } from '../i18n/translations';

interface TouchControlsProps {
  t: TranslationKeys;
  isTun: boolean;
  isJelly: boolean;
  canInteract: boolean;
  onStickMove: (x: number, y: number) => void;
  onJump: () => void;
  onTun: () => void;
  onJelly: () => void;
  onSense: () => void;
  onInteract: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  t,
  isTun,
  isJelly,
  canInteract,
  onStickMove,
  onJump,
  onTun,
  onJelly,
  onSense,
  onInteract,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointer = useRef<number | null>(null);

  const updateStick = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnob({ x: dx, y: dy });
    onStickMove(dx / maxR, dy / maxR);
  };

  const resetStick = () => {
    activePointer.current = null;
    setKnob({ x: 0, y: 0 });
    onStickMove(0, 0);
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 pointer-events-none flex items-end justify-between px-4 sm:px-6">
      {/* Virtual Thumbstick */}
      <div
        ref={padRef}
        onPointerDown={(e) => {
          activePointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointer.current === e.pointerId) {
            updateStick(e.clientX, e.clientY);
          }
        }}
        onPointerUp={resetStick}
        onPointerCancel={resetStick}
        aria-label="Movement stick"
        className="pointer-events-auto relative w-28 h-28 rounded-full bg-[#0d1914]/80 border border-emerald-200/25 flex items-center justify-center touch-none"
      >
        <div
          className="w-11 h-11 rounded-full bg-emerald-400/85 border border-emerald-100 shadow-lg"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      {/* Tactile Action Cluster (>=44px tap targets) */}
      <div className="pointer-events-auto grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onSense}
          className="min-w-[56px] h-12 px-3 rounded-xl bg-[#0d1914]/90 border border-sky-300/35 text-sky-100 text-xs font-semibold active:scale-95 transition-transform cursor-pointer"
        >
          {t.abilitySense}
        </button>
        <button
          type="button"
          onClick={onJelly}
          className={`min-w-[56px] h-12 px-3 rounded-xl border text-xs font-semibold active:scale-95 transition-transform cursor-pointer ${
            isJelly
              ? 'bg-teal-400 text-[#041410] border-teal-200'
              : 'bg-[#0d1914]/90 border-teal-300/35 text-teal-100'
          }`}
        >
          {t.abilityJelly}
        </button>
        <button
          type="button"
          onClick={onTun}
          className={`min-w-[56px] h-12 px-3 rounded-xl border text-xs font-semibold active:scale-95 transition-transform cursor-pointer ${
            isTun
              ? 'bg-amber-400 text-[#181002] border-amber-200'
              : 'bg-[#0d1914]/90 border-amber-300/35 text-amber-100'
          }`}
        >
          {t.abilityTun}
        </button>
        <button
          type="button"
          onClick={canInteract ? onInteract : onJump}
          className={`min-w-[64px] h-12 px-3 rounded-xl font-bold text-xs active:scale-95 transition-transform cursor-pointer ${
            canInteract
              ? 'bg-emerald-400 text-[#05140c] border border-emerald-200'
              : 'bg-emerald-500 text-[#05140c] border border-emerald-300'
          }`}
        >
          {canInteract ? t.abilityInteract : t.abilityJump}
        </button>
      </div>
    </div>
  );
};
