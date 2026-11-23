import React from 'react';
import { Volume2, VolumeX, SlidersHorizontal, Play, RotateCcw } from 'lucide-react';
import { LANGUAGES, TranslationKeys } from '../i18n/translations';
import { GameSaveState, GameSettings, LanguageCode } from '../game/types';
import { audioEngine } from '../game/audioEngine';
import { FullscreenButton } from './FullscreenButton';

interface TitleScreenProps {
  t: TranslationKeys;
  settings: GameSettings;
  saveState: GameSaveState;
  hasExistingSave: boolean;
  isTransitioning: boolean;
  onStartNew: (mode?: 'normal' | 'bubble' | 'barrel') => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  t,
  settings,
  saveState,
  hasExistingSave,
  isTransitioning,
  onStartNew,
  onContinue,
  onOpenSettings,
  onChangeLanguage,
  onToggleMute,
}) => {
  const handleHover = () => audioEngine.playMenuHover();

  return (
    <div
      className={`fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 sm:p-8 lg:p-12 transition-opacity duration-700 ease-out ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top Row: Compact Language & Utility Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className={isTransitioning ? 'pointer-events-none' : 'pointer-events-auto flex items-center gap-2'}>
          <label htmlFor="title-lang-select" className="sr-only">
            {t.language}
          </label>
          <select
            id="title-lang-select"
            value={settings.language}
            onMouseEnter={handleHover}
            onChange={(e) => {
              audioEngine.playMenuClick('moss');
              onChangeLanguage(e.target.value as LanguageCode);
            }}
            className="h-11 px-3 rounded-lg bg-[#081210]/90 border border-emerald-200/20 text-sm font-medium text-emerald-50 hover:border-cyan-300/60 hover:shadow-[0_0_18px_rgba(56,189,248,0.28)] transition-all duration-200 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#0d1914] text-emerald-50">
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        <div className={isTransitioning ? 'pointer-events-none flex items-center gap-2.5' : 'pointer-events-auto flex items-center gap-2.5'}>
          <button
            type="button"
            onMouseEnter={handleHover}
            onClick={(e) => {
              e.currentTarget.blur();
              audioEngine.playMenuClick('moss');
              onToggleMute();
            }}
            aria-label={settings.muted ? t.unmuteAudio : t.muteAudio}
            title={settings.muted ? t.unmuteAudio : t.muteAudio}
            tabIndex={-1}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#081210]/90 border border-emerald-200/20 text-emerald-100 hover:bg-[#142923] hover:border-cyan-300/55 hover:shadow-[0_0_16px_rgba(56,189,248,0.25)] transition-all duration-200 cursor-pointer"
          >
            {settings.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <FullscreenButton t={t} />
        </div>
      </div>

      {/* Left-Third Negative Space Title Lockup & Primary Actions (Right viewport stays open for interactive 3D Tikhon) */}
      <div
        className={`max-w-lg my-auto bg-[#07110f]/88 border border-emerald-200/18 rounded-2xl p-6 sm:p-8 shadow-2xl transition-transform duration-700 ${
          isTransitioning ? 'pointer-events-none -translate-x-4' : 'pointer-events-auto translate-x-0'
        }`}
      >
        {/* Custom Inline SVG Tardigrade Emblem */}
        <div className="flex items-center gap-4 mb-4">
          <svg
            viewBox="0 0 64 48"
            className="w-14 h-11 shrink-0"
            aria-hidden="true"
          >
            <ellipse cx="32" cy="24" rx="22" ry="13" fill="#d8bf9f" stroke="#5c4a32" strokeWidth="2" />
            <path d="M22 13 C24 20, 24 28, 22 35" stroke="#856e4e" strokeWidth="2" fill="none" />
            <path d="M34 11 C36 19, 36 29, 34 37" stroke="#856e4e" strokeWidth="2" fill="none" />
            <path d="M44 14 C46 20, 46 28, 44 34" stroke="#856e4e" strokeWidth="2" fill="none" />
            <circle cx="17" cy="21" r="2.6" fill="#121816" />
            <circle cx="16.2" cy="20.2" r="0.9" fill="#ffffff" />
            <circle cx="17" cy="27" r="2.6" fill="#121816" />
            <circle cx="16.2" cy="26.2" r="0.9" fill="#ffffff" />
            <ellipse cx="52" cy="11" rx="5" ry="4" fill="#67e8f9" opacity="0.9" />
            <circle cx="50.5" cy="9.5" r="1.3" fill="#ffffff" />
            <path d="M18 35 L16 42 M27 36 L26 43 M36 36 L35 43 M44 34 L45 41" stroke="#6f5a3f" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium tracking-wider text-cyan-200/85 tabular-nums">
            0.5 mm · {t.dayLabel} {saveState.dayCount}
          </span>
        </div>

        <h1
          className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-emerald-50 leading-[1.12] mb-3"
          style={{ textWrap: 'balance' }}
        >
          {t.gameTitle}
        </h1>
        <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed mb-6">
          {t.gameSubtitle}
        </p>

        {/* Primary CTA Stack with tactile hover glow & soft audio juice */}
        <div className="flex flex-col gap-3">
          {hasExistingSave ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-start="true"
                disabled={isTransitioning}
                onMouseEnter={handleHover}
                onClick={() => {
                  audioEngine.playMenuClick('droplet');
                  onContinue();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 border border-emerald-300/40 hover:border-emerald-200 text-[#081510] font-semibold text-base shadow-[0_4px_14px_rgba(16,185,129,0.22)] hover:shadow-[0_0_26px_rgba(52,211,153,0.52)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{t.continueJourney}</span>
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onMouseEnter={handleHover}
                onClick={() => {
                  audioEngine.playMenuClick('moss');
                  onStartNew('normal');
                }}
                className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-[#11241e] hover:bg-[#19352c] border border-emerald-200/20 hover:border-emerald-300/55 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:-translate-y-0.5 text-emerald-100 font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.newGame}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-start="true"
              disabled={isTransitioning}
              onMouseEnter={handleHover}
              onClick={() => {
                audioEngine.playMenuClick('droplet');
                onStartNew('normal');
              }}
              className="w-full inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 border border-emerald-300/40 hover:border-emerald-200 text-[#081510] font-semibold text-base shadow-[0_4px_14px_rgba(16,185,129,0.22)] hover:shadow-[0_0_26px_rgba(52,211,153,0.52)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{t.startJourney}</span>
            </button>
          )}

          {saveState.ngPlusUnlocked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isTransitioning}
                onMouseEnter={handleHover}
                onClick={() => {
                  audioEngine.playMenuClick('droplet');
                  onStartNew('bubble');
                }}
                className="h-11 px-4 rounded-xl bg-cyan-950/85 hover:bg-cyan-900/85 border border-cyan-300/30 hover:border-cyan-200/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:-translate-y-0.5 text-cyan-100 text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                {t.newGameBubble}
              </button>
              <button
                type="button"
                disabled={isTransitioning}
                onMouseEnter={handleHover}
                onClick={() => {
                  audioEngine.playMenuClick('moss');
                  onStartNew('barrel');
                }}
                className="h-11 px-4 rounded-xl bg-amber-950/85 hover:bg-amber-900/85 border border-amber-300/30 hover:border-amber-200/70 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:-translate-y-0.5 text-amber-100 text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                {t.newGameBarrel}
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isTransitioning}
            onMouseEnter={handleHover}
            onClick={() => {
              audioEngine.playMenuClick('moss');
              onOpenSettings();
            }}
            className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#0e1d19] hover:bg-[#172e27] border border-emerald-200/18 hover:border-emerald-300/50 hover:shadow-[0_0_18px_rgba(52,211,153,0.22)] transition-all duration-200 text-emerald-100 font-medium text-sm cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.settings}</span>
          </button>
        </div>
      </div>

      {/* Bottom Safe-Margin Flat Control Hint */}
      <div className="flex justify-center">
        <p className="text-xs sm:text-sm text-emerald-100/75 text-center bg-[#07110f]/80 px-4 py-1.5 rounded-lg border border-emerald-200/12">
          {t.controlHintBar}
        </p>
      </div>
    </div>
  );
};
