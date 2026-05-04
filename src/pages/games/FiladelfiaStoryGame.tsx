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

type DecisionPhase = 'morning' | 'evening';

type StoryMomentVariant = StoryMoment & {
  afterChoiceId?: string;
  profileFocus?: MeterKey[];
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

type StoryChoice = Choice & {
  phase: DecisionPhase;
  revealMomentId?: string;
};

type StoryDecisionSet = {
  id: string;
  phase: DecisionPhase;
  prompt: string;
  choices: StoryChoice[];
};

type StoryNode = {
  id: StoryNodeId;
  chapter: string;
  dayLabel: string;
  title: string;
  location: string;
  speaker: string;
  text: string;
  moments: StoryMomentVariant[];
  cast: string[];
  decisionSets: [StoryDecisionSet, StoryDecisionSet];
};

type StoryLogEntry = {
  nodeId: StoryNodeId;
  nodeTitle: string;
  dayLabel: string;
  location: string;
  moments: StoryMomentVariant[];
  morningChoice: StoryChoice;
  eveningChoice: StoryChoice;
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

type MorningContext = 'arrival' | 'design' | 'prototype' | 'conflict' | 'night' | 'showcase';

const nodeMorningContext: Record<StoryNodeId, MorningContext> = {
  arrival: 'arrival',
  'circle-connect': 'design',
  'circle-distance': 'design',
  'circle-familiar': 'arrival',
  'team-shared': 'design',
  'team-solo': 'design',
  'team-fun': 'design',
  'prototype-playtest': 'prototype',
  'prototype-polish': 'prototype',
  'prototype-alone': 'night',
  'conflict-listen': 'conflict',
  'conflict-control': 'conflict',
  'conflict-avoid': 'conflict',
  'night-repair': 'night',
  'night-solo': 'night',
  'night-honest': 'night',
  showcase: 'showcase',
};

const morningPrompts: Record<MorningContext, string> = {
  arrival: 'How does the morning start?',
  design: 'How does the team enter the work today?',
  prototype: 'How does the team handle the first pressure of the day?',
  conflict: 'How does the group face tension before it grows?',
  night: 'How does the evening work begin?',
  showcase: 'How does the team prepare the final moment?',
};

type MorningChoiceTemplate = Omit<StoryChoice, 'phase' | 'next'>;

const morningChoiceTemplates: Record<MorningContext, MorningChoiceTemplate[]> = {
  arrival: [
    {
      id: 'logistics-help',
      label: 'Help with the room',
      intention: 'Carry chairs, find markers, and let practical help become the first small conversation.',
      effects: { trust: 6, energy: -2, clarity: 2 },
      flags: ['logisticsHelp', 'informalBridge'],
      revealMomentId: 'logistics-followup',
      feedback: 'The room felt less strange once people were moving chairs and laughing about missing tape together.',
    },
    {
      id: 'informal-bridge',
      label: 'Start a small chat',
      intention: 'Ask a simple question to someone who looks unsure and let the answer stay human, not strategic.',
      effects: { trust: 6, inclusion: 6, energy: -2 },
      flags: ['informalBridge', 'includedQuietVoice'],
      revealMomentId: 'informal-followup',
      feedback: 'The small chat made the next group moment easier because one face was no longer a stranger.',
    },
    {
      id: 'profile-overuse',
      label: 'Lead with your habit',
      intention: 'Use the strongest habit of the selected participant immediately, even if the room may need something softer first.',
      effects: { clarity: 3, energy: 3, trust: -4, inclusion: -4 },
      flags: ['profileOverused'],
      revealMomentId: 'profile-followup',
      feedback: 'The strongest habit gave {you} a quick way in, but the room became shaped around one style too early.',
    },
  ],
  design: [
    {
      id: 'trainer-checkin',
      label: 'Ask Emanuel for a concrete check',
      intention: 'Ask Emanuel for one practical question the team can use right now.',
      effects: { clarity: 6, learning: 5, energy: -2 },
      flags: ['trainerCheckIn'],
      revealMomentId: 'trainer-followup',
      feedback: 'Emanuel gave the team one usable handle instead of a long explanation, and the table relaxed.',
    },
    {
      id: 'informal-bridge',
      label: 'Use the break well',
      intention: 'Use coffee or lunch to hear what someone could not say at the full table.',
      effects: { trust: 6, inclusion: 5, clarity: -1 },
      flags: ['informalBridge'],
      revealMomentId: 'informal-followup',
      feedback: 'The informal moment helped someone say clearly what they could not say at the full table.',
    },
    {
      id: 'profile-overuse',
      label: 'Push your strongest style',
      intention: 'Use the main strength of the selected participant hard because the team feels slow and the deadline feels close.',
      effects: { clarity: 3, energy: 3, trust: -3, inclusion: -3 },
      flags: ['profileOverused'],
      revealMomentId: 'profile-followup',
      feedback: 'The work moved, but some people adapted around {you} instead of entering fully.',
    },
  ],
  prototype: [
    {
      id: 'morning-repair',
      label: 'Test the weak part first',
      intention: 'Use the roughest rule before anyone can hide it under decoration or explanation.',
      effects: { clarity: 6, learning: 6, energy: -3 },
      flags: ['morningRepair', 'usedPlaytest'],
      revealMomentId: 'repair-followup',
      feedback: 'Testing the weak part early made the problem less personal and easier to repair.',
    },
    {
      id: 'logistics-help',
      label: 'Fix materials and roles',
      intention: 'Check pieces, markers, time, and roles so the test does not fail for boring reasons.',
      effects: { clarity: 5, trust: 3, energy: -2 },
      flags: ['logisticsHelp'],
      revealMomentId: 'logistics-followup',
      feedback: 'The practical setup lowered stress before the test and gave people clearer jobs.',
    },
    {
      id: 'team-fatigue',
      label: 'Ignore the tired signals',
      intention: 'Keep pushing because the deadline feels close, even when people are getting quiet.',
      effects: { clarity: 4, energy: -6, trust: -5, inclusion: -4 },
      flags: ['teamFatigue'],
      revealMomentId: 'fatigue-followup',
      feedback: 'The work moved, but tired people started to disappear from the process in small, quiet ways.',
    },
  ],
  conflict: [
    {
      id: 'morning-repair',
      label: 'Name the tension early',
      intention: 'Name the uncomfortable part while people can still listen to each other.',
      effects: { trust: 5, inclusion: 6, learning: 4, energy: -3 },
      flags: ['morningRepair'],
      revealMomentId: 'repair-followup',
      feedback: 'Naming the tension early made repair possible before people built walls around their positions.',
    },
    {
      id: 'trainer-checkin',
      label: 'Ask for a short trainer reset',
      intention: 'Ask Emanuel for one reset question, not a lecture or a rescue.',
      effects: { clarity: 6, learning: 5, trust: 2 },
      flags: ['trainerCheckIn'],
      revealMomentId: 'trainer-followup',
      feedback: 'The trainer reset helped the group speak about one concrete choice instead of the whole conflict.',
    },
    {
      id: 'team-fatigue',
      label: 'Keep the peace for now',
      intention: 'Avoid the hard conversation because everyone looks tired and the table needs air.',
      effects: { energy: 2, trust: -6, inclusion: -5, learning: -3 },
      flags: ['teamFatigue', 'avoidedConflict'],
      revealMomentId: 'fatigue-followup',
      feedback: 'The quiet moment felt easier, but the tension stayed in the room and waited.',
    },
  ],
  night: [
    {
      id: 'informal-bridge',
      label: 'Make tea and invite people back',
      intention: 'Make tea, invite people back gently, and ask for one last shared effort.',
      effects: { trust: 7, inclusion: 5, energy: -2 },
      flags: ['informalBridge'],
      revealMomentId: 'informal-followup',
      feedback: 'The team returned more easily because the invitation felt human before it felt productive.',
    },
    {
      id: 'clear-reflection',
      label: 'Write the reflection question first',
      intention: 'Write the one question players should discuss after the game, then cut anything that does not serve it.',
      effects: { learning: 7, clarity: 4, energy: -2 },
      flags: ['clearDebrief', 'trainerCheckIn'],
      revealMomentId: 'trainer-followup',
      feedback: 'The clear reflection question helped the team choose what to cut without fighting every card.',
    },
    {
      id: 'team-fatigue',
      label: 'Work through tiredness',
      intention: 'Keep going because tomorrow is too close, even if the group has no patience left.',
      effects: { clarity: 4, energy: -8, trust: -4, inclusion: -4 },
      flags: ['teamFatigue', 'profileOverused'],
      revealMomentId: 'fatigue-followup',
      feedback: 'The deadline got closer, and so did the risk of losing people inside the process.',
    },
  ],
  showcase: [
    {
      id: 'logistics-help',
      label: 'Prepare the room calmly',
      intention: 'Check chairs, timing, pieces, and player movement so nobody has to panic in public.',
      effects: { clarity: 5, trust: 4, energy: -2 },
      flags: ['logisticsHelp'],
      revealMomentId: 'logistics-followup',
      feedback: 'A calm setup helped the presentation feel less fragile before the first player arrived.',
    },
    {
      id: 'informal-bridge',
      label: 'Check on the team',
      intention: 'Ask people what they need before the first players arrive, not only what they will say.',
      effects: { trust: 6, inclusion: 5, learning: 2 },
      flags: ['informalBridge'],
      revealMomentId: 'informal-followup',
      feedback: 'The team entered the showcase feeling seen, not only prepared.',
    },
    {
      id: 'profile-overuse',
      label: 'Take the spotlight',
      intention: 'Use the strongest style of the selected participant to make the presentation feel safe and controlled.',
      effects: { clarity: 4, energy: 4, trust: -5, inclusion: -5 },
      flags: ['profileOverused', 'soloDesigner'],
      revealMomentId: 'profile-followup',
      feedback: 'The presentation looked safer, but the team had less room to show their own part.',
    },
  ],
};

function createDecisionSets(nodeId: StoryNodeId, eveningChoices: Choice[]): [StoryDecisionSet, StoryDecisionSet] {
  const context = nodeMorningContext[nodeId];
  return [
    {
      id: `${nodeId}-morning`,
      phase: 'morning',
      prompt: morningPrompts[context],
      choices: morningChoiceTemplates[context].map((choice) => ({
        ...choice,
        id: `${nodeId}-${choice.id}`,
        phase: 'morning',
        next: nodeId,
        effects: normalizeMorningEffects(choice.effects),
      })),
    },
    {
      id: `${nodeId}-evening`,
      phase: 'evening',
      prompt: 'How does the day continue?',
      choices: eveningChoices.map((choice) => ({
        ...choice,
        phase: 'evening',
      })),
    },
  ];
}

function normalizeMorningEffects(effects: Partial<Meters>) {
  return effects;
}

const storyNodes: Record<StoryNodeId, StoryNode> = {
  arrival: {
    id: 'arrival',
    chapter: 'Chapter 1',
    dayLabel: 'Day 1',
    title: 'Arrival at the Borgo',
    location: 'Residenza Antico Borgo, Filadelfia',
    speaker: 'Rocco',
    text: '{you} arrives at the old borgo after a long trip. People are looking for rooms, checking their phones, and trying to remember new names. It is the first afternoon of the project, and everything still feels new.',
    cast: ['Rocco', 'Emanuel', 'Sophie', 'Mihaela', 'Giuseppe', 'Buse Naz'],
    moments: [
      {
        id: 'arrival-courtyard',
        timeLabel: 'Afternoon arrival',
        title: 'Suitcases in the courtyard',
        location: 'Stone Courtyard',
        tone: 'Nervous and warm',
        text: 'The courtyard is busy. Suitcases roll over the stone floor, someone asks for Wi-Fi, and someone else helps carry bags. {you} hears many languages and the simple English everyone uses to understand each other.',
        dialogue: [
          { speaker: 'Rocco', text: 'Welcome. You can leave your bag near the desk. Take some water first, then I will show you the rooms.' },
          { speaker: 'Sophie', text: 'I do not know anyone yet. I am a bit nervous.' },
          { speaker: 'Mihaela', text: 'Me too. We can sit together for the first meeting if you want.' },
        ],
      },
      {
        id: 'arrival-evening-circle',
        timeLabel: 'Evening circle',
        title: 'Names, mistakes, and first laughs',
        location: 'Common Room',
        tone: 'Informal start',
        text: 'After dinner, everyone meets in the common room. People move chairs into a circle and talk about their trips while Emanuel waits for the group to settle.',
        dialogue: [
          { speaker: 'Emanuel', text: 'For tonight, let us keep it simple. Say your name, where you come from, and one thing you hope for this week.' },
          { speaker: 'Giuseppe', text: 'My hope is simple: when we play, I want to understand the rules before I lose.' },
          { speaker: 'Buse Naz', text: 'I hope we do not sit all week. A game should move people at least sometimes.' },
          { speaker: 'Narrator', text: '{you} notices who speaks easily, who stays quiet, and who seems nervous in the new group.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('arrival', [
      {
        id: 'connect-courtyard',
        label: 'Enter the circle',
        intention: 'Sit near Sophie and Mihaela, ask what they hope to learn this week, and let the first conversation stay simple.',
        effects: { trust: 10, inclusion: 8, energy: -2, learning: 4 },
        flags: ['builtAlliance', 'includedQuietVoice'],
        next: 'circle-connect',
        feedback: 'A simple question made the first circle less formal. The project still felt new, but {you} was no longer only watching it from the edge.',
      },
      {
        id: 'observe-courtyard',
        label: 'Observe first',
        intention: 'Listen carefully, notice who speaks and who waits, and join only after the room feels clearer.',
        effects: { clarity: 6, inclusion: 4, energy: -4 },
        flags: ['watchedGroup'],
        next: 'circle-distance',
        feedback: 'The quiet watching helped {you} understand the room, but the group did not yet know what {you} could bring.',
      },
      {
        id: 'stay-familiar',
        label: 'Stay with familiar voices',
        intention: 'Stay near people who feel easy to talk with and leave the awkward mixed circle for later.',
        effects: { energy: 8, trust: -4, inclusion: -8 },
        flags: ['ignoredTeam'],
        next: 'circle-familiar',
        feedback: 'The familiar corner made the evening easier, but it also made the bigger group feel farther away.',
      },
    ]),
  },
  'circle-connect': {
    id: 'circle-connect',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'The Mixed Team',
    location: 'Activity Room',
    speaker: 'Emanuel',
    text: 'The next morning, Emanuel creates mixed teams. {you} sits with Sophie, Mihaela, Rasim Hamza, Cristina, and Gjoko. The table has paper, markers, and many different ideas. The team has to choose one direction.',
    cast: ['Emanuel', 'Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'circle-connect-breakfast',
        timeLabel: 'Morning breakfast',
        title: 'A table with too many cups',
        location: 'Breakfast Room',
        tone: 'Friendly and unsure',
        text: 'Before the workshop, the team shares a breakfast table. Someone spills sugar near the cups, someone translates a word, and the first ideas start to appear.',
        dialogue: [
          { speaker: 'Sophie', text: 'I can explain better if I draw it. My English is slow this morning.' },
          { speaker: 'Mihaela', text: 'Draw it. We can understand the idea first and find the words after.' },
          { speaker: 'Rasim Hamza', text: 'Good. I need coffee before I can make serious decisions.' },
        ],
      },
      {
        id: 'circle-connect-workshop',
        timeLabel: 'Late morning workshop',
        title: 'One topic from many needs',
        location: 'Activity Room',
        tone: 'Focused',
        text: 'In the activity room, Emanuel explains the task: build a board game from a real need in youth work. The team understands that a nice title is not enough. The game needs a clear player action.',
        dialogue: [
          { speaker: 'Emanuel', text: 'Start with one real problem. Then ask what the player can do about it in the game. If players only listen to an explanation, we need to redesign it.' },
          { speaker: 'Cristina', text: 'Inclusion and misinformation can meet. A wrong signal can make the group leave someone outside.' },
          { speaker: 'Gjoko', text: 'Then the player should feel that choice during the game, not only hear about it after.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('circle-connect', [
      {
        id: 'map-needs',
        label: 'Map the needs',
        intention: 'Give each person one minute to explain the need behind their topic before the group chooses.',
        effects: { trust: 12, inclusion: 12, clarity: 8, learning: 8, energy: -4 },
        flags: ['sharedRoles', 'learningInsideMechanic'],
        next: 'team-shared',
        feedback: 'The team slowed down enough to hear the need behind each idea. The final topic felt less random and more shared.',
      },
      {
        id: 'take-structure',
        label: 'Take the structure role',
        intention: 'Offer to write the first rule draft because the table needs order now.',
        effects: { clarity: 12, energy: 2, trust: -4, inclusion: -6 },
        flags: ['soloDesigner'],
        next: 'team-solo',
        feedback: 'The rule draft helped the team organize the idea, but some people started to follow the notebook instead of talking to each other.',
      },
      {
        id: 'choose-funniest',
        label: 'Choose the funniest topic',
        intention: 'Push the idea that will make players laugh quickly and relax the room.',
        effects: { energy: 12, trust: 2, clarity: -6, learning: -10 },
        flags: ['funFirst'],
        next: 'team-fun',
        feedback: 'The room got louder and lighter. The learning target became harder to see inside the game.',
      },
    ]),
  },
  'circle-distance': {
    id: 'circle-distance',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'Quiet Notes, Loud Table',
    location: 'Activity Room',
    speaker: 'Narrator',
    text: '{you} spends the morning reading the room. The notes are careful, but the table is already moving. By the time {you} looks up, the first idea has started without a clear invitation.',
    cast: ['Emanuel', 'Kaotar', 'Elena', 'Ethan', 'Stefan', 'Loredana'],
    moments: [
      {
        id: 'circle-distance-morning',
        timeLabel: 'Morning workshop',
        title: 'Good notes, quiet chair',
        location: 'Activity Room',
        tone: 'Careful',
        text: '{you} writes names, topics, and small arrows between them. The notes make sense, but the voices across the table are getting faster.',
        dialogue: [
          { speaker: 'Kaotar', text: 'We need to choose soon. If we open ten ideas, we will build zero games and one headache.' },
          { speaker: 'Elena', text: 'I have an idea, but I need an example. I cannot explain it fast in English.' },
          { speaker: 'Ethan', text: 'Slow is fine. Give us one story, not a perfect sentence.' },
        ],
      },
      {
        id: 'circle-distance-lunch',
        timeLabel: 'Lunch break',
        title: 'The seat beside Elena',
        location: 'Lunch Table',
        tone: 'Small repair',
        text: 'At lunch, Elena draws a small map on a napkin. Away from the full table, her idea suddenly becomes easier to understand.',
        dialogue: [
          { speaker: 'Elena', text: 'This is what I meant. One player has information, but another player pays the cost.' },
          { speaker: 'Loredana', text: 'Now I see it. You needed paper, not more pressure.' },
          { speaker: 'Narrator', text: '{you} can still bring Elena idea back to the team before the group decides without her.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('circle-distance', [
      {
        id: 'invite-elena',
        label: 'Invite Elena in',
        intention: 'Ask Elena to explain the complicated idea with one example.',
        effects: { trust: 10, inclusion: 14, learning: 8, clarity: 2 },
        flags: ['includedQuietVoice', 'builtAlliance'],
        next: 'team-shared',
        feedback: 'Elena did not need a perfect speech. She needed someone to make space for the example, and the team gained a stronger idea.',
      },
      {
        id: 'write-alone',
        label: 'Write a clean concept alone',
        intention: 'Use your notes to create a complete concept before the group drifts.',
        effects: { clarity: 14, energy: -4, trust: -8, inclusion: -8 },
        flags: ['soloDesigner', 'ignoredTeam'],
        next: 'team-solo',
        feedback: 'The concept became neat on paper. Around the table, it felt more like something to approve than something to build.',
      },
      {
        id: 'follow-loud',
        label: 'Follow the loud idea',
        intention: 'Let Ethan and Stefan lead with the energetic proposal.',
        effects: { energy: 10, trust: 2, learning: -8, inclusion: -6 },
        flags: ['funFirst', 'ignoredTeam'],
        next: 'team-fun',
        feedback: 'The loud idea gave the group movement, but the shared reason for the game became weaker.',
      },
    ]),
  },
  'circle-familiar': {
    id: 'circle-familiar',
    chapter: 'Chapter 2',
    dayLabel: 'Day 2',
    title: 'The Easy Corner',
    location: 'Coffee Break Table',
    speaker: 'Rocco',
    text: 'Rocco arrives with biscuits and the coffee table becomes the easiest place in the project. {you} laughs there for a while, but the mixed teams are forming across the room.',
    cast: ['Rocco', 'Claudia', 'Giuseppe', 'Buse Naz', 'Ognjen'],
    moments: [
      {
        id: 'circle-familiar-coffee',
        timeLabel: 'Morning coffee',
        title: 'The easy corner',
        location: 'Coffee Break Table',
        tone: 'Comfortable',
        text: 'The coffee table feels easy. People laugh about travel delays, compare bus routes, and try to remember each other names.',
        dialogue: [
          { speaker: 'Claudia', text: 'I already forgot three names. I need to check the badges again.' },
          { speaker: 'Giuseppe', text: 'Stay here. We have biscuits and no decisions.' },
          { speaker: 'Rocco', text: 'Biscuits help, yes. But your mixed team is starting now, and there is still a chair for you.' },
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
          { speaker: 'Rocco', text: 'Go in with a question. It is easier than arriving late with a full plan.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('circle-familiar', [
      {
        id: 'repair-entry',
        label: 'Repair the entry',
        intention: 'Move to the mixed team and ask what role is still missing.',
        effects: { trust: 6, inclusion: 8, clarity: 4, energy: -2 },
        flags: ['builtAlliance'],
        next: 'team-shared',
        feedback: 'The late arrival was awkward for a few seconds, then useful. A question gave the team a way to include {you}.',
      },
      {
        id: 'keep-control',
        label: 'Offer a ready plan',
        intention: 'Tell the team you already have a structure to save time.',
        effects: { clarity: 12, trust: -8, inclusion: -10, energy: 2 },
        flags: ['soloDesigner', 'ignoredTeam'],
        next: 'team-solo',
        feedback: 'The ready plan saved time, but the others had less space to shape the idea.',
      },
      {
        id: 'make-party-game',
        label: 'Make a party game',
        intention: 'Build around fast laughter and simple challenges.',
        effects: { energy: 14, learning: -12, clarity: -4 },
        flags: ['funFirst'],
        next: 'team-fun',
        feedback: 'Everyone could imagine the fun quickly. When Emanuel asked about the learning, the table needed more time.',
      },
    ]),
  },
  'team-shared': {
    id: 'team-shared',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'A Board With Many Hands',
    location: 'Workshop Table',
    speaker: 'Sophie',
        text: 'The team chooses a board game about inclusion and misinformation. The idea is still rough, but the direction is clear: players need to decide whom to trust, who to invite back in, and when to check a source before moving.',
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'team-shared-morning',
        timeLabel: 'Morning build',
        title: 'Paper everywhere',
        location: 'Workshop Table',
        tone: 'Busy and shared',
        text: 'The table fills with paper arrows, coins, and half-written cards. Nobody owns the whole idea, so the work is slower. It is also harder to leave anyone behind.',
        dialogue: [
          { speaker: 'Sophie', text: 'What if each player sees only part of the information and has to decide whether to trust it?' },
          { speaker: 'Rasim Hamza', text: 'Then checking a source is not a school quiz. It is a move you choose when the game puts pressure on you.' },
          { speaker: 'Mihaela', text: 'And if players ignore one person too long, the team should feel the cost.' },
        ],
      },
      {
        id: 'team-shared-evening',
        timeLabel: 'After dinner',
        title: 'The rule on the napkin',
        location: 'Courtyard Steps',
        tone: 'Relaxed discovery',
        text: 'The team says they are taking a break, but the game follows them outside. Cristina draws a turn order on a napkin while people pass around snacks and pretend not to work.',
        dialogue: [
          { speaker: 'Cristina', text: 'Maybe the question is simple: do we win faster alone, or better together?' },
          { speaker: 'Gjoko', text: 'That is a good rule. Keep the napkin. We can copy it into the notebook later.' },
          { speaker: 'Narrator', text: '{you} sees that some useful project decisions happen during breaks too.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('team-shared', [
      {
        id: 'test-ugly-loop',
        label: 'Playtest the ugly loop',
        intention: 'Use paper, coins, and six cards to test one full round now.',
        effects: { clarity: 14, learning: 12, trust: 6, energy: -4 },
        flags: ['usedPlaytest', 'learningInsideMechanic'],
        next: 'prototype-playtest',
        feedback: 'The rough loop was ugly, but it showed what the rules really did to a player.',
      },
      {
        id: 'divide-shared-roles',
        label: 'Divide roles clearly',
        intention: 'Assign rules, board, cards, and reflection question to different people.',
        effects: { trust: 8, inclusion: 8, clarity: 8, energy: 2 },
        flags: ['sharedRoles'],
        next: 'prototype-playtest',
        feedback: 'The roles made the shared work visible. People could point to their part and still see the whole game.',
      },
      {
        id: 'decorate-first',
        label: 'Make it beautiful first',
        intention: 'Create cards, colors, and board spaces before testing.',
        effects: { energy: -6, clarity: 4, learning: -8, trust: -2 },
        flags: ['polishedBeforeTesting'],
        next: 'prototype-polish',
        feedback: 'The table looked better, but the main rule was still a promise, not a tested experience.',
      },
    ]),
  },
  'team-solo': {
    id: 'team-solo',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'The Prototype in One Notebook',
    location: 'Quiet Corner',
    speaker: 'Narrator',
    text: 'The notebook starts as a useful tool. {you} writes rules, arrows, and examples faster than the group can discuss them. The prototype becomes clearer, but the people around it begin to look more like readers than co-designers.',
    cast: ['Kiril', 'Hatche', 'Liviu', 'Claudia', 'Mehmet Emin'],
    moments: [
      {
        id: 'team-solo-morning',
        timeLabel: 'Morning build',
        title: 'One notebook, many eyes',
        location: 'Quiet Corner',
        tone: 'Productive but tight',
        text: '{you} writes fast because the pressure feels real. The rules become clearer with every line, and the table becomes quieter with every line too.',
        dialogue: [
          { speaker: 'Kiril', text: 'I can follow the rule system. I just do not know where my idea can enter without breaking it.' },
          { speaker: 'Hatche', text: 'Can we touch the prototype before it becomes too finished to touch?' },
          { speaker: 'Mehmet Emin', text: 'If only one person can explain it, players will depend on that person too. Maybe that is a warning.' },
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
          { speaker: 'Narrator', text: '{you} still has time to ask the team to work directly on the notebook.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('team-solo', [
      {
        id: 'open-notebook',
        label: 'Open the notebook',
        intention: 'Stop writing and ask each person to change one rule.',
        effects: { trust: 10, inclusion: 12, clarity: -2, learning: 6 },
        flags: ['sharedRoles', 'includedQuietVoice'],
        next: 'prototype-playtest',
        feedback: 'The notebook became a shared object again. The prototype got messier, but people leaned back into it.',
      },
      {
        id: 'finish-alone',
        label: 'Build alone tonight',
        intention: 'Finish the board yourself so the team has something complete.',
        effects: { clarity: 16, energy: -12, trust: -12, inclusion: -14 },
        flags: ['soloDesigner'],
        next: 'prototype-alone',
        feedback: 'The prototype moved forward quickly. The team moved backward quietly.',
      },
      {
        id: 'make-polished-board',
        label: 'Polish the board',
        intention: 'Use the clean rules to create a beautiful final board.',
        effects: { clarity: 8, energy: -8, learning: -8, inclusion: -6 },
        flags: ['polishedBeforeTesting'],
        next: 'prototype-polish',
        feedback: 'The board began to look official before anyone knew if a player could actually use it.',
      },
    ]),
  },
  'team-fun': {
    id: 'team-fun',
    chapter: 'Chapter 3',
    dayLabel: 'Day 3',
    title: 'The Laughing Prototype',
    location: 'Courtyard Table',
    speaker: 'Buse Naz',
    text: 'The team builds around fast challenges, jokes, and silly penalties. The room finally has movement. Then Emanuel asks the question that makes the laughter pause: where does the youth-work learning live inside the rules?',
    cast: ['Buse Naz', 'Ethan', 'Stefan', 'Loredana', 'Emanuel'],
    moments: [
      {
        id: 'team-fun-morning',
        timeLabel: 'Morning energy',
        title: 'The loud prototype',
        location: 'Courtyard Table',
        tone: 'Playful',
        text: 'The table becomes loud quickly. People test silly penalties before the rules are written, and for a while the project feels more alive than organized.',
        dialogue: [
          { speaker: 'Ethan', text: 'If people move and laugh, they will pay attention. I think that can work.' },
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
        text: 'The jokes still work in late afternoon. Loredana laughs too, then looks at the paper cards for a long moment and asks what players will remember tomorrow.',
        dialogue: [
          { speaker: 'Loredana', text: 'I like the energy. I just cannot see the learning yet.' },
          { speaker: 'Emanuel', text: 'Keep the fun, but connect it to the learning. What should players understand while they are laughing?' },
          { speaker: 'Narrator', text: '{you} can protect the laughter as it is, or help it carry a clearer message.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('team-fun', [
      {
        id: 'add-learning-rule',
        label: 'Put learning inside one rule',
        intention: 'Add a rule where players must include a quiet voice to unlock progress.',
        effects: { learning: 14, inclusion: 10, clarity: 4, energy: -2 },
        flags: ['learningInsideMechanic', 'includedQuietVoice'],
        next: 'prototype-playtest',
        feedback: 'The message moved from a speech after the game into something players could do during the game.',
      },
      {
        id: 'sell-party-energy',
        label: 'Protect the fun',
        intention: 'Keep the game fast and trust the final reflection to explain the meaning later.',
        effects: { energy: 12, learning: -12, clarity: -6 },
        flags: ['funFirst'],
        next: 'prototype-polish',
        feedback: 'The game stayed funny. The message waited outside the rules, hoping the final reflection would carry it.',
      },
      {
        id: 'copy-classic',
        label: 'Copy a known board game',
        intention: 'Use familiar rules and paste the project topic on top.',
        effects: { clarity: 8, energy: 4, learning: -14, inclusion: -4 },
        flags: ['reskinnedGame'],
        next: 'prototype-polish',
        feedback: 'Players would understand the familiar structure, but the topic still felt pasted on top instead of built into the action.',
      },
    ]),
  },
  'prototype-playtest': {
    id: 'prototype-playtest',
    chapter: 'Chapter 4',
    dayLabel: 'Day 4',
    title: 'The First Test Breaks Something',
    location: 'Activity Room Floor',
    speaker: 'Tester',
        text: 'The first real test begins on the floor. Mihaela and Sophie play one rough round, and a player gets blocked for three turns. After that, the team can see that the rule is a problem.',
    cast: ['Mihaela', 'Sophie', 'Gjoko', 'Cristina', 'Emanuel'],
    moments: [
      {
        id: 'prototype-playtest-morning',
        timeLabel: 'Morning test',
        title: 'The first round breaks',
        location: 'Activity Room Floor',
        tone: 'Useful tension',
        text: 'The team sits on the floor with paper cards spread between shoes and tape marks. The first player gets blocked and cannot do anything for three turns. At first everyone waits for it to feel meaningful. Then it only feels unfair.',
        dialogue: [
          { speaker: 'Sophie', text: 'I understand the topic, but on my turn I do not know what choice I have. I am just waiting to be allowed back.' },
          { speaker: 'Gjoko', text: 'Maybe that is the problem. The blocked player can only wait.' },
          { speaker: 'Mihaela', text: 'Then we are not showing exclusion well. We are just making one player wait with no real choice.' },
        ],
      },
      {
        id: 'prototype-playtest-evening',
        timeLabel: 'Evening debrief',
        title: 'Feedback over cold pizza',
        location: 'Common Room',
        tone: 'Tired but open',
        text: 'The team eats leftover pizza in the common room and keeps returning to the same turn. The unfair rule is still annoying, but now everyone understands the problem.',
        dialogue: [
          { speaker: 'Cristina', text: 'I was frustrated during the test, but that frustration gave us information.' },
          { speaker: 'Emanuel', text: 'Feedback can sound uncomfortable. Try to use it anyway. What is this test showing us?' },
          { speaker: 'Narrator', text: '{you} can treat the conflict as design information, defend the rule, or postpone the tension.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('prototype-playtest', [
      {
        id: 'turn-feedback-data',
        label: 'Turn feedback into data',
        intention: 'Ask what felt unfair, then change the rule immediately.',
        effects: { trust: 12, clarity: 10, inclusion: 8, learning: 10 },
        flags: ['usedPlaytest', 'clearDebrief'],
        next: 'conflict-listen',
        feedback: 'The difficult moment became design material. The team stopped asking who was right and started asking what the rule was doing.',
      },
      {
        id: 'defend-balance',
        label: 'Defend the balance',
        intention: 'Explain that losing turns is part of the challenge.',
        effects: { clarity: -4, trust: -12, inclusion: -10, learning: -6 },
        flags: ['ignoredFeedback'],
        next: 'conflict-control',
        feedback: '{you} protected the rulebook, but the players gave less information after that.',
      },
      {
        id: 'pause-tension',
        label: 'Pause the tension',
        intention: 'Say the team will fix it later and move to materials now.',
        effects: { energy: 4, trust: -8, clarity: -8, learning: -4 },
        flags: ['avoidedConflict'],
        next: 'conflict-avoid',
        feedback: 'The room felt calmer for a while. The problem stayed in the prototype, waiting for the next test.',
      },
    ]),
  },
  'prototype-polish': {
    id: 'prototype-polish',
    chapter: 'Chapter 4',
    dayLabel: 'Day 4',
    title: 'Beautiful Cards, Unclear Turns',
    location: 'Workshop Table',
    speaker: 'Giuseppe',
        text: 'The board now has colors, icons, and a name. It looks more complete than before. Then Giuseppe tries one turn and asks: what am I allowed to do?',
    cast: ['Giuseppe', 'Kaotar', 'Stasa', 'Stefan', 'Emanuel'],
    moments: [
      {
        id: 'prototype-polish-morning',
        timeLabel: 'Morning table',
        title: 'A board that looks finished',
        location: 'Workshop Table',
        tone: 'Proud and uncertain',
        text: 'The board has colors, icons, and a title written with the best marker. It looks ready from far away. Up close, the first turn is still unclear.',
        dialogue: [
          { speaker: 'Giuseppe', text: 'It looks finished, but I still do not understand my first move.' },
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
        text: 'After dinner, someone finds better markers and a small box for the cards. The prototype suddenly looks more official than it feels, and that makes it harder to admit what is weak.',
        dialogue: [
          { speaker: 'Stefan', text: 'If the box looks professional, maybe people will trust the rules.' },
          { speaker: 'Emanuel', text: 'The box can wait. First, make sure a player knows what to do on turn one.' },
          { speaker: 'Narrator', text: '{you} can cut the game back, hide the weak part, or invite players to help fix it.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('prototype-polish', [
      {
        id: 'cut-to-core',
        label: 'Cut to the core loop',
        intention: 'Remove half the cards and test only goal, choice, feedback.',
        effects: { clarity: 14, learning: 10, trust: 6, energy: -4 },
        flags: ['usedPlaytest', 'learningInsideMechanic'],
        next: 'conflict-listen',
        feedback: 'Removing content made the real game visible. The table looked poorer for a moment and worked better after it.',
      },
      {
        id: 'hide-weakness',
        label: 'Hide the weak rule',
        intention: 'Prepare a confident presentation and hope players do not notice.',
        effects: { clarity: -10, trust: -10, learning: -8, energy: 4 },
        flags: ['hidFailure', 'polishedBeforeTesting'],
        next: 'conflict-control',
        feedback: 'The prototype looked safer than it was. The weak rule did not disappear; it only became harder to discuss.',
      },
      {
        id: 'ask-co-design',
        label: 'Ask for co-design',
        intention: 'Invite Stasa and Stefan to change the unclear turn with you.',
        effects: { trust: 10, inclusion: 10, clarity: 6, learning: 6 },
        flags: ['sharedRoles', 'usedPlaytest'],
        next: 'conflict-listen',
        feedback: 'Players became co-designers, not judges. The unclear turn changed because people were allowed to touch it.',
      },
    ]),
  },
  'prototype-alone': {
    id: 'prototype-alone',
    chapter: 'Chapter 4',
    dayLabel: 'Night 4',
    title: 'The Solo Table',
    location: 'Common Room',
    speaker: 'Narrator',
    text: 'After dinner, {you} keeps working alone in the common room. The prototype becomes more complete with each cut of paper, but the empty chairs around the table become impossible to ignore.',
    cast: ['Rocco', 'Liviu', 'Claudia', 'Kiril'],
    moments: [
      {
        id: 'prototype-alone-after-dinner',
        timeLabel: 'After dinner',
        title: 'The empty chairs',
        location: 'Common Room',
        tone: 'Quiet pressure',
        text: '{you} keeps working after the others leave. The board becomes clearer, the rulebook becomes cleaner, and the chairs around the table stay empty.',
        dialogue: [
          { speaker: 'Rocco', text: 'Still working? I understand, but please drink water and get some sleep. Also, remember that this is a team project.' },
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
        text: 'The corridor is quiet. The team chat is open on the phone. A simple message is still unwritten: "I need help, not perfection."',
        dialogue: [
          { speaker: 'Kiril', text: 'Maybe the question is not: is it finished? Maybe it is: who can carry it?' },
          { speaker: 'Narrator', text: '{you} can invite a late test, finish alone, or admit that the work is stuck.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('prototype-alone', [
      {
        id: 'invite-late-test',
        label: 'Invite a late test',
        intention: 'Ask Liviu and Claudia to break the game before tomorrow.',
        effects: { clarity: 8, learning: 8, trust: 4, energy: -6 },
        flags: ['usedPlaytest'],
        next: 'conflict-listen',
        feedback: 'A late test helped the learning. It did not erase the lonely process, but it reopened the door.',
      },
      {
        id: 'finish-solo',
        label: 'Finish it alone',
        intention: 'Complete the board, rules, and reflection question without waking the team.',
        effects: { clarity: 12, energy: -14, trust: -14, inclusion: -14 },
        flags: ['soloDesigner', 'hidFailure'],
        next: 'night-solo',
        feedback: 'The game became finished and lonely. The table had a product, but not much shared memory.',
      },
      {
        id: 'admit-stuck',
        label: 'Admit you are stuck',
        intention: 'Write to the team chat: I need help, not perfection.',
        effects: { trust: 12, inclusion: 8, learning: 8, clarity: -2 },
        flags: ['sharedRoles', 'clearDebrief'],
        next: 'night-repair',
        feedback: 'The honest message felt risky, but it gave the team a real way back in.',
      },
    ]),
  },
  'conflict-listen': {
    id: 'conflict-listen',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'Repair Through Listening',
    location: 'Courtyard',
    speaker: 'Cristina',
        text: 'The team finally says the problem clearly. Some players have power, while others wait. The game is teaching the opposite of what the group wants. Once the team says this, they can change the board.',
    cast: ['Cristina', 'Mihaela', 'Sophie', 'Gjoko', 'Emanuel'],
    moments: [
      {
        id: 'conflict-listen-morning',
        timeLabel: 'Morning repair',
        title: 'Naming the unfair part',
        location: 'Courtyard',
        tone: 'Honest',
        text: 'The team sits outside because the activity room is too hot. In the courtyard, it is easier to talk about the conflict calmly.',
        dialogue: [
          { speaker: 'Cristina', text: 'The unfair part was uncomfortable, but it showed us the real topic. I hated the turn, and that is useful information.' },
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
        text: 'The team tries the new repair move on the activity room floor. The game is still rough, but the blocked player can act again. The group looks more relaxed.',
        dialogue: [
          { speaker: 'Mihaela', text: 'Now the blocked player can do something. That feels much better.' },
          { speaker: 'Emanuel', text: 'Yes. Now the rule shows both parts: exclusion and repair.' },
          { speaker: 'Narrator', text: '{you} can strengthen the repair move or keep the painful rule and explain it later.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('conflict-listen', [
      {
        id: 'design-repair-move',
        label: 'Design a repair move',
        intention: 'Add a rule where players can invite a blocked player back into action.',
        effects: { inclusion: 12, learning: 12, clarity: 8, trust: 8 },
        flags: ['learningInsideMechanic', 'clearDebrief'],
        next: 'night-repair',
        feedback: 'The message became playable. The rule now gave players a way to repair the same harm it created.',
      },
      {
        id: 'keep-as-lesson',
        label: 'Keep unfairness as lesson',
        intention: 'Keep the painful rule and explain it in the final reflection.',
        effects: { learning: 8, trust: -6, inclusion: -8, clarity: -4 },
        flags: ['clearDebrief'],
        next: 'night-honest',
        feedback: 'The reflection might explain the pain later, but the play experience still asks one player to wait too long.',
      },
    ]),
  },
  'conflict-control': {
    id: 'conflict-control',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'Control Costs Trust',
    location: 'Workshop Table',
    speaker: 'Kiril',
    text: 'The team follows the rules, and the prototype becomes stable. Nobody argues anymore. At first that feels like progress, until {you} notices that silence is not the same as agreement.',
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
          { speaker: 'Kiril', text: 'I can present the rulebook, but I do not feel this is our game. I feel like I am borrowing it.' },
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
        text: 'At dinner, the group talks about music, travel, and who has the strongest coffee at home. Nobody mentions the prototype until Buse Naz pushes her plate away.',
        dialogue: [
          { speaker: 'Buse Naz', text: 'It needs life. Right now players may follow it, but not care about it.' },
          { speaker: 'Narrator', text: '{you} can give the next decision back to the team, or protect the final form until the showcase.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('conflict-control', [
      {
        id: 'return-ownership',
        label: 'Return the game to the team',
        intention: 'Give the team the next decision, even if it changes your rules.',
        effects: { trust: 12, inclusion: 12, energy: -4, clarity: -2 },
        flags: ['sharedRoles'],
        next: 'night-repair',
        feedback: 'The game became less controlled and more shared. Some clarity was lost, but people started speaking again.',
      },
      {
        id: 'protect-final-form',
        label: 'Protect the final form',
        intention: 'Keep the rulebook stable so the showcase is not chaotic.',
        effects: { clarity: 10, trust: -12, inclusion: -10, learning: -6 },
        flags: ['soloDesigner', 'hidFailure'],
        next: 'night-solo',
        feedback: 'The prototype became stable. The team became distant, and the distance followed everyone into the evening.',
      },
    ]),
  },
  'conflict-avoid': {
    id: 'conflict-avoid',
    chapter: 'Chapter 5',
    dayLabel: 'Day 5',
    title: 'The Conflict Returns',
    location: 'Dinner Table',
    speaker: 'Loredana',
    text: 'The team tries to relax, but the same problem follows them into dinner. The plates are still on the table when someone says they do not want to present tomorrow.',
    cast: ['Loredana', 'Elena', 'Ognjen', 'Rocco'],
    moments: [
      {
        id: 'conflict-avoid-afternoon',
        timeLabel: 'Late afternoon',
        title: 'The problem waits',
        location: 'Workshop Door',
        tone: 'Uneasy',
        text: 'The team packs materials quickly. The disagreement is not solved, but everyone acts as if tape, scissors, and the next task can cover it.',
        dialogue: [
          { speaker: 'Elena', text: 'We said we would speak later. I think later is now.' },
          { speaker: 'Ognjen', text: 'If we speak now, maybe we lose time. If we do not speak, maybe we lose the team.' },
        ],
      },
      {
        id: 'conflict-avoid-dinner',
        timeLabel: 'Dinner',
        title: 'The sentence nobody wanted',
        location: 'Dinner Table',
        tone: 'Direct',
        text: 'The same problem returns during dinner. Loredana says she may not present tomorrow, and the table goes quiet.',
        dialogue: [
          { speaker: 'Loredana', text: 'I do not want to stand tomorrow and explain a game I do not believe in.' },
          { speaker: 'Rocco', text: 'You still have tonight. Do not panic. Speak honestly, decide what is realistic, and I can help with the room if you need it.' },
          { speaker: 'Narrator', text: '{you} can host a real conversation or smooth things over again.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('conflict-avoid', [
      {
        id: 'host-honest-circle',
        label: 'Host an honest circle',
        intention: 'Ask what each person needs to present with dignity.',
        effects: { trust: 10, inclusion: 12, learning: 8, energy: -6 },
        flags: ['clearDebrief', 'sharedRoles'],
        next: 'night-honest',
        feedback: 'The avoided conflict became a late but real conversation. It cost energy, but it gave people dignity again.',
      },
      {
        id: 'smooth-over-again',
        label: 'Smooth it over again',
        intention: 'Say tomorrow will be fine and keep people calm.',
        effects: { energy: 4, trust: -12, clarity: -8, learning: -8 },
        flags: ['avoidedConflict', 'hidFailure'],
        next: 'night-solo',
        feedback: 'The table stayed calm on the surface. Under it, the problem became a countdown to the showcase.',
      },
    ]),
  },
  'night-repair': {
    id: 'night-repair',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'The Game Finds Its Shape',
    location: 'Common Room',
    speaker: 'Narrator',
    text: 'The team stops trying to save every idea. They cut rules, test again, and write one clear reflection question. The board becomes simpler, and that simplicity gives people room to explain why it exists.',
    cast: ['Sophie', 'Mihaela', 'Rasim Hamza', 'Cristina', 'Gjoko'],
    moments: [
      {
        id: 'night-repair-evening',
        timeLabel: 'After dinner',
        title: 'Cutting the game smaller',
        location: 'Common Room',
        tone: 'Focused relief',
        text: 'The team removes cards, crosses out rules, and keeps only the strongest player choice. The table looks messy, but the game is easier to explain.',
        dialogue: [
          { speaker: 'Sophie', text: 'Now each turn has a real choice: move faster alone, or help someone re-enter the game. I can explain that without hiding behind the rulebook.' },
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
        text: 'The board is simple now. People are tired, but each person can explain one part without needing {you} to answer for them.',
        dialogue: [
          { speaker: 'Mihaela', text: 'This finally feels like our project, not only our topic.' },
          { speaker: 'Gjoko', text: 'Also, we should sleep before we start adding too much again.' },
          { speaker: 'Narrator', text: '{you} can present as a team or lead while clearly giving space and credit to the others.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('night-repair', [
      {
        id: 'present-as-team',
        label: 'Present as a team',
        intention: 'Let each person explain one part: rules, feeling, learning, reflection.',
        effects: { trust: 10, inclusion: 10, clarity: 6, learning: 8, energy: -2 },
        flags: ['sharedRoles', 'clearDebrief'],
        next: 'showcase',
        feedback: 'The showcase became shared work. Each person carried one part, and the presentation sounded like a team.',
      },
      {
        id: 'lead-but-credit',
        label: 'Lead and credit others',
        intention: 'Facilitate the presentation while naming each person by contribution.',
        effects: { clarity: 8, trust: 4, inclusion: 4, learning: 6 },
        flags: ['clearDebrief'],
        next: 'showcase',
        feedback: 'Leadership supported the team instead of replacing it. {you} held the frame and left space inside it.',
      },
    ]),
  },
  'night-solo': {
    id: 'night-solo',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'Finished, But Alone',
    location: 'Activity Room',
    speaker: 'Narrator',
    text: '{you} has a playable board. The pieces are aligned, the rulebook is ready, and the table looks calm. The team does not feel calm yet.',
    cast: ['Claudia', 'Kiril', 'Hatche', 'Rocco'],
    moments: [
      {
        id: 'night-solo-evening',
        timeLabel: 'Evening setup',
        title: 'The board is ready',
        location: 'Activity Room',
        tone: 'Impressive but lonely',
        text: '{you} aligns the pieces and checks the rulebook. The object is ready. The group story is not, and that difference sits heavily in the room.',
        dialogue: [
          { speaker: 'Claudia', text: 'I can help present the board, but I do not know why every rule is there. I can speak, but I cannot really answer.' },
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
        text: 'The activity room is quiet. It would be easy to present the prototype as a group success. It would not be honest, and {you} knows the team would feel that.',
        dialogue: [
          { speaker: 'Rocco', text: 'A complete board is not always a complete project. If the process was mostly solo, say it clearly and explain what you learned.' },
          { speaker: 'Narrator', text: '{you} can name the solo process or hide it behind a clean presentation.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('night-solo', [
      {
        id: 'own-solo-choice',
        label: 'Present it honestly',
        intention: 'Say the prototype is mostly yours and ask the team to reflect on who made the choices.',
        effects: { learning: 10, trust: 2, clarity: 4 },
        flags: ['clearDebrief', 'soloDesigner'],
        next: 'showcase',
        feedback: 'Honesty did not make the process perfect, but it made the learning real.',
      },
      {
        id: 'pretend-team-game',
        label: 'Pretend it was shared',
        intention: 'Present it as a group result and avoid the problem of who made the choices.',
        effects: { trust: -12, inclusion: -12, learning: -8, clarity: 2 },
        flags: ['hidFailure', 'soloDesigner'],
        next: 'showcase',
        feedback: 'The presentation looked easier for a few minutes. The hidden story became heavier for the people who lived it.',
      },
    ]),
  },
  'night-honest': {
    id: 'night-honest',
    chapter: 'Chapter 6',
    dayLabel: 'Night 5',
    title: 'A Prototype That May Fail',
    location: 'Common Room',
    speaker: 'Emanuel',
    text: 'The team admits the game may not fully work. Emanuel does not rescue the prototype for them. He helps the group find a way to rescue the learning without pretending.',
    cast: ['Emanuel', 'Elena', 'Loredana', 'Ognjen', 'Rocco'],
    moments: [
      {
        id: 'night-honest-evening',
        timeLabel: 'After dinner',
        title: 'The honest table',
        location: 'Common Room',
        tone: 'Brave and nervous',
        text: 'The team admits the game may not work tomorrow. Nobody is happy about it, but nobody pretends anymore.',
        dialogue: [
          { speaker: 'Emanuel', text: 'If the prototype is weak, do not hide it. Show the weak part and ask what it teaches.' },
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
        text: 'The team makes tea near the kitchen door and writes one sentence on the box: "Help us fix this rule." The sentence is small, but it changes the plan for tomorrow.',
        dialogue: [
          { speaker: 'Ognjen', text: 'We can show one broken round, then ask players to redesign the rule with us.' },
          { speaker: 'Rocco', text: 'It is not a perfect game, and that is okay. If you are honest about it, the presentation can still be useful.' },
          { speaker: 'Narrator', text: '{you} can show the failure openly or hide it and speak more than players play.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('night-honest', [
      {
        id: 'show-failure-openly',
        label: 'Show failure openly',
        intention: 'Run one broken round, then invite players to redesign it.',
        effects: { learning: 16, trust: 8, inclusion: 8, clarity: -2 },
        flags: ['clearDebrief'],
        next: 'showcase',
        feedback: 'The failure became a learning device because the team invited players into the repair.',
      },
      {
        id: 'hide-failure-final',
        label: 'Hide the failure',
        intention: 'Shorten the playtest and speak more than players play.',
        effects: { clarity: -6, trust: -8, learning: -8, energy: 2 },
        flags: ['hidFailure'],
        next: 'showcase',
        feedback: 'The game avoided risk, but it also avoided the part that could have taught the most.',
      },
    ]),
  },
  showcase: {
    id: 'showcase',
    chapter: 'Chapter 7',
    dayLabel: 'Final Day',
    title: 'The Games Are No Joke Showcase',
    location: 'Activity Room',
    speaker: 'Narrator',
        text: 'All teams gather for the final showcase. Chairs make a circle, boards cover the tables, and everyone is tired but focused. The board game is ready to be tested by others.',
    cast: ['Emanuel', 'Rocco', 'All Participants'],
    moments: [
      {
        id: 'showcase-morning',
        timeLabel: 'Morning setup',
        title: 'Tape, chairs, and nervous hands',
        location: 'Activity Room',
        tone: 'Anticipation',
        text: 'All teams prepare their tables. Someone fixes tape, someone practices the first sentence, and everyone looks at the door when new players arrive. {you} can feel the week inside the small details.',
        dialogue: [
          { speaker: 'Emanuel', text: 'When you present, keep it simple: show the rule, the choice, and what players feel. If you need ten minutes to explain the first turn, the game is asking for help.' },
          { speaker: 'Rocco', text: 'Let people play before you explain too much. They will understand more from one real turn than from a long speech.' },
          { speaker: 'Narrator', text: '{you} places the board on the table and thinks about the choices the team made during the week.' },
        ],
      },
      {
        id: 'showcase-after',
        timeLabel: 'After the showcase',
        title: 'The circle after play',
        location: 'Activity Room Circle',
        tone: 'Reflective',
        text: 'The last players stand up. Chairs move into a circle again. The board is still on the table, and the team is ready to talk about how they made it.',
        dialogue: [
          { speaker: 'Emanuel', text: 'Now tell us what players could feel, not only what they could win. That is where the youth-work part becomes visible.' },
          { speaker: 'Rocco', text: 'After this, we do the YouthPass reflection. Before that, give players time to react to the game.' },
          { speaker: 'Narrator', text: '{you} has one final choice: hold the reflection, sell the fun, or invite others to co-design the last rule.' },
        ],
      },
    ],
    decisionSets: createDecisionSets('showcase', [
      {
        id: 'invite-play-reflect',
        label: 'Play, observe, reflect',
        intention: 'Let players play, watch silently, then ask what the system made visible.',
        effects: { trust: 8, inclusion: 8, learning: 10, clarity: 4 },
        flags: ['clearDebrief'],
        next: 'ending',
        feedback: 'The final activity connected rules to reflection. Players talked about what the system made them feel, not only who won.',
      },
      {
        id: 'pitch-fun-only',
        label: 'Pitch the fun',
        intention: 'Sell the game as the most energetic prototype in the room.',
        effects: { energy: 10, learning: -8, clarity: -4 },
        flags: ['funFirst'],
        next: 'ending',
        feedback: 'Players smiled quickly, but the learning frame weakened before the reflection could hold it.',
      },
      {
        id: 'invite-co-design-final',
        label: 'Invite co-design',
        intention: 'Present the prototype as unfinished and ask players to improve one rule.',
        effects: { trust: 8, inclusion: 10, learning: 10, clarity: 2 },
        flags: ['usedPlaytest', 'clearDebrief'],
        next: 'ending',
        feedback: 'The final showcase became participation, not performance. The unfinished rule gave players a real place to enter.',
      },
    ]),
  },
};

const endings: Record<EndingId, Ending> = {
  'shared-board-game-success': {
    title: 'Shared Board Game Success',
    protagonistOutcome: '{you} helps the team stay inside the process together. The final idea carries more than one voice.',
    boardGameOutcome: 'The board game is simple, playable, and clearly about inclusion and misinformation.',
    teamOutcome: 'The group presents together. Quiet voices are not only thanked; they are visible in the rules.',
    logic: 'The path built trust, included people, tested early, shared roles, and put learning inside player actions.',
    howToReach: 'Build trust, share roles, test early, and make the lesson happen during play.',
    trainerReflection: 'Emanuel says: This is strong youth-work design. Players do not only hear about participation. They practice it through the rules.',
  },
  'solo-prototype-success': {
    title: 'Solo Prototype Success',
    protagonistOutcome: '{you} finishes a clear prototype, but too much of the journey happens in one notebook.',
    boardGameOutcome: 'The game works, but the reflection shows that the group did not fully own the choices behind it.',
    teamOutcome: 'The team respects the effort, but some people feel like helpers instead of co-designers.',
    logic: 'The path created clarity, but inclusion stayed low and many choices were made alone.',
    howToReach: 'Take control, finish the board mostly alone, and present with limited team involvement.',
    trainerReflection: 'Emanuel says: The prototype works, and that matters. Now look at the process too. Who had real ownership of the design?',
  },
  'fun-game-weak-message': {
    title: 'Fun Game, Weak Message',
    protagonistOutcome: '{you} helps create energy and laughter, but the youth-work lesson does not fully enter the rules.',
    boardGameOutcome: 'The game is fun, but the topic mostly appears after play, in the explanation.',
    teamOutcome: 'The team enjoys the moment, but the reflection is weak.',
    logic: 'The path chose fun many times. Energy stayed high, but learning stayed too low.',
    howToReach: 'Choose fun-first options, protect the party feeling, and skip strong learning rules.',
    trainerReflection: 'Emanuel says: Keep the fun, but connect it to the learning. Redesign one rule so the lesson happens while people play.',
  },
  'beautiful-board-broken-rules': {
    title: 'Beautiful Board, Broken Rules',
    protagonistOutcome: '{you} helps make a board that looks ready before players can really use it.',
    boardGameOutcome: 'The prototype looks good, but players do not understand what to do on their turn.',
    teamOutcome: 'The group loses confidence when the first players are confused.',
    logic: 'The path polished too early and hid weak rules instead of testing them.',
    howToReach: 'Decorate early, avoid testing the basic turn, and hide unclear rules before the showcase.',
    trainerReflection: 'Emanuel says: The board is beautiful, but a prototype is not a poster. First make the player action clear.',
  },
  'conflict-breaks-team': {
    title: 'Conflict Breaks the Team',
    protagonistOutcome: '{you} avoids or controls tension until the group cannot learn from it together.',
    boardGameOutcome: 'The game reaches the table, but the team cannot present it with real trust.',
    teamOutcome: 'Some participants step back. The conflict becomes the real lesson.',
    logic: 'The path avoided conflict, ignored feedback, and let trust and inclusion fall too low.',
    howToReach: 'Avoid disagreement, defend the rules, and do not repair the group process before the showcase.',
    trainerReflection: 'Emanuel says: Conflict is not automatically failure. It becomes useful only when the team is brave enough to work with it.',
  },
  'failed-prototype-strong-learning': {
    title: 'Failed Prototype, Strong Learning',
    protagonistOutcome: '{you} accepts that the game is unfinished and helps the team use the failure honestly.',
    boardGameOutcome: 'The prototype breaks, but the reflection is strong and specific.',
    teamOutcome: 'The team learns how testing, feedback, and humility improve design.',
    logic: 'The prototype stayed weak, but clear reflection and honest failure turned the problem into learning.',
    howToReach: 'Admit problems, show a broken round, and invite players to redesign the rule.',
    trainerReflection: 'Emanuel says: This is a valid prototype lesson. You did not hide the weak system. You let people learn from it.',
  },
};

export default function FiladelfiaStoryGame() {
  const { completeGame, saveGameNote, updatePrototypeField } = useStore();
  const [protagonist, setProtagonist] = useState<PlayerProfile | null>(null);
  const [nodeId, setNodeId] = useState<StoryNodeId>('arrival');
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [flags, setFlags] = useState<string[]>([]);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [selectedMorningChoice, setSelectedMorningChoice] = useState<StoryChoice | null>(null);
  const [endingId, setEndingId] = useState<EndingId | null>(null);
  const [lastFeedback, setLastFeedback] = useState('Choose a participant to begin the journey.');

  const node = storyNodes[nodeId];
  const ending = endingId ? endings[endingId] : null;
  const chosenChoiceIds = useMemo(() => new Set(storyLog.flatMap((entry) => [entry.morningChoice.id, entry.eveningChoice.id])), [storyLog]);

  const startStory = (selected: PlayerProfile) => {
    setProtagonist(selected);
    setNodeId('arrival');
    setMeters(applyProfilePoints(initialMeters, selected.points));
    setFlags([`perspective:${selected.id}`, `strength:${selected.strongestMeter}`, `risk:${selected.riskMeter}`]);
    setStoryLog([]);
    setSelectedMorningChoice(null);
    setEndingId(null);
    setLastFeedback(selected.opening);
    saveGameNote(game.id, `Story started as ${selected.name} from ${selected.country}`);
  };

  const chooseMorning = (choice: StoryChoice) => {
    if (!protagonist || selectedMorningChoice) return;
    const profiledChoice = applyProfileChoiceInfluence(choice, protagonist);
    const nextMeters = clampMeters(meters, profiledChoice.effects);
    const nextFlags = Array.from(new Set([...flags, ...(profiledChoice.flags ?? [])]));
    setMeters(nextMeters);
    setFlags(nextFlags);
    setSelectedMorningChoice(profiledChoice);
    setLastFeedback(profiledChoice.feedback);
  };

  const chooseEvening = (choice: StoryChoice) => {
    if (!protagonist) return;
    const morningChoice = selectedMorningChoice ?? node.decisionSets[0].choices[0];
    const nextMeters = clampMeters(meters, choice.effects);
    const nextFlags = Array.from(new Set([...flags, ...(choice.flags ?? [])]));
    const nextLog = [...storyLog, {
      nodeId: node.id,
      nodeTitle: node.title,
      dayLabel: node.dayLabel,
      location: node.location,
      moments: visibleMomentsForNode(node, morningChoice, protagonist, flags),
      morningChoice,
      eveningChoice: choice,
      chosenAction: choice.id,
      feedback: `${morningChoice.feedback} ${choice.feedback}`,
      meterChanges: mergeEffects(morningChoice.effects, choice.effects),
      flags: [...(morningChoice.flags ?? []), ...(choice.flags ?? [])],
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
    setSelectedMorningChoice(null);
    saveGameNote(game.id, `${protagonist.name}: ${storyNodes[choice.next].title}`);
  };

  const restart = () => {
    setProtagonist(null);
    setNodeId('arrival');
    setMeters(initialMeters);
    setFlags([]);
    setStoryLog([]);
    setSelectedMorningChoice(null);
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
                flags={flags}
                selectedMorningChoice={selectedMorningChoice}
                lastFeedback={lastFeedback}
                onChooseMorning={chooseMorning}
                onChooseEvening={chooseEvening}
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
  flags,
  selectedMorningChoice,
  lastFeedback,
  onChooseMorning,
  onChooseEvening,
}: {
  node: StoryNode;
  protagonist: PlayerProfile;
  meters: Meters;
  flags: string[];
  selectedMorningChoice: StoryChoice | null;
  lastFeedback: string;
  onChooseMorning: (choice: StoryChoice) => void;
  onChooseEvening: (choice: StoryChoice) => void;
}) {
  const morningDecision = node.decisionSets[0];
  const eveningDecision = node.decisionSets[1];
  const visibleMoments = visibleMomentsForNode(node, selectedMorningChoice, protagonist, flags);
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
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300">What {protagonist.name} notices</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-100">{formatText(perspectiveBeat(node.id, protagonist), protagonist)}</p>
          </div>

          <div className="mt-4 space-y-3">
            {visibleMoments.map((moment) => (
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
            What changed: {formatText(lastFeedback, protagonist)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {!selectedMorningChoice ? (
            <DecisionSetPanel decision={morningDecision} onChoose={onChooseMorning} />
          ) : (
            <>
              <div className="filadelfia-consequence-card rounded-lg border border-green-300/20 bg-green-300/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-300">Morning choice</p>
                <p className="mt-1 text-sm font-bold text-gray-100">{selectedMorningChoice.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">{formatText(selectedMorningChoice.feedback, protagonist)}</p>
              </div>
              <DecisionSetPanel decision={eveningDecision} onChoose={onChooseEvening} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionSetPanel({ decision, onChoose }: { decision: StoryDecisionSet; onChoose: (choice: StoryChoice) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-green-300">{decision.prompt}</p>
      {decision.choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onChoose(choice)}
          className="filadelfia-choice-card group w-full rounded-lg border border-white/10 bg-white/[.04] p-4 text-left transition-colors hover:border-green-300 hover:bg-green-300/10"
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
          <div className="mt-2 rounded border border-white/10 bg-black/25 p-2">
            <p className="text-[10px] font-black uppercase text-green-300">Morning choice</p>
            <p className="text-xs font-bold text-white">{entry.morningChoice.label}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{formatText(entry.morningChoice.feedback, protagonist)}</p>
          </div>
          <div className="mt-2 rounded border border-white/10 bg-black/25 p-2">
            <p className="text-[10px] font-black uppercase text-cyan-300">Evening choice</p>
            <p className="text-xs font-bold text-white">{entry.eveningChoice.label}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{formatText(entry.eveningChoice.feedback, protagonist)}</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-green-200">{formatText(entry.feedback, protagonist)}</p>
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
                {node.decisionSets.map((decision) => (
                  <div key={decision.id} className="rounded border border-white/10 bg-black/25 p-2">
                    <p className="text-[10px] font-black uppercase text-cyan-300">{decision.phase}</p>
                    <div className="mt-2 space-y-2">
                      {decision.choices.map((choice) => {
                        const chosen = chosenChoiceIds.has(choice.id);
                        return (
                          <div key={choice.id} className={`filadelfia-logic-choice rounded border p-2 ${chosen ? 'border-green-300 bg-green-300/10' : 'border-white/10 bg-black/40'}`}>
                            <p className={`text-xs font-bold ${chosen ? 'text-green-200' : 'text-gray-300'}`}>{choice.label}</p>
                            <p className="text-[10px] text-gray-500 mt-1">Next: {choice.phase === 'morning' ? 'Later situation' : choice.next === 'ending' ? 'Ending logic' : storyNodes[choice.next].title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
    morningRepair: 'Repaired early',
    informalBridge: 'Built an informal bridge',
    trainerCheckIn: 'Asked for trainer check-in',
    logisticsHelp: 'Helped with logistics',
    teamFatigue: 'Ignored team fatigue',
    profileOverused: 'Overused strongest style',
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

const speakerPools: Record<MorningContext, string[]> = {
  arrival: ['Rocco', 'Claudia', 'Giuseppe', 'Buse Naz', 'Sophie', 'Mihaela'],
  design: ['Emanuel', 'Kaotar', 'Rasim Hamza', 'Cristina', 'Gjoko', 'Elena', 'Stefan'],
  prototype: ['Giuseppe', 'Stasa', 'Liviu', 'Hatche', 'Mehmet Emin', 'Emanuel'],
  conflict: ['Loredana', 'Kiril', 'Elena', 'Ognjen', 'Cristina', 'Rocco'],
  night: ['Rocco', 'Claudia', 'Kiril', 'Mihaela', 'Ognjen', 'Emanuel'],
  showcase: ['Emanuel', 'Rocco', 'Sophie', 'Buse Naz', 'Stefan', 'Cristina'],
};

function visibleMomentsForNode(node: StoryNode, morningChoice: StoryChoice | null, protagonist: PlayerProfile, flags: string[]) {
  const firstMoment = personalizeMomentSpeakers(node.moments[0], node, protagonist, flags, 0);
  if (!morningChoice) return [firstMoment];
  return [firstMoment, buildFollowUpMoment(node, morningChoice, protagonist, flags)];
}

function buildFollowUpMoment(node: StoryNode, choice: StoryChoice, protagonist: PlayerProfile, flags: string[]): StoryMomentVariant {
  const base = node.moments[1] ?? node.moments[0];
  const context = nodeMorningContext[node.id];
  const speakerA = pickSpeaker(context, node.id, protagonist, flags, 1);
  const speakerB = pickSpeaker(context, node.id, protagonist, flags, 2);
  const facilitator = choice.id.includes('trainer') ? 'Emanuel' : choice.id.includes('logistics') ? 'Rocco' : speakerB;
  const variant = followUpCopy(choice, protagonist);
  return {
    ...base,
    id: `${base.id}-${choice.id}`,
    afterChoiceId: choice.id,
    profileFocus: [protagonist.strongestMeter],
    title: variant.title,
    text: variant.text,
    tone: variant.tone,
    dialogue: [
      { speaker: speakerA, text: variant.firstLine },
      { speaker: facilitator, text: variant.secondLine },
      { speaker: 'Narrator', text: variant.narratorLine },
    ],
  };
}

function personalizeMomentSpeakers(moment: StoryMomentVariant, node: StoryNode, protagonist: PlayerProfile, flags: string[], offset: number): StoryMomentVariant {
  const context = nodeMorningContext[node.id];
  const dialogue = moment.dialogue.map((line, index) => {
    if (line.speaker === 'Narrator' || line.speaker === 'Rocco' || line.speaker === 'Emanuel') return line;
    if (index > 1) return line;
    return {
      ...line,
      speaker: pickSpeaker(context, node.id, protagonist, flags, index + offset),
    };
  });
  return { ...moment, dialogue };
}

function followUpCopy(choice: StoryChoice, protagonist: PlayerProfile) {
  if (choice.id.includes('logistics')) {
    return {
      title: 'Chairs, tape, and easier talking',
      tone: 'Warm and practical',
      text: 'A room change, missing markers, and a late participant could slow the group down. Instead, the practical problem gives people a reason to stand up, help, and talk without the pressure of a formal discussion.',
      firstLine: 'I thought this was just moving chairs, but now I know three more names.',
      secondLine: 'Good. Practical help can make people more relaxed. Also, please keep the blue tape where everyone can find it.',
      narratorLine: `${protagonist.name} sees that practical care can build trust before the formal work starts.`,
    };
  }
  if (choice.id.includes('trainer')) {
    return {
      title: 'One question instead of a speech',
      tone: 'Clear and grounded',
      text: 'The team pauses for one practical question. Emanuel does not take over the work. He gives the group a clear next step.',
      firstLine: 'One question is enough. If we ask too many, we will get confused again.',
      secondLine: 'Fair. Try this: what should the player be able to do on a difficult turn?',
      narratorLine: `${protagonist.name} notices that a concrete question helps more than a perfect explanation.`,
    };
  }
  if (choice.id.includes('fatigue')) {
    return {
      title: 'Tired people become quiet',
      tone: 'Tense and tired',
      text: 'The work continues, but tired people become quieter. The deadline is close, and small problems start to sound bigger than they are.',
      firstLine: 'I am still here, but I am too tired to think clearly.',
      secondLine: 'Then we need a smaller next step, not a louder push.',
      narratorLine: `${protagonist.name} can feel the cost of speed: the project moves, but some people move away from it.`,
    };
  }
  if (choice.id.includes('profile-overuse')) {
    return {
      title: 'When a strength fills the room',
      tone: 'Productive but narrow',
      text: `${protagonist.name}'s strongest habit helps the group move, but it also starts to decide the shape of the room before other people can bring their own style.`,
      firstLine: 'This is clearer now, but I am not sure I helped make it.',
      secondLine: 'A strength is useful. Just make sure other people can still add their ideas.',
      narratorLine: `${protagonist.name} gets momentum, but the team needs more than one style.`,
    };
  }
  if (choice.id.includes('repair') || choice.id.includes('clear-reflection')) {
    return {
      title: 'Saying the hard part early',
      tone: 'Honest and calmer',
      text: 'The team names one weak point before it becomes a bigger conflict. The conversation is not easy, but it is specific enough to use.',
      firstLine: 'I can say it if we promise not to treat it like an attack.',
      secondLine: 'Say it. We are fixing a prototype, not judging a person.',
      narratorLine: `${protagonist.name} sees that early repair gives the team more options.`,
    };
  }
  return {
    title: 'A small bridge during the break',
    tone: 'Informal and human',
    text: 'The important conversation happens away from the main table, between cups, bags, and people looking for chargers. It is quieter there, so people speak more openly.',
    firstLine: 'It is easier to say this here than in front of everyone.',
    secondLine: 'Then let us bring it back to the team in a clear way.',
    narratorLine: `${protagonist.name} learns that informal time can change the formal work.`,
  };
}

function pickSpeaker(context: MorningContext, nodeId: StoryNodeId, protagonist: PlayerProfile, flags: string[], offset: number) {
  const pool = speakerPools[context].filter((name) => name !== protagonist.name);
  const seed = `${nodeId}:${protagonist.id}:${protagonist.strongestMeter}:${flags.join(',')}:${offset}`;
  return pool[deterministicIndex(seed, pool.length)] ?? 'Narrator';
}

function deterministicIndex(seed: string, length: number) {
  if (length <= 0) return 0;
  let total = 0;
  for (let index = 0; index < seed.length; index += 1) total = (total + seed.charCodeAt(index) * (index + 1)) % 9973;
  return total % length;
}

function applyProfileChoiceInfluence(choice: StoryChoice, protagonist: PlayerProfile): StoryChoice {
  if (!choice.flags?.includes('profileOverused')) return choice;
  const effects = mergeEffects(choice.effects, { [protagonist.strongestMeter]: 5 });
  return {
    ...choice,
    effects,
    feedback: `${choice.feedback} Because ${meterLabel(protagonist.strongestMeter).toLowerCase()} is the strongest habit for ${protagonist.name}, this choice pushes that side of the participant even more.`,
  };
}

function mergeEffects(...effectsList: Array<Partial<Meters>>) {
  return effectsList.reduce((merged, effects) => {
    (Object.entries(effects) as Array<[MeterKey, number]>).forEach(([key, value]) => {
      merged[key] = (merged[key] ?? 0) + value;
    });
    return merged;
  }, {} as Partial<Meters>);
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

function perspectiveBeat(nodeId: StoryNodeId, protagonist: PlayerProfile) {
  const beats: Record<StoryNodeId, string> = {
    arrival: 'The courtyard is full of luggage, greetings, and names that are still hard to remember. {you} has to decide whether to join the group now or watch for a while first.',
    'circle-connect': 'The first conversations helped {you} enter the group. The next challenge is choosing one idea without ignoring quieter voices.',
    'circle-distance': 'The notes are useful, but the table is moving without them. {you} notices the gap between understanding the group and being part of the group.',
    'circle-familiar': 'The easy corner feels comfortable, but the mixed team is starting somewhere else. {you} can stay there or join the group before decisions are made.',
    'team-shared': 'The table is slower because many people are adding ideas. {you} notices that the game feels more shared when more people can change it.',
    'team-solo': 'The notebook brings order, and order feels good under pressure. Still, {you} starts to see the others waiting for permission instead of adding their own marks.',
    'team-fun': 'The laughter helps the group relax. {you} also notices that the learning goal is still not clear enough inside the rules.',
    'prototype-playtest': 'The broken first round is uncomfortable, but it is honest. {you} can see exactly where a player loses agency, and that makes the problem easier to repair.',
    'prototype-polish': 'From across the room, the board looks ready. Up close, {you} notices the problem: a player can like the cards and still not know what to do.',
    'prototype-alone': 'The room is calmer when one person decides everything. {you} notices the cost in the empty chairs around the table.',
    'conflict-listen': 'The disagreement is no longer hidden. {you} hears frustration, but also hears the first clear clue for a better rule.',
    'conflict-control': 'The silence around the table looks efficient at first. {you} notices that people are not fighting, but they are also not offering much of themselves.',
    'conflict-avoid': 'The problem has followed the team from the workshop to dinner. {you} can feel that politeness is no longer enough to hold the group together.',
    'night-repair': 'The prototype is smaller now, and the team looks less stressed. {you} notices that people can explain their own part without waiting for one leader.',
    'night-solo': 'The board is ready, but the process was mostly solo. {you} notices the difference between finishing the game and building it together.',
    'night-honest': 'The team may not have a perfect game by morning. {you} notices that people are finally honest about the weak part.',
    showcase: 'The table, the chairs, and the players are ready. {you} notices that the final result includes both the board and the way the team built it.',
  };
  return `${beats[nodeId]} ${profileNotice(protagonist)}`;
}

function profileNotice(protagonist: PlayerProfile) {
  const notices: Record<MeterKey, string> = {
    trust: 'Because trust is the strongest part of this participant, safety and tension in the group stand out quickly.',
    clarity: 'Because clarity is the strongest part of this participant, missing steps and unclear rules are hard to ignore.',
    inclusion: 'Because inclusion is the strongest part of this participant, quiet faces and people outside the circle are easy to notice.',
    energy: 'Because energy is the strongest part of this participant, the mood of the room feels as important as the plan.',
    learning: 'Because learning is the strongest part of this participant, every rule starts to raise the same question: what will players understand through play?',
  };
  return notices[protagonist.strongestMeter];
}

function resolveEnding(meters: Meters, flags: string[]): EndingId {
  const has = (flag: string) => flags.includes(flag);
  if (has('teamFatigue') && has('profileOverused') && (meters.trust < 55 || meters.inclusion < 55)) return 'conflict-breaks-team';
  if ((has('hidFailure') || has('polishedBeforeTesting')) && meters.clarity < 58) return 'beautiful-board-broken-rules';
  if ((has('avoidedConflict') || has('ignoredFeedback')) && (meters.trust < 48 || meters.inclusion < 45)) return 'conflict-breaks-team';
  if (has('soloDesigner') && meters.clarity >= 62 && meters.inclusion < 58) return 'solo-prototype-success';
  if (has('funFirst') && meters.energy >= 68 && meters.learning < 58) return 'fun-game-weak-message';
  if (has('morningRepair') && has('clearDebrief') && meters.learning >= 64 && meters.trust >= 55) return 'failed-prototype-strong-learning';
  if (has('informalBridge') && has('sharedRoles') && meters.trust >= 62 && meters.inclusion >= 58) return 'shared-board-game-success';
  if (has('logisticsHelp') && has('usedPlaytest') && has('learningInsideMechanic') && meters.clarity >= 62) return 'shared-board-game-success';
  if (has('trainerCheckIn') && has('hidFailure') && meters.learning >= 62) return 'failed-prototype-strong-learning';
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
  return `${name} starts the week with ${meterLabel(strength).toLowerCase()} as the strongest habit. The main risk is personal too: ${riskText(risk)}`;
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
    const choice = node.decisionSets.flatMap((decision) => decision.choices).find((item) => item.id === choiceId);
    if (choice) return choice.label;
  }
  return choiceId;
}
