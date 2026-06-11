export type CreatureId =
  | 'egg'
  | 'blobby'
  | 'sunnling'
  | 'grumbit'
  | 'wisp'
  | 'puffi'
  | 'grimble'
  | 'lumix'
  | 'gloom'
  | 'phantom';

export interface CreatureData {
  id: CreatureId;
  name: string;
  description: string;
  palette: Record<string, string>;
  idleFrames: string[][];
  sleepFrames: string[][];
  eatFrames: string[][];
  happyFrames: string[][];
}

// ─── Sprite conventions ──────────────────────────────────────────────────────
// Each sprite is a 16×16 character grid.  '.' = transparent; every other char
// maps to an entry in that creature's `palette`.
//
// Shared palette keys across creatures:
//   o = outline        h = highlight       e = eye
//   s = shade          m = mouth           f = closed-eye line
//
// Bodies sit with their feet on row 14 so the renderer's drop shadow at the
// row below grounds them.

const EGG: CreatureData = {
  id: 'egg', name: 'Egg', description: 'Something is stirring inside…',
  palette: {
    o: '#6B4A26',   // outline
    a: '#F5E6C8',   // cream body
    b: '#FFFBEE',   // highlight spot
    c: '#CBA86E',   // shadow (bottom)
    d: '#8A5A28',   // crack line
  },
  idleFrames: [
    [
      '................',
      '................',
      '......oooo......',
      '.....oaaaao.....',
      '....oabbaaao....',
      '...oabbaaaaao...',
      '...oaadaaaaao...',
      '..oaaaadaaaaao..',
      '..oaaadaaaaaao..',
      '..oaaaaaaaaaao..',
      '..oaaaaaaaccao..',
      '..oaacccccccao..',
      '...oaccccccao...',
      '....oaccccao....',
      '.....oooooo.....',
      '................',
    ],
    [
      '................',
      '................',
      '......oooo......',
      '.....oaaaao.....',
      '....oabbaaao....',
      '...oabbadaaao...',
      '...oaadaaaaao...',
      '..oaaaaddaaaao..',
      '..oaaadaaaaaao..',
      '..oaaaaaaaaaao..',
      '..oaaaaaaaccao..',
      '..oaacccccccao..',
      '...oaccccccao...',
      '....oaccccao....',
      '.....oooooo.....',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '......oooo......',
    '.....oaaaao.....',
    '....oabbaaao....',
    '...oabbaaaaao...',
    '...oaaaaaaaao...',
    '..oaaaaaaaaaao..',
    '..oaaaaaaaaaao..',
    '..oaaaaaaaaaao..',
    '..oaaaaaaaccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ]],
  eatFrames: [[
    '................',
    '................',
    '......oooo......',
    '.....oaaaao.....',
    '....oabbaaao....',
    '...oabbaaaaao...',
    '...oaadaaaaao...',
    '..oaaaadaaaaao..',
    '..oaaadaaaaaao..',
    '..oaaaaaaaaaao..',
    '..oaaaaaaaccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ]],
  happyFrames: [[
    '................',
    '................',
    '......oooo......',
    '.....oaaaao.....',
    '....oabbaaao....',
    '...oabbadaaao...',
    '...oaadaaaaao...',
    '..oaaaaddaaaao..',
    '..oaaadaaaaaao..',
    '..oaaaaaaaaaao..',
    '..oaaaaaaaccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ]],
};

// ─── BLOBBY — round peach blob, soft and simple (legacy starter) ─────────────
const BLOBBY: CreatureData = {
  id: 'blobby', name: 'Blobby', description: 'A curious little blob. Always hungry.',
  palette: {
    o: '#7A4A2A',   // outline
    b: '#FFD9A8',   // peach body
    h: '#FFF1DC',   // sheen
    d: '#E0A870',   // shade
    e: '#33221A',   // eye
    m: '#E06A5A',   // mouth
    f: '#33221A',   // closed-eye line
    k: '#FFAD9E',   // blush
  },
  idleFrames: [
    // eyes open
    [
      '................',
      '................',
      '................',
      '.....oooooo.....',
      '....obbbbbbo....',
      '...obhhbbbbbo...',
      '..obhbbbbbbbbo..',
      '..obbebbbbebbo..',
      '..obbebbbbebbo..',
      '..obbbbbbbbbbo..',
      '..okbbbmmbbbko..',
      '..obbbbbbbbdbo..',
      '..obbbbbbbdddo..',
      '...obbbbbdddo...',
      '....oooooooo....',
      '................',
    ],
    // blink
    [
      '................',
      '................',
      '................',
      '.....oooooo.....',
      '....obbbbbbo....',
      '...obhhbbbbbo...',
      '..obhbbbbbbbbo..',
      '..obbbbbbbbbbo..',
      '..obbfbbbbfbbo..',
      '..obbbbbbbbbbo..',
      '..okbbbmmbbbko..',
      '..obbbbbbbbdbo..',
      '..obbbbbbbdddo..',
      '...obbbbbdddo...',
      '....oooooooo....',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obhhbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obffbbbbffbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbdbo..',
    '..obbbbbbbdddo..',
    '...obbbbbdddo...',
    '....oooooooo....',
    '................',
  ]],
  eatFrames: [[
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obhhbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obbebbbbebbo..',
    '..obbebbbbebbo..',
    '..obbbbbbbbbbo..',
    '..okbbmmmmbbko..',
    '..obbbmmmmbbdo..',
    '..obbbbbbbdddo..',
    '...obbbbbdddo...',
    '....oooooooo....',
    '................',
  ]],
  happyFrames: [[
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....obbbbbbo....',
    '...obhhbbbbbo...',
    '..obhbbbbbbbbo..',
    '..obbebbbbebbo..',
    '..obbebbbbebbo..',
    '..obmbbbbbbmbo..',
    '..okbmmmmmmbko..',
    '..obbbbbbbbdbo..',
    '..obbbbbbbdddo..',
    '...obbbbbdddo...',
    '....oooooooo....',
    '................',
  ]],
};

// ─── SUNNLING — cheerful golden chick with a three-spike crown ───────────────
const SUNNLING: CreatureData = {
  id: 'sunnling', name: 'Sunnling', description: 'A cheerful hatchling bursting with warmth.',
  palette: {
    o: '#7A5A10',   // outline
    y: '#FFD966',   // golden body
    h: '#FFF2B0',   // sheen
    s: '#E0A820',   // shade
    e: '#3A2A10',   // eye
    m: '#FF8C2A',   // beak / feet
    f: '#3A2A10',   // closed-eye line
    c: '#FFB838',   // crown spikes
  },
  idleFrames: [
    [
      '................',
      '.....c..c..c....',
      '.....c..c..c....',
      '...oooooooooo...',
      '..oyhhyyyyyyyo..',
      '..oyhyyyyyyyso..',
      '.oyyeyyyyyyeyso.',
      '.oyyeyyyyyyeyso.',
      '.oyyyyyyyyyyyso.',
      '.oyyyymmmmyyyso.',
      '.oyyyyymmyyyyso.',
      '..oyyyyyyyyyso..',
      '..osyyyyyyysso..',
      '...osssssssso...',
      '....mm....mm....',
      '................',
    ],
    [
      '................',
      '................',
      '.....c..c..c....',
      '...oooooooooo...',
      '..oyhhyyyyyyyo..',
      '..oyhyyyyyyyso..',
      '.oyyyyyyyyyyyso.',
      '.oyyfyyyyyyfyso.',
      '.oyyyyyyyyyyyso.',
      '.oyyyymmmmyyyso.',
      '.oyyyyymmyyyyso.',
      '..oyyyyyyyyyso..',
      '..osyyyyyyysso..',
      '...osssssssso...',
      '....mm....mm....',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '.....c..c..c....',
    '...oooooooooo...',
    '..oyhhyyyyyyyo..',
    '..oyhyyyyyyyso..',
    '.oyyyyyyyyyyyso.',
    '.oyyfyyyyyyfyso.',
    '.oyyyyyyyyyyyso.',
    '.oyyyyymmyyyyso.',
    '.oyyyyyyyyyyyso.',
    '..oyyyyyyyyyso..',
    '..osyyyyyyysso..',
    '...osssssssso...',
    '....mm....mm....',
    '................',
  ]],
  eatFrames: [[
    '................',
    '.....c..c..c....',
    '.....c..c..c....',
    '...oooooooooo...',
    '..oyhhyyyyyyyo..',
    '..oyhyyyyyyyso..',
    '.oyyeyyyyyyeyso.',
    '.oyyeyyyyyyeyso.',
    '.oyyyyyyyyyyyso.',
    '.oyyymmmmmmyyso.',
    '.oyyyymmmmyyyso.',
    '..oyyyyyyyyyso..',
    '..osyyyyyyysso..',
    '...osssssssso...',
    '....mm....mm....',
    '................',
  ]],
  happyFrames: [[
    '................',
    '.....c..c..c....',
    '.....c..c..c....',
    '...oooooooooo...',
    '..oyhhyyyyyyyo..',
    '..oyhyyyyyyyso..',
    '.oyyeyyyyyyeyso.',
    '.oyyeyyyyyyeyso.',
    '.oyymyyyyyymyso.',
    '.oyyymmmmmmyyso.',
    '.oyyyyyyyyyyyso.',
    '..oyyyyyyyyyso..',
    '..osyyyyyyysso..',
    '...osssssssso...',
    '....mm....mm....',
    '................',
  ]],
};

// ─── GRUMBIT — blocky blue-gray tank with heavy brows and fangs ──────────────
const GRUMBIT: CreatureData = {
  id: 'grumbit', name: 'Grumbit', description: 'Gruff and sturdy. Don\'t mess with it.',
  palette: {
    o: '#16324A',   // outline
    b: '#7AABD4',   // blue body
    h: '#B8D8EE',   // sheen
    s: '#4A7AA0',   // shade / brows
    e: '#0A2040',   // eye
    m: '#28527A',   // mouth
    w: '#E8F4FF',   // fang
    f: '#0A2040',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '................',
      '..oooooooooooo..',
      '..ohbbbbbbbbho..',
      '..obbbbbbbbbbo..',
      '..obssbbbbssbo..',
      '..obeebbbbeebo..',
      '..obbbbbbbbbbo..',
      '..obmmmmmmmmbo..',
      '..obwbbbbbbwbo..',
      '..obbbbbbbbbbo..',
      '..osbbbbbbbbso..',
      '..osssssssssso..',
      '..oooooooooooo..',
      '...oo......oo...',
      '................',
    ],
    [
      '................',
      '................',
      '..oooooooooooo..',
      '..ohbbbbbbbbho..',
      '..obbbbbbbbbbo..',
      '..obssbbbbssbo..',
      '..obffbbbbffbo..',
      '..obbbbbbbbbbo..',
      '..obmmmmmmmmbo..',
      '..obwbbbbbbwbo..',
      '..obbbbbbbbbbo..',
      '..osbbbbbbbbso..',
      '..osssssssssso..',
      '..oooooooooooo..',
      '...oo......oo...',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '..oooooooooooo..',
    '..ohbbbbbbbbho..',
    '..obbbbbbbbbbo..',
    '..obssbbbbssbo..',
    '..obffbbbbffbo..',
    '..obbbbbbbbbbo..',
    '..obbbmmmmbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..osbbbbbbbbso..',
    '..osssssssssso..',
    '..oooooooooooo..',
    '...oo......oo...',
    '................',
  ]],
  eatFrames: [[
    '................',
    '................',
    '..oooooooooooo..',
    '..ohbbbbbbbbho..',
    '..obbbbbbbbbbo..',
    '..obssbbbbssbo..',
    '..obeebbbbeebo..',
    '..obbbbbbbbbbo..',
    '..obmwmmmmwmbo..',
    '..obmmmmmmmmbo..',
    '..obbbbbbbbbbo..',
    '..osbbbbbbbbso..',
    '..osssssssssso..',
    '..oooooooooooo..',
    '...oo......oo...',
    '................',
  ]],
  happyFrames: [[
    '................',
    '................',
    '..oooooooooooo..',
    '..ohbbbbbbbbho..',
    '..obbbbbbbbbbo..',
    '..obssbbbbssbo..',
    '..obeebbbbeebo..',
    '..obbbbbbbbbbo..',
    '..obmbbbbbbmbo..',
    '..obbmmmmmmbbo..',
    '..obbbbbbbbbbo..',
    '..osbbbbbbbbso..',
    '..osssssssssso..',
    '..oooooooooooo..',
    '...oo......oo...',
    '................',
  ]],
};

// ─── WISP — lavender ghost with huge glowing eyes and a curling tail ─────────
const WISP: CreatureData = {
  id: 'wisp', name: 'Wisp', description: 'Ethereal and elusive. Sees right through you.',
  palette: {
    o: '#3A1A66',   // outline
    w: '#C4A0E8',   // lavender body
    h: '#EBDCFF',   // sheen
    s: '#9A78C8',   // shade
    e: '#2E1054',   // big dark eye
    m: '#5A3A8E',   // mouth
    f: '#3A1060',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '.....oooooo.....',
      '....owwwwwwo....',
      '...owhwwwwwwo...',
      '..owhwwwwwwwwo..',
      '..oweewwwweewo..',
      '..oweewwwweewo..',
      '..owwwwwwwwwwo..',
      '..owwwwmmwwwwo..',
      '..owwwwwwwwsso..',
      '..owwwwwwwwsso..',
      '...owwwwwwwso...',
      '....owwwwwso....',
      '.....owwso......',
      '......oso.......',
      '................',
    ],
    [
      '................',
      '.....oooooo.....',
      '....owwwwwwo....',
      '...owhwwwwwwo...',
      '..owhwwwwwwwwo..',
      '..oweewwwweewo..',
      '..oweewwwweewo..',
      '..owwwwwwwwwwo..',
      '..owwwwmmwwwwo..',
      '..owwwwwwwwsso..',
      '..owwwwwwwwsso..',
      '...owwwwwwwso...',
      '....owwwwwso....',
      '......owwso.....',
      '.......oso......',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '.....oooooo.....',
    '....owwwwwwo....',
    '...owhwwwwwwo...',
    '..owhwwwwwwwwo..',
    '..owwwwwwwwwwo..',
    '..owffwwwwffwo..',
    '..owwwwwwwwwwo..',
    '..owwwwwwwwwwo..',
    '..owwwwwwwwsso..',
    '..owwwwwwwwsso..',
    '...owwwwwwwso...',
    '....owwwwwso....',
    '.....owwso......',
    '......oso.......',
    '................',
  ]],
  eatFrames: [[
    '................',
    '.....oooooo.....',
    '....owwwwwwo....',
    '...owhwwwwwwo...',
    '..owhwwwwwwwwo..',
    '..oweewwwweewo..',
    '..oweewwwweewo..',
    '..owwwwwwwwwwo..',
    '..owwwwmmwwwwo..',
    '..owwwwmmwwsso..',
    '..owwwwwwwwsso..',
    '...owwwwwwwso...',
    '....owwwwwso....',
    '.....owwso......',
    '......oso.......',
    '................',
  ]],
  happyFrames: [[
    '................',
    '.....oooooo.....',
    '....owwwwwwo....',
    '...owhwwwwwwo...',
    '..owhwwwwwwwwo..',
    '..oweewwwweewo..',
    '..oweewwwweewo..',
    '..owwmwwwwmwwo..',
    '..owwwmmmmwwwo..',
    '..owwwwwwwwsso..',
    '..owwwwwwwwsso..',
    '...owwwwwwwso...',
    '....owwwwwso....',
    '.....owwso......',
    '......oso.......',
    '................',
  ]],
};

// ─── PUFFI — pink cat-puff with perky ears and a big smile ───────────────────
const PUFFI: CreatureData = {
  id: 'puffi', name: 'Puffi', description: 'Round and bouncy. Loves to play.',
  palette: {
    o: '#8A3050',   // outline
    p: '#FFB3C6',   // pink body
    h: '#FFE0E8',   // sheen
    s: '#E08CA8',   // shade
    e: '#3A1A28',   // eye
    m: '#C82A50',   // mouth
    k: '#FF7FA0',   // blush / inner ear
    f: '#3A1A28',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '..o..........o..',
      '.oko........oko.',
      '.okpoooooooopko.',
      '.oppppppppppppo.',
      '.opphpppppphppo.',
      '.oppeeppppeeppo.',
      '.oppeeppppeeppo.',
      '.opkppppppppkpo.',
      '.oppmppppppmppo.',
      '.oppppmmmmppppo.',
      '.oppppppppppsso.',
      '..opppppppppso..',
      '...opppppppso...',
      '...opp....ppo...',
      '................',
    ],
    [
      '................',
      '..o..........o..',
      '.oko........oko.',
      '.okpoooooooopko.',
      '.oppppppppppppo.',
      '.opphpppppphppo.',
      '.oppppppppppppo.',
      '.oppffppppffppo.',
      '.opkppppppppkpo.',
      '.oppmppppppmppo.',
      '.oppppmmmmppppo.',
      '.oppppppppppsso.',
      '..opppppppppso..',
      '...opppppppso...',
      '...opp....ppo...',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '..o..........o..',
    '.oko........oko.',
    '.okpoooooooopko.',
    '.oppppppppppppo.',
    '.opphpppppphppo.',
    '.oppppppppppppo.',
    '.oppffppppffppo.',
    '.oppppppppppppo.',
    '.opppppmmpppppo.',
    '.oppppppppppppo.',
    '.oppppppppppsso.',
    '..opppppppppso..',
    '...opppppppso...',
    '...opp....ppo...',
    '................',
  ]],
  eatFrames: [[
    '................',
    '..o..........o..',
    '.oko........oko.',
    '.okpoooooooopko.',
    '.oppppppppppppo.',
    '.opphpppppphppo.',
    '.oppeeppppeeppo.',
    '.oppeeppppeeppo.',
    '.opkppppppppkpo.',
    '.opppppmmpppppo.',
    '.opppppmmpppppo.',
    '.oppppppppppsso.',
    '..opppppppppso..',
    '...opppppppso...',
    '...opp....ppo...',
    '................',
  ]],
  happyFrames: [[
    '................',
    '..o..........o..',
    '.oko........oko.',
    '.okpoooooooopko.',
    '.oppppppppppppo.',
    '.opphpppppphppo.',
    '.oppeeppppeeppo.',
    '.oppeeppppeeppo.',
    '.opkppppppppkpo.',
    '.oppmppppppmppo.',
    '.opppmmmmmmpppo.',
    '.oppppppppppsso.',
    '..opppppppppso..',
    '...opppppppso...',
    '...opp....ppo...',
    '................',
  ]],
};

// ─── GRIMBLE — five-spined grouch with a permanent zigzag scowl ──────────────
const GRIMBLE: CreatureData = {
  id: 'grimble', name: 'Grimble', description: 'Five-spined grouch. Grumpy but mighty.',
  palette: {
    o: '#243A4A',   // outline
    g: '#8BAAC4',   // blue-gray body
    h: '#C8DCEA',   // spike tips / sheen
    s: '#5A7A90',   // shade / brows
    e: '#14242F',   // eye
    m: '#2A3F52',   // mouth
    f: '#14242F',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '..h..h..h..h..h.',
      '..s..s..s..s..s.',
      '.oooooooooooooo.',
      '.oghgggggggghgo.',
      '.oggssggggssggo.',
      '.oggeeggggeeggo.',
      '.oggggggggggggo.',
      '.oggmggmmggmggo.',
      '.ogggmmggmmgggo.',
      '.oggggggggggggo.',
      '.osgggggggggsgo.',
      '.ossggggggggsso.',
      '..osssssssssso..',
      '...oo......oo...',
      '................',
    ],
    [
      '................',
      '................',
      '..s..s..s..s..s.',
      '.oooooooooooooo.',
      '.oghgggggggghgo.',
      '.oggssggggssggo.',
      '.oggffggggffggo.',
      '.oggggggggggggo.',
      '.oggmggmmggmggo.',
      '.ogggmmggmmgggo.',
      '.oggggggggggggo.',
      '.osgggggggggsgo.',
      '.ossggggggggsso.',
      '..osssssssssso..',
      '...oo......oo...',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '..s..s..s..s..s.',
    '.oooooooooooooo.',
    '.oghgggggggghgo.',
    '.oggggggggggggo.',
    '.oggffggggffggo.',
    '.oggggggggggggo.',
    '.oggggmmmmggggo.',
    '.oggggggggggggo.',
    '.oggggggggggggo.',
    '.osgggggggggsgo.',
    '.ossggggggggsso.',
    '..osssssssssso..',
    '...oo......oo...',
    '................',
  ]],
  eatFrames: [[
    '................',
    '..h..h..h..h..h.',
    '..s..s..s..s..s.',
    '.oooooooooooooo.',
    '.oghgggggggghgo.',
    '.oggssggggssggo.',
    '.oggeeggggeeggo.',
    '.oggggggggggggo.',
    '.ogggmmmmmmgggo.',
    '.ogggmmmmmmgggo.',
    '.oggggggggggggo.',
    '.osgggggggggsgo.',
    '.ossggggggggsso.',
    '..osssssssssso..',
    '...oo......oo...',
    '................',
  ]],
  happyFrames: [[
    '................',
    '..h..h..h..h..h.',
    '..s..s..s..s..s.',
    '.oooooooooooooo.',
    '.oghgggggggghgo.',
    '.oggssggggssggo.',
    '.oggeeggggeeggo.',
    '.oggggggggggggo.',
    '.oggmggggggmggo.',
    '.ogggmmmmmmgggo.',
    '.oggggggggggggo.',
    '.osgggggggggsgo.',
    '.ossggggggggsso.',
    '..osssssssssso..',
    '...oo......oo...',
    '................',
  ]],
};

// ─── LUMIX — radiant star-being ringed with golden rays ──────────────────────
const LUMIX: CreatureData = {
  id: 'lumix', name: 'Lumix', description: 'A radiant being of pure joy.',
  palette: {
    o: '#8A5A00',   // outline
    l: '#FFD700',   // gold body
    h: '#FFF8C0',   // sheen
    s: '#E0A800',   // shade
    e: '#FF6B00',   // fiery eye
    m: '#E04400',   // mouth
    r: '#FFE680',   // rays
    f: '#CC8800',   // closed-eye line
  },
  idleFrames: [
    [
      '.......rr.......',
      '.......rr.......',
      '....r..rr..r....',
      '....oooooooo....',
      '...olhhlllllo...',
      '..olhlllllllso..',
      'r.oleelllleelo.r',
      'r.oleelllleelo.r',
      '..olllllllllso..',
      '..olllmmmmllso..',
      '..ollllllllsso..',
      '...ollllllsso...',
      '....ollllsso....',
      '.....oooooo.....',
      '.......rr.......',
      '................',
    ],
    [
      '.......rr.......',
      '................',
      '..r....rr....r..',
      '....oooooooo....',
      '...olhhlllllo...',
      '..olhlllllllso..',
      '..oleelllleelo..',
      'r.oleelllleelo.r',
      '..olllllllllso..',
      '..olllmmmmllso..',
      '..ollllllllsso..',
      '...ollllllsso...',
      '....ollllsso....',
      '.....oooooo.....',
      '.......rr.......',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '.......rr.......',
    '................',
    '....oooooooo....',
    '...olhhlllllo...',
    '..olhlllllllso..',
    '..olllllllllso..',
    '..olfflllfflso..',
    '..olllllllllso..',
    '..ollllmmlllso..',
    '..ollllllllsso..',
    '...ollllllsso...',
    '....ollllsso....',
    '.....oooooo.....',
    '................',
    '................',
  ]],
  eatFrames: [[
    '.......rr.......',
    '.......rr.......',
    '....r..rr..r....',
    '....oooooooo....',
    '...olhhlllllo...',
    '..olhlllllllso..',
    'r.oleelllleelo.r',
    'r.oleelllleelo.r',
    '..olllllllllso..',
    '..ollllmmlllso..',
    '..ollllmmllsso..',
    '...ollllllsso...',
    '....ollllsso....',
    '.....oooooo.....',
    '.......rr.......',
    '................',
  ]],
  happyFrames: [[
    '.......rr.......',
    '.......rr.......',
    '....r..rr..r....',
    '....oooooooo....',
    '...olhhlllllo...',
    '..olhlllllllso..',
    'r.oleelllleelo.r',
    'r.oleelllleelo.r',
    '..ollmllllmlso..',
    '..olllmmmmllso..',
    '..ollllllllsso..',
    '...ollllllsso...',
    '....ollllsso....',
    '.....oooooo.....',
    '.......rr.......',
    '................',
  ]],
};

// ─── GLOOM — droopy teardrop, heavy lids, one rolling tear ───────────────────
const GLOOM: CreatureData = {
  id: 'gloom', name: 'Gloom', description: 'Tired eyes, heavy heart. Still here.',
  palette: {
    o: '#161C26',   // outline
    g: '#5C6B82',   // slate body
    h: '#8B9CB4',   // sheen
    s: '#39434F',   // shade / lids
    e: '#0E141C',   // sunken eye
    m: '#222B38',   // frown
    t: '#A8C8E8',   // tear
    f: '#0E141C',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '.......oo.......',
      '......oggo......',
      '.....oggggo.....',
      '....oggggggo....',
      '...oghggggggo...',
      '..oghggggggggo..',
      '..ogssggggssgo..',
      '..ogeeggggeego..',
      '..oggggggggggo..',
      '..ogggmmmmgggo..',
      '..oggmggggmggo..',
      '..osggggggggso..',
      '..osssssssssso..',
      '...oooooooooo...',
      '................',
    ],
    [
      '................',
      '.......oo.......',
      '......oggo......',
      '.....oggggo.....',
      '....oggggggo....',
      '...oghggggggo...',
      '..oghggggggggo..',
      '..ogssggggssgo..',
      '..ogeeggggeego..',
      '..oggggggggtgo..',
      '..ogggmmmmgggo..',
      '..oggmggggmggo..',
      '..osggggggggso..',
      '..osssssssssso..',
      '...oooooooooo...',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '.......oo.......',
    '......oggo......',
    '.....oggggo.....',
    '....oggggggo....',
    '...oghggggggo...',
    '..oghggggggggo..',
    '..oggggggggggo..',
    '..ogffggggffgo..',
    '..oggggggggggo..',
    '..ogggmmmmgggo..',
    '..oggggggggggo..',
    '..osggggggggso..',
    '..osssssssssso..',
    '...oooooooooo...',
    '................',
  ]],
  eatFrames: [[
    '................',
    '.......oo.......',
    '......oggo......',
    '.....oggggo.....',
    '....oggggggo....',
    '...oghggggggo...',
    '..oghggggggggo..',
    '..ogssggggssgo..',
    '..ogeeggggeego..',
    '..oggggggggggo..',
    '..oggggmmggggo..',
    '..oggggmmggggo..',
    '..osggggggggso..',
    '..osssssssssso..',
    '...oooooooooo...',
    '................',
  ]],
  happyFrames: [[
    '................',
    '.......oo.......',
    '......oggo......',
    '.....oggggo.....',
    '....oggggggo....',
    '...oghggggggo...',
    '..oghggggggggo..',
    '..ogssggggssgo..',
    '..ogeeggggeego..',
    '..oggggggggggo..',
    '..oggmggggmggo..',
    '..ogggmmmmgggo..',
    '..osggggggggso..',
    '..osssssssssso..',
    '...oooooooooo...',
    '................',
  ]],
};

// ─── PHANTOM — violet specter with glowing slanted eyes ──────────────────────
const PHANTOM: CreatureData = {
  id: 'phantom', name: 'Phantom', description: '??? — A secret born of neglect.',
  palette: {
    o: '#1E0838',   // outline
    p: '#4C1D95',   // deep violet body
    e: '#F2EAFF',   // glowing eyes
    m: '#6D28D9',   // mouth / detail
    w: '#7C3AED',   // inner wave
    g: '#A78BFA',   // shimmer
    f: '#2A0F50',   // closed-eye line
  },
  idleFrames: [
    [
      '................',
      '..g..........g..',
      '....oooooooo....',
      '...oppppppppo...',
      '..oppppppppppo..',
      '..opepppppppeo..',
      '..oppeeppeeppo..',
      '..oppppppppppo..',
      '..opppmmmmpppo..',
      '..oppppppppppo..',
      '..opwppppppwpo..',
      '..oppppppppppo..',
      '..opp.pp.pp.po..',
      '....w...w..w....',
      '................',
      '................',
    ],
    [
      '................',
      '.....g.....g....',
      '....oooooooo....',
      '...oppppppppo...',
      '..oppppppppppo..',
      '..opepppppppeo..',
      '..oppeeppeeppo..',
      '..oppppppppppo..',
      '..opppmmmmpppo..',
      '..oppppppppppo..',
      '..oppwppppwppo..',
      '..oppppppppppo..',
      '..op.pp.pp.ppo..',
      '...w...w...w....',
      '................',
      '................',
    ],
  ],
  sleepFrames: [[
    '................',
    '................',
    '....oooooooo....',
    '...oppppppppo...',
    '..oppppppppppo..',
    '..oppppppppppo..',
    '..opffppppffpo..',
    '..oppppppppppo..',
    '..opppmmmmpppo..',
    '..oppppppppppo..',
    '..opwppppppwpo..',
    '..oppppppppppo..',
    '..opp.pp.pp.po..',
    '................',
    '................',
    '................',
  ]],
  eatFrames: [[
    '................',
    '..g..........g..',
    '....oooooooo....',
    '...oppppppppo...',
    '..oppppppppppo..',
    '..opepppppppeo..',
    '..oppeeppeeppo..',
    '..oppppppppppo..',
    '..opppmmmmpppo..',
    '..oppppmmppppo..',
    '..opwppppppwpo..',
    '..oppppppppppo..',
    '..opp.pp.pp.po..',
    '....w...w..w....',
    '................',
    '................',
  ]],
  happyFrames: [[
    '................',
    '..g..........g..',
    '....oooooooo....',
    '...oppppppppo...',
    '..oppppppppppo..',
    '..opepppppppeo..',
    '..oppeeppeeppo..',
    '..opmppppppmpo..',
    '..oppmmmmmmppo..',
    '..oppppppppppo..',
    '..opwppppppwpo..',
    '..oppppppppppo..',
    '..opp.pp.pp.po..',
    '....w...w..w....',
    '................',
    '................',
  ]],
};

export const CREATURES: Record<CreatureId, CreatureData> = {
  egg: EGG, blobby: BLOBBY,
  sunnling: SUNNLING, grumbit: GRUMBIT, wisp: WISP,
  puffi: PUFFI, grimble: GRIMBLE,
  lumix: LUMIX, gloom: GLOOM, phantom: PHANTOM,
};

// ─── Lineage egg sprites ──────────────────────────────────────────────────────
// Each lineage gets a distinct egg shape + palette shown in StarterPicker
// and in-game while the pet is still an egg.

export const LINEAGE_EGG_FRAMES: Record<string, string[]> = {
  sunny: [
    // Wide & squat, big highlight, diagonal crack on the left
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....oabbaaao....',
    '...oabbaaaaao...',
    '..oabbaaaaaaao..',
    '..oadaaaaaaaao..',
    '..oaadaaaaaaao..',
    '..oadaaaaaccao..',
    '..oaaaaaccccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ],
  stormy: [
    // Tall & pointed, zigzag lightning crack down the middle
    '................',
    '.......oo.......',
    '......oaao......',
    '.....oabbao.....',
    '.....oabbao.....',
    '....oaadaaao....',
    '....oadaaaao....',
    '...oaaadaaaao...',
    '...oaadaaaaao...',
    '...oaaadaaaao...',
    '..oaaaaaaaccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ],
  misty: [
    // Round, swirling crack curling from the upper-left
    '................',
    '................',
    '.....oooooo.....',
    '....oabaaaao....',
    '...oabbadaaao...',
    '..oaaadaaaaaao..',
    '..oaadaaaaaaao..',
    '..oaaadaaaaaao..',
    '..oaaaadaaaaao..',
    '..oaaaaadaacao..',
    '..oaaaaaaaccao..',
    '..oaacccccccao..',
    '...oaccccccao...',
    '....oaccccao....',
    '.....oooooo.....',
    '................',
  ],
};

export const LINEAGE_EGG_PALETTES: Record<string, Record<string, string>> = {
  sunny:  { o: '#7A4A00', a: '#FFE566', b: '#FFF8BB', c: '#CC8800', d: '#FF6600' },
  stormy: { o: '#0A1E30', a: '#7AABD4', b: '#C0DDF0', c: '#2E5A7A', d: '#16324A' },
  misty:  { o: '#2A1040', a: '#C4A8D8', b: '#E8D8F8', c: '#6B4A8A', d: '#3A1A5C' },
};

// ─── Evolution tree ──────────────────────────────────────────────────────────

export function getEvolution(
  current: CreatureId,
  careScore: number,
  neglectCount: number,
  lineage?: string,
): CreatureId | null {
  switch (current) {
    case 'egg':
      if (lineage === 'stormy') return 'grumbit';
      if (lineage === 'misty')  return 'wisp';
      return 'sunnling';
    // legacy saves
    case 'blobby': {
      if (neglectCount >= 8) return 'phantom';
      const puffiThreshold = lineage === 'sunny' ? 50 : 60;
      return careScore >= puffiThreshold ? 'puffi' : 'grimble';
    }
    case 'sunnling':
      if (neglectCount >= 8) return 'grimble';
      return careScore >= 55 ? 'puffi' : 'grimble';
    case 'grumbit':
      return neglectCount >= 6 ? 'gloom' : 'grimble';
    case 'wisp':
      return 'phantom';
    case 'puffi':   return 'lumix';
    case 'grimble': return neglectCount >= 4 ? 'phantom' : 'gloom';
    default:        return null;
  }
}

// Hours of real time before evolution triggers
export const EVOLUTION_HOURS: Partial<Record<CreatureId, number>> = {
  egg:      0.083,  // ~5 min
  blobby:   24,     // legacy
  sunnling: 24,
  grumbit:  24,
  wisp:     24,
  puffi:    72,
  grimble:  72,
};
