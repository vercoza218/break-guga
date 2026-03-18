export interface Badge {
  id: string;
  name: string;
  namePt: string;
  winsRequired: number;
  settingsKey: string; // key in site_settings for the image URL
}

export const KANTO_BADGES: Badge[] = [
  { id: 'boulder', name: 'Boulder Badge', namePt: 'Insígnia da Pedra', winsRequired: 1, settingsKey: 'badge_boulder' },
  { id: 'cascade', name: 'Cascade Badge', namePt: 'Insígnia da Cascata', winsRequired: 3, settingsKey: 'badge_cascade' },
  { id: 'thunder', name: 'Thunder Badge', namePt: 'Insígnia do Trovão', winsRequired: 5, settingsKey: 'badge_thunder' },
  { id: 'rainbow', name: 'Rainbow Badge', namePt: 'Insígnia do Arco-íris', winsRequired: 8, settingsKey: 'badge_rainbow' },
  { id: 'soul', name: 'Soul Badge', namePt: 'Insígnia da Alma', winsRequired: 12, settingsKey: 'badge_soul' },
  { id: 'marsh', name: 'Marsh Badge', namePt: 'Insígnia do Pântano', winsRequired: 16, settingsKey: 'badge_marsh' },
  { id: 'volcano', name: 'Volcano Badge', namePt: 'Insígnia do Vulcão', winsRequired: 21, settingsKey: 'badge_volcano' },
  { id: 'earth', name: 'Earth Badge', namePt: 'Insígnia da Terra', winsRequired: 27, settingsKey: 'badge_earth' },
];

export function getEarnedBadges(wins: number): Badge[] {
  return KANTO_BADGES.filter(b => wins >= b.winsRequired);
}

export function getNextBadge(wins: number): Badge | null {
  return KANTO_BADGES.find(b => wins < b.winsRequired) || null;
}
