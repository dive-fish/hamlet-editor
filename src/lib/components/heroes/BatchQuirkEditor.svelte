<script lang="ts">
 import { getEditorLocale } from '#lib/i18n/index.svelte.js';
 import { Button } from '#lib/components/ui/button/index.js';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#lib/components/ui/dialog/index.js';
 import { getAllQuirks } from '#lib/data/quirks.js';
 import { planHeroBatch, type BatchOptions, type Category } from '#lib/hero-batch.js';
 import { getHeroes, getHeroRawData, addHeroQuirk, removeHeroQuirk, toggleQuirkLock, setHeroWeaponRank, setHeroArmourRank, type HeroSummary } from '#lib/stores/save-data.svelte.js';
 let { selectedHeroes }: { selectedHeroes: HeroSummary[] } = $props();
 let open = $state(false);
 let mode = $state<BatchOptions['mode']>('add');
 let category = $state<'positive' | 'negative'>('positive');
 let ids = $state<string[]>([]);
 let search = $state('');
 let lockPositive = $state(true);
 let maxEquipment = $state(false);
 let applied = $state(false);
 const label = (zh: string, en: string) => getEditorLocale().startsWith('zh') ? zh : en;
 let catalog = $derived(new Map(getAllQuirks().map(q => [q.id, q.category as Category])));
 let available = $derived(getAllQuirks().filter(q => q.category === category && (q.id + ' ' + q.displayName).toLowerCase().includes(search.toLowerCase())));
 let plans = $derived(getHeroes().filter(h => selectedHeroes.some(selected => selected.guid === h.guid)).map(h => planHeroBatch(h, {mode, category, ids, lockPositive, maxEquipment}, catalog)));
 let errors = $derived(plans.flatMap(p => p.errors.map(e => `${p.name}: ${e}`)));
 function apply() {
  if (!plans.length || errors.length || (mode !== 'recommended' && !ids.length && mode !== 'replace' && !maxEquipment)) return;
  // All heroes are validated before any mutation. Existing store methods retain dirty tracking.
  for (const p of plans) {
   const raw = getHeroRawData(p.guid);
   if (!raw) return;
   for (const id of p.removed) removeHeroQuirk(p.guid, id);
   for (const id of p.added) addHeroQuirk(p.guid, id, p.quirks[id]);
   for (const id of [...p.locked, ...p.unlocked]) if (raw.quirks[id] && raw.quirks[id].is_locked !== p.quirks[id].is_locked) toggleQuirkLock(p.guid, id);
   if (maxEquipment) { setHeroWeaponRank(p.guid, p.weaponRank); setHeroArmourRank(p.guid, p.armourRank); }
  }
  applied = true; open = false;
 }
</script>
<Button variant="outline" size="sm" onclick={() => { applied = false; open = true; }}>{label('批量怪癖与装备', 'Batch quirks and equipment')}</Button>
{#if applied}<span role="status" class="text-xs">{label('已应用，请检查后保存。', 'Applied. Review and save when ready.')}</span>{/if}
<Dialog bind:open>
 <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
  <DialogHeader><DialogTitle>{label('批量怪癖与装备', 'Batch quirks and equipment')}</DialogTitle><DialogDescription>{label('仅处理勾选英雄。疾病及未知怪癖保留；应用后仍需点击主界面的保存。装备上限沿用编辑器的4级。', 'Only selected heroes are edited. Diseases and unknown quirks are preserved. Apply changes in memory, then use Save. Equipment uses the editor’s rank-4 limit.')}</DialogDescription></DialogHeader>
  <label class="grid gap-1 text-sm">{label('操作', 'Operation')}<select class="rounded border bg-background p-2" bind:value={mode}>
   <option value="add">{label('添加所选怪癖（保留已有）', 'Add selected quirks (keep existing)')}</option>
   <option value="replace">{label('替换该颜色全部怪癖（未选则清空）', 'Replace category (empty selection clears it)')}</option>
   <option value="remove">{label('移除所选怪癖', 'Remove selected quirks')}</option>
   <option value="lock">{label('锁定已有的所选怪癖', 'Lock selected existing quirks')}</option>
   <option value="unlock">{label('解锁已有的所选怪癖', 'Unlock selected existing quirks')}</option>
   <option value="recommended">{label('按职业替换五黄＋三个城镇限制红癖', 'Class preset: five positives + three town restrictions')}</option>
  </select></label>
  {#if mode !== 'recommended'}
   <label class="grid gap-1 text-sm">{label('类别', 'Category')}<select class="rounded border bg-background p-2" bind:value={category} onchange={() => { ids = []; }}><option value="positive">{label('正面（黄色）', 'Positive')}</option><option value="negative">{label('负面（红色）', 'Negative')}</option></select></label>
   <input class="rounded border bg-background p-2" aria-label={label('搜索怪癖', 'Search quirks')} placeholder={label('搜索名称或ID', 'Search name or ID')} bind:value={search} />
   <div class="max-h-40 overflow-y-auto rounded border p-2">{#each available as q (q.id)}<label class="flex items-center gap-2 py-1 text-sm"><input type="checkbox" value={q.id} bind:group={ids} />{q.displayName}<span class="text-muted-foreground text-xs">{q.id}</span></label>{/each}</div>
  {/if}
  <label class="flex gap-2 text-sm"><input type="checkbox" bind:checked={lockPositive} />{label('添加／替换时锁定黄色怪癖', 'Lock positive quirks when adding/replacing')}</label>
  <label class="flex gap-2 text-sm"><input type="checkbox" bind:checked={maxEquipment} />{label('武器与护甲升满（4级）', 'Max weapon and armour (rank 4)')}</label>
  <div class="max-h-48 overflow-y-auto rounded border p-2 text-sm" aria-live="polite"><strong>{label('修改预览', 'Preview')} ({plans.length})</strong>{#each plans as p (p.guid)}<p>{p.name}: +{p.added.length} / −{p.removed.length} / {label('锁定', 'lock')} {p.locked.length} / {label('解锁', 'unlock')} {p.unlocked.length}; {label('武器／护甲', 'weapon/armour')} {p.weaponRank}/{p.armourRank}</p>{/each}</div>
  {#if errors.length}<div role="alert" class="text-sm text-destructive">{#each errors as error}<p>{error}</p>{/each}</div>{/if}
  <Button disabled={!plans.length || !!errors.length || (mode !== 'recommended' && mode !== 'replace' && !ids.length && !maxEquipment)} onclick={apply}>{label('应用到勾选英雄', 'Apply to selected heroes')}</Button>
 </DialogContent>
</Dialog>
