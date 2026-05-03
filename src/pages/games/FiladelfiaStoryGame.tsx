import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flag, GitBranch, MapPin, MessageSquare, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { gameCatalog } from '../../data/course';
import { useStore } from '../../store/useStore';

type MeterKey = 'trust' | 'clarity' | 'inclusion' | 'energy' | 'learning';
type Meters = Record<MeterKey, number>;
type ProtagonistId = 'andrea' | 'slave' | 'ivalina';
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

type Protagonist = Participant & {
  id: ProtagonistId;
  trait: string;
  risk: string;
  opening: string;
  initialBoost: Partial<Meters>;
};

type DialogueLine = {
  speaker: string;
  text: string;
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
  dialogue: DialogueLine[];
  cast: string[];
  choices: Choice[];
};

type StoryLogEntry = {
  nodeId: StoryNodeId;
  nodeTitle: string;
  dayLabel: string;
  location: string;
  dialogue: DialogueLine[];
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
  energy: 62,
  learning: 45,
};

const protagonists: Record<ProtagonistId, Protagonist> = {
  andrea: {
    id: 'andrea',
    name: 'Andrea',
    country: 'France',
    trait: 'Creative and social',
    risk: 'Can chase fun and lose the learning message.',
    opening: 'Andrea arrives with jokes, ideas, and a strong wish to make people play fast.',
    initialBoost: { energy: 8, trust: 4 },
  },
  slave: {
    id: 'slave',
    name: 'Slave',
    country: 'N. Macedonia',
    trait: 'Analytical and structured',
    risk: 'Can control the prototype alone when pressure rises.',
    opening: 'Slave arrives with a notebook, already thinking about rules, balance, and a clean system.',
    initialBoost: { clarity: 8, learning: 4 },
  },
  ivalina: {
    id: 'ivalina',
    name: 'Ivalina',
    country: 'Bulgaria',
    trait: 'Reflective and inclusive',
    risk: 'Can avoid conflict for too long.',
    opening: 'Ivalina arrives quietly, watching who speaks, who waits, and who is left outside the circle.',
    initialBoost: { inclusion: 8, trust: 4 },
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
  { country: 'Bulgaria', name: 'Ivalina' },
  { country: 'Bulgaria', name: 'Georgi' },
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
    dialogue: [
      { speaker: 'Rocco', text: 'Welcome to Filadelfia. Put your luggage near the desk. The first circle starts soon.' },
      { speaker: 'Sophie', text: 'First circle already? I know nobody yet. I hope the group is friendly.' },
      { speaker: 'Emanuel', text: 'That is the first design challenge. Before we make games, we make a group where people can play.' },
      { speaker: 'Mihaela', text: 'So the first move is not on a board. It is how we enter the room.' },
    ],
    choices: [
      {
        id: 'connect-courtyard',
        label: 'Enter the circle',
        intention: 'Ask Sophie and Mihaela what kind of game they want to build.',
        effects: { trust: 10, inclusion: 8, energy: -2, learning: 4 },
        flags: ['builtAlliance', 'includedQuietVoice'],
        next: 'circle-connect',
        feedback: 'You made the first mechanic social: attention created trust.',
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
    text: 'Emanuel forms mixed teams. {you} sits with Sophie, Mihaela, Rasim Hamza, Cristina, and Georgi. The team must choose a topic for a board game.',
    cast: ['Emanuel', 'Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Georgi'],
    dialogue: [
      { speaker: 'Emanuel', text: 'Choose one real need. Not the most impressive topic. The one your rules can make players feel.' },
      { speaker: 'Mihaela', text: 'Then I want inclusion. In groups, quiet people can disappear without anyone noticing.' },
      { speaker: 'Rasim Hamza', text: 'For me it is misinformation. People move fast when they trust the wrong signal.' },
      { speaker: 'Cristina', text: 'Maybe those are connected. What if the wrong signal makes the group ignore someone?' },
      { speaker: 'Georgi', text: 'That could become a rule, not only a discussion.' },
    ],
    choices: [
      {
        id: 'map-needs',
        label: 'Map the needs',
        intention: 'Give each person one minute to explain the need behind their topic.',
        effects: { trust: 12, inclusion: 12, clarity: 8, learning: 8, energy: -4 },
        flags: ['sharedRoles', 'learningInsideMechanic'],
        next: 'team-shared',
        feedback: 'The team did not vote on ego. They designed from needs.',
      },
      {
        id: 'take-structure',
        label: 'Take the structure role',
        intention: 'Offer to write the rules because the team needs order now.',
        effects: { clarity: 12, energy: 2, trust: -4, inclusion: -6 },
        flags: ['soloDesigner'],
        next: 'team-solo',
        feedback: 'The rules became clearer, but ownership started moving toward one person.',
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
    dialogue: [
      { speaker: 'Kaotar', text: 'We need to choose soon. If we keep opening ideas, we will never build anything.' },
      { speaker: 'Elena', text: 'I have an idea, but I am not sure I can explain it in English.' },
      { speaker: 'Ethan', text: 'Try with an example. We can help shape the words.' },
      { speaker: 'Emanuel', text: 'Exactly. A complicated idea is welcome. A hidden idea cannot help the team.' },
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
    dialogue: [
      { speaker: 'Rocco', text: 'Coffee helps, but the team table is filling up. Do not let the project start without you.' },
      { speaker: 'Buse Naz', text: 'I want the game to be funny first. If people laugh, they relax.' },
      { speaker: 'Ognjen', text: 'I agree, but someone must hold the structure. Otherwise we will only have funny fragments.' },
      { speaker: 'Giuseppe', text: 'Maybe the question is: who brings fun, and who checks if the fun teaches something?' },
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
        feedback: 'The plan helped speed. It also reduced ownership.',
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
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Georgi'],
    dialogue: [
      { speaker: 'Sophie', text: 'What if each player sees only part of the truth?' },
      { speaker: 'Rasim Hamza', text: 'Then checking a source is not a quiz question. It becomes a move you choose.' },
      { speaker: 'Mihaela', text: 'And if players ignore one person too long, the team should feel the cost.' },
      { speaker: 'Cristina', text: 'So the board can ask: do we win faster alone, or better together?' },
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
        intention: 'Assign rules, board, cards, and debrief to different people.',
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
        feedback: 'The table looked better. The mechanic stayed unproven.',
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
    text: '{you} writes a strong rule structure. The team watches, helps a little, and slowly becomes an audience.',
    cast: ['Kiril', 'Hatche', 'Liviu', 'Claudia', 'Mehmet Emin'],
    dialogue: [
      { speaker: 'Kiril', text: 'The rule system is clear. I can follow it. But where do we put our ideas?' },
      { speaker: 'Hatche', text: 'Maybe we should touch the prototype before it becomes too finished.' },
      { speaker: 'Liviu', text: 'If only one person can explain the rules, players will depend on that person too.' },
      { speaker: 'Mehmet Emin', text: 'So the first test is not only for the game. It is for the team.' },
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
        feedback: 'The board looked official before players had tested its truth.',
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
    dialogue: [
      { speaker: 'Ethan', text: 'People will run, laugh, and shout. This will wake up the whole room.' },
      { speaker: 'Buse Naz', text: 'Good. I do not want another serious poster with rules.' },
      { speaker: 'Loredana', text: 'I like the energy, but what will players understand after the laughing stops?' },
      { speaker: 'Emanuel', text: 'Do not remove the fun. Give the fun a job.' },
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
        intention: 'Keep the game fast and trust the debrief to explain the meaning later.',
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
        feedback: 'Players understood the structure, but the topic did not shape the mechanic.',
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
    cast: ['Mihaela', 'Sophie', 'Georgi', 'Cristina', 'Emanuel'],
    dialogue: [
      { speaker: 'Sophie', text: 'I understand the topic, but on my turn I do not know what choice I have.' },
      { speaker: 'Georgi', text: 'Maybe that is because the blocked player can only wait.' },
      { speaker: 'Mihaela', text: 'Then the game is repeating exclusion instead of helping players notice it.' },
      { speaker: 'Emanuel', text: 'That is useful feedback. What rule would let a player repair the situation?' },
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
    dialogue: [
      { speaker: 'Giuseppe', text: 'The board looks finished, but when I start, I do not see my real choice.' },
      { speaker: 'Kaotar', text: 'Maybe there are too many cards. The player is reading more than deciding.' },
      { speaker: 'Stasa', text: 'Can we remove half of it and test only one round?' },
      { speaker: 'Emanuel', text: 'Yes. Beauty can wait. First, make the player action visible.' },
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
    dialogue: [
      { speaker: 'Rocco', text: 'Still working? I admire the effort. But remember, this course is not only about having an object tomorrow.' },
      { speaker: 'Liviu', text: 'I can test one round if you want. But I do not know what your team agreed on.' },
      { speaker: 'Claudia', text: 'The rules are clear when you explain them. I am not sure the team can explain them without you.' },
      { speaker: 'Kiril', text: 'Maybe the question is not: is it finished? Maybe it is: who can carry it?' },
    ],
    choices: [
      {
        id: 'invite-late-test',
        label: 'Invite a late test',
        intention: 'Ask Liviu and Claudia to break the game before tomorrow.',
        effects: { clarity: 8, learning: 8, trust: 4, energy: -6 },
        flags: ['usedPlaytest'],
        next: 'conflict-listen',
        feedback: 'A late test saved some learning, but ownership stayed fragile.',
      },
      {
        id: 'finish-solo',
        label: 'Finish it alone',
        intention: 'Complete the board, rules, and debrief without waking the team.',
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
    cast: ['Cristina', 'Mihaela', 'Sophie', 'Georgi', 'Emanuel'],
    dialogue: [
      { speaker: 'Cristina', text: 'The unfair part is uncomfortable, but it helped us see the real topic.' },
      { speaker: 'Sophie', text: 'I do not want players to only feel stuck. I want them to have a way to respond.' },
      { speaker: 'Georgi', text: 'Then we need a repair move. A player can spend a turn to bring someone back.' },
      { speaker: 'Emanuel', text: 'Now the mechanic carries the message: exclusion is visible, and repair is possible.' },
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
        intention: 'Keep the painful rule and explain it in the debrief.',
        effects: { learning: 8, trust: -6, inclusion: -8, clarity: -4 },
        flags: ['clearDebrief'],
        next: 'night-honest',
        feedback: 'The debrief may work, but the play experience still hurts.',
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
    dialogue: [
      { speaker: 'Kiril', text: 'I can present the rulebook, but I do not feel this is our game.' },
      { speaker: 'Hatche', text: 'I stopped suggesting changes because every change felt like a problem.' },
      { speaker: 'Mehmet Emin', text: 'The game is controlled, yes. But controlled by whom?' },
      { speaker: 'Buse Naz', text: 'It needs life. Right now players may follow it, but not care about it.' },
    ],
    choices: [
      {
        id: 'return-ownership',
        label: 'Return ownership',
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
    dialogue: [
      { speaker: 'Loredana', text: 'I do not want to stand tomorrow and explain a game I do not believe in.' },
      { speaker: 'Elena', text: 'We tried to be polite, but we never solved the problem.' },
      { speaker: 'Ognjen', text: 'If we speak now, maybe we lose time. If we do not speak, maybe we lose the team.' },
      { speaker: 'Rocco', text: 'You still have tonight. Use it for honesty, not panic.' },
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
    text: 'The team cuts rules, tests again, and adds one clear debrief question. The board is simple, but everyone can explain why it exists.',
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Georgi'],
    dialogue: [
      { speaker: 'Sophie', text: 'Now each turn has a real choice: move faster alone, or help someone re-enter the game.' },
      { speaker: 'Rasim Hamza', text: 'And checking information costs time, but protects group trust.' },
      { speaker: 'Cristina', text: 'So the system creates tension without punishing only one player.' },
      { speaker: 'Mihaela', text: 'This finally feels like our project, not only our topic.' },
    ],
    choices: [
      {
        id: 'present-as-team',
        label: 'Present as a team',
        intention: 'Let each person explain one part: rules, feeling, learning, debrief.',
        effects: { trust: 10, inclusion: 10, clarity: 6, learning: 8, energy: -2 },
        flags: ['sharedRoles', 'clearDebrief'],
        next: 'showcase',
        feedback: 'The showcase became shared ownership.',
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
    dialogue: [
      { speaker: 'Claudia', text: 'I can help present the board, but I do not know why every rule is there.' },
      { speaker: 'Kiril', text: 'The work is good. I just wish the work had included us earlier.' },
      { speaker: 'Hatche', text: 'Maybe tomorrow we should say that honestly. It is part of the learning.' },
      { speaker: 'Rocco', text: 'A complete board is not always a complete project. But honest reflection can still save the lesson.' },
    ],
    choices: [
      {
        id: 'own-solo-choice',
        label: 'Present it honestly',
        intention: 'Say the prototype is mostly yours and ask the team to reflect on ownership.',
        effects: { learning: 10, trust: 2, clarity: 4 },
        flags: ['clearDebrief', 'soloDesigner'],
        next: 'showcase',
        feedback: 'Honesty turned a weak process into learning.',
      },
      {
        id: 'pretend-team-game',
        label: 'Pretend it was shared',
        intention: 'Present it as a group result and avoid the ownership problem.',
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
    dialogue: [
      { speaker: 'Emanuel', text: 'If the prototype is weak, do not pretend it is strong. Ask what the weakness teaches.' },
      { speaker: 'Elena', text: 'Then our debrief can ask: where did the system fail the players?' },
      { speaker: 'Loredana', text: 'That feels risky, but more honest than selling a game we do not trust.' },
      { speaker: 'Ognjen', text: 'We can show one broken round, then ask players to redesign the rule with us.' },
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
    dialogue: [
      { speaker: 'Emanuel', text: 'When you present, show the rule, the player choice, and the feeling it creates.' },
      { speaker: 'Rocco', text: 'After the showcase we move to YouthPass reflection. So let the last play tell the truth.' },
      { speaker: 'Narrator', text: 'The board is on the table. The team stands around it. The story now becomes visible.' },
    ],
    choices: [
      {
        id: 'invite-play-reflect',
        label: 'Play, observe, reflect',
        intention: 'Let players play, watch silently, then ask what the system made visible.',
        effects: { trust: 8, inclusion: 8, learning: 10, clarity: 4 },
        flags: ['clearDebrief'],
        next: 'ending',
        feedback: 'The final activity connected mechanics to reflection.',
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
    protagonistOutcome: '{you} becomes a facilitator inside the team, not the owner of the idea.',
    boardGameOutcome: 'The board game is playable, simple, and clearly connected to inclusion and misinformation.',
    teamOutcome: 'The group presents together. Quiet voices are visible in the rules.',
    logic: 'High trust, inclusion, playtesting, shared roles, and learning inside the mechanic created a shared success.',
    howToReach: 'Build alliances, share roles, test early, and put the learning message inside a rule.',
    trainerReflection: 'Emanuel says: This is what game design can do in youth work: make participation visible.',
  },
  'solo-prototype-success': {
    title: 'Solo Prototype Success',
    protagonistOutcome: '{you} finishes a coherent prototype, but carries too much of the process alone.',
    boardGameOutcome: 'The game works, but the debrief reveals weak group ownership.',
    teamOutcome: 'The team respects the effort, but some participants feel like helpers, not co-designers.',
    logic: 'High clarity with low inclusion and solo-designer flags created a technically successful but socially fragile outcome.',
    howToReach: 'Take control, finish the board alone, and present honestly or with limited shared ownership.',
    trainerReflection: 'Emanuel says: A good product is not always a good learning process. Who owned the design?',
  },
  'fun-game-weak-message': {
    title: 'Fun Game, Weak Message',
    protagonistOutcome: '{you} creates energy and laughter, but cannot fully explain the youth-work lesson.',
    boardGameOutcome: 'The game is enjoyable, but the topic sits mostly in the explanation after play.',
    teamOutcome: 'The team has fun, yet the reflection feels thin.',
    logic: 'High energy with low learning and fun-first choices made the game playful but weak as education.',
    howToReach: 'Choose fun-first options, protect party energy, and skip strong learning mechanics.',
    trainerReflection: 'Emanuel says: Keep the fun. Now redesign one rule so the lesson happens during play.',
  },
  'beautiful-board-broken-rules': {
    title: 'Beautiful Board, Broken Rules',
    protagonistOutcome: '{you} helps make something that looks ready before it is truly playable.',
    boardGameOutcome: 'The prototype has strong visuals, but players do not understand the core turn.',
    teamOutcome: 'The group loses confidence when the first players get confused.',
    logic: 'Polish-before-testing and hidden failure flags outweighed clarity and playtest learning.',
    howToReach: 'Decorate early, avoid cutting to the core loop, and hide unclear rules before the showcase.',
    trainerReflection: 'Emanuel says: A prototype is not a poster. First make the player action clear.',
  },
  'conflict-breaks-team': {
    title: 'Conflict Breaks the Team',
    protagonistOutcome: '{you} avoids or controls tension until the group cannot use it as feedback.',
    boardGameOutcome: 'The game reaches the table, but the team cannot present it with real trust.',
    teamOutcome: 'Some participants step back. The conflict becomes the real lesson.',
    logic: 'Avoided conflict, ignored feedback, low trust, and low inclusion broke the group process.',
    howToReach: 'Avoid disagreement, defend rules, and do not repair ownership before the showcase.',
    trainerReflection: 'Emanuel says: Conflict is not failure. Unused conflict is lost information.',
  },
  'failed-prototype-strong-learning': {
    title: 'Failed Prototype, Strong Learning',
    protagonistOutcome: '{you} accepts that the game is unfinished and uses the failure honestly.',
    boardGameOutcome: 'The prototype breaks, but the debrief is powerful and specific.',
    teamOutcome: 'The team learns how testing, feedback, and humility improve design.',
    logic: 'The prototype stayed weak, but clear debrief and honest failure converted the collapse into learning.',
    howToReach: 'Admit problems, show a broken round, and invite players to redesign the rule.',
    trainerReflection: 'Emanuel says: This is a valid prototype lesson. You did not hide the system; you learned from it.',
  },
};

export default function FiladelfiaStoryGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [protagonistId, setProtagonistId] = useState<ProtagonistId | null>(null);
  const [nodeId, setNodeId] = useState<StoryNodeId>('arrival');
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [flags, setFlags] = useState<string[]>([]);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [endingId, setEndingId] = useState<EndingId | null>(null);
  const [lastFeedback, setLastFeedback] = useState('Choose a participant to begin the journey.');

  const protagonist = protagonistId ? protagonists[protagonistId] : null;
  const node = storyNodes[nodeId];
  const ending = endingId ? endings[endingId] : null;
  const chosenChoiceIds = useMemo(() => new Set(storyLog.map((entry) => entry.chosenAction)), [storyLog]);

  const startStory = (id: ProtagonistId) => {
    const selected = protagonists[id];
    setProtagonistId(id);
    setNodeId('arrival');
    setMeters(clampMeters(initialMeters, selected.initialBoost));
    setFlags([`perspective:${id}`]);
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
      dialogue: node.dialogue,
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
    setProtagonistId(null);
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
              Follow one participant through Games Are No Joke in Filadelfia. Your choices change the team, the board game, and the final outcome.
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
            </div>

            <div className="filadelfia-side-panel bg-black/60 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Story Meters</p>
              <div className="mt-4 space-y-3">
                {(Object.keys(meters) as MeterKey[]).map((key) => (
                  <Meter key={key} label={key} value={meters[key]} />
                ))}
              </div>
            </div>

            <StoryLogPanel storyLog={storyLog} protagonist={protagonist} compact />

            <div className="filadelfia-side-panel bg-black/60 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Hidden Logic</p>
              {!ending && <p className="text-sm text-gray-300 leading-relaxed mt-3">Flags stay hidden while you play. At the end, the game reveals why you got your ending.</p>}
              {ending && <FlagList flags={flags} />}
            </div>
          </aside>
        </section>
      )}
    </motion.div>
  );
}

function ProtagonistSelect({ onStart }: { onStart: (id: ProtagonistId) => void }) {
  return (
    <section className="arcade-border glass-panel rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest">Choose Your Participant</p>
          <h2 className="mt-3 text-xl md:text-2xl font-arcade mobile-readable-arcade text-white">One week. One team. One board game.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300">
            Each perspective starts with a different strength and risk. The story follows one participant from arrival to final showcase.
          </p>
        </div>
        <div className="filadelfia-country-list rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-gray-300">
          France, N. Macedonia, Bulgaria, Italy, Romania, Turkiye, Greece, Serbia
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.values(protagonists) as Protagonist[]).map((participant) => (
          <button
            key={participant.id}
            onClick={() => onStart(participant.id)}
            className="filadelfia-protagonist-card group rounded-xl border border-white/10 bg-black/55 p-4 text-left transition-colors hover:border-green-300 hover:bg-green-300/10"
          >
            <Avatar name={participant.name} tone={participant.id === 'andrea' ? 'bg-pink-300' : participant.id === 'slave' ? 'bg-cyan-300' : 'bg-green-300'} large />
            <p className="mt-4 text-lg font-black text-white">{participant.name}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-green-300">{participant.country}</p>
            <p className="mt-3 text-sm text-gray-200 font-bold">{participant.trait}</p>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">Risk: {participant.risk}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase text-cyan-200">
              Start journey <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
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
  protagonist: Protagonist;
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
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300">Story beat</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-100">{formatText(storyBeat(node.id), protagonist)}</p>
          </div>

          <div className="mt-4 space-y-2">
            {node.dialogue.map((line, index) => (
              <div key={`${line.speaker}-${index}`} className="filadelfia-dialogue-card rounded-lg border border-white/10 bg-black/55 p-3">
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

          <div className="filadelfia-consequence-card mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-relaxed text-cyan-100">
            Consequence memory: {lastFeedback}
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

function LocationPanel({ node, protagonist }: { node: StoryNode; protagonist: Protagonist }) {
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

function CharacterChip({ participant, protagonist }: { key?: string; participant: Participant; protagonist: Protagonist }) {
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
  protagonist: Protagonist;
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
          <p className="text-xs text-green-300 font-bold uppercase tracking-widest">Hidden Flags Revealed</p>
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

function StoryLogPanel({ storyLog, protagonist, compact = false }: { storyLog: StoryLogEntry[]; protagonist: Protagonist; compact?: boolean }) {
  const content = (
    <div className="mt-3 space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {storyLog.length === 0 && <p className="text-sm text-gray-400">No story choices yet.</p>}
      {storyLog.map((entry, index) => (
        <div key={`${entry.nodeId}-${entry.chosenAction}-${index}`} className="filadelfia-log-entry rounded-lg border border-white/10 bg-black/45 p-3">
          <p className="text-[10px] font-bold uppercase text-cyan-200">{entry.dayLabel} - {entry.nodeTitle}</p>
          <p className="text-[10px] text-gray-500">{entry.location}</p>
          <div className="mt-2 space-y-1">
            {entry.dialogue.map((line, lineIndex) => (
              <p key={`${line.speaker}-${lineIndex}`} className="text-xs leading-relaxed text-gray-300">
                <span className="font-bold text-white">{line.speaker}:</span> "{formatText(line.text, protagonist)}"
              </p>
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
        <GitBranch className="w-5 h-5" /> Branching Map
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
    learningInsideMechanic: 'Learning inside the mechanic',
    soloDesigner: 'Worked mostly alone',
    funFirst: 'Chose fun first',
    usedPlaytest: 'Used playtesting',
    polishedBeforeTesting: 'Polished before testing',
    clearDebrief: 'Clear debrief',
    ignoredFeedback: 'Ignored feedback',
    avoidedConflict: 'Avoided conflict',
    hidFailure: 'Hid a weak point',
    reskinnedGame: 'Copied a known game',
  };
  if (flag.startsWith('perspective:')) return `Perspective: ${flag.split(':')[1]}`;
  return labels[flag] ?? flag.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function storyBeat(nodeId: StoryNodeId) {
  const beats: Record<StoryNodeId, string> = {
    arrival: '{you} has not chosen a board game yet. The first choice is how to enter the group.',
    'circle-connect': 'The first bridge is built. Now the team must turn many topics into one playable system.',
    'circle-distance': '{you} has good observations, but the team needs a real invitation before the idea moves too far.',
    'circle-familiar': 'Comfort is useful, but staying comfortable can make the mixed team start without you.',
    'team-shared': 'The game idea belongs to several people. The next danger is talking about the game instead of testing it.',
    'team-solo': 'The rules are becoming clear, but the team is becoming an audience.',
    'team-fun': 'The energy is high. The risk is that the youth-work message becomes only a speech after play.',
    'prototype-playtest': 'The first test breaks the prototype. This is the moment where design becomes real.',
    'prototype-polish': 'The board looks better than the rule system. Now the team must choose truth or decoration.',
    'prototype-alone': '{you} can finish the object alone, but a group project also needs shared ownership.',
    'conflict-listen': 'The team uses conflict as information. A weak rule can become the best lesson.',
    'conflict-control': 'Control keeps the prototype stable, but it lowers trust and ownership.',
    'conflict-avoid': 'Avoided tension returns with higher cost. The group must repair it or hide it.',
    'night-repair': 'The team simplifies the game and finds one strong playable message.',
    'night-solo': 'The prototype is complete, but the process is fragile.',
    'night-honest': 'The team may not save the prototype, but it can still save the learning.',
    showcase: 'The final result is not only the board. It is the story of how choices shaped the team and the game.',
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

function findParticipant(name: string, protagonist: Protagonist): Participant {
  if (name === 'All Participants') return { name, country: 'Group' };
  if (name === protagonist.name) return protagonist;
  if (name === 'Emanuel') return { name, country: 'Trainer' };
  if (name === 'Rocco') return { name, country: 'Logistics' };
  if (name === 'Narrator') return { name, country: 'Story' };
  return participants.find((participant) => participant.name === name) ?? { name, country: 'Participant' };
}

function formatText(text: string, protagonist: Protagonist) {
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
