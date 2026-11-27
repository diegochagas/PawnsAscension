// EN/PT strings. Every visible text goes through t().

const STRINGS = {
  en: {
    title: "PAWN'S ASCENSION", subtitle: 'Eternal Boards', press: 'Press Enter',
    new_game: 'New Game', continue: 'Continue', survive: 'Survive Mode', language: 'Português',
    controls: '←→ move · Z attack · X jump · C power · A/S switch form · Q sub-weapon · ↓ interact · Esc pause',
    intro1: 'The Black King has frozen the Chess Kingdom in an endless check.',
    intro2: 'In the dungeon of the training field, a forgotten pawn awakens.',
    intro3: 'Climb the castle. Earn your promotions. Break the check.',
    area_field: "Pawns' Training Field", area_woods: 'Ambush Woods', area_cliffs: 'Iron Cliffs',
    area_forge: 'Forge of the Black Pieces', area_battle: 'Abandoned Battlefield', area_castle: 'Castle of Shadows',
    lv: 'LV', hp: 'HP', mp: 'MP', essence: 'Essence',
    pause_map: 'Map', pause_status: 'Status', pause_resume: 'Resume', pause_quit: 'Quit to Title',
    rest: 'Rest at the bonfire', warp: 'Warp to', saved: 'The bard plays. Game saved.',
    got_rook: 'Promotion: ROOK — C to dash through cracked walls',
    got_knight: 'Promotion: KNIGHT — jump again in mid-air',
    got_bishop: 'Promotion: BISHOP — C casts a diagonal bolt that shatters crystal',
    got_queen: 'Promotion: QUEEN — every power, greater strength',
    got_slide: 'Relic: EN PASSANT BOOTS — as a Pawn, ↓+X slides through low gaps',
    got_shard: 'Crown Shard — max HP up', got_crystal: 'Mana Crystal — max MP up',
    switch_hint: 'A/S switch form', seal: 'Boss seal claimed', level_up: 'LEVEL UP!',
    door_sealed: 'Sealed by five boss seals', form: 'Form', forms: 'Promotions', relics: 'Relics',
    seals: 'Seals', time: 'Time', explored: 'Explored', level: 'Level', atk: 'ATK', def: 'DEF',
    exp: 'EXP', next: 'Next',
    f_pawn: 'Pawn', f_rook: 'Rook', f_knight: 'Knight', f_bishop: 'Bishop', f_queen: 'Queen',
    p_pawn: 'Slide (with relic)', p_rook: 'Dash, breaks cracked walls', p_knight: 'Double jump',
    p_bishop: 'Diagonal bolt, ↑+C heal', p_queen: 'All powers',
    dead: 'CHECKMATE', dead_hint: 'Enter: return to the last bonfire',
    victory: 'The King falls. The board is free.', victory2: 'Thank you for playing.',
    boss_captain: 'Pawn Captain', boss_thorn: 'Thorn Knight', boss_ironrook: 'Iron Rook',
    boss_forge: 'Forge Bishop', boss_queen: 'Black Queen', boss_king: 'The Immobile King',
    wave: 'Wave', survive_over: 'Survived {n} waves', best: 'Best',
  },
  pt: {
    title: 'A ASCENSÃO DO PEÃO', subtitle: 'Eternal Boards', press: 'Aperte Enter',
    new_game: 'Novo Jogo', continue: 'Continuar', survive: 'Modo Sobrevivência', language: 'English',
    controls: '←→ mover · Z ataque · X pulo · C poder · A/S trocar forma · Q arma secundária · ↓ interagir · Esc pausa',
    intro1: 'O Rei Negro congelou o Reino do Xadrez num xeque sem fim.',
    intro2: 'Na masmorra do campo de treino, um peão esquecido desperta.',
    intro3: 'Escale o castelo. Conquiste suas promoções. Quebre o xeque.',
    area_field: 'Campo de Treinamento dos Peões', area_woods: 'Bosque das Emboscadas', area_cliffs: 'Penhascos de Ferro',
    area_forge: 'A Forja das Peças Negras', area_battle: 'Campo de Batalha Abandonado', area_castle: 'Castelo das Sombras',
    lv: 'NV', hp: 'PV', mp: 'PM', essence: 'Essência',
    pause_map: 'Mapa', pause_status: 'Status', pause_resume: 'Voltar', pause_quit: 'Sair para o título',
    rest: 'Descansar na fogueira', warp: 'Viajar para', saved: 'O bardo toca. Jogo salvo.',
    got_rook: 'Promoção: TORRE — C para investir e quebrar paredes rachadas',
    got_knight: 'Promoção: CAVALO — pule de novo no ar',
    got_bishop: 'Promoção: BISPO — C lança um raio diagonal que quebra cristais',
    got_queen: 'Promoção: RAINHA — todos os poderes, mais força',
    got_slide: 'Relíquia: BOTAS EN PASSANT — como Peão, ↓+X desliza por frestas baixas',
    got_shard: 'Fragmento da Coroa — PV máximo maior', got_crystal: 'Cristal de Mana — PM máximo maior',
    switch_hint: 'A/S trocar forma', seal: 'Selo do chefe conquistado', level_up: 'SUBIU DE NÍVEL!',
    door_sealed: 'Selada pelos cinco selos dos chefes', form: 'Forma', forms: 'Promoções', relics: 'Relíquias',
    seals: 'Selos', time: 'Tempo', explored: 'Explorado', level: 'Nível', atk: 'ATQ', def: 'DEF',
    exp: 'EXP', next: 'Próx.',
    f_pawn: 'Peão', f_rook: 'Torre', f_knight: 'Cavalo', f_bishop: 'Bispo', f_queen: 'Rainha',
    p_pawn: 'Deslizar (com relíquia)', p_rook: 'Investida, quebra paredes', p_knight: 'Pulo duplo',
    p_bishop: 'Raio diagonal, ↑+C cura', p_queen: 'Todos os poderes',
    dead: 'XEQUE-MATE', dead_hint: 'Enter: voltar à última fogueira',
    victory: 'O Rei cai. O tabuleiro está livre.', victory2: 'Obrigado por jogar.',
    boss_captain: 'Capitão Peão', boss_thorn: 'Cavaleiro dos Espinhos', boss_ironrook: 'Torre de Ferro',
    boss_forge: 'Bispo da Forja', boss_queen: 'Rainha Negra', boss_king: 'O Rei Imóvel',
    wave: 'Onda', survive_over: 'Sobreviveu a {n} ondas', best: 'Recorde',
  },
};

let lang = 'en';

/**
 * Translate a key, filling {placeholders}.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string} the key itself when missing, so gaps are visible
 * @example t('survive_over', { n: 3 })
 */
export function t(key, vars = {}) {
  const text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

/** @returns {'en'|'pt'} */
export function getLang() {
  return lang;
}

/** @param {'en'|'pt'} next */
export function setLang(next) {
  if (!STRINGS[next]) throw new Error(`unknown language "${next}" (expected en or pt)`);
  lang = next;
}

/** All keys per language (for the i18n completeness test). */
export function keysOf(code) {
  return Object.keys(STRINGS[code]);
}
