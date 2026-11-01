<script lang="ts">
	import { getEditorLocale } from '#lib/i18n/index.svelte.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#lib/components/ui/dialog/index.js';
	import { getSaveData, markDirty } from '#lib/stores/save-data.svelte.js';
	import { getGameData } from '#lib/stores/game-data.svelte.js';
	import { addAllCatalogueTrinkets, storageItems } from '#lib/trinkets.js';
	import { trinketCategory, trinketCategoryLabel } from '#lib/trinket-categories.js';
	const save = getSaveData(), game = getGameData();
	const label = (zh: string, en: string) => getEditorLocale().startsWith('zh') ? zh : en;
	let open = $state(false);
	let quantity = $state<number | undefined>(1);
	let added = $state(0);
	let failed = $state(false);
	let allCategories = $state(true);
	let selectedCategories = $state<string[]>([]);
	let categories = $derived([...new Set(game.trinkets.map(def => trinketCategory(def.rarity)))].sort());
	let definitions = $derived(game.trinkets.filter(def => allCategories || selectedCategories.includes(trinketCategory(def.rarity))));
	let count = $derived(new Set(definitions.filter(def => def.id).map(def => def.id)).size);
	let valid = $derived(quantity !== undefined && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99 && count > 0 && !!storageItems(save.estate));
	function apply() {
		if (!valid || quantity === undefined) return;
		const result = addAllCatalogueTrinkets(save.estate, definitions, quantity);
		if (!result) { failed = true; return; }
		markDirty('persist.estate.json');
		added = result * quantity;
		open = false;
	}
</script>

<Button variant="outline" size="sm" onclick={() => { open = true; added = 0; failed = false; }}>{label('批量添加所有饰品', 'Add all trinkets')}</Button>
{#if added}<span class="text-xs text-muted-foreground" role="status">{label(`已添加 ${added} 件饰品，请保存。`, `Added ${added} trinkets. Save to write changes.`)}</span>{/if}
<Dialog bind:open>
	<DialogContent class="sm:max-w-md">
		<DialogHeader><DialogTitle>{label('批量添加所有饰品', 'Add all trinkets')}</DialogTitle><DialogDescription>{label('将当前游戏目录加载的全部饰品添加到仓库。保留已有饰品；数量表示每种额外添加的件数，应用后仍需保存。', 'Add every trinket loaded from the game directory to storage. Existing items are retained. Quantity is the number added per type. Save after applying.')}</DialogDescription></DialogHeader>
		<label class="grid gap-2 text-sm">{label('每种添加数量（1–99）', 'Quantity per type (1–99)')}<input type="number" min="1" max="99" step="1" bind:value={quantity} class="rounded border bg-background p-2" /></label>
		<label class="flex gap-2 text-sm"><input type="checkbox" bind:checked={allCategories} />{label('全部分类', 'All categories')}</label>
		{#if !allCategories}<div class="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded border p-2">{#each categories as entry}<label class="flex gap-2 text-xs"><input type="checkbox" value={entry} bind:group={selectedCategories} />{trinketCategoryLabel(entry, getEditorLocale().startsWith('zh'))}</label>{/each}</div>{/if}
		<p class="text-sm" aria-live="polite">{label(`共 ${count} 种，将新增 ${valid ? count * quantity! : 0} 件。`, `${count} types; ${valid ? count * quantity! : 0} items will be added.`)}</p>
		{#if !game.trinkets.length}<p class="text-sm text-muted-foreground">{label('尚未加载饰品目录，请在设置中确认游戏目录正确后重新加载存档。', 'No trinket catalogue loaded. Check the game directory in Settings, then reload the profile.')}</p>{/if}
		{#if failed}<p role="alert" class="text-sm text-destructive">{label('仓库数据无法接受本次添加，未作修改。', 'Storage cannot accept these additions. No changes were made.')}</p>{/if}
		<Button disabled={!valid} onclick={apply}>{label('添加到饰品仓库', 'Add to trinket storage')}</Button>
	</DialogContent>
</Dialog>
