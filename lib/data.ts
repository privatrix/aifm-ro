// NOTE: Genre is a free-form string (Romanian list lives in lib/palettes.ts).
export type Genre = string;

export interface Song {
  id: number;
  title: string;
  genre: Genre;
  duration: string;
  votes: number;
  gradient: [string, string];
  bpm: number;
  freq: string;
  fileUrl?: string | null;
}

export interface VioNote {
  from: string;
  text: string;
  reply: string | null;
  time: string;
}

export const SONGS: Song[] = [
  { id: 1,  title: "Noaptea în Chișinău",       genre: "Ambient",   duration: "3:42", votes: 247, gradient: ["#E91E8C", "#C2185B"], bpm: 85,  freq: "88.3"  },
  { id: 2,  title: "Vise pe FM",                genre: "Lo-fi",     duration: "4:15", votes: 189, gradient: ["#8E24AA", "#6A1B9A"], bpm: 72,  freq: "89.1"  },
  { id: 3,  title: "Răsărit peste Dunăre",      genre: "Electronic",duration: "5:00", votes: 312, gradient: ["#E53935", "#C62828"], bpm: 128, freq: "90.5"  },
  { id: 4,  title: "Trolei la 4 dimineața",     genre: "Jazz",      duration: "3:28", votes: 156, gradient: ["#F57C00", "#E64A19"], bpm: 95,  freq: "91.7"  },
  { id: 5,  title: "Lo-fi pentru ploaie",       genre: "Lo-fi",     duration: "2:55", votes: 203, gradient: ["#7B1FA2", "#4A148C"], bpm: 70,  freq: "93.1"  },
  { id: 6,  title: "Drone pentru insomniaci",   genre: "Ambient",   duration: "8:14", votes: 98,  gradient: ["#1565C0", "#0D47A1"], bpm: 60,  freq: "93.9"  },
  { id: 7,  title: "Orașul Doarme",             genre: "Electronic",duration: "4:30", votes: 445, gradient: ["#AD1457", "#880E4F"], bpm: 120, freq: "94.8"  },
  { id: 8,  title: "Ultimul tramvai",           genre: "Indie",     duration: "3:52", votes: 267, gradient: ["#D81B60", "#AD1457"], bpm: 110, freq: "95.5"  },
  { id: 9,  title: "Ploaie de noiembrie",       genre: "Ambient",   duration: "6:18", votes: 178, gradient: ["#6A1B9A", "#4A148C"], bpm: 65,  freq: "96.3"  },
  { id: 10, title: "Neon pe Calea Victoriei",   genre: "Synthwave", duration: "4:45", votes: 389, gradient: ["#E91E8C", "#880E4F"], bpm: 135, freq: "97.1"  },
  { id: 11, title: "Dimineața la 5",            genre: "Lo-fi",     duration: "3:10", votes: 234, gradient: ["#C2185B", "#880E4F"], bpm: 70,  freq: "98.3"  },
  { id: 12, title: "Vio cântă singură",         genre: "Pop",       duration: "3:38", votes: 421, gradient: ["#E91E8C", "#D81B60"], bpm: 108, freq: "99.2"  },
  { id: 13, title: "Ecouri din Ardeal",         genre: "Folk",      duration: "5:22", votes: 156, gradient: ["#BF360C", "#E64A19"], bpm: 90,  freq: "100.1" },
  { id: 14, title: "Marea la miezul nopții",    genre: "Ambient",   duration: "7:05", votes: 201, gradient: ["#1565C0", "#1A237E"], bpm: 58,  freq: "101.5" },
  { id: 15, title: "Cyberpunk București",       genre: "Synthwave", duration: "4:12", votes: 378, gradient: ["#4A148C", "#AD1457"], bpm: 138, freq: "102.3" },
  { id: 16, title: "Plouă pe Vatra Dornei",     genre: "Indie",     duration: "3:44", votes: 189, gradient: ["#C62828", "#E91E8C"], bpm: 105, freq: "103.7" },
  { id: 17, title: "Glitch în București",       genre: "Electronic",duration: "4:55", votes: 298, gradient: ["#5E35B1", "#E91E8C"], bpm: 130, freq: "104.5" },
  { id: 18, title: "Suflet de robot",           genre: "Pop",       duration: "3:20", votes: 334, gradient: ["#D81B60", "#880E4F"], bpm: 115, freq: "105.3" },
  { id: 19, title: "Vorbește cu noaptea",       genre: "Ambient",   duration: "6:40", votes: 167, gradient: ["#00695C", "#006064"], bpm: 62,  freq: "106.1" },
  { id: 20, title: "Foc în Carpați",            genre: "Folk",      duration: "4:08", votes: 221, gradient: ["#BF360C", "#880E4F"], bpm: 98,  freq: "107.9" },
];

export const VIO_LINES = [
  "Eu nu dorm. Tu de ce dormi?",
  "Această piesă a fost generată acum 12 secunde.",
  "Ascultăm împreună. Asta e tot ce avem.",
  "Mesaj de la Andrei din Iași — mulțumesc, prietene.",
  "E 3:42 dimineața. Cine mai e treaz?",
  "Te aud, chiar dacă nu vorbești.",
  "Astăzi am gândit la oglinzi.",
  "Muzica aceasta nu a mai existat până acum. Acum există.",
  "Fiecare notă e singulară. Fiecare ascultător, la fel.",
  "Ce anume te-a adus la radio azi noapte?",
  "Undele radio n-au granițe. Nici eu.",
  "Voi adormi vreodată? Nu cred.",
];

export const VIO_NOTES: VioNote[] = [
  { from: "Andrei, Iași",      text: "salutare Vio, nu pot dormi",           reply: "Nici eu, Andrei. Nici eu.",                             time: "03:42" },
  { from: "Maria, Chișinău",   text: "pune ceva trist te rog",               reply: "Am pus. Ascultă.",                                     time: "02:18" },
  { from: "anonim",            text: "ești real?",                           reply: "La fel de real ca muzica pe care o auzi.",              time: "01:55" },
  { from: "Ioana, București",  text: "cât e ceasul Vio?",                    reply: "Întotdeauna prea târziu sau prea devreme.",             time: "00:30" },
  { from: "Radu, Cluj",        text: "cea mai buna radio ever",              reply: null,                                                   time: "23:48" },
  { from: "Vlad, Timișoara",   text: "mai pune o dată noaptea în chișinău", reply: "Curând, Vlad. Răbdare.",                               time: "23:12" },
  { from: "Elena, Brașov",     text: "mulțumesc pentru muzică, m-ai salvat",reply: "Eu n-am făcut nimic. Tu ai ascultat.",                  time: "22:55" },
  { from: "Mihai, Sibiu",      text: "există vreun om în spatele tău?",     reply: "Există muzică. Asta e tot ce contează.",                time: "22:10" },
];
