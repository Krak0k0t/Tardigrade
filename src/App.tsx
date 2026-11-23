import { useCallback, useEffect, useRef, useState } from 'react';
import { SceneEngine } from './game/SceneEngine';
import { DEFAULT_KEY_BINDINGS } from './game/inputConfig';
import {
  advanceToNextChapter,
  applyBadDayRecovery,
  createInitialSaveState,
  isChapterExitReady,
  purchasePattern,
  purchaseStickyFeet,
} from './game/gameLogic';
import { audioEngine } from './game/audioEngine';
import { WorldInteractable } from './game/biomes';
import { getT, isRtlLanguage } from './i18n/translations';
import {
  ActiveDialogue,
  ChapterId,
  DorsalPattern,
  GameSaveState,
  GameScreenState,
  GameSettings,
  HudSnapshot,
  LanguageCode,
} from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { SettingsModal } from './components/SettingsModal';
import { GameHUD } from './components/GameHUD';
import { JournalModal } from './components/JournalModal';
import { PauseVictoryModal } from './components/PauseVictoryModal';

const SETTINGS_KEY = 'tardigrade_settings_v1';
const SAVE_KEY = 'tardigrade_save_v1';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'en', // Initial interface MUST be English
  graphics: 'high',
  difficulty: 'standard',
  musicVolume: 0.45,
  sfxVolume: 0.65,
  muted: false,
  touchControlsMode: 'auto',
  bindings: { ...DEFAULT_KEY_BINDINGS },
};

function loadInitialSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      bindings: { ...DEFAULT_KEY_BINDINGS, ...(parsed.bindings ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadInitialSave(): { save: GameSaveState; exists: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: createInitialSaveState(), exists: false };
    const parsed = JSON.parse(raw) as GameSaveState;
    if (!parsed || typeof parsed.chapter !== 'number') {
      return { save: createInitialSaveState(), exists: false };
    }
    return { save: parsed, exists: true };
  } catch {
    return { save: createInitialSaveState(), exists: false };
  }
}

export default function App() {
  const initialSaveBundle = useRef(loadInitialSave());
  const [settings, setSettings] = useState<GameSettings>(loadInitialSettings);
  const [saveState, setSaveState] = useState<GameSaveState>(initialSaveBundle.current.save);
  const [hasExistingSave, setHasExistingSave] = useState<boolean>(initialSaveBundle.current.exists);

  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [screenState, setScreenState] = useState<GameScreenState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [isMenuTransitioning, setIsMenuTransitioning] = useState(false);
  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [hud, setHud] = useState<HudSnapshot>({
    moisture: saveState.moisture,
    chewingEnergy: saveState.chewingEnergy,
    isTun: false,
    isJelly: false,
    waterSenseActive: false,
    nearestWaterAngle: null,
    nearestWaterDist: null,
    weather: 'calm',
    legsCount: saveState.legsCount,
    nearbyPrompt: null,
    patienceActive: false,
    patienceProgress: 0,
    isMoving: false,
    chapterProgress: 0,
  });

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Refs so SceneEngine callbacks stay stable without tearing down WebGL
  const saveRef = useRef(saveState);
  saveRef.current = saveState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const screenRef = useRef(screenState);
  screenRef.current = screenState;
  const showJournalRef = useRef(showJournal);
  showJournalRef.current = showJournal;
  const showSettingsRef = useRef(showSettings);
  showSettingsRef.current = showSettings;
  const dialogueRef = useRef(dialogue);
  dialogueRef.current = dialogue;

  const t = getT(settings.language);
  const lang = settings.language;

  const pushToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(null), 4200);
  }, []);

  // Persist settings & apply RTL
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }
    document.documentElement.dir = isRtlLanguage(settings.language) ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
    audioEngine.setVolumes(settings.musicVolume, settings.sfxVolume, settings.muted);
  }, [settings]);

  // Persist save state
  const commitSave = useCallback((updater: (prev: GameSaveState) => GameSaveState) => {
    setSaveState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(next));
        setHasExistingSave(true);
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  // Mirror state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  // Detect coarse pointer / narrow screen for touch controls
  useEffect(() => {
    const checkTouch = () => {
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      setIsTouchDevice(coarse || window.innerWidth < 820);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Interaction handler for 3D world anchors
  const handleInteract = useCallback(
    (item: WorldInteractable) => {
      const s = saveRef.current;
      const isRu = settingsRef.current.language === 'ru' || settingsRef.current.language === 'uk';

      if (item.kind === 'droplet') {
        audioEngine.playDroplet();
        engineRef.current?.markCollected(item.id);
        commitSave((prev) => ({
          ...prev,
          moisture: Math.min(100, prev.moisture + 34),
        }));
        setDialogue({
          speakerKey: isRu ? 'Капля росы' : 'Morning Droplet',
          speakerColor: '#7dd3fc',
          textKey: item.id,
          fallbackText: isRu
            ? 'Прохладная прозрачная капля! Вы можете дать ей имя, и Тихон запомнит его в дневнике.'
            : 'Cool, shimmering water (+34% Moisture). You may give this droplet a name for your mental diary.',
          canNameEntity: { id: item.id, type: 'droplet' },
        });
        return;
      }

      if (item.kind === 'algae') {
        audioEngine.playDroplet();
        engineRef.current?.markCollected(item.id);
        commitSave((prev) => ({
          ...prev,
          chewingEnergy: Math.min(100, prev.chewingEnergy + 40),
        }));
        pushToast(isRu ? '+40% Жевательной энергии водорослей!' : '+40% Algae Fuel chewed!');
        return;
      }

      if (item.kind === 'dust') {
        audioEngine.playPuzzleChime();
        engineRef.current?.markCollected(item.id);
        commitSave((prev) => ({
          ...prev,
          dustCount: prev.dustCount + 1,
          collectedDustIds: prev.collectedDustIds.includes(item.id)
            ? prev.collectedDustIds
            : [...prev.collectedDustIds, item.id],
        }));
        pushToast(isRu ? '+1 Пылинка мира для Улитки Умо!' : '+1 World Dust collected for Snail Umo!');
        return;
      }

      if (item.kind === 'shop') {
        setShowJournal(true);
        return;
      }

      if (item.kind === 'exit') {
        if (isChapterExitReady(s)) {
          audioEngine.playPuzzleChime();
          const next = advanceToNextChapter(s);
          commitSave(() => next);
          if (next.completedGame) {
            setScreenState('gameover');
          } else {
            pushToast(
              isRu
                ? `Глава ${next.chapter} началась! Дневник сохранён.`
                : `Chapter ${next.chapter} begins! Diary auto-saved.`
            );
          }
        } else {
          pushToast(
            isRu
              ? 'Сначала завершите основные дела в этом биоме (см. цель вверху слева).'
              : 'Complete the chapter tasks first (see top-left objective).'
          );
        }
        return;
      }

      // Puzzle nodes
      if (item.kind === 'puzzle') {
        audioEngine.playPuzzleChime();
        if (item.puzzleTag === 'ch1_channel') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            moisture: Math.min(100, prev.moisture + 15),
            puzzles: { ...prev.puzzles, ch1ChannelsDug: prev.puzzles.ch1ChannelsDug + 1 },
          }));
          pushToast(isRu ? 'Канавка во мху прорыта! Вода потекла дальше.' : 'Moss channel dug! Dew flows toward the dry root.');
        } else if (item.puzzleTag === 'ch1_recipe') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch1RecipeFound: true },
          }));
          setDialogue({
            speakerKey: isRu ? 'Записка стариков' : 'Elders’ Recipe Note',
            speakerColor: '#fbbf24',
            textKey: 'recipe',
            fallbackText: isRu
              ? '«На дальнем берегу есть Оранжерея. Там всегда лето, и вода падает трижды в день по расписанию».'
              : '“Across the yard stands the Glass Greenhouse. Perpetual summer—and mist falls three times a day on schedule.”',
          });
        } else if (item.puzzleTag === 'ch2_fiber') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch2CapillaryFibers: prev.puzzles.ch2CapillaryFibers + 1 },
          }));
          pushToast(isRu ? 'Капиллярный мостик укреплён! Вода поднимается сама.' : 'Capillary fiber woven! Water climbs upward by itself.');
        } else if (item.puzzleTag === 'ch3_delivery') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            dustCount: prev.dustCount + 1,
            puzzles: { ...prev.puzzles, ch3DeliveriesDone: prev.puzzles.ch3DeliveriesDone + 1 },
          }));
          pushToast(isRu ? 'Посылка «Экспресс-Ресничка» доставлена! (+1 пыль)' : 'Cilia-Express spore message delivered! (+1 Dust)');
        } else if (item.puzzleTag === 'ch3_calm_daphnia') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch3DaphniaCalmed: prev.puzzles.ch3DaphniaCalmed + 1 },
          }));
          pushToast(isRu ? 'Часть дафний свернулась в спокойные бочки до дождя.' : 'Some daphnia curled calmly into Tuns until the next rain.');
        } else if (item.puzzleTag === 'ch4_scent') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch4ScentMarksPlaced: prev.puzzles.ch4ScentMarksPlaced + 1 },
          }));
          pushToast(isRu ? 'Пахучая отметка карты поставлена в шерсти Барона!' : 'Scent-map waypoint marked in Baron’s swaying fur!');
        } else if (item.puzzleTag === 'ch5_trap') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            moisture: 100,
            puzzles: { ...prev.puzzles, ch5CondenserTrapBuilt: true },
          }));
          pushToast(isRu ? 'Ловушка для капли конденсата готова! Влага 100%.' : 'Fridge condenser drip trap built! Moisture restored.');
        } else if (item.puzzleTag === 'ch6_pipe') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch6PipeReached: true },
          }));
          pushToast(isRu ? 'Выбрались на трубку увлажнителя!' : 'Reached the greenhouse humidifier nozzle!');
        } else if (item.puzzleTag === 'ch6_ladder') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch6CapillaryLadderBuilt: true },
          }));
          pushToast(isRu ? 'Капиллярная лестница из веточек сплетена!' : 'Capillary ladder woven along the inclined pipe!');
        } else if (item.puzzleTag === 'ch6_clog') {
          engineRef.current?.markCollected(item.id);
          commitSave((prev) => ({
            ...prev,
            puzzles: {
              ...prev.puzzles,
              ch6ClogCleared: true,
              ch6LucyArrived: prev.lucySaved,
            },
          }));
          setDialogue({
            speakerKey: isRu ? 'Увлажнитель оранжереи' : 'Greenhouse Humidifier',
            speakerColor: '#34d399',
            textKey: 'clog',
            fallbackText: s.lucySaved
              ? isRu
                ? 'Засор выбит ударом в бочке! Капля Люся из 2-й главы принесла живительную влагу в самый нужный миг!'
                : 'The giant dust clog rolled free! Droplet Lucy from Chapter 2 arrived right in time with cool mist!'
              : isRu
                ? 'Пылевой засор размером с Тихон сдвинулся с места! Трубка снова свободна.'
                : 'The Tikhon-sized dust clog tumbled loose! The humidifier tube breathes again.',
          });
        }
        return;
      }

      // NPC dialogues
      if (item.kind === 'npc') {
        audioEngine.playPuzzleChime();
        if (item.npcKind === 'bubble') {
          commitSave((prev) => ({
            ...prev,
            unlockedBestiary: prev.unlockedBestiary.includes('rotifer_bubble')
              ? prev.unlockedBestiary
              : [...prev.unlockedBestiary, 'rotifer_bubble'],
            puzzles: { ...prev.puzzles, ch1BubbleTalked: true },
          }));
          setDialogue({
            speakerKey: isRu ? 'Пузырь (Коловратка)' : 'Bubble the Rotifer',
            speakerColor: '#67e8f9',
            textKey: 'bubble',
            fallbackText: isRu
              ? 'О, Тихон! Ты пропустила Великий Потоп прошлого вторника — волна была три миллиметра высотой, а в ней плыли семь сосновых иголок... или двенадцать! Рассказать ещё раз?'
              : 'Ah, Tikhon! You missed the Great Flood last Tuesday—three whole millimeters tall, carrying seven pine needles... or was it twelve purple acorns? Want the other version?',
          });
        } else if (item.npcKind === 'lucy') {
          commitSave((prev) => ({
            ...prev,
            lucySaved: true,
            puzzles: { ...prev.puzzles, ch2LucyGuided: true },
          }));
          engineRef.current?.markCollected(item.id);
          setDialogue({
            speakerKey: isRu ? 'Капля Люся' : 'Lucy the Nervous Droplet',
            speakerColor: '#bae6fd',
            textKey: 'lucy',
            fallbackText: isRu
              ? 'Ой, солнце такое яркое, я вот-вот испарюсь! Спасибо, что проводила меня в тень листа. Я запомню доброту и выручу тебя в теплице!'
              : 'Oh, the sun is terrifyingly bright! Thank you for guiding me under the leaf shade. I will remember this if you ever reach the Greenhouse!',
          });
        } else if (item.npcKind === 'dunya') {
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch3DaphniaCalmed: prev.puzzles.ch3DaphniaCalmed + 1 },
          }));
          engineRef.current?.markCollected(item.id);
          setDialogue({
            speakerKey: isRu ? 'Дафния Дуня' : 'Dunya the Frantic Daphnia',
            speakerColor: '#fde68a',
            textKey: 'dunya',
            fallbackText: isRu
              ? 'Полдень близко, лужа тает! Но ты говоришь — можно свернуться в бочку и просто подождать следующий дождь? Хм... в этом есть странный покой.'
              : 'Noon is coming, the puddle is shrinking! Wait—you say we can curl into stillness and wait for the next rain? That sounds... oddly comforting.',
          });
        } else if (item.npcKind === 'fleas') {
          setDialogue({
            speakerKey: isRu ? 'Блохи-разбойники' : 'Baron’s Flea Collective',
            speakerColor: '#fb923c',
            textKey: 'fleas',
            fallbackText: isRu
              ? 'Стой, восьмилапая! Это наш шерстяной переулок! Но если покажешь свой мирный закон — может, и договоримся.'
              : 'Halt, eight-legs! This fur-alley is ours—unless you offer a treaty we can respect!',
            choices: [
              {
                id: 'flea_treaty',
                labelKey: isRu
                  ? '«Укусил лапку — извинись и отросшую погладь!»'
                  : '“Bite one leg, apologize & pet it when it grows back!”',
              },
            ],
          });
        } else if (item.npcKind === 'gosha' && s.chapter === 4) {
          setDialogue({
            speakerKey: isRu ? 'Рачок Гоша' : 'Gosha the Swimmer',
            speakerColor: '#f59e0b',
            textKey: 'gosha4',
            fallbackText: isRu
              ? 'Барон лезет в таз с лавандовой водой! Огромный пластиковый океан! Как будешь спасаться, Тихон?'
              : 'Baron is stepping into the lavender bath basin! A giant plastic ocean! How will you cross?',
            choices: [
              {
                id: 'bath_cling',
                labelKey: isRu ? 'Держаться за шерсть (потерять 3-ю лапку)' : 'Cling to fur (lose 3rd leg bravely)',
              },
              {
                id: 'bath_barrel',
                labelKey: isRu ? 'Прыгнуть в бочке в лавандовую воду' : 'Dive in Tun barrel into lavender waves',
              },
            ],
          });
        } else if (item.npcKind === 'semyon') {
          setDialogue({
            speakerKey: isRu ? 'Клещ Семён' : 'Semyon the Dust Mite',
            speakerColor: '#d6d3d1',
            textKey: 'semyon',
            fallbackText: s.puzzles.ch5PatienceDone
              ? isRu
                ? 'Видишь? Когда не спешишь, пыль сама складывается в дорогу. Иди к Гоше Второму.'
                : 'See? When you stop rushing, even dust arranges itself into a path.'
              : isRu
                ? 'Все бегут... А ты просто постой рядом со мной 6 секунд и вообще не шевелись. Тогда мир заговорит.'
                : 'Everyone rushes. Stand beside me for 6 calm seconds without moving a single claw, and the desert will speak.',
          });
        } else if (item.npcKind === 'gosha' && s.chapter === 5) {
          setDialogue({
            speakerKey: isRu ? 'Таракан Гоша Второй' : 'Cockroach Gosha II',
            speakerColor: '#d97706',
            textKey: 'gosha5',
            fallbackText: isRu
              ? 'Не спрашивай, тот ли я Гоша из таза. Тариф через кухонную магистраль — пара хороших историй из прошлых глав!'
              : 'Don’t ask if I’m the same Gosha from the lavender basin. My toll across the kitchen highway is two good travel stories!',
            choices: [
              {
                id: 'story_moss',
                labelKey: isRu ? 'Рассказать про Пузыря и Потоп' : 'Tell Bubble’s Flood story',
              },
              {
                id: 'story_baron',
                labelKey: isRu ? 'Рассказать про шерсть Барона' : 'Tell Baron’s Fur Continent story',
              },
            ],
          });
        } else if (item.npcKind === 'elder') {
          commitSave((prev) => ({
            ...prev,
            puzzles: { ...prev.puzzles, ch6ElderAwakened: true },
          }));
          setDialogue({
            speakerKey: isRu ? 'Старейшина Тихон-старшая' : 'Elder Tikhon',
            speakerColor: '#a3e635',
            textKey: 'elder',
            fallbackText: isRu
              ? 'Ох, тёплая капля... Ты тоже Тихон? Всех нас так называют! Запомни главное: дом — это не место, где вода. Дом — это место, откуда уходишь и куда возвращаешься.'
              : 'Ah, a drop of moisture... Wait, your name is Tikhon too? Almost all of us are! Remember: home is not where the water is—it is where you leave from and return to.',
          });
        }
      }
    },
    [commitSave, pushToast]
  );

  const handleBadDay = useCallback(() => {
    commitSave((prev) => applyBadDayRecovery(prev));
    pushToast(getT(settingsRef.current.language).badDayToast);
  }, [commitSave, pushToast]);

  const handlePatienceComplete = useCallback(() => {
    audioEngine.playPuzzleChime();
    commitSave((prev) => ({
      ...prev,
      puzzles: { ...prev.puzzles, ch5PatienceDone: true },
    }));
    pushToast(getT(settingsRef.current.language).patienceDonePrompt);
  }, [commitSave, pushToast]);

  const handleResourceSync = useCallback((moisture: number, chewingEnergy: number) => {
    saveRef.current.moisture = moisture;
    saveRef.current.chewingEnergy = chewingEnergy;
  }, []);

  // Mount Three.js engine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new SceneEngine(container, settingsRef.current, saveRef.current, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onInteract: (item) => handleInteract(item),
      onBadDay: () => handleBadDay(),
      onResourceSync: (m, e) => handleResourceSync(m, e),
      onPatienceComplete: () => handlePatienceComplete(),
      onOpenDiary: () => setShowJournal((v) => !v),
      onTogglePause: () => {
        if (showSettingsRef.current) {
          setShowSettings(false);
          return;
        }
        if (showJournalRef.current) {
          setShowJournal(false);
          return;
        }
        if (dialogueRef.current) {
          setDialogue(null);
          return;
        }
        setScreenState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleBadDay, handleInteract, handlePatienceComplete, handleResourceSync]);

  // Sync external state into SceneEngine without remounting
  useEffect(() => {
    engineRef.current?.syncExternalState(screenState, settings, saveState);
  }, [screenState, settings, saveState]);

  const runTransitionToPlay = useCallback(() => {
    if (isMenuTransitioning) return;
    if (engineRef.current) {
      setIsMenuTransitioning(true);
      engineRef.current.startMenuTransition(() => {
        setIsMenuTransitioning(false);
        setScreenState('playing');
      });
    } else {
      setScreenState('playing');
    }
  }, [isMenuTransitioning]);

  // Enter / Space on Title screen starts gameplay with smooth camera transition
  useEffect(() => {
    if (screenState !== 'title' || showSettings || isMenuTransitioning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        audioEngine.unlock();
        audioEngine.playMenuClick('droplet');
        runTransitionToPlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screenState, showSettings, isMenuTransitioning, runTransitionToPlay]);

  const startNewGame = (mode: 'normal' | 'bubble' | 'barrel' = 'normal') => {
    audioEngine.unlock();
    const fresh = createInitialSaveState({
      character: mode === 'bubble' ? 'bubble' : 'tikhon',
      barrelChallenge: mode === 'barrel',
      ngPlusUnlocked: saveState.ngPlusUnlocked,
    });
    commitSave(() => fresh);
    setDialogue(null);
    setShowJournal(false);
    if (screenState === 'title') {
      runTransitionToPlay();
    } else {
      setScreenState('playing');
    }
  };

  const continueGame = () => {
    audioEngine.unlock();
    setDialogue(null);
    runTransitionToPlay();
  };

  const handleDialogueChoice = (choiceId: string) => {
    const isRu = lang === 'ru' || lang === 'uk';
    audioEngine.playPuzzleChime();
    if (choiceId === 'flea_treaty') {
      commitSave((prev) => ({
        ...prev,
        puzzles: { ...prev.puzzles, ch4FleasDiplomacy: true },
      }));
      setDialogue(null);
      pushToast(isRu ? 'Договор с блохами заключён!' : 'Flea Collective Peace Treaty signed!');
    } else if (choiceId === 'bath_cling') {
      commitSave((prev) => ({
        ...prev,
        legsCount: 7,
        puzzles: { ...prev.puzzles, ch4BathChoice: 'clung', ch4LegLost: true },
      }));
      setDialogue(null);
      pushToast(
        isRu
          ? 'Удержались! Но 3-я лапка оторвалась — отрастёт в следующей главе.'
          : 'Clung tight! 3rd leg popped off—it will regenerate next chapter.'
      );
    } else if (choiceId === 'bath_barrel') {
      commitSave((prev) => ({
        ...prev,
        puzzles: { ...prev.puzzles, ch4BathChoice: 'barrel_dive' },
      }));
      setDialogue(null);
      pushToast(
        isRu
          ? 'Сплав в бочке по лавандовой волне удался!'
          : 'Splashed through lavender waves safely in Tun barrel!'
      );
    } else if (choiceId === 'story_moss' || choiceId === 'story_baron') {
      commitSave((prev) => ({
        ...prev,
        puzzles: {
          ...prev.puzzles,
          ch5GoshaStoriesTold: Math.min(2, prev.puzzles.ch5GoshaStoriesTold + 1),
        },
      }));
      setDialogue(null);
      pushToast(isRu ? 'Гоша Второй оценил историю!' : 'Gosha II loved that travel story!');
    }
  };

  const handleNameDroplet = (id: string, type: 'droplet' | 'dust', name: string) => {
    commitSave((prev) => ({
      ...prev,
      namedDroplets: [...prev.namedDroplets, { id, type, name, chapter: prev.chapter }],
      diary: [
        {
          id: `named_${id}_${Date.now()}`,
          day: prev.dayCount,
          chapter: prev.chapter,
          titleKey: 'named_custom',
          textKey: 'named_custom',
          customDetail:
            lang === 'ru'
              ? `Я дала капле имя «${name}». Она была весьма прохладной.`
              : `I named a passing droplet "${name}". It was remarkably refreshing.`,
          timestamp: Date.now(),
        },
        ...prev.diary,
      ],
    }));
    setDialogue(null);
    pushToast(lang === 'ru' ? `Капля названа: ${name}` : `Droplet named: ${name}`);
  };

  const showTouch =
    settings.touchControlsMode === 'always' ||
    (settings.touchControlsMode === 'auto' && isTouchDevice);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b1411]">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={canvasMountRef} data-testid="game-canvas" className="fixed inset-0 z-0" />

      {screenState === 'title' && (
        <TitleScreen
          t={t}
          settings={settings}
          saveState={saveState}
          hasExistingSave={hasExistingSave}
          isTransitioning={isMenuTransitioning}
          onStartNew={startNewGame}
          onContinue={continueGame}
          onOpenSettings={() => setShowSettings(true)}
          onChangeLanguage={(newLang: LanguageCode) =>
            setSettings((prev) => ({ ...prev, language: newLang }))
          }
          onToggleMute={() => setSettings((prev) => ({ ...prev, muted: !prev.muted }))}
        />
      )}

      {screenState === 'playing' && (
        <GameHUD
          t={t}
          settings={settings}
          saveState={saveState}
          hud={hud}
          dialogue={dialogue}
          toastText={toastText}
          chapterReadyBanner={isChapterExitReady(saveState)}
          showTouch={showTouch}
          onJump={() => engineRef.current?.triggerJump()}
          onTun={() => engineRef.current?.triggerTunToggle()}
          onJelly={() => engineRef.current?.triggerJellyToggle()}
          onSense={() => engineRef.current?.triggerWaterSense()}
          onInteract={() => engineRef.current?.triggerInteractNearest()}
          onOpenDiary={() => setShowJournal(true)}
          onToggleMute={() => setSettings((prev) => ({ ...prev, muted: !prev.muted }))}
          onOpenPause={() => setScreenState('paused')}
          onStickMove={(x, y) => engineRef.current?.setVirtualStick(x, y)}
          onDialogueChoice={handleDialogueChoice}
          onNameDroplet={handleNameDroplet}
          onCloseDialogue={() => setDialogue(null)}
          onProceedNextChapter={() => {
            const next = advanceToNextChapter(saveState);
            commitSave(() => next);
            if (next.completedGame) {
              setScreenState('gameover');
            }
          }}
        />
      )}

      {(screenState === 'paused' || screenState === 'gameover') && (
        <PauseVictoryModal
          mode={screenState}
          t={t}
          lang={lang}
          saveState={saveState}
          onResume={() => setScreenState('playing')}
          onOpenSettings={() => setShowSettings(true)}
          onSelectChapter={(ch: ChapterId) => {
            commitSave((prev) => ({ ...prev, chapter: ch }));
            setScreenState('playing');
          }}
          onReturnToMenu={() => {
            setDialogue(null);
            setShowJournal(false);
            setIsMenuTransitioning(false);
            setScreenState('title');
          }}
          onStartNgPlus={(mode) => startNewGame(mode)}
        />
      )}

      {showJournal && (
        <JournalModal
          t={t}
          lang={lang}
          saveState={saveState}
          onBuyPattern={(pat: DorsalPattern, cost: number) =>
            commitSave((prev) => purchasePattern(prev, pat, cost))
          }
          onBuyStickyFeet={(cost: number) => commitSave((prev) => purchaseStickyFeet(prev, cost))}
          onClose={() => setShowJournal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          t={t}
          settings={settings}
          onUpdateSettings={(next) => setSettings(next)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
