import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { BESTIARY_DATA, DIARY_TEXTS, SHOP_PATTERNS } from '../data/chaptersData';
import { pickText, TranslationKeys } from '../i18n/translations';
import { DorsalPattern, GameSaveState, LanguageCode } from '../game/types';

interface JournalModalProps {
  t: TranslationKeys;
  lang: LanguageCode;
  saveState: GameSaveState;
  onBuyPattern: (pattern: DorsalPattern, cost: number) => void;
  onBuyStickyFeet: (cost: number) => void;
  onClose: () => void;
}

type TabId = 'diary' | 'bestiary' | 'shop' | 'droplets' | 'legs';

export const JournalModal: React.FC<JournalModalProps> = ({
  t,
  lang,
  saveState,
  onBuyPattern,
  onBuyStickyFeet,
  onClose,
}) => {
  const [tab, setTab] = useState<TabId>('diary');
  const [countedLegs, setCountedLegs] = useState<number[]>([]);

  const toggleLeg = (idx: number) => {
    setCountedLegs((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const allLegsCounted = countedLegs.length >= saveState.legsCount;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'diary', label: t.diaryTitle },
    { id: 'bestiary', label: t.bestiaryTitle },
    { id: 'shop', label: t.dustShopTitle },
    { id: 'droplets', label: t.dropletsTitle },
    { id: 'legs', label: t.countLegsTitle },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.diaryTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0d1914] border border-emerald-200/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-200/15">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl font-bold text-emerald-50">{t.abilityDiary}</h2>
            <span className="text-xs text-emerald-300/80 font-mono-num">
              {t.dayLabel} {saveState.dayCount} · {t.dustLabel}: {saveState.dustCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#162820] hover:bg-[#1f372d] text-emerald-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-emerald-200/10 overflow-x-auto">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                tab === tb.id
                  ? 'bg-emerald-500 text-[#07130e]'
                  : 'bg-[#13231c] text-emerald-100/80 hover:text-emerald-50 hover:bg-[#1b3127]'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto quest-scroll space-y-4">
          {tab === 'diary' && (
            <div className="space-y-3">
              {saveState.diary.map((entry) => {
                const def = DIARY_TEXTS[entry.titleKey];
                const title = def ? pickText(lang, def.title) : `${t.dayLabel} ${entry.day}`;
                const body = def ? pickText(lang, def.text) : entry.customDetail ?? '';
                return (
                  <article
                    key={entry.id}
                    className="p-4 rounded-xl bg-[#12221b] border border-emerald-200/10"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-display text-base font-semibold text-emerald-100">
                        {title}
                      </h3>
                      <span className="text-xs font-mono-num text-emerald-300/75">
                        {t.dayLabel} {entry.day}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-100/80 leading-relaxed">{body}</p>
                    {entry.customDetail && def && (
                      <p className="text-xs text-sky-300/90 mt-2">{entry.customDetail}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {tab === 'bestiary' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BESTIARY_DATA.map((b) => {
                const unlocked = saveState.unlockedBestiary.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border ${
                      unlocked
                        ? 'bg-[#12221b] border-emerald-200/15'
                        : 'bg-[#0a130f] border-emerald-200/5 opacity-60'
                    }`}
                  >
                    <h3 className="font-display text-base font-semibold text-emerald-50 mb-1.5">
                      {unlocked ? pickText(lang, b.name) : '???'}
                    </h3>
                    {unlocked ? (
                      <>
                        <p className="text-xs text-emerald-100/80 leading-relaxed mb-2">
                          {pickText(lang, b.fact)}
                        </p>
                        <p className="text-xs text-amber-200/85 italic">
                          {pickText(lang, b.joke)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-emerald-200/50">
                        {lang === 'ru'
                          ? 'Встретьте это существо в путешествии.'
                          : 'Meet this creature along the journey.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'shop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#12221b] border border-emerald-200/15 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-emerald-50 text-sm">
                    {lang === 'ru' ? 'Клейкие коготки (Ускорение +12%)' : 'Sticky Claws (+12% Grip Speed)'}
                  </h3>
                  <p className="text-xs text-emerald-200/70">
                    {lang === 'ru'
                      ? 'Обмен у Улитки Умо за пылинки мира.'
                      : 'Traded from Snail Umo for collected World Dust.'}
                  </p>
                </div>
                {saveState.stickyFeetUpgrade ? (
                  <span className="text-xs font-semibold text-emerald-300">{t.owned}</span>
                ) : (
                  <button
                    type="button"
                    disabled={saveState.dustCount < 2}
                    onClick={() => onBuyStickyFeet(2)}
                    className="h-9 px-4 rounded-lg bg-amber-400 disabled:bg-[#1a2c24] disabled:text-emerald-200/40 text-[#181002] text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    {t.buy} (2)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHOP_PATTERNS.map((pat) => {
                  const owned = saveState.unlockedPatterns.includes(pat.id);
                  const active = saveState.activePattern === pat.id;
                  return (
                    <div
                      key={pat.id}
                      className="p-4 rounded-xl bg-[#12221b] border border-emerald-200/15 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full shrink-0 border border-white/25"
                          style={{ backgroundColor: pat.swatch }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-emerald-50">
                            {pickText(lang, pat.name)}
                          </div>
                          <div className="text-xs text-emerald-200/70">
                            {pickText(lang, pat.desc)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!owned && saveState.dustCount < pat.cost}
                        onClick={() => onBuyPattern(pat.id, pat.cost)}
                        className={`h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-emerald-500 text-[#07130e]'
                            : owned
                              ? 'bg-[#1a3328] text-emerald-100'
                              : 'bg-amber-400 disabled:bg-[#1a2c24] disabled:text-emerald-200/40 text-[#181002]'
                        }`}
                      >
                        {active ? t.equipped : owned ? t.equip : `${pat.cost}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'droplets' && (
            <div className="space-y-2.5">
              {saveState.namedDroplets.length === 0 ? (
                <p className="text-sm text-emerald-200/70">
                  {lang === 'ru'
                    ? 'Вы ещё не давали имён каплям. Подберите каплю в мире, чтобы назвать её.'
                    : 'No droplets named yet. Approach a water drop in the world to name it.'}
                </p>
              ) : (
                saveState.namedDroplets.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#12221b] border border-emerald-200/10"
                  >
                    <span className="font-semibold text-sky-200">{d.name}</span>
                    <span className="text-xs font-mono-num text-emerald-300/75">
                      Ch. {d.chapter}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'legs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-100/85">{t.countLegsPrompt}</p>
                <button
                  type="button"
                  onClick={() => setCountedLegs([])}
                  className="text-xs text-emerald-300 hover:underline cursor-pointer"
                >
                  {t.resetDefaults}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((legNum) => {
                  const missing = legNum === 3 && saveState.legsCount < 8;
                  const checked = countedLegs.includes(legNum);
                  return (
                    <button
                      key={legNum}
                      type="button"
                      disabled={missing}
                      onClick={() => toggleLeg(legNum)}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                        missing
                          ? 'bg-[#1a1412] border-amber-500/30 text-amber-300/60 cursor-not-allowed'
                          : checked
                            ? 'bg-emerald-500 border-emerald-300 text-[#07130e] font-bold'
                            : 'bg-[#13231c] border-emerald-200/20 text-emerald-100 hover:bg-[#1b3127]'
                      }`}
                    >
                      <span className="font-mono-num text-base font-bold">
                        {missing ? '—' : legNum}
                      </span>
                      <span className="text-[11px]">
                        {missing ? (lang === 'ru' ? 'Растёт' : 'Growing') : checked ? <Check className="w-4 h-4" /> : '🐾'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {allLegsCounted && (
                <p className="text-sm font-semibold text-emerald-300 text-center pt-2">
                  {t.countLegsDone} ({saveState.legsCount}/8)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
