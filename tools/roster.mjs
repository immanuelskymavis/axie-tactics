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
  { id: 'nutcracker', skillKey: 'nut', name: 'Nut Cracker', tier: 1, class: 'Beast',   trait: 'Vanguard', atk: 55, hp: 560, range: 1, mystic: false,
    attack: 'Nut Crack',      skill: 'Frenzy Smash cleaves the 3 hexes ahead for 110 dmg',
    art: { horn: 'nut',     mouth: 'fang',   back: 'none',  tail: 'stub' } },
  { id: 'goldfish', skillKey: 'peon',   name: 'Goldfish',    tier: 1, class: 'Aquatic', trait: 'Assassin', atk: 45, hp: 480, range: 1, mystic: false,
    attack: 'Aqua Nip',       skill: 'Infiltrate blinks to the backline for 150 magic dmg with full lifesteal',
    art: { horn: 'fin',     mouth: 'kiss',   back: 'none',  tail: 'fin' } },
  { id: 'shiitake', skillKey: 'sprout',   name: 'Shiitake',    tier: 1, class: 'Plant',   trait: 'Bastion',  atk: 30, hp: 620, range: 2, mystic: false,
    attack: 'Spore Shot',     skill: 'Root Barrier roots self, shields self and nearest ally for 150',
    art: { horn: 'cap',     mouth: 'smile',  back: 'none',  tail: 'stub' } },
  { id: 'eggshell', skillKey: 'pips',   name: 'Eggshell',    tier: 1, class: 'Bird',    trait: 'Mage',     atk: 35, hp: 430, range: 3, mystic: true,
    attack: 'Feather Dart',   skill: 'Starlight Chirp grants 40 energy to adjacent allies',
    art: { horn: 'shell',   mouth: 'beak',   back: 'none',  tail: 'stub' } },
  { id: 'larva', skillKey: 'cactus',      name: 'Larva',       tier: 1, class: 'Bug',     trait: 'Spikes',   atk: 40, hp: 540, range: 1, mystic: false,
    attack: 'Nibble',         skill: 'Needle Burst hits every adjacent enemy for 75 magic dmg',
    art: { horn: 'antenna', mouth: 'pincer', back: 'none',  tail: 'stub' } },
  { id: 'tinydino', skillKey: 'falcon',   name: 'Tiny Dino',   tier: 1, class: 'Reptile', trait: 'Sniper',   atk: 42, hp: 500, range: 3, mystic: false,
    attack: 'Venom Spit',     skill: 'Acid Lob deals 130 dmg and knocks the target back 2 rows',
    art: { horn: 'nut',     mouth: 'fang',   back: 'none',  tail: 'stub' } },

  // ---- Tier 2 ----
  { id: 'zigzag', skillKey: 'zoro',     name: 'Zigzag',      tier: 2, class: 'Beast',   trait: 'Assassin', atk: 58, hp: 600, range: 1, mystic: false,
    attack: 'Zig Slash',      skill: 'Zig Dash blinks behind the target and hits for 140 dmg',
    art: { horn: 'twig',    mouth: 'fang',   back: 'none',  tail: 'spiky' } },
  { id: 'koi', skillKey: 'bubbles',        name: 'Koi',         tier: 2, class: 'Aquatic', trait: 'Bastion',  atk: 40, hp: 700, range: 1, mystic: false,
    attack: 'Tail Slap',      skill: 'Current Guard shields the lowest-HP ally for 200 and grants CC immunity',
    art: { horn: 'crest',   mouth: 'smile',  back: 'shell', tail: 'fin' } },
  { id: 'ginger', skillKey: 'yggdrasil',     name: 'Ginger',      tier: 2, class: 'Plant',   trait: 'Mage',     atk: 44, hp: 580, range: 3, mystic: true,
    attack: 'Root Bolt',      skill: 'Spice Bloom roots and stuns every enemy for 150 magic dmg',
    art: { horn: 'bud',     mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'trifeather', skillKey: 'nemo', name: 'Tri Feather', tier: 2, class: 'Bird',    trait: 'Spikes',   atk: 50, hp: 560, range: 2, mystic: false,
    attack: 'Quill Jab',      skill: 'Quill Flurry strikes 3x for 50 dmg and gains +25% reflect',
    art: { horn: 'feather', mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'leafbug', skillKey: 'raven',    name: 'Leaf Bug',    tier: 2, class: 'Bug',     trait: 'Sniper',   atk: 48, hp: 540, range: 4, mystic: false,
    attack: 'Sap Shot',       skill: 'Sap Volley hits the whole row for 200 dmg, executes under 25% HP',
    art: { horn: 'frond',   mouth: 'pincer', back: 'leaf',  tail: 'leafy' } },
  { id: 'kotaro', skillKey: 'gnasher',     name: 'Kotaro',      tier: 2, class: 'Reptile', trait: 'Vanguard', atk: 60, hp: 720, range: 1, mystic: false,
    attack: 'Kotaro Bite',    skill: 'Kotaro Bite deals 120 dmg and shreds the target armor',
    art: { horn: 'spike',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },

  // ---- Tier 3 ----
  { id: 'riskybeast', skillKey: 'pumpkin', name: 'Risky Beast', tier: 3, class: 'Beast',   trait: 'Bastion',  atk: 55, hp: 1000, range: 1, mystic: false,
    attack: 'Reckless Ram',   skill: 'Gamble Guard taunts within 2 hexes and cuts damage taken by 50%',
    art: { horn: 'spike',   mouth: 'grin',   back: 'none',  tail: 'stub' } },
  { id: 'anemone', skillKey: 'siren',    name: 'Anemone',     tier: 3, class: 'Aquatic', trait: 'Mage',     atk: 58, hp: 830, range: 3, mystic: true,
    attack: 'Sting Bolt',     skill: 'Anemone Lure charms the nearest enemy for 3.5s',
    art: { horn: 'frond',   mouth: 'kiss',   back: 'none',  tail: 'coil' } },
  { id: 'cucumber', skillKey: 'cactus',   name: 'Cucumber',    tier: 3, class: 'Plant',   trait: 'Spikes',   atk: 52, hp: 950, range: 1, mystic: false,
    attack: 'Vine Whip',      skill: 'Thorn Coat bursts every adjacent enemy for 75 magic dmg',
    art: { horn: 'twig',    mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'cupid', skillKey: 'falcon',      name: 'Cupid',       tier: 3, class: 'Bird',    trait: 'Sniper',   atk: 55, hp: 700, range: 4, mystic: false,
    attack: 'Heart Arrow',    skill: 'Heart Arrow deals 130 dmg and knocks the target back 2 rows',
    art: { horn: 'fin',     mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'sandal', skillKey: 'nut',     name: 'Sandal',      tier: 3, class: 'Bug',     trait: 'Vanguard', atk: 62, hp: 900, range: 1, mystic: false,
    attack: 'Stomp',          skill: 'Swarm Stomp cleaves the 3 hexes ahead for 110 dmg',
    art: { horn: 'spike',   mouth: 'pincer', back: 'spike', tail: 'stub' } },
  { id: 'scalyspear', skillKey: 'zoro', name: 'Scaly Spear', tier: 3, class: 'Reptile', trait: 'Assassin', atk: 65, hp: 780, range: 1, mystic: false,
    attack: 'Spear Thrust',   skill: 'Scale Dash blinks behind the target and hits for 140 dmg',
    art: { horn: 'twig',    mouth: 'fang',   back: 'sail',  tail: 'spiky' } },

  // ---- Tier 4 ----
  { id: 'goda', skillKey: 'goliath',       name: 'Goda',        tier: 4, class: 'Beast',   trait: 'Mage',     atk: 72, hp: 1050, range: 3, mystic: true,
    attack: 'Astral Howl',    skill: 'Moon Chorus stuns a 1-hex circle for 2.5s and deals 100 true dmg',
    art: { horn: 'crown',   mouth: 'grin',   back: 'none',  tail: 'coil' } },
  { id: 'hermit', skillKey: 'nemo',     name: 'Hermit',      tier: 4, class: 'Aquatic', trait: 'Spikes',   atk: 60, hp: 1250, range: 1, mystic: false,
    attack: 'Shell Bash',     skill: 'Shell Fortress strikes 3x for 50 dmg and gains +25% reflect',
    art: { horn: 'shell',   mouth: 'smile',  back: 'shell', tail: 'stub' } },
  { id: 'bidens', skillKey: 'raven',     name: 'Bidens',      tier: 4, class: 'Plant',   trait: 'Sniper',   atk: 66, hp: 900, range: 5, mystic: false,
    attack: 'Seed Volley',    skill: 'Bloom Volley hits the whole row for 200 dmg, executes under 25% HP',
    art: { horn: 'frond',   mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'kingfisher', skillKey: 'gnasher', name: 'Kingfisher',  tier: 4, class: 'Bird',    trait: 'Vanguard', atk: 70, hp: 1100, range: 1, mystic: false,
    attack: 'Dive Beak',      skill: 'Dive Beak deals 120 dmg and shreds the target armor',
    art: { horn: 'crest',   mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'pliers', skillKey: 'kestrel',     name: 'Pliers',      tier: 4, class: 'Bug',     trait: 'Assassin', atk: 78, hp: 920, range: 1, mystic: false,
    attack: 'Clamp',          skill: 'Sever leaps untargetable and slams the lowest-HP enemy for 160 dmg',
    art: { horn: 'twig',    mouth: 'pincer', back: 'spike', tail: 'spiky' } },
  { id: 'bonesail', skillKey: 'goliath',   name: 'Bone Sail',   tier: 4, class: 'Reptile', trait: 'Bastion',  atk: 62, hp: 1350, range: 1, mystic: false,
    attack: 'Sail Slam',      skill: 'Quake Guard stuns a 1-hex circle for 2.5s and deals 100 true dmg',
    art: { horn: 'crest',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },

  // ---- Tier 5: the canonical starter Axies ----
  { id: 'buba', skillKey: 'chonky',       name: 'Buba',        tier: 5, class: 'Beast',   trait: 'Vanguard', atk: 88, hp: 1600, range: 1, mystic: false,
    attack: 'Buba Bash',      skill: 'Bash N Brawl crushes for 150 dmg plus 25% of the target max HP',
    art: { horn: 'crown',   mouth: 'grin',   back: 'none',  tail: 'spiky' } },
  { id: 'puffy', skillKey: 'immanuel',      name: 'Puffy',       tier: 5, class: 'Aquatic', trait: 'Mage',     atk: 80, hp: 1200, range: 4, mystic: true,
    attack: 'Bubble Bolt',    skill: 'Paddle Pool heals every ally for 300 and pushes enemies back 2 rows',
    art: { horn: 'fin',     mouth: 'kiss',   back: 'shell', tail: 'fin' } },
  { id: 'olek', skillKey: 'lotus',       name: 'Olek',        tier: 5, class: 'Plant',   trait: 'Bastion',  atk: 70, hp: 1700, range: 1, mystic: false,
    attack: 'Petal Slap',     skill: 'Evergreen Aura heals 5% max HP/s and revives once at 50% HP',
    art: { horn: 'crown',   mouth: 'smile',  back: 'leaf',  tail: 'leafy' } },
  { id: 'momo', skillKey: 'kallaway',       name: 'Momo',        tier: 5, class: 'Bird',    trait: 'Assassin', atk: 85, hp: 1180, range: 1, mystic: false,
    attack: 'Razor Wing',     skill: 'Marvelous Mayhem grants physical immunity and a 3s whirlwind',
    art: { horn: 'crown',   mouth: 'beak',   back: 'wing',  tail: 'feather' } },
  { id: 'pomodoro', skillKey: 'nemo',   name: 'Pomodoro',    tier: 5, class: 'Bug',     trait: 'Spikes',   atk: 95, hp: 1500, range: 1, mystic: false,
    attack: 'Vine Crush',     skill: 'Peculiar Thorns strikes 3x for 50 dmg and gains +25% reflect',
    art: { horn: 'antenna', mouth: 'pincer', back: 'leaf',  tail: 'leafy' } },
  { id: 'venoki', skillKey: 'raven',     name: 'Venoki',      tier: 5, class: 'Reptile', trait: 'Sniper',   atk: 82, hp: 1250, range: 5, mystic: false,
    attack: 'Venom Lance',    skill: 'Vortex Volley hits the whole row for 200 dmg, executes under 25% HP',
    art: { horn: 'crown',   mouth: 'fang',   back: 'sail',  tail: 'coil' } },
];
