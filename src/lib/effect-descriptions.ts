/** Game data stays plain text; never render localization or mod content as HTML. */
export type GameEffect = string | {
 id?: string; stat_type?: string; stat_sub_type?: string; amount?: number;
 rule_type?: string; is_false_rule?: boolean; rule_data?: {float?: number; string?: string};
 [key: string]: unknown;
};
type Lookup = (key: string, fallback: string) => string;
export const cleanGameText = (text: string) => text.replace(/\{colour_start\|[^}]*\}|\{colour_end\}/g, '').replace(/\\n/g, '\n').trim();

function format(template: string, numbers: number[], strings: string[]) {
 let ni = 0, si = 0;
 return cleanGameText(template.replace(/(?:\{\?(decimal|percent|string)(\d+)\})?%([+]?)(?:\d+(?:\.\d+)?)?([dfs%])/g, (_m, type, index, sign, spec) => {
  if (spec === '%') return '%';
  if (spec === 's') return strings[index ? Number(index) - 1 : si++] ?? '?';
  let value = numbers[index ? Number(index) - 1 : ni++] ?? 0;
  if (type === 'percent') value *= 100;
  const rounded = Number(value.toFixed(3));
  return (sign && rounded >= 0 ? '+' : '') + String(rounded);
 }));
}

export function describeEffects(effects: GameEffect[] = [], lookup: Lookup): string {
 const lines = effects.map(effect => {
  if (typeof effect === 'string') return effect; // Unresolved effects remain visible.
  const stat = effect.stat_type ?? '', sub = effect.stat_sub_type ?? '';
  const key = `buff_stat_tooltip_${stat}${sub ? '_' + sub : ''}`;
  const template = lookup(key, '');
  // DD stores accuracy, dodge and crit in fractions, unlike HP and speed.
  const absolute = (stat === 'combat_stat_add' && ['max_hp','speed_rating'].includes(sub)) || ['hp_heal_amount','stress_heal_amount'].includes(stat);
  const amount = effect.amount ?? 0;
  let text = template ? format(template, [amount * (absolute || template.includes('{?percent') ? 1 : 100)], []) : `${stat}${sub ? ':' + sub : ''}: ${amount}`;
  const rule = effect.rule_type ?? 'always', data = effect.rule_data ?? {};
  if (rule !== 'always') {
   const ruleTemplate = lookup(`buff_rule_tooltip_${rule}${effect.is_false_rule ? '_false' : ''}`, '');
   const token = data.string ?? '';
   const target = rule === 'in_dungeon' ? lookup(`dungeon_name_${token}`, token)
    : rule === 'monsterType' || rule === 'attacking_monster_type' ? lookup(`str_monster_type_${token}`, token)
    : rule === 'in_activity' ? lookup(`town_activity_name_${token}`, token) : token;
   // Some shipped translations incorrectly mark HP fractions as decimal values.
   const hpRule = rule === 'hpabove' || rule === 'hpbelow';
   const normalized = hpRule ? ruleTemplate.replace(/\{\?percent(\d+)\}/g, '{?decimal$1}') : ruleTemplate;
   text = ruleTemplate ? format(normalized, [(data.float ?? 0) * (hpRule ? 100 : 1)], [text, target])
    : `${text} [${effect.is_false_rule ? '!' : ''}${rule}: ${JSON.stringify(data)}]`;
  }
  return text || effect.id || '';
 });
 return [...new Set(lines.filter(Boolean))].join('\n');
}
