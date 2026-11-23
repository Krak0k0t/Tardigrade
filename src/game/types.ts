export type LanguageCode =
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'zh'
  | 'ar'
  | 'uk'
  | 'ru'
  | 'ja'
  | 'pl'
  | 'it'
  | 'vi'
  | 'fa'
  | 'elv'
  | 'orc';

export type GraphicsQuality = 'low' | 'balanced' | 'high' | 'cinematic';

export type DifficultyLevel = 'zen' | 'standard' | 'barrel';

export type PlayableCharacter = 'tikhon' | 'bubble';

export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6;

export type WeatherCondition = 'calm' | 'wind' | 'rain' | 'heat' | 'mist';

export type ActionId =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'tun'
  | 'jelly'
  | 'waterSense'
  | 'interact'
  | 'diary'
  | 'pause';

export type KeyBindings = Record<ActionId, string>;

export type DorsalPattern = 'none' | 'moss_stripes' | 'dew_spots' | 'golden_amber' | 'starlight';

export interface DiaryEntry {
  id: string;
  day: number;
  chapter: ChapterId;
  titleKey: string;
  textKey: string;
  customDetail?: string;
  timestamp: number;
}

export interface NamedDroplet {
  id: string;
  name: string;
  chapter: ChapterId;
  type: 'droplet' | 'dust';
}

export interface ChapterPuzzleState {
  // Ch 1: Dry Stream (0..3 stones placed/channel dug)
  ch1ChannelsDug: number;
  ch1BubbleTalked: boolean;
  ch1RecipeFound: boolean;
  // Ch 2: Gutter & Siphon
  ch2CapillaryFibers: number; // 0..3
  ch2LucyGuided: boolean;
  ch2RapidsCrossed: boolean;
  // Ch 3: Puddle Metropolis
  ch3DeliveriesDone: number; // 0..3
  ch3DaphniaCalmed: number; // 0..3
  ch3NoonWarningShown: boolean;
  // Ch 4: Baron the Dog
  ch4ScentMarksPlaced: number; // 0..3
  ch4FleasDiplomacy: boolean;
  ch4BathChoice: 'none' | 'clung' | 'barrel_dive';
  ch4LegLost: boolean;
  // Ch 5: Under-Fridge Desert
  ch5CondenserTrapBuilt: boolean;
  ch5PatienceProgress: number; // 0..1 (stay still for Semyon)
  ch5PatienceDone: boolean;
  ch5GoshaStoriesTold: number; // 0..2
  // Ch 6: Greenhouse Finale
  ch6PipeReached: boolean;
  ch6CapillaryLadderBuilt: boolean;
  ch6ClogCleared: boolean;
  ch6ElderAwakened: boolean;
  ch6LucyArrived: boolean;
}

export interface GameSettings {
  language: LanguageCode;
  graphics: GraphicsQuality;
  difficulty: DifficultyLevel;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  touchControlsMode: 'auto' | 'always' | 'off';
  bindings: KeyBindings;
}

export interface GameSaveState {
  version: number;
  chapter: ChapterId;
  dayCount: number;
  character: PlayableCharacter;
  barrelChallenge: boolean;
  ngPlusUnlocked: boolean;
  moisture: number; // 0..100
  chewingEnergy: number; // 0..100
  legsCount: number; // 8 normally, 7 during Ch4 after bite until Ch5 regeneration
  dustCount: number;
  collectedDustIds: string[];
  unlockedPatterns: DorsalPattern[];
  activePattern: DorsalPattern;
  stickyFeetUpgrade: boolean;
  unlockedBestiary: string[];
  diary: DiaryEntry[];
  namedDroplets: NamedDroplet[];
  puzzles: ChapterPuzzleState;
  badDaysCount: number;
  lucySaved: boolean;
  completedGame: boolean;
}

export interface DialogueChoice {
  labelKey: string;
  fallbackLabel?: string;
  action: () => void;
}

export interface ActiveDialogue {
  speakerKey: string;
  speakerColor: string;
  textKey: string;
  fallbackText?: string;
  choices?: {
    id: string;
    labelKey: string;
  }[];
  canNameEntity?: {
    id: string;
    type: 'droplet' | 'dust';
  };
}

export interface HudSnapshot {
  moisture: number;
  chewingEnergy: number;
  isTun: boolean;
  isJelly: boolean;
  waterSenseActive: boolean;
  nearestWaterAngle: number | null;
  nearestWaterDist: number | null;
  weather: WeatherCondition;
  legsCount: number;
  nearbyPrompt: {
    id: string;
    labelKey: string;
    kind: 'npc' | 'puzzle' | 'droplet' | 'dust' | 'algae' | 'exit' | 'shop';
  } | null;
  patienceActive: boolean;
  patienceProgress: number;
  isMoving: boolean;
  chapterProgress: number; // 0..1
}
