import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeEffects, cleanGameText } from '../src/lib/effect-descriptions.ts';
const table = {
 buff_stat_tooltip_combat_stat_add_attack_rating: '%+d 命中',
 buff_stat_tooltip_combat_stat_add_defense_rating: '%+d 闪避',
 buff_stat_tooltip_combat_stat_add_speed_rating: '%+d 速度',
 buff_stat_tooltip_combat_stat_multiply_damage_low: '%+d%% 伤害',
 buff_stat_tooltip_combat_stat_multiply_damage_high: '%+d%% 伤害',
 buff_rule_tooltip_rangedonly: '%s {colour_start|attacktype}远程{colour_end}技能',
 buff_rule_tooltip_hpbelow: '{?string1}%s，生命低于{?percent1}%d%%',
 buff_rule_tooltip_firstroundonly_false: '首轮之后 %s'
};
const lookup=(key,fallback)=>table[key]??fallback;
test('formats fractional accuracy and dodge but absolute speed',()=>{
 assert.equal(describeEffects([{stat_type:'combat_stat_add',stat_sub_type:'attack_rating',amount:0.1},{stat_type:'combat_stat_add',stat_sub_type:'defense_rating',amount:-0.08},{stat_type:'combat_stat_add',stat_sub_type:'speed_rating',amount:2}],lookup),'+10 命中\n-8 闪避\n+2 速度');
});
test('retains ranged and HP conditions; collapses duplicate low/high damage descriptions',()=>{
 const e={stat_type:'combat_stat_multiply',amount:-0.05,rule_type:'rangedonly'};
 assert.equal(describeEffects([{...e,stat_sub_type:'damage_low'},{...e,stat_sub_type:'damage_high'}],lookup),'-5% 伤害 远程技能');
 assert.equal(describeEffects([{...e,stat_sub_type:'damage_low',rule_type:'hpbelow',rule_data:{float:0.5}}],lookup),'-5% 伤害，生命低于50%');
 assert.equal(describeEffects([{...e,stat_sub_type:'damage_low',rule_type:'hpbelow',rule_data:{float:0.5}}],(k,f)=>k==='buff_rule_tooltip_hpbelow'?'{?string1}%s如果生命值低于{?decimal1}%d%%':lookup(k,f)),'-5% 伤害如果生命值低于50%');
});
test('inverse rules and unresolved MOD data stay visible without HTML rendering',()=>{
 assert.equal(describeEffects([{stat_type:'combat_stat_add',stat_sub_type:'speed_rating',amount:2,rule_type:'firstroundonly',is_false_rule:true}],lookup),'首轮之后 +2 速度');
 assert.match(describeEffects([{stat_type:'mod_stat',amount:3,rule_type:'mod_rule',rule_data:{float:7,string:'target'}}],lookup),/mod_rule.*7.*target/);
 assert.equal(cleanGameText('<img src=x onerror=alert(1)>'),'<img src=x onerror=alert(1)>');
 assert.equal(describeEffects(['missing_buff'],lookup),'missing_buff');
});
