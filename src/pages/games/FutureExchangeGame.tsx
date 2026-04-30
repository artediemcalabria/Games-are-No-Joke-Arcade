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
  Network,
  PackagePlus,
  Pencil,
  Presentation,
  Projector,
  RotateCcw,
  ShieldCheck,
  Smile,
  Sparkles,
  Target,
  Ticket,
  Timer,
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
  | 'paper' | 'pencils' | 'projector' | 'speaker' | 'roomKeys' | 'budgetTokens' | 'travelTickets' | 'food' | 'cards' | 'dice'
  | 'friendship' | 'trust' | 'energy' | 'inclusion' | 'localConnection' | 'youthVoice' | 'reflection' | 'focus' | 'creativity'
  | 'structure' | 'rules' | 'sharedAgreement' | 'welcomeMoment' | 'partnerTeamReady' | 'youthpassCards' | 'communityPresentation' | 'carePackage'
  | 'activityCards' | 'learningGoal' | 'presentationSetup' | 'safeGroupClimate' | 'logisticsReady' | 'communityImpact';
type Inventory = Record<ResourceId, number>;
type MeterKey = 'energy' | 'trust' | 'budget';
type Meters = Record<MeterKey, number>;
type EndingKind = 'ready' | 'care' | 'redesign';
type ActivePanel = 'collect' | 'traders' | 'recipes' | 'log';
type ActiveDrawer = 'board' | 'discovery' | null;
type RecipeCategory = 'Activity Design' | 'Group Climate' | 'Logistics' | 'Learning' | 'Impact';

type Resource = {
  id: ResourceId;
  name: string;
  short: string;
  Icon: LucideIcon;
  type: 'tangible' | 'intangible' | 'crafted';
  color: string;
};
type Recipe = {
  id: string;
  name: string;
  category: RecipeCategory;
  inputs: ResourceId[];
  output: ResourceId;
  clue: string;
  feedback: string;
};
type Module = {
  id: string;
  name: string;
  needs: ResourceId[];
  feedback: string;
};
type CollectSpot = {
  id: string;
  name: string;
  resources: ResourceId[];
  cost: Partial<Meters>;
  maxUses?: number;
  feedback: string;
};
type Trader = {
  id: string;
  name: string;
  role: string;
  offers: ResourceId[];
  needs: ResourceId[];
  trustDelta: number;
  feedback: string;
};
type LogEntry = {
  text: string;
  tone: 'good' | 'warn' | 'info';
};
type PartialDiscovery = {
  recipeId: string;
  matched: number;
  clue: string;
};
type DiscoveryRevealState = {
  recipe: Recipe;
  isNew: boolean;
};

const game = gameCatalog.find((item) => item.id === 'future-exchange')!;

const resources: Record<ResourceId, Resource> = {
  paper: { id: 'paper', name: 'Paper', short: 'Paper', Icon: FileText, type: 'tangible', color: 'border-slate-200 bg-slate-200/20 text-slate-100' },
  pencils: { id: 'pencils', name: 'Pencils', short: 'Pencil', Icon: Pencil, type: 'tangible', color: 'border-yellow-200 bg-yellow-200/20 text-yellow-100' },
  projector: { id: 'projector', name: 'Projector', short: 'Projector', Icon: Projector, type: 'tangible', color: 'border-cyan-200 bg-cyan-200/20 text-cyan-100' },
  speaker: { id: 'speaker', name: 'Speaker', short: 'Speaker', Icon: Volume2, type: 'tangible', color: 'border-pink-200 bg-pink-200/20 text-pink-100' },
  roomKeys: { id: 'roomKeys', name: 'Room Keys', short: 'Keys', Icon: KeyRound, type: 'tangible', color: 'border-orange-200 bg-orange-200/20 text-orange-100' },
  budgetTokens: { id: 'budgetTokens', name: 'Budget Tokens', short: 'Budget', Icon: Coins, type: 'tangible', color: 'border-green-200 bg-green-200/20 text-green-100' },
  travelTickets: { id: 'travelTickets', name: 'Travel Tickets', short: 'Tickets', Icon: Ticket, type: 'tangible', color: 'border-blue-200 bg-blue-200/20 text-blue-100' },
  food: { id: 'food', name: 'Food', short: 'Food', Icon: Utensils, type: 'tangible', color: 'border-red-200 bg-red-200/20 text-red-100' },
  cards: { id: 'cards', name: 'Cards', short: 'Cards', Icon: ClipboardList, type: 'tangible', color: 'border-violet-200 bg-violet-200/20 text-violet-100' },
  dice: { id: 'dice', name: 'Dice', short: 'Dice', Icon: Dices, type: 'tangible', color: 'border-white bg-white/15 text-white' },
  friendship: { id: 'friendship', name: 'Friendship', short: 'Friendship', Icon: Heart, type: 'intangible', color: 'border-pink-300 bg-pink-300/20 text-pink-100' },
  trust: { id: 'trust', name: 'Trust', short: 'Trust', Icon: ShieldCheck, type: 'intangible', color: 'border-green-300 bg-green-300/20 text-green-100' },
  energy: { id: 'energy', name: 'Energy', short: 'Energy', Icon: Zap, type: 'intangible', color: 'border-yellow-300 bg-yellow-300/20 text-yellow-100' },
  inclusion: { id: 'inclusion', name: 'Inclusion', short: 'Inclusion', Icon: Users, type: 'intangible', color: 'border-cyan-300 bg-cyan-300/20 text-cyan-100' },
  localConnection: { id: 'localConnection', name: 'Local Connection', short: 'Local Link', Icon: Map, type: 'intangible', color: 'border-lime-300 bg-lime-300/20 text-lime-100' },
  youthVoice: { id: 'youthVoice', name: 'Youth Voice', short: 'Youth Voice', Icon: MessageCircle, type: 'intangible', color: 'border-fuchsia-300 bg-fuchsia-300/20 text-fuchsia-100' },
  reflection: { id: 'reflection', name: 'Reflection', short: 'Reflect', Icon: BookOpen, type: 'intangible', color: 'border-indigo-300 bg-indigo-300/20 text-indigo-100' },
  focus: { id: 'focus', name: 'Focus', short: 'Focus', Icon: Target, type: 'intangible', color: 'border-sky-300 bg-sky-300/20 text-sky-100' },
  creativity: { id: 'creativity', name: 'Creativity', short: 'Creative', Icon: Sparkles, type: 'intangible', color: 'border-amber-300 bg-amber-300/20 text-amber-100' },
  structure: { id: 'structure', name: 'Structure', short: 'Structure', Icon: Network, type: 'crafted', color: 'border-blue-300 bg-blue-300/20 text-blue-100' },
  rules: { id: 'rules', name: 'Rules', short: 'Rules', Icon: ListChecks, type: 'crafted', color: 'border-slate-300 bg-slate-300/20 text-slate-100' },
  sharedAgreement: { id: 'sharedAgreement', name: 'Shared Agreement', short: 'Agreement', Icon: ShieldCheck, type: 'crafted', color: 'border-emerald-300 bg-emerald-300/20 text-emerald-100' },
  welcomeMoment: { id: 'welcomeMoment', name: 'Welcome Moment', short: 'Welcome', Icon: Heart, type: 'crafted', color: 'border-rose-300 bg-rose-300/20 text-rose-100' },
  partnerTeamReady: { id: 'partnerTeamReady', name: 'Partner Team', short: 'Team Ready', Icon: Users, type: 'crafted', color: 'border-teal-300 bg-teal-300/20 text-teal-100' },
  youthpassCards: { id: 'youthpassCards', name: 'YouthPass Cards', short: 'YouthPass', Icon: BookOpen, type: 'crafted', color: 'border-indigo-300 bg-indigo-300/25 text-indigo-100' },
  communityPresentation: { id: 'communityPresentation', name: 'Community Presentation', short: 'Community', Icon: Presentation, type: 'crafted', color: 'border-lime-300 bg-lime-300/25 text-lime-100' },
  carePackage: { id: 'carePackage', name: 'Care Package', short: 'Care Pack', Icon: Utensils, type: 'crafted', color: 'border-red-300 bg-red-300/20 text-red-100' },
  activityCards: { id: 'activityCards', name: 'Activity Cards', short: 'Activities', Icon: ClipboardList, type: 'crafted', color: 'border-yellow-300 bg-yellow-300/25 text-yellow-100' },
  learningGoal: { id: 'learningGoal', name: 'Learning Goal', short: 'Goal', Icon: Goal, type: 'crafted', color: 'border-green-300 bg-green-300/25 text-green-100' },
  presentationSetup: { id: 'presentationSetup', name: 'Presentation Setup', short: 'Setup', Icon: MonitorUp, type: 'crafted', color: 'border-cyan-300 bg-cyan-300/25 text-cyan-100' },
  safeGroupClimate: { id: 'safeGroupClimate', name: 'Safe Group Climate', short: 'Safe Group', Icon: Smile, type: 'crafted', color: 'border-pink-300 bg-pink-300/25 text-pink-100' },
  logisticsReady: { id: 'logisticsReady', name: 'Logistics Ready', short: 'Logistics', Icon: Truck, type: 'crafted', color: 'border-orange-300 bg-orange-300/25 text-orange-100' },
  communityImpact: { id: 'communityImpact', name: 'Community Impact', short: 'Impact', Icon: Presentation, type: 'crafted', color: 'border-lime-300 bg-lime-300/25 text-lime-100' },
};

const allResourceIds = Object.keys(resources) as ResourceId[];

const recipes: Recipe[] = [
  { id: 'activity-cards', name: 'Activity Cards', category: 'Activity Design', inputs: ['paper', 'pencils', 'creativity'], output: 'activityCards', clue: 'Materials become a playable activity when creativity joins them.', feedback: 'New discovery: Activity Cards. The activity plan can grow.' },
  { id: 'rules', name: 'Rules', category: 'Activity Design', inputs: ['cards', 'dice', 'focus'], output: 'rules', clue: 'Game materials need focus before they become testable rules.', feedback: 'New discovery: Rules. The game can now be tested, not only imagined.' },
  { id: 'structure', name: 'Structure', category: 'Activity Design', inputs: ['rules', 'focus', 'paper'], output: 'structure', clue: 'Rules become useful structure when they are written and focused.', feedback: 'New discovery: Structure. The team can organize decisions.' },
  { id: 'learning-goal', name: 'Learning Goal', category: 'Learning', inputs: ['trust', 'youthVoice', 'reflection'], output: 'learningGoal', clue: 'Learning appears when young people are trusted and reflection is present.', feedback: 'New discovery: Learning Goal. The exchange has a reason to exist.' },
  { id: 'youthpass-cards', name: 'YouthPass Cards', category: 'Learning', inputs: ['reflection', 'cards', 'learningGoal'], output: 'youthpassCards', clue: 'Reflection becomes easier when it has cards and a clear learning goal.', feedback: 'New discovery: YouthPass Cards. Reflection becomes playable.' },
  { id: 'safe-climate', name: 'Safe Group Climate', category: 'Group Climate', inputs: ['friendship', 'inclusion', 'energy'], output: 'safeGroupClimate', clue: 'A group feels safer when connection, access, and energy work together.', feedback: 'New discovery: Safe Group Climate. People can participate with less fear.' },
  { id: 'welcome-moment', name: 'Welcome Moment', category: 'Group Climate', inputs: ['food', 'friendship', 'inclusion'], output: 'welcomeMoment', clue: 'A welcome is care, connection, and access at the same time.', feedback: 'New discovery: Welcome Moment. The group has a soft landing.' },
  { id: 'partner-team-ready', name: 'Partner Team', category: 'Group Climate', inputs: ['welcomeMoment', 'trust', 'youthVoice'], output: 'partnerTeamReady', clue: 'A partner team forms when welcome turns into trust and shared voice.', feedback: 'New discovery: Partner Team. The project has shared ownership.' },
  { id: 'shared-agreement', name: 'Shared Agreement', category: 'Group Climate', inputs: ['rules', 'trust', 'youthVoice'], output: 'sharedAgreement', clue: 'Rules become shared only when trust and youth voice shape them.', feedback: 'New discovery: Shared Agreement. The team owns the project together.' },
  { id: 'presentation-setup', name: 'Presentation Setup', category: 'Logistics', inputs: ['projector', 'speaker', 'focus'], output: 'presentationSetup', clue: 'Technology needs focus before it becomes communication.', feedback: 'New discovery: Presentation Setup. The group can share clearly.' },
  { id: 'logistics-ready', name: 'Logistics Ready', category: 'Logistics', inputs: ['budgetTokens', 'travelTickets', 'roomKeys'], output: 'logisticsReady', clue: 'A project needs money, movement, and a place.', feedback: 'New discovery: Logistics Ready. The exchange can exist in the real world.' },
  { id: 'care-package', name: 'Care Package', category: 'Logistics', inputs: ['budgetTokens', 'food', 'inclusion'], output: 'carePackage', clue: 'Budget becomes care when it supports access and basic needs.', feedback: 'New discovery: Care Package. The project has practical support.' },
  { id: 'community-impact', name: 'Community Impact', category: 'Impact', inputs: ['localConnection', 'activityCards', 'youthVoice'], output: 'communityImpact', clue: 'Impact grows when local reality meets youth voice and activity design.', feedback: 'New discovery: Community Impact. The project reaches outside the room.' },
  { id: 'community-presentation', name: 'Community Presentation', category: 'Impact', inputs: ['localConnection', 'projector', 'youthVoice'], output: 'communityPresentation', clue: 'A local link, youth voice, and a projector can open the project to the community.', feedback: 'New discovery: Community Presentation. The group can speak with the local community.' },
];

const modules: Module[] = [
  { id: 'shared-topic', name: 'Shared Topic', needs: ['learningGoal', 'youthVoice'], feedback: 'Shared Topic installed. The exchange starts from young people, not only from a title.' },
  { id: 'partner-team', name: 'Partner Team', needs: ['partnerTeamReady', 'sharedAgreement'], feedback: 'Partner Team installed. Cooperation is now part of the system.' },
  { id: 'activity-plan', name: 'Activity Plan', needs: ['activityCards', 'creativity', 'focus'], feedback: 'Activity Plan installed. The week has playable learning moments.' },
  { id: 'logistics', name: 'Logistics', needs: ['logisticsReady', 'presentationSetup', 'carePackage'], feedback: 'Logistics installed. The project can function in the real world.' },
  { id: 'inclusion-support', name: 'Inclusion Support', needs: ['safeGroupClimate', 'carePackage'], feedback: 'Inclusion Support installed. Access and care are not optional extras.' },
  { id: 'youthpass-reflection', name: 'YouthPass Reflection', needs: ['youthpassCards', 'learningGoal'], feedback: 'YouthPass Reflection installed. Learning can be named and used.' },
  { id: 'follow-up-action', name: 'Follow-Up Action', needs: ['communityImpact', 'communityPresentation'], feedback: 'Follow-Up Action installed. The exchange can continue after the last day.' },
];

const collectSpots: CollectSpot[] = [
  { id: 'supply-table', name: 'Supply Table', resources: ['paper', 'pencils', 'cards', 'dice'], cost: { energy: -3 }, maxUses: 4, feedback: 'You collected table materials for fast prototyping.' },
  { id: 'tech-corner', name: 'Tech Corner', resources: ['projector', 'speaker', 'focus'], cost: { budget: -5, energy: -2 }, maxUses: 3, feedback: 'You collected tech tools. They help only if the message is clear.' },
  { id: 'travel-desk', name: 'Travel Desk', resources: ['travelTickets', 'budgetTokens', 'food'], cost: { budget: -5 }, maxUses: 4, feedback: 'You collected travel and support resources.' },
  { id: 'courtyard', name: 'Courtyard Talk', resources: ['friendship', 'trust', 'energy'], cost: { energy: -2 }, feedback: 'You collected social energy. Relationships are project resources too.' },
  { id: 'local-map', name: 'Filadelfia Map', resources: ['localConnection', 'roomKeys', 'youthVoice'], cost: { energy: -3, trust: 2 }, maxUses: 3, feedback: 'You collected local links and youth voice.' },
  { id: 'reflection-circle', name: 'Reflection Circle', resources: ['reflection', 'inclusion', 'creativity'], cost: { energy: -3 }, feedback: 'You collected reflection and inclusion. The invisible resources matter.' },
];

const traders: Trader[] = [
  { id: 'andrea', name: 'Andrea', role: 'Creative connector', offers: ['creativity', 'friendship'], needs: ['focus', 'structure'], trustDelta: 3, feedback: 'Andrea traded creative energy. The team feels more alive.' },
  { id: 'slave', name: 'Slave', role: 'Rules builder', offers: ['structure', 'rules'], needs: ['trust', 'youthVoice'], trustDelta: 2, feedback: 'Slave traded structure. The system becomes easier to test.' },
  { id: 'ivalina', name: 'Ivalina', role: 'Inclusion keeper', offers: ['inclusion', 'reflection'], needs: ['energy', 'paper'], trustDelta: 4, feedback: 'Ivalina traded care and reflection. The project becomes safer.' },
  { id: 'rocco', name: 'Rocco', role: 'Logistics support', offers: ['roomKeys', 'projector', 'speaker'], needs: ['budgetTokens', 'learningGoal'], trustDelta: 1, feedback: 'Rocco traded logistics. The parallel world still needs keys and cables.' },
];

const initialInventory = createInventory({
  paper: 3,
  pencils: 1,
  cards: 1,
  dice: 1,
  budgetTokens: 2,
  food: 1,
  energy: 1,
  trust: 2,
  creativity: 1,
  focus: 2,
  youthVoice: 1,
});

const initialMeters: Meters = { energy: 84, trust: 66, budget: 78 };
const startingLaunch = 54;
const tutorialSteps = ['Pick 2 or 3 resources.', 'Press Craft.', 'Use discoveries to build the KA152 board.'];
const starterClues = [
  'Paper + Pencils + something creative can become the first activity.',
  'Trust + Youth Voice + Reflection can become the project reason.',
  'Cards + Dice + Focus can become rules.',
];
const manualSections: ManualSection[] = [
  { title: 'Goal', items: ['Build all 7 KA152 modules before Exchange Launch reaches zero.', 'Keep Energy, Trust, and Budget healthy while you build.'] },
  { title: 'Controls', items: ['Tap resources in your inventory to place them on the Crafting Table.', 'Tap a filled slot to remove it.', 'Use Collect and Trade when you need new ingredients.'] },
  { title: 'How to play', items: ['Combine 2 or 3 resources.', 'Correct combinations discover new project resources.', 'Install discoveries into the KA152 Board modules.'] },
  { title: 'How to win', items: ['Complete Shared Topic, Partner Team, Activity Plan, Logistics, Inclusion Support, YouthPass Reflection, and Follow-Up Action.', 'A perfect win needs all modules and healthy project meters.'] },
  { title: 'Design lesson', items: ['A youth exchange is not only paperwork.', 'It is made from materials, trust, care, logistics, learning, and relationships.'] },
  { title: 'Physical board game', items: ['Use tokens for resources.', 'Use cards for discoveries, trades, and modules.', 'Ask: which resource was hardest to create?'] },
];

export default function FutureExchangeGame() {
  const { completeGame, saveGameNote, updatePrototypeField, audioEnabled } = useStore();
  const [inventory, setInventory] = useState<Inventory>(initialInventory);
  const [meters, setMeters] = useState<Meters>(initialMeters);
  const [launch, setLaunch] = useState(startingLaunch);
  const [builtModules, setBuiltModules] = useState<string[]>([]);
  const [selectedCraftResources, setSelectedCraftResources] = useState<ResourceId[]>([]);
  const [discoveredRecipes, setDiscoveredRecipes] = useState<string[]>([]);
  const [partialDiscoveries, setPartialDiscoveries] = useState<Record<string, PartialDiscovery>>({});
  const [failedCraftCount, setFailedCraftCount] = useState(0);
  const [collectedSpotCounts, setCollectedSpotCounts] = useState<Record<string, number>>({});
  const [activePanel, setActivePanel] = useState<ActivePanel>('collect');
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);
  const [selectedTradePayment, setSelectedTradePayment] = useState<Record<string, ResourceId | null>>({});
  const [installedModuleReflections, setInstalledModuleReflections] = useState<string[]>([]);
  const [discoveryReveal, setDiscoveryReveal] = useState<DiscoveryRevealState | null>(null);
  const [ending, setEnding] = useState<EndingKind | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([
    { text: 'Parallel Filadelfia opens. Combine resources to discover what a KA152 exchange needs.', tone: 'info' },
  ]);

  const completedCount = builtModules.length;
  const strongestMeter = useMemo(() => (Object.keys(meters) as MeterKey[]).sort((a, b) => meters[b] - meters[a])[0], [meters]);
  const weakestMeter = useMemo(() => (Object.keys(meters) as MeterKey[]).sort((a, b) => meters[a] - meters[b])[0], [meters]);
  const missingResource = useMemo(() => findMostNeededResource(inventory, builtModules), [inventory, builtModules]);
  const nextMove = useMemo(() => getNextMove(inventory, builtModules, selectedCraftResources, discoveredRecipes, partialDiscoveries), [inventory, builtModules, selectedCraftResources, discoveredRecipes, partialDiscoveries]);
  const latestLog = log[0];

  const addLog = (text: string, tone: LogEntry['tone'] = 'info') => {
    setLog((current) => [{ text, tone }, ...current].slice(0, 12));
  };

  const spendTurn = (cost: Partial<Meters> = {}, finalBuilt = builtModules) => {
    const nextLaunch = launch - 1;
    const nextMeters = clampMeters(meters, { energy: -1, ...cost });
    setLaunch(nextLaunch);
    setMeters(nextMeters);
    if (nextLaunch <= 0 && finalBuilt.length < modules.length && !ending) {
      finishGame(true, finalBuilt, nextMeters);
    }
    return { nextLaunch, nextMeters };
  };

  const toggleCraftResource = (id: ResourceId) => {
    if (ending || inventory[id] <= 0) return;
    if (selectedCraftResources.includes(id)) {
      setSelectedCraftResources((current) => current.filter((item) => item !== id));
      playSound('select', audioEnabled);
      return;
    }
    if (selectedCraftResources.length >= 3) {
      playSound('warning', audioEnabled);
      addLog('The Crafting Table has only 3 slots. Remove one resource first.', 'warn');
      return;
    }
    setSelectedCraftResources((current) => [...current, id]);
    playSound('select', audioEnabled);
  };

  const clearCraftSlot = (id: ResourceId) => {
    setSelectedCraftResources((current) => current.filter((item) => item !== id));
    playSound('select', audioEnabled);
  };

  const collect = (spot: CollectSpot) => {
    if (ending) return;
    const usesLeft = spotUsesLeft(spot, collectedSpotCounts, builtModules.length);
    if (usesLeft <= 0) {
      playSound('warning', audioEnabled);
      addLog(`${spot.name} is empty for now. Install a module to refresh some resources.`, 'warn');
      return;
    }
    setInventory((current) => addResources(current, spot.resources));
    setCollectedSpotCounts((current) => ({ ...current, [spot.id]: (current[spot.id] ?? 0) + 1 }));
    spendTurn(spot.cost);
    playSound('success', audioEnabled);
    addLog(spot.feedback, 'good');
  };

  const craftSelected = () => {
    if (ending || selectedCraftResources.length < 2) return;
    const recipe = findRecipeByInputs(selectedCraftResources);
    if (!recipe) {
      const nextFailedCount = failedCraftCount + 1;
      setFailedCraftCount(nextFailedCount);
      const closeRecipe = findClosestRecipe(selectedCraftResources);
      if (closeRecipe && closeRecipe.matched >= 2) {
        setPartialDiscoveries((current) => ({
          ...current,
          [closeRecipe.recipe.id]: {
            recipeId: closeRecipe.recipe.id,
            matched: closeRecipe.matched,
            clue: closeRecipe.recipe.clue,
          },
        }));
      }
      if (nextFailedCount > 3) {
        spendTurn({ energy: -2 });
      }
      playSound('warning', audioEnabled);
      addLog(failedCraftHint(selectedCraftResources, closeRecipe?.recipe, nextFailedCount), 'warn');
      return;
    }
    if (!hasResources(inventory, recipe.inputs)) {
      playSound('warning', audioEnabled);
      addLog(`You need ${recipe.inputs.map(label).join(', ')} for this discovery.`, 'warn');
      return;
    }

    const isNew = !discoveredRecipes.includes(recipe.id);
    setInventory((current) => addResources(removeResources(current, recipe.inputs), [recipe.output]));
    setDiscoveredRecipes((current) => (current.includes(recipe.id) ? current : [...current, recipe.id]));
    setPartialDiscoveries((current) => {
      const next = { ...current };
      delete next[recipe.id];
      return next;
    });
    setSelectedCraftResources([]);
    setActivePanel('recipes');
    setActiveDrawer('discovery');
    setDiscoveryReveal({ recipe, isNew });
    spendTurn({ energy: -2 });
    playSound('craft', audioEnabled);
    addLog(isNew ? recipe.feedback : `You crafted another ${label(recipe.output)}.`, 'good');
  };

  const trade = (trader: Trader, payment: ResourceId | null) => {
    if (ending) return;
    if (meters.trust < 24 && trader.id !== 'ivalina') {
      playSound('warning', audioEnabled);
      addLog(`${trader.name} needs more team trust before trading. Build care or talk with Ivalina first.`, 'warn');
      return;
    }
    if (!payment || !trader.needs.includes(payment) || inventory[payment] <= 0) {
      playSound('warning', audioEnabled);
      addLog(`Choose what to give ${trader.name}: ${trader.needs.map(label).join(' or ')}.`, 'warn');
      return;
    }
    setInventory((current) => addResources(removeResources(current, [payment]), trader.offers));
    setSelectedTradePayment((current) => ({ ...current, [trader.id]: null }));
    spendTurn({ trust: trader.trustDelta });
    playSound('trade', audioEnabled);
    addLog(`${trader.name} traded ${trader.offers.map(label).join(' + ')} for ${label(payment)}. ${trader.feedback}`, 'good');
  };

  const installModule = (module: Module) => {
    if (ending || builtModules.includes(module.id)) return;
    if (!hasResources(inventory, module.needs)) {
      playSound('warning', audioEnabled);
      addLog(`${module.name} is not ready. Missing: ${missingFor(inventory, module.needs).map(label).join(', ')}.`, 'warn');
      return;
    }
    const nextBuilt = [...builtModules, module.id];
    const reflection = moduleReflection(module.id);
    setBuiltModules(nextBuilt);
    setInstalledModuleReflections((current) => [...current, reflection]);
    setInventory((current) => removeResources(current, module.needs));
    spendTurn({ trust: 2, budget: -1 }, nextBuilt);
    saveGameNote(game.id, `Future Exchange: ${nextBuilt.length}/7 modules built`);
    playSound('install', audioEnabled);
    addLog(`${module.feedback} ${reflection}`, 'good');
    if (nextBuilt.length === modules.length) {
      setTimeout(() => finishGame(false, nextBuilt), 0);
    }
  };

  const finishGame = (timedOut: boolean, finalBuilt = builtModules, finalMeters = meters) => {
    const lowMeter = (Object.keys(finalMeters) as MeterKey[]).some((key) => finalMeters[key] < 28);
    const result: EndingKind = timedOut && finalBuilt.length < 5
      ? 'redesign'
      : finalBuilt.length === modules.length && !lowMeter && finalMeters.energy >= 35 && finalMeters.trust >= 35 && finalMeters.budget >= 25
        ? 'ready'
        : 'care';
    setEnding(result);
    playSound(result === 'redesign' ? 'lose' : result === 'ready' ? 'win' : 'success', audioEnabled);
    const note = result === 'ready'
      ? 'Future Exchange completed: KA152 Board Game Ready'
      : result === 'care'
        ? 'Future Exchange completed: Exchange Works, But Needs Care'
        : 'Future Exchange completed: Redesign Needed';
    completeGame(game.id, result === 'redesign' ? 250 : result === 'care' ? 600 : 950, game.takeaway, note);
  };

  const restart = () => {
    setInventory(initialInventory);
    setMeters(initialMeters);
    setLaunch(startingLaunch);
    setBuiltModules([]);
    setSelectedCraftResources([]);
    setDiscoveredRecipes([]);
    setPartialDiscoveries({});
    setFailedCraftCount(0);
    setCollectedSpotCounts({});
    setActivePanel('collect');
    setActiveDrawer(null);
    setSelectedTradePayment({});
    setInstalledModuleReflections([]);
    setDiscoveryReveal(null);
    setEnding(null);
    setLog([{ text: 'Parallel Filadelfia opens. Combine resources to discover what a KA152 exchange needs.', tone: 'info' }]);
    saveGameNote(game.id, 'Future Exchange restarted');
  };

  const sendTakeaway = (kind: 'mechanic' | 'debrief' | 'materials' | 'resources') => {
    if (kind === 'mechanic') {
      updatePrototypeField('coreMechanic', 'Players combine, discover, trade, and install resources to build a KA152 Youth Exchange.');
    }
    if (kind === 'debrief') {
      updatePrototypeField('debriefQuestion', 'Which resource was hardest to create: material tools, trust, inclusion, or reflection?');
    }
    if (kind === 'materials') {
      updatePrototypeField('materials', 'Resource tokens, recipe cards, KA152 module board, trade cards, action counter, and reflection cards.');
    }
    if (kind === 'resources') {
      updatePrototypeField('rules', 'Players collect material and human resources, combine 2-3 tokens to discover project resources, trade with participants, and install modules before launch.');
    }
    addLog('Prototype Lab updated with a Future Exchange idea.', 'good');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full max-w-full min-w-0 overflow-hidden pb-10">
      <section className="arcade-border glass-panel mb-4 rounded-xl p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">{game.subtitle}</p>
            <h1 className="mobile-readable-arcade mt-3 text-2xl text-white md:text-3xl">{game.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">
              Combine resources like a discovery game. Build a KA152 youth exchange from tools, trust, care, logistics, learning, and shared responsibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ManualButton onClick={() => setManualOpen(true)} />
            <button onClick={() => finishGame(true)} disabled={Boolean(ending)} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-yellow-300 disabled:opacity-40">
              End Run
            </button>
            <button onClick={restart} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold uppercase text-gray-200 hover:border-yellow-300">
              <RotateCcw className="mr-2 inline h-4 w-4" /> Restart
            </button>
          </div>
        </div>
      </section>

      {ending ? (
        <EndingPanel
          ending={ending}
          builtCount={completedCount}
          meters={meters}
          strongestMeter={strongestMeter}
          weakestMeter={weakestMeter}
          missingResource={missingResource}
          discoveredCount={discoveredRecipes.length}
          reflections={installedModuleReflections}
          onRestart={restart}
          onSendTakeaway={sendTakeaway}
        />
      ) : (
        <section className="w-full min-w-0 space-y-4">
          <CompactHud launch={launch} meters={meters} completedCount={completedCount} />
          <LoopStrip />

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
            <main className="min-w-0 space-y-4 overflow-hidden">
              <NextMovePanel text={nextMove} />
              <CraftingTable
                selected={selectedCraftResources}
                latestLog={latestLog}
                discoveredCount={discoveredRecipes.length}
                onCraft={craftSelected}
                onClearSlot={clearCraftSlot}
                onClearAll={() => setSelectedCraftResources([])}
              />
              <ModuleProgressStrip
                builtModules={builtModules}
                inventory={inventory}
                onOpenBoard={() => setActiveDrawer('board')}
              />
              <InventoryDock inventory={inventory} selected={selectedCraftResources} onSelect={toggleCraftResource} />
              <PanelDrawer
                activePanel={activePanel}
                onChangePanel={setActivePanel}
                discoveredRecipes={discoveredRecipes}
                partialDiscoveries={partialDiscoveries}
                log={log}
                traders={traders}
                inventory={inventory}
                meters={meters}
                selectedTradePayment={selectedTradePayment}
                collectedSpotCounts={collectedSpotCounts}
                builtCount={builtModules.length}
                onSelectTradePayment={(traderId, payment) => setSelectedTradePayment((current) => ({ ...current, [traderId]: payment }))}
                onTrade={trade}
                onCollect={collect}
              />
            </main>

            <aside className="min-w-0 space-y-4 overflow-hidden">
              <ProjectBoard builtModules={builtModules} inventory={inventory} onInstall={installModule} />
              <ReflectionPanel reflections={installedModuleReflections} />
            </aside>
          </div>
        </section>
      )}

      <GameManualPanel open={manualOpen} title={game.title} sections={manualSections} onClose={() => setManualOpen(false)} />
      <BoardDrawer
        open={activeDrawer === 'board'}
        builtModules={builtModules}
        inventory={inventory}
        onClose={() => setActiveDrawer(null)}
        onInstall={installModule}
      />
      <DiscoveryReveal open={activeDrawer === 'discovery'} state={discoveryReveal} onClose={() => setActiveDrawer(null)} />
    </motion.div>
  );
}

function CompactHud({ launch, meters, completedCount }: { launch: number; meters: Meters; completedCount: number }) {
  return (
    <div className="sticky top-2 z-20 grid grid-cols-2 gap-2 rounded-xl border border-yellow-300/30 bg-black/85 p-2 shadow-[0_0_18px_rgba(0,0,0,.45)] backdrop-blur md:grid-cols-5">
      <Stat label="Launch" value={launch} tone={launch <= 8 ? 'text-red-300' : 'text-yellow-200'} />
      <Stat label="Modules" value={`${completedCount}/7`} tone="text-green-200" />
      <Stat label="Energy" value={meters.energy} tone="text-cyan-200" />
      <Stat label="Trust" value={meters.trust} tone="text-pink-200" />
      <Stat label="Budget" value={meters.budget} tone="text-green-200" />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.04] p-2 text-center">
      <p className={`text-sm font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-[8px] font-bold uppercase text-gray-500">{label}</p>
    </div>
  );
}

function LoopStrip() {
  const steps = ['Collect', 'Combine', 'Discover', 'Install', 'Reflect'];
  return (
    <div className="grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-black/55 p-2">
      {steps.map((step, index) => (
        <div key={step} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-1 py-2 text-center">
          <p className="text-[8px] font-black uppercase text-cyan-100 sm:text-[10px]">{step}</p>
          {index < steps.length - 1 && <p className="hidden text-[8px] text-cyan-400 sm:block">then</p>}
        </div>
      ))}
    </div>
  );
}

function NextMovePanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Next best move</p>
      <p className="mt-1 text-sm font-bold leading-relaxed text-yellow-50">{text}</p>
    </div>
  );
}

function CraftingTable({
  selected,
  latestLog,
  discoveredCount,
  onCraft,
  onClearSlot,
  onClearAll,
}: {
  selected: ResourceId[];
  latestLog: LogEntry;
  discoveredCount: number;
  onCraft: () => void;
  onClearSlot: (id: ResourceId) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="arcade-border-pink glass-panel-pink min-w-0 overflow-hidden rounded-xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-300">
            <Hammer className="h-4 w-4" /> Crafting Table
          </p>
          <h2 className="mobile-readable-arcade mt-2 text-xl text-white">Combine resources</h2>
        </div>
        <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-xs font-bold uppercase text-yellow-100">
          {discoveredCount}/{recipes.length} discoveries
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((slotIndex) => {
          const id = selected[slotIndex];
          return (
            <button
              key={slotIndex}
              type="button"
              onClick={() => id && onClearSlot(id)}
              className={`min-h-28 rounded-xl border p-3 text-center transition-colors ${id ? `${resources[id].color} ring-2 ring-white/50` : 'border-white/10 bg-black/55 text-gray-500'}`}
            >
              {id ? (
                <ResourceFace id={id} size="large" />
              ) : (
                <div className="flex h-full min-h-20 flex-col items-center justify-center gap-2">
                  <PackagePlus className="h-6 w-6 opacity-50" />
                  <span className="text-[10px] font-black uppercase">Slot {slotIndex + 1}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <DiscoveryToast entry={latestLog} />
        <button onClick={onClearAll} disabled={selected.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/50 px-4 text-xs font-bold uppercase text-gray-200 hover:border-white/30 disabled:opacity-40">
          <X className="h-4 w-4" /> Clear
        </button>
        <button
          onClick={onCraft}
          disabled={selected.length < 2}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-pink-300 bg-pink-300/20 px-5 text-xs font-black uppercase tracking-widest text-pink-50 shadow-[0_0_16px_rgba(255,0,200,.25)] hover:bg-pink-300 hover:text-black disabled:border-white/10 disabled:bg-white/5 disabled:text-gray-500 disabled:shadow-none"
        >
          <Sparkles className="h-4 w-4" /> Craft
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tutorialSteps.map((step, index) => (
          <div key={step} className="rounded-lg border border-white/10 bg-black/35 p-2 text-xs font-bold leading-relaxed text-gray-300">
            <span className="mr-2 text-pink-200">{index + 1}.</span>{step}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscoveryToast({ entry }: { entry: LogEntry }) {
  const tone = entry.tone === 'good'
    ? 'border-green-300/40 bg-green-300/10 text-green-100'
    : entry.tone === 'warn'
      ? 'border-yellow-300/40 bg-yellow-300/10 text-yellow-100'
      : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100';
  return (
    <div className={`min-h-12 rounded-lg border p-3 text-xs font-bold leading-relaxed ${tone}`}>
      {entry.text}
    </div>
  );
}

function InventoryDock({ inventory, selected, onSelect }: { inventory: Inventory; selected: ResourceId[]; onSelect: (id: ResourceId) => void }) {
  const owned = allResourceIds.filter((id) => inventory[id] > 0);
  const materials = owned.filter((id) => resources[id].type === 'tangible');
  const human = owned.filter((id) => resources[id].type === 'intangible');
  const crafted = owned.filter((id) => resources[id].type === 'crafted');
  return (
    <div className="arcade-border-green glass-panel-green min-w-0 overflow-hidden rounded-xl p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-300">
          <Boxes className="h-4 w-4" /> Inventory
        </p>
        <p className="text-xs font-bold text-gray-400">Tap tokens to place them on the table.</p>
      </div>
      <ResourceGroup title="Materials" ids={materials} inventory={inventory} selected={selected} onSelect={onSelect} />
      <ResourceGroup title="Human resources" ids={human} inventory={inventory} selected={selected} onSelect={onSelect} />
      <ResourceGroup title="Crafted project resources" ids={crafted} inventory={inventory} selected={selected} onSelect={onSelect} />
      {owned.length === 0 && <p className="mt-3 text-sm text-gray-400">No resources yet. Collect from the map.</p>}
    </div>
  );
}

function ResourceGroup({ title, ids, inventory, selected, onSelect }: { title: string; ids: ResourceId[]; inventory: Inventory; selected: ResourceId[]; onSelect: (id: ResourceId) => void }) {
  if (!ids.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {ids.map((id) => (
          <ResourceToken
            key={id}
            id={id}
            count={inventory[id]}
            selected={selected.includes(id)}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleProgressStrip({ builtModules, inventory, onOpenBoard }: { builtModules: string[]; inventory: Inventory; onOpenBoard: () => void }) {
  return (
    <div className="rounded-xl border border-cyan-300/20 bg-black/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">KA152 Progress</p>
        <button onClick={onOpenBoard} className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black">
          Open Board
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {modules.map((module) => {
          const built = builtModules.includes(module.id);
          const ready = hasResources(inventory, module.needs);
          return (
            <div key={module.id} className={`rounded-lg border p-2 ${built ? 'border-green-300 bg-green-300/15' : ready ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/[.03]'}`}>
              <p className="text-[9px] font-black leading-tight text-white">{module.name}</p>
              <p className={`mt-1 text-[8px] font-bold uppercase ${built ? 'text-green-200' : ready ? 'text-cyan-200' : 'text-gray-500'}`}>
                {built ? 'Installed' : ready ? 'Ready' : 'Missing'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectBoard({ builtModules, inventory, onInstall }: { builtModules: string[]; inventory: Inventory; onInstall: (module: Module) => void }) {
  return (
    <div className="arcade-border glass-panel min-w-0 overflow-hidden rounded-xl p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">KA152 Board</p>
          <h2 className="mobile-readable-arcade mt-2 text-lg text-white">Install modules</h2>
        </div>
        <p className="text-xs text-gray-400">Tap a module when all needs glow green.</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {modules.map((module) => {
          const built = builtModules.includes(module.id);
          const ready = hasResources(inventory, module.needs);
          return (
            <button
              key={module.id}
              onClick={() => onInstall(module)}
              disabled={built}
              className={`min-h-32 rounded-xl border p-4 text-left transition-colors ${built ? 'border-green-300 bg-green-300/15' : ready ? 'border-cyan-300 bg-cyan-300/10 hover:bg-cyan-300/20' : 'border-white/10 bg-black/50 hover:border-white/30'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-black text-white">{module.name}</p>
                {built ? <CheckCircle2 className="h-5 w-5 text-green-300" /> : <ClipboardList className={`h-5 w-5 ${ready ? 'text-cyan-300' : 'text-gray-500'}`} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {module.needs.map((id) => (
                  <NeedChip key={id} id={id} ok={inventory[id] > 0 || built} />
                ))}
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase text-gray-500">{built ? 'Installed' : ready ? 'Ready to install' : 'Missing resources'}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollectionMap({ collectedSpotCounts, builtCount, onCollect }: { collectedSpotCounts: Record<string, number>; builtCount: number; onCollect: (spot: CollectSpot) => void }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Parallel Filadelfia Map</p>
        <p className="text-xs font-bold text-gray-400">Collecting costs one action.</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {collectSpots.map((spot) => {
          const usesLeft = spotUsesLeft(spot, collectedSpotCounts, builtCount);
          return (
          <button key={spot.id} onClick={() => onCollect(spot)} disabled={usesLeft <= 0} className="rounded-xl border border-white/10 bg-black/50 p-3 text-left transition-colors hover:border-yellow-300 hover:bg-yellow-300/10 disabled:opacity-45">
            <div className="flex items-start gap-3">
              <PackagePlus className="mt-1 h-5 w-5 shrink-0 text-yellow-300" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-white">{spot.name}</p>
                  {spot.maxUses && <span className="rounded bg-yellow-300/15 px-2 py-0.5 text-[8px] font-black uppercase text-yellow-100">{usesLeft} left</span>}
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">{costLabel(spot.cost)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {spot.resources.map((id) => <MiniResource key={id} id={id} />)}
                </div>
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}

function PanelDrawer({
  activePanel,
  onChangePanel,
  discoveredRecipes,
  partialDiscoveries,
  log,
  traders,
  inventory,
  meters,
  selectedTradePayment,
  collectedSpotCounts,
  builtCount,
  onSelectTradePayment,
  onTrade,
  onCollect,
}: {
  activePanel: ActivePanel;
  onChangePanel: (panel: ActivePanel) => void;
  discoveredRecipes: string[];
  partialDiscoveries: Record<string, PartialDiscovery>;
  log: LogEntry[];
  traders: Trader[];
  inventory: Inventory;
  meters: Meters;
  selectedTradePayment: Record<string, ResourceId | null>;
  collectedSpotCounts: Record<string, number>;
  builtCount: number;
  onSelectTradePayment: (traderId: string, payment: ResourceId) => void;
  onTrade: (trader: Trader, payment: ResourceId | null) => void;
  onCollect: (spot: CollectSpot) => void;
}) {
  const panels: Array<{ id: ActivePanel; label: string }> = [
    { id: 'collect', label: 'Collect' },
    { id: 'traders', label: 'Trade' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'log', label: 'Log' },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-black/60 p-3">
      <div className="grid grid-cols-4 gap-2">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => onChangePanel(panel.id)}
            className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-widest ${activePanel === panel.id ? 'border-yellow-300 bg-yellow-300/15 text-yellow-100' : 'border-white/10 bg-white/[.03] text-gray-400'}`}
          >
            {panel.label}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-[430px] overflow-y-auto pr-1">
        {activePanel === 'collect' && <CollectionMap collectedSpotCounts={collectedSpotCounts} builtCount={builtCount} onCollect={onCollect} />}
        {activePanel === 'traders' && (
          <TraderPanel
            traders={traders}
            inventory={inventory}
            meters={meters}
            selectedTradePayment={selectedTradePayment}
            onSelectTradePayment={onSelectTradePayment}
            onTrade={onTrade}
          />
        )}
        {activePanel === 'recipes' && <RecipeBook discoveredRecipes={discoveredRecipes} partialDiscoveries={partialDiscoveries} />}
        {activePanel === 'log' && <ActionLog log={log} />}
      </div>
    </div>
  );
}

function RecipeBook({ discoveredRecipes, partialDiscoveries }: { discoveredRecipes: string[]; partialDiscoveries: Record<string, PartialDiscovery> }) {
  const discovered = recipes.filter((recipe) => discoveredRecipes.includes(recipe.id));
  const theories = Object.values(partialDiscoveries).filter((theory) => !discoveredRecipes.includes(theory.recipeId));
  const hiddenCount = recipes.length - discovered.length;
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-300">
        <BookOpen className="h-4 w-4" /> Discovered Recipes
      </p>
      <div className="mt-3 space-y-2">
        {theories.map((theory) => <RecipeTheoryCard key={theory.recipeId} theory={theory} />)}
        {discovered.map((recipe) => (
          <div key={recipe.id} className="rounded-lg border border-pink-300/30 bg-pink-300/10 p-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-pink-200">{recipe.category}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {recipe.inputs.map((id) => <MiniResource key={id} id={id} />)}
              <span className="text-pink-200">→</span>
              <MiniResource id={recipe.output} />
            </div>
            <p className="mt-2 text-xs font-black text-white">{recipe.name}</p>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <p className="text-xs font-bold text-gray-300">{hiddenCount} discoveries are still hidden.</p>
          </div>
        )}
      </div>
      <div className="mt-4 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Starter clues</p>
        <ul className="mt-2 space-y-2 text-xs font-bold leading-relaxed text-yellow-50">
          {starterClues.map((clue) => <li key={clue}>{clue}</li>)}
        </ul>
      </div>
    </div>
  );
}

function RecipeTheoryCard({ theory }: { key?: string; theory: PartialDiscovery }) {
  const recipe = recipes.find((item) => item.id === theory.recipeId);
  if (!recipe) return null;
  return (
    <div className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-yellow-200">Theory: {theory.matched}/{recipe.inputs.length} matched</p>
      <p className="mt-2 text-xs font-bold leading-relaxed text-yellow-50">{theory.clue}</p>
    </div>
  );
}

function TraderPanel({
  traders,
  inventory,
  meters,
  selectedTradePayment,
  onSelectTradePayment,
  onTrade,
}: {
  traders: Trader[];
  inventory: Inventory;
  meters: Meters;
  selectedTradePayment: Record<string, ResourceId | null>;
  onSelectTradePayment: (traderId: string, payment: ResourceId) => void;
  onTrade: (trader: Trader, payment: ResourceId | null) => void;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
        <Users className="h-4 w-4" /> Participant Exchange
      </p>
      <div className="mt-3 space-y-3">
        {traders.map((trader) => {
          const unavailable = meters.trust < 24 && trader.id !== 'ivalina';
          const selectedPayment = selectedTradePayment[trader.id] ?? null;
          return (
          <div key={trader.id} className={`w-full rounded-xl border p-3 text-left transition-colors ${unavailable ? 'border-red-300/20 bg-red-300/5 opacity-75' : 'border-white/10 bg-black/50'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{trader.name}</p>
                <p className="text-[10px] font-bold uppercase text-gray-500">{trader.role}</p>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-green-300">Offers</p>
              <div className="mt-1 flex flex-wrap gap-1.5">{trader.offers.map((id) => <MiniResource key={id} id={id} />)}</div>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-yellow-300">Needs one</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {trader.needs.map((id) => (
                  <button
                    key={id}
                    onClick={() => onSelectTradePayment(trader.id, id)}
                    disabled={inventory[id] <= 0 || unavailable}
                    className={`rounded border px-2 py-1 text-[9px] font-black uppercase ${selectedPayment === id ? 'border-white bg-white text-black' : inventory[id] > 0 ? resources[id].color : 'border-white/10 bg-black/40 text-gray-600'} disabled:opacity-40`}
                  >
                    {resources[id].short} x{inventory[id]}
                  </button>
                ))}
              </div>
            </div>
            <TradePreview trader={trader} payment={selectedPayment} unavailable={unavailable} />
            <button
              onClick={() => onTrade(trader, selectedPayment)}
              disabled={unavailable || !selectedPayment}
              className="mt-3 w-full rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-300 hover:text-black disabled:border-white/10 disabled:bg-white/[.03] disabled:text-gray-500"
            >
              Trade
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function TradePreview({ trader, payment, unavailable }: { trader: Trader; payment: ResourceId | null; unavailable: boolean }) {
  if (unavailable) {
    return <p className="mt-3 rounded-lg border border-red-300/20 bg-red-300/10 p-2 text-xs font-bold text-red-100">Low trust. Repair the group climate before trading here.</p>;
  }
  return (
    <p className="mt-3 rounded-lg border border-white/10 bg-black/45 p-2 text-xs font-bold leading-relaxed text-gray-200">
      {payment ? <>You give <span className="text-yellow-200">{label(payment)}</span> {'->'} {trader.name} gives <span className="text-green-200">{trader.offers.map(label).join(' + ')}</span>.</> : 'Choose what you will give first.'}
    </p>
  );
}

function ActionLog({ log }: { log: LogEntry[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-green-300">Action Log</p>
      <div className="mt-3 space-y-2">
        {log.map((entry, index) => (
          <div key={`${entry.text}-${index}`} className={`rounded-lg border p-3 text-xs leading-relaxed ${entry.tone === 'good' ? 'border-green-300/30 bg-green-300/10 text-green-100' : entry.tone === 'warn' ? 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100' : 'border-white/10 bg-black/45 text-gray-300'}`}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReflectionPanel({ reflections }: { reflections: string[] }) {
  return (
    <div className="rounded-xl border border-green-300/20 bg-green-300/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-green-300">Installed Module Reflections</p>
      <div className="mt-3 space-y-2">
        {reflections.length ? reflections.map((reflection) => (
          <p key={reflection} className="rounded-lg border border-green-300/20 bg-black/35 p-3 text-xs font-bold leading-relaxed text-green-50">{reflection}</p>
        )) : (
          <p className="text-sm font-bold text-gray-400">Install a module to unlock a short design reflection.</p>
        )}
      </div>
    </div>
  );
}

function BoardDrawer({ open, builtModules, inventory, onClose, onInstall }: { open: boolean; builtModules: string[]; inventory: Inventory; onClose: () => void; onInstall: (module: Module) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan-300/40 bg-slate-950 p-4 shadow-[0_0_30px_rgba(34,211,238,.25)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">KA152 Board</p>
            <h2 className="mobile-readable-arcade mt-1 text-xl text-white">Install project modules</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/[.05] p-2 text-white hover:border-cyan-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ProjectBoard builtModules={builtModules} inventory={inventory} onInstall={onInstall} />
      </div>
    </div>
  );
}

function DiscoveryReveal({ open, state, onClose }: { open: boolean; state: DiscoveryRevealState | null; onClose: () => void }) {
  if (!open || !state) return null;
  const output = resources[state.recipe.output];
  const Icon = output.Icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-2xl border border-pink-300 bg-slate-950 p-5 text-center shadow-[0_0_40px_rgba(255,0,200,.25)]">
        <p className="text-xs font-black uppercase tracking-widest text-pink-200">{state.isNew ? 'New Discovery' : 'Crafted Again'}</p>
        <div className={`mx-auto mt-4 flex h-28 w-28 flex-col items-center justify-center rounded-2xl border ${output.color}`}>
          <Icon className="h-10 w-10" />
          <p className="mt-2 text-sm font-black">{output.short}</p>
        </div>
        <h3 className="mt-4 text-xl font-black text-white">{state.recipe.name}</h3>
        <p className="mt-2 text-sm font-bold leading-relaxed text-gray-300">{state.recipe.feedback}</p>
        <button onClick={onClose} className="mt-5 rounded-lg border border-pink-300 bg-pink-300/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-pink-50 hover:bg-pink-300 hover:text-black">
          Continue
        </button>
      </motion.div>
    </div>
  );
}

function EndingPanel({
  ending,
  builtCount,
  meters,
  strongestMeter,
  weakestMeter,
  missingResource,
  discoveredCount,
  reflections,
  onRestart,
  onSendTakeaway,
}: {
  ending: EndingKind;
  builtCount: number;
  meters: Meters;
  strongestMeter: MeterKey;
  weakestMeter: MeterKey;
  missingResource: ResourceId | null;
  discoveredCount?: number;
  reflections?: string[];
  onRestart: () => void;
  onSendTakeaway: (kind: 'mechanic' | 'debrief' | 'materials' | 'resources') => void;
}) {
  const content = endingContent[ending];
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
      <div className={`${ending === 'ready' ? 'arcade-border-green glass-panel-green' : ending === 'care' ? 'arcade-border glass-panel' : 'arcade-border-pink glass-panel-pink'} rounded-xl p-5`}>
        <Sparkles className="h-10 w-10 text-yellow-300" />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-300">Final Outcome</p>
        <h2 className="mobile-readable-arcade mt-3 text-2xl text-white">{content.title}</h2>
        <p className="readable-copy mt-4 text-sm leading-relaxed text-gray-100">{content.text}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <OutcomeCard title="Built modules" text={`${builtCount}/7 KA152 modules completed.`} />
          <OutcomeCard title="Discoveries" text={`${discoveredCount ?? 0}/${recipes.length} recipes discovered.`} />
          <OutcomeCard title="Weakest system" text={`${meterName(weakestMeter)} needs care.`} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <OutcomeCard title="Strongest system" text={`${meterName(strongestMeter)} stayed strongest.`} />
          <OutcomeCard title="Most used resource type" text="Human resources and material tools had to work together." />
        </div>
        <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Design Takeaway</p>
          <p className="readable-copy mt-2 text-sm leading-relaxed text-cyan-50">{game.takeaway}</p>
          {missingResource && <p className="mt-3 text-xs font-bold uppercase text-yellow-100">Most needed resource: {label(missingResource)}</p>}
        </div>
        {reflections?.length ? (
          <div className="mt-5 rounded-xl border border-green-300/20 bg-green-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-green-300">Installed module lessons</p>
            <div className="mt-3 space-y-2">
              {reflections.slice(-4).map((reflection) => <p key={reflection} className="text-sm font-bold leading-relaxed text-green-50">{reflection}</p>)}
            </div>
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => onSendTakeaway('mechanic')} className="arcade-border-green inline-flex items-center justify-center gap-2 bg-green-900/40 px-5 py-3 text-xs font-bold uppercase tracking-widest text-green-100 hover:bg-green-300 hover:text-black">
            <ClipboardList className="h-4 w-4" /> Send Mechanic
          </button>
          <button onClick={() => onSendTakeaway('debrief')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cyan-100 hover:bg-cyan-300 hover:text-black">
            Send Debrief
          </button>
          <button onClick={() => onSendTakeaway('materials')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-yellow-100 hover:bg-yellow-300 hover:text-black">
            Send Materials
          </button>
          <button onClick={() => onSendTakeaway('resources')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-300/30 bg-pink-300/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-pink-100 hover:bg-pink-300 hover:text-black">
            Send Resource Rules
          </button>
          <button onClick={onRestart} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-200 hover:border-yellow-300">
            <RotateCcw className="h-4 w-4" /> Replay
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="arcade-border-green glass-panel-green rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-green-300">Final Meters</p>
          <div className="mt-4 space-y-3">
            {(Object.keys(meters) as MeterKey[]).map((key) => <Meter key={key} label={meterName(key)} value={meters[key]} />)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/60 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">Make this as a board game</p>
          <div className="readable-copy mt-3 space-y-2 text-sm leading-relaxed text-gray-300">
            <p><span className="font-bold text-white">Board:</span> 7 KA152 modules.</p>
            <p><span className="font-bold text-white">Tokens:</span> material and human resources.</p>
            <p><span className="font-bold text-white">Cards:</span> discoveries, trades, collection spots, project modules.</p>
            <p><span className="font-bold text-white">Players:</span> combine, discover, exchange, and install before launch.</p>
            <p><span className="font-bold text-white">Debrief:</span> Which resource was hardest to create: material tools, trust, inclusion, or reflection?</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

function ResourceToken({ id, count, selected, onClick }: { key?: ResourceId; id: ResourceId; count: number; selected: boolean; onClick: () => void }) {
  const resource = resources[id];
  return (
    <button onClick={onClick} className={`relative min-h-24 rounded-lg border p-2 text-left transition-colors ${resource.color} ${selected ? 'ring-2 ring-white shadow-[0_0_16px_rgba(255,255,255,.25)]' : ''}`}>
      {selected && <span className="absolute right-1 top-1 rounded bg-white px-1 text-[7px] font-black uppercase text-black">On table</span>}
      <ResourceFace id={id} />
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="rounded bg-black/30 px-1 text-[7px] font-bold uppercase">{typeLabel(resource.type)}</span>
        <span className="text-[10px] font-black opacity-90">x{count}</span>
      </div>
    </button>
  );
}

function ResourceFace({ id, size = 'normal' }: { id: ResourceId; size?: 'normal' | 'large' }) {
  const resource = resources[id];
  const Icon = resource.Icon;
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Icon className={size === 'large' ? 'h-8 w-8' : 'h-5 w-5'} />
      <p className={`${size === 'large' ? 'mt-2 text-xs' : 'mt-1 text-[10px]'} break-words font-black leading-tight`}>{resource.short}</p>
    </div>
  );
}

function MiniResource({ id }: { key?: ResourceId; id: ResourceId }) {
  const resource = resources[id];
  const Icon = resource.Icon;
  return (
    <span title={resource.name} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-black uppercase ${resource.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {resource.short}
    </span>
  );
}

function NeedChip({ id, ok }: { key?: ResourceId; id: ResourceId; ok: boolean }) {
  const Icon = resources[id].Icon;
  return (
    <span title={resources[id].name} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-black uppercase ${ok ? 'border-green-300 bg-green-300/15 text-green-100' : 'border-red-300/30 bg-red-300/10 text-red-100'}`}>
      <Icon className="h-3.5 w-3.5" />
      {resources[id].short}
    </span>
  );
}

function Meter({ label, value }: { key?: string; label: string; value: number }) {
  const color = value >= 65 ? 'bg-green-300' : value >= 35 ? 'bg-yellow-300' : 'bg-red-400';
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-900">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function OutcomeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <p className="mt-2 text-sm font-bold leading-relaxed text-white">{text}</p>
    </div>
  );
}

const endingContent: Record<EndingKind, { title: string; text: string }> = {
  ready: {
    title: 'KA152 Board Game Ready',
    text: 'You built the exchange as a living system. Tools, trust, inclusion, logistics, learning, and follow-up all connect.',
  },
  care: {
    title: 'Exchange Works, But Needs Care',
    text: 'The project can happen, but one system is fragile. This is a strong debrief moment: what resource did the team protect too late?',
  },
  redesign: {
    title: 'Redesign Needed',
    text: 'The launch arrived before the project system was stable. Stop, redesign, and rebuild the missing resources before young people enter the game.',
  },
};

function createInventory(seed: Partial<Inventory> = {}) {
  return allResourceIds.reduce((inventory, id) => ({ ...inventory, [id]: seed[id] ?? 0 }), {} as Inventory);
}

function addResources(inventory: Inventory, ids: ResourceId[]) {
  const next = { ...inventory };
  ids.forEach((id) => { next[id] += 1; });
  return next;
}

function removeResources(inventory: Inventory, ids: ResourceId[]) {
  const next = { ...inventory };
  ids.forEach((id) => { next[id] = Math.max(0, next[id] - 1); });
  return next;
}

function hasResources(inventory: Inventory, ids: ResourceId[]) {
  const needed = ids.reduce((counts, id) => ({ ...counts, [id]: (counts[id] ?? 0) + 1 }), {} as Partial<Record<ResourceId, number>>);
  return (Object.entries(needed) as Array<[ResourceId, number]>).every(([id, count]) => inventory[id] >= count);
}

function missingFor(inventory: Inventory, ids: ResourceId[]) {
  const needed = ids.reduce((counts, id) => ({ ...counts, [id]: (counts[id] ?? 0) + 1 }), {} as Partial<Record<ResourceId, number>>);
  return (Object.entries(needed) as Array<[ResourceId, number]>).filter(([id, count]) => inventory[id] < count).map(([id]) => id);
}

function findRecipeByInputs(selected: ResourceId[]) {
  const key = sortedKey(selected);
  return recipes.find((recipe) => sortedKey(recipe.inputs) === key);
}

function findClosestRecipe(selected: ResourceId[]) {
  if (!selected.length) return null;
  const matches = recipes
    .map((recipe) => ({
      recipe,
      matched: selected.filter((id) => recipe.inputs.includes(id)).length,
    }))
    .filter((item) => item.matched > 0)
    .sort((a, b) => b.matched - a.matched);
  return matches[0] ?? null;
}

function sortedKey(ids: ResourceId[]) {
  return [...ids].sort().join('|');
}

function failedCraftHint(selected: ResourceId[], closeRecipe?: Recipe, failedCraftCount = 0) {
  const key = sortedKey(selected);
  if (key === sortedKey(['paper', 'projector'])) {
    return 'Tools are useful, but this needs a clear purpose.';
  }
  if (key === sortedKey(['budgetTokens', 'creativity'])) {
    return 'Money helps, but it does not create participation alone.';
  }
  if (selected.every((id) => resources[id].type === 'tangible')) {
    return 'These are mostly tools. Add a human resource like Creativity, Youth Voice, Trust, or Focus.';
  }
  if (selected.includes('energy') && !selected.includes('learningGoal') && !selected.includes('youthVoice')) {
    return 'This has energy, but no clear goal yet.';
  }
  if (selected.some((id) => ['budgetTokens', 'travelTickets', 'roomKeys'].includes(id)) && !selected.includes('roomKeys')) {
    return 'This looks like logistics. Try adding keys, tickets, or budget.';
  }
  if (closeRecipe && selected.every((id) => closeRecipe.inputs.includes(id))) {
    const missing = closeRecipe.inputs.filter((id) => !selected.includes(id));
    return `Theory saved: ${selected.length}/${closeRecipe.inputs.length} resources matched. Try adding ${missing.map(label).join(' or ')}.`;
  }
  const freeTry = failedCraftCount <= 3 ? ' No time lost yet.' : ' This now costs time and energy.';
  return `Nothing stable appeared. Try combining tools with people, or rules with youth voice.${freeTry}`;
}

function getNextMove(
  inventory: Inventory,
  builtModules: string[],
  selected: ResourceId[],
  discoveredRecipes: string[],
  partialDiscoveries: Record<string, PartialDiscovery>,
) {
  const readyModule = modules.find((module) => !builtModules.includes(module.id) && hasResources(inventory, module.needs));
  if (readyModule) return `${readyModule.name} is ready. Install it on the KA152 Board.`;

  const ownedCount = allResourceIds.filter((id) => inventory[id] > 0).length;
  if (ownedCount < 6) return 'Collect from the map first. You need more materials and human resources.';

  const selectedCloseRecipe = findClosestRecipe(selected);
  if (selected.length >= 2 && selectedCloseRecipe && selectedCloseRecipe.matched >= 2 && !discoveredRecipes.includes(selectedCloseRecipe.recipe.id)) {
    const missing = selectedCloseRecipe.recipe.inputs.filter((id) => !selected.includes(id));
    return `You are close to a ${selectedCloseRecipe.recipe.category} discovery. Try adding ${missing.map(label).join(' or ')}.`;
  }

  const theory = Object.values(partialDiscoveries)[0];
  if (theory) return `Use your theory: ${theory.clue}`;

  const missing = findMostNeededResource(inventory, builtModules);
  if (missing) return `You will soon need ${label(missing)}. Check recipes, collect spots, or traders.`;

  return 'Try a mix of one material, one human resource, and one purpose.';
}

function moduleReflection(moduleId: string) {
  const reflections: Record<string, string> = {
    'shared-topic': 'Shared Topic: a project is stronger when young people help define the reason.',
    'partner-team': 'Partner Team: cooperation needs agreements, not only friendly people.',
    'activity-plan': 'Activity Plan: activities work better when rules, creativity, and focus connect.',
    logistics: 'Logistics: practical resources support learning, but they are not the learning itself.',
    'inclusion-support': 'Inclusion Support: access and care must be designed before problems appear.',
    'youthpass-reflection': 'YouthPass Reflection: learning becomes useful when players can name it.',
    'follow-up-action': 'Follow-Up Action: impact grows when the project leaves the activity room.',
  };
  return reflections[moduleId] ?? 'This module shows how one part of the project changes the whole system.';
}

function spotUsesLeft(spot: CollectSpot, collectedSpotCounts: Record<string, number>, builtCount: number) {
  if (!spot.maxUses) return 99;
  const refreshedUses = spot.maxUses + Math.floor(builtCount / 2);
  return Math.max(0, refreshedUses - (collectedSpotCounts[spot.id] ?? 0));
}

function costLabel(cost: Partial<Meters>) {
  const parts = (Object.entries(cost) as Array<[MeterKey, number]>).map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${meterName(key)}`);
  return parts.length ? `Cost: ${parts.join(', ')}` : 'No meter cost';
}

function clampMeters(current: Meters, effects: Partial<Meters>) {
  return (Object.keys(current) as MeterKey[]).reduce((next, key) => ({
    ...next,
    [key]: Math.max(0, Math.min(100, current[key] + (effects[key] ?? 0))),
  }), {} as Meters);
}

function findMostNeededResource(inventory: Inventory, builtModules: string[]) {
  const missing = modules
    .filter((module) => !builtModules.includes(module.id))
    .flatMap((module) => missingFor(inventory, module.needs));
  if (!missing.length) return null;
  const counts = missing.reduce((map, id) => ({ ...map, [id]: (map[id] ?? 0) + 1 }), {} as Partial<Record<ResourceId, number>>);
  return (Object.keys(counts) as ResourceId[]).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
}

function label(id: ResourceId) {
  return resources[id].name;
}

function typeLabel(type: Resource['type']) {
  if (type === 'tangible') return 'Material';
  if (type === 'intangible') return 'Human';
  return 'Crafted';
}

function meterName(key: MeterKey) {
  if (key === 'energy') return 'Energy';
  if (key === 'trust') return 'Trust';
  return 'Budget';
}
