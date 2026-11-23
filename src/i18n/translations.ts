import { ActionId, ChapterId, DifficultyLevel, GraphicsQuality, LanguageCode } from '../game/types';

export interface LanguageMeta {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', rtl: true },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Farsi', rtl: true },
  { code: 'elv', nativeName: 'Sindarin (Elvish)', englishName: 'Elvish' },
  { code: 'orc', nativeName: 'Black Speech (Orkish)', englishName: 'Orkish' },
];

export type TranslationKeys = {
  gameTitle: string;
  gameSubtitle: string;
  startJourney: string;
  continueJourney: string;
  newGame: string;
  newGameBubble: string;
  newGameBarrel: string;
  settings: string;
  language: string;
  graphicsQuality: string;
  difficulty: string;
  musicVolume: string;
  sfxVolume: string;
  muteAudio: string;
  unmuteAudio: string;
  fullscreen: string;
  exitFullscreen: string;
  touchControls: string;
  touchAuto: string;
  touchAlways: string;
  touchOff: string;
  keybindings: string;
  pressAnyKeyOrMouse: string;
  resetDefaults: string;
  close: string;
  resume: string;
  returnToMenu: string;
  chapterSelect: string;
  pausedTitle: string;
  moisture: string;
  chewingEnergy: string;
  dayLabel: string;
  legsLabel: string;
  dustLabel: string;
  abilityJump: string;
  abilityTun: string;
  abilityJelly: string;
  abilitySense: string;
  abilityInteract: string;
  abilityDiary: string;
  tunActiveBadge: string;
  jellyActiveBadge: string;
  controlHintBar: string;
  diaryTitle: string;
  bestiaryTitle: string;
  dustShopTitle: string;
  dropletsTitle: string;
  countLegsTitle: string;
  countLegsPrompt: string;
  countLegsDone: string;
  nameDropletPrompt: string;
  saveName: string;
  buy: string;
  equip: string;
  equipped: string;
  owned: string;
  notEnoughDust: string;
  chapterCompleted: string;
  proceedNextChapter: string;
  stayExplore: string;
  finaleTitle: string;
  finaleSubtitle: string;
  playAsBubble: string;
  playBarrelMode: string;
  badDayToast: string;
  patienceHoldPrompt: string;
  patienceDonePrompt: string;
  graphics_low: string;
  graphics_balanced: string;
  graphics_high: string;
  graphics_cinematic: string;
  diff_zen: string;
  diff_standard: string;
  diff_barrel: string;
  act_moveForward: string;
  act_moveBackward: string;
  act_moveLeft: string;
  act_moveRight: string;
  act_jump: string;
  act_tun: string;
  act_jelly: string;
  act_waterSense: string;
  act_interact: string;
  act_diary: string;
  act_pause: string;
  ch1_title: string;
  ch2_title: string;
  ch3_title: string;
  ch4_title: string;
  ch5_title: string;
  ch6_title: string;
};

const EN: TranslationKeys = {
  gameTitle: 'Tardigrade: Slow Quest',
  gameSubtitle: 'A half-millimeter odyssey from roof moss to the greenhouse oasis',
  startJourney: 'Begin Journey',
  continueJourney: 'Continue Journey',
  newGame: 'New Journey',
  newGameBubble: 'NG+ Play as Bubble',
  newGameBarrel: 'NG+ Barrel Mode',
  settings: 'Settings',
  language: 'Language',
  graphicsQuality: 'Graphics Quality',
  difficulty: 'Difficulty',
  musicVolume: 'Music Volume',
  sfxVolume: 'Sound Effects',
  muteAudio: 'Mute Audio',
  unmuteAudio: 'Unmute Audio',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',
  touchControls: 'Touch Controls',
  touchAuto: 'Auto',
  touchAlways: 'Always On',
  touchOff: 'Off',
  keybindings: 'Key & Mouse Bindings',
  pressAnyKeyOrMouse: 'Press a key or mouse button...',
  resetDefaults: 'Reset Defaults',
  close: 'Close',
  resume: 'Resume',
  returnToMenu: 'Return to Menu',
  chapterSelect: 'Jump to Biome',
  pausedTitle: 'Paused in a Drop of Dew',
  moisture: 'Moisture',
  chewingEnergy: 'Algae Fuel',
  dayLabel: 'Day',
  legsLabel: 'Legs',
  dustLabel: 'World Dust',
  abilityJump: 'Jump',
  abilityTun: 'Tun Barrel',
  abilityJelly: 'Hydro-Jelly',
  abilitySense: 'Water Sense',
  abilityInteract: 'Interact',
  abilityDiary: 'Journal',
  tunActiveBadge: 'TUN ANABIOSIS · TIME FROZEN',
  jellyActiveBadge: 'HYDRO-CRYPTOBIOSIS · 0.5x FLOW',
  controlHintBar: 'WASD / Left-Click Move · Right-Click Jump · T Tun · J Jelly · E Interact · Esc Menu',
  diaryTitle: 'Mental Diary (Auto-Save)',
  bestiaryTitle: 'Micro-Bestiary',
  dustShopTitle: 'Snail Umo’s Dust Exchange',
  dropletsTitle: 'Named Droplets',
  countLegsTitle: 'Count Your Legs',
  countLegsPrompt: 'Tap each little clawed leg to make sure they are all still there.',
  countLegsDone: 'All present and accounted for. Dignified.',
  nameDropletPrompt: 'Give this droplet a name for your diary:',
  saveName: 'Name It',
  buy: 'Trade Dust',
  equip: 'Wear',
  equipped: 'Wearing',
  owned: 'Owned',
  notEnoughDust: 'Need more dust',
  chapterCompleted: 'Passage Unlocked',
  proceedNextChapter: 'Travel Onward',
  stayExplore: 'Stay & Explore',
  finaleTitle: 'The Greenhouse Oasis',
  finaleSubtitle: 'Day 561. Home is not where the water is—it is where you return from.',
  playAsBubble: 'New Game+ as Bubble (Rotifer)',
  playBarrelMode: 'New Game+ Barrel Challenge',
  badDayToast: 'Moisture reached zero — curled into a Tun barrel and woke up three weeks later!',
  patienceHoldPrompt: 'Stay completely still with Semyon the Tick',
  patienceDonePrompt: 'Stillness mastered. The dust whispers.',
  graphics_low: 'Low',
  graphics_balanced: 'Balanced',
  graphics_high: 'High',
  graphics_cinematic: 'Cinematic',
  diff_zen: 'Gentle Dew (Zen)',
  diff_standard: 'Micro-World (Standard)',
  diff_barrel: 'Dry Wind (Hard)',
  act_moveForward: 'Move Forward',
  act_moveBackward: 'Move Back',
  act_moveLeft: 'Move Left',
  act_moveRight: 'Move Right',
  act_jump: 'Jump (Right-Click)',
  act_tun: 'Tun Barrel (Anabiosis)',
  act_jelly: 'Hydro-Jelly (Slow Time)',
  act_waterSense: 'Water Sense',
  act_interact: 'Interact / Talk',
  act_diary: 'Open Journal',
  act_pause: 'Menu / Pause',
  ch1_title: 'I. The Moss That Remembered Everything',
  ch2_title: 'II. River From the Sky',
  ch3_title: 'III. Puddle Metropolis',
  ch4_title: 'IV. Baron, the Living Continent',
  ch5_title: 'V. Desert Under the Fridge',
  ch6_title: 'VI. Greenhouse, or Science of Small Things',
};

const RU: TranslationKeys = {
  gameTitle: 'Тихоходка: Медленный Квест',
  gameSubtitle: 'Одиссея длиной в полмиллиметра от крыши со мхом до оранжереи',
  startJourney: 'Начать путь',
  continueJourney: 'Продолжить',
  newGame: 'Новое путешествие',
  newGameBubble: 'НГ+ за Пузыря',
  newGameBarrel: 'НГ+ В бочке',
  settings: 'Настройки',
  language: 'Язык',
  graphicsQuality: 'Качество графики',
  difficulty: 'Сложность',
  musicVolume: 'Музыка',
  sfxVolume: 'Звуки капель',
  muteAudio: 'Выключить звук',
  unmuteAudio: 'Включить звук',
  fullscreen: 'На весь экран',
  exitFullscreen: 'Обычный экран',
  touchControls: 'Сенсорное управление',
  touchAuto: 'Авто',
  touchAlways: 'Всегда',
  touchOff: 'Выкл',
  keybindings: 'Управление (клавиши и мышь)',
  pressAnyKeyOrMouse: 'Нажмите клавишу или кнопку мыши...',
  resetDefaults: 'Сбросить',
  close: 'Закрыть',
  resume: 'Вернуться в каплю',
  returnToMenu: 'Выйти в меню',
  chapterSelect: 'Выбор биома',
  pausedTitle: 'Пауза в капле росы',
  moisture: 'Влага',
  chewingEnergy: 'Водоросли',
  dayLabel: 'День',
  legsLabel: 'Лапки',
  dustLabel: 'Пыль мира',
  abilityJump: 'Прыжок',
  abilityTun: 'Бочка (тун)',
  abilityJelly: 'Желе-замедление',
  abilitySense: 'Чутьё воды',
  abilityInteract: 'Действие',
  abilityDiary: 'Дневник',
  tunActiveBadge: 'АНАБИОЗ · ВРЕМЯ ЗАМЕРЛО',
  jellyActiveBadge: 'КРИПТОБИОЗ · ПОТОК ×0.5',
  controlHintBar: 'WASD / ЛКМ движение · ПКМ прыжок · T бочка · J желе · E диалог · Esc меню',
  diaryTitle: 'Ментальный дневник (Автосейв)',
  bestiaryTitle: 'Бестиарий «Я встретила вот это»',
  dustShopTitle: 'Лавка Улитки Умо',
  dropletsTitle: 'Имена для капель',
  countLegsTitle: 'Пересчитать лапки',
  countLegsPrompt: 'Коснитесь каждой коготковой лапки, чтобы проверить, все ли на месте.',
  countLegsDone: 'Все пересчитаны. С достоинством.',
  nameDropletPrompt: 'Дайте имя этой капле для дневника:',
  saveName: 'Запомнить',
  buy: 'Обменять пыль',
  equip: 'Надеть',
  equipped: 'Надето',
  owned: 'Есть',
  notEnoughDust: 'Мало пыли',
  chapterCompleted: 'Путь открыт',
  proceedNextChapter: 'Плыть дальше',
  stayExplore: 'Ещё погулять',
  finaleTitle: 'Оранжерея: Вечное Лето',
  finaleSubtitle: 'День 561. Дом — не там, где вода, а откуда уходишь и куда возвращаешься.',
  playAsBubble: 'НГ+ за Пузыря (Коловратка)',
  playBarrelMode: 'НГ+ Прохождение в бочке',
  badDayToast: 'Влага на нуле — Тихон свернулась в бочку и проспала три недели до дождя!',
  patienceHoldPrompt: 'Не шевелитесь рядом с Клещом Семёном',
  patienceDonePrompt: 'Терпение постигнуто. Пыль шепчет.',
  graphics_low: 'Низкая',
  graphics_balanced: 'Баланс',
  graphics_high: 'Высокая',
  graphics_cinematic: 'Кино (Cinematic)',
  diff_zen: 'Утренняя роса (Лёгкий)',
  diff_standard: 'Микромир (Обычный)',
  diff_barrel: 'Суховей (Сложный)',
  act_moveForward: 'Вперёд',
  act_moveBackward: 'Назад',
  act_moveLeft: 'Влево',
  act_moveRight: 'Вправо',
  act_jump: 'Прыжок (Правый клик)',
  act_tun: 'Бочка-анабиоз',
  act_jelly: 'Водное желе',
  act_waterSense: 'Чутьё на воду',
  act_interact: 'Взаимодействие',
  act_diary: 'Дневник и лапки',
  act_pause: 'Меню / Пауза',
  ch1_title: 'I. Мох, который помнил всё',
  ch2_title: 'II. Река из неба',
  ch3_title: 'III. Лужа-метрополия',
  ch4_title: 'IV. Барон — живой континент',
  ch5_title: 'V. Пустыня под холодильником',
  ch6_title: 'VI. Оранжерея, или Наука о мелочах',
};

// Partial localized overrides for all other 14 languages (merging cleanly onto EN so zero missing keys!)
const OVERRIDES: Partial<Record<LanguageCode, Partial<TranslationKeys>>> = {
  fr: {
    gameTitle: 'Tardigrade : Quête Lente',
    gameSubtitle: 'Une odyssée d’un demi-millimètre de la mousse du toit à la serre',
    startJourney: 'Commencer',
    continueJourney: 'Continuer',
    settings: 'Paramètres',
    language: 'Langue',
    graphicsQuality: 'Qualité graphique',
    difficulty: 'Difficulté',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter plein écran',
    resume: 'Reprendre',
    returnToMenu: 'Menu principal',
    moisture: 'Humidité',
    chewingEnergy: 'Algues',
    abilityJump: 'Sauter',
    abilityTun: 'Tonneau',
    abilityJelly: 'Gelée',
    abilitySense: 'Sens de l’eau',
    abilityDiary: 'Journal',
    keybindings: 'Raccourcis clavier et souris',
    graphics_low: 'Bas',
    graphics_balanced: 'Équilibré',
    graphics_high: 'Élevé',
    graphics_cinematic: 'Cinématique',
    ch1_title: 'I. La mousse qui se souvenait de tout',
    ch2_title: 'II. Rivière du ciel',
    ch3_title: 'III. Métropole-Flaque',
    ch4_title: 'IV. Baron, le continent vivant',
    ch5_title: 'V. Désert sous le frigo',
    ch6_title: 'VI. La Serre aux merveilles',
  },
  de: {
    gameTitle: 'Bärtierchen: Langsame Reise',
    gameSubtitle: 'Eine halbmikrometer-Odyssee vom Dachmoos ins Gewächshaus',
    startJourney: 'Reise beginnen',
    continueJourney: 'Fortsetzen',
    settings: 'Einstellungen',
    language: 'Sprache',
    graphicsQuality: 'Grafikqualität',
    difficulty: 'Schwierigkeit',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    resume: 'Weiterspielen',
    returnToMenu: 'Hauptmenü',
    moisture: 'Feuchtigkeit',
    chewingEnergy: 'Algenenergie',
    abilityJump: 'Springen',
    abilityTun: 'Tönnchen',
    abilityJelly: 'Hydro-Gel',
    abilitySense: 'Wassersinn',
    abilityDiary: 'Tagebuch',
    keybindings: 'Tasten- & Mausbelegung',
    graphics_low: 'Niedrig',
    graphics_balanced: 'Ausgewogen',
    graphics_high: 'Hoch',
    graphics_cinematic: 'Kino',
    ch1_title: 'I. Das Moos, das sich an alles erinnerte',
    ch2_title: 'II. Fluss vom Himmel',
    ch3_title: 'III. Pfützen-Metropole',
    ch4_title: 'IV. Baron, der lebende Kontinent',
    ch5_title: 'V. Wüste unterm Kühlschrank',
    ch6_title: 'VI. Gewächshaus der kleinen Wunder',
  },
  es: {
    gameTitle: 'Tardígrado: Aventura Lenta',
    gameSubtitle: 'Una odisea de medio milímetro del musgo al invernadero',
    startJourney: 'Iniciar viaje',
    continueJourney: 'Continuar',
    settings: 'Ajustes',
    language: 'Idioma',
    graphicsQuality: 'Gráficos',
    difficulty: 'Dificultad',
    fullscreen: 'Pantalla completa',
    resume: 'Reanudar',
    returnToMenu: 'Menú principal',
    moisture: 'Humedad',
    chewingEnergy: 'Algas',
    abilityJump: 'Saltar',
    abilityTun: 'Barril Tun',
    abilityJelly: 'Gelatina',
    abilitySense: 'Sentido del agua',
    abilityDiary: 'Diario',
    keybindings: 'Controles de teclado y ratón',
    graphics_low: 'Bajo',
    graphics_balanced: 'Equilibrado',
    graphics_high: 'Alto',
    graphics_cinematic: 'Cinemático',
    ch1_title: 'I. El musgo que lo recordaba todo',
    ch2_title: 'II. Río del cielo',
    ch3_title: 'III. Metrópolis Charco',
    ch4_title: 'IV. Barón, el continente vivo',
    ch5_title: 'V. Desierto bajo la nevera',
    ch6_title: 'VI. El Invernadero',
  },
  pt: {
    gameTitle: 'Tardígrado: Jornada Lenta',
    gameSubtitle: 'Uma odisseia de meio milímetro do musgo à estufa',
    startJourney: 'Iniciar jornada',
    continueJourney: 'Continuar',
    settings: 'Configurações',
    language: 'Idioma',
    graphicsQuality: 'Gráficos',
    difficulty: 'Dificuldade',
    fullscreen: 'Tela cheia',
    resume: 'Retomar',
    returnToMenu: 'Menu principal',
    moisture: 'Umidade',
    chewingEnergy: 'Algas',
    abilityJump: 'Pular',
    abilityTun: 'Barril Tun',
    abilityJelly: 'Hidro-Gel',
    abilitySense: 'Faro d’água',
    abilityDiary: 'Diário',
    keybindings: 'Teclado e Mouse',
    ch1_title: 'I. O musgo que lembrava de tudo',
    ch2_title: 'II. Rio do céu',
    ch3_title: 'III. Metrópole Poça',
    ch4_title: 'IV. Barão, o continente vivo',
    ch5_title: 'V. Deserto sob a geladeira',
    ch6_title: 'VI. A Estufa',
  },
  it: {
    gameTitle: 'Tardigrado: Lento Viaggio',
    gameSubtitle: 'Un’odissea di mezzo millimetro dal muschio alla serra',
    startJourney: 'Inizia viaggio',
    continueJourney: 'Continua',
    settings: 'Impostazioni',
    language: 'Lingua',
    graphicsQuality: 'Qualità grafica',
    difficulty: 'Difficoltà',
    fullscreen: 'Schermo intero',
    resume: 'Riprendi',
    returnToMenu: 'Menu principale',
    moisture: 'Umidità',
    chewingEnergy: 'Alghe',
    abilityJump: 'Salta',
    abilityTun: 'Botte Tun',
    abilityJelly: 'Idro-Gel',
    abilitySense: 'Senso dell’acqua',
    abilityDiary: 'Diario',
    ch1_title: 'I. Il muschio che ricordava tutto',
    ch2_title: 'II. Fiume dal cielo',
    ch3_title: 'III. Metropoli Pozzanghera',
    ch4_title: 'IV. Barone, il continente vivente',
    ch5_title: 'V. Deserto sotto il frigo',
    ch6_title: 'VI. La Serra',
  },
  pl: {
    gameTitle: 'Niesporczak: Powolna Wyprawa',
    gameSubtitle: 'Półmilimetrowa odyseja z mchu na dachu do szklarni',
    startJourney: 'Rozpocznij podróż',
    continueJourney: 'Kontynuuj',
    settings: 'Ustawienia',
    language: 'Język',
    graphicsQuality: 'Jakość grafiki',
    difficulty: 'Poziom trudności',
    fullscreen: 'Pełny ekran',
    resume: 'Wznów',
    returnToMenu: 'Menu główne',
    moisture: 'Wilgoć',
    chewingEnergy: 'Glony',
    abilityJump: 'Skok',
    abilityTun: 'Beczka (Tun)',
    abilityJelly: 'Żel spowalniający',
    abilitySense: 'Węch na wodę',
    abilityDiary: 'Dziennik',
    ch1_title: 'I. Mech, który pamiętał wszystko',
    ch2_title: 'II. Rzeka z nieba',
    ch3_title: 'III. Kałuża-Metropolia',
    ch4_title: 'IV. Baron – żywy kontynent',
    ch5_title: 'V. Pustynia pod lodówką',
    ch6_title: 'VI. Szklarnia cudów',
  },
  uk: {
    gameTitle: 'Тихохід: Повільний Квест',
    gameSubtitle: 'Півміліметрова одіссея від моху на даху до оранжереї',
    startJourney: 'Почати мандрівку',
    continueJourney: 'Продовжити',
    settings: 'Налаштування',
    language: 'Мова',
    graphicsQuality: 'Якість графіки',
    difficulty: 'Складність',
    fullscreen: 'На весь екран',
    resume: 'Повернутися',
    returnToMenu: 'Вийти в меню',
    moisture: 'Волога',
    chewingEnergy: 'Водорості',
    abilityJump: 'Стрибок',
    abilityTun: 'Бочка (тун)',
    abilityJelly: 'Желе-сповільнення',
    abilitySense: 'Чуття води',
    abilityDiary: 'Щоденник',
    ch1_title: 'I. Мох, що пам’ятав усе',
    ch2_title: 'II. Ріка з неба',
    ch3_title: 'III. Калюжа-метрополія',
    ch4_title: 'IV. Барон — живий континент',
    ch5_title: 'V. Пустеля під холодильником',
    ch6_title: 'VI. Оранжерея дрібниць',
  },
  zh: {
    gameTitle: '水熊虫：缓慢之旅',
    gameSubtitle: '从屋顶苔藓到温室绿洲的半毫米奇幻史诗',
    startJourney: '开始旅程',
    continueJourney: '继续旅程',
    settings: '设置',
    language: '语言',
    graphicsQuality: '画质等级',
    difficulty: '难度',
    fullscreen: '全屏模式',
    resume: '继续游戏',
    returnToMenu: '返回主菜单',
    moisture: '水分',
    chewingEnergy: '藻类能量',
    abilityJump: '跳跃',
    abilityTun: '隐生圆桶',
    abilityJelly: '水凝胶缓速',
    abilitySense: '水源感知',
    abilityDiary: '日记本',
    graphics_low: '低画质',
    graphics_balanced: '均衡',
    graphics_high: '高画质',
    graphics_cinematic: '电影级',
    ch1_title: '第一章：铭记一切的苔藓',
    ch2_title: '第二章：天降之河',
    ch3_title: '第三章：水洼大都会',
    ch4_title: '第四章：巴伦，移动的大陆',
    ch5_title: '第五章：冰箱下的荒漠',
    ch6_title: '第六章：温室与微小科学',
  },
  ja: {
    gameTitle: 'クマムシ：スロークエスト',
    gameSubtitle: '屋根の苔から温室のオアシスへ、0.5ミリの旅',
    startJourney: '旅を始める',
    continueJourney: '続きから',
    settings: '設定',
    language: '言語',
    graphicsQuality: 'グラフィック品質',
    difficulty: '難易度',
    fullscreen: '全画面',
    resume: '再開する',
    returnToMenu: 'タイトルへ戻る',
    moisture: '水分',
    chewingEnergy: '藻類エネルギー',
    abilityJump: 'ジャンプ',
    abilityTun: '乾眠タル',
    abilityJelly: '水ゼリー減速',
    abilitySense: '水感知',
    abilityDiary: '日記',
    graphics_low: '低',
    graphics_balanced: '標準',
    graphics_high: '高',
    graphics_cinematic: 'シネマティック',
    ch1_title: 'I. すべてを覚えている苔',
    ch2_title: 'II. 空からの川',
    ch3_title: 'III. 水たまりの大都市',
    ch4_title: 'IV. バロン：生ける大陸',
    ch5_title: 'V. 冷蔵庫の下の砂漠',
    ch6_title: 'VI. 温室と小さな科学',
  },
  vi: {
    gameTitle: 'Gấu Nước: Hành Trình Chậm',
    gameSubtitle: 'Chuyến phiêu lưu nửa milimet từ rêu mái nhà đến nhà kính',
    startJourney: 'Bắt đầu',
    continueJourney: 'Tiếp tục',
    settings: 'Cài đặt',
    language: 'Ngôn ngữ',
    graphicsQuality: 'Đồ họa',
    difficulty: 'Độ khó',
    fullscreen: 'Toàn màn hình',
    resume: 'Tiếp tục chơi',
    returnToMenu: 'Về menu',
    moisture: 'Độ ẩm',
    chewingEnergy: 'Năng lượng tảo',
    abilityJump: 'Nhảy',
    abilityTun: 'Cuộn tròn Tun',
    abilityJelly: 'Thạch chậm',
    abilitySense: 'Cảm nhận nước',
    abilityDiary: 'Nhật ký',
    ch1_title: 'I. Đám rêu nhớ mọi chuyện',
    ch2_title: 'II. Dòng sông từ trời',
    ch3_title: 'III. Đô thị Vũng Nước',
    ch4_title: 'IV. Baron – Lục địa sống',
    ch5_title: 'V. Sa mạc dưới tủ lạnh',
    ch6_title: 'VI. Nhà kính kỳ diệu',
  },
  ar: {
    gameTitle: 'دب الماء: الرحلة البطيئة',
    gameSubtitle: 'ملحمة بنصف مليمتر من طحالب السطح إلى واحة الدفيئة',
    startJourney: 'ابدأ الرحلة',
    continueJourney: 'متابعة',
    settings: 'الإعدادات',
    language: 'اللغة',
    graphicsQuality: 'جودة الرسوميات',
    difficulty: 'الصعوبة',
    fullscreen: 'ملء الشاشة',
    resume: 'استئناف',
    returnToMenu: 'القائمة الرئيسية',
    moisture: 'الرطوبة',
    chewingEnergy: 'طاقة الطحالب',
    abilityJump: 'قفز',
    abilityTun: 'برميل السكون',
    abilityJelly: 'هلام التبطيء',
    abilitySense: 'حاسة الماء',
    abilityDiary: 'المذكرات',
    ch1_title: '١. الطحلب الذي تذكر كل شيء',
    ch2_title: '٢. نهر من السماء',
    ch3_title: '٣. مدينة البركة',
    ch4_title: '٤. بارون، القارة الحية',
    ch5_title: '٥. صحراء تحت الثلاجة',
    ch6_title: '٦. الدفيئة وعلم الأشياء الصغيرة',
  },
  fa: {
    gameTitle: 'خرس آبی: سفر آرام',
    gameSubtitle: 'حماسه نیم‌میلی‌متری از خزه سقف تا واحه گلخانه',
    startJourney: 'شروع سفر',
    continueJourney: 'ادامه',
    settings: 'تنظیمات',
    language: 'زبان',
    graphicsQuality: 'کیفیت گرافیک',
    difficulty: 'درجه سختی',
    fullscreen: 'تمام‌صفحه',
    resume: 'ادامه بازی',
    returnToMenu: 'بازگشت به منو',
    moisture: 'رطوبت',
    chewingEnergy: 'انرژی جلبک',
    abilityJump: 'پرش',
    abilityTun: 'خمره خواب زمستانی',
    abilityJelly: 'ژله کندکننده',
    abilitySense: 'حس آب',
    abilityDiary: 'دفترچه خاطرات',
    ch1_title: '۱. خزه‌ای که همه چیز را به یاد داشت',
    ch2_title: '۲. رودی از آسمان',
    ch3_title: '۳. کلان‌شهر گودال آب',
    ch4_title: '۴. بارون، قاره زنده',
    ch5_title: '۵. بیابان زیر یخچال',
    ch6_title: '۶. گلخانه و علم چیزهای کوچک',
  },
  elv: {
    gameTitle: 'Linnar-on-Nen: Lende Nórë',
    gameSubtitle: 'Menel-thavron minë millimetrëo mossëllo na i-Galad-Coa',
    startJourney: 'Auta i Men',
    continueJourney: 'Hilya',
    settings: 'Nótië',
    language: 'Lambë',
    graphicsQuality: 'Cala-Vëa',
    difficulty: 'Úrë',
    fullscreen: 'Aira-Cén',
    resume: 'Lesta',
    returnToMenu: 'Meneldë',
    moisture: 'Nén-Vëa',
    chewingEnergy: 'Uilë-Meleth',
    abilityJump: 'Halta',
    abilityTun: 'Cor-Tun',
    abilityJelly: 'Limpë-Lú',
    abilitySense: 'Nén-Súlë',
    abilityDiary: 'Parma-Lú',
    graphics_low: 'Pitya',
    graphics_balanced: 'Mahta',
    graphics_high: 'Tára',
    graphics_cinematic: 'Alcarin',
    ch1_title: 'I. I Mossë i Enyalë Ilqua',
    ch2_title: 'II. Sírë Menello',
    ch3_title: 'III. Ost-Nen',
    ch4_title: 'IV. Baron, i Cuina Nórë',
    ch5_title: 'V. Erya-Nórë nu i Helca',
    ch6_title: 'VI. I Galad-Coa',
  },
  orc: {
    gameTitle: 'MUD-SLUG: SLOW WAAAGH',
    gameSubtitle: 'TINY GRUNT CRAWL FROM ROOF-MOSS TO WET GLASS-HUT',
    startJourney: 'STOMP FORTH',
    continueJourney: 'KEEP CRAWLIN',
    settings: 'GEARZ',
    language: 'TONGUE',
    graphicsQuality: 'SHINY LEVEL',
    difficulty: 'GRIT',
    fullscreen: 'BIG EYE',
    resume: 'BACK TO MUD',
    returnToMenu: 'FLEE TO CAMP',
    moisture: 'WETNESS',
    chewingEnergy: 'GREEN GOOP',
    abilityJump: 'LEAP!',
    abilityTun: 'CURL-ROCK',
    abilityJelly: 'SLOW-SLIME',
    abilitySense: 'SNIFF WET',
    abilityDiary: 'SKULL-SCRIBBLES',
    graphics_low: 'CRUSTY',
    graphics_balanced: 'DECENT',
    graphics_high: 'PROPER SHINY',
    graphics_cinematic: 'MEGA-GLOW',
    ch1_title: 'I. DA MOSS WOT REMEMBERS',
    ch2_title: 'II. SKY-RIVER SPLASH',
    ch3_title: 'III. BIG PUDDLE HIVE',
    ch4_title: 'IV. BARON DA HAIRY BEAST',
    ch5_title: 'V. DUST WASTES UNDER COLD-BOX',
    ch6_title: 'VI. DA WET GLASS-HUT',
  },
};

export function getT(lang: LanguageCode): TranslationKeys {
  if (lang === 'ru') return RU;
  if (lang === 'en') return EN;
  return { ...EN, ...(OVERRIDES[lang] ?? {}) };
}

export function isRtlLanguage(lang: LanguageCode): boolean {
  return lang === 'ar' || lang === 'fa';
}

export function getActionLabel(t: TranslationKeys, action: ActionId): string {
  return t[`act_${action}`];
}

export function getGraphicsLabel(t: TranslationKeys, q: GraphicsQuality): string {
  return t[`graphics_${q}`];
}

export function getDifficultyLabel(t: TranslationKeys, d: DifficultyLevel): string {
  return t[`diff_${d}`];
}

export function getChapterTitle(t: TranslationKeys, ch: ChapterId): string {
  return t[`ch${ch}_title`];
}

// Narrative strings (bilingual EN + RU core prose so every story beat, diary, bestiary & NPC line reads naturally)
export interface LocalizedText {
  en: string;
  ru: string;
}

export function pickText(lang: LanguageCode, text: LocalizedText): string {
  if (lang === 'ru' || lang === 'uk') return text.ru;
  return text.en;
}
