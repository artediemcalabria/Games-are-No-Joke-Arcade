import {
  Brain,
  CircleHelp,
  ClipboardList,
  DoorOpen,
  Gamepad2,
  HeartHandshake,
  IterationCcw,
  MessageSquareText,
  Puzzle,
  RotateCcw,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface ModelStep {
  label: string;
  text: string;
  prompt: string;
}

interface FlipCard {
  front: string;
  frontHint: string;
  back: string;
  prompt: string;
}

interface Checkpoint {
  question: string;
  options: string[];
  answer: number;
}

interface InteractiveControl {
  id: string;
  label: string;
  kind: 'slider' | 'switch' | 'knob';
  min?: number;
  max?: number;
  defaultValue: number | boolean;
}

interface InteractiveLab {
  title: string;
  intro: string;
  controls: InteractiveControl[];
}

interface PodcastEpisode {
  moduleNumber: number;
  participants: string[];
  title: string;
  youtubeUrl: string;
  youtubeEmbedUrl: string;
  discussionSummary: string[];
}

interface CourseLessonBase {
  id: string;
  modelTag: string;
  title: string;
  icon: LucideIcon;
  focus: string;
  model: string;
  rewardBadge: string;
  learningPromise: string;
  definition?: string;
  whyItMatters?: string;
  trainerBackup?: string;
  boardGamePattern?: string;
  sources?: string[];
  bullets: string[];
  modelSteps: ModelStep[];
  boardGameLens: string[];
  youthWorkLens: string;
  facilitatorMove: string;
  antiPattern: string;
  example: string;
  tryIt: string;
  flipCards: FlipCard[];
  interactiveLab?: InteractiveLab;
  podcastEpisode?: PodcastEpisode;
  checkpoint: Checkpoint;
}

export const courseInfo = {
  title: 'Games Are No Joke',
  subtitle: 'Game Design for Youth Work',
  programme: 'Erasmus+ Training Course',
  code: '2025-1-IT03-KA153-YOU-000303546',
  dates: '28.04-06.05.2026',
  venue: 'Filadelfia (VV), Calabria',
  host: 'Arte Diem Calabria',
};

export const partners = [
  { name: 'Arte Diem Calabria', country: 'Italy', role: 'Host', logo: 'partners/arte-diem-calabria.png', instagram: 'http://www.instagram.com/artediemcalabria', facebook: 'http://www.facebook.com/artediemcalabria' },
  { name: 'VIA AD ASTRA Radovish', country: 'North Macedonia', role: 'Partner', logo: 'partners/via-ad-astra-north-macedonia.jpg', instagram: 'https://www.instagram.com/ngo_adastra/', facebook: 'https://www.facebook.com/viadastra' },
  { name: 'Go Over All Limits - Treci Peste Toate Limitele', country: 'Romania', role: 'Partner', logo: 'partners/goal-romania.jpg', instagram: 'https://www.instagram.com/go_over_all_limits/', facebook: 'https://www.facebook.com/goalassociation' },
  { name: 'Guclu Gelecek Dernegi - Strong Future Association', country: 'Turkiye', role: 'Partner', logo: 'partners/stronger-future-turkiye.jpg', instagram: 'https://www.instagram.com/strongfutureassociation/', facebook: 'https://www.facebook.com/strongfutureassociation' },
  { name: 'Opportunities Hub Bulgaria', country: 'Bulgaria', role: 'Partner', logo: 'partners/opportunities-hub-bulgaria.png', instagram: 'https://www.instagram.com/opportunities.hub.bg/', facebook: 'https://www.facebook.com/opportunities.hub.bulgaria' },
  { name: 'Association la Generation de Demain', country: 'France', role: 'Partner', logo: 'partners/la-generation-de-demain-france.jpg', instagram: 'https://www.instagram.com/lagenerationdedemain/', facebook: 'https://www.facebook.com/lagenerationdedemain' },
  { name: 'Volonterski centar Nis', country: 'Serbia', role: 'Partner', logo: 'partners/volonterski-centar-nis.png', instagram: 'https://www.instagram.com/volonteri.nis/', facebook: 'https://www.facebook.com/volonteri.nis/' },
];

const baseLessons: CourseLessonBase[] = [
  {
    id: 'what-is-a-game',
    modelTag: 'Model 1/9',
    title: 'What Is a Game?',
    icon: CircleHelp,
    focus: 'A game is voluntary play with a goal, rules, obstacles, feedback, and player agreement.',
    model: 'Goal + Rules + Choice + Feedback',
    rewardBadge: 'Game Definition Starter',
    learningPromise: 'You will be able to explain what makes an activity a game, and why rules make play meaningful.',
    definition: 'A game is a temporary system where players freely accept rules, try to reach a goal, face obstacles, and receive feedback from the system.',
    whyItMatters: 'Youth workers need this definition because many activities look playful but do not yet create player choice, consequence, or reflection.',
    trainerBackup: 'Backup resource: Importance of Rules and Playing video - https://www.youtube.com/watch?v=JI9n2yC14fU',
    boardGamePattern: 'Start with a visible goal, a few rules, and materials that answer player actions clearly.',
    sources: ['Bernard Suits: playing a game as a voluntary attempt to overcome unnecessary obstacles', 'Huizinga: play creates a temporary magic circle', 'Salen and Zimmerman: games as systems of rules and meaningful play'],
    bullets: [
      'Games are voluntary. Players enter because they accept the frame.',
      'Rules do not kill play. Rules create the interesting challenge.',
      'Feedback tells players what their choices changed.',
    ],
    modelSteps: [
      { label: 'Agreement', text: 'Players agree to enter a temporary play space. They know this is not real life, but it can still create real learning.', prompt: 'How do players enter the game safely?' },
      { label: 'Goal', text: 'The goal gives direction: reach, build, survive, repair, discover, or understand.', prompt: 'What are players trying to achieve?' },
      { label: 'Rules', text: 'Rules create limits. The limit is what makes the action interesting.', prompt: 'What rule makes the task playful?' },
      { label: 'Feedback', text: 'The game answers player action with visible change: movement, cards, tokens, meters, or reactions.', prompt: 'How does the system answer?' },
    ],
    boardGameLens: [
      'A board can show the temporary world and where players can act.',
      'Cards can create goals, events, roles, or surprising obstacles.',
      'Tokens can show feedback immediately: progress, trust, energy, risk, or access.',
    ],
    youthWorkLens: 'A youth-work game is not only fun. It is a safe frame where players can try choices, observe consequences, and discuss meaning.',
    facilitatorMove: 'Before explaining theory, ask the group: "What makes something a game and not only an exercise?"',
    antiPattern: 'Do not start with a topic only. Start with what players do, what rule limits them, and what feedback they receive.',
    example: 'If players must cross a room, it is a task. If they must cross with limited steps, shared resources, and visible feedback, it becomes a game.',
    tryIt: 'Write one sentence: In my game, players try to ___, but they must follow ___, and the system shows ___ after each action.',
    podcastEpisode: {
      moduleNumber: 1,
      participants: ['Buse', 'Sophie', 'Emin', 'Liviu'],
      title: '🎮 What Is a Game? Rules, Choices, Memories, and Emotion | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/EmW_DOL4kBs',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/EmW_DOL4kBs',
      discussionSummary: [
        'The team explored the meaning of a game by comparing games with exercises, competitions, and everyday life. They suggested that games involve rules, limits, tasks, and choices, but also emotion, fun, memory, and the feeling of being inside a special situation.',
        'One participant described games as memories from childhood and moments shared with others. The group also discussed how an exercise becomes different from a game when the activity is not only about completing a task, but about playing around the task, enjoying the process, and learning without noticing it directly.',
        'They used personal examples to show that losing can still be enjoyable when the experience is memorable, funny, or impossible to repeat. They also discussed how games such as GTA can make players question their own morals by offering choices that would not be acceptable in real life. The episode ends with the idea that games are not just for passing time: they are designed experiences that can create memories, transmit emotions, and allow experimentation without real-world consequences.',
      ],
    },
    flipCards: [
      { front: 'Voluntary Frame', frontHint: 'Players accept the temporary world and its limits.', back: 'A game begins when people agree to play. In youth work this agreement matters: it creates safety, consent, and a clear border between play and real life.', prompt: 'How will players know they are entering and leaving the game frame?' },
      { front: 'Useful Rules', frontHint: 'Rules make the challenge meaningful, not random.', back: 'A rule is useful when it creates a decision. Good rules are short, visible, and connected to the learning goal. Too many rules hide the experience.', prompt: 'Which rule creates the main challenge in your prototype?' },
      { front: 'Obstacle', frontHint: 'The difficulty players accept because it makes play interesting.', back: 'Suits describes games as voluntary attempts to overcome unnecessary obstacles. In learning games, the obstacle should reveal something about the topic.', prompt: 'What obstacle makes your topic visible without humiliating players?' },
      { front: 'Feedback', frontHint: 'The game must answer what the player did.', back: 'Feedback can be a card, token, sound, meter, map change, or group reaction. Without feedback, players cannot learn the system.', prompt: 'What feedback appears in the first 30 seconds of play?' },
    ],
    checkpoint: {
      question: 'What makes an activity become a game?',
      options: ['A goal, rules, player choice, and feedback.', 'Only a colorful design.', 'Only a trainer explaining the topic.'],
      answer: 0,
    },
  },
  {
    id: 'magic-circle',
    modelTag: 'Model 2/10',
    title: 'The Magic Circle',
    icon: DoorOpen,
    focus: 'A game creates a temporary space where normal life is paused, rules are accepted, and players can try actions safely.',
    model: 'Enter -> Agree -> Play -> Exit -> Reflect',
    rewardBadge: 'Magic Circle Keeper',
    learningPromise: 'You will design the border of your game: how people enter, what protects them, and how they leave with learning.',
    definition: 'The magic circle is the temporary play space created when players accept a game frame, shared rules, roles, limits, and meaning.',
    whyItMatters: 'In youth work, the magic circle helps participants explore sensitive ideas with fictional distance, safety, consent, and a clear debrief.',
    trainerBackup: 'Use Huizinga as the classic reference for play as a separate space, then connect it to facilitation safety, consent, and debriefing.',
    boardGamePattern: 'Use a clear start ritual, visible rules, respectful roles, opt-out options, and an end ritual before the debrief.',
    sources: ['Huizinga: play creates a temporary space with its own order', 'Game-based learning: reflection helps connect play back to real life', 'Youth work facilitation: safety, consent, and respectful framing protect the group'],
    bullets: [
      'Players need to know when the game starts and when it ends.',
      'The game space needs boundaries: rules, roles, consent, and safety.',
      'A debrief helps players exit the game and connect learning to real life.',
    ],
    modelSteps: [
      { label: 'Enter', text: 'Players cross into the game world through a small ritual: story, invitation, role card, board setup, or first rule.', prompt: 'How do players enter your game world?' },
      { label: 'Agree', text: 'Players accept shared rules and boundaries. This includes what is allowed, what is not allowed, and how to stop if needed.', prompt: 'What rule protects the group?' },
      { label: 'Play', text: 'Inside the circle, players can try actions, roles, and choices without real-life punishment.', prompt: 'What action can players safely test?' },
      { label: 'Exit', text: 'Players need a clear way to leave the role, name feelings, and reconnect with real life.', prompt: 'How do players exit the game safely?' },
      { label: 'Reflect', text: 'The debrief turns the temporary experience into learning, dialogue, and future action.', prompt: 'What question brings learning back to life?' },
    ],
    boardGameLens: [
      'A start card can invite players into the story and name the safety frame.',
      'Role cards should protect dignity and avoid stereotypes.',
      'An exit card or final reflection token can help players leave the role before personal discussion.',
    ],
    youthWorkLens: 'The trainer protects the circle. Strong facilitation makes play brave enough for learning and safe enough for participation.',
    facilitatorMove: 'Say clearly: "We are entering a game frame. You can pause, ask, or step out. After play, we will reflect together."',
    antiPattern: 'Do not throw players into sensitive roles without consent, boundaries, or a way to exit.',
    example: 'Before a community conflict game, players receive fictional village roles, safety rules, and an exit question: "What did the system make you notice?"',
    tryIt: 'Design a 30-second entry ritual and a 2-minute exit/debrief ritual for your prototype.',
    podcastEpisode: {
      moduleNumber: 2,
      participants: ['Kaotar', 'Slave', 'Hatche'],
      title: '🪄 The Magic Circle: Safe Play, Roles, and Debriefing | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/e3GVMYQ0ByQ',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/e3GVMYQ0ByQ',
      discussionSummary: [
        'The team described the Magic Circle as a safe temporary reality where participants can express themselves, reduce anxiety, and try new behaviors without feeling the same consequences as in everyday life. They used the image of a magical island to explain how a new context can help people feel lighter, braver, and more open.',
        "They gave special attention to the facilitator's role. The facilitator helps participants enter the Magic Circle through a clear ritual, accepts a role inside the story, and makes sure the group respects the agreed rules of the safe space. The group explained that roles and narrative context make the activity more believable and help participants step into actions they might avoid in normal life.",
        'The team also emphasized two key responsibilities: exit strategy and debriefing. Participants need a clear way to leave the Magic Circle if something becomes uncomfortable. After the activity, the facilitator must connect the experience back to real life, otherwise the play remains only fantasy. They also mentioned Huizinga as the thinker connected to this concept and noted that the Magic Circle is especially useful in youth work when groups need safe space for expression and experimentation.',
      ],
    },
    flipCards: [
      { front: 'Entry Ritual', frontHint: 'A small action that tells players they are entering the game world.', back: 'The entry can be reading a story card, choosing a role, placing a token, or hearing the first rule. It helps players understand the temporary frame.', prompt: 'How do players enter your game world?' },
      { front: 'Shared Rules', frontHint: 'The agreements that make play fair, safe, and meaningful.', back: 'Rules do more than create challenge. They also create trust. In youth work, rules should say what players can do and how the group stays safe.', prompt: 'What rule protects the group while keeping the game interesting?' },
      { front: 'Fictional Safety', frontHint: 'Distance that lets players explore real issues without exposing personal stories.', back: 'Fictional safety uses villages, islands, teams, missions, or future worlds. Players can discuss the system before speaking about personal life.', prompt: 'What fictional frame helps your group discuss the topic safely?' },
      { front: 'Exit and Debrief', frontHint: 'The moment players leave the role and turn play into learning.', back: 'A clear exit prevents the game feeling unfinished or too personal. The debrief starts from what happened in the game, then moves to feelings and real life.', prompt: 'How do players exit the game safely and reflect?' },
    ],
    interactiveLab: {
      title: 'Magic Circle Tuner',
      intro: 'Tune the safety, challenge, distance, and reflection of your game frame.',
      controls: [
        { id: 'safety', label: 'Safety', kind: 'slider', min: 0, max: 10, defaultValue: 7 },
        { id: 'challenge', label: 'Challenge', kind: 'slider', min: 0, max: 10, defaultValue: 5 },
        { id: 'fictionalDistance', label: 'Fictional Distance', kind: 'slider', min: 0, max: 10, defaultValue: 6 },
        { id: 'debriefDepth', label: 'Debrief Depth', kind: 'knob', min: 0, max: 10, defaultValue: 6 },
        { id: 'clearStart', label: 'Clear Start', kind: 'switch', defaultValue: true },
        { id: 'clearEnd', label: 'Clear End', kind: 'switch', defaultValue: true },
        { id: 'consent', label: 'Consent', kind: 'switch', defaultValue: true },
        { id: 'reflection', label: 'Reflection', kind: 'switch', defaultValue: true },
      ],
    },
    checkpoint: {
      question: 'What does the magic circle help a youth worker design?',
      options: ['A safe temporary game frame with entry, rules, exit, and debrief.', 'A game with no boundaries.', 'Only the visual style of the board.'],
      answer: 0,
    },
  },
  {
    id: 'power-of-play',
    modelTag: 'Model 2/9',
    title: 'Why Games Matter for Learning and Social Development',
    icon: Sparkles,
    focus: 'Games make learning active because players make choices, feel results, and talk about what happened.',
    model: 'Play -> Feel -> Think -> Act',
    rewardBadge: 'Playful Learning Starter',
    learningPromise: 'You will understand why a game can open dialogue faster than a lecture, when it is followed by reflection.',
    definition: 'Play is a powerful learning mode because it lets people explore, imitate, test rules, take roles, and learn with others.',
    whyItMatters: 'Brown connects play with adaptability and social skill. Piaget shows how play supports cognitive development. Vygotsky shows how learning grows through social interaction and scaffolding.',
    trainerBackup: 'Use Stuart Brown, Piaget, Vygotsky, Huizinga, and McGonigal as trainer backup for why play is serious learning.',
    boardGamePattern: 'Use shared tables, roles, and visible tokens to turn social learning into something players can observe together.',
    sources: ['Stuart Brown: play supports creativity, adaptability, and social connection', 'Piaget: symbolic and rule-based play support development', 'Vygotsky: social interaction and scaffolding support learning', 'Jane McGonigal: games can support agency and collective action'],
    bullets: [
      'A game gives people a goal, limits, and a reason to try.',
      'Players learn by doing, failing, changing tactics, and watching others.',
      'A youth worker turns play into learning through a safe debrief.',
    ],
    modelSteps: [
      { label: 'Play', text: 'Players enter a safe frame. They try actions without real-life risk.', prompt: 'What action will players repeat?' },
      { label: 'Feel', text: 'The game creates emotion: tension, trust, surprise, laughter, frustration, care.', prompt: 'What feeling should appear?' },
      { label: 'Think', text: 'Players notice patterns. They ask why something happened.', prompt: 'What pattern should they see?' },
      { label: 'Act', text: 'The debrief connects the pattern to youth work and real life.', prompt: 'What real action can follow?' },
    ],
    boardGameLens: [
      'Use tokens to make invisible things visible, like trust, voice, pressure, or access.',
      'Use turns to make everyone participate, not only the loudest player.',
      'Use scarcity carefully. Limited resources create choices, but too much scarcity creates stress.',
    ],
    youthWorkLens: 'In youth work, the game is not the full learning process. The cycle is play, debrief, transfer, and action.',
    facilitatorMove: 'After play, ask first for observations before interpretations: "What did you notice?"',
    antiPattern: 'Do not use a game only as entertainment and then add a moral speech at the end. Put the learning inside the mechanic.',
    example: 'A group plays a resource-sharing game. During play they feel unfairness. In the debrief they connect it to inclusion and access in youth projects.',
    tryIt: 'Choose one youth work topic. Write one action players should repeat and one feeling that action should create.',
    podcastEpisode: {
      moduleNumber: 3,
      participants: ['Stasa', 'Ivy', 'Mihaela'],
      title: '🌱 Why Games Matter for Learning and Social Development | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/yzuTAVnBYBo',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/yzuTAVnBYBo',
      discussionSummary: [
        'The team discussed games as tools for learning and social development from childhood to adulthood. Stasa spoke from her experience working with children, explaining that children explore the world through games and develop social skills such as emotional regulation, reacting to losing or winning, and stepping outside their comfort zone in a supportive way.',
        'Mihaela connected games to adult learning, saying that adults often have less time for games but still use board games, video games, and hobbies to develop creativity, teamwork, patience, tolerance, strategic thinking, logic, and emotional control. She also connected this to non-formal education and Erasmus activities, where gamification can help people learn and raise awareness about important topics in an engaging mood.',
        'The group also discussed games for older people and language learners. They mentioned memory and focus for elderly learners, and language games such as charades, simulations, and role-plays for vocabulary, real-life communication, and cultural adaptation. Their central point was that games make learning active, social, emotional, and easier to connect with real experience.',
      ],
    },
    flipCards: [
      { front: 'Game Frame', frontHint: 'A temporary world where players can try, fail, and talk safely.', back: 'A safe frame needs a clear start, clear limits, and permission to experiment. In youth work, this protects the group while still allowing emotion and discovery.', prompt: 'What is the temporary world of your prototype? What are its safety limits?' },
      { front: 'Meaningful Action', frontHint: 'The player action that makes the learning visible on the table.', back: 'A meaningful action changes something players can see or feel: a token moves, trust changes, a card appears, or a new choice opens. This is where the message lives.', prompt: 'What changes after a player acts? Is the learning inside that change?' },
      { front: 'Debrief Bridge', frontHint: 'The question that connects play to real life after the round.', back: 'The debrief bridge helps players move from "we played" to "we noticed something about our group, society, or youth work". Start with observations, then feelings, then transfer.', prompt: 'What question helps players connect the game to their real context?' },
    ],
    checkpoint: {
      question: 'What makes a game useful in non-formal education?',
      options: ['It creates action and reflection.', 'It replaces the trainer.', 'It only needs points.'],
      answer: 0,
    },
  },
  {
    id: 'board-games-youth-work',
    modelTag: 'Model 3/9',
    title: 'Why Board Games Work in Youth Work',
    icon: Puzzle,
    focus: 'Board games make social systems visible with cards, boards, roles, tokens, dice, and shared conversation.',
    model: 'Table + Components + Dialogue + Debrief',
    rewardBadge: 'Tabletop Youth Worker',
    learningPromise: 'You will understand why board games are strong tools for non-formal education and youth participation.',
    definition: 'A board game is a tabletop system where players use physical or simple digital components to make choices, follow rules, and create shared meaning.',
    whyItMatters: 'Board games are low-cost, portable, social, and easy to prototype. They help mixed-language groups because players can see rules and consequences on the table.',
    trainerBackup: 'Trainer backup: board-game learning reviews show benefits for knowledge, motivation, interaction, and structured reflection when games are well facilitated.',
    boardGamePattern: 'Choose components with purpose: cards for situations, boards for journeys, tokens for invisible resources, dice for uncertainty, and roles for perspective.',
    sources: ['Board games systematic review: tabletop play can support learning and motivation', 'Educational board-game design framework: align learning goal, mechanics, feedback, and debrief', 'Game-based learning debriefing research: reflection is needed to convert play into learning'],
    bullets: [
      'Cards carry prompts, dilemmas, resources, roles, events, and debrief questions.',
      'Boards show space, sequence, access, distance, paths, and systems.',
      'Tokens make invisible things visible: trust, energy, budget, voice, power, or risk.',
    ],
    modelSteps: [
      { label: 'Cards', text: 'Cards are modular. They can hold events, choices, roles, values, questions, or resources. They help groups create many situations with few materials.', prompt: 'What should your cards reveal?' },
      { label: 'Board', text: 'A board is useful when position matters. It can show a journey, conflict map, community, project timeline, or access to resources.', prompt: 'What should be visible on the table?' },
      { label: 'Tokens', text: 'Tokens turn invisible systems into objects players can move, lose, share, protect, or trade.', prompt: 'What invisible thing needs a token?' },
      { label: 'Debrief', text: 'The table gives evidence for reflection. Players can point to moments, cards, and choices instead of speaking only in abstract theory.', prompt: 'What table moment will you debrief?' },
    ],
    boardGameLens: [
      'Use cards when you need many examples without writing long rules.',
      'Use tokens when players must feel scarcity, care, trust, or consequence.',
      'Use boards when the learning depends on path, position, sequence, or territory.',
    ],
    youthWorkLens: 'Board games support inclusion when components reduce language load and give everyone a visible turn, role, or contribution.',
    facilitatorMove: 'Give groups a component menu: card, board, token, dice, role, timer. Ask them to choose only what serves the learning goal.',
    antiPattern: 'Do not add components because they look nice. Every component should create a decision, feedback, or reflection.',
    example: 'A migration dialogue game may use a route board for the journey, event cards for barriers, and dignity tokens to show social cost.',
    tryIt: 'Choose one component for your prototype and explain what learning job it does.',
    podcastEpisode: {
      moduleNumber: 4,
      participants: ['Andrea', 'Stefan', 'Elena'],
      title: '🎲 Why Board Games Work in Youth Work | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/h0C05R2r-eI',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/h0C05R2r-eI',
      discussionSummary: [
        'The team focused on how board games can support youth workers when they need to explain complex or abstract topics. They described core game elements such as cards, boards, tokens, and facilitator-led debriefing, explaining that these elements help participants make choices, see consequences, and understand social processes through visual representation.',
        'Elena emphasized that cards can put players into situations where they feel they have power to decide, while visual materials help them rationalize and understand the action they are taking. Stefan added that simplicity is important: if a board game becomes too complex, participants may lose sight of the learning purpose.',
        'Andrea brought in the role of intentional design. He argued that even a balanced board game is not enough if the facilitator has a clear educational goal. The group discussed how colors, boundaries, resources, and visual signals can guide players toward reflection without pretending the facilitator is fully neutral. Their conclusion was that board games work in youth work because they help participants experience, discuss, and make sense of social systems together.',
      ],
    },
    flipCards: [
      { front: 'Cards', frontHint: 'Cards are small containers for choices, roles, events, and questions.', back: 'Cards let a youth worker add variety without making the board complex. They are easy to rewrite after a playtest and easy for participants to co-create.', prompt: 'What 8 cards would make your prototype playable today?' },
      { front: 'Tokens', frontHint: 'Tokens make abstract things touchable.', back: 'Trust, stress, voice, budget, time, safety, or inclusion can become tokens. When players move them, the social system becomes visible.', prompt: 'Which invisible value should become a token in your game?' },
      { front: 'Board', frontHint: 'The board shows relationships, space, sequence, or progress.', back: 'Use a board when location matters. A board can show a city, project journey, conflict map, timetable, island, castle, or network.', prompt: 'Does your topic need space, sequence, or connection?' },
      { front: 'Shared Table', frontHint: 'A tabletop game creates common attention.', back: 'Everyone can see the same system. This helps mixed-language groups discuss what happened using objects, not only abstract words.', prompt: 'How will your table help quiet participants speak?' },
    ],
    checkpoint: {
      question: 'Why are board games useful in youth work?',
      options: ['They make systems visible and discussable.', 'They always need expensive materials.', 'They remove the need for debriefing.'],
      answer: 0,
    },
  },
  {
    id: 'fun-motivation-learning',
    modelTag: 'Model 4/9',
    title: 'Fun, Motivation, and Learning',
    icon: Brain,
    focus: 'Fun is often the feeling of learning a pattern, making a choice, and improving with others.',
    model: 'Autonomy + Competence + Belonging',
    rewardBadge: 'Motivation Designer',
    learningPromise: 'You will design motivation without manipulating players or overusing points.',
    bullets: [
      'Autonomy means players have real choices, not fake choices.',
      'Competence means players see progress and understand feedback.',
      'Belonging means the group feels safe, included, and needed.',
    ],
    modelSteps: [
      { label: 'Autonomy', text: 'Give players at least two strategies that can work.', prompt: 'Where can players choose their path?' },
      { label: 'Competence', text: 'Show progress through feedback, levels, clearer rules, or better team coordination.', prompt: 'How will players know they improved?' },
      { label: 'Belonging', text: 'Design cooperation, shared roles, or moments where a quiet voice matters.', prompt: 'Who is needed in your game?' },
    ],
    boardGameLens: [
      'Role cards can create belonging when each role has a real power.',
      'Visible meters can create competence when players understand how to improve them.',
      'Open choices create autonomy; random events create surprise. Balance both.',
    ],
    youthWorkLens: 'Motivation in youth work should protect dignity. The goal is participation, not control.',
    facilitatorMove: 'If people disengage, look for the missing need: choice, progress, or belonging.',
    antiPattern: 'Bad gamification adds points to boring tasks. Good game design changes the task into a meaningful system.',
    example: 'A team challenge is fun because players choose roles, discover better tactics, and need each other to finish.',
    tryIt: 'Add one choice, one feedback signal, and one cooperation moment to your prototype idea.',
    podcastEpisode: {
      moduleNumber: 5,
      participants: ['Gjoko', 'Andrea', 'Loredana'],
      title: '✨ Fun, Motivation, and Learning Through Games | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/KMURX-OC_8U',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/KMURX-OC_8U',
      discussionSummary: [
        'The team opened with the question of what fun means, linking it to emotion, relaxation, confidence, excitement, and welcoming environments. They discussed how people often remember learning experiences more strongly when those experiences create deep emotions. In youth work, they argued, it is better to focus on positive emotions rather than difficult or traumatic ones.',
        'The group debated whether people learn better inside or outside their comfort zone. They agreed that challenge can be useful, but distinguished challenge from difficult emotional pressure. For them, a good game can create a relaxed and inclusive environment while still offering meaningful goals and choices.',
        'They connected motivation to fun, satisfaction, social connection, autonomy, competence, and the desire to keep participating. The discussion also referenced the Magic Circle as a way to help people feel included and safe enough to join the group. Their conclusion was that games become powerful for learning when players feel involved, have some control, connect with others, and discover something about themselves.',
      ],
    },
    flipCards: [
      { front: 'Autonomy', frontHint: 'Players feel they have a real choice, not only one correct answer.', back: 'Autonomy grows when different strategies can work. In board games this can be role choice, route choice, resource choice, or deciding how much risk to take.', prompt: 'Name two strategies in your game. Why could both be valid?' },
      { front: 'Competence', frontHint: 'Players can see progress and understand why they improved.', back: 'Competence needs readable feedback. Players should see what changed because of their action and learn how to do better next round.', prompt: 'What feedback shows improvement: tokens, cards, levels, meters, or group reactions?' },
      { front: 'Belonging', frontHint: 'Players feel seen, useful, and safe in the group.', back: 'Belonging is designed. Give players roles, shared goals, and moments where quieter participants can influence the result without fighting for space.', prompt: 'How does a quiet participant matter in your rules?' },
    ],
    checkpoint: {
      question: 'Which design choice supports motivation?',
      options: ['Clear feedback after an action.', 'Rules that nobody can understand.', 'A winner before the game starts.'],
      answer: 0,
    },
  },
  {
    id: 'mda',
    modelTag: 'Model 5/9',
    title: 'MDA: Mechanics, Dynamics, Aesthetics',
    icon: Puzzle,
    focus: 'MDA helps you design backwards from player experience to rules.',
    model: 'Mechanics -> Dynamics -> Aesthetics',
    rewardBadge: 'MDA Lens Holder',
    learningPromise: 'You will connect board game parts to player behavior and emotions.',
    bullets: [
      'Mechanics are the rules, materials, actions, and limits.',
      'Dynamics are what players do together when rules meet real people.',
      'Aesthetics are the feelings and meanings created by play.',
    ],
    modelSteps: [
      { label: 'Mechanics', text: 'Start with what you can design directly: rules, actions, materials, limits, roles, cards, tokens, boards, timers, and feedback systems.', prompt: 'Which rule, material, or action creates the experience?' },
      { label: 'Dynamics', text: 'Watch what appears when people use the mechanics: negotiation, hiding, helping, rushing, listening, excluding, repairing, bluffing, or cooperating.', prompt: 'What will players actually do with those rules?' },
      { label: 'Aesthetics', text: 'Name the player experience created by those dynamics: empathy, urgency, discovery, cooperation, courage, reflection, tension, hope, or responsibility.', prompt: 'What should players feel and discuss?' },
    ],
    boardGameLens: [
      'Hidden information can create curiosity, mistrust, or empathy depending on the debrief.',
      'Trading can create negotiation and power imbalance.',
      'Cooperative loss can create shared responsibility, if players know why they lost.',
    ],
    youthWorkLens: 'For social topics, aesthetics matter ethically. Do not create shame or helplessness without care and reflection.',
    facilitatorMove: 'Ask playtesters: "What did the rule make you do?" and "How did that feel?"',
    antiPattern: 'Do not pick a mechanic only because it is popular. Pick it because it creates the experience you need.',
    example: 'A hidden-role mechanic can create suspicion. A shared-goal mechanic can create cooperation. The same topic can feel very different.',
    tryIt: 'Pick one mechanic. Predict one player behavior and one feeling it may create.',
    podcastEpisode: {
      moduleNumber: 6,
      participants: ['Cristina', 'Rasim', 'Claudia'],
      title: '🧩 MDA in Game Design: Mechanics, Dynamics, and Aesthetics | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/IK-bXMgyvic',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/IK-bXMgyvic',
      discussionSummary: [
        'The team discussed game design through the MDA framework. They explained mechanics as the rules, materials, roles, timers, and limits that structure a game. Dynamics were described as what happens when players interact with those mechanics, including the ways players interpret, change, or respond to the rules. Aesthetics were presented as the look, atmosphere, characters, world, and overall appeal that attract the right audience.',
        'They used Pac-Man as a simple example: the mechanics include movement, dots, enemies, and progression; the dynamics involve navigating danger and making decisions in the maze; the aesthetics include the recognizable yellow character and ghost enemies.',
        'The group connected MDA to youth work by saying that facilitators and designers should be clear about the experience and learning goal they want young people to reach. They mentioned teamwork, time management, negotiation, and real-life lessons as possible outcomes. Their main point was that games should not be senseless: good design connects mechanics, dynamics, and aesthetics to a specific learning purpose.',
      ],
    },
    flipCards: [
      { front: 'Mechanic', frontHint: 'The rule, object, limit, or action the designer can change.', back: 'Mechanics are concrete: draw a card, trade a token, vote, move, hide information, lose energy, gain trust. They are your design levers.', prompt: 'What one rule can you change to change the whole experience?' },
      { front: 'Dynamic', frontHint: 'The behavior that appears when real players use the rules.', back: 'Dynamics are not fully controlled. Players may cooperate, rush, negotiate, dominate, avoid, laugh, or create shortcuts. Playtesting reveals dynamics.', prompt: 'What behavior do you expect? What behavior would be a warning sign?' },
      { front: 'Aesthetic', frontHint: 'The feeling or meaning players experience during and after play.', back: 'Aesthetics can be empathy, tension, curiosity, urgency, pride, discomfort, hope, or responsibility. Choose the feeling ethically.', prompt: 'What should players feel, and what should they discuss after?' },
    ],
    checkpoint: {
      question: 'In MDA, what are mechanics?',
      options: ['The rules and tools of the game.', 'Only the visual style.', 'Only the final presentation.'],
      answer: 0,
    },
  },
  {
    id: 'core-loop',
    modelTag: 'Model 6/9',
    title: 'Core Loop, Goals, Rules, Feedback',
    icon: IterationCcw,
    focus: 'A playable prototype needs one clear loop that players can repeat, test, and improve.',
    model: 'Goal -> Choice -> Action -> Feedback -> New choice',
    rewardBadge: 'Loop Builder',
    learningPromise: 'You will turn a topic into a repeatable player action, not only a discussion idea.',
    bullets: [
      'The goal tells players what they are trying to do.',
      'Rules create limits and interesting choices.',
      'Feedback tells players if their action changed something.',
    ],
    modelSteps: [
      { label: 'Goal', text: 'The goal gives direction. It can be win, survive, build, repair, discover, or understand.', prompt: 'What is the visible goal?' },
      { label: 'Choice', text: 'A choice is meaningful when options have different costs and consequences.', prompt: 'What are two real options?' },
      { label: 'Action', text: 'Players do something concrete: move, trade, vote, draw, place, ask, give, risk.', prompt: 'What action repeats?' },
      { label: 'Feedback', text: 'The system answers: a token moves, a meter changes, a card appears, trust rises or falls.', prompt: 'What feedback is visible?' },
    ],
    boardGameLens: [
      'Cards are good for dilemmas, events, roles, and prompts.',
      'Tokens are good for resources, emotions, trust, and progress.',
      'A board is good when position matters: distance, access, territory, sequence, or journey.',
    ],
    youthWorkLens: 'A clear loop helps non-native English speakers because players learn by repeating actions, not by reading long rules.',
    facilitatorMove: 'Before adding content, test only the loop for five minutes.',
    antiPattern: 'A game about a topic is not enough. Players need a repeatable action that makes the topic visible.',
    example: 'Draw a dilemma card, discuss two responses, choose one, move the trust meter, then draw the next dilemma.',
    tryIt: 'Write your game loop in one sentence: Players repeatedly ___ so that ___.',
    flipCards: [
      { front: 'Goal', frontHint: 'The visible thing players try to reach, build, protect, or understand.', back: 'A good goal is clear enough to start playing fast. In learning games, success can be winning, surviving, repairing, discovering, or making a good reflection.', prompt: 'What does success look like on the table?' },
      { front: 'Choice', frontHint: 'A decision with tradeoffs, not only a correct answer.', back: 'A meaningful choice has cost. If one option is always best, it is not a real choice. Use time, trust, resources, access, or uncertainty to create tradeoffs.', prompt: 'What makes the choice difficult but fair?' },
      { front: 'Feedback', frontHint: 'The visible answer the game gives after an action.', back: 'Feedback teaches through consequences. A meter changes, a player moves, a card is unlocked, or the group loses trust. Good feedback is fast and understandable.', prompt: 'What changes immediately after a player acts?' },
    ],
    checkpoint: {
      question: 'Why does a core loop matter?',
      options: ['It makes the main action clear.', 'It removes all choices.', 'It makes playtesting unnecessary.'],
      answer: 0,
    },
  },
  {
    id: 'dialogue-and-polarization',
    modelTag: 'Model 7/9',
    title: 'Games for Dialogue and Polarization',
    icon: MessageSquareText,
    focus: 'Games can slow judgement, show systems, and help people practice dialogue before real conflict.',
    model: 'Role + Tension + Safe Debrief',
    rewardBadge: 'Dialogue Game Facilitator',
    learningPromise: 'You will design sensitive games with care, not shock value.',
    bullets: [
      'Roles help players try another perspective without pretending to be an expert.',
      'Tension makes the topic feel real, but it must stay safe enough.',
      'A safe debrief protects people and connects the game to life.',
    ],
    modelSteps: [
      { label: 'Role', text: 'Roles create perspective. Give each role needs, limits, and dignity.', prompt: 'Whose perspective appears?' },
      { label: 'Tension', text: 'Tension creates meaning. Use tradeoffs, limited information, or different goals.', prompt: 'What creates tension?' },
      { label: 'Safety', text: 'Safety comes from clear rules, consent, opt-out options, and careful debrief.', prompt: 'How will you protect players?' },
      { label: 'Debrief', text: 'Debrief turns conflict into learning, not blame.', prompt: 'What question opens reflection?' },
    ],
    boardGameLens: [
      'Perspective cards can show needs without stereotyping people.',
      'Shared meters like trust or tension can make group climate visible.',
      'Private goals are powerful, but use them carefully with sensitive topics.',
    ],
    youthWorkLens: 'The youth worker is responsible for the learning container. The game should invite reflection, not force confession.',
    facilitatorMove: 'Use three debrief levels: What happened? How did it feel? What can we do differently?',
    antiPattern: 'Do not make players act out trauma or stereotypes. Use fictional distance and respectful roles.',
    example: 'Players with different community needs must choose a project plan without letting the trust meter collapse.',
    tryIt: 'Write one debrief question that connects your game to real youth work without blaming players.',
    podcastEpisode: {
      moduleNumber: 8,
      participants: ['Kiril', 'Ognjen', 'Ethan'],
      title: '🗣️ Games for Dialogue and Polarization | Games Are No Joke Arcade Podcast',
      youtubeUrl: 'https://youtu.be/riaVnSLByHI',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/riaVnSLByHI',
      discussionSummary: [
        'The team started from the idea that polarization is increasing and that dialogue can sometimes feel impossible. They asked whether a board game could help with this problem and argued that games can be useful because they slow down judgement. In a real argument, people often react too quickly, while a game introduces rules and steps that make people follow a process before judging each other.',
        'They discussed how games can model real-world problems through trade-offs. A good game can show that gaining one thing may mean losing another, which helps participants understand that social conflicts are not only about asking "why did you do that?" but also about figuring out how people can work together within constraints.',
        'The group also said that role-play and simulation can lower defensiveness. When players enter a character or game situation, they may put their ego aside and stop seeing disagreement as enemy behavior. The episode ends with the importance of reflection: if the game is only play, little changes, but if participants debrief afterwards, the experience can lead to visible progress in dialogue.',
      ],
    },
    flipCards: [
      { front: 'Fictional Distance', frontHint: 'A story frame that explores a real issue indirectly and safely.', back: 'Fictional distance lets players discuss difficult topics without exposing personal stories. Use villages, islands, councils, teams, missions, or future worlds.', prompt: 'What fictional frame protects the group while keeping the topic meaningful?' },
      { front: 'Tradeoff', frontHint: 'A choice where every option has a cost.', back: 'Tradeoffs make social systems visible. For example, speed may reduce inclusion, budget may reduce comfort, and silence may protect peace for a moment but hurt trust later.', prompt: 'What must players sacrifice, and why does it matter?' },
      { front: 'Safe Debrief', frontHint: 'A reflection space with respect, choice, and no forced disclosure.', back: 'A safe debrief starts from the game, not personal confession. Players can speak about roles, systems, and choices before connecting to real life.', prompt: 'How do players exit the game safely and reflect with dignity?' },
    ],
    checkpoint: {
      question: 'What should a social-issue game always include?',
      options: ['A safe reflection moment.', 'Only punishment.', 'No player choices.'],
      answer: 0,
    },
  },
  {
    id: 'prototype',
    modelTag: 'Model 8/9',
    title: 'From Idea to Paper Prototype',
    icon: Gamepad2,
    focus: 'A prototype is a question you can play, not a finished product.',
    model: 'Build small -> Test fast -> Improve',
    rewardBadge: 'Paper Prototype Maker',
    learningPromise: 'You will build a small board or card game that can be tested quickly.',
    bullets: [
      'Use paper, cards, dice, tokens, and simple objects.',
      'Test only the main mechanic first.',
      'Do not protect your idea from feedback.',
    ],
    modelSteps: [
      { label: 'Question', text: 'A prototype tests one question: Does this choice create the learning we want?', prompt: 'What question are you testing?' },
      { label: 'Minimum', text: 'Build only what is needed for one playable round.', prompt: 'What can you remove?' },
      { label: 'Table Test', text: 'Let people play before the design is beautiful.', prompt: 'Who can test in 10 minutes?' },
      { label: 'Change', text: 'Change rules, feedback, or materials based on what players actually did.', prompt: 'What will you observe?' },
    ],
    boardGameLens: [
      'Use index cards before designing full decks.',
      'Use coins, stones, or paper tokens before custom components.',
      'Use handwritten rules. If players cannot understand them, the rule is not ready.',
    ],
    youthWorkLens: 'Paper prototyping fits youth work because it is cheap, inclusive, fast, and easy to co-create.',
    facilitatorMove: 'Ask groups to build a "ugly but playable" version before making visuals.',
    antiPattern: 'Do not spend the first hour decorating. Make the first loop playable first.',
    example: 'Before designing all cards, test five sample cards and one short round with two players.',
    tryIt: 'Create a first version that can be played in ten minutes using only paper and simple tokens.',
    flipCards: [
      { front: 'Ugly First', frontHint: 'A rough prototype is useful because people feel free to change it.', back: 'If the prototype looks too finished, people may be polite instead of honest. Paper, marker, and temporary tokens invite feedback and co-creation.', prompt: 'What can stay ugly today so the group can improve it faster?' },
      { front: 'One Round', frontHint: 'Test one short round before building the full game.', back: 'One round tests the core loop. If the loop is unclear, more cards and more art will not fix it. Make the smallest playable version first.', prompt: 'What is the smallest playable version of your idea?' },
      { front: 'Observe', frontHint: 'Watch what players do before explaining or defending.', back: 'Observation gives evidence. Look for repeated confusion, who speaks, who waits, where energy drops, and which choice creates discussion.', prompt: 'What behavior will you watch during the first playtest?' },
    ],
    checkpoint: {
      question: 'What is the best first prototype?',
      options: ['Small and playable.', 'Beautiful but untested.', 'A long document only.'],
      answer: 0,
    },
  },
  {
    id: 'playtest-youthpass',
    modelTag: 'Model 9/9',
    title: 'Playtesting, Debrief, and YouthPass',
    icon: HeartHandshake,
    focus: 'Playtesting shows what players understand, feel, do, and learn before the final version.',
    model: 'Observe -> Ask -> Change -> Reflect',
    rewardBadge: 'Reflective Playtester',
    learningPromise: 'You will use playtesting and debriefing to improve learning, not only fix rules.',
    bullets: [
      'Watch what players do before explaining too much.',
      'Ask what was clear, fun, unfair, confusing, or meaningful.',
      'Connect learning to YouthPass competences and future work.',
    ],
    modelSteps: [
      { label: 'Observe', text: 'Look for confusion, boredom, exclusion, dominant players, and unexpected strategies.', prompt: 'What will you watch silently?' },
      { label: 'Ask', text: 'Ask players what they noticed before telling them what you intended.', prompt: 'What is your first question?' },
      { label: 'Change', text: 'Fix the system: rules, feedback, player roles, timing, materials.', prompt: 'What can you change fast?' },
      { label: 'Reflect', text: 'Connect the play experience to YouthPass-style learning and future action.', prompt: 'What competence can be named?' },
    ],
    boardGameLens: [
      'If players ask the same question twice, rewrite the rule.',
      'If one player dominates, change turn structure or roles.',
      'If learning appears only in the debrief, put more meaning into the mechanic.',
    ],
    youthWorkLens: 'Debriefing is facilitated reflection. It helps players name learning, confidence, cooperation, and next steps.',
    facilitatorMove: 'Use "I noticed..." instead of "You did wrong..." when giving feedback.',
    antiPattern: 'Do not defend every rule. A playtest is evidence, not an attack.',
    example: 'If players ignore your learning message, change the mechanic, not only the speech after the game.',
    tryIt: 'Write three playtest questions: one about rules, one about feelings, one about learning.',
    flipCards: [
      { front: 'Rule Clarity', frontHint: 'A rule is clear when players can use it without the designer explaining.', back: 'If players ask the same question twice, the rule needs redesign. Rewrite with fewer words, add an example, or make the component itself clearer.', prompt: 'Which rule may confuse players, and how can the table explain it?' },
      { front: 'Learning Evidence', frontHint: 'Evidence is what players say, do, change, or notice after play.', back: 'Do not ask only "Was it fun?" Ask what players noticed, what changed, what felt unfair, and what they would do differently next time.', prompt: 'What evidence will you collect: words, actions, choices, or emotions?' },
      { front: 'YouthPass Link', frontHint: 'Players name what they practiced and how it can help them later.', back: 'YouthPass reflection works when players can name skills: cooperation, communication, learning to learn, initiative, cultural awareness, or civic action.', prompt: 'Which competence can your game support, and how will players name it?' },
    ],
    checkpoint: {
      question: 'What should you do after a playtest?',
      options: ['Use feedback to improve the next version.', 'Defend every rule.', 'Stop testing forever.'],
      answer: 0,
    },
  },
];

export const lessons = baseLessons.map((lesson, index) => ({
  ...lesson,
  modelTag: `Model ${index + 1}/${baseLessons.length}`,
  definition: lesson.definition ?? lesson.focus,
  whyItMatters: lesson.whyItMatters ?? lesson.learningPromise,
  trainerBackup: lesson.trainerBackup ?? 'Use this model as a short trainer note before group work or playtesting.',
  boardGamePattern: lesson.boardGamePattern ?? lesson.boardGameLens[0],
  sources: lesson.sources ?? ['Training synthesis from game-based learning, MDA, youth work, board-game design, and debriefing practice'],
  cardDeck: lesson.flipCards.map((card, cardIndex) => ({
    ...card,
    category: ['Definition Card', 'Design Lens', 'Youth Work Lens', 'Facilitator Move', 'Prototype Task', 'Debrief Question'][cardIndex] ?? 'Theory Card',
  })),
}));

export const prototypeSteps = [
  { id: 'gameTitle', label: 'Game Title', prompt: 'What is the title of the board game prototype?', icon: CircleHelp },
  { id: 'players', label: 'Players', prompt: 'How many players can play? Include minimum and maximum if useful.', icon: Users },
  { id: 'duration', label: 'Duration', prompt: 'How long does one play session take?', icon: CircleHelp },
  { id: 'materials', label: 'Materials', prompt: 'What physical materials, cards, dice, boards, or tokens are needed?', icon: Puzzle },
  { id: 'goal', label: 'Goal', prompt: 'What is the main objective of the game?', icon: Target },
  { id: 'coreAction', label: 'Core Action', prompt: 'What repeated action do players perform most often?', icon: IterationCcw },
  { id: 'mainRule', label: 'Main Rule', prompt: 'What rule makes the game meaningful or challenging?', icon: Gamepad2 },
  { id: 'mainTradeoff', label: 'Main Tradeoff', prompt: 'What difficult choice or tension should players feel?', icon: Brain },
  { id: 'executiveSummary', label: 'Executive Summary', prompt: 'Explain the basic idea of the game in a few clear sentences.', icon: MessageSquareText },
  { id: 'experiencePillars', label: 'Experience Pillars', prompt: 'What should players feel, do, or discover during the game?', icon: Sparkles },
  { id: 'targetAudience', label: 'Target Audience', prompt: 'Who is the game for, primarily?', icon: Users },
  { id: 'platforms', label: 'Platform(s)', prompt: 'What kind of board, cards, tokens, or physical pieces will players use?', icon: Puzzle },
  { id: 'gameplayMechanics', label: 'Gameplay Mechanics', prompt: 'What actions, systems, turns, cards, or resources make the game work?', icon: IterationCcw },
  { id: 'playerGoals', label: 'Goals of the Player', prompt: 'How do players win, progress, or understand success?', icon: Target },
  { id: 'obstacles', label: 'Obstacles Blocking Goals', prompt: 'What blocks players: other players, NPCs, resources, time, rules, or the world?', icon: Gamepad2 },
  { id: 'interface', label: 'Interface', prompt: 'What does the player use or see when taking action?', icon: Puzzle },
  { id: 'setup', label: 'Setup', prompt: 'How do players prepare the table before the game starts?', icon: ClipboardList },
  { id: 'repeatedPlayerAction', label: 'Repeated Player Action', prompt: 'What does a normal turn or repeated loop look like?', icon: IterationCcw },
  { id: 'feedback', label: 'Feedback', prompt: 'How does the game show players whether their action worked?', icon: MessageSquareText },
  { id: 'endOfRound', label: 'End of Round', prompt: 'How does a round end, reset, or move to the next cycle?', icon: RotateCcw },
  { id: 'mainComponents', label: 'Main Components', prompt: 'List the main board-game components and what they do.', icon: Puzzle },
  { id: 'conceptDrawingTable', label: 'Concept Drawing - Table View', prompt: 'Describe the board or table setup drawing.', icon: ClipboardList },
  { id: 'conceptDrawingMoment', label: 'Concept Drawing - Key Moment', prompt: 'Describe the most important gameplay moment drawing.', icon: Sparkles },
  { id: 'cards', label: 'Cards', prompt: 'What cards exist and what job do they do?', icon: ClipboardList },
  { id: 'tokens', label: 'Tokens', prompt: 'What tokens exist and what do they represent?', icon: CircleHelp },
  { id: 'boardOrMap', label: 'Board or Map', prompt: 'What board, map, or shared play space does the game use?', icon: Target },
  { id: 'roles', label: 'Roles', prompt: 'What player roles, character roles, or team roles exist?', icon: Users },
  { id: 'resources', label: 'Resources', prompt: 'What resources do players gain, spend, trade, or protect?', icon: Sparkles },
  { id: 'settingGenre', label: 'Setting and Genre', prompt: 'When and where does the game take place? What is the genre?', icon: CircleHelp },
  { id: 'storyFrame', label: 'Story Frame', prompt: 'What simple story helps players enter the game world?', icon: MessageSquareText },
  { id: 'fieldResearchInspiration', label: 'Field Research Inspiration', prompt: 'What real observation, place, or research inspired the game?', icon: Brain },
  { id: 'fictionalSafety', label: 'Fictional Distance and Safety', prompt: 'What frame protects players when the topic is sensitive?', icon: HeartHandshake },
  { id: 'places', label: 'Places & Points of Interest', prompt: 'Which places from the field research become spaces on the board?', icon: Target },
  { id: 'localStories', label: 'Local Stories / Legends', prompt: 'Which local stories, culture, or traditions become event cards or missions?', icon: MessageSquareText },
  { id: 'npcs', label: 'Main Characters & NPCs', prompt: 'Who are the important characters, roles, or NPCs?', icon: Users },
  { id: 'hiddenElements', label: 'Elements & Hidden Features', prompt: 'What secrets, resources, missions, risks, or hidden mechanics did the field research inspire?', icon: Sparkles },
  { id: 'learningGoal', label: 'Learning Goal', prompt: 'What should players understand or practice?', icon: HeartHandshake },
  { id: 'youthWorkLink', label: 'Youth Work Link', prompt: 'How does the game connect to youth work values or competences?', icon: HeartHandshake },
  { id: 'debriefQuestion', label: 'Debrief Question', prompt: 'What question will connect the game to real life?', icon: HeartHandshake },
  { id: 'debriefQuestions', label: 'Debrief Questions', prompt: 'Write the full set of debrief questions.', icon: MessageSquareText },
  { id: 'youthPassCompetences', label: 'YouthPass Competences', prompt: 'Which YouthPass competences can players name after the game?', icon: HeartHandshake },
  { id: 'nextThingToTest', label: 'Next Thing to Test', prompt: 'What is the next playtest question or design risk to check?', icon: Gamepad2 },
  { id: 'playtestPlan', label: 'Playtest Plan', prompt: 'Who will test it, and what feedback will you collect?', icon: Gamepad2 },
];

export const gameCatalog = [
  {
    id: 'castle-rush',
    title: 'Castle Rush',
    subtitle: "Don't Be Late!",
    path: '/arcade/castle-rush',
    inspiration: 'Pac-Man style chase games, fair level design, Erasmus+ training life, and Italian castle venues',
    mechanic: 'Navigate hand-authored castle routes with predictable clocks, checkpoints, and useful pickups.',
    learningGoal: 'Feel how fair routes, readable pressure, recovery space, and pickups make challenge meaningful.',
    takeaway: 'Readable enemies, checkpoints, and useful tools make pressure fair and teach through movement.',
    prototypePrompt: 'Clear goal + fair pressure + recovery space = stronger player motivation.',
    duration: '5-10 min',
    difficulty: 'Starter',
    color: 'text-pink-500',
    borderClass: 'arcade-border-pink',
  },
  {
    id: 'youthpass-drop',
    title: 'YouthPass Drop',
    subtitle: 'Drink Water, Catch the Certificate',
    path: '/arcade/youthpass-drop',
    inspiration: 'Vertical arcade catch games, resource management, youth exchange daily-life choices',
    mechanic: 'Move left and right to catch helpful resources, avoid risky drops, and survive each training day.',
    learningGoal: 'Feel how meters, tradeoffs, delayed cost, and feedback can teach healthy choices through play.',
    takeaway: 'Meters are not just scores. They show consequences players can feel.',
    prototypePrompt: 'Clear resources + visible consequences = choices players can understand and discuss.',
    duration: '5-8 min',
    difficulty: 'Starter',
    color: 'text-cyan-400',
    borderClass: 'arcade-border',
  },
  {
    id: 'filadelfia-story',
    title: 'Filadelfia Story',
    subtitle: 'Choices, Consequences, Endings',
    path: '/arcade/filadelfia-story',
    inspiration: 'Narrative adventure games, Erasmus+ group work, debrief logic, and social-impact design',
    mechanic: 'Play through a dramatic story scene by scene, using inclusive choices that change meters, hidden flags, and endings.',
    learningGoal: 'Understand how choices, facilitation, flags, meters, and consequences can make learning visible.',
    takeaway: 'Choices, hidden logic, inclusive facilitation, and consequences can make learning visible.',
    prototypePrompt: 'Branching choices + visible consequences = better debrief and stronger learning.',
    duration: '6-10 min',
    difficulty: 'Story',
    color: 'text-green-400',
    borderClass: 'arcade-border-green',
  },
  {
    id: 'future-exchange',
    title: 'Future Exchange',
    subtitle: 'Build a KA152 Youth Exchange',
    path: '/arcade/future-exchange',
    inspiration: 'Crafting games, cooperative board games, resource economies, and Erasmus+ KA152 youth exchanges',
    mechanic: 'Collect, craft, trade, and assemble project resources before the exchange launch.',
    learningGoal: 'Feel how youth exchanges are built from tools, relationships, care, learning, logistics, and shared responsibility.',
    takeaway: 'A project is not only paperwork. It is a living system of tools, relationships, care, learning, and tradeoffs.',
    prototypePrompt: 'Players collect, craft, trade, and install resources to build a KA152 Youth Exchange.',
    duration: '6-10 min',
    difficulty: 'Co-op',
    color: 'text-yellow-300',
    borderClass: 'arcade-border',
  },
];
