import type { UpgradePurchase } from '#lib/types/save-data.js';
/** The game's signed 32-bit upgrade-tree hash (UTF-8, multiplier 53). */
export function skillTreeHash(text: string): number {
 let hash = 0; for (const byte of new TextEncoder().encode(text)) hash = (Math.imul(hash, 53) + byte) | 0; return hash;
}
/** Plans only owned combat trees. Selection, camping, equipment and foreign purchases are untouched. */
export function planMaxOwnedSkills(purchases: Record<string, UpgradePurchase>, guid: string, heroClass: string, available: string[], selected: string[]) {
 const instance = Number(guid);
 if (!Number.isSafeInteger(instance) || instance <= 0) return null;
 const additions: UpgradePurchase[] = [];
 const enableKeys: string[] = [];
 let ownedSkills = 0;
 for (const skill of new Set(available)) {
  const tree = `${heroClass}.${skill}`;
  const hash = skillTreeHash(tree);
  const entries = Object.entries(purchases).filter(([, p]) => p.instance_number === instance && (p.tree_id === hash || p.tree_id === `###${tree}`));
  if (!selected.includes(skill) && !entries.some(([, p]) => p.is_purchased)) continue;
  ownedSkills++;
  // Unknown tiers cannot safely be interpreted as the vanilla five-rank tree.
  if (entries.some(([, p]) => !/^[0-4]$/.test(p.requirement_code))) return null;
  for (let rank = 0; rank <= 4; rank++) {
   const matching = entries.filter(([, p]) => p.requirement_code === String(rank));
   if (!matching.length) additions.push({instance_number:instance, tree_id:`###${tree}`, requirement_code:String(rank), is_purchased:true});
   else for (const [key, p] of matching) if (!p.is_purchased) enableKeys.push(key);
  }
 }
 return { additions, enableKeys, ownedSkills };
}
