import React from 'react';
import { getChapterTitle, pickText, TranslationKeys } from '../i18n/translations';
import { DIARY_TEXTS } from '../data/chaptersData';
import { ChapterId, GameSaveState, LanguageCode } from '../game/types';
import { FullscreenButton } from './FullscreenButton';

interface PauseVictoryModalProps {
  mode: 'paused' | 'gameover';
  t: TranslationKeys;
  lang: LanguageCode;
  saveState: GameSaveState;
  onResume: () => void;
  onOpenSettings: () => void;
  onSelectChapter: (ch: ChapterId) => void;
  onReturnToMenu: () => void;
  onStartNgPlus: (mode: 'bubble' | 'barrel') => void;
}

export const PauseVictoryModal: React.FC<PauseVictoryModalProps> = ({
  mode,
  t,
  lang,
  saveState,
  onResume,
  onOpenSettings,
  onSelectChapter,
  onReturnToMenu,
  onStartNgPlus,
}) => {
  if (mode === 'gameover') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.finaleTitle}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      >
        <div className="w-full max-w-xl bg-[#0d1914] border border-emerald-300/25 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-emerald-50 mb-1.5">
                {t.finaleTitle}
              </h2>
              <p className="text-sm text-emerald-200/80">{t.finaleSubtitle}</p>
            </div>
            <FullscreenButton t={t} />
          </div>

          <div className="grid grid-cols-3 gap-3 py-3 border-y border-emerald-200/15 text-center">
            <div>
              <div className="text-xl font-bold font-mono-num text-emerald-300">
                {saveState.dayCount}
              </div>
              <div className="text-xs text-emerald-200/70">{t.dayLabel}</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono-num text-sky-300">
                {saveState.namedDroplets.length}
              </div>
              <div className="text-xs text-emerald-200/70">{t.dropletsTitle}</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono-num text-amber-300">
                {saveState.diary.length}
              </div>
              <div className="text-xs text-emerald-200/70">{t.abilityDiary}</div>
            </div>
          </div>

          {/* Slow Scrolling Diary Credits Preview */}
          <div className="max-h-40 overflow-y-auto quest-scroll space-y-2 pr-1">
            {saveState.diary.slice(0, 6).map((d) => {
              const def = DIARY_TEXTS[d.titleKey];
              return (
                <div key={d.id} className="text-xs text-emerald-100/80 bg-[#12221b] p-3 rounded-xl">
                  <span className="font-semibold text-emerald-300">{t.dayLabel} {d.day}: </span>
                  <span>{def ? pickText(lang, def.text) : d.customDetail}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={() => onStartNgPlus('bubble')}
              className="w-full h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#041418] font-semibold text-sm cursor-pointer"
            >
              {t.playAsBubble}
            </button>
            <button
              type="button"
              onClick={() => onStartNgPlus('barrel')}
              className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#181002] font-semibold text-sm cursor-pointer"
            >
              {t.playBarrelMode}
            </button>
            <button
              type="button"
              onClick={onReturnToMenu}
              className="w-full h-11 rounded-xl bg-[#152820] hover:bg-[#1e372d] border border-emerald-200/20 text-emerald-100 font-medium text-sm cursor-pointer"
            >
              {t.returnToMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.pausedTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
    >
      <div className="w-full max-w-md bg-[#0d1914] border border-emerald-200/20 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-emerald-50">{t.pausedTitle}</h2>
          <FullscreenButton t={t} />
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07130e] font-semibold text-sm cursor-pointer"
          >
            {t.resume}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full h-11 rounded-xl bg-[#13231c] hover:bg-[#1b3127] border border-emerald-200/15 text-emerald-100 font-medium text-sm cursor-pointer"
          >
            {t.settings}
          </button>
          <button
            type="button"
            onClick={onReturnToMenu}
            className="w-full h-11 rounded-xl bg-[#1a1816] hover:bg-[#292420] border border-amber-200/20 text-amber-100 font-medium text-sm cursor-pointer"
          >
            {t.returnToMenu}
          </button>
        </div>

        {/* Biome Switcher so player can explore any chapter freely */}
        <div className="pt-3 border-t border-emerald-200/10">
          <label htmlFor="pause-chapter-select" className="block text-xs font-semibold text-emerald-200/80 mb-2">
            {t.chapterSelect}
          </label>
          <select
            id="pause-chapter-select"
            value={saveState.chapter}
            onChange={(e) => onSelectChapter(Number(e.target.value) as ChapterId)}
            className="w-full h-10 px-3 rounded-xl bg-[#13231c] border border-emerald-200/20 text-xs sm:text-sm text-emerald-50 cursor-pointer"
          >
            {([1, 2, 3, 4, 5, 6] as ChapterId[]).map((ch) => (
              <option key={ch} value={ch} className="bg-[#0d1914] text-emerald-50">
                {getChapterTitle(t, ch)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
