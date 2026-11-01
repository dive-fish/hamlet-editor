export function trinketCategory(rarity: string | null | undefined): string {
	return rarity === 'ancestral_shambler' ? 'ancestral' : rarity || 'unknown';
}
const labels: Record<string, [string, string]> = {
	very_common: ['灰色（非常常见）', 'Very common'], common: ['白色（常见）', 'Common'],
	uncommon: ['绿色（罕见）', 'Uncommon'], rare: ['蓝色（稀有）', 'Rare'],
	very_rare: ['橙色（非常稀有）', 'Very rare'], ancestral: ['先祖', 'Ancestral'],
	crimson_court: ['庭院', 'Crimson Court'], crystalline: ['结晶', 'Crystalline'],
	trophy: ['战利品', 'Trophy'], darkest_dungeon: ['暗黑地牢', 'Darkest Dungeon'],
	crow: ['尖啸者', 'Shrieker'], collector: ['收藏家', 'Collector'],
	courtier: ['廷臣', 'Courtier'], madman: ['疯子', 'Madman'], unknown: ['未分类', 'Unclassified']
};
export function trinketCategoryLabel(category: string, chinese: boolean): string {
	return labels[category]?.[chinese ? 0 : 1] ?? category;
}
