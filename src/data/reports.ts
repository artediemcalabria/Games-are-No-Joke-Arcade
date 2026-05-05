export interface ProjectReportActivity {
  title: string;
  timeLabel: string;
  description: string;
  learningFocus: string;
}

export interface ProjectReportResource {
  label: string;
  url: string;
  note: string;
}

export interface ProjectReport {
  id: string;
  title: string;
  date: string;
  headline: string;
  summary: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
  activities: ProjectReportActivity[];
  reflection: string;
  outputs: string[];
  resources?: ProjectReportResource[];
  fieldResearch?: {
    title: string;
    description: string;
    checklist: string[];
    categories: Array<{ title: string; prompt: string }>;
  };
}

export const projectReports: ProjectReport[] = [
  {
    id: 'day-1-2026-04-29',
    title: 'Day 1',
    date: '29/04/2026',
    headline: 'Opening the group through play, names, roles, hopes, and first teamwork.',
    summary:
      'The first day of Games Are No Joke helped participants become comfortable with each other through energizers, name games, personal badges, reflection tools, debate, and team problem solving.',
    videoUrl: 'https://www.youtube.com/watch?v=7-8FiSAJ0fg',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/7-8FiSAJ0fg',
    activities: [
      {
        title: 'Walk Theatre',
        timeLabel: 'Morning energizer',
        description:
          'Participants walked through the room and followed facilitator instructions: say only your name, then name and passion, then act as if you already know the other person.',
        learningFocus: 'Ice-breaking, trust, body activation, and safe first contact.',
      },
      {
        title: 'NPC Movement',
        timeLabel: 'Name learning',
        description:
          'Each participant said their name and created a movement inspired by non-player characters. The group repeated the names and movements together.',
        learningFocus: 'Memory, expression, playful identity, and embodied learning.',
      },
      {
        title: 'Personal Badges and Brasilena Break',
        timeLabel: 'Group identity',
        description:
          'Participants created badges with real names and nicknames. During the break, Arte Diem Calabria offered Brasilena as a local informal social moment.',
        learningFocus: 'Belonging, local culture, and informal connection.',
      },
      {
        title: 'Clock Date',
        timeLabel: 'Peer encounters',
        description:
          'Participants met through scheduled short encounters and used visual cards to answer reflective statements.',
        learningFocus: 'Communication, reflection, and deeper interpersonal connection.',
      },
      {
        title: 'Personal Envelopes',
        timeLabel: 'Creative reflection setup',
        description:
          'Participants took a creative selfie with a place or object and used it to create a personal envelope for future comments and feedback.',
        learningFocus: 'Creativity, feedback culture, and personal reflection.',
      },
      {
        title: 'Board Games Debate',
        timeLabel: 'Afternoon discussion',
        description:
          'A French youth worker facilitated a debate about the impact of board games on everyday life and the role of games beyond entertainment.',
        learningFocus: 'Critical thinking, argumentation, and game literacy.',
      },
      {
        title: 'Hope, Fear and Contributions',
        timeLabel: 'Group expectations',
        description:
          'Participants shared expectations, concerns, and contributions they could bring to the training course.',
        learningFocus: 'Shared responsibility and group needs.',
      },
      {
        title: 'Family Chart',
        timeLabel: 'Symbolic group roles',
        description:
          'Participants explored roles inside a national family structure, reflecting on responsibility, group identity, and relationships.',
        learningFocus: 'Roles, symbolic thinking, and team dynamics.',
      },
      {
        title: 'Hidden Object Team Challenge',
        timeLabel: 'Closing activity',
        description:
          'Four teams hid an object and created two clues for others to find it, then reflected on teamwork, communication, and possible improvements.',
        learningFocus: 'Problem solving, cooperation, feedback, and design iteration.',
      },
    ],
    reflection:
      'The group felt the day was interactive and engaging. The variety of activities helped build trust, improve communication, and balance fun with reflection.',
    outputs: [
      'Personal badges and nicknames',
      'Personal feedback envelopes',
      'Group hopes, fears, and contributions',
      'First shared reflection on teamwork and improvement',
    ],
  },
  {
    id: 'day-2-2026-04-30',
    title: 'Day 2',
    date: '30/04/2026',
    headline: 'Field research in Filadelfia, first board game concepts, debate, feedback, and intercultural night.',
    summary:
      'The second day connected the city of Filadelfia to game design. Participants collected local material, presented first ideas, discussed learning and radicalization of ideas, and opened intercultural nights with Turkey and Italy.',
    videoUrl: 'https://youtu.be/lW8phYP1uyo',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/lW8phYP1uyo',
    activities: [
      {
        title: 'Shoot the Name',
        timeLabel: 'Morning energizer',
        description:
          'A French energizer reinforced names, attention, group reaction, and playful team-building.',
        learningFocus: 'Memory, energy, and interaction through simple rules.',
      },
      {
        title: 'Training T-Shirts',
        timeLabel: 'Group identity',
        description:
          'Arte Diem Calabria distributed T-shirts with the association identity and Erasmus+ logos.',
        learningFocus: 'Belonging, shared identity, and project visibility.',
      },
      {
        title: 'Field Design & Field Research',
        timeLabel: 'Main morning activity',
        description:
          'Participants explored Filadelfia to identify places, local stories, NPCs, missions, obstacles, resources, and route ideas for board game concepts.',
        learningFocus: 'Observation, research, world-building, local culture, and game design material collection.',
      },
      {
        title: 'Follow the Leader',
        timeLabel: 'Afternoon energizer',
        description:
          'The French group facilitated an energizer to transition the group into afternoon presentations.',
        learningFocus: 'Energy management and group focus.',
      },
      {
        title: 'Field Research Presentations',
        timeLabel: 'Public speaking',
        description:
          'Participants presented concepts developed from the morning field activity and received initial impressions from the group.',
        learningFocus: 'Communication, idea framing, and constructive feedback.',
      },
      {
        title: 'Games, Learning, and Social Development Workshop',
        timeLabel: 'Afternoon workshop',
        description:
          'A Macedonian youth worker facilitated a workshop on why games are important in learning and social development, including structured debates on radicalization of ideas.',
        learningFocus: 'Critical thinking, argumentation, and social-impact game reflection.',
      },
      {
        title: 'National Group Feedback',
        timeLabel: 'Evaluation moment',
        description:
          'One representative from each country collected feedback from national groups about feelings, needs, suggestions, and the overall experience.',
        learningFocus: 'Care, monitoring, inclusion, and participatory evaluation.',
      },
      {
        title: 'Turkey and Italy Intercultural Night',
        timeLabel: 'Evening activity',
        description:
          'The intercultural nights started with Turkey and Italy through quizzes, traditional dances, videos, and cultural sharing.',
        learningFocus: 'Intercultural learning, emotion, identity, and group connection.',
      },
    ],
    fieldResearch: {
      title: 'Filadelfia: Game Design Field Research',
      description:
        'Teams walked around Filadelfia as game designers. They collected real local details that could become board spaces, cards, missions, NPCs, obstacles, resources, secrets, and routes.',
      checklist: [
        '5 places or points of interest',
        '2 local stories or cultural elements',
        '3 NPC or local character profiles',
        '3 missions, obstacles, or resources',
        '1 game board idea and 1 marked route',
      ],
      categories: [
        { title: 'Places and Points of Interest', prompt: 'Find squares, streets, churches, shops, hidden corners, vibe, and game-space potential.' },
        { title: 'History and Culture', prompt: 'Collect legends, traditions, food, sayings, stories, and possible card or mission roles.' },
        { title: 'NPCs and Local Characters', prompt: 'Observe local roles, personality, quotes, and possible game functions.' },
        { title: 'Hidden Game Elements', prompt: 'Search for obstacles, resources, secrets, risk zones, shortcuts, and player decisions.' },
      ],
    },
    reflection:
      'The day was dynamic and meaningful. It combined creativity, field research, public speaking, critical thinking, collaboration, feedback, and intercultural exchange.',
    outputs: [
      'Field research notes from Filadelfia',
      'First board game concept presentations',
      'Simplified GDD template for team prototypes',
      'National group feedback notes',
      'Intercultural night learning moments',
    ],
    resources: [
      {
        label: 'Field Research Activity Doc',
        url: 'https://docs.google.com/document/d/1XUg3CQIAC1UoFzNxHz4HPP3PUQ6Jp56B8kvPE9_4zCU/edit?usp=sharing',
        note: 'Activity guide for collecting game design material in Filadelfia.',
      },
      {
        label: 'Simplified GDD Template / Import Source',
        url: 'https://docs.google.com/document/d/1rCrBHvfcVFzkJlVsiCOvp8XmO3v8KnzOMYQws6BpYFY/edit?usp=drive_link',
        note: 'Template headings for the simplified Game Design Document. Paste filled team content into Prototype Lab to import it.',
      },
    ],
  },
  {
    id: 'day-3-2026-05-01',
    title: 'Day 3',
    date: '01/05/2026',
    headline: 'From simple rules to game design theory, podcast creation, feedback, and intercultural exchange.',
    summary:
      'The third day balanced energetic group activities, practical game experimentation, and theoretical input. Participants explored how simple rules can change a game, learned the MDA framework, recorded podcasts about games and learning, and ended the day with reflection and intercultural evenings from Romania and Bulgaria.',
    videoUrl: 'https://youtu.be/UObXy8i8ONc',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/UObXy8i8ONc',
    activities: [
      {
        title: 'Mix Sound',
        timeLabel: 'Morning energizer',
        description:
          'The Romanian team opened the day with an energizer where each national group created a homemade sound. The sounds were then combined into one shared rhythm.',
        learningFocus: 'Creativity, listening, collaboration, rhythm, and group cohesion.',
      },
      {
        title: 'Macedonia Jump',
        timeLabel: 'Reaction game',
        description:
          'Participants played a movement game where each fruit represented a different action, such as jumping or turning around. The group had to react quickly and stay focused.',
        learningFocus: 'Attention, coordination, memory, and fast reaction to rules.',
      },
      {
        title: 'Tic Tac Tor',
        timeLabel: 'Game mechanics workshop',
        description:
          'The group explored a variation of tic-tac-toe in three phases: first learning the rules, then trying the game, and finally changing the rules to create new versions.',
        learningFocus: 'Game structure, experimentation, rule changes, critical thinking, and iterative design.',
      },
      {
        title: 'Just Dance Energizer',
        timeLabel: 'After lunch',
        description:
          'The Romanian team led a dance-based energizer. One participant guided the movements while the others followed, combining stretching, music, and play.',
        learningFocus: 'Energy management, body activation, confidence, and shared rhythm.',
      },
      {
        title: 'MDA Framework',
        timeLabel: 'Design theory',
        description:
          'Participants were introduced to Mechanics, Dynamics, and Aesthetics. They discussed how rules create player behavior and how player behavior creates emotions and experience.',
        learningFocus: 'Mechanics, player interaction, emotional experience, and meaningful game design.',
      },
      {
        title: 'Podcast Recording',
        timeLabel: 'Group production',
        description:
          'Participants worked in seven groups to prepare and record short podcasts on the question: Why do games matter for learning and social development?',
        learningFocus: 'Public speaking, teamwork, argument building, media production, and youth-work reflection.',
      },
      {
        title: 'Podcast Feedback',
        timeLabel: 'Communication practice',
        description:
          'After recording, the group reflected on the podcasts and received feedback about clarity, structure, confidence, and communication style.',
        learningFocus: 'Feedback culture, communication skills, self-awareness, and improvement.',
      },
      {
        title: 'Reflection with One Word, UNO, and Number Cards',
        timeLabel: 'Before dinner',
        description:
          'Participants described the day with one word, then used UNO cards and a Turkish board game with numbers from 1 to 10 to evaluate the experience.',
        learningFocus: 'Reflection, emotional check-in, evaluation, and simple visual feedback tools.',
      },
      {
        title: 'Romanian and Bulgarian Intercultural Evening',
        timeLabel: 'Evening activity',
        description:
          'The evening included cultural presentations, traditional dances, games, quizzes, and informal sharing from Romania and Bulgaria.',
        learningFocus: 'Intercultural learning, group connection, curiosity, and celebration of different backgrounds.',
      },
    ],
    reflection:
      'The day connected movement, design theory, production, and reflection. Participants saw how a game can change when its rules change, and how games can support learning, communication, and social development.',
    outputs: [
      'New game variations based on tic-tac-toe',
      'Shared understanding of the MDA framework',
      'Seven group podcasts about games, learning, and social development',
      'Communication feedback from the podcast session',
      'Daily reflection through words, cards, and number-based evaluation',
      'Intercultural learning from Romania and Bulgaria',
    ],
  },
  {
    id: 'day-4-2026-05-02',
    title: 'Day 4',
    date: '02/05/2026',
    headline: 'Team formation, educational board game development, communication energizers, and emotional group reflection.',
    summary:
      'The fourth day focused on collaborative creation. Participants formed working groups, chose social and educational themes, learned the stages of developing a board game, and moved their ideas from abstract concepts toward concrete prototypes ready for playtesting.',
    videoUrl: 'https://youtu.be/cZGui4he78Y',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/cZGui4he78Y',
    activities: [
      {
        title: 'Hi, Ha, Ho and Movement Positions',
        timeLabel: 'Morning warm-up',
        description:
          'The day began with interactive warm-up games, including Hi, Ha, Ho and movement commands such as left, right, up, down, monkey, and penguin variations.',
        learningFocus: 'Energy, attention, non-verbal coordination, reaction speed, and group synchronization.',
      },
      {
        title: 'Team Formation and Theme Choice',
        timeLabel: 'Project setup',
        description:
          'Participants divided into four working groups. Each group chose its theme, confirmed members, and documented the team with a group photo. The structure stayed flexible so people could still move if needed.',
        learningFocus: 'Team choice, ownership, flexibility, and collaborative project setup.',
      },
      {
        title: 'Board Game Development Stages',
        timeLabel: 'Design framework',
        description:
          'Participants were introduced to the main stages of board game development: idea, paper concept, playtest prototype, refined prototype, playtested MVP, production files, manufactured product, and teaching-ready launch.',
        learningFocus: 'Design process, production thinking, prototyping, playtesting, and educational use.',
      },
      {
        title: 'Theme to Mechanics',
        timeLabel: 'Group work',
        description:
          'Teams started transforming themes such as dialogue and empathy, personal development, creativity, inclusion, mental health, decision-making, risk-taking, and climate anxiety into playable ideas.',
        learningFocus: 'Social-impact design, player goals, mechanics, meaningful interaction, and learning outcomes.',
      },
      {
        title: 'Telephone Game Variation',
        timeLabel: 'Communication energizer',
        description:
          'Participants sat in two rows and passed a Serbian word from person to person. The final version often changed, showing how information can shift as it moves through a group.',
        learningFocus: 'Communication, distortion, listening, language barriers, and group awareness.',
      },
      {
        title: 'Hand-Signal Squeeze Game',
        timeLabel: 'Team coordination',
        description:
          'Participants held hands and passed a squeeze from one end of the line to the other. Teams worked on speed, accuracy, and quiet coordination.',
        learningFocus: 'Non-verbal communication, cooperation, focus, and shared timing.',
      },
      {
        title: 'Chair and Music Reaction Game',
        timeLabel: 'Movement break',
        description:
          'A music-based chair activity helped the group reset energy. Participants had to react quickly and find a seat when the music stopped.',
        learningFocus: 'Alertness, movement, fast decisions, and playful pressure.',
      },
      {
        title: 'Prototype Development and Team Updates',
        timeLabel: 'Afternoon workshop',
        description:
          'Teams continued developing their educational board games, focusing on social issues, core mechanics, player experience, and the first playable version. Each team then shared a short update.',
        learningFocus: 'Iteration, idea clarification, teamwork, public explanation, and preparation for playtesting.',
      },
      {
        title: 'The Hug Game',
        timeLabel: 'Closing reflection',
        description:
          'The session ended with an emotional group activity. Participants responded to prompts by hugging people they connected with, wanted to know better, or shared something with.',
        learningFocus: 'Empathy, connection, emotional reflection, care, and trust inside the group.',
      },
      {
        title: 'Macedonian and Serbian Intercultural Evening',
        timeLabel: 'Evening activity',
        description:
          'The evening continued the intercultural programme with presentations and cultural sharing from Macedonia and Serbia.',
        learningFocus: 'Intercultural exchange, identity, curiosity, and informal group bonding.',
      },
    ],
    reflection:
      'The day helped participants move from ideas toward playable educational games. It also showed that game design is not only technical: it needs trust, communication, flexibility, and care inside the team.',
    outputs: [
      'Four working groups with chosen themes',
      'Group photos and team composition',
      'First structured educational board game concepts',
      'Clearer player goals, mechanics, and learning intentions',
      'Short team updates before the next playtesting phase',
      'Emotional reflection through the Hug Game',
    ],
  },
  {
    id: 'day-5-2026-05-03',
    title: 'Day 5',
    date: '03/05/2026',
    headline: 'Prototype refinement, peer playtesting, feedback, final adjustments, and French cultural night.',
    summary:
      'The fifth day moved the teams from concept to playable prototype. The morning built energy and focus, then teams refined their games before the playtesting phase. In the afternoon, participants tested each other\'s board games, presented their design logic, collected feedback, and improved the clarity of rules, mechanics, and learning goals.',
    videoUrl: 'https://youtu.be/aRHUafAQK0k',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/aRHUafAQK0k',
    activities: [
      {
        title: 'The Invisible Bunny',
        timeLabel: 'Morning energizer',
        description:
          'The day started with a creative energizer. Participants first imagined an invisible bunny and acted with it individually, then repeated similar actions with their neighbours, turning a small imagination task into a shared comic moment.',
        learningFocus: 'Imagination, body expression, playfulness, attention to others, and group bonding.',
      },
      {
        title: 'Toxic Relationship',
        timeLabel: 'Group dynamics exercise',
        description:
          'The second energizer used movement to explore resistance, pressure, and escape. The activity raised the energy in the room and prepared participants for a focused working morning.',
        learningFocus: 'Physical activation, boundaries, group dynamics, pressure, and quick decision-making.',
      },
      {
        title: 'Prototype Refinement',
        timeLabel: 'Morning development',
        description:
          'Teams returned to the games they had started the previous day. They checked whether the basic rules worked, clarified the main goal, adjusted components, and tried to make the gameplay loop easier to understand.',
        learningFocus: 'Iteration, rule clarity, core loop design, component testing, and practical teamwork.',
      },
      {
        title: 'Product Conclusion Meeting',
        timeLabel: 'Before lunch',
        description:
          'Before lunch, the group paused to confirm that each team had a functional version ready for peer testing. This helped teams move from discussion to a real playable prototype.',
        learningFocus: 'Milestone setting, production focus, decision-making, and readiness for playtesting.',
      },
      {
        title: 'Cross-Testing',
        timeLabel: 'Afternoon playtest',
        description:
          'Teams played each other\'s board games. This gave every group a fresh view of how players understood the rules, what felt engaging, and where confusion appeared.',
        learningFocus: 'User experience, peer review, observation, testing with real players, and feedback collection.',
      },
      {
        title: 'Game Presentations',
        timeLabel: 'Design explanation',
        description:
          'Each group explained the logic of its game, the theme behind it, the intended player experience, and the educational impact it wanted to create.',
        learningFocus: 'Communication, design reasoning, learning outcomes, and clear presentation of a prototype.',
      },
      {
        title: 'Reflection and Final Adjustments',
        timeLabel: 'Feedback workshop',
        description:
          'After the playtests, teams discussed what worked and what needed to change. They used the feedback to adjust rules, simplify unclear parts, and strengthen the connection between gameplay and learning goals.',
        learningFocus: 'Constructive feedback, critical reflection, revision, clarity, and educational coherence.',
      },
      {
        title: 'French Cultural Night',
        timeLabel: 'Evening activity',
        description:
          'The day ended with the French cultural night. The French participants shared cultural elements through food, music, presentations, and informal conversation, creating a relaxed space after an intense prototype day.',
        learningFocus: 'Intercultural learning, informal networking, celebration, and stronger relationships between partners.',
      },
    ],
    reflection:
      'Day 5 was an important shift from designing in theory to testing with real people. Participants could see where their games were strong and where players needed more support. The feedback helped teams make their games clearer, more playable, and more connected to their educational purpose.',
    outputs: [
      'Functional board game prototypes ready for peer testing',
      'Cross-testing feedback from other teams',
      'Short presentations of game logic, design choices, and intended impact',
      'Rule and mechanic adjustments after playtesting',
      'Clearer links between gameplay and learning goals',
      'French cultural night moments and informal partner connection',
    ],
  },
];
