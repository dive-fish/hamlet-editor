<script lang="ts">
 import { Button } from '#lib/components/ui/button/index.js';
 import { getEditorLocale } from '#lib/i18n/index.svelte.js';
 import { maxHeroCombatSkills, type HeroSummary } from '#lib/stores/save-data.svelte.js';
 let { heroes, batch = false }: { heroes: HeroSummary[]; batch?: boolean } = $props();
 let result = $state('');
 const label = (zh: string, en: string) => getEditorLocale().startsWith('zh') ? zh : en;
 function apply() {
  let changed = 0; const skipped: string[] = [];
  for (const hero of heroes) {
   const status = maxHeroCombatSkills(hero.guid);
   if (status === 'changed') changed++;
   if (status === 'unsupported') skipped.push(hero.name);
  }
  result = label(`已升级 ${changed} 名英雄。${skipped.length ? `跳过（已死亡、缺少记录或规则不支持）：${skipped.join('、')}。` : ''}请保存修改。`, `Upgraded ${changed} heroes.${skipped.length ? ` Skipped (dead, missing data or unsupported rules): ${skipped.join(', ')}.` : ''} Save when ready.`);
 }
</script>
<div class="flex flex-wrap items-center gap-2">
 <Button size="sm" variant="outline" disabled={!heroes.length} onclick={apply} title={label('将已解锁的战斗技能升至5级；不改变已装备技能。扎营技能无等级。', 'Raise unlocked combat skills to rank 5 without changing equipped skills. Camping skills have no ranks.')}>
  {batch ? label('批量技能满级', 'Max selected heroes’ skills') : label('技能满级', 'Max skills')}
 </Button>
 {#if result}<span role="status" class="text-xs text-muted-foreground">{result}</span>{/if}
</div>
