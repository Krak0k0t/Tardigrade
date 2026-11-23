import React, { useEffect, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import {
  getActionLabel,
  getDifficultyLabel,
  getGraphicsLabel,
  LANGUAGES,
  TranslationKeys,
} from '../i18n/translations';
import {
  ACTION_ORDER,
  DEFAULT_KEY_BINDINGS,
  eventToBindingCode,
  formatBindingCode,
  rebindAction,
} from '../game/inputConfig';
import {
  ActionId,
  DifficultyLevel,
  GameSettings,
  GraphicsQuality,
  LanguageCode,
} from '../game/types';

interface SettingsModalProps {
  t: TranslationKeys;
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  t,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [listeningAction, setListeningAction] = useState<ActionId | null>(null);

  useEffect(() => {
    if (!listeningAction) return;

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = eventToBindingCode(e);
      if (code) {
        onUpdateSettings({
          ...settings,
          bindings: rebindAction(settings.bindings, listeningAction, code),
        });
        setListeningAction(null);
      }
    };

    const handleMouse = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = `Mouse${e.button}`;
      onUpdateSettings({
        ...settings,
        bindings: rebindAction(settings.bindings, listeningAction, code),
      });
      setListeningAction(null);
    };

    const handleCtx = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('mousedown', handleMouse, true);
    window.addEventListener('contextmenu', handleCtx, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('mousedown', handleMouse, true);
      window.removeEventListener('contextmenu', handleCtx, true);
    };
  }, [listeningAction, settings, onUpdateSettings]);

  const graphicsLevels: GraphicsQuality[] = ['low', 'balanced', 'high', 'cinematic'];
  const difficultyLevels: DifficultyLevel[] = ['zen', 'standard', 'barrel'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.settings}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#0d1914] border border-emerald-200/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-200/15">
          <h2 className="font-display text-xl font-bold text-emerald-50">{t.settings}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#162820] hover:bg-[#1f372d] text-emerald-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto quest-scroll">
          {/* Language (16 languages) */}
          <div>
            <label htmlFor="settings-lang" className="block text-sm font-semibold text-emerald-100 mb-2">
              {t.language}
            </label>
            <select
              id="settings-lang"
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({ ...settings, language: e.target.value as LanguageCode })
              }
              className="w-full h-11 px-3 rounded-xl bg-[#13231c] border border-emerald-200/20 text-sm text-emerald-50 cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#0d1914] text-emerald-50">
                  {l.nativeName} ({l.englishName})
                </option>
              ))}
            </select>
          </div>

          {/* 4 Graphics Quality Tiers */}
          <div>
            <span className="block text-sm font-semibold text-emerald-100 mb-2">
              {t.graphicsQuality}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {graphicsLevels.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, graphics: q })}
                  className={`h-11 px-3 rounded-xl text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.graphics === q
                      ? 'bg-emerald-500 text-[#07130e] border-emerald-400 font-semibold'
                      : 'bg-[#13231c] text-emerald-100 border-emerald-200/15 hover:bg-[#1b3127]'
                  }`}
                >
                  {getGraphicsLabel(t, q)}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Difficulty Tiers */}
          <div>
            <span className="block text-sm font-semibold text-emerald-100 mb-2">
              {t.difficulty}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {difficultyLevels.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, difficulty: d })}
                  className={`h-11 px-3 rounded-xl text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.difficulty === d
                      ? 'bg-emerald-500 text-[#07130e] border-emerald-400 font-semibold'
                      : 'bg-[#13231c] text-emerald-100 border-emerald-200/15 hover:bg-[#1b3127]'
                  }`}
                >
                  {getDifficultyLabel(t, d)}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volumes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="music-vol" className="flex justify-between text-sm font-medium text-emerald-100 mb-1.5">
                <span>{t.musicVolume}</span>
                <span className="font-mono-num text-emerald-300">{Math.round(settings.musicVolume * 100)}%</span>
              </label>
              <input
                id="music-vol"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, musicVolume: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="sfx-vol" className="flex justify-between text-sm font-medium text-emerald-100 mb-1.5">
                <span>{t.sfxVolume}</span>
                <span className="font-mono-num text-emerald-300">{Math.round(settings.sfxVolume * 100)}%</span>
              </label>
              <input
                id="sfx-vol"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sfxVolume: Number(e.target.value) })
                }
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Touch Controls Mode */}
          <div>
            <span className="block text-sm font-semibold text-emerald-100 mb-2">
              {t.touchControls}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'always', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, touchControlsMode: mode })}
                  className={`h-11 px-3 rounded-xl text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.touchControlsMode === mode
                      ? 'bg-emerald-500 text-[#07130e] border-emerald-400 font-semibold'
                      : 'bg-[#13231c] text-emerald-100 border-emerald-200/15 hover:bg-[#1b3127]'
                  }`}
                >
                  {mode === 'auto' ? t.touchAuto : mode === 'always' ? t.touchAlways : t.touchOff}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard & Mouse Rebinding */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-emerald-100">{t.keybindings}</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, bindings: { ...DEFAULT_KEY_BINDINGS } })
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetDefaults}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTION_ORDER.map((act) => {
                const isListening = listeningAction === act;
                return (
                  <div
                    key={act}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#13231c] border border-emerald-200/10"
                  >
                    <span className="text-xs sm:text-sm text-emerald-100 truncate">
                      {getActionLabel(t, act)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setListeningAction(act)}
                      className={`min-w-[96px] h-9 px-2.5 rounded-lg font-mono-num text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        isListening
                          ? 'bg-amber-400 text-[#121008] border-amber-300'
                          : 'bg-[#0b1511] text-emerald-200 border-emerald-200/20 hover:border-emerald-300/50'
                      }`}
                    >
                      {isListening ? t.pressAnyKeyOrMouse : formatBindingCode(settings.bindings[act])}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-emerald-200/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07130e] font-semibold text-sm cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
