import React, { useState } from 'react';
import { BookOpen, Pause, Volume2, VolumeX } from 'lucide-react';
import { CHAPTER_META } from '../data/chaptersData';
import { getChapterTitle, pickText, TranslationKeys } from '../i18n/translations';
import { formatBindingCode } from '../game/inputConfig';
import { ActiveDialogue, GameSaveState, GameSettings, HudSnapshot } from '../game/types';
import { FullscreenButton } from './FullscreenButton';
import { TouchControls } from './TouchControls';

interface GameHUDProps {
  t: TranslationKeys;
  settings: GameSettings;
  saveState: GameSaveState;
  hud: HudSnapshot;
  dialogue: ActiveDialogue | null;
  toastText: string | null;
  chapterReadyBanner: boolean;
  showTouch: boolean;
  onJump: () => void;
  onTun: () => void;
  onJelly: () => void;
  onSense: () => void;
  onInteract: () => void;
  onOpenDiary: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onStickMove: (x: number, y: number) => void;
  onDialogueChoice: (choiceId: string) => void;
  onNameDroplet: (id: string, type: 'droplet' | 'dust', name: string) => void;
  onCloseDialogue: () => void;
  onProceedNextChapter: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  t,
  settings,
  saveState,
  hud,
  dialogue,
  toastText,
  chapterReadyBanner,
  showTouch,
  onJump,
  onTun,
  onJelly,
  onSense,
  onInteract,
  onOpenDiary,
  onToggleMute,
  onOpenPause,
  onStickMove,
  onDialogueChoice,
  onNameDroplet,
  onCloseDialogue,
  onProceedNextChapter,
}) => {
  const [dropletNameInput, setDropletNameInput] = useState('');
  const lang = settings.language;
  const meta = CHAPTER_META[saveState.chapter];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* TOP PERIMETER BAR */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left: Moisture & Algae Fuel + Chapter Metadata */}
        <div className="pointer-events-auto min-w-0 flex-1 max-w-[215px] sm:max-w-sm bg-[#0b1511]/88 border border-emerald-200/15 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-emerald-200/80 mb-1.5 sm:mb-2 tabular-nums">
            <span className="font-semibold text-emerald-50 truncate">
              {getChapterTitle(t, saveState.chapter)}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="font-mono-num whitespace-nowrap shrink-0 hidden sm:inline">
              {t.dayLabel} {saveState.dayCount}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num whitespace-nowrap shrink-0">
              {hud.legsCount}/8
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Moisture Gauge */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] font-medium text-sky-200 mb-1">
                <span className="truncate">{t.moisture}</span>
                <span className="font-mono-num">{hud.moisture}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#10242c] overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.moisture / 100))})` }}
                />
              </div>
            </div>

            {/* Algae Chewing Fuel */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] font-medium text-emerald-200 mb-1">
                <span className="truncate">{t.chewingEnergy}</span>
                <span className="font-mono-num">{hud.chewingEnergy}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#10261b] overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.chewingEnergy / 100))})` }}
                />
              </div>
            </div>
          </div>

          <p className="hidden sm:block text-[11px] text-emerald-100/70 mt-2 leading-snug">
            {pickText(lang, meta.objectiveSummary)}
          </p>
        </div>

        {/* Top-Right: Utility Controls (Journal, Mute, Fullscreen, Pause/Menu) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenDiary();
            }}
            aria-label={t.abilityDiary}
            title={t.abilityDiary}
            tabIndex={-1}
            className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-11 sm:px-3 rounded-lg bg-[#0d1914]/90 border border-emerald-200/20 text-emerald-100 hover:bg-[#172b22] text-xs font-semibold cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t.abilityDiary}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={settings.muted ? t.unmuteAudio : t.muteAudio}
            title={settings.muted ? t.unmuteAudio : t.muteAudio}
            tabIndex={-1}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#0d1914]/90 border border-emerald-200/20 text-emerald-100 hover:bg-[#172b22] cursor-pointer"
          >
            {settings.muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <FullscreenButton
            t={t}
            className="!w-9 !h-9 sm:!w-11 sm:!h-11"
          />

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause();
            }}
            aria-label={t.pausedTitle}
            title={t.pausedTitle}
            tabIndex={-1}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#0d1914]/90 border border-emerald-200/20 text-emerald-100 hover:bg-[#172b22] cursor-pointer"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* CENTER-TOP TRANSIENT ALERTS (Active States / Bad Day / Patience / Exit Ready) */}
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        {hud.isTun && (
          <div className="bg-amber-950/90 border border-amber-300/40 text-amber-100 text-xs font-semibold px-4 py-1.5 rounded-lg">
            {t.tunActiveBadge}
          </div>
        )}
        {hud.isJelly && (
          <div className="bg-teal-950/90 border border-teal-300/40 text-teal-100 text-xs font-semibold px-4 py-1.5 rounded-lg">
            {t.jellyActiveBadge}
          </div>
        )}
        {hud.patienceActive && (
          <div className="bg-[#0d1914]/95 border border-stone-300/30 rounded-xl px-5 py-3 w-72 text-center">
            <div className="text-xs font-semibold text-stone-200 mb-2">{t.patienceHoldPrompt}</div>
            <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-amber-300 transition-transform duration-100 origin-left"
                style={{ transform: `scaleX(${Math.min(1, hud.patienceProgress)})` }}
              />
            </div>
          </div>
        )}
        {toastText && (
          <div className="bg-[#0d1914]/95 border border-emerald-300/35 text-emerald-100 text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-lg max-w-md text-center">
            {toastText}
          </div>
        )}
        {chapterReadyBanner && (
          <div className="pointer-events-auto bg-[#0c2118]/95 border border-emerald-400/50 rounded-xl px-5 py-3 flex items-center gap-4 shadow-xl">
            <span className="text-sm font-semibold text-emerald-100">{t.chapterCompleted}</span>
            <button
              type="button"
              onClick={onProceedNextChapter}
              className="h-9 px-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-[#06150e] text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              {t.proceedNextChapter}
            </button>
          </div>
        )}
      </div>

      {/* DIALOGUE OVERLAY (Free-paced reading) */}
      {dialogue && (
        <div className="pointer-events-auto self-center w-full max-w-xl bg-[#0d1914]/95 border border-emerald-200/25 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-bold" style={{ color: dialogue.speakerColor }}>
              {dialogue.speakerKey}
            </span>
            <button
              type="button"
              onClick={onCloseDialogue}
              className="text-xs text-emerald-200/70 hover:text-emerald-100 cursor-pointer"
            >
              {t.close}
            </button>
          </div>
          <p className="text-sm text-emerald-50/90 leading-relaxed">
            {dialogue.fallbackText ?? dialogue.textKey}
          </p>

          {dialogue.canNameEntity && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!dropletNameInput.trim()) return;
                onNameDroplet(
                  dialogue.canNameEntity!.id,
                  dialogue.canNameEntity!.type,
                  dropletNameInput.trim()
                );
                setDropletNameInput('');
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="text"
                value={dropletNameInput}
                onChange={(e) => setDropletNameInput(e.target.value)}
                placeholder={t.nameDropletPrompt}
                maxLength={24}
                className="flex-1 h-10 px-3 rounded-lg bg-[#13231c] border border-emerald-200/25 text-sm text-emerald-50"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-lg bg-sky-400 hover:bg-sky-300 text-[#041418] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {t.saveName}
              </button>
            </form>
          )}

          {dialogue.choices && dialogue.choices.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {dialogue.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onDialogueChoice(c.id)}
                  className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07130e] text-xs font-bold cursor-pointer"
                >
                  {c.labelKey}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOUCH CONTROLS WHEN MOBILE/TABLET */}
      {showTouch && !dialogue && (
        <TouchControls
          t={t}
          isTun={hud.isTun}
          isJelly={hud.isJelly}
          canInteract={Boolean(hud.nearbyPrompt)}
          onStickMove={onStickMove}
          onJump={onJump}
          onTun={onTun}
          onJelly={onJelly}
          onSense={onSense}
          onInteract={onInteract}
        />
      )}

      {/* BOTTOM ABILITY DOCK + CONTEXT INTERACT PROMPT */}
      <div className="flex flex-col items-center gap-2">
        {hud.nearbyPrompt && !dialogue && (
          <button
            type="button"
            onClick={onInteract}
            className="pointer-events-auto h-10 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#05140c] font-bold text-xs sm:text-sm shadow-lg cursor-pointer flex items-center gap-2"
          >
            <span className="font-mono-num px-1.5 py-0.5 rounded bg-black/15 text-[11px]">
              {formatBindingCode(settings.bindings.interact)}
            </span>
            <span>{hud.nearbyPrompt.labelKey}</span>
          </button>
        )}

        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 bg-[#0b1511]/90 border border-emerald-200/15 rounded-xl px-3 py-2 shadow-xl">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onJump();
            }}
            className="h-9 px-3 rounded-lg bg-[#14261f] hover:bg-[#1e372d] text-emerald-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <span className="font-mono-num text-emerald-300">
              {formatBindingCode(settings.bindings.jump)}
            </span>
            <span>{t.abilityJump}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTun();
            }}
            className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
              hud.isTun
                ? 'bg-amber-400 text-[#181002] font-bold'
                : 'bg-[#14261f] hover:bg-[#1e372d] text-emerald-100'
            }`}
          >
            <span className="font-mono-num opacity-80">
              {formatBindingCode(settings.bindings.tun)}
            </span>
            <span>{t.abilityTun}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onJelly();
            }}
            className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
              hud.isJelly
                ? 'bg-teal-400 text-[#041410] font-bold'
                : 'bg-[#14261f] hover:bg-[#1e372d] text-emerald-100'
            }`}
          >
            <span className="font-mono-num opacity-80">
              {formatBindingCode(settings.bindings.jelly)}
            </span>
            <span>{t.abilityJelly}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onSense();
            }}
            className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
              hud.waterSenseActive
                ? 'bg-sky-400 text-[#041418] font-bold'
                : 'bg-[#14261f] hover:bg-[#1e372d] text-emerald-100'
            }`}
          >
            <span className="font-mono-num opacity-80">
              {formatBindingCode(settings.bindings.waterSense)}
            </span>
            <span>{t.abilitySense}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
