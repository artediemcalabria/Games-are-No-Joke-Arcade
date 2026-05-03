import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flag, GitBranch, MapPin, MessageSquare, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type MeterKey = 'trust' | 'clarity' | 'inclusion' | 'energy' | 'learning';
type Meters = Record<MeterKey, number>;
type FeaturedProfileId = 'andrea' | 'slave' | 'ivy';
type ProfilePoints = Record<MeterKey, number>;
type StoryNodeId =
  | 'arrival'
  | 'circle-connect'
  | 'circle-distance'
  | 'circle-familiar'
  | 'team-shared'
  | 'team-solo'
  | 'team-fun'
  | 'prototype-playtest'
  | 'prototype-polish'
  | 'prototype-alone'
  | 'conflict-listen'
  | 'conflict-control'
  | 'conflict-avoid'
  | 'night-repair'
  | 'night-solo'
  | 'night-honest'
  | 'showcase';
type EndingId =
  | 'shared-board-game-success'
  | 'solo-prototype-success'
  | 'fun-game-weak-message'
  | 'beautiful-board-broken-rules'
  | 'conflict-breaks-team'
  | 'failed-prototype-strong-learning';

type Participant = {
  name: string;
  country: string;
};

type ProfileTemplate = Participant & {
  id: FeaturedProfileId;
  points: ProfilePoints;
};

type PlayerProfile = Participant & {
  id: string;
  trait: string;
  risk: string;
  opening: string;
  points: ProfilePoints;
  strongestMeter: MeterKey;
  riskMeter: MeterKey;
};

type DialogueLine = {
  speaker: string;
  text: string;
};

type StoryMoment = {
  id: string;
  timeLabel: string;
  title: string;
  location: string;
  text: string;
  dialogue: DialogueLine[];
  tone: string;
};

type Choice = {
  id: string;
  label: string;
  intention: string;
  effects: Partial<Meters>;
  flags?: string[];
  next: StoryNodeId | 'ending';
  feedback: string;
};

type StoryNode = {
  id: StoryNodeId;
  chapter: string;
  dayLabel: string;
  title: string;
  location: string;
  speaker: string;
  text: string;
  moments: StoryMoment[];
  cast: string[];
  choices: Choice[];
};

type StoryLogEntry = {
  nodeId: StoryNodeId;
  nodeTitle: string;
  dayLabel: string;
  location: string;
  moments: StoryMoment[];
  chosenAction: string;
  feedback: string;
  meterChanges: Partial<Meters>;
  flags: string[];
};

type Ending = {
  title: string;
  protagonistOutcome: string;
  boardGameOutcome: string;
  teamOutcome: string;
  logic: string;
  howToReach: string;
  trainerReflection: string;
};

const game = gameCatalog.find((item) => item.id === 'filadelfia-story')!;

const initialMeters: Meters = {
  trust: 50,
  clarity: 50,
  inclusion: 50,
  energy: 50,
  learning: 50,
};

const meterKeys: MeterKey[] = ['trust', 'clarity', 'inclusion', 'energy', 'learning'];
const profilePointBudget = 20;
const maxProfilePointsPerMeter = 10;
const defaultProfilePoints: ProfilePoints = { trust: 4, clarity: 4, inclusion: 4, energy: 4, learning: 4 };

const featuredProfiles: Record<FeaturedProfileId, ProfileTemplate> = {
  andrea: {
    id: 'andrea',
    name: 'Andrea',
    country: 'France',
    points: { trust: 6, clarity: 0, inclusion: 4, energy: 10, learning: 0 },
  },
  slave: {
    id: 'slave',
    name: 'Slave',
    country: 'N. Macedonia',
    points: { trust: 0, clarity: 10, inclusion: 0, energy: 4, learning: 6 },
  },
  ivy: {
    id: 'ivy',
    name: 'Ivy',
    country: 'Bulgaria',
    points: { trust: 6, clarity: 0, inclusion: 10, energy: 0, learning: 4 },
  },
};

const participants: Participant[] = [
  { country: 'Italy', name: 'Claudia' },
  { country: 'Italy', name: 'Kaotar' },
  { country: 'Italy', name: 'Giuseppe' },
  { country: 'Turkiye', name: 'Rasim Hamza' },
  { country: 'Turkiye', name: 'Mehmet Emin' },
  { country: 'Turkiye', name: 'Buse Naz' },
  { country: 'Romania', name: 'Liviu' },
  { country: 'Romania', name: 'Cristina' },
  { country: 'Romania', name: 'Loredana' },
  { country: 'N. Macedonia', name: 'Slave' },
  { country: 'N. Macedonia', name: 'Mihaela' },
  { country: 'N. Macedonia', name: 'Elena' },
  { country: 'N. Macedonia', name: 'Kiril' },
  { country: 'Bulgaria', name: 'Ivy' },
  { country: 'Bulgaria', name: 'Gjoko' },
  { country: 'Bulgaria', name: 'Hatche' },
  { country: 'France', name: 'Andrea' },
  { country: 'France', name: 'Sophie' },
  { country: 'France', name: 'Ethan' },
  { country: 'Serbia', name: 'Stasa' },
  { country: 'Serbia', name: 'Stefan' },
  { country: 'Serbia', name: 'Ognjen' },
];

const storyNodes: Record<StoryNodeId, StoryNode> = {
  arrival: {
    id: 'arrival',
    chapter: 'Chapter 1',
    dayLabel: 'Day 1',
    title: 'Arrival at the Borgo',
    location: 'Residenza Antico Borgo, Filadelfia',
    speaker: 'Rocco',
    text: '{you} reaches the stone courtyard with a backpack, a tired smile, and the first question: stay safe, or enter the group?',
    cast: ['Rocco', 'Emanuel', 'Sophie', 'Mihaela', 'Giuseppe', 'Buse Naz'],
    moments: [
      {
        id: 'arrival-courtyard',
        timeLabel: 'Afternoon arrival',
        title: 'Suitcases in the courtyard',
        location: 'Stone Courtyard',
        tone: 'Nervous and warm',
        text: 'People arrive in small groups. Some hug friends. Some look for the right room. {you} hears many languages at the same time.',
        dialogue: [
          { speaker: 'Rocco', text: 'Welcome. Leave your bag near the desk. First, breathe. The week starts now, but nobody needs to be perfect.' },
          { speaker: 'Sophie', text: 'I know no one yet. I am smiling too much because I am nervous.' },
          { speaker: 'Mihaela', text: 'Same. Maybe we can be nervous together. That is already a small team.' },
        ],
      },
      {
        id: 'arrival-evening-circle',
        timeLabel: 'Evening circle',
        title: 'Names, mistakes, and first laughs',
        location: 'Common Room',
        tone: 'Informal start',
        text: 'After dinner, Emanuel asks everyone to say their name and one thing they hope will happen this week.',
        dialogue: [
          { speaker: 'Emanuel', text: 'Before board games, we need a room where people can try, fail, and laugh safely.' },
          { speaker: 'Giuseppe', text: 'My hope is simple: I want to understand the rules before I lose.' },
          { speaker: 'Buse Naz', text: 'I hope we do not sit all week. A game should make us move at least sometimes.' },
          { speaker: 'Narrator', text: '{you} notices who speaks fast, who waits, and who needs a softer invitation.' },
        ],
      },
    ],
    choices: [
      {
        id: 'connect-courtyard',
        label: 'Enter the circle',
        intention: 'Ask Sophie and Mihaela what kind of game they want to build.',
        effects: { trust: 10, inclusion: 8, energy: -2, learning: 4 },
        flags: ['builtAlliance', 'includedQuietVoice'],
        next: 'circle-connect',
        feedback: 'You used attention as the first game move. It created trust.',
      },
      {
        id: 'observe-courtyard',
        label: 'Observe first',
        intention: 'Stay quiet, map who speaks, and wait before joining.',
        effects: { clarity: 6, inclusion: 4, energy: -4 },
        flags: ['watchedGroup'],
        next: 'circle-distance',
        feedback: 'You saw useful patterns, but the group did not yet feel your presence.',
      },
      {
        id: 'stay-familiar',
        label: 'Stay with familiar voices',
        intention: 'Talk with people who feel easy and avoid the first awkward moment.',
        effects: { energy: 8, trust: -4, inclusion: -8 },
        flags: ['ignoredTeam'],
        next: 'circle-familiar',
        feedback: 'Comfort helped your energy, but narrowed the first bridge to the group.',
      },
    ],
  },
  'circle-connect': {
    id: 'circle-connect',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'The Mixed Team',
    location: 'Activity Room',
    speaker: 'Emanuel',
    text: 'Emanuel forms mixed teams. {you} sits with Sophie, Mihaela, Rasim Hamza, Cristina, and Gjoko. The team must choose a topic for a board game.',
    cast: ['Emanuel', 'Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'circle-connect-breakfast',
        timeLabel: 'Morning breakfast',
        title: 'A table with too many cups',
        location: 'Breakfast Room',
        tone: 'Friendly and unsure',
        text: 'The team meets before the workshop. Someone spills sugar. Someone translates a word. The table becomes less formal.',
        dialogue: [
          { speaker: 'Sophie', text: 'I can explain better with my hands than with English this morning.' },
          { speaker: 'Mihaela', text: 'Use your hands. We will understand the idea first and fix the words later.' },
          { speaker: 'Rasim Hamza', text: 'Good. My brain is still loading. Coffee is doing a software update.' },
        ],
      },
      {
        id: 'circle-connect-workshop',
        timeLabel: 'Late morning workshop',
        title: 'One topic from many needs',
        location: 'Activity Room',
        tone: 'Focused',
        text: 'Emanuel asks the group to choose a real need, not just a nice title for a poster.',
        dialogue: [
          { speaker: 'Emanuel', text: 'Do not choose the loudest topic. Choose a need that your players can feel through a rule.' },
          { speaker: 'Cristina', text: 'Inclusion and misinformation can meet. A wrong signal can make the group ignore someone.' },
          { speaker: 'Gjoko', text: 'Then it can become an action in the game, not only a speech after the game.' },
        ],
      },
    ],
    choices: [
      {
        id: 'map-needs',
        label: 'Map the needs',
        intention: 'Give each person one minute to explain the need behind their topic.',
        effects: { trust: 12, inclusion: 12, clarity: 8, learning: 8, energy: -4 },
        flags: ['sharedRoles', 'learningInsideMechanic'],
        next: 'team-shared',
        feedback: 'The team did not choose the loudest idea. They started from real needs.',
      },
      {
        id: 'take-structure',
        label: 'Take the structure role',
        intention: 'Offer to write the rules because the team needs order now.',
        effects: { clarity: 12, energy: 2, trust: -4, inclusion: -6 },
        flags: ['soloDesigner'],
        next: 'team-solo',
        feedback: 'The rules became clearer, but the game started to feel like one person made all the choices.',
      },
      {
        id: 'choose-funniest',
        label: 'Choose the funniest topic',
        intention: 'Push the idea that will make players laugh quickest.',
        effects: { energy: 12, trust: 2, clarity: -6, learning: -10 },
        flags: ['funFirst'],
        next: 'team-fun',
        feedback: 'The room got louder. The learning target got thinner.',
      },
    ],
  },
  'circle-distance': {
    id: 'circle-distance',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'Quiet Notes, Loud Table',
    location: 'Activity Room',
    speaker: 'Narrator',
    text: '{you} understands the group dynamics, but the team has already started to move without a clear invitation.',
    cast: ['Emanuel', 'Kaotar', 'Elena', 'Ethan', 'Stefan', 'Loredana'],
    moments: [
      {
        id: 'circle-distance-morning',
        timeLabel: 'Morning workshop',
        title: 'Good notes, quiet chair',
        location: 'Activity Room',
        tone: 'Careful',
        text: '{you} writes useful notes, but the team is already speaking across the table.',
        dialogue: [
          { speaker: 'Kaotar', text: 'We need to choose soon. If we open ten ideas, we will build zero games.' },
          { speaker: 'Elena', text: 'I have an idea, but I need an example. The words are slow today.' },
          { speaker: 'Ethan', text: 'Slow is fine. Give us one story, not a perfect sentence.' },
        ],
      },
      {
        id: 'circle-distance-lunch',
        timeLabel: 'Lunch break',
        title: 'The seat beside Elena',
        location: 'Lunch Table',
        tone: 'Small repair',
        text: 'At lunch, Elena sketches a small map on a napkin. It is clearer than the morning discussion.',
        dialogue: [
          { speaker: 'Elena', text: 'This is what I meant. One player has information, but another player pays the cost.' },
          { speaker: 'Loredana', text: 'Now I see it. You needed paper, not more pressure.' },
          { speaker: 'Narrator', text: '{you} can still help the idea enter the team before it is too late.' },
        ],
      },
    ],
    choices: [
      {
        id: 'invite-elena',
        label: 'Invite Elena in',
        intention: 'Ask Elena to explain the complicated idea with one example.',
        effects: { trust: 10, inclusion: 14, learning: 8, clarity: 2 },
        flags: ['includedQuietVoice', 'builtAlliance'],
        next: 'team-shared',
        feedback: 'A quiet idea became shared material.',
      },
      {
        id: 'write-alone',
        label: 'Write a clean concept alone',
        intention: 'Use your notes to create a complete concept before the group drifts.',
        effects: { clarity: 14, energy: -4, trust: -8, inclusion: -8 },
        flags: ['soloDesigner', 'ignoredTeam'],
        next: 'team-solo',
        feedback: 'The concept became neat, but the group did not feel inside it.',
      },
      {
        id: 'follow-loud',
        label: 'Follow the loud idea',
        intention: 'Let Ethan and Stefan lead with the energetic proposal.',
        effects: { energy: 10, trust: 2, learning: -8, inclusion: -6 },
        flags: ['funFirst', 'ignoredTeam'],
        next: 'team-fun',
        feedback: 'Momentum replaced shared intention.',
      },
    ],
  },
  'circle-familiar': {
    id: 'circle-familiar',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'The Easy Corner',
    location: 'Coffee Break Table',
    speaker: 'Rocco',
    text: 'Rocco brings biscuits. {you} is comfortable, but the mixed team is forming on the other side of the room.',
    cast: ['Rocco', 'Claudia', 'Giuseppe', 'Buse Naz', 'Ognjen'],
    moments: [
      {
        id: 'circle-familiar-coffee',
        timeLabel: 'Morning coffee',
        title: 'The easy corner',
        location: 'Coffee Break Table',
        tone: 'Comfortable',
        text: 'The coffee table is warm and easy. People laugh about travel delays and try to remember names.',
        dialogue: [
          { speaker: 'Claudia', text: 'I already forgot three names. I may need name tags for the name tags.' },
          { speaker: 'Giuseppe', text: 'Stay here. We have biscuits and no decisions.' },
          { speaker: 'Rocco', text: 'Biscuits are useful, but the mixed team is filling up without you.' },
        ],
      },
      {
        id: 'circle-familiar-midday',
        timeLabel: 'Before lunch',
        title: 'The team starts without you',
        location: 'Activity Room Door',
        tone: 'Gentle pressure',
        text: 'From the doorway, {you} sees a new group choosing roles. There is still one empty chair.',
        dialogue: [
          { speaker: 'Buse Naz', text: 'I want the game to be funny first. If people laugh, they relax.' },
          { speaker: 'Ognjen', text: 'Yes, but someone must hold the structure, or we will only have funny fragments.' },
          { speaker: 'Rocco', text: 'You can enter with a question. That is less heavy than entering with a full plan.' },
        ],
      },
    ],
    choices: [
      {
        id: 'repair-entry',
        label: 'Repair the entry',
        intention: 'Move to the mixed team and ask what role is still missing.',
        effects: { trust: 6, inclusion: 8, clarity: 4, energy: -2 },
        flags: ['builtAlliance'],
        next: 'team-shared',
        feedback: 'You arrived late, but you entered with a useful question.',
      },
      {
        id: 'keep-control',
        label: 'Offer a ready plan',
        intention: 'Tell the team you already have a structure to save time.',
        effects: { clarity: 12, trust: -8, inclusion: -10, energy: 2 },
        flags: ['soloDesigner', 'ignoredTeam'],
        next: 'team-solo',
        feedback: 'The plan saved time, but other people felt less involved.',
      },
      {
        id: 'make-party-game',
        label: 'Make a party game',
        intention: 'Build around fast laughter and simple challenges.',
        effects: { energy: 14, learning: -12, clarity: -4 },
        flags: ['funFirst'],
        next: 'team-fun',
        feedback: 'Everyone could imagine the fun. Nobody could yet name the learning.',
      },
    ],
  },
  'team-shared': {
    id: 'team-shared',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'A Board With Many Hands',
    location: 'Workshop Table',
    speaker: 'Sophie',
    text: 'The team chooses a board game about inclusion and misinformation. Players must decide whom to trust, who to invite, and when to check a source.',
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'team-shared-morning',
        timeLabel: 'Morning build',
        title: 'Paper everywhere',
        location: 'Workshop Table',
        tone: 'Busy and shared',
        text: 'The table fills with paper arrows, coins, and half-written cards. Nobody owns the whole idea, and that makes the work slower but richer.',
        dialogue: [
          { speaker: 'Sophie', text: 'What if each player sees only part of the information?' },
          { speaker: 'Rasim Hamza', text: 'Then checking a source is not a quiz. It is a move you choose when you feel pressure.' },
          { speaker: 'Mihaela', text: 'And if players ignore one person too long, the team should feel the cost.' },
        ],
      },
      {
        id: 'team-shared-evening',
        timeLabel: 'After dinner',
        title: 'The rule on the napkin',
        location: 'Courtyard Steps',
        tone: 'Relaxed discovery',
        text: 'The team stops working, but the game follows them outside. Cristina draws a turn order on a napkin while people share snacks.',
        dialogue: [
          { speaker: 'Cristina', text: 'Maybe the question is simple: do we win faster alone, or better together?' },
          { speaker: 'Gjoko', text: 'That is a good rule. Also, this napkin is now official project material.' },
          { speaker: 'Narrator', text: '{you} sees that informal time can carry the project too.' },
        ],
      },
    ],
    choices: [
      {
        id: 'test-ugly-loop',
        label: 'Playtest the ugly loop',
        intention: 'Use paper, coins, and six cards to test one full round now.',
        effects: { clarity: 14, learning: 12, trust: 6, energy: -4 },
        flags: ['usedPlaytest', 'learningInsideMechanic'],
        next: 'prototype-playtest',
        feedback: 'The rough loop showed what the rules really did.',
      },
      {
        id: 'divide-shared-roles',
        label: 'Divide roles clearly',
        intention: 'Assign rules, board, cards, and reflection question to different people.',
        effects: { trust: 8, inclusion: 8, clarity: 8, energy: 2 },
        flags: ['sharedRoles'],
        next: 'prototype-playtest',
        feedback: 'Shared work became a visible system.',
      },
      {
        id: 'decorate-first',
        label: 'Make it beautiful first',
        intention: 'Create cards, colors, and board spaces before testing.',
        effects: { energy: -6, clarity: 4, learning: -8, trust: -2 },
        flags: ['polishedBeforeTesting'],
        next: 'prototype-polish',
        feedback: 'The table looked better, but nobody knew if the main rule worked.',
      },
    ],
  },
  'team-solo': {
    id: 'team-solo',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'The Prototype in One Notebook',
    location: 'Quiet Corner',
    speaker: 'Narrator',
    text: '{you} writes a strong rule structure. The team watches and helps a little. Slowly, they become an audience.',
    cast: ['Kiril', 'Hatche', 'Liviu', 'Claudia', 'Mehmet Emin'],
    moments: [
      {
        id: 'team-solo-morning',
        timeLabel: 'Morning build',
        title: 'One notebook, many eyes',
        location: 'Quiet Corner',
        tone: 'Productive but tight',
        text: '{you} writes fast. The rules become clearer, but the table becomes quieter.',
        dialogue: [
          { speaker: 'Kiril', text: 'I can follow the rule system. I just do not know where my idea can enter.' },
          { speaker: 'Hatche', text: 'Can we touch the prototype before it becomes too finished?' },
          { speaker: 'Mehmet Emin', text: 'If only one person can explain it, players will depend on that person too.' },
        ],
      },
      {
        id: 'team-solo-evening',
        timeLabel: 'Evening walk',
        title: 'The quiet walk back',
        location: 'Street Outside the Borgo',
        tone: 'Tired and honest',
        text: 'After dinner, the group walks back from the small square. Nobody argues, but nobody talks about the game either.',
        dialogue: [
          { speaker: 'Liviu', text: 'The board may be ready tomorrow. I am less sure about us.' },
          { speaker: 'Claudia', text: 'Maybe people are silent because they agree. Or maybe they are tired of asking.' },
          { speaker: 'Narrator', text: '{you} still has time to open the notebook to the team.' },
        ],
      },
    ],
    choices: [
      {
        id: 'open-notebook',
        label: 'Open the notebook',
        intention: 'Stop writing and ask each person to change one rule.',
        effects: { trust: 10, inclusion: 12, clarity: -2, learning: 6 },
        flags: ['sharedRoles', 'includedQuietVoice'],
        next: 'prototype-playtest',
        feedback: 'Control became invitation. The prototype got messier and healthier.',
      },
      {
        id: 'finish-alone',
        label: 'Build alone tonight',
        intention: 'Finish the board yourself so the team has something complete.',
        effects: { clarity: 16, energy: -12, trust: -12, inclusion: -14 },
        flags: ['soloDesigner'],
        next: 'prototype-alone',
        feedback: 'The prototype moved forward, but the team moved backward.',
      },
      {
        id: 'make-polished-board',
        label: 'Polish the board',
        intention: 'Use the clean rules to create a beautiful final board.',
        effects: { clarity: 8, energy: -8, learning: -8, inclusion: -6 },
        flags: ['polishedBeforeTesting'],
        next: 'prototype-polish',
        feedback: 'The board looked official before players had tested if it worked.',
      },
    ],
  },
  'team-fun': {
    id: 'team-fun',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'The Laughing Prototype',
    location: 'Courtyard Table',
    speaker: 'Buse Naz',
    text: 'The team creates fast challenges, jokes, and silly penalties. People laugh, but Emanuel asks where the youth-work learning sits inside the rules.',
    cast: ['Buse Naz', 'Ethan', 'Stefan', 'Loredana', 'Emanuel'],
    moments: [
      {
        id: 'team-fun-morning',
        timeLabel: 'Morning energy',
        title: 'The loud prototype',
        location: 'Courtyard Table',
        tone: 'Playful',
        text: 'The table becomes loud quickly. People test silly penalties before the rules are written.',
        dialogue: [
          { speaker: 'Ethan', text: 'If people run, laugh, and shout, nobody will sleep through our game.' },
          { speaker: 'Buse Naz', text: 'Good. I do not want another serious poster pretending to be a game.' },
          { speaker: 'Stefan', text: 'I volunteer to test any rule that includes dramatic failure.' },
        ],
      },
      {
        id: 'team-fun-late',
        timeLabel: 'Late afternoon',
        title: 'The laugh after the laugh',
        location: 'Activity Room Window',
        tone: 'Playful with doubt',
        text: 'The jokes still work, but Loredana watches the paper cards and asks what players will remember tomorrow.',
        dialogue: [
          { speaker: 'Loredana', text: 'I like the energy. I just cannot see the learning yet.' },
          { speaker: 'Emanuel', text: 'Do not remove the fun. Give the fun a job inside the rule.' },
          { speaker: 'Narrator', text: '{you} can protect the laughter or help it carry a clearer message.' },
        ],
      },
    ],
    choices: [
      {
        id: 'add-learning-rule',
        label: 'Put learning inside one rule',
        intention: 'Add a rule where players must include a quiet voice to unlock progress.',
        effects: { learning: 14, inclusion: 10, clarity: 4, energy: -2 },
        flags: ['learningInsideMechanic', 'includedQuietVoice'],
        next: 'prototype-playtest',
        feedback: 'The message moved from explanation into play.',
      },
      {
        id: 'sell-party-energy',
        label: 'Protect the fun',
        intention: 'Keep the game fast and trust the final reflection to explain the meaning later.',
        effects: { energy: 12, learning: -12, clarity: -6 },
        flags: ['funFirst'],
        next: 'prototype-polish',
        feedback: 'The game stayed funny, but its message was delayed.',
      },
      {
        id: 'copy-classic',
        label: 'Copy a known board game',
        intention: 'Use familiar rules and paste the project topic on top.',
        effects: { clarity: 8, energy: 4, learning: -14, inclusion: -4 },
        flags: ['reskinnedGame'],
        next: 'prototype-polish',
        feedback: 'Players understood the structure, but the topic did not change how the game worked.',
      },
    ],
  },
  'prototype-playtest': {
    id: 'prototype-playtest',
    chapter: 'Chapter 4',
    dayLabel: 'Day 4',
    title: 'The First Test Breaks Something',
    location: 'Activity Room Floor',
    speaker: 'Tester',
    text: 'Mihaela and Sophie test the first round. A player is blocked for three turns and says the game feels unfair.',
    cast: ['Mihaela', 'Sophie', 'Gjoko', 'Cristina', 'Emanuel'],
    moments: [
      {
        id: 'prototype-playtest-morning',
        timeLabel: 'Morning test',
        title: 'The first round breaks',
        location: 'Activity Room Floor',
        tone: 'Useful tension',
        text: 'The team sits on the floor with paper cards. The first player gets blocked and cannot do anything for three turns.',
        dialogue: [
          { speaker: 'Sophie', text: 'I understand the topic, but on my turn I do not know what choice I have.' },
          { speaker: 'Gjoko', text: 'Maybe that is the problem. The blocked player can only wait.' },
          { speaker: 'Mihaela', text: 'Then we are repeating exclusion, not helping players notice it.' },
        ],
      },
      {
        id: 'prototype-playtest-evening',
        timeLabel: 'Evening debrief',
        title: 'Feedback over cold pizza',
        location: 'Common Room',
        tone: 'Tired but open',
        text: 'The team eats leftover pizza and talks about the test. The unfair rule is still annoying, but now everyone can see it.',
        dialogue: [
          { speaker: 'Cristina', text: 'I was frustrated during the test, but that frustration gave us information.' },
          { speaker: 'Emanuel', text: 'Good feedback is not always polite. Ask what the discomfort is showing you.' },
          { speaker: 'Narrator', text: '{you} can treat the conflict as data, defend the rule, or postpone the tension.' },
        ],
      },
    ],
    choices: [
      {
        id: 'turn-feedback-data',
        label: 'Turn feedback into data',
        intention: 'Ask what felt unfair, then change the rule immediately.',
        effects: { trust: 12, clarity: 10, inclusion: 8, learning: 10 },
        flags: ['usedPlaytest', 'clearDebrief'],
        next: 'conflict-listen',
        feedback: 'The conflict became design material.',
      },
      {
        id: 'defend-balance',
        label: 'Defend the balance',
        intention: 'Explain that losing turns is part of the challenge.',
        effects: { clarity: -4, trust: -12, inclusion: -10, learning: -6 },
        flags: ['ignoredFeedback'],
        next: 'conflict-control',
        feedback: 'You protected the rules and lost information from players.',
      },
      {
        id: 'pause-tension',
        label: 'Pause the tension',
        intention: 'Say the team will fix it later and move to materials now.',
        effects: { energy: 4, trust: -8, clarity: -8, learning: -4 },
        flags: ['avoidedConflict'],
        next: 'conflict-avoid',
        feedback: 'The room felt calmer, but the problem did not leave.',
      },
    ],
  },
  'prototype-polish': {
    id: 'prototype-polish',
    chapter: 'Chapter 4',
    dayLabel: 'Day 4',
    title: 'Beautiful Cards, Unclear Turns',
    location: 'Workshop Table',
    speaker: 'Giuseppe',
    text: 'The board has colors, icons, and a name. Then Giuseppe tries one turn and asks what he is allowed to do.',
    cast: ['Giuseppe', 'Kaotar', 'Stasa', 'Stefan', 'Emanuel'],
    moments: [
      {
        id: 'prototype-polish-morning',
        timeLabel: 'Morning table',
        title: 'A board that looks finished',
        location: 'Workshop Table',
        tone: 'Proud and uncertain',
        text: 'The board has colors, icons, and a title. It looks ready from far away. Up close, the first turn is still unclear.',
        dialogue: [
          { speaker: 'Giuseppe', text: 'It looks finished, but when I start, I do not know what I am allowed to do.' },
          { speaker: 'Kaotar', text: 'Maybe there are too many cards. The player is reading more than deciding.' },
          { speaker: 'Stasa', text: 'Can we remove half of it and test only one round?' },
        ],
      },
      {
        id: 'prototype-polish-night',
        timeLabel: 'After dinner',
        title: 'The beautiful box',
        location: 'Materials Table',
        tone: 'Tempted',
        text: 'Someone finds better markers and a small box for the cards. The prototype suddenly looks more official than it feels.',
        dialogue: [
          { speaker: 'Stefan', text: 'If the box looks professional, maybe people will trust the rules.' },
          { speaker: 'Emanuel', text: 'A nice box can help later. First, make the player action clear.' },
          { speaker: 'Narrator', text: '{you} can cut the game back, hide the weak part, or invite players to fix it.' },
        ],
      },
    ],
    choices: [
      {
        id: 'cut-to-core',
        label: 'Cut to the core loop',
        intention: 'Remove half the cards and test only goal, choice, feedback.',
        effects: { clarity: 14, learning: 10, trust: 6, energy: -4 },
        flags: ['usedPlaytest', 'learningInsideMechanic'],
        next: 'conflict-listen',
        feedback: 'Removing content made the real game visible.',
      },
      {
        id: 'hide-weakness',
        label: 'Hide the weak rule',
        intention: 'Prepare a confident presentation and hope players do not notice.',
        effects: { clarity: -10, trust: -10, learning: -8, energy: 4 },
        flags: ['hidFailure', 'polishedBeforeTesting'],
        next: 'conflict-control',
        feedback: 'The prototype looked safer than it was.',
      },
      {
        id: 'ask-co-design',
        label: 'Ask for co-design',
        intention: 'Invite Stasa and Stefan to change the unclear turn with you.',
        effects: { trust: 10, inclusion: 10, clarity: 6, learning: 6 },
        flags: ['sharedRoles', 'usedPlaytest'],
        next: 'conflict-listen',
        feedback: 'Players became co-designers, not judges.',
      },
    ],
  },
  'prototype-alone': {
    id: 'prototype-alone',
    chapter: 'Chapter 4',
    dayLabel: 'Night 4',
    title: 'The Solo Table',
    location: 'Common Room',
    speaker: 'Narrator',
    text: 'After dinner, {you} keeps working alone. The prototype becomes complete, but the empty chairs around the table become part of the story.',
    cast: ['Rocco', 'Liviu', 'Claudia', 'Kiril'],
    moments: [
      {
        id: 'prototype-alone-after-dinner',
        timeLabel: 'After dinner',
        title: 'The empty chairs',
        location: 'Common Room',
        tone: 'Quiet pressure',
        text: '{you} keeps working after the others leave. The board becomes clearer, but the chairs around the table stay empty.',
        dialogue: [
          { speaker: 'Rocco', text: 'Still working? I admire the effort. But this week is not only about having an object tomorrow.' },
          { speaker: 'Liviu', text: 'I can test one round if you want. I just do not know what your team agreed on.' },
          { speaker: 'Claudia', text: 'The rules are clear when you explain them. Can the team explain them without you?' },
        ],
      },
      {
        id: 'prototype-alone-late-night',
        timeLabel: 'Late night',
        title: 'The message in the group chat',
        location: 'Dorm Corridor',
        tone: 'Vulnerable',
        text: 'The corridor is quiet. A message to the team chat is still unwritten: "I need help, not perfection."',
        dialogue: [
          { speaker: 'Kiril', text: 'Maybe the question is not: is it finished? Maybe it is: who can carry it?' },
          { speaker: 'Narrator', text: '{you} can invite a late test, finish alone, or admit the work is stuck.' },
        ],
      },
    ],
    choices: [
      {
        id: 'invite-late-test',
        label: 'Invite a late test',
        intention: 'Ask Liviu and Claudia to break the game before tomorrow.',
        effects: { clarity: 8, learning: 8, trust: 4, energy: -6 },
        flags: ['usedPlaytest'],
        next: 'conflict-listen',
        feedback: 'A late test helped the learning, but the team still did not fully own the game.',
      },
      {
        id: 'finish-solo',
        label: 'Finish it alone',
        intention: 'Complete the board, rules, and reflection question without waking the team.',
        effects: { clarity: 12, energy: -14, trust: -14, inclusion: -14 },
        flags: ['soloDesigner', 'hidFailure'],
        next: 'night-solo',
        feedback: 'The game became finished and lonely.',
      },
      {
        id: 'admit-stuck',
        label: 'Admit you are stuck',
        intention: 'Write to the team chat: I need help, not perfection.',
        effects: { trust: 12, inclusion: 8, learning: 8, clarity: -2 },
        flags: ['sharedRoles', 'clearDebrief'],
        next: 'night-repair',
        feedback: 'Vulnerability reopened collaboration.',
      },
    ],
  },
  'conflict-listen': {
    id: 'conflict-listen',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'Repair Through Listening',
    location: 'Courtyard',
    speaker: 'Cristina',
    text: 'The team names the conflict: some players have power, others wait. Now the board game can change.',
    cast: ['Cristina', 'Mihaela', 'Sophie', 'Gjoko', 'Emanuel'],
    moments: [
      {
        id: 'conflict-listen-morning',
        timeLabel: 'Morning repair',
        title: 'Naming the unfair part',
        location: 'Courtyard',
        tone: 'Honest',
        text: 'The team sits outside because the activity room feels too hot. The conflict sounds less scary in fresh air.',
        dialogue: [
          { speaker: 'Cristina', text: 'The unfair part was uncomfortable, but it helped us see the real topic.' },
          { speaker: 'Sophie', text: 'I do not want players to only feel stuck. I want them to have a way to respond.' },
          { speaker: 'Gjoko', text: 'Then we need a repair move. A player can spend a turn to bring someone back.' },
        ],
      },
      {
        id: 'conflict-listen-afternoon',
        timeLabel: 'Late afternoon',
        title: 'Testing the repair move',
        location: 'Activity Room Floor',
        tone: 'Careful hope',
        text: 'The team tries the new repair move. The game is still rough, but the blocked player can act again.',
        dialogue: [
          { speaker: 'Mihaela', text: 'Now the hard feeling has a door out. That changes everything.' },
          { speaker: 'Emanuel', text: 'Exactly. The rule carries the message: exclusion is visible, and repair is possible.' },
          { speaker: 'Narrator', text: '{you} can strengthen the repair move or keep the painful rule as a lesson.' },
        ],
      },
    ],
    choices: [
      {
        id: 'design-repair-move',
        label: 'Design a repair move',
        intention: 'Add a rule where players can invite a blocked player back into action.',
        effects: { inclusion: 12, learning: 12, clarity: 8, trust: 8 },
        flags: ['learningInsideMechanic', 'clearDebrief'],
        next: 'night-repair',
        feedback: 'The message became playable.',
      },
      {
        id: 'keep-as-lesson',
        label: 'Keep unfairness as lesson',
        intention: 'Keep the painful rule and explain it in the final reflection.',
        effects: { learning: 8, trust: -6, inclusion: -8, clarity: -4 },
        flags: ['clearDebrief'],
        next: 'night-honest',
        feedback: 'The reflection may work, but the play experience still hurts.',
      },
    ],
  },
  'conflict-control': {
    id: 'conflict-control',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'Control Costs Trust',
    location: 'Workshop Table',
    speaker: 'Kiril',
    text: 'The team follows the rules, but nobody argues anymore. That silence is not agreement.',
    cast: ['Kiril', 'Hatche', 'Mehmet Emin', 'Buse Naz'],
    moments: [
      {
        id: 'conflict-control-morning',
        timeLabel: 'Morning build',
        title: 'A quiet table',
        location: 'Workshop Table',
        tone: 'Controlled',
        text: 'The team follows the rulebook. The board moves forward, but nobody suggests changes anymore.',
        dialogue: [
          { speaker: 'Kiril', text: 'I can present the rulebook, but I do not feel this is our game.' },
          { speaker: 'Hatche', text: 'I stopped suggesting changes because every change felt like a problem.' },
          { speaker: 'Mehmet Emin', text: 'The game is controlled, yes. But controlled by whom?' },
        ],
      },
      {
        id: 'conflict-control-dinner',
        timeLabel: 'Dinner',
        title: 'Polite silence',
        location: 'Dinner Table',
        tone: 'Distant',
        text: 'At dinner, the group talks about music and travel. Nobody mentions the prototype until Buse Naz pushes her plate away.',
        dialogue: [
          { speaker: 'Buse Naz', text: 'It needs life. Right now players may follow it, but not care about it.' },
          { speaker: 'Narrator', text: '{you} can give the next decision back to the team, or protect the final form.' },
        ],
      },
    ],
    choices: [
      {
        id: 'return-ownership',
        label: 'Return the game to the team',
        intention: 'Give the team the next decision, even if it changes your rules.',
        effects: { trust: 12, inclusion: 12, energy: -4, clarity: -2 },
        flags: ['sharedRoles'],
        next: 'night-repair',
        feedback: 'The game became less controlled and more shared.',
      },
      {
        id: 'protect-final-form',
        label: 'Protect the final form',
        intention: 'Keep the rulebook stable so the showcase is not chaotic.',
        effects: { clarity: 10, trust: -12, inclusion: -10, learning: -6 },
        flags: ['soloDesigner', 'hidFailure'],
        next: 'night-solo',
        feedback: 'The prototype became stable. The team became distant.',
      },
    ],
  },
  'conflict-avoid': {
    id: 'conflict-avoid',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'The Conflict Returns',
    location: 'Dinner Table',
    speaker: 'Loredana',
    text: 'The team tries to relax, but the same problem returns during dinner. Someone says they do not want to present tomorrow.',
    cast: ['Loredana', 'Elena', 'Ognjen', 'Rocco'],
    moments: [
      {
        id: 'conflict-avoid-afternoon',
        timeLabel: 'Late afternoon',
        title: 'The problem waits',
        location: 'Workshop Door',
        tone: 'Uneasy',
        text: 'The team packs materials quickly. The disagreement is not solved, but everyone acts like the next task will fix it.',
        dialogue: [
          { speaker: 'Elena', text: 'We said we would speak later. Later is becoming very close.' },
          { speaker: 'Ognjen', text: 'If we speak now, maybe we lose time. If we do not speak, maybe we lose the team.' },
        ],
      },
      {
        id: 'conflict-avoid-dinner',
        timeLabel: 'Dinner',
        title: 'The sentence nobody wanted',
        location: 'Dinner Table',
        tone: 'Direct',
        text: 'The same problem returns during dinner. The plates are still full when Loredana says she may not present tomorrow.',
        dialogue: [
          { speaker: 'Loredana', text: 'I do not want to stand tomorrow and explain a game I do not believe in.' },
          { speaker: 'Rocco', text: 'You still have tonight. Use it for honesty, not panic.' },
          { speaker: 'Narrator', text: '{you} can host a real conversation or smooth things over again.' },
        ],
      },
    ],
    choices: [
      {
        id: 'host-honest-circle',
        label: 'Host an honest circle',
        intention: 'Ask what each person needs to present with dignity.',
        effects: { trust: 10, inclusion: 12, learning: 8, energy: -6 },
        flags: ['clearDebrief', 'sharedRoles'],
        next: 'night-honest',
        feedback: 'Avoided conflict became a late but real conversation.',
      },
      {
        id: 'smooth-over-again',
        label: 'Smooth it over again',
        intention: 'Say tomorrow will be fine and keep people calm.',
        effects: { energy: 4, trust: -12, clarity: -8, learning: -8 },
        flags: ['avoidedConflict', 'hidFailure'],
        next: 'night-solo',
        feedback: 'Calm without repair became a countdown.',
      },
    ],
  },
  'night-repair': {
    id: 'night-repair',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'The Game Finds Its Shape',
    location: 'Common Room',
    speaker: 'Narrator',
    text: 'The team cuts rules, tests again, and adds one clear reflection question. The board is simple, but everyone can explain why it exists.',
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'night-repair-evening',
        timeLabel: 'After dinner',
        title: 'Cutting the game smaller',
        location: 'Common Room',
        tone: 'Focused relief',
        text: 'The team removes cards, crosses out rules, and keeps only the strongest player choice.',
        dialogue: [
          { speaker: 'Sophie', text: 'Now each turn has a real choice: move faster alone, or help someone re-enter the game.' },
          { speaker: 'Rasim Hamza', text: 'Checking information costs time, but it protects group trust.' },
          { speaker: 'Cristina', text: 'Good. The tension is still there, but one player is not punished forever.' },
        ],
      },
      {
        id: 'night-repair-late',
        timeLabel: 'Late night',
        title: 'Everyone can explain it',
        location: 'Common Room Sofa',
        tone: 'Tired and proud',
        text: 'The board is simple now. People are tired, but each person can explain one part without looking at {you}.',
        dialogue: [
          { speaker: 'Mihaela', text: 'This finally feels like our project, not only our topic.' },
          { speaker: 'Gjoko', text: 'Also, we should sleep before we improve it into a disaster.' },
          { speaker: 'Narrator', text: '{you} can present as a team or lead while clearly crediting the others.' },
        ],
      },
    ],
    choices: [
      {
        id: 'present-as-team',
        label: 'Present as a team',
        intention: 'Let each person explain one part: rules, feeling, learning, reflection.',
        effects: { trust: 10, inclusion: 10, clarity: 6, learning: 8, energy: -2 },
        flags: ['sharedRoles', 'clearDebrief'],
        next: 'showcase',
        feedback: 'The showcase became shared work.',
      },
      {
        id: 'lead-but-credit',
        label: 'Lead and credit others',
        intention: 'Facilitate the presentation while naming each person contribution.',
        effects: { clarity: 8, trust: 4, inclusion: 4, learning: 6 },
        flags: ['clearDebrief'],
        next: 'showcase',
        feedback: 'Leadership supported the team instead of replacing it.',
      },
    ],
  },
  'night-solo': {
    id: 'night-solo',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'Finished, But Alone',
    location: 'Activity Room',
    speaker: 'Narrator',
    text: '{you} has a playable board. The pieces are aligned. The rulebook is ready. The team is not.',
    cast: ['Claudia', 'Kiril', 'Hatche', 'Rocco'],
    moments: [
      {
        id: 'night-solo-evening',
        timeLabel: 'Evening setup',
        title: 'The board is ready',
        location: 'Activity Room',
        tone: 'Impressive but lonely',
        text: '{you} aligns the pieces and checks the rulebook. The object is ready. The group story is not.',
        dialogue: [
          { speaker: 'Claudia', text: 'I can help present the board, but I do not know why every rule is there.' },
          { speaker: 'Kiril', text: 'The work is good. I just wish the work had included us earlier.' },
          { speaker: 'Hatche', text: 'Maybe tomorrow we should say that honestly. It is part of the learning.' },
        ],
      },
      {
        id: 'night-solo-late',
        timeLabel: 'Late night',
        title: 'Honesty or easy theatre',
        location: 'Empty Activity Room',
        tone: 'Heavy choice',
        text: 'The room is quiet. It would be easy to present the prototype as a group success. It would also be false.',
        dialogue: [
          { speaker: 'Rocco', text: 'A complete board is not always a complete project. Honest reflection can still save the lesson.' },
          { speaker: 'Narrator', text: '{you} can name the solo process or hide it behind a clean presentation.' },
        ],
      },
    ],
    choices: [
      {
        id: 'own-solo-choice',
        label: 'Present it honestly',
        intention: 'Say the prototype is mostly yours and ask the team to reflect on who made the choices.',
        effects: { learning: 10, trust: 2, clarity: 4 },
        flags: ['clearDebrief', 'soloDesigner'],
        next: 'showcase',
        feedback: 'Honesty turned a weak process into learning.',
      },
      {
        id: 'pretend-team-game',
        label: 'Pretend it was shared',
        intention: 'Present it as a group result and avoid the problem of who made the choices.',
        effects: { trust: -12, inclusion: -12, learning: -8, clarity: 2 },
        flags: ['hidFailure', 'soloDesigner'],
        next: 'showcase',
        feedback: 'The presentation looked easier, but the hidden story got heavier.',
      },
    ],
  },
  'night-honest': {
    id: 'night-honest',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'A Prototype That May Fail',
    location: 'Common Room',
    speaker: 'Emanuel',
    text: 'The team admits the game may not fully work. Emanuel does not rescue the prototype. He helps the group rescue the learning.',
    cast: ['Emanuel', 'Elena', 'Loredana', 'Ognjen', 'Rocco'],
    moments: [
      {
        id: 'night-honest-evening',
        timeLabel: 'After dinner',
        title: 'The honest table',
        location: 'Common Room',
        tone: 'Brave and nervous',
        text: 'The team admits the game may not work tomorrow. Nobody celebrates, but nobody pretends either.',
        dialogue: [
          { speaker: 'Emanuel', text: 'If the prototype is weak, do not pretend it is strong. Ask what the weakness teaches.' },
          { speaker: 'Elena', text: 'Then our reflection can ask: where did the system fail the players?' },
          { speaker: 'Loredana', text: 'That feels risky, but more honest than selling a game we do not trust.' },
        ],
      },
      {
        id: 'night-honest-late',
        timeLabel: 'Late night',
        title: 'A failure that can teach',
        location: 'Kitchen Doorway',
        tone: 'Calm acceptance',
        text: 'The team makes tea and writes one sentence on the box: "Help us fix this rule."',
        dialogue: [
          { speaker: 'Ognjen', text: 'We can show one broken round, then ask players to redesign the rule with us.' },
          { speaker: 'Rocco', text: 'That is not a perfect game. It can still be a strong learning moment.' },
          { speaker: 'Narrator', text: '{you} can show the failure openly or hide it and speak more than players play.' },
        ],
      },
    ],
    choices: [
      {
        id: 'show-failure-openly',
        label: 'Show failure openly',
        intention: 'Run one broken round, then invite players to redesign it.',
        effects: { learning: 16, trust: 8, inclusion: 8, clarity: -2 },
        flags: ['clearDebrief'],
        next: 'showcase',
        feedback: 'The failure became a learning device.',
      },
      {
        id: 'hide-failure-final',
        label: 'Hide the failure',
        intention: 'Shorten the playtest and speak more than players play.',
        effects: { clarity: -6, trust: -8, learning: -8, energy: 2 },
        flags: ['hidFailure'],
        next: 'showcase',
        feedback: 'The game avoided risk and lost its strongest lesson.',
      },
    ],
  },
  showcase: {
    id: 'showcase',
    chapter: 'Chapter 7',
    dayLabel: 'Final Day',
    title: 'The Games Are No Joke Showcase',
    location: 'Activity Room',
    speaker: 'Narrator',
    text: 'All teams gather. Chairs make a circle. Emanuel invites the final reflection. The board game is on the table, and the path behind it is now visible.',
    cast: ['Emanuel', 'Rocco', 'All Participants'],
    moments: [
      {
        id: 'showcase-morning',
        timeLabel: 'Morning setup',
        title: 'Tape, chairs, and nervous hands',
        location: 'Activity Room',
        tone: 'Anticipation',
        text: 'All teams prepare their tables. Someone fixes tape. Someone practices the first sentence. Everyone looks at the door when new players arrive.',
        dialogue: [
          { speaker: 'Emanuel', text: 'When you present, show the rule, the player choice, and the feeling it creates.' },
          { speaker: 'Rocco', text: 'Do not perform perfection. Let people see the learning inside the game.' },
          { speaker: 'Narrator', text: '{you} places the board on the table and remembers the path behind it.' },
        ],
      },
      {
        id: 'showcase-after',
        timeLabel: 'After the showcase',
        title: 'The circle after play',
        location: 'Activity Room Circle',
        tone: 'Reflective',
        text: 'The last players stand up. Chairs move into a circle again. The board is still on the table, but now the process is visible too.',
        dialogue: [
          { speaker: 'Emanuel', text: 'Now tell us what the players could feel, not only what they could win.' },
          { speaker: 'Rocco', text: 'After this, we move to YouthPass reflection. Let the last play tell the truth.' },
          { speaker: 'Narrator', text: '{you} has one final choice: present, sell the fun, or invite others to co-design the last rule.' },
        ],
      },
    ],
    choices: [
      {
        id: 'invite-play-reflect',
        label: 'Play, observe, reflect',
        intention: 'Let players play, watch silently, then ask what the system made visible.',
        effects: { trust: 8, inclusion: 8, learning: 10, clarity: 4 },
        flags: ['clearDebrief'],
        next: 'ending',
        feedback: 'The final activity connected rules to reflection.',
      },
      {
        id: 'pitch-fun-only',
        label: 'Pitch the fun',
        intention: 'Sell the game as the most energetic prototype in the room.',
        effects: { energy: 10, learning: -8, clarity: -4 },
        flags: ['funFirst'],
        next: 'ending',
        feedback: 'Players smiled quickly, but the learning frame weakened.',
      },
      {
        id: 'invite-co-design-final',
        label: 'Invite co-design',
        intention: 'Present the prototype as unfinished and ask players to improve one rule.',
        effects: { trust: 8, inclusion: 10, learning: 10, clarity: 2 },
        flags: ['usedPlaytest', 'clearDebrief'],
        next: 'ending',
        feedback: 'The final showcase became participation, not performance.',
      },
    ],
  },
};

const endings: Record<EndingId, Ending> = {
  'shared-board-game-success': {
    title: 'Shared Board Game Success',
    protagonistOutcome: '{you} helps the team work together. The idea belongs to the group.',
    boardGameOutcome: 'The board game is simple, playable, and clearly about inclusion and misinformation.',
    teamOutcome: 'The group presents together. Quiet voices are visible in the rules.',
    logic: 'You built trust, included people, tested early, shared roles, and put learning inside the rules.',
    howToReach: 'Build trust, share roles, test early, and make the lesson happen during play.',
    trainerReflection: 'Emanuel says: This is what game design can do in youth work. It can make participation visible.',
  },
  'solo-prototype-success': {
    title: 'Solo Prototype Success',
    protagonistOutcome: '{you} finishes a clear prototype, but too much work happens alone.',
    boardGameOutcome: 'The game works, but the reflection shows that the group did not fully own it.',
    teamOutcome: 'The team respects the effort, but some people feel like helpers instead of co-designers.',
    logic: 'You created clarity, but inclusion stayed low and many choices were made alone.',
    howToReach: 'Take control, finish the board mostly alone, and present with limited team involvement.',
    trainerReflection: 'Emanuel says: A good product is not always a good learning process. Who owned the design?',
  },
  'fun-game-weak-message': {
    title: 'Fun Game, Weak Message',
    protagonistOutcome: '{you} creates energy and laughter, but the youth-work lesson is not clear enough.',
    boardGameOutcome: 'The game is fun, but the topic mostly appears after play, in the explanation.',
    teamOutcome: 'The team enjoys the moment, but the reflection is weak.',
    logic: 'You chose fun many times. Energy was high, but learning stayed too low.',
    howToReach: 'Choose fun-first options, protect the party feeling, and skip strong learning rules.',
    trainerReflection: 'Emanuel says: Keep the fun. Now redesign one rule so the lesson happens during play.',
  },
  'beautiful-board-broken-rules': {
    title: 'Beautiful Board, Broken Rules',
    protagonistOutcome: '{you} helps make a board that looks ready before it is really playable.',
    boardGameOutcome: 'The prototype looks good, but players do not understand what to do on their turn.',
    teamOutcome: 'The group loses confidence when the first players are confused.',
    logic: 'The team polished too early and hid weak rules instead of testing them.',
    howToReach: 'Decorate early, avoid testing the basic turn, and hide unclear rules before the showcase.',
    trainerReflection: 'Emanuel says: A prototype is not a poster. First make the player action clear.',
  },
  'conflict-breaks-team': {
    title: 'Conflict Breaks the Team',
    protagonistOutcome: '{you} avoids or controls tension until the group cannot learn from it.',
    boardGameOutcome: 'The game reaches the table, but the team cannot present it with real trust.',
    teamOutcome: 'Some participants step back. The conflict becomes the real lesson.',
    logic: 'Conflict was avoided, feedback was ignored, and trust and inclusion became too low.',
    howToReach: 'Avoid disagreement, defend the rules, and do not repair the group process before the showcase.',
    trainerReflection: 'Emanuel says: Conflict is not failure. Conflict can give useful information if the team uses it.',
  },
  'failed-prototype-strong-learning': {
    title: 'Failed Prototype, Strong Learning',
    protagonistOutcome: '{you} accepts that the game is unfinished and uses the failure honestly.',
    boardGameOutcome: 'The prototype breaks, but the reflection is strong and specific.',
    teamOutcome: 'The team learns how testing, feedback, and humility improve design.',
    logic: 'The prototype stayed weak, but clear reflection and honest failure turned the problem into learning.',
    howToReach: 'Admit problems, show a broken round, and invite players to redesign the rule.',
    trainerReflection: 'Emanuel says: This is a valid prototype lesson. You did not hide the system. You learned from it.',
  },
};

export default function FiladelfiaStoryGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [protagonist, setProtagonist] = useState<PlayerProfile | null>(null);
  const [nodeId, setNodeId] = useState<StoryNodeId>('arrival');
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [flags, setFlags] = useState<string[]>([]);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [endingId, setEndingId] = useState<EndingId | null>(null);
  const [lastFeedback, setLastFeedback] = useState('Choose a participant to begin the journey.');

  const node = storyNodes[nodeId];
  const ending = endingId ? endings[endingId] : null;
  const chosenChoiceIds = useMemo(() => new Set(storyLog.map((entry) => entry.chosenAction)), [storyLog]);

  const startStory = (selected: PlayerProfile) => {
    setProtagonist(selected);
    setNodeId('arrival');
    setMeters(applyProfilePoints(initialMeters, selected.points));
    setFlags([`perspective:${selected.id}`, `strength:${selected.strongestMeter}`, `risk:${selected.riskMeter}`]);
    setStoryLog([]);
    setEndingId(null);
    setLastFeedback(selected.opening);
    saveGameNote(game.id, `Story started as ${selected.name} from ${selected.country}`);
  };

  const choose = (choice: Choice) => {
    if (!protagonist) return;
    const nextMeters = clampMeters(meters, choice.effects);
    const nextFlags = Array.from(new Set([...flags, ...(choice.flags ?? [])]));
    const nextLog = [...storyLog, {
      nodeId: node.id,
      nodeTitle: node.title,
      dayLabel: node.dayLabel,
      location: node.location,
      moments: node.moments,
      chosenAction: choice.id,
      feedback: choice.feedback,
      meterChanges: choice.effects,
      flags: choice.flags ?? [],
    }];

    setMeters(nextMeters);
    setFlags(nextFlags);
    setStoryLog(nextLog);
    setLastFeedback(choice.feedback);

    if (choice.next === 'ending') {
      const result = resolveEnding(nextMeters, nextFlags);
      setEndingId(result);
      completeGame(game.id, 650, game.takeaway, `Ending: ${endings[result].title} as ${protagonist.name}`);
      saveGameNote(game.id, `${protagonist.name}: ${endings[result].title}`);
      return;
    }

    setNodeId(choice.next);
    saveGameNote(game.id, `${protagonist.name}: ${storyNodes[choice.next].title}`);
  };

  const restart = () => {
    setProtagonist(null);
    setNodeId('arrival');
    setMeters(initialMeters);
    setFlags([]);
    setStoryLog([]);
    setEndingId(null);
    setLastFeedback('Choose a participant to begin the journey.');
    saveGameNote(game.id, 'Story restarted');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theme-game-screen filadelfia-screen pb-10 max-w-6xl mx-auto">
      <section className="arcade-border-green glass-panel-green rounded-xl p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-green-300 font-bold uppercase tracking-widest">{game.subtitle}</p>
            <h1 className="text-xl md:text-3xl font-arcade mobile-readable-arcade text-white mt-3">{game.title}</h1>
            <p className="text-sm text-gray-300 leading-relaxed mt-4 max-w-3xl">
              Follow one participant during Games Are No Joke in Filadelfia. Your choices change the team, the board game, and the final result.
            </p>
          </div>
          <button onClick={restart} className="filadelfia-control-button rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-green-400">
            <RotateCcw className="w-4 h-4 inline mr-2" /> Restart
          </button>
        </div>
      </section>

      {!protagonist ? (
        <ProtagonistSelect onStart={startStory} />
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-4">
          <div className="arcade-border glass-panel rounded-xl p-3 md:p-4">
            {!ending ? (
              <StoryStage
                node={node}
                protagonist={protagonist}
                meters={meters}
                lastFeedback={lastFeedback}
                onChoose={choose}
              />
            ) : (
              <EndingPanel
                ending={ending}
                protagonist={protagonist}
                flags={flags}
                storyLog={storyLog}
                chosenChoiceIds={chosenChoiceIds}
                endingId={endingId}
                onSendTakeaway={() => updatePrototypeField('debriefQuestion', game.prototypePrompt)}
              />
            )}
          </div>

          <aside className="space-y-4">
            <div className="arcade-border-pink glass-panel-pink rounded-xl p-4">
              <p className="text-xs text-pink-300 font-bold uppercase tracking-widest">Perspective</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={protagonist.name} tone="bg-green-300" />
                <div>
                  <p className="text-sm font-black text-white">{protagonist.name}</p>
                  <p className="text-xs text-gray-400">{protagonist.country}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-black/35 p-3">
                <p className="text-xs font-bold leading-relaxed text-gray-200">{protagonist.trait}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">Risk: {protagonist.risk}</p>
              </div>
            </div>

            <div className="filadelfia-side-panel bg-black/60 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Story Profile</p>
              <div className="mt-4 space-y-3">
                {(Object.keys(meters) as MeterKey[]).map((key) => (
                  <Meter key={key} label={key} value={meters[key]} />
                ))}
              </div>
            </div>

            <StoryLogPanel storyLog={storyLog} protagonist={protagonist} compact />

            <div className="filadelfia-side-panel bg-black/60 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Ending Reasons</p>
              {!ending && <p className="text-sm text-gray-300 leading-relaxed mt-3">The game remembers your choices while you play. At the end, it explains why you got that result.</p>}
              {ending && <FlagList flags={flags} />}
            </div>
          </aside>
        </section>
      )}
    </motion.div>
  );
}

function ProtagonistSelect({ onStart }: { onStart: (profile: PlayerProfile) => void }) {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant>(featuredProfiles.andrea);
  const [points, setPoints] = useState<ProfilePoints>(featuredProfiles.andrea.points);
  const pointsSpent = totalProfilePoints(points);
  const pointsLeft = profilePointBudget - pointsSpent;
  const profile = buildPlayerProfile(selectedParticipant, points);

  const selectParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setPoints(getSuggestedProfilePoints(participant.name));
  };

  const adjustPoint = (key: MeterKey, delta: number) => {
    setPoints((current) => {
      const nextValue = current[key] + delta;
      const nextTotal = totalProfilePoints(current) + delta;
      if (nextValue < 0 || nextValue > maxProfilePointsPerMeter || nextTotal < 0 || nextTotal > profilePointBudget) return current;
      return { ...current, [key]: nextValue };
    });
  };

  return (
    <section className="arcade-border glass-panel rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Choose Your Participant</p>
          <h2 className="mt-3 text-xl md:text-2xl font-arcade mobile-readable-arcade text-white">One week. One team. One board game.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300">
            Choose a participant, shape how this person usually acts at the start of the story, and begin the week. Use exactly 20 points. Each meter can receive at most 10 points.
          </p>
        </div>
        <div className="filadelfia-country-list rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-gray-300">
          France, N. Macedonia, Bulgaria, Italy, Romania, Turkiye, Serbia
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-pink-300">Step 1 - Pick a person</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(Object.values(featuredProfiles) as ProfileTemplate[]).map((participant) => (
            <button
              key={participant.id}
              onClick={() => selectParticipant(participant)}
              className={`filadelfia-protagonist-card group rounded-xl border p-4 text-left transition-colors ${selectedParticipant.name === participant.name ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/55 hover:border-green-300 hover:bg-green-300/10'}`}
            >
              <Avatar name={participant.name} tone={participant.id === 'andrea' ? 'bg-pink-300' : participant.id === 'slave' ? 'bg-cyan-300' : 'bg-green-300'} large />
              <p className="mt-4 text-lg font-black text-white">{participant.name}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-green-300">{participant.country}</p>
              <p className="mt-3 text-sm font-bold text-gray-200">{buildPlayerProfile(participant, participant.points).trait}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">Risk: {buildPlayerProfile(participant, participant.points).risk}</p>
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-300">All participants</p>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          {participants.map((participant) => (
            <button
              key={`${participant.country}-${participant.name}`}
              onClick={() => selectParticipant(participant)}
              className={`rounded-lg border p-2 text-left transition-colors ${selectedParticipant.name === participant.name ? 'border-green-300 bg-green-300/15' : 'border-white/10 bg-black/40 hover:border-cyan-300'}`}
            >
              <p className="truncate text-xs font-black text-white">{participant.name}</p>
              <p className="truncate text-[10px] font-bold uppercase text-gray-500">{participant.country}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)]">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-green-300">Step 2 - Shape this participant</p>
            <p className={`text-xs font-black uppercase ${pointsLeft === 0 ? 'text-green-300' : 'text-yellow-300'}`}>Points left: {pointsLeft}</p>
          </div>
          <p className="mt-2 text-xs font-bold leading-relaxed text-gray-300">
            These points describe how {profile.name} usually acts at the start of the story, not the quality of the project.
          </p>
          <div className="mt-4 space-y-3">
            {meterKeys.map((key) => (
              <div key={key} className="rounded-lg border border-white/10 bg-black/45 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-white">{meterLabel(key)}</p>
                    <p className="mt-1 text-[10px] font-bold leading-relaxed text-gray-400">{meterHelp(key)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => adjustPoint(key, -1)} disabled={points[key] <= 0} className="h-8 w-8 rounded border border-white/10 bg-white/[.04] text-sm font-black text-white disabled:opacity-30">-</button>
                    <span className="w-8 text-center text-sm font-black text-green-200">{points[key]}</span>
                    <button onClick={() => adjustPoint(key, 1)} disabled={points[key] >= maxProfilePointsPerMeter || pointsLeft <= 0} className="h-8 w-8 rounded border border-white/10 bg-white/[.04] text-sm font-black text-white disabled:opacity-30">+</button>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-900">
                  <div className="h-full bg-green-300" style={{ width: `${points[key] * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/45 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-300">Step 3 - Review</p>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={profile.name} tone="bg-green-300" large />
            <div>
              <p className="text-lg font-black text-white">{profile.name}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-green-300">{profile.country}</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold leading-relaxed text-gray-100">{profile.trait}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">Risk: {profile.risk}</p>
          <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-relaxed text-cyan-100">{profile.opening}</p>
          <button
            onClick={() => onStart(profile)}
            disabled={pointsLeft !== 0}
            className="mt-4 flex w-full items-center justify-between rounded-lg border border-green-300/40 bg-green-300/10 px-4 py-3 text-xs font-bold uppercase text-green-100 transition-colors hover:bg-green-300 hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[.04] disabled:text-gray-500"
          >
            Start journey <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function StoryStage({
  node,
  protagonist,
  meters,
  lastFeedback,
  onChoose,
}: {
  node: StoryNode;
  protagonist: PlayerProfile;
  meters: Meters;
  lastFeedback: string;
  onChoose: (choice: Choice) => void;
}) {
  return (
    <div className="filadelfia-stage rounded-xl border border-green-400/30 bg-slate-950 overflow-hidden">
      <LocationPanel node={node} protagonist={protagonist} />
      <div className="p-4">
        <div className="filadelfia-meter-pips grid grid-cols-5 gap-1 rounded-lg border border-white/10 bg-black/70 p-2 mb-4">
          {(Object.keys(meters) as MeterKey[]).map((key) => (
            <MeterPip key={key} label={key} value={meters[key]} />
          ))}
        </div>

        <div className="filadelfia-story-scene rounded-xl border-2 border-green-300/60 bg-black/90 p-4 shadow-[0_0_24px_rgba(34,197,94,.18)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300">{node.speaker}</p>
            <p className="text-[10px] font-bold uppercase text-gray-500">{node.chapter} - {node.dayLabel}</p>
          </div>
          <h2 className="mt-2 text-base sm:text-xl font-arcade mobile-readable-arcade text-white">{node.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-200">{formatText(node.text, protagonist)}</p>

          <div className="filadelfia-story-beat mt-4 rounded-lg border border-white/10 bg-white/[.03] p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300">What is happening</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-100">{formatText(storyBeat(node.id), protagonist)}</p>
          </div>

          <div className="mt-4 space-y-3">
            {node.moments.map((moment) => (
              <div key={moment.id} className="filadelfia-story-moment rounded-lg border border-white/10 bg-black/45 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-300">{moment.timeLabel}</p>
                    <h3 className="mt-1 text-sm font-black text-white">{moment.title}</h3>
                    <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">{moment.location} - {moment.tone}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-200">{formatText(moment.text, protagonist)}</p>
                <div className="mt-3 space-y-2">
                  {moment.dialogue.map((line, index) => (
                    <div key={`${moment.id}-${line.speaker}-${index}`} className="filadelfia-dialogue-card rounded-lg border border-white/10 bg-black/50 p-3">
                      <div className="flex items-start gap-3">
                        <Avatar name={line.speaker} tone={line.speaker === protagonist.name || line.speaker === 'Narrator' ? 'bg-green-300' : 'bg-cyan-300'} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{line.speaker}</p>
                          <p className="mt-1 text-sm leading-relaxed text-gray-100">"{formatText(line.text, protagonist)}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="filadelfia-consequence-card mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-relaxed text-cyan-100">
            What changed: {lastFeedback}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {node.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoose(choice)}
              className="filadelfia-choice-card group rounded-lg border border-white/10 bg-white/[.04] p-4 text-left transition-colors hover:border-green-300 hover:bg-green-300/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">{choice.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">{choice.intention}</p>
                  <MeterDelta effects={choice.effects} />
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-green-300 opacity-70 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationPanel({ node, protagonist }: { node: StoryNode; protagonist: PlayerProfile }) {
  const cast = node.cast.map((name) => findParticipant(name, protagonist));
  return (
    <div className="filadelfia-location-panel relative overflow-hidden border-b border-green-300/20 bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-950 p-4">
      <div className="filadelfia-location-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {node.location}
            </p>
            <p className="mt-2 text-sm text-gray-200 leading-relaxed">{formatText(protagonist.opening, protagonist)}</p>
          </div>
          <div className="filadelfia-day-badge rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs font-bold text-white">
            {node.dayLabel}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {cast.map((participant) => (
            <CharacterChip key={`${participant.name}-${participant.country}`} participant={participant} protagonist={protagonist} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CharacterChip({ participant, protagonist }: { key?: string; participant: Participant; protagonist: PlayerProfile }) {
  const isYou = participant.name === protagonist.name;
  return (
    <div className={`filadelfia-character-chip rounded-lg border p-2 ${isYou ? 'border-green-300 bg-green-300/15' : 'border-white/10 bg-black/55'}`}>
      <div className="flex items-center gap-2">
        <Avatar name={participant.name} tone={isYou ? 'bg-green-300' : 'bg-cyan-300'} />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-white">{isYou ? `${participant.name} (You)` : participant.name}</p>
          <p className="truncate text-[10px] font-bold uppercase text-gray-500">{participant.country}</p>
        </div>
      </div>
    </div>
  );
}

function EndingPanel({
  ending,
  protagonist,
  flags,
  storyLog,
  chosenChoiceIds,
  endingId,
  onSendTakeaway,
}: {
  ending: Ending;
  protagonist: PlayerProfile;
  flags: string[];
  storyLog: StoryLogEntry[];
  chosenChoiceIds: Set<string>;
  endingId: EndingId | null;
  onSendTakeaway: () => void;
}) {
  return (
    <div>
      <div className="arcade-border-green glass-panel-green rounded-xl p-5 text-center">
        <Sparkles className="w-10 h-10 text-green-300 mx-auto" />
        <p className="text-xs text-green-300 font-bold uppercase tracking-widest mt-4">Ending Unlocked</p>
        <h2 className="text-2xl font-arcade mobile-readable-arcade text-white mt-3">{ending.title}</h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
          <OutcomeCard title="Participant" text={formatText(ending.protagonistOutcome, protagonist)} />
          <OutcomeCard title="Board Game" text={formatText(ending.boardGameOutcome, protagonist)} />
          <OutcomeCard title="Team" text={formatText(ending.teamOutcome, protagonist)} />
        </div>
        <p className="text-sm text-cyan-200 leading-relaxed mt-5">{ending.logic}</p>
        <p className="text-sm text-green-100 leading-relaxed mt-4 rounded-lg border border-green-300/20 bg-green-300/10 p-3">
          Trainer reflection: {formatText(ending.trainerReflection, protagonist)}
        </p>
        <button
          onClick={onSendTakeaway}
          className="mt-5 arcade-border-green px-5 py-3 bg-green-900/40 text-green-100 text-xs font-bold uppercase tracking-widest hover:bg-green-400 hover:text-black"
        >
          Send Takeaway to Prototype Lab
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StoryLogPanel storyLog={storyLog} protagonist={protagonist} />
        <div className="filadelfia-side-panel rounded-xl border border-white/10 bg-black/60 p-4">
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Story Reasons Revealed</p>
          <FlagList flags={flags} />
          <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">How this ending happened</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-200">{ending.howToReach}</p>
          </div>
        </div>
      </div>

      <LogicDiagram chosenChoiceIds={chosenChoiceIds} endingId={endingId} />
    </div>
  );
}

function StoryLogPanel({ storyLog, protagonist, compact = false }: { storyLog: StoryLogEntry[]; protagonist: PlayerProfile; compact?: boolean }) {
  const content = (
    <div className="mt-3 space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {storyLog.length === 0 && <p className="text-sm text-gray-400">No story choices yet.</p>}
      {storyLog.map((entry, index) => (
        <div key={`${entry.nodeId}-${entry.chosenAction}-${index}`} className="filadelfia-log-entry rounded-lg border border-white/10 bg-black/45 p-3">
          <p className="text-[10px] font-bold uppercase text-cyan-200">{entry.dayLabel} - {entry.nodeTitle}</p>
          <p className="text-[10px] text-gray-500">{entry.location}</p>
          <div className="mt-2 space-y-2">
            {entry.moments.map((moment) => (
              <div key={`${entry.nodeId}-${moment.id}`} className="rounded border border-white/10 bg-black/25 p-2">
                <p className="text-[10px] font-black uppercase text-green-300">{moment.timeLabel} - {moment.title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{formatText(moment.text, protagonist)}</p>
                <div className="mt-2 space-y-1">
                  {moment.dialogue.map((line, lineIndex) => (
                    <p key={`${moment.id}-${line.speaker}-${lineIndex}`} className="text-xs leading-relaxed text-gray-300">
                      <span className="font-bold text-white">{line.speaker}:</span> "{formatText(line.text, protagonist)}"
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-white">Choice: {choiceLabel(entry.chosenAction)}</p>
          <p className="mt-1 text-xs leading-relaxed text-green-200">{entry.feedback}</p>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <details className="filadelfia-log-panel bg-black/60 border border-white/10 rounded-xl p-4 xl:block" open>
        <summary className="cursor-pointer text-xs text-cyan-300 font-bold uppercase tracking-widest">Full Story Log</summary>
        {content}
      </details>
    );
  }

  return (
    <div className="filadelfia-log-panel rounded-xl border border-white/10 bg-black/60 p-4">
      <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Full Story Log
      </p>
      {content}
    </div>
  );
}

function LogicDiagram({ chosenChoiceIds, endingId }: { chosenChoiceIds: Set<string>; endingId: EndingId | null }) {
  const importantNodes: StoryNodeId[] = ['arrival', 'team-shared', 'team-solo', 'team-fun', 'prototype-playtest', 'prototype-polish', 'prototype-alone', 'showcase'];
  return (
    <div className="filadelfia-logic-panel mt-5 bg-black/60 border border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-arcade text-green-300 flex items-center gap-2">
        <GitBranch className="w-5 h-5" /> Story Map
      </h3>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {importantNodes.map((id) => {
          const node = storyNodes[id];
          return (
            <div key={id} className="filadelfia-logic-card rounded-lg border border-white/10 bg-black/45 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-500">{node.chapter}: {node.title}</p>
              <div className="mt-3 space-y-2">
                {node.choices.map((choice) => {
                  const chosen = chosenChoiceIds.has(choice.id);
                  return (
                    <div key={choice.id} className={`filadelfia-logic-choice rounded border p-2 ${chosen ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/40'}`}>
                      <p className={`text-xs font-bold ${chosen ? 'text-green-200' : 'text-gray-300'}`}>{choice.label}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Next: {choice.next === 'ending' ? 'Ending logic' : storyNodes[choice.next].title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-arcade text-cyan-300 mt-6">Other Endings</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.entries(endings) as Array<[EndingId, Ending]>).map(([id, ending]) => (
          <div key={id} className={`filadelfia-logic-card rounded-lg border p-3 ${id === endingId ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/45'}`}>
            <p className="text-sm text-white font-bold">{ending.title}</p>
            <p className="text-xs text-gray-300 leading-relaxed mt-2">{ending.howToReach}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutcomeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-green-300/20 bg-green-300/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-green-300">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-100">{text}</p>
    </div>
  );
}

function MeterPip({ label, value }: { key?: MeterKey; label: MeterKey; value: number }) {
  const color = value >= 70 ? 'bg-green-300' : value >= 45 ? 'bg-cyan-300' : 'bg-red-300';
  return (
    <div className="text-center">
      <p className="text-[8px] font-black uppercase text-gray-400">{label[0]}</p>
      <div className="filadelfia-meter-pip-track mt-1 h-8 rounded border border-white/10 bg-black/50 flex items-end overflow-hidden">
        <div className={`w-full ${color}`} style={{ height: `${value}%` }} />
      </div>
    </div>
  );
}

function Meter({ label, value }: { key?: MeterKey; label: MeterKey; value: number }) {
  const color = value >= 70 ? 'bg-green-300' : value >= 45 ? 'bg-cyan-300' : 'bg-red-300';
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="filadelfia-meter-track mt-2 h-2 rounded-full bg-gray-900 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MeterDelta({ effects }: { effects: Partial<Meters> }) {
  const entries = (Object.entries(effects) as Array<[MeterKey, number]>).filter(([, value]) => value !== 0);
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <span key={key} className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${value > 0 ? 'border-green-300/30 bg-green-300/10 text-green-200' : 'border-red-300/30 bg-red-300/10 text-red-200'}`}>
          {key} {value > 0 ? `+${value}` : value}
        </span>
      ))}
    </div>
  );
}

function Avatar({ name, tone, large = false }: { name: string; tone: string; large?: boolean }) {
  return (
    <div className={`${large ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs'} flex shrink-0 items-center justify-center rounded-full border-2 border-white text-black font-black shadow-[0_0_12px_rgba(255,255,255,.25)] ${tone}`}>
      {name === 'All Participants' ? <UserRound className="w-5 h-5" /> : name.slice(0, 1)}
    </div>
  );
}

function FlagList({ flags }: { flags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {flags.map((flag) => (
        <span key={flag} className="rounded bg-green-400/10 border border-green-400/30 px-2 py-1 text-[10px] font-bold uppercase text-green-200">
          {humanFlag(flag)}
        </span>
      ))}
    </div>
  );
}

function humanFlag(flag: string) {
  const labels: Record<string, string> = {
    builtAlliance: 'Built an alliance',
    includedQuietVoice: 'Invited a quiet voice',
    watchedGroup: 'Observed the group',
    ignoredTeam: 'Stayed outside the team',
    sharedRoles: 'Shared roles',
    learningInsideMechanic: 'Learning inside the rules',
    soloDesigner: 'Worked mostly alone',
    funFirst: 'Chose fun first',
    usedPlaytest: 'Used playtesting',
    polishedBeforeTesting: 'Polished before testing',
    clearDebrief: 'Clear reflection',
    ignoredFeedback: 'Ignored feedback',
    avoidedConflict: 'Avoided conflict',
    hidFailure: 'Hid a weak point',
    reskinnedGame: 'Copied a known game',
  };
  if (flag.startsWith('perspective:')) return `Perspective: ${formatProfileFlag(flag.split(':')[1])}`;
  if (flag.startsWith('strength:')) {
    const key = flag.split(':')[1];
    return isMeterKey(key) ? `Strength: ${meterLabel(key)}` : 'Strength set';
  }
  if (flag.startsWith('risk:')) {
    const key = flag.split(':')[1];
    return isMeterKey(key) ? `Risk: ${meterLabel(key)}` : 'Risk set';
  }
  return labels[flag] ?? flag.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function isMeterKey(key: string): key is MeterKey {
  return meterKeys.includes(key as MeterKey);
}

function formatProfileFlag(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function storyBeat(nodeId: StoryNodeId) {
  const beats: Record<StoryNodeId, string> = {
    arrival: '{you} has not chosen a board game yet. The first choice is how to enter the group.',
    'circle-connect': 'The first bridge is built. Now the team must turn many topics into one game system.',
    'circle-distance': '{you} has useful notes, but the team needs an invitation before the idea moves too far.',
    'circle-familiar': 'Comfort helps, but staying comfortable can make the mixed team start without you.',
    'team-shared': 'The idea belongs to several people. Now the team must test it, not only talk about it.',
    'team-solo': 'The rules are clearer, but the team is becoming an audience.',
    'team-fun': 'The energy is high. The risk is that the learning message appears only after play.',
    'prototype-playtest': 'The first test breaks the prototype. This is useful: now the team can see what the rules do.',
    'prototype-polish': 'The board looks better than the rules. Now the team must choose truth or decoration.',
    'prototype-alone': '{you} can finish the object alone, but a group project also needs shared work.',
    'conflict-listen': 'The team uses conflict as information. A weak rule can become the best lesson.',
    'conflict-control': 'Control keeps the prototype stable, but it lowers trust.',
    'conflict-avoid': 'Avoided tension comes back with a higher cost. The group must repair it or hide it.',
    'night-repair': 'The team makes the game simpler and finds one strong playable message.',
    'night-solo': 'The prototype is complete, but the group process is weak.',
    'night-honest': 'The team may not save the prototype, but it can still save the learning.',
    showcase: 'The final result is not only the board. It is also the story of how choices changed the team and the game.',
  };
  return beats[nodeId];
}

function resolveEnding(meters: Meters, flags: string[]): EndingId {
  const has = (flag: string) => flags.includes(flag);
  if ((has('hidFailure') || has('polishedBeforeTesting')) && meters.clarity < 58) return 'beautiful-board-broken-rules';
  if ((has('avoidedConflict') || has('ignoredFeedback')) && (meters.trust < 48 || meters.inclusion < 45)) return 'conflict-breaks-team';
  if (has('soloDesigner') && meters.clarity >= 62 && meters.inclusion < 58) return 'solo-prototype-success';
  if (has('funFirst') && meters.energy >= 68 && meters.learning < 58) return 'fun-game-weak-message';
  if (has('clearDebrief') && meters.learning >= 68 && (meters.clarity < 58 || has('hidFailure'))) return 'failed-prototype-strong-learning';
  if (has('sharedRoles') && has('usedPlaytest') && has('learningInsideMechanic') && meters.trust >= 62 && meters.inclusion >= 62) return 'shared-board-game-success';
  if (meters.learning >= 70 && has('clearDebrief')) return 'failed-prototype-strong-learning';
  return meters.inclusion >= 62 ? 'shared-board-game-success' : 'fun-game-weak-message';
}

function clampMeters(current: Meters, effects: Partial<Meters>) {
  return (Object.keys(current) as MeterKey[]).reduce((next, key) => ({
    ...next,
    [key]: clamp((current[key] ?? 0) + (effects[key] ?? 0)),
  }), {} as Meters);
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function applyProfilePoints(base: Meters, points: ProfilePoints): Meters {
  return meterKeys.reduce((next, key) => ({
    ...next,
    [key]: clamp(base[key] + points[key]),
  }), {} as Meters);
}

function totalProfilePoints(points: ProfilePoints) {
  return meterKeys.reduce((total, key) => total + points[key], 0);
}

function getSuggestedProfilePoints(name: string): ProfilePoints {
  const featured = Object.values(featuredProfiles).find((profile) => profile.name === name);
  return featured ? { ...featured.points } : { ...defaultProfilePoints };
}

function buildPlayerProfile(participant: Participant, points: ProfilePoints): PlayerProfile {
  const ordered = [...meterKeys].sort((a, b) => points[b] - points[a]);
  const strongestMeter = ordered[0];
  const riskMeter = strongestMeter;
  const id = makeParticipantId(participant);
  return {
    ...participant,
    id,
    points: { ...points },
    strongestMeter,
    riskMeter,
    trait: strengthText(strongestMeter),
    risk: riskText(riskMeter),
    opening: openingText(participant.name, strongestMeter, riskMeter),
  };
}

function makeParticipantId(participant: Participant) {
  return participant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function strengthText(key: MeterKey) {
  const labels: Record<MeterKey, string> = {
    trust: 'Bridge-builder who helps people feel safe together.',
    clarity: 'Structured thinker who can make rules easy to follow.',
    inclusion: 'Inclusive listener who notices quiet voices.',
    energy: 'Social starter who brings movement and fun.',
    learning: 'Reflective learner who connects play with meaning.',
  };
  return labels[key];
}

function riskText(key: MeterKey) {
  const labels: Record<MeterKey, string> = {
    trust: 'Can wait too long for agreement.',
    clarity: 'Can control too much when pressure rises.',
    inclusion: 'Can avoid conflict for too long.',
    energy: 'Can chase fun and lose the learning message.',
    learning: 'Can explain too much instead of letting people play.',
  };
  return labels[key];
}

function openingText(name: string, strength: MeterKey, risk: MeterKey) {
  return `${name} arrives in Filadelfia with ${meterLabel(strength).toLowerCase()} as the strongest meter. Main risk: ${riskText(risk)}`;
}

function meterLabel(key: MeterKey) {
  const labels: Record<MeterKey, string> = {
    trust: 'Trust',
    clarity: 'Clarity',
    inclusion: 'Inclusion',
    energy: 'Energy',
    learning: 'Learning',
  };
  return labels[key];
}

function meterHelp(key: MeterKey) {
  const labels: Record<MeterKey, string> = {
    trust: 'This participant helps people feel safe to join and share.',
    clarity: 'This participant makes rules and next steps easier to understand.',
    inclusion: 'This participant notices quiet people and invites them into the work.',
    energy: 'This participant brings movement, fun, and motivation to the group.',
    learning: 'This participant connects play with a clear youth-work lesson.',
  };
  return labels[key];
}

function findParticipant(name: string, protagonist: PlayerProfile): Participant {
  if (name === 'All Participants') return { name, country: 'Group' };
  if (name === protagonist.name) return protagonist;
  if (name === 'Emanuel') return { name, country: 'Trainer' };
  if (name === 'Rocco') return { name, country: 'Logistics' };
  if (name === 'Narrator') return { name, country: 'Story' };
  return participants.find((participant) => participant.name === name) ?? { name, country: 'Participant' };
}

function formatText(text: string, protagonist: PlayerProfile) {
  return text
    .replaceAll('{you}', protagonist.name)
    .replaceAll('{country}', protagonist.country);
}

function choiceLabel(choiceId: string) {
  for (const node of Object.values(storyNodes)) {
    const choice = node.choices.find((item) => item.id === choiceId);
    if (choice) return choice.label;
  }
  return choiceId;
}
