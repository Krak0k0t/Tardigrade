import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceToNextChapter,
  applyBadDayRecovery,
  computeModifiers,
  createInitialSaveState,
  getChapterProgressRatio,
  isChapterExitReady,
  purchasePattern,
  purchaseStickyFeet,
  stepResources,
} from './gameLogic';
import { DEFAULT_KEY_BINDINGS, rebindAction } from './inputConfig';

test('initial state starts at chapter 1, day 412, 8 legs', () => {
  const s = createInitialSaveState();
  assert.equal(s.chapter, 1);
  assert.equal(s.dayCount, 412);
  assert.equal(s.legsCount, 8);
  assert.equal(s.diary.length, 1);
});

test('Tun barrel stops moisture drain completely', () => {
  const mods = computeModifiers({
    difficulty: 'standard',
    character: 'tikhon',
    isTun: true,
    isJelly: false,
    legsCount: 8,
    stickyFeetUpgrade: false,
    chapter: 5,
  });
  assert.equal(mods.moistureDrainRate, 0);
  const res = stepResources(40, 50, 10, mods, false);
  assert.equal(res.moisture, 40);
  assert.equal(res.triggeredBadDay, false);
});

test('Bubble NG+ moves faster but drains double moisture', () => {
  const tikhonMods = computeModifiers({
    difficulty: 'standard',
    character: 'tikhon',
    isTun: false,
    isJelly: false,
    legsCount: 8,
    stickyFeetUpgrade: false,
    chapter: 1,
  });
  const bubbleMods = computeModifiers({
    difficulty: 'standard',
    character: 'bubble',
    isTun: false,
    isJelly: false,
    legsCount: 8,
    stickyFeetUpgrade: false,
    chapter: 1,
  });
  assert.ok(bubbleMods.speedMultiplier > tikhonMods.speedMultiplier);
  assert.equal(bubbleMods.moistureDrainRate, tikhonMods.moistureDrainRate * 2);
});

test('0 moisture triggers Bad Day recovery instead of Game Over', () => {
  const s = createInitialSaveState();
  const mods = computeModifiers({
    difficulty: 'standard',
    character: 'tikhon',
    isTun: false,
    isJelly: false,
    legsCount: 8,
    stickyFeetUpgrade: false,
    chapter: 1,
  });
  const step = stepResources(1, 50, 5, mods, false);
  assert.equal(step.triggeredBadDay, true);
  assert.equal(step.moisture, 0);

  const recovered = applyBadDayRecovery(s);
  assert.equal(recovered.badDaysCount, 1);
  assert.equal(recovered.dayCount, 412 + 21);
  assert.ok(recovered.moisture > 50);
  assert.equal(recovered.diary[0].titleKey, 'diary_badday_title');
});

test('Chapter 1 exit unlocks only after 3 channels dug and elder recipe found', () => {
  const s = createInitialSaveState();
  assert.equal(isChapterExitReady(s), false);
  s.puzzles.ch1ChannelsDug = 3;
  assert.equal(isChapterExitReady(s), false);
  s.puzzles.ch1RecipeFound = true;
  assert.equal(isChapterExitReady(s), true);
  assert.ok(getChapterProgressRatio(s) >= 0.8);
});

test('Leg #3 lost in Ch4 regenerates back to 8 when entering Ch5', () => {
  let s = createInitialSaveState();
  s.chapter = 4;
  s.legsCount = 7;
  s.puzzles.ch4LegLost = true;
  s = advanceToNextChapter(s);
  assert.equal(s.chapter, 5);
  assert.equal(s.legsCount, 8);
});

test('Chapter 6 completion unlocks New Game+ and Bubble', () => {
  let s = createInitialSaveState();
  s.chapter = 6;
  s = advanceToNextChapter(s);
  assert.equal(s.completedGame, true);
  assert.equal(s.ngPlusUnlocked, true);
  assert.equal(s.dayCount, 561);
});

test('Snail Umo shop purchases deduct dust and unlock patterns / sticky feet', () => {
  let s = createInitialSaveState();
  s.dustCount = 5;
  s = purchasePattern(s, 'moss_stripes', 2);
  assert.equal(s.dustCount, 3);
  assert.equal(s.activePattern, 'moss_stripes');
  s = purchaseStickyFeet(s, 3);
  assert.equal(s.dustCount, 0);
  assert.equal(s.stickyFeetUpgrade, true);
});

test('Key rebinding swaps conflicting bindings cleanly', () => {
  const next = rebindAction(DEFAULT_KEY_BINDINGS, 'jump', 'KeyT');
  assert.equal(next.jump, 'KeyT');
  assert.equal(next.tun, 'Mouse2');
});
