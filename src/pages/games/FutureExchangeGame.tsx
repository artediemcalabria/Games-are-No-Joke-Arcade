import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRightLeft,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Coins,
  Dices,
  FileText,
  Goal,
  Hammer,
  Heart,
  KeyRound,
  ListChecks,
  Map,
  MessageCircle,
  MonitorUp,
  Pencil,
  Presentation,
  Projector,
  RotateCcw,
  ShieldCheck,
  Smile,
  Sparkles,
  Target,
  Ticket,
  Truck,
  Users,
  Utensils,
  Volume2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { GameManualPanel, ManualButton, type ManualSection } from '../../components/GameManualPanel';
import { gameCatalog } from '../../data/course';
import { playSound } from '../../lib/audio';
import { useStore } from '../../store/useStore';

type ResourceId =
  | 'paper' | 'pencils' | 'creativity' | 'cards' | 'focus'
  | 'materialsKit' | 'ideaSketch' | 'clearNotes' | 'promptCards' | 'activityCards' | 'rules' | 'structure' | 'fairRules' | 'activityPlan' | 'playtestPlan' | 'youthLedGame'
  | 'trust' | 'youthVoice' | 'sharedVoice' | 'friendship' | 'inclusion' | 'energy' | 'safeGroupClimate' | 'welcomeMoment' | 'sharedAgreement'
  | 'teamBond' | 'reflection' | 'learningGoal' | 'debriefCircle' | 'youthpassCards'
  | 'budgetTokens' | 'travelTickets' | 'travelPlan' | 'roomKeys' | 'projector' | 'speaker' | 'presentationSetup' | 'showcaseSpace' | 'food' | 'carePackage' | 'logisticsReady'
  | 'localConnection' | 'communityImpact' | 'communityPresentation';
type GroupId = 'materials' | 'people' | 'learning' | 'logistics' | 'impact';
type TutorialStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type ActiveView = 'discover' | 'groups' | 'book' | 'collect' | 'trade' | 'board' | 'help';
type MeterKey = 'energy' | 'trust' | 'budget';
type Meters = Record<MeterKey, number>;
type EndingKind = 'ready' | 'care' | 'redesign';

type Resource = {
  id: ResourceId;
  name: string;
  short: string;
  group: GroupId;
  Icon: LucideIcon;
  meaning: string;
  color: string;
};
type Recipe = {
  id: string;
  category: 'Activity Design' | 'Group Climate' | 'Learning' | 'Logistics' | 'Impact';
  inputs: [ResourceId, ResourceId];
  output: ResourceId;
  learning: string;
  clue: string;
  aliasesForModule?: string[];
};
type Theory = {
  id: string;
  text: string;
};
type Module = {
  id: string;
  name: string;
  options: ResourceId[][];
  reflection: string;
};
type CollectSpot = {
  id: string;
  name: string;
  gives: ResourceId[];
  cost: Partial<Meters>;
  unlockStage: TutorialStage;
};
type Trader = {
  id: string;
  name: string;
  role: string;
  give: ResourceId;
  receive: ResourceId[];
  unlockStage: TutorialStage;
};

const game = gameCatalog.find((item) => item.id === 'future-exchange')!;

const resources: Record<ResourceId, Resource> = {
  paper: { id: 'paper', name: 'Paper', short: 'Paper', group: 'materials', Icon: FileText, meaning: 'A simple surface for ideas.', color: 'border-slate-200 bg-slate-200/20 text-slate-100' },
  pencils: { id: 'pencils', name: 'Pencils', short: 'Pencils', group: 'materials', Icon: Pencil, meaning: 'Tools for sketching first versions.', color: 'border-yellow-200 bg-yellow-200/20 text-yellow-100' },
  creativity: { id: 'creativity', name: 'Creativity', short: 'Creative', group: 'people', Icon: Sparkles, meaning: 'The spark that gives materials purpose.', color: 'border-amber-300 bg-amber-300/20 text-amber-100' },
  cards: { id: 'cards', name: 'Cards', short: 'Cards', group: 'materials', Icon: ClipboardList, meaning: 'Reusable pieces for prompts and actions.', color: 'border-violet-200 bg-violet-200/20 text-violet-100' },
  focus: { id: 'focus', name: 'Focus', short: 'Focus', group: 'people', Icon: Target, meaning: 'Attention that turns ideas into rules.', color: 'border-sky-300 bg-sky-300/20 text-sky-100' },
  materialsKit: { id: 'materialsKit', name: 'Materials Kit', short: 'Kit', group: 'materials', Icon: Boxes, meaning: 'Basic tools organized for creation.', color: 'border-cyan-200 bg-cyan-200/20 text-cyan-100' },
  ideaSketch: { id: 'ideaSketch', name: 'Idea Sketch', short: 'Sketch', group: 'materials', Icon: FileText, meaning: 'A rough idea that can be shared and changed.', color: 'border-fuchsia-200 bg-fuchsia-200/20 text-fuchsia-100' },
  clearNotes: { id: 'clearNotes', name: 'Clear Notes', short: 'Notes', group: 'materials', Icon: Pencil, meaning: 'Focused notes that help the team remember decisions.', color: 'border-sky-200 bg-sky-200/20 text-sky-100' },
  promptCards: { id: 'promptCards', name: 'Prompt Cards', short: 'Prompts', group: 'materials', Icon: Dices, meaning: 'Small triggers that make ideas playable.', color: 'border-violet-300 bg-violet-300/25 text-violet-100' },
  activityCards: { id: 'activityCards', name: 'Activity Cards', short: 'Activities', group: 'materials', Icon: ClipboardList, meaning: 'A playable set of activity prompts.', color: 'border-yellow-300 bg-yellow-300/25 text-yellow-100' },
  rules: { id: 'rules', name: 'Rules', short: 'Rules', group: 'materials', Icon: ListChecks, meaning: 'A way to test an idea through play.', color: 'border-slate-300 bg-slate-300/20 text-slate-100' },
  structure: { id: 'structure', name: 'Structure', short: 'Structure', group: 'materials', Icon: Goal, meaning: 'A frame that helps the group move.', color: 'border-blue-300 bg-blue-300/20 text-blue-100' },
  fairRules: { id: 'fairRules', name: 'Fair Rules', short: 'Fair Rules', group: 'materials', Icon: ShieldCheck, meaning: 'Rules that players can understand and accept.', color: 'border-emerald-300 bg-emerald-300/20 text-emerald-100' },
  activityPlan: { id: 'activityPlan', name: 'Activity Plan', short: 'Plan', group: 'materials', Icon: ClipboardList, meaning: 'A sequence that can be tested with young people.', color: 'border-yellow-300 bg-yellow-300/30 text-yellow-100' },
  playtestPlan: { id: 'playtestPlan', name: 'Playtest Plan', short: 'Playtest', group: 'materials', Icon: Hammer, meaning: 'A plan for testing before the real exchange.', color: 'border-orange-300 bg-orange-300/20 text-orange-100' },
  youthLedGame: { id: 'youthLedGame', name: 'Youth-Led Game', short: 'Youth Game', group: 'impact', Icon: Users, meaning: 'A game shaped by the voices of young people.', color: 'border-lime-300 bg-lime-300/20 text-lime-100' },
  trust: { id: 'trust', name: 'Trust', short: 'Trust', group: 'people', Icon: ShieldCheck, meaning: 'People feel safe enough to contribute.', color: 'border-green-300 bg-green-300/20 text-green-100' },
  youthVoice: { id: 'youthVoice', name: 'Youth Voice', short: 'Voice', group: 'people', Icon: MessageCircle, meaning: 'Young people shape the project.', color: 'border-fuchsia-300 bg-fuchsia-300/20 text-fuchsia-100' },
  sharedVoice: { id: 'sharedVoice', name: 'Shared Voice', short: 'Shared', group: 'people', Icon: Users, meaning: 'Different voices become one direction.', color: 'border-teal-300 bg-teal-300/20 text-teal-100' },
  friendship: { id: 'friendship', name: 'Friendship', short: 'Friendship', group: 'people', Icon: Heart, meaning: 'Connection that makes cooperation easier.', color: 'border-pink-300 bg-pink-300/20 text-pink-100' },
  inclusion: { id: 'inclusion', name: 'Inclusion', short: 'Inclusion', group: 'people', Icon: Users, meaning: 'Access and care are designed in.', color: 'border-cyan-300 bg-cyan-300/20 text-cyan-100' },
  energy: { id: 'energy', name: 'Energy', short: 'Energy', group: 'people', Icon: Zap, meaning: 'The group has strength to continue.', color: 'border-yellow-300 bg-yellow-300/20 text-yellow-100' },
  safeGroupClimate: { id: 'safeGroupClimate', name: 'Safe Group Climate', short: 'Safe Group', group: 'people', Icon: Smile, meaning: 'People can participate with less fear.', color: 'border-pink-300 bg-pink-300/25 text-pink-100' },
  welcomeMoment: { id: 'welcomeMoment', name: 'Welcome Moment', short: 'Welcome', group: 'people', Icon: Heart, meaning: 'A warm start for the exchange.', color: 'border-rose-300 bg-rose-300/20 text-rose-100' },
  sharedAgreement: { id: 'sharedAgreement', name: 'Shared Agreement', short: 'Agreement', group: 'people', Icon: ShieldCheck, meaning: 'Rules owned by the group.', color: 'border-emerald-300 bg-emerald-300/20 text-emerald-100' },
  teamBond: { id: 'teamBond', name: 'Team Bond', short: 'Team Bond', group: 'people', Icon: Heart, meaning: 'The group feels connected enough to take risks.', color: 'border-pink-300 bg-pink-300/25 text-pink-100' },
  reflection: { id: 'reflection', name: 'Reflection', short: 'Reflect', group: 'learning', Icon: BookOpen, meaning: 'A pause to name what changed.', color: 'border-indigo-300 bg-indigo-300/20 text-indigo-100' },
  learningGoal: { id: 'learningGoal', name: 'Learning Goal', short: 'Goal', group: 'learning', Icon: Goal, meaning: 'The reason behind the activity.', color: 'border-green-300 bg-green-300/25 text-green-100' },
  debriefCircle: { id: 'debriefCircle', name: 'Debrief Circle', short: 'Debrief', group: 'learning', Icon: MessageCircle, meaning: 'A safe moment to connect play with learning.', color: 'border-indigo-300 bg-indigo-300/25 text-indigo-100' },
  youthpassCards: { id: 'youthpassCards', name: 'YouthPass Cards', short: 'YouthPass', group: 'learning', Icon: BookOpen, meaning: 'Reflection becomes playable.', color: 'border-indigo-300 bg-indigo-300/25 text-indigo-100' },
  budgetTokens: { id: 'budgetTokens', name: 'Budget Tokens', short: 'Budget', group: 'logistics', Icon: Coins, meaning: 'Money as a limited project resource.', color: 'border-green-200 bg-green-200/20 text-green-100' },
  travelTickets: { id: 'travelTickets', name: 'Travel Tickets', short: 'Tickets', group: 'logistics', Icon: Ticket, meaning: 'Movement from places to the exchange.', color: 'border-blue-200 bg-blue-200/20 text-blue-100' },
  travelPlan: { id: 'travelPlan', name: 'Travel Plan', short: 'Travel', group: 'logistics', Icon: Ticket, meaning: 'Travel becomes organized and shared.', color: 'border-blue-300 bg-blue-300/25 text-blue-100' },
  roomKeys: { id: 'roomKeys', name: 'Room Keys', short: 'Keys', group: 'logistics', Icon: KeyRound, meaning: 'Access to spaces and timing.', color: 'border-orange-200 bg-orange-200/20 text-orange-100' },
  projector: { id: 'projector', name: 'Projector', short: 'Projector', group: 'logistics', Icon: Projector, meaning: 'A tool for sharing outputs.', color: 'border-cyan-200 bg-cyan-200/20 text-cyan-100' },
  speaker: { id: 'speaker', name: 'Speaker', short: 'Speaker', group: 'logistics', Icon: Volume2, meaning: 'Sound for group moments.', color: 'border-pink-200 bg-pink-200/20 text-pink-100' },
  presentationSetup: { id: 'presentationSetup', name: 'Presentation Setup', short: 'Setup', group: 'logistics', Icon: MonitorUp, meaning: 'Communication tools are ready.', color: 'border-cyan-300 bg-cyan-300/25 text-cyan-100' },
  showcaseSpace: { id: 'showcaseSpace', name: 'Showcase Space', short: 'Showcase', group: 'logistics', Icon: Presentation, meaning: 'The room is ready for sharing prototypes.', color: 'border-cyan-300 bg-cyan-300/25 text-cyan-100' },
  food: { id: 'food', name: 'Food', short: 'Food', group: 'logistics', Icon: Utensils, meaning: 'Basic care for the body.', color: 'border-red-200 bg-red-200/20 text-red-100' },
  carePackage: { id: 'carePackage', name: 'Care Package', short: 'Care', group: 'logistics', Icon: Utensils, meaning: 'Budget becomes care.', color: 'border-red-300 bg-red-300/20 text-red-100' },
  logisticsReady: { id: 'logisticsReady', name: 'Logistics Ready', short: 'Logistics', group: 'logistics', Icon: Truck, meaning: 'The practical system can work.', color: 'border-orange-300 bg-orange-300/25 text-orange-100' },
  localConnection: { id: 'localConnection', name: 'Local Connection', short: 'Local', group: 'impact', Icon: Map, meaning: 'The project touches the community.', color: 'border-lime-300 bg-lime-300/20 text-lime-100' },
  communityImpact: { id: 'communityImpact', name: 'Community Impact', short: 'Impact', group: 'impact', Icon: Presentation, meaning: 'The activity reaches beyond the room.', color: 'border-lime-300 bg-lime-300/25 text-lime-100' },
  communityPresentation: { id: 'communityPresentation', name: 'Community Presentation', short: 'Community', group: 'impact', Icon: Presentation, meaning: 'Young people share with the community.', color: 'border-lime-300 bg-lime-300/25 text-lime-100' },
};

const groupLabels: Record<GroupId, string> = {
  materials: 'Materials',
  people: 'People',
  learning: 'Learning',
  logistics: 'Logistics',
  impact: 'Impact',
};

const groupOrder: GroupId[] = ['materials', 'people', 'learning', 'logistics', 'impact'];
const startingResources: ResourceId[] = ['paper', 'pencils', 'creativity', 'cards', 'focus'];

const recipes: Recipe[] = [
  { id: 'materials-kit', category: 'Activity Design', inputs: ['paper', 'pencils'], output: 'materialsKit', learning: 'Materials become useful when they are organized.', clue: 'Paper connects with something used to draw.' },
  { id: 'idea-sketch', category: 'Activity Design', inputs: ['paper', 'creativity'], output: 'ideaSketch', learning: 'A rough sketch makes an idea visible to the team.', clue: 'Paper can hold a creative first idea.' },
  { id: 'clear-notes', category: 'Activity Design', inputs: ['pencils', 'focus'], output: 'clearNotes', learning: 'Focused notes help the group remember decisions.', clue: 'A writing tool becomes stronger with attention.' },
  { id: 'prompt-cards', category: 'Activity Design', inputs: ['cards', 'creativity'], output: 'promptCards', learning: 'Cards become playful when they carry surprising prompts.', clue: 'Cards need a creative spark.' },
  { id: 'rules', category: 'Activity Design', inputs: ['cards', 'focus'], output: 'rules', learning: 'Rules make an idea testable.', clue: 'Cards need focus before they become rules.' },
  { id: 'activity-cards', category: 'Activity Design', inputs: ['materialsKit', 'creativity'], output: 'activityCards', learning: 'Activity Cards show that tools become useful when creativity gives them purpose.', clue: 'A kit becomes playable with creativity.' },
  { id: 'activity-cards-from-prompts', category: 'Activity Design', inputs: ['promptCards', 'focus'], output: 'activityCards', learning: 'Focused prompts can become activity cards.', clue: 'Prompts need focus to become usable.' },
  { id: 'prompt-cards-from-sketch', category: 'Activity Design', inputs: ['ideaSketch', 'cards'], output: 'promptCards', learning: 'A sketched idea can become small playable prompts.', clue: 'A sketch can move onto cards.' },
  { id: 'structure-from-sketch', category: 'Activity Design', inputs: ['ideaSketch', 'focus'], output: 'structure', learning: 'Focus turns a sketch into a structure.', clue: 'A rough idea needs focus.' },
  { id: 'structure-from-rules', category: 'Activity Design', inputs: ['rules', 'materialsKit'], output: 'structure', learning: 'A structure helps people understand what to do next.', clue: 'Rules can organize materials.' },
  { id: 'rules-from-notes', category: 'Activity Design', inputs: ['clearNotes', 'cards'], output: 'rules', learning: 'Clear notes can become rules that players can test.', clue: 'Notes and cards can become instructions.' },
  { id: 'fair-rules-from-structure', category: 'Activity Design', inputs: ['structure', 'rules'], output: 'fairRules', learning: 'Fair rules need both structure and clear limits.', clue: 'Structure can make rules fairer.' },
  { id: 'fair-rules-from-trust', category: 'Group Climate', inputs: ['rules', 'trust'], output: 'fairRules', learning: 'Rules feel fairer when trust is present.', clue: 'Rules connect with trust.' },
  { id: 'activity-plan', category: 'Activity Design', inputs: ['activityCards', 'rules'], output: 'activityPlan', learning: 'A real activity plan needs prompts and rules together.', clue: 'Activities become a plan when rules guide them.', aliasesForModule: ['activity-plan'] },
  { id: 'activity-plan-from-prompts', category: 'Activity Design', inputs: ['promptCards', 'rules'], output: 'activityPlan', learning: 'Prompt cards plus rules can create a plan for the session.', clue: 'Prompts become stronger with rules.', aliasesForModule: ['activity-plan'] },
  { id: 'playtest-plan', category: 'Activity Design', inputs: ['activityPlan', 'focus'], output: 'playtestPlan', learning: 'A focused activity plan is ready for testing.', clue: 'A plan needs focus before playtesting.' },
  { id: 'playtest-plan-from-reflection', category: 'Learning', inputs: ['rules', 'reflection'], output: 'playtestPlan', learning: 'Reflection helps rules become something to test and improve.', clue: 'Rules improve with reflection.' },
  { id: 'shared-voice', category: 'Group Climate', inputs: ['trust', 'youthVoice'], output: 'sharedVoice', learning: 'Trust is a resource, not decoration.', clue: 'Trust connects with young people speaking.' },
  { id: 'team-bond', category: 'Group Climate', inputs: ['trust', 'friendship'], output: 'teamBond', learning: 'Trust and friendship create a stronger team bond.', clue: 'Trust can grow into connection.' },
  { id: 'team-bond-from-welcome', category: 'Group Climate', inputs: ['welcomeMoment', 'trust'], output: 'teamBond', learning: 'A good welcome can become real team trust.', clue: 'Welcome connects with trust.' },
  { id: 'safe-climate', category: 'Group Climate', inputs: ['friendship', 'inclusion'], output: 'safeGroupClimate', learning: 'A safe climate is designed before problems appear.', clue: 'Friendship needs inclusion to become safe.' },
  { id: 'safe-climate-from-team', category: 'Group Climate', inputs: ['teamBond', 'inclusion'], output: 'safeGroupClimate', learning: 'A bonded team becomes safer when inclusion is designed in.', clue: 'Team connection needs inclusion.' },
  { id: 'welcome-moment', category: 'Group Climate', inputs: ['carePackage', 'friendship'], output: 'welcomeMoment', learning: 'A welcome moment helps people enter the group.', clue: 'Care and friendship create welcome.' },
  { id: 'welcome-from-food', category: 'Group Climate', inputs: ['food', 'friendship'], output: 'welcomeMoment', learning: 'Small care moments can start with food and connection.', clue: 'Food can support connection.' },
  { id: 'shared-agreement', category: 'Group Climate', inputs: ['rules', 'sharedVoice'], output: 'sharedAgreement', learning: 'Rules become stronger when the group owns them.', clue: 'Rules need shared voice.' },
  { id: 'shared-agreement-from-fair', category: 'Group Climate', inputs: ['fairRules', 'youthVoice'], output: 'sharedAgreement', learning: 'Fair rules become agreements when youth voice shapes them.', clue: 'Fair rules connect with youth voice.' },
  { id: 'learning-goal', category: 'Learning', inputs: ['sharedVoice', 'reflection'], output: 'learningGoal', learning: 'Learning goals grow from voice and reflection.', clue: 'Shared voice becomes learning through reflection.', aliasesForModule: ['shared-topic'] },
  { id: 'learning-goal-from-sketch', category: 'Learning', inputs: ['ideaSketch', 'reflection'], output: 'learningGoal', learning: 'A rough idea becomes a learning goal when the group reflects on it.', clue: 'A sketch can become a goal through reflection.', aliasesForModule: ['shared-topic'] },
  { id: 'debrief-circle', category: 'Learning', inputs: ['youthVoice', 'reflection'], output: 'debriefCircle', learning: 'Debrief works when young people can name what they noticed.', clue: 'Voice and reflection create debrief.' },
  { id: 'debrief-from-notes', category: 'Learning', inputs: ['clearNotes', 'reflection'], output: 'debriefCircle', learning: 'Clear notes help the debrief stay connected to real play.', clue: 'Notes can support reflection.' },
  { id: 'youthpass-cards', category: 'Learning', inputs: ['learningGoal', 'cards'], output: 'youthpassCards', learning: 'Reflection becomes easier when players can hold it in their hands.', clue: 'A learning goal can move onto cards.' },
  { id: 'youthpass-from-debrief', category: 'Learning', inputs: ['debriefCircle', 'learningGoal'], output: 'youthpassCards', learning: 'YouthPass reflection grows from debrief and a clear goal.', clue: 'Debrief needs a learning goal.' },
  { id: 'youth-led-game', category: 'Impact', inputs: ['activityCards', 'youthVoice'], output: 'youthLedGame', learning: 'A game becomes youth-led when young voices shape the activity.', clue: 'Activity cards connect with youth voice.', aliasesForModule: ['shared-topic'] },
  { id: 'youth-led-game-from-goal', category: 'Impact', inputs: ['activityPlan', 'learningGoal'], output: 'youthLedGame', learning: 'A planned activity becomes stronger when its learning goal is visible.', clue: 'A plan needs a learning reason.' },
  { id: 'travel-plan', category: 'Logistics', inputs: ['budgetTokens', 'travelTickets'], output: 'travelPlan', learning: 'Budget and tickets become a travel plan.', clue: 'Budget connects with movement.' },
  { id: 'logistics-ready', category: 'Logistics', inputs: ['travelPlan', 'roomKeys'], output: 'logisticsReady', learning: 'Logistics is a system, not one object.', clue: 'Travel also needs access to rooms.' },
  { id: 'presentation-setup', category: 'Logistics', inputs: ['projector', 'speaker'], output: 'presentationSetup', learning: 'Tools support communication when they work together.', clue: 'Two communication tools can become a setup.' },
  { id: 'showcase-space', category: 'Logistics', inputs: ['presentationSetup', 'roomKeys'], output: 'showcaseSpace', learning: 'A showcase needs both communication tools and an accessible space.', clue: 'A setup needs a room.' },
  { id: 'showcase-space-from-kit', category: 'Logistics', inputs: ['roomKeys', 'materialsKit'], output: 'showcaseSpace', learning: 'A room plus materials can become a real showcase space.', clue: 'Keys can open space for materials.' },
  { id: 'care-package', category: 'Logistics', inputs: ['food', 'inclusion'], output: 'carePackage', learning: 'Care is practical, not only emotional.', clue: 'Food can become care when inclusion is present.' },
  { id: 'care-package-from-budget', category: 'Logistics', inputs: ['budgetTokens', 'food'], output: 'carePackage', learning: 'Budget becomes care when it protects basic needs.', clue: 'Budget can support food and care.' },
  { id: 'community-impact', category: 'Impact', inputs: ['localConnection', 'activityCards'], output: 'communityImpact', learning: 'Impact connects local reality with activity design.', clue: 'Local reality needs an activity to become impact.', aliasesForModule: ['follow-up'] },
  { id: 'community-impact-from-youth-game', category: 'Impact', inputs: ['localConnection', 'youthLedGame'], output: 'communityImpact', learning: 'Youth-led games can create community impact when they connect locally.', clue: 'Youth-led games can leave the room.', aliasesForModule: ['follow-up'] },
  { id: 'community-presentation', category: 'Impact', inputs: ['communityImpact', 'presentationSetup'], output: 'communityPresentation', learning: 'Impact grows when young people can share it.', clue: 'Impact needs a way to be shown.', aliasesForModule: ['follow-up'] },
  { id: 'community-presentation-from-showcase', category: 'Impact', inputs: ['communityImpact', 'showcaseSpace'], output: 'communityPresentation', learning: 'A showcase space helps impact become visible.', clue: 'Impact can use a showcase.' },
  { id: 'community-presentation-from-playtest', category: 'Impact', inputs: ['playtestPlan', 'communityImpact'], output: 'communityPresentation', learning: 'Testing with the community makes the final presentation stronger.', clue: 'Impact improves when it is tested.' },
];

const modules: Module[] = [
  { id: 'activity-plan', name: 'Activity Plan', options: [['activityPlan'], ['activityCards'], ['activityCards', 'rules']], reflection: 'Activity Plan: playful learning starts from clear activity pieces.' },
  { id: 'shared-topic', name: 'Shared Topic', options: [['learningGoal'], ['youthLedGame']], reflection: 'Shared Topic: the exchange is stronger when the learning reason is clear.' },
  { id: 'partner-team', name: 'Partner Team', options: [['teamBond', 'sharedAgreement'], ['sharedAgreement', 'safeGroupClimate']], reflection: 'Partner Team: cooperation needs trust and shared agreements.' },
  { id: 'logistics', name: 'Logistics', options: [['logisticsReady', 'showcaseSpace'], ['logisticsReady', 'carePackage']], reflection: 'Logistics: practical support protects learning time.' },
  { id: 'inclusion', name: 'Inclusion', options: [['safeGroupClimate', 'carePackage'], ['safeGroupClimate', 'welcomeMoment']], reflection: 'Inclusion: access and welcome must be designed.' },
  { id: 'youthpass', name: 'YouthPass', options: [['debriefCircle'], ['youthpassCards']], reflection: 'YouthPass: learning becomes useful when participants can name it.' },
  { id: 'follow-up', name: 'Follow-Up', options: [['communityImpact'], ['communityPresentation']], reflection: 'Follow-Up: impact continues when learning leaves the activity room.' },
];

const collectSpots: CollectSpot[] = [
  { id: 'group-circle', name: 'Group Circle', gives: ['trust', 'youthVoice', 'friendship'], cost: { energy: -2 }, unlockStage: 5 },
  { id: 'reflection-wall', name: 'Reflection Wall', gives: ['reflection', 'inclusion'], cost: { energy: -2 }, unlockStage: 5 },
  { id: 'travel-desk', name: 'Travel Desk', gives: ['budgetTokens', 'travelTickets', 'food'], cost: { budget: -4 }, unlockStage: 5 },
  { id: 'venue-office', name: 'Venue Office', gives: ['roomKeys', 'projector', 'speaker'], cost: { budget: -3, energy: -1 }, unlockStage: 5 },
  { id: 'filadelfia-map', name: 'Filadelfia Map', gives: ['localConnection'], cost: { energy: -2 }, unlockStage: 7 },
];

const traders: Trader[] = [
  { id: 'andrea', name: 'Andrea', role: 'Creative connector', give: 'focus', receive: ['creativity', 'friendship'], unlockStage: 6 },
  { id: 'ivalina', name: 'Ivalina', role: 'Inclusion keeper', give: 'paper', receive: ['inclusion', 'reflection'], unlockStage: 7 },
  { id: 'rocco', name: 'Rocco', role: 'Logistics support', give: 'budgetTokens', receive: ['roomKeys', 'projector', 'speaker'], unlockStage: 7 },
];

const initialMeters: Meters = { energy: 84, trust: 66, budget: 78 };

const manualSections: ManualSection[] = [
  { title: 'How discovering works', items: ['Tap one element.', 'Tap a second element.', 'Press Combine to see if they create something new.'] },
  { title: 'First discoveries', items: ['Paper + Pencils -> Materials Kit.', 'Materials Kit + Creativity -> Activity Cards.', 'Cards + Focus -> Rules.'] },
  { title: 'Goal', items: ['Discover project resources.', 'Use them to install the 7 KA152 modules.', 'Keep Energy, Trust, and Budget healthy.'] },
  { title: 'Design lesson', items: ['A youth exchange is a system.', 'Materials, people, learning, logistics, and impact all connect.'] },
  { title: 'Show all recipes', items: recipes.map((recipe) => `${label(recipe.inputs[0])} + ${label(recipe.inputs[1])} -> ${label(recipe.output)}`) },
];

export default function FutureExchangeGame() {
  const { completeGame, saveGameNote, updatePrototypeField, audioEnabled } = useStore();
  const [selectedPair, setSelectedPair] = useState<[ResourceId | null, ResourceId | null]>([null, null]);
  const [discoveredResourceIds, setDiscoveredResourceIds] = useState<ResourceId[]>(startingResources);
  const [discoveredRecipeIds, setDiscoveredRecipeIds] = useState<string[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [tutorialStage, setTutorialStage] = useState<TutorialStage>(1);
  const [activeView, setActiveView] = useState<ActiveView>('discover');
  const [builtModules, setBuiltModules] = useState<string[]>([]);
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [ending, setEnding] = useState<EndingKind | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [discovery, setDiscovery] = useState<Recipe | null>(null);
  const [failedCraftCount, setFailedCraftCount] = useState(0);
  const [feedback, setFeedback] = useState('Start with Paper + Pencils. This creates a Materials Kit.');

  const discoveredSet = useMemo(() => new Set(discoveredResourceIds), [discoveredResourceIds]);
  const unlockedViews = useMemo(() => getUnlockedViews(tutorialStage), [tutorialStage]);
  const currentObjective = getStageObjective(tutorialStage);
  const nextRecipe = getStageRecipe(tutorialStage);
  const selectedRecipe = selectedPair[0] && selectedPair[1] ? findRecipe(selectedPair[0], selectedPair[1]) : null;
  const singleSelected = selectedPair[0] && !selectedPair[1] ? selectedPair[0] : selectedPair[1] && !selectedPair[0] ? selectedPair[1] : null;
  const possiblePartners = useMemo(() => singleSelected ? getPossiblePartners(singleSelected, discoveredResourceIds) : [], [singleSelected, discoveredResourceIds]);
  const triedPairs = useMemo(() => new Set(theories.map((theory) => theory.id)), [theories]);
  const suggestions = useMemo(
    () => getSuggestedExperiments(discoveredResourceIds, discoveredRecipeIds, selectedPair, builtModules),
    [discoveredResourceIds, discoveredRecipeIds, selectedPair, builtModules],
  );
  const selectResource = (id: ResourceId) => {
    if (!discoveredSet.has(id) || ending) return;
    setSelectedPair(([left, right]) => {
      if (left === id) return [null, right];
      if (right === id) return [left, null];
      if (!left) return [id, right];
      if (!right) return [left, id];
      return [id, null];
    });
    playSound('select', audioEnabled);
  };

  const combine = () => {
    const [left, right] = selectedPair;
    if (!left || !right || ending) return;
    const recipe = findRecipe(left, right);
    if (!recipe) {
      const nextFailed = failedCraftCount + 1;
      const theory = makeTheory(left, right);
      setTheories((current) => current.some((item) => item.id === theory.id) ? current : [theory, ...current].slice(0, 6));
      setFailedCraftCount(nextFailed);
      const penalty = tutorialStage >= 5 && nextFailed > 3;
      if (penalty) setMeters((current) => clampMeters(current, { energy: -1 }));
      setFeedback(tutorialStage <= 2 ? 'No connection yet. For now, follow the visible recipe hint.' : `${theory.text}${penalty ? ' This cost 1 Energy.' : ' No penalty.'}`);
      playSound('warning', audioEnabled);
      return;
    }

    const alreadyKnown = discoveredSet.has(recipe.output);
    setDiscoveredRecipeIds((current) => current.includes(recipe.id) ? current : [...current, recipe.id]);
    setDiscoveredResourceIds((current) => alreadyKnown ? current : [...current, recipe.output]);
    setSelectedPair([null, null]);
    setDiscovery(recipe);
    setFailedCraftCount(0);
    setFeedback(alreadyKnown ? `${label(recipe.output)} is already discovered.` : recipe.learning);
    playSound(alreadyKnown ? 'success' : 'craft', audioEnabled);

    if (tutorialStage === 1 && recipe.id === 'materials-kit') setTutorialStage(2);
    if (tutorialStage === 2 && recipe.id === 'activity-cards') setTutorialStage(3);
    if (tutorialStage === 4 && recipe.id === 'rules') setTutorialStage(5);
  };

  const installModule = (module: Module) => {
    if (ending || builtModules.includes(module.id)) return;
    if (!isModuleReady(module, discoveredSet)) {
      setFeedback(`Missing for closest path: ${getClosestMissingOption(module, discoveredSet).map(label).join(', ')}.`);
      playSound('warning', audioEnabled);
      return;
    }
    const nextBuilt = [...builtModules, module.id];
    setBuiltModules(nextBuilt);
    setFeedback(module.reflection);
    setMeters((current) => clampMeters(current, { trust: 2, energy: -1 }));
    saveGameNote(game.id, `Future Exchange: ${nextBuilt.length}/7 modules built`);
    playSound('install', audioEnabled);

    if (tutorialStage === 3 && module.id === 'activity-plan') {
      setTutorialStage(4);
      setActiveView('discover');
    }
    if (nextBuilt.length === modules.length) finishGame(nextBuilt);
  };

  const collect = (spot: CollectSpot) => {
    if (tutorialStage < spot.unlockStage || ending) return;
    setDiscoveredResourceIds((current) => unique([...current, ...spot.gives]));
    setMeters((current) => clampMeters(current, { energy: -1, ...spot.cost }));
    setFeedback(`${spot.name} added ${spot.gives.map(label).join(', ')}.`);
    playSound('success', audioEnabled);
    if (tutorialStage === 5) setTutorialStage(6);
  };

  const trade = (trader: Trader) => {
    if (tutorialStage < trader.unlockStage || ending) return;
    if (!discoveredSet.has(trader.give)) {
      setFeedback(`${trader.name} needs ${label(trader.give)} first.`);
      playSound('warning', audioEnabled);
      return;
    }
    setDiscoveredResourceIds((current) => unique([...current, ...trader.receive]));
    setMeters((current) => clampMeters(current, { trust: 3, energy: -1 }));
    setFeedback(`${trader.name} traded ${trader.receive.map(label).join(' + ')} for ${label(trader.give)}.`);
    playSound('trade', audioEnabled);
    if (tutorialStage === 6) {
      setTutorialStage(7);
      setActiveView('board');
    }
  };

  const finishGame = (finalBuilt = builtModules) => {
    const lowMeter = (Object.keys(meters) as MeterKey[]).some((key) => meters[key] < 28);
    const result: EndingKind = finalBuilt.length === modules.length && !lowMeter ? 'ready' : finalBuilt.length >= 5 ? 'care' : 'redesign';
    setEnding(result);
    completeGame(game.id, result === 'ready' ? 950 : result === 'care' ? 650 : 300, game.takeaway, `Future Exchange completed: ${endingContent[result].title}`);
    playSound(result === 'ready' ? 'win' : result === 'redesign' ? 'lose' : 'success', audioEnabled);
  };

  const restart = () => {
    setSelectedPair([null, null]);
    setDiscoveredResourceIds(startingResources);
    setDiscoveredRecipeIds([]);
    setTheories([]);
    setTutorialStage(1);
    setActiveView('discover');
    setBuiltModules([]);
    setMeters(initialMeters);
    setEnding(null);
    setDiscovery(null);
    setFailedCraftCount(0);
    setFeedback('Start with Paper + Pencils. This creates a Materials Kit.');
    saveGameNote(game.id, 'Future Exchange restarted');
  };

  const sendTakeaway = () => {
    updatePrototypeField('gameplayMechanics', 'Players combine two project elements to discover new resources, then use discoveries to build a KA152 Youth Exchange board.');
    updatePrototypeField('debriefQuestion', 'Which project element created the biggest change: materials, people, learning, logistics, or impact?');
    updatePrototypeField('platforms', 'Element cards, group boards, recipe book, KA152 module board, and resource icons.');
    setFeedback('Future Exchange idea sent to Prototype Lab.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="theme-game-screen future-exchange-screen mx-auto w-full max-w-full min-w-0 overflow-hidden pb-10">
      <section className="glass-panel mb-4 rounded-xl border border-cyan-300/25 p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">{game.subtitle}</p>
            <h1 className="mobile-readable-arcade mt-3 text-2xl text-white md:text-3xl">{game.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
              Combine two elements. Discover new project resources. Build a KA152 Youth Exchange board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ManualButton onClick={() => setManualOpen(true)} />
            <button onClick={restart} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-yellow-300">
              <RotateCcw className="mr-2 inline h-4 w-4" /> Restart
            </button>
          </div>
        </div>
      </section>

      {ending ? (
        <EndingPanel ending={ending} meters={meters} builtCount={builtModules.length} discoveredCount={discoveredResourceIds.length} onRestart={restart} onSendTakeaway={sendTakeaway} />
      ) : (
        <section className="space-y-4">
          <CompactHud meters={meters} stage={tutorialStage} builtCount={builtModules.length} discoveredCount={discoveredResourceIds.length} />
          <StageObjective objective={currentObjective} recipe={nextRecipe} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="min-w-0 space-y-4">
              <CombinationWorkbench
                selectedPair={selectedPair}
                selectedRecipe={selectedRecipe}
                possiblePartners={possiblePartners}
                suggestions={suggestions}
                feedback={feedback}
                onClear={(side) => setSelectedPair((current) => side === 'left' ? [null, current[1]] : [current[0], null])}
                onCombine={combine}
                onTryExperiment={(recipe) => setSelectedPair(recipe.inputs)}
              />
              <ElementGroupPanel discoveredResourceIds={discoveredResourceIds} selectedPair={selectedPair} possiblePartners={possiblePartners} triedPairs={triedPairs} onSelect={selectResource} compact={tutorialStage < 4} />
              <BottomActionBar activeView={activeView} unlockedViews={unlockedViews} onChangeView={setActiveView} onHelp={() => setManualOpen(true)} />
            </main>

            {tutorialStage >= 3 && (
              <aside className="min-w-0 space-y-4">
                {activeView === 'board' && <BoardProgressStrip modules={modules} discoveredSet={discoveredSet} builtModules={builtModules} onInstall={installModule} />}
                {activeView === 'book' && <DiscoveryBook discoveredRecipeIds={discoveredRecipeIds} theories={theories} />}
                {activeView === 'collect' && <CollectPanel spots={collectSpots.filter((spot) => tutorialStage >= spot.unlockStage)} onCollect={collect} />}
                {activeView === 'trade' && <TradePanel traders={traders.filter((trader) => tutorialStage >= trader.unlockStage)} discoveredSet={discoveredSet} onTrade={trade} />}
                {activeView === 'groups' && <ElementGroupPanel discoveredResourceIds={discoveredResourceIds} selectedPair={selectedPair} possiblePartners={possiblePartners} triedPairs={triedPairs} onSelect={selectResource} />}
                {activeView === 'discover' && <BoardProgressStrip modules={modules.slice(0, tutorialStage < 7 ? 1 : modules.length)} discoveredSet={discoveredSet} builtModules={builtModules} onInstall={installModule} />}
              </aside>
            )}
          </div>
        </section>
      )}

      <DiscoveryCard recipe={discovery} onClose={() => setDiscovery(null)} />
      <GameManualPanel open={manualOpen} title={game.title} sections={manualSections} onClose={() => setManualOpen(false)} />
    </motion.div>
  );
}

function CompactHud({ meters, stage, builtCount, discoveredCount }: { meters: Meters; stage: TutorialStage; builtCount: number; discoveredCount: number }) {
  return (
    <div className="future-panel grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/70 p-2 md:grid-cols-6">
      <HudChip label="Stage" value={`${stage}/7`} tone="text-yellow-200" />
      <HudChip label="Discovered" value={discoveredCount} tone="text-cyan-200" />
      <HudChip label="Modules" value={`${builtCount}/7`} tone="text-green-200" />
      <HudChip label="Energy" value={meters.energy} tone="text-yellow-200" />
      <HudChip label="Trust" value={meters.trust} tone="text-pink-200" />
      <HudChip label="Budget" value={meters.budget} tone="text-green-200" />
    </div>
  );
}

function HudChip({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="future-card rounded-lg border border-white/10 bg-white/[.04] p-2 text-center">
      <p className={`text-sm font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-[8px] font-bold uppercase text-gray-500">{label}</p>
    </div>
  );
}

function StageObjective({ objective, recipe }: { objective: string; recipe: Recipe | null }) {
  return (
    <div className="future-panel rounded-xl border border-yellow-300/35 bg-yellow-300/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Current goal</p>
      <h2 className="mt-1 text-xl font-black text-white">{objective}</h2>
      {recipe && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MiniResource id={recipe.inputs[0]} />
          <span className="text-yellow-100">+</span>
          <MiniResource id={recipe.inputs[1]} />
          <span className="text-yellow-100">{'->'}</span>
          <MiniResource id={recipe.output} />
        </div>
      )}
    </div>
  );
}

function CombinationWorkbench({
  selectedPair,
  selectedRecipe,
  possiblePartners,
  suggestions,
  feedback,
  onClear,
  onCombine,
  onTryExperiment,
}: {
  selectedPair: [ResourceId | null, ResourceId | null];
  selectedRecipe: Recipe | null;
  possiblePartners: ResourceId[];
  suggestions: Recipe[];
  feedback: string;
  onClear: (side: 'left' | 'right') => void;
  onCombine: () => void;
  onTryExperiment: (recipe: Recipe) => void;
}) {
  const selectedSingle = selectedPair[0] && !selectedPair[1] ? selectedPair[0] : selectedPair[1] && !selectedPair[0] ? selectedPair[1] : null;
  return (
    <div className="future-panel rounded-2xl border border-pink-300/30 bg-black/60 p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <SelectedSlot id={selectedPair[0]} label="First element" onClear={() => onClear('left')} />
        <button onClick={onCombine} disabled={!selectedPair[0] || !selectedPair[1]} className="rounded-xl border border-pink-300 bg-pink-300/20 px-4 py-4 text-xs font-black uppercase tracking-widest text-pink-50 hover:bg-pink-300 hover:text-black disabled:border-white/10 disabled:bg-white/[.04] disabled:text-gray-500">
          Combine
        </button>
        <SelectedSlot id={selectedPair[1]} label="Second element" onClear={() => onClear('right')} />
      </div>
      <div className="future-card mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">{selectedRecipe ? `Ready: ${label(selectedRecipe.output)}` : 'Feedback'}</p>
        <p className="mt-1 text-sm font-bold leading-relaxed text-cyan-50">{selectedRecipe ? selectedRecipe.learning : feedback}</p>
      </div>
      {selectedSingle && (
        <div className="future-card mt-3 rounded-xl border border-green-300/20 bg-green-300/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-200">Possible connections</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-green-50">
            {possiblePartners.length
              ? `${label(selectedSingle)} connects with ${possiblePartners.slice(0, 4).map(label).join(', ')}${possiblePartners.length > 4 ? ', and more' : ''}.`
              : `${label(selectedSingle)} has no known visible partner yet. Collect or discover more elements.`}
          </p>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="future-card mt-3 rounded-xl border border-yellow-300/20 bg-yellow-300/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Next experiments</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {suggestions.map((recipe) => (
              <button key={recipe.id} onClick={() => onTryExperiment(recipe)} className="future-card rounded-lg border border-yellow-300/20 bg-black/35 p-2 text-left hover:border-yellow-300">
                <p className="text-[9px] font-black uppercase text-yellow-100">{recipe.category}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <MiniResource id={recipe.inputs[0]} />
                  <span className="text-yellow-100">+</span>
                  <MiniResource id={recipe.inputs[1]} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedSlot({ id, label: slotLabel, onClear }: { id: ResourceId | null; label: string; onClear: () => void }) {
  return (
    <button onClick={id ? onClear : undefined} className={`future-card min-h-32 rounded-xl border p-3 text-center ${id ? resources[id].color : 'border-white/10 bg-white/[.03] text-gray-500'}`}>
      {id ? <ResourceFace id={id} large /> : <span className="text-xs font-black uppercase">{slotLabel}<br />Tap a card below</span>}
    </button>
  );
}

function ElementGroupPanel({
  discoveredResourceIds,
  selectedPair,
  possiblePartners,
  triedPairs,
  onSelect,
  compact = false,
}: {
  discoveredResourceIds: ResourceId[];
  selectedPair: [ResourceId | null, ResourceId | null];
  possiblePartners: ResourceId[];
  triedPairs: Set<string>;
  onSelect: (id: ResourceId) => void;
  compact?: boolean;
}) {
  const discovered = new Set(discoveredResourceIds);
  const visibleGroups = compact ? ['materials', 'people'] as GroupId[] : groupOrder;
  const selectedSingle = selectedPair[0] && !selectedPair[1] ? selectedPair[0] : selectedPair[1] && !selectedPair[0] ? selectedPair[1] : null;
  return (
    <div className="future-panel rounded-xl border border-white/10 bg-black/55 p-3">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-300">Elements</p>
      <div className="space-y-3">
        {visibleGroups.map((group) => {
          const ids = discoveredResourceIds.filter((id) => resources[id].group === group);
          if (!ids.length) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{groupLabels[group]}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {ids.map((id) => (
                  <ResourceCard
                    key={id}
                    id={id}
                    selected={selectedPair.includes(id)}
                    possiblePartner={possiblePartners.includes(id)}
                    tried={Boolean(selectedSingle && triedPairs.has(pairKey(selectedSingle, id)))}
                    muted={Boolean(selectedSingle && !selectedPair.includes(id) && !possiblePartners.includes(id) && !triedPairs.has(pairKey(selectedSingle, id)))}
                    disabled={!discovered.has(id)}
                    onClick={() => onSelect(id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResourceCard({
  id,
  selected,
  possiblePartner,
  tried,
  muted,
  disabled,
  onClick,
}: {
  key?: ResourceId;
  id: ResourceId;
  selected: boolean;
  possiblePartner: boolean;
  tried: boolean;
  muted: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`future-resource-card relative min-h-28 rounded-xl border p-3 transition ${resources[id].color} ${selected ? 'ring-2 ring-white' : ''} ${possiblePartner ? 'shadow-[0_0_18px_rgba(34,197,94,.45)] ring-2 ring-green-300' : ''} ${tried ? 'opacity-70 grayscale-[.35]' : ''} ${muted ? 'opacity-45' : ''} disabled:opacity-35`}
    >
      {possiblePartner && <span className="absolute right-1 top-1 rounded bg-green-300 px-1.5 py-0.5 text-[7px] font-black uppercase text-black">links</span>}
      {tried && !possiblePartner && <span className="absolute right-1 top-1 rounded bg-yellow-300 px-1.5 py-0.5 text-[7px] font-black uppercase text-black">tried</span>}
      <ResourceFace id={id} />
      <p className="mt-2 text-[9px] font-bold uppercase opacity-80">{groupLabels[resources[id].group]}</p>
    </button>
  );
}

function BottomActionBar({ activeView, unlockedViews, onChangeView, onHelp }: { activeView: ActiveView; unlockedViews: ActiveView[]; onChangeView: (view: ActiveView) => void; onHelp: () => void }) {
  const items: Array<{ id: ActiveView; label: string }> = [
    { id: 'discover', label: 'Discover' },
    { id: 'groups', label: 'Groups' },
    { id: 'book', label: 'Book' },
    { id: 'collect', label: 'Collect' },
    { id: 'trade', label: 'Trade' },
    { id: 'board', label: 'Board' },
  ];
  return (
    <div className="future-panel sticky bottom-2 z-20 grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur sm:grid-cols-7">
      {items.map((item) => (
        <button key={item.id} onClick={() => onChangeView(item.id)} disabled={!unlockedViews.includes(item.id)} className={`rounded-lg border px-2 py-3 text-[9px] font-black uppercase ${activeView === item.id ? 'border-yellow-300 bg-yellow-300/20 text-yellow-50' : 'border-white/10 bg-white/[.03] text-gray-300'} disabled:opacity-30`}>
          {item.label}
        </button>
      ))}
      <button onClick={onHelp} className="rounded-lg border border-green-300/30 bg-green-300/10 px-2 py-3 text-[9px] font-black uppercase text-green-100">
        Help
      </button>
    </div>
  );
}

function DiscoveryBook({ discoveredRecipeIds, theories }: { discoveredRecipeIds: string[]; theories: Theory[] }) {
  const discovered = recipes.filter((recipe) => discoveredRecipeIds.includes(recipe.id));
  return (
    <div className="future-panel rounded-xl border border-pink-300/25 bg-pink-300/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-pink-200">Discovery Book</p>
      <div className="mt-3 space-y-3">
        {discovered.map((recipe) => (
          <div key={recipe.id} className="future-card rounded-lg border border-white/10 bg-black/35 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <MiniResource id={recipe.inputs[0]} />
              <span className="text-pink-100">+</span>
              <MiniResource id={recipe.inputs[1]} />
              <span className="text-pink-100">{'->'}</span>
              <MiniResource id={recipe.output} />
            </div>
            <p className="mt-2 text-xs font-bold text-gray-300">{recipe.learning}</p>
          </div>
        ))}
        {theories.map((theory) => (
          <p key={theory.id} className="rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3 text-xs font-bold text-yellow-50">{theory.text}</p>
        ))}
      </div>
    </div>
  );
}

function BoardProgressStrip({ modules, discoveredSet, builtModules, onInstall }: { modules: Module[]; discoveredSet: Set<ResourceId>; builtModules: string[]; onInstall: (module: Module) => void }) {
  return (
    <div className="future-panel rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">KA152 Board</p>
      <div className="mt-3 space-y-2">
        {modules.map((module) => {
          const ready = isModuleReady(module, discoveredSet);
          const built = builtModules.includes(module.id);
          return (
            <button key={module.id} onClick={() => onInstall(module)} disabled={built} className={`future-card w-full rounded-lg border p-3 text-left ${built ? 'border-green-300 bg-green-300/15' : ready ? 'border-cyan-300 bg-cyan-300/15' : 'border-white/10 bg-black/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-white">{module.name}</p>
                {built && <CheckCircle2 className="h-5 w-5 text-green-300" />}
              </div>
              <div className="mt-2 space-y-1.5">
                {module.options.map((option, index) => (
                  <div key={`${module.id}-${index}`} className="flex flex-wrap items-center gap-1.5">
                    {index > 0 && <span className="rounded bg-white/10 px-1.5 py-1 text-[8px] font-black uppercase text-gray-400">or</span>}
                    {option.map((id) => <NeedChip key={id} id={id} ok={discoveredSet.has(id)} />)}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] font-black uppercase text-gray-500">{built ? 'Installed' : ready ? 'Tap to install' : 'Discover missing elements'}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollectPanel({ spots, onCollect }: { spots: CollectSpot[]; onCollect: (spot: CollectSpot) => void }) {
  return (
    <div className="future-panel rounded-xl border border-yellow-300/25 bg-yellow-300/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-yellow-200">Collect Elements</p>
      <div className="mt-3 space-y-2">
        {spots.map((spot) => (
          <button key={spot.id} onClick={() => onCollect(spot)} className="future-card w-full rounded-lg border border-white/10 bg-black/45 p-3 text-left hover:border-yellow-300">
            <p className="text-sm font-black text-white">{spot.name}</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">{costLabel(spot.cost)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{spot.gives.map((id) => <MiniResource key={id} id={id} />)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TradePanel({ traders, discoveredSet, onTrade }: { traders: Trader[]; discoveredSet: Set<ResourceId>; onTrade: (trader: Trader) => void }) {
  return (
    <div className="future-panel rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Participant Trades</p>
      <div className="mt-3 space-y-2">
        {traders.map((trader) => (
          <button key={trader.id} onClick={() => onTrade(trader)} disabled={!discoveredSet.has(trader.give)} className="future-card w-full rounded-lg border border-white/10 bg-black/45 p-3 text-left hover:border-cyan-300 disabled:opacity-40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{trader.name}</p>
                <p className="text-[10px] font-bold uppercase text-gray-500">{trader.role}</p>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <MiniResource id={trader.give} />
              <span className="text-cyan-100">{'->'}</span>
              {trader.receive.map((id) => <MiniResource key={id} id={id} />)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DiscoveryCard({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  if (!recipe) return null;
  const output = resources[recipe.output];
  const Icon = output.Icon;
  return (
    <div className="future-discovery-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="future-discovery-panel w-full max-w-sm rounded-2xl border border-pink-300 bg-slate-950 p-5 text-center shadow-[0_0_40px_rgba(255,0,200,.25)]">
        <p className="text-xs font-black uppercase tracking-widest text-pink-200">New Discovery</p>
        <div className={`future-discovery-resource mx-auto mt-4 flex h-28 w-28 flex-col items-center justify-center rounded-2xl border ${output.color}`}>
          <Icon className="h-10 w-10" />
          <p className="mt-2 text-sm font-black">{output.short}</p>
        </div>
        <h3 className="mt-4 text-xl font-black text-white">{output.name}</h3>
        <p className="mt-2 text-sm font-bold leading-relaxed text-gray-300">{output.meaning}</p>
        <p className="future-discovery-lesson mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs font-bold leading-relaxed text-cyan-50">{recipe.learning}</p>
        <button onClick={onClose} className="future-discovery-button mt-5 rounded-lg border border-pink-300 bg-pink-300/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-pink-50 hover:bg-pink-300 hover:text-black">
          Continue
        </button>
      </motion.div>
    </div>
  );
}

function EndingPanel({ ending, meters, builtCount, discoveredCount, onRestart, onSendTakeaway }: { ending: EndingKind; meters: Meters; builtCount: number; discoveredCount: number; onRestart: () => void; onSendTakeaway: () => void }) {
  return (
    <section className="rounded-xl border border-green-300/25 bg-green-300/10 p-5">
      <Sparkles className="h-10 w-10 text-yellow-300" />
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-300">Final Outcome</p>
      <h2 className="mobile-readable-arcade mt-3 text-2xl text-white">{endingContent[ending].title}</h2>
      <p className="readable-copy mt-4 text-sm leading-relaxed text-gray-100">{endingContent[ending].text}</p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <OutcomeCard title="Modules" text={`${builtCount}/7 installed`} />
        <OutcomeCard title="Elements" text={`${discoveredCount} discovered`} />
        <OutcomeCard title="Trust" text={`${meters.trust}/100`} />
        <OutcomeCard title="Energy" text={`${meters.energy}/100`} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={onSendTakeaway} className="arcade-border-green inline-flex items-center justify-center gap-2 bg-green-900/40 px-5 py-3 text-xs font-bold uppercase tracking-widest text-green-100 hover:bg-green-300 hover:text-black">
          <ClipboardList className="h-4 w-4" /> Send to Prototype Lab
        </button>
        <button onClick={onRestart} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-200 hover:border-yellow-300">
          <RotateCcw className="h-4 w-4" /> Replay
        </button>
      </div>
    </section>
  );
}

function ResourceFace({ id, large = false }: { id: ResourceId; large?: boolean }) {
  const resource = resources[id];
  const Icon = resource.Icon;
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Icon className={large ? 'h-9 w-9' : 'h-6 w-6'} />
      <p className={`${large ? 'mt-2 text-sm' : 'mt-1 text-xs'} break-words font-black leading-tight`}>{resource.short}</p>
    </div>
  );
}

function MiniResource({ id }: { key?: ResourceId; id: ResourceId }) {
  const resource = resources[id];
  const Icon = resource.Icon;
  return (
    <span title={resource.name} className={`future-mini-resource inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-black uppercase ${resource.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {resource.short}
    </span>
  );
}

function NeedChip({ id, ok }: { key?: ResourceId; id: ResourceId; ok: boolean }) {
  return (
    <span className={`future-mini-resource rounded border px-2 py-1 text-[9px] font-black uppercase ${ok ? 'border-green-300 bg-green-300/15 text-green-100' : 'border-red-300/30 bg-red-300/10 text-red-100'}`}>
      {resources[id].short}
    </span>
  );
}

function OutcomeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="future-card rounded-lg border border-white/10 bg-black/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <p className="mt-2 text-sm font-bold leading-relaxed text-white">{text}</p>
    </div>
  );
}

const endingContent: Record<EndingKind, { title: string; text: string }> = {
  ready: {
    title: 'KA152 Board Game Ready',
    text: 'You built the exchange as a living system. Materials, people, learning, logistics, and impact all connect.',
  },
  care: {
    title: 'Exchange Works, But Needs Care',
    text: 'The project can happen, but one system is fragile. This is a strong debrief moment.',
  },
  redesign: {
    title: 'Redesign Needed',
    text: 'The project system is not stable yet. Redesign the missing elements before launch.',
  },
};

function findRecipe(left: ResourceId, right: ResourceId) {
  const key = pairKey(left, right);
  return recipes.find((recipe) => pairKey(recipe.inputs[0], recipe.inputs[1]) === key) ?? null;
}

function getPossiblePartners(id: ResourceId, discoveredResourceIds: ResourceId[]) {
  const discovered = new Set(discoveredResourceIds);
  return unique(
    recipes
      .filter((recipe) => recipe.inputs.includes(id))
      .map((recipe) => recipe.inputs[0] === id ? recipe.inputs[1] : recipe.inputs[0])
      .filter((partner) => discovered.has(partner)),
  );
}

function getSuggestedExperiments(
  discoveredResourceIds: ResourceId[],
  discoveredRecipeIds: string[],
  selectedPair: [ResourceId | null, ResourceId | null],
  builtModules: string[],
) {
  const discovered = new Set(discoveredResourceIds);
  const selected = selectedPair.find(Boolean);
  const readyUndiscovered = recipes.filter((recipe) => (
    !discoveredRecipeIds.includes(recipe.id)
    && recipe.inputs.every((id) => discovered.has(id))
  ));
  const missingModuleOutputs = modules
    .filter((module) => !builtModules.includes(module.id))
    .flatMap((module) => module.options.flat())
    .filter((id) => !discovered.has(id));

  return [...readyUndiscovered]
    .sort((a, b) => {
      const selectedScoreA = selected && a.inputs.includes(selected) ? -4 : 0;
      const selectedScoreB = selected && b.inputs.includes(selected) ? -4 : 0;
      const moduleScoreA = missingModuleOutputs.includes(a.output) ? -2 : 0;
      const moduleScoreB = missingModuleOutputs.includes(b.output) ? -2 : 0;
      return (selectedScoreA + moduleScoreA) - (selectedScoreB + moduleScoreB);
    })
    .slice(0, 3);
}

function pairKey(left: ResourceId, right: ResourceId) {
  return [left, right].sort().join('|');
}

function makeTheory(left: ResourceId, right: ResourceId): Theory {
  const closeRecipe = getNearMissRecipe(left, right);
  const groups = [resources[left].group, resources[right].group];
  const id = pairKey(left, right);
  if (closeRecipe) return { id, text: closeRecipe.clue };
  if (left === right) return { id, text: 'Try two different elements. Discovery usually starts with tension between two ideas.' };
  if (groups.includes('materials') && groups.includes('people')) {
    return { id, text: 'This is close: project tools often need a human resource plus a clearer purpose.' };
  }
  if (groups.includes('learning')) {
    return { id, text: 'This feels like learning. Try Reflection, Youth Voice, Cards, or a clear Goal.' };
  }
  if (groups.includes('logistics')) {
    return { id, text: 'This feels like logistics. Try another practical resource, like tickets, keys, budget, or tools.' };
  }
  return { id, text: 'No connection yet. Try a different pair from two different groups.' };
}

function getNearMissRecipe(left: ResourceId, right: ResourceId) {
  const selected = new Set([left, right]);
  return recipes.find((recipe) => (
    recipe.inputs.some((id) => selected.has(id))
    && recipe.inputs.some((id) => !selected.has(id))
    && (resources[recipe.inputs[0]].group === resources[left].group || resources[recipe.inputs[1]].group === resources[right].group)
  )) ?? null;
}

function isModuleReady(module: Module, discoveredSet: Set<ResourceId>) {
  return module.options.some((option) => option.every((id) => discoveredSet.has(id)));
}

function getClosestMissingOption(module: Module, discoveredSet: Set<ResourceId>) {
  return [...module.options]
    .sort((a, b) => a.filter((id) => !discoveredSet.has(id)).length - b.filter((id) => !discoveredSet.has(id)).length)[0]
    .filter((id) => !discoveredSet.has(id));
}

function getUnlockedViews(stage: TutorialStage): ActiveView[] {
  if (stage <= 2) return ['discover', 'help'];
  if (stage === 3) return ['discover', 'board', 'help'];
  if (stage === 4) return ['discover', 'groups', 'book', 'board', 'help'];
  if (stage === 5) return ['discover', 'groups', 'book', 'collect', 'board', 'help'];
  if (stage === 6) return ['discover', 'groups', 'book', 'collect', 'trade', 'board', 'help'];
  return ['discover', 'groups', 'book', 'collect', 'trade', 'board', 'help'];
}

function getStageObjective(stage: TutorialStage) {
  if (stage === 1) return 'Discover Materials Kit';
  if (stage === 2) return 'Discover Activity Cards';
  if (stage === 3) return 'Install Activity Plan';
  if (stage === 4) return 'Discover Rules';
  if (stage === 5) return 'Collect people and logistics elements';
  if (stage === 6) return 'Try one participant trade';
  return 'Build the full KA152 board';
}

function getStageRecipe(stage: TutorialStage) {
  if (stage === 1) return recipes.find((recipe) => recipe.id === 'materials-kit') ?? null;
  if (stage === 2) return recipes.find((recipe) => recipe.id === 'activity-cards') ?? null;
  if (stage === 4) return recipes.find((recipe) => recipe.id === 'rules') ?? null;
  return null;
}

function clampMeters(current: Meters, effects: Partial<Meters>) {
  return (Object.keys(current) as MeterKey[]).reduce((next, key) => ({
    ...next,
    [key]: Math.max(0, Math.min(100, current[key] + (effects[key] ?? 0))),
  }), {} as Meters);
}

function unique(ids: ResourceId[]) {
  return [...new Set(ids)];
}

function label(id: ResourceId) {
  return resources[id].name;
}

function costLabel(cost: Partial<Meters>) {
  const parts = (Object.entries(cost) as Array<[MeterKey, number]>).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${meterName(key)}`);
  return parts.length ? `Cost: ${parts.join(', ')}` : 'No meter cost';
}

function meterName(key: MeterKey) {
  if (key === 'energy') return 'Energy';
  if (key === 'trust') return 'Trust';
  return 'Budget';
}
