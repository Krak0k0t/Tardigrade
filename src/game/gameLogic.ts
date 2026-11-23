import {
  ChapterId,
  ChapterPuzzleState,
  DifficultyLevel,
  DiaryEntry,
  DorsalPattern,
  GameSaveState,
  PlayableCharacter,
} from './types';

export function createInitialPuzzleState(): ChapterPuzzleState {
  return {
    ch1ChannelsDug: 0,
    ch1BubbleTalked: false,
    ch1RecipeFound: false,
    ch2CapillaryFibers: 0,
    ch2LucyGuided: false,
    ch2RapidsCrossed: false,
    ch3DeliveriesDone: 0,
    ch3DaphniaCalmed: 0,
    ch3NoonWarningShown: false,
    ch4ScentMarksPlaced: 0,
    ch4FleasDiplomacy: false,
    ch4BathChoice: 'none',
    ch4LegLost: false,
    ch5CondenserTrapBuilt: false,
    ch5PatienceProgress: 0,
    ch5PatienceDone: false,
    ch5GoshaStoriesTold: 0,
    ch6PipeReached: false,
    ch6CapillaryLadderBuilt: false,
    ch6ClogCleared: false,
    ch6ElderAwakened: false,
    ch6LucyArrived: false,
  };
}

export function createInitialSaveState(options?: {
  character?: PlayableCharacter;
  barrelChallenge?: boolean;
  ngPlusUnlocked?: boolean;
}): GameSaveState {
  const character = options?.character ?? 'tikhon';
  const barrelChallenge = options?.barrelChallenge ?? false;
  return {
    version: 1,
    chapter: 1,
    dayCount: 412,
    character,
    barrelChallenge,
    ngPlusUnlocked: options?.ngPlusUnlocked ?? false,
    moisture: 88,
    chewingEnergy: 65,
    legsCount: 8,
    dustCount: 0,
    collectedDustIds: [],
    unlockedPatterns: ['none'],
    activePattern: 'none',
    stickyFeetUpgrade: false,
    unlockedBestiary: ['tardigrade', 'moss'],
    diary: [
      {
        id: 'entry_start_412',
        day: 412,
        chapter: 1,
        titleKey: 'diary_wake_title',
        textKey: 'diary_wake_text',
        timestamp: Date.now(),
      },
    ],
    namedDroplets: [],
    puzzles: createInitialPuzzleState(),
    badDaysCount: 0,
    lucySaved: false,
    completedGame: false,
  };
}

export interface MovementModifiers {
  speedMultiplier: number;
  moistureDrainRate: number;
  chewingDrainRate: number;
}

export function computeModifiers(params: {
  difficulty: DifficultyLevel;
  character: PlayableCharacter;
  isTun: boolean;
  isJelly: boolean;
  legsCount: number;
  stickyFeetUpgrade: boolean;
  chapter: ChapterId;
}): MovementModifiers {
  const { difficulty, character, isTun, isJelly, legsCount, stickyFeetUpgrade, chapter } = params;

  let diffDrain = 1.0;
  if (difficulty === 'zen') diffDrain = 0.35;
  else if (difficulty === 'barrel') diffDrain = 1.35;

  // Under-fridge desert (Ch 5) is drier
  const biomeDryness = chapter === 5 ? 1.45 : chapter === 3 ? 1.15 : chapter === 6 ? 0.75 : 1.0;

  // Bubble the rotifer moves faster but drinks twice as much water
  const charSpeed = character === 'bubble' ? 1.38 : 1.0;
  const charDrain = character === 'bubble' ? 2.0 : 1.0;

  // Missing a leg makes Tikhon walk slightly slower & funnier
  const legPenalty = legsCount < 8 ? 0.84 : 1.0;
  const stickyBonus = stickyFeetUpgrade ? 1.12 : 1.0;

  if (isTun) {
    // In Tun barrel: moisture freeze! Time stops for metabolism.
    return {
      speedMultiplier: 0.72 * charSpeed,
      moistureDrainRate: 0,
      chewingDrainRate: 0,
    };
  }

  return {
    speedMultiplier: charSpeed * legPenalty * stickyBonus,
    moistureDrainRate: 0.9 * diffDrain * biomeDryness * charDrain,
    chewingDrainRate: isJelly ? 7.5 : 0,
  };
}

export interface StepResourcesResult {
  moisture: number;
  chewingEnergy: number;
  triggeredBadDay: boolean;
  jellyDepleted: boolean;
}

export function stepResources(
  moisture: number,
  chewingEnergy: number,
  dt: number,
  mods: MovementModifiers,
  isJelly: boolean
): StepResourcesResult {
  let nextMoisture = moisture - mods.moistureDrainRate * dt;
  let nextEnergy = chewingEnergy - mods.chewingDrainRate * dt;
  let triggeredBadDay = false;
  let jellyDepleted = false;

  if (isJelly && nextEnergy <= 0) {
    nextEnergy = 0;
    jellyDepleted = true;
  }

  if (nextMoisture <= 0) {
    nextMoisture = 0;
    triggeredBadDay = true;
  }

  return {
    moisture: Math.min(100, Math.max(0, nextMoisture)),
    chewingEnergy: Math.min(100, Math.max(0, nextEnergy)),
    triggeredBadDay,
    jellyDepleted,
  };
}

/**
 * Philosophy rule: Tikhon can never die. If moisture hits 0,
 * she enters Tun dormancy ("Bad Day") and wakes up days later when moisture returns.
 */
export function applyBadDayRecovery(state: GameSaveState): GameSaveState {
  const newDay = state.dayCount + 21; // Sleeps three weeks
  const newEntry: DiaryEntry = {
    id: `entry_badday_${newDay}_${state.badDaysCount + 1}`,
    day: newDay,
    chapter: state.chapter,
    titleKey: 'diary_badday_title',
    textKey: 'diary_badday_text',
    timestamp: Date.now(),
  };
  return {
    ...state,
    dayCount: newDay,
    moisture: 68,
    badDaysCount: state.badDaysCount + 1,
    diary: [newEntry, ...state.diary],
  };
}

export function isChapterExitReady(state: GameSaveState): boolean {
  const p = state.puzzles;
  switch (state.chapter) {
    case 1:
      return p.ch1ChannelsDug >= 3 && p.ch1RecipeFound;
    case 2:
      return p.ch2CapillaryFibers >= 3;
    case 3:
      return p.ch3DeliveriesDone >= 3 && p.ch3DaphniaCalmed >= 2;
    case 4:
      return p.ch4ScentMarksPlaced >= 3 && p.ch4FleasDiplomacy && p.ch4BathChoice !== 'none';
    case 5:
      return p.ch5CondenserTrapBuilt && p.ch5PatienceDone && p.ch5GoshaStoriesTold >= 2;
    case 6:
      return p.ch6ClogCleared && p.ch6ElderAwakened;
    default:
      return false;
  }
}

export function getChapterProgressRatio(state: GameSaveState): number {
  const p = state.puzzles;
  switch (state.chapter) {
    case 1: {
      const steps =
        (p.ch1BubbleTalked ? 1 : 0) +
        Math.min(3, p.ch1ChannelsDug) +
        (p.ch1RecipeFound ? 1 : 0);
      return steps / 5;
    }
    case 2: {
      const steps =
        Math.min(3, p.ch2CapillaryFibers) + (p.ch2LucyGuided ? 1 : 0);
      return steps / 4;
    }
    case 3: {
      const steps =
        Math.min(3, p.ch3DeliveriesDone) + Math.min(2, p.ch3DaphniaCalmed);
      return steps / 5;
    }
    case 4: {
      const steps =
        Math.min(3, p.ch4ScentMarksPlaced) +
        (p.ch4FleasDiplomacy ? 1 : 0) +
        (p.ch4BathChoice !== 'none' ? 1 : 0);
      return steps / 5;
    }
    case 5: {
      const steps =
        (p.ch5CondenserTrapBuilt ? 1 : 0) +
        (p.ch5PatienceDone ? 1 : 0) +
        Math.min(2, p.ch5GoshaStoriesTold);
      return steps / 4;
    }
    case 6: {
      const steps =
        (p.ch6PipeReached ? 1 : 0) +
        (p.ch6CapillaryLadderBuilt ? 1 : 0) +
        (p.ch6ClogCleared ? 1 : 0) +
        (p.ch6ElderAwakened ? 1 : 0);
      return steps / 4;
    }
  }
}

export function advanceToNextChapter(state: GameSaveState): GameSaveState {
  if (state.chapter >= 6) {
    return {
      ...state,
      completedGame: true,
      ngPlusUnlocked: true,
      dayCount: 561,
      diary: [
        {
          id: 'entry_finale_561',
          day: 561,
          chapter: 6,
          titleKey: 'diary_finale_title',
          textKey: 'diary_finale_text',
          timestamp: Date.now(),
        },
        ...state.diary,
      ],
    };
  }

  const nextChapter = (state.chapter + 1) as ChapterId;
  const dayDeltas: Record<ChapterId, number> = {
    1: 412,
    2: 415,
    3: 419,
    4: 438,
    5: 498,
    6: 540,
  };
  const nextDay = dayDeltas[nextChapter];

  // Leg regeneration rule: Lost in Ch4 (7 legs), grows back in Ch5/Ch6!
  const regeneratedLegs =
    nextChapter >= 5 && state.legsCount < 8 ? 8 : state.legsCount;

  const entry: DiaryEntry = {
    id: `entry_ch${nextChapter}_${nextDay}`,
    day: nextDay,
    chapter: nextChapter,
    titleKey: `diary_ch${nextChapter}_title`,
    textKey: `diary_ch${nextChapter}_text`,
    timestamp: Date.now(),
  };

  const newBestiary = [...state.unlockedBestiary];
  if (nextChapter === 2 && !newBestiary.includes('snail_umo')) newBestiary.push('snail_umo');
  if (nextChapter === 3 && !newBestiary.includes('daphnia')) newBestiary.push('daphnia');
  if (nextChapter === 4 && !newBestiary.includes('flea')) newBestiary.push('flea');
  if (nextChapter === 5 && !newBestiary.includes('mite_semyon')) newBestiary.push('mite_semyon');
  if (nextChapter === 6 && !newBestiary.includes('elder_tikhon')) newBestiary.push('elder_tikhon');

  return {
    ...state,
    chapter: nextChapter,
    dayCount: nextDay,
    moisture: Math.max(state.moisture, 75),
    legsCount: regeneratedLegs,
    unlockedBestiary: newBestiary,
    diary: [entry, ...state.diary],
  };
}

export function purchasePattern(
  state: GameSaveState,
  pattern: DorsalPattern,
  cost: number
): GameSaveState {
  if (state.unlockedPatterns.includes(pattern)) {
    return { ...state, activePattern: pattern };
  }
  if (state.dustCount < cost) return state;
  return {
    ...state,
    dustCount: state.dustCount - cost,
    unlockedPatterns: [...state.unlockedPatterns, pattern],
    activePattern: pattern,
  };
}

export function purchaseStickyFeet(state: GameSaveState, cost: number): GameSaveState {
  if (state.stickyFeetUpgrade || state.dustCount < cost) return state;
  return {
    ...state,
    dustCount: state.dustCount - cost,
    stickyFeetUpgrade: true,
  };
}
