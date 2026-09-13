/**
 * The letters the atelier writes.
 *
 * Single source of truth for /services, /services/[id], /begin and the
 * request context. Every line of copy here is original to this site.
 */

export type Service = {
  id: string;
  name: string;
  /** one line, shown on the card */
  tagline: string;
  /** typewriter-DNA microlabel */
  sessionNote: string;
  /** who this letter is for — 2 sentences, plain voice */
  who: string;
  /** what the doll will ask — three original questions, her voice */
  questions: [string, string, string];
  /** an original excerpt, written line by line on the detail page */
  excerpt: string[];
  /** the envelope's two-tone plate */
  plate: { from: string; to: string };
  /** the wax dot on the envelope */
  seal: string;
  /** ids of related letters */
  related: string[];
};

export const SERVICES: Service[] = [
  {
    id: "gratitude",
    name: "Letter of Gratitude",
    tagline: "For someone you never properly thanked.",
    sessionNote: "~15-minute conversation",
    who: "For the teacher, the neighbour, the friend who did the quiet thing and never asked to be noticed for it. Often the person has no idea they are owed anything at all.",
    questions: [
      "What did they do that you are still carrying?",
      "Where were you standing when you understood it mattered?",
      "What have you said about them to other people, but never to them?",
    ],
    excerpt: [
      "You will not remember the afternoon I mean.",
      "You handed me the spare key and said, without ceremony, that the door would open for me whenever it needed to.",
      "I have thought about that sentence for eleven years.",
    ],
    plate: { from: "#E8B15C", to: "#A98B4F" },
    seal: "#9B3A44",
    related: ["reconciliation", "confession"],
  },
  {
    id: "reconciliation",
    name: "Letter of Reconciliation",
    tagline: "For the relationship you want to mend.",
    sessionNote: "~20-minute conversation",
    who: "For the argument that hardened, the silence that outlasted its reason, the person you still set a place for out of habit. This letter does not assign fault; it opens a door and leaves it open.",
    questions: [
      "What is the smallest true thing you could say first?",
      "What would you take back, if taking back were permitted?",
      "What do you want to still be possible between you?",
    ],
    excerpt: [
      "I am not writing to settle who was right.",
      "I stopped keeping that ledger some time ago, and I find I do not miss it.",
      "I am writing because the chair on your side of the table has been empty for two years, and I would like — if you are willing — to hear it moved.",
    ],
    plate: { from: "#9B3A44", to: "#28324F" },
    seal: "#E8B15C",
    related: ["gratitude", "farewell"],
  },
  {
    id: "future",
    name: "Letter to the Future",
    tagline: "To your future self — or to a child, sealed for years.",
    sessionNote: "~15-minute conversation",
    who: "For the version of you who will exist after the decision is made, or for a child who is not yet old enough to be told. It is a letter written across time, so it is written plainly.",
    questions: [
      "What do you want them to know you were like, right now?",
      "What are you afraid you will have forgotten by then?",
      "What would you like to be forgiven for, in advance?",
    ],
    excerpt: [
      "By the time you read this you will have made the decision I am currently losing sleep over, and you will find my worry quaint.",
      "Be gentle about that.",
      "I am doing the best I can with what I can see from here.",
    ],
    plate: { from: "#7C86D8", to: "#28324F" },
    seal: "#E8B15C",
    related: ["gratitude", "confession"],
  },
  {
    id: "farewell",
    name: "Farewell Letter",
    tagline: "To say goodbye the way it deserved.",
    sessionNote: "~20-minute conversation",
    who: "For the leaving that happened too quickly, or the one still ahead of you. Written for someone departing, someone already gone, or a chapter that closed without being marked.",
    questions: [
      "What was the last ordinary thing you did together?",
      "What did you assume you would have more time to say?",
      "What would you like them to be doing while they read this?",
    ],
    excerpt: [
      "They tell me goodbyes are for the living, and I suppose this one is.",
      "Still, I would like the record to show that you taught me how to hold a pen,",
      "and that I have not held one since without thinking of your hand over mine.",
    ],
    plate: { from: "#28324F", to: "#141B30" },
    seal: "#9B3A44",
    related: ["reconciliation", "future"],
  },
  {
    id: "confession",
    name: "Confession",
    tagline: "For the feeling you cannot say out loud.",
    sessionNote: "~15-minute conversation",
    who: "For the sentence that has been rehearsed in private for years. Whether it is ever sent is entirely your business — some letters do their work simply by existing.",
    questions: [
      "How long have you been carrying this one?",
      "What do you imagine happens after they read it?",
      "Would you rather be understood, or spared?",
    ],
    excerpt: [
      "I have rehearsed this in seventeen kitchens and never once out loud.",
      "So let me put it plainly, while the paper is patient:",
      "I have loved you since the winter you fixed the radiator and insisted it was nothing.",
    ],
    plate: { from: "#9B3A44", to: "#E8B15C" },
    seal: "#F1E9D9",
    related: ["gratitude", "future"],
  },
];

export const getService = (id: string): Service | undefined =>
  SERVICES.find((s) => s.id === id);

export const getRelated = (service: Service): Service[] =>
  service.related
    .map((id) => getService(id))
    .filter((s): s is Service => Boolean(s));
