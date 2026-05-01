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
];
