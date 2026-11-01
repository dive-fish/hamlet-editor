export const PRISMATIC_IDS = ['alien_eye','alien_precision','alien_speed','alien_force','alien_calm','alien_purity','alien_healing','alien_solidity','alien_stability','alien_isolation'];
export const isPrismatic = (id: string) => PRISMATIC_IDS.includes(id);
export function prismaticOwner(heroes: readonly {guid: string; status: number; quirks: Record<string, unknown>}[], guid: string, id: string): string | undefined {
	return isPrismatic(id) ? heroes.find(hero => hero.guid !== guid && hero.status !== 3 && Object.hasOwn(hero.quirks, id))?.guid : undefined;
}
