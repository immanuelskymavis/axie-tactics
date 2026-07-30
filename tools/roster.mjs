// The 30-unit roster, shared by the SVG generator and mirrored into UNIT_DEFS in
// axie-merge-tactics.html. Five tiers across Axie's six canonical classes.
//
// Tier 5 is the six canonical starter Axies — Buba, Puffy, Olek, Momo, Pomodoro and
// Venoki — one per class and one per trait. Tiers 1-4 use real Axie body-part names
// matched to the class those parts actually belong to.
//
// `art` drives the SVG generator: horn / mouth / back / tail pick a shape from the part
// vocabulary in make-svg-axies.mjs, and `accent` overrides the default accent colour.

// Axie's canonical class colours.
export const CLASS_COLORS = {
  Beast:   { body: '#fdb014', dark: '#c9820b', light: '#ffd166', accent: '#8a5a10' },
  Aquatic: { body: '#3fc5e0', dark: '#1f8fa8', light: '#8ee5f5', accent: '#12626f' },
  Plant:   { body: '#a8df3d', dark: '#6ea622', light: '#cef27e', accent: '#3f6b12' },
  Bird:    { body: '#ff8cbe', dark: '#d4568c', light: '#ffc0da', accent: '#8f2f57' },
  Bug:     { body: '#ff6b57', dark: '#c8412f', light: '#ffa294', accent: '#8a2a1c' },
  Reptile: { body: '#b673e0', dark: '#8244ad', light: '#d7aef0', accent: '#5b2679' },
};

// The three characters with official Sky Mavis art rendered by render-sprites.mjs.
// Everything else is generated as SVG.
export const RENDERED = ['buba', 'puffy', 'pomodoro'];

export const ROSTER = [
  // ---- Tier 1 ----
  { id: 'nutcracker', name: 'Nut Cracker', tier: 1, class: 'Beast',   trait: 'Vanguard', atk: 55, hp: 560, range: 1, mystic: false,
    attack: 'Nut Crack',      skill: 'Frenzy Smash cleaves 3 front hexes for 110 dmg',
    art: { horn: 'nut',     mouth: 'fang',   back: 'none',  tail: 'stub' } },
  { id: 'goldfish',   name: 'Goldfish',    tier: 1, class: 'Aquatic', trait: 'Assassin', atk: 45, hp: 480, range: 1, mystic: false,
    attack: 'Aqua Nip',       skill: 'Infiltrate backline, 150 magic dmg, 100% lifesteal',
    art: { horn: 'fin',     mouth: 'kiss',   back: 'none',  tail: 'fin' } },
  { id: 'shiitake',   name: 'Shiitake',    tier: 1, class: 'Plant',   trait: 'Bastion',  atk: 30, hp: 620, range: 2, mystic: false,
    attack: 'Spore Shot',     skill: 'Root Barrier roots self, gives 150 HP shield to self/ally',
    art: { horn: 'cap',     mouth: 'smile',  back: 'none',  tail: 'stub' } },
  { id: 'eggshell',   name: 'Eggshell',    tier: 1, class: 'Bird',    trait: 'Mage',     atk: 35, hp: 430, range: 3, mystic: true,
    attack: 'Feather Dart',   skill: 'Starlight Chirp grants 40 skill energy to adjacent allies',
    art: { horn: 'shell',   mouth: 'beak',   back: 'none',  tail: 'stub' } },
  { id: 'larva',      name: 'Larva',       tier: 1, class: 'Bug',     trait: 'Spikes',   atk: 40, hp: 540, range: 1, mystic: false,
    attack: 'Nibble',         skill: 'Needle Burst 30% trigger dealing 75 dmg in a circle',
    art: { horn: 'antenna', mouth: 'pincer', back: 'none',  tail: 'stub' } },
  { id: 'tinydino',   name: 'Tiny Dino',   tier: 1, class: 'Reptile', trait: 'Sniper',   atk: 42, hp: 500, range: 3, mystic: false,
    attack: 'Venom Spit',     skill: 'Acid Lob hits the farthest enemy for 120 dmg',
    art: { horn: 'nut',     mouth: 'fang',   back: 'none',  tail: 'stub' } },

  // ---- Tier 2 ----
  { id: 'zigzag',     name: 'Zigzag',      tier: 2, class: 'Beast',   trait: 'Assassin', atk: 58, hp: 600, range: 1, mystic: false,
    attack: 'Zig Slash',      skill: 'Dart Dash blinks past the front line for 145 dmg',
    art: { horn: 'twig',    mouth: 'fang',   back: 'none',  tail: 'spiky' } },
  { id: 'koi',        name: 'Koi',         tier: 2, class: 'Aquatic', trait: 'Bastion',  atk: 40, hp: 700, range: 1, mystic: false,
    attack: 'Tail Slap',      skill: 'Current Guard grants ally absorb-200 shield + CC immunity',
    art: { horn: 'crest',   mouth: 'smile',  back: 'shell', tail: 'fin' } },
  { id: 'ginger',     name: 'Ginger',      tier: 2, class: 'Plant',   trait: 'Mage',     atk: 44, hp: 580, range: 3, mystic: true,
    attack: 'Root Bolt',      skill: 'Spice Bloom burns a 2-hex circle for 130 magic dmg',
    art: { horn: 'bud',     mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'trifeather', name: 'Tri Feather', tier: 2, class: 'Bird',    trait: 'Spikes',   atk: 50, hp: 560, range: 2, mystic: false,
    attack: 'Quill Jab',      skill: 'Quill Storm reflects 22% damage for 4s',
    art: { horn: 'feather', mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'leafbug',    name: 'Leaf Bug',    tier: 2, class: 'Bug',     trait: 'Sniper',   atk: 48, hp: 540, range: 4, mystic: false,
    attack: 'Sap Shot',       skill: 'Toxic Volley poisons the lowest-HP enemy for 20 dmg/s',
    art: { horn: 'frond',   mouth: 'pincer', back: 'leaf',  tail: 'leafy' } },
  { id: 'kotaro',     name: 'Kotaro',      tier: 2, class: 'Reptile', trait: 'Vanguard', atk: 60, hp: 720, range: 1, mystic: false,
    attack: 'Kotaro Bite',    skill: 'Kotaro Bite deals 120 dmg + 50% armor shred',
    art: { horn: 'spike',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },

  // ---- Tier 3 ----
  { id: 'riskybeast', name: 'Risky Beast', tier: 3, class: 'Beast',   trait: 'Bastion',  atk: 55, hp: 1000, range: 1, mystic: false,
    attack: 'Reckless Ram',   skill: 'Gamble Guard taunts a 2-hex radius, cuts damage taken by 50%',
    art: { horn: 'spike',   mouth: 'grin',   back: 'none',  tail: 'stub' } },
  { id: 'anemone',    name: 'Anemone',     tier: 3, class: 'Aquatic', trait: 'Mage',     atk: 58, hp: 830, range: 3, mystic: true,
    attack: 'Sting Bolt',     skill: 'Tide Pulse strikes 3x for 60 magic dmg and drains energy',
    art: { horn: 'frond',   mouth: 'kiss',   back: 'none',  tail: 'coil' } },
  { id: 'cucumber',   name: 'Cucumber',    tier: 3, class: 'Plant',   trait: 'Spikes',   atk: 52, hp: 950, range: 1, mystic: false,
    attack: 'Vine Whip',      skill: 'Thorn Coat reflects damage and bursts for 90 in a circle',
    art: { horn: 'twig',    mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'cupid',      name: 'Cupid',       tier: 3, class: 'Bird',    trait: 'Sniper',   atk: 55, hp: 700, range: 4, mystic: false,
    attack: 'Heart Arrow',    skill: 'Gale Force hits for 130 dmg + 2 hex knockback',
    art: { horn: 'fin',     mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'sandal',     name: 'Sandal',      tier: 3, class: 'Bug',     trait: 'Vanguard', atk: 62, hp: 900, range: 1, mystic: false,
    attack: 'Stomp',          skill: 'Swarm Call taunts nearby foes and stacks poison on hit',
    art: { horn: 'spike',   mouth: 'pincer', back: 'spike', tail: 'stub' } },
  { id: 'scalyspear', name: 'Scaly Spear', tier: 3, class: 'Reptile', trait: 'Assassin', atk: 65, hp: 780, range: 1, mystic: false,
    attack: 'Spear Thrust',   skill: 'Scale Dash blinks behind target, hits path for 140 dmg',
    art: { horn: 'twig',    mouth: 'fang',   back: 'sail',  tail: 'spiky' } },

  // ---- Tier 4 ----
  { id: 'goda',       name: 'Goda',        tier: 4, class: 'Beast',   trait: 'Mage',     atk: 72, hp: 1050, range: 3, mystic: true,
    attack: 'Astral Howl',    skill: 'Moon Chorus burns mana and deals 180 magic dmg in a line',
    art: { horn: 'crown',   mouth: 'grin',   back: 'none',  tail: 'coil' } },
  { id: 'hermit',     name: 'Hermit',      tier: 4, class: 'Aquatic', trait: 'Spikes',   atk: 60, hp: 1250, range: 1, mystic: false,
    attack: 'Shell Bash',     skill: 'Shell Fortress reflects 40% damage while shielded',
    art: { horn: 'shell',   mouth: 'smile',  back: 'shell', tail: 'stub' } },
  { id: 'bidens',     name: 'Bidens',      tier: 4, class: 'Plant',   trait: 'Sniper',   atk: 66, hp: 900, range: 5, mystic: false,
    attack: 'Seed Volley',    skill: 'Bloom Shot lanes for 200 dmg, executes under 25% HP',
    art: { horn: 'frond',   mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'kingfisher', name: 'Kingfisher',  tier: 4, class: 'Bird',    trait: 'Vanguard', atk: 70, hp: 1100, range: 1, mystic: false,
    attack: 'Dive Beak',      skill: 'Skyward Call taunts and grants allies +30 start energy',
    art: { horn: 'crest',   mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'pliers',     name: 'Pliers',      tier: 4, class: 'Bug',     trait: 'Assassin', atk: 78, hp: 920, range: 1, mystic: false,
    attack: 'Clamp',          skill: 'Sever leaps untargetable and crushes lowest HP for 170 dmg',
    art: { horn: 'twig',    mouth: 'pincer', back: 'spike', tail: 'spiky' } },
  { id: 'bonesail',   name: 'Bone Sail',   tier: 4, class: 'Reptile', trait: 'Bastion',  atk: 62, hp: 1350, range: 1, mystic: false,
    attack: 'Sail Slam',      skill: 'Quake Guard stuns a 1-hex circle for 2.5s, 100 true dmg',
    art: { horn: 'crest',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },

  // ---- Tier 5: the canonical starter Axies ----
  { id: 'buba',       name: 'Buba',        tier: 5, class: 'Beast',   trait: 'Vanguard', atk: 88, hp: 1600, range: 1, mystic: false,
    attack: 'Buba Bash',      skill: 'Bash N Brawl taunts all foes and cleaves for 190 dmg',
    art: { horn: 'crown',   mouth: 'grin',   back: 'none',  tail: 'spiky' } },
  { id: 'puffy',      name: 'Puffy',       tier: 5, class: 'Aquatic', trait: 'Mage',     atk: 80, hp: 1200, range: 4, mystic: true,
    attack: 'Bubble Bolt',    skill: 'Paddle Pool heals allies for 300 and pushes enemies back 2 rows',
    art: { horn: 'fin',     mouth: 'kiss',   back: 'shell', tail: 'fin' } },
  { id: 'olek',       name: 'Olek',        tier: 5, class: 'Plant',   trait: 'Bastion',  atk: 70, hp: 1700, range: 1, mystic: false,
    attack: 'Petal Slap',     skill: 'Evergreen Aura heals 5% max HP/sec and revives once at 50% HP',
    art: { horn: 'crown',   mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'momo',       name: 'Momo',        tier: 5, class: 'Bird',    trait: 'Assassin', atk: 85, hp: 1180, range: 1, mystic: false,
    attack: 'Razor Wing',     skill: 'Marvelous Mayhem phys-immune whirlwind dealing 80 magic dmg/sec',
    art: { horn: 'crown',   mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'pomodoro',   name: 'Pomodoro',    tier: 5, class: 'Bug',     trait: 'Spikes',   atk: 95, hp: 1500, range: 1, mystic: false,
    attack: 'Vine Crush',     skill: 'Peculiar Thorns reflects 45% damage and poisons all attackers',
    art: { horn: 'antenna', mouth: 'pincer', back: 'leaf',  tail: 'leafy' } },
  { id: 'venoki',     name: 'Venoki',      tier: 5, class: 'Reptile', trait: 'Sniper',   atk: 82, hp: 1250, range: 5, mystic: false,
    attack: 'Venom Lance',    skill: 'Vortex Volley pierces a lane for 210 dmg and slows survivors',
    art: { horn: 'crown',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },
];
