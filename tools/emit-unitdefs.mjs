// Emits the UNIT_DEFS literal for axie-merge-tactics.html from the shared roster,
// so the game's roster and the art generator cannot drift apart.
import { ROSTER, RENDERED } from './roster.mjs';

const EMOJI = {
  Beast: '🦁', Aquatic: '💧', Plant: '🌿', Bird: '🕊️', Bug: '🐞', Reptile: '🦎',
};

const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`;
let out = '    const UNIT_DEFS = [\n';
for (let t = 1; t <= 5; t++) {
  out += `      // Tier ${t}\n`;
  for (const u of ROSTER.filter((x) => x.tier === t)) {
    out += `      {id:${q(u.id)},skillKey:${q(u.skillKey)},name:${q(u.name)},emoji:${q(EMOJI[u.class])},tier:${u.tier},`
      + `class:${q(u.class)},trait:${q(u.trait)},atk:${u.atk},hp:${u.hp},mystic:${u.mystic},`
      + `range:${u.range},attack:${q(u.attack)},skill:${q(u.skill)}},\n`;
  }
  if (t < 5) out += '\n';
}
out = out.replace(/,\n$/, '\n');
out += '    ];\n';
console.log(out);
console.error(`${ROSTER.length} units; rendered: ${RENDERED.join(', ')}`);
