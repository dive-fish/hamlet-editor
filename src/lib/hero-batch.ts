export type Category = 'positive' | 'negative' | 'disease';
export type Quirk = { is_locked: boolean; is_new: boolean; mission_count: number; replaces_quirk: number; replaces_quirk_viewed: boolean; evolution_duration_remaining: number };
export type BatchHero = { guid: string; name: string; heroClass: string; status: number; quirks: Record<string, Quirk>; weaponRank: number; armourRank: number };
export type BatchOptions = { mode: 'add' | 'replace' | 'remove' | 'lock' | 'unlock' | 'recommended'; category: 'positive' | 'negative'; ids: string[]; lockPositive: boolean; maxEquipment: boolean };
export type BatchPlan = { guid: string; name: string; quirks: Record<string, Quirk>; weaponRank: number; armourRank: number; errors: string[]; added: string[]; removed: string[]; locked: string[]; unlocked: string[] };
const speed = ['luminous', 'quick_reflexes'];
const control = [...speed, 'corvids_eye', 'on_guard', 'evasive'];
const support = [...speed, 'evasive', 'tough', 'steady'];
const melee = ['luminous', 'corvids_eye', 'hot_to_trot', 'natural_swing', 'slugger'];
export const RECOMMENDED: Record<string, string[]> = {
 houndmaster: control, plague_doctor: control, abomination: control,
 antiquarian: support, man_at_arms: support, jester: support,
 vestal: ['hippocratic', ...speed, 'tough', 'steady'],
 occultist: [...speed, 'corvids_eye', 'hippocratic', 'evasive'],
 arbalest: ['corvids_eye', 'natural_eye', 'unerring', 'hot_to_trot', 'luminous'],
 musketeer: ['corvids_eye', 'natural_eye', 'unerring', 'hot_to_trot', 'luminous'],
 flagellant: [...speed, 'tough', 'steady', 'resilient'],
 crusader: melee, highwayman: melee, hellion: melee, bounty_hunter: melee, grave_robber: melee, leper: melee, shieldbreaker: melee
};
export const LOW_IMPACT_NEGATIVE = ['known_cheat', 'witness', 'deviant_tastes'];
const fresh = (locked: boolean): Quirk => ({ is_locked: locked, is_new: true, mission_count: 0, replaces_quirk: 0, replaces_quirk_viewed: false, evolution_duration_remaining: 0 });
/** Pure preview. Unknown IDs and diseases are never removed by category replacement. */
export function planHeroBatch(hero: BatchHero, options: BatchOptions, catalog: Map<string, Category>): BatchPlan {
 const quirks = Object.fromEntries(Object.entries(hero.quirks).map(([id, q]) => [id, { ...q }]));
 const errors: string[] = [];
 const replace = (category: 'positive' | 'negative', ids: string[]) => {
  for (const id of Object.keys(quirks)) if (catalog.get(id) === category && !ids.includes(id)) delete quirks[id];
  for (const id of ids) put(id, category);
 };
 const put = (id: string, category: 'positive' | 'negative') => {
  if (catalog.get(id) !== category || id.startsWith('disease_vampire_')) { errors.push(`Invalid ${category} quirk: ${id}`); return; }
  quirks[id] ??= fresh(category === 'positive' && options.lockPositive);
  if (category === 'positive' && options.lockPositive) quirks[id].is_locked = true;
 };
 if (hero.status === 3) errors.push('Dead heroes cannot be batch edited.');
 if (options.mode === 'recommended') {
  const ids = RECOMMENDED[hero.heroClass];
  if (!ids) errors.push(`No preset for class: ${hero.heroClass}`);
  else { replace('positive', ids); replace('negative', LOW_IMPACT_NEGATIVE); }
 } else if (options.mode === 'replace') replace(options.category, [...new Set(options.ids)]);
 else for (const id of new Set(options.ids)) {
  if (catalog.get(id) !== options.category) { errors.push(`Invalid ${options.category} quirk: ${id}`); continue; }
  if (options.mode === 'add') put(id, options.category);
  else if (quirks[id]) {
   if (options.mode === 'remove') delete quirks[id];
   else quirks[id].is_locked = options.mode === 'lock';
  }
 }
 const ids = Object.keys(quirks);
 if (ids.filter(id => catalog.get(id) === 'positive').length > 5) errors.push('More than 5 positive quirks.');
 // Match the existing editor: diseases share the five-entry negative cap.
 if (ids.filter(id => catalog.get(id) !== 'positive').length > 5) errors.push('More than 5 negative/unknown quirks and diseases.');
 return { guid: hero.guid, name: hero.name, quirks, weaponRank: options.maxEquipment ? 4 : hero.weaponRank, armourRank: options.maxEquipment ? 4 : hero.armourRank, errors,
 added: ids.filter(id => !hero.quirks[id]), removed: Object.keys(hero.quirks).filter(id => !quirks[id]),
 locked: ids.filter(id => quirks[id].is_locked && !hero.quirks[id]?.is_locked), unlocked: ids.filter(id => !quirks[id].is_locked && hero.quirks[id]?.is_locked) };
}
