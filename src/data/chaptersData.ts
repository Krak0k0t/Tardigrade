import { LocalizedText } from '../i18n/translations';
import { ChapterId, DorsalPattern } from '../game/types';

export interface BestiaryDef {
  id: string;
  name: LocalizedText;
  fact: LocalizedText;
  joke: LocalizedText;
}

export const BESTIARY_DATA: BestiaryDef[] = [
  {
    id: 'tardigrade',
    name: { en: 'Tikhon (Tardigrade)', ru: 'Тихон (Тихоходка)' },
    fact: {
      en: 'A microscopic eight-legged water bear that synthesizes trehalose to survive drought, frost, and vacuum in Tun state.',
      ru: 'Микроскопический восьминогий зверь, вырабатывающий трегалозу, чтобы пережить засуху, мороз и вакуум в виде бочки.',
    },
    joke: {
      en: 'Weighs less than a speck of dust, yet keeps a 500-day mental diary like a Victorian explorer.',
      ru: 'Весит меньше пылинки, но ведёт ментальный дневник так серьёзно, будто открывает Антарктиду.',
    },
  },
  {
    id: 'moss',
    name: { en: 'Bryophyte Roof Moss', ru: 'Крышный мох' },
    fact: {
      en: 'Spongy miniature forests holding morning dew between overlapping emerald leaflets.',
      ru: 'Губчатые мини-леса, удерживающие утреннюю росу между изумрудными листочками.',
    },
    joke: {
      en: 'Panics with joy whenever it rains, then forgets everything three sunny days later.',
      ru: 'Впадает в панику счастья от каждого дождя, а через три солнечных дня всё забывает.',
    },
  },
  {
    id: 'rotifer_bubble',
    name: { en: 'Bubble (Rotifer)', ru: 'Пузырь (Коловратка)' },
    fact: {
      en: 'A wheel-animalcule using twin rotating ciliary crowns to swim briskly and filter algae.',
      ru: 'Коловратка, использующая два вращающихся венчика ресничек для быстрого плавания и фильтрации водорослей.',
    },
    joke: {
      en: 'Has told the story of "The Great Tuesday Flood" thirty times today; no two versions share a single fact.',
      ru: 'Рассказал о «Великом Потопе» уже тридцать раз за день — ни одна деталь ни разу не совпала.',
    },
  },
  {
    id: 'snail_umo',
    name: { en: 'Snail Umo', ru: 'Улитка Умо' },
    fact: {
      en: 'A tiny pond snail carrying a spiral calcium-carbonate shop on her back.',
      ru: 'Крошечная прудовая улитка, несущая на спине спиральный торговый ларёк из карбоната кальция.',
    },
    joke: {
      en: 'Moves at 0.001 km/h yet somehow always arrives at the next chapter before you do.',
      ru: 'Ползёт со скоростью метр в неделю, но почему-то всегда оказывается в следующей главе раньше тебя.',
    },
  },
  {
    id: 'daphnia',
    name: { en: 'Dunya (Daphnia)', ru: 'Дуня (Дафния)' },
    fact: {
      en: 'A translucent water flea propelled by jerky hops of its branched second antennae.',
      ru: 'Полупрозрачный рачок, прыгающий рывками при помощи ветвистых усиков-антенн.',
    },
    joke: {
      en: 'Has approximately 14 thoughts per second, 13 of which are "IS IT NOON YET?!"',
      ru: 'Думает четырнадцать мыслей в секунду, тринадцать из которых: «УЖЕ ПОЛДЕНЬ?!»',
    },
  },
  {
    id: 'flea',
    name: { en: 'Baron’s Flea Collective', ru: 'Блохи-разбойники Барона' },
    fact: {
      en: 'Wingless acrobats navigating dense canine fur forests via elastic resilin leg springs.',
      ru: 'Бескрылые акробаты, скачущие по шерстяным джунглям за счёт упругих пружинок резилина в лапках.',
    },
    joke: {
      en: 'Not actually villains—just loud neighbors who respond surprisingly well to polite leg-petting treaties.',
      ru: 'Совсем не злодеи, просто шумные соседи, с которыми легко договориться о поглаживании отросших лапок.',
    },
  },
  {
    id: 'mite_semyon',
    name: { en: 'Semyon the Dust Mite', ru: 'Клещ Семён' },
    fact: {
      en: 'An armored arachnid philosopher thriving in dry floor crevices beneath kitchen appliances.',
      ru: 'Панцирный философ, обитающий в сухой пыли под кухонными шкафами и холодильником.',
    },
    joke: {
      en: 'His deepest puzzle requires literally doing nothing while the kitchen hums.',
      ru: 'Его самая сложная головоломка — буквально ничего не делать, пока гудит холодильник.',
    },
  },
  {
    id: 'elder_tikhon',
    name: { en: 'Elder Tikhon', ru: 'Старейшина Тихон-старшая' },
    fact: {
      en: 'An ancient tardigrade who survived decades curled inside a dry greenhouse Tun.',
      ru: 'Древняя тихоходка, пережившая десятилетия в сухой бочке на листе оранжереи.',
    },
    joke: {
      en: 'Proof that almost every tardigrade ends up named some variation of Tikhon.',
      ru: 'Живое доказательство того, что почти всех тихоходок в итоге зовут примерно одинаково.',
    },
  },
];

export interface ShopPatternDef {
  id: DorsalPattern;
  name: LocalizedText;
  desc: LocalizedText;
  cost: number;
  swatch: string;
}

export const SHOP_PATTERNS: ShopPatternDef[] = [
  {
    id: 'moss_stripes',
    name: { en: 'Emerald Moss Stripes', ru: 'Изумрудные полоски мха' },
    desc: { en: 'Velvety bryophyte camouflage', ru: 'Бархатный узор крышного мха' },
    cost: 2,
    swatch: '#4ade80',
  },
  {
    id: 'dew_spots',
    name: { en: 'Morning Dew Polka', ru: 'Капельки росы' },
    desc: { en: 'Iridescent pearl droplets along the cuticle', ru: 'Переливчатые жемчужины на спинке' },
    cost: 3,
    swatch: '#38bdf8',
  },
  {
    id: 'golden_amber',
    name: { en: 'Trehalose Amber', ru: 'Трегалозный янтарь' },
    desc: { en: 'Warm sunlit honey carapace sheen', ru: 'Тёплый медовый блеск панциря' },
    cost: 4,
    swatch: '#f59e0b',
  },
  {
    id: 'starlight',
    name: { en: 'Greenhouse Mist Glow', ru: 'Оранжерейное сияние' },
    desc: { en: 'Bioluminescent spore dust motif', ru: 'Узор из светящихся спор' },
    cost: 5,
    swatch: '#c084fc',
  },
];

export const DIARY_TEXTS: Record<string, { title: LocalizedText; text: LocalizedText }> = {
  diary_wake_title: {
    title: { en: 'Day 412 · Awakening on the Roof', ru: 'День 412 · Пробуждение на крыше' },
    text: {
      en: 'Three years in a dry Tun barrel, and the moss looks smaller than I remember. Today I dislike drought, wind, and existential loneliness—in that order. Time to find the legendary Greenhouse.',
      ru: 'Три года в сухой бочке, а мох вокруг будто просел. Сегодня я не люблю засуху, ветер и одиночество. Говорят, на дальнем берегу есть Оранжерея, где вода по расписанию.',
    },
  },
  diary_badday_title: {
    title: { en: 'A Bad Day (Three Weeks Later)', ru: 'Плохой день (три недели спустя)' },
    text: {
      en: 'I dried out completely and curled into a Tun without asking anyone’s permission. Woke up three weeks later in a fresh drop of moisture. Dignified? Hardly. Alive? Entirely.',
      ru: 'Я опять пересохла и свернулась в бочку. Проснулась три недели спустя в свежей капле. Достоинство пострадало, но лапки все на месте.',
    },
  },
  diary_ch2_title: {
    title: { en: 'Day 415 · Catapulted Down the Gutter', ru: 'День 415 · Сплав по водостоку' },
    text: {
      en: 'Rain arrived like an avalanche of glass boulders. I curled into a Tun and rode a birch leaf straight into the tin gutter river. All eight legs accounted for. Mostly.',
      ru: 'Ливень обрушился лавиной стеклянных валунов. Я свернулась в бочку и скатилась по водостоку на листе-плоту. Цела. Лапки все восемь. Почти.',
    },
  },
  diary_ch3_title: {
    title: { en: 'Day 419 · Puddle Metropolis', ru: 'День 419 · Лужа-метрополия' },
    text: {
      en: 'The gutter spilled into a bustling city beneath the porch. Ciliates direct traffic while frantic daphnia race against noon evaporation.',
      ru: 'Водосток вылил меня в огромный город у крыльца. Инфузории на перекрёстках, рачки-таксисты, и все куда-то спешат до полудня.',
    },
  },
  diary_ch4_title: {
    title: { en: 'Day 438 · The Hairy Continent', ru: 'День 438 · Живой континент Барон' },
    text: {
      en: 'A giant warm mountain sat beside the puddle, shook once, and carried me into a jungle of golden fur. I appear to be riding a dog named Baron.',
      ru: 'Огромная тёплая гора присела у лужи и унесла меня в джунгли шерсти. Похоже, я путешествую верхом на собаке по имени Барон.',
    },
  },
  diary_ch5_title: {
    title: { en: 'Day 498 · Under the Cold Monolith', ru: 'День 498 · Пустыня под холодильником' },
    text: {
      en: 'Baron sneezed me under the kitchen door. Now I cross an arid frontier of crumbs and dust bunnies where a fluorescent lamp dictates day and night.',
      ru: 'Барон чихнул — и вот я под кухонной дверью. Здесь пыль, крошки, сушь, а солнце включается вместе с лампочкой холодильника.',
    },
  },
  diary_ch6_title: {
    title: { en: 'Day 540 · The Glass Oasis', ru: 'День 540 · Оранжерея' },
    text: {
      en: 'A warm draft carried me beneath the greenhouse door. Giant elephant-ear leaves tower above, yet the humidifier sits silent and clogged.',
      ru: 'Сквозняк втянул меня в щель под дверью оранжереи. Вокруг гигантские листья и туман, но главный увлажнитель замолчал из-за засора.',
    },
  },
  diary_finale_title: {
    title: { en: 'Day 561 · Rain Outside the Glass', ru: 'День 561 · Дождь за окном' },
    text: {
      en: 'The old caretaker returned and switched on the mist. Elder Tikhon reminded me that home is where you leave from and return to. Outside, fresh rain begins.',
      ru: 'Хозяйка вернулась и включила увлажнитель. Старейшина напомнила: дом — это место, откуда уходишь и куда возвращаешься. А за окном снова идёт дождь.',
    },
  },
};

export interface ChapterMeta {
  id: ChapterId;
  objectiveSummary: LocalizedText;
  ambientHint: LocalizedText;
}

export const CHAPTER_META: Record<ChapterId, ChapterMeta> = {
  1: {
    id: 1,
    objectiveSummary: {
      en: 'Talk to Bubble the Rotifer, dig 3 moss channels to bring dew to the parched root, and read the Elders’ Greenhouse note.',
      ru: 'Поговорите с Пузырём, проройте 3 канавки во мху для росы и найдите рецепт стариков об Оранжерее.',
    },
    ambientHint: {
      en: 'Right-click to jump between moss cushions · E to dig channels & talk',
      ru: 'Правый клик — прыжок по подушкам мха · E — рыть канавки и говорить',
    },
  },
  2: {
    id: 2,
    objectiveSummary: {
      en: 'Use Hydro-Jelly (J) or Tun (T) across currents, gather 3 capillary fibers to bridge the Siphon, and guide nervous droplet Lucy to shade.',
      ru: 'Используйте Желе (J) в потоках, соберите 3 волоска-моста для Сифона и проводите каплю Люсю в тень.',
    },
    ambientHint: {
      en: 'Trade dust with Snail Umo · Guide Lucy to the shaded leaf',
      ru: 'Меняйте пылинки у Улитки Умо · Проводите Люсю в тень',
    },
  },
  3: {
    id: 3,
    objectiveSummary: {
      en: 'Complete 3 Cilia-Express pollen deliveries and teach 2 frantic daphnia the calm art of Tun before noon.',
      ru: 'Доставьте 3 посылки «Экспресс-Реснички» и научите 2 суетливых дафний покою в бочке до полудня.',
    },
    ambientHint: {
      en: 'Watch Dunya hop · Interact with Cilia-Post beacons & Daphnia',
      ru: 'Следите за Дуней · Взаимодействуйте с маячками почты и дафниями',
    },
  },
  4: {
    id: 4,
    objectiveSummary: {
      en: 'Place 3 scent-map markers while Baron walks, settle the Flea treaty, and choose how to brave the lavender bath.',
      ru: 'Поставьте 3 пахучие метки на карте, помиритесь с блохами и выберите способ пережить купание в тазу.',
    },
    ambientHint: {
      en: 'The world sways when Baron breathes or walks · Watch your 3rd leg!',
      ru: 'Мир покачивается, когда Барон дышит и ходит · Берегите третью лапку!',
    },
  },
  5: {
    id: 5,
    objectiveSummary: {
      en: 'Build the fridge condenser drip trap, sit completely still for Semyon’s patience trial, and trade 2 stories with Gosha.',
      ru: 'Соберите ловушку для капли холодильника, замрите неподвижно для Семёна и расскажите 2 истории таракану Гоше.',
    },
    ambientHint: {
      en: 'Stand still near Tick Semyon to fill the Patience ring · Your 8th leg grows back here!',
      ru: 'Не двигайтесь рядом с Клещом Семёном · Здесь отрастает восьмая лапка!',
    },
  },
  6: {
    id: 6,
    objectiveSummary: {
      en: 'Reach the humidifier pipe, weave a capillary ladder, clear the dust clog in Tun barrel, and awaken Elder Tikhon.',
      ru: 'Доберитесь до трубки увлажнителя, сплетите капиллярную лестницу, выбейте засор в бочке и разбудите Старейшину.',
    },
    ambientHint: {
      en: 'Use Tun (T) to roll down the inclined nozzle and dislodge the giant dust clog',
      ru: 'Свернитесь в бочку (T) на наклонной трубке, чтобы сдвинуть засор',
    },
  },
};
