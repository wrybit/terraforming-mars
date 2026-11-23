import {LANGUAGE} from '../../common/constants';

// Default words the lobby chat masks, one list per app language: insults, sexual slurs, slurs against women, gay
// and trans people, disabled people, foreigners and ethnic groups, and far-right terms. Every list applies to every
// message (players write in mixed languages); the languages only keep the lists maintainable on the admin page.
//
// An entry also catches longer words it starts ("arsch" in "Arschloch", not in "Barsch"). So entries that start
// ordinary words of ANY language are left out, e.g. German "homo" (homogen), Dutch "kut" (German Kutsche),
// Norwegian "kuk" (Finnish kukka = flower), "negro" (Spanish and Portuguese for black), "fica" (Portuguese: stays),
// "paki" (Pakistan), "spic" (spicy), Hungarian "fasz" (Faszination), Russian "жид" (жидкий = liquid).
// Chinese and Japanese entries match anywhere in a text: those scripts have no spaces between words.
export const DEFAULT_CHAT_WORDS: Readonly<Record<LANGUAGE, ReadonlyArray<string>>> = {
  en: [
    'asshole', 'bastard', 'beaner', 'bitch', 'bullshit', 'chink', 'cocksucker', 'coon', 'cunt', 'dickhead', 'dumbass', 'dyke',
    'fag', 'faggot', 'feminazi', 'fuck', 'gas the jews', 'gook', 'heil hitler', 'jigaboo', 'kike', 'kill yourself', 'kys', 'motherfucker',
    'nigga', 'nigger', 'piss', 'porch monkey', 'pussy', 'raghead', 'retard', 'sandnigger', 'shemale', 'shit', 'sieg heil',
    'skank', 'slut', 'subhuman', 'towelhead', 'tranny', 'twat', 'wanker', 'wetback', 'white power', 'whore', '1488',
  ],
  de: [
    'arsch', 'arschgeige', 'arschloch', 'bastard', 'depp', 'drecksau', 'dreckskerl', 'fick', 'flittchen', 'fotze', 'hackfresse',
    'heil hitler', 'hurensohn', 'hure', 'idiot', 'judenpack', 'judensau', 'kackbratze', 'kameltreiber', 'kampflesbe', 'kanacke',
    'kanake', 'kümmeltürke', 'missgeburt', 'mistgeburt', 'nafri', 'nazi', 'neger', 'nutte', 'penner', 'pisser', 'rassenschande',
    'scheiß', 'scheiss', 'schlampe', 'schlitzauge', 'schwanzlutscher', 'schwuchtel', 'sieg heil', 'spast', 'spasti', 'transe',
    'trottel', 'tunte', 'umvolkung', 'untermensch', 'verpiss', 'volksverräter', 'vollidiot', 'votze', 'wichser', 'wixer', 'zigeuner',
  ],
  fr: [
    'bamboula', 'bâtard', 'batard', 'bougnoule', 'chinetoque', 'connard', 'connasse', 'crouille', 'enculé', 'encule', 'enfoiré',
    'enfoire', 'fils de pute', 'gouine', 'merde', 'nègre', 'négro', 'nique ta mère', 'pédé', 'pétasse', 'pute', 'putain',
    'salope', 'sale arabe', 'sale juif', 'sale noir', 'tapette', 'travelo', 'youpin',
  ],
  ru: [
    'бля', 'гандон', 'долбоеб', 'долбоёб', 'еба', 'ебл', 'жиды', 'жидов', 'заеб', 'зиг хайль', 'москаль', 'мудак', 'нахуй', 'пидор', 'пидар',
    'педик', 'пизд', 'сдохни', 'сука', 'хохол', 'хуй', 'хуе', 'хуё', 'чурка', 'черножоп', 'шлюха',
  ],
  cn: [
    '傻逼', '傻屄', '煞笔', '草泥马', '操你妈', '肏你', '他妈的', '婊子', '贱人', '王八蛋', '狗娘养', '黑鬼', '支那', '小日本',
    '日本鬼子', '基佬', '人妖', '尼哥', '脑残', '智障', '去死',
  ],
  pl: [
    'chuj', 'ciapaty', 'ciota', 'cwel', 'czarnuch', 'debil', 'dziwka', 'huj', 'jebać', 'jebac', 'jebany', 'kurwa', 'kurwy', 'kutas',
    'murzyn', 'pedał', 'pierdol', 'pizda', 'skurwysyn', 'spierdal', 'szmata', 'zjeb',
  ],
  es: [
    'cabrón', 'cabron', 'chinga', 'coño', 'culero', 'gilipollas', 'hijo de puta', 'joto', 'mamón', 'marica', 'maricón', 'maricon',
    'mierda', 'mongólico', 'negrata', 'pendejo', 'puta', 'puto', 'retrasado', 'subnormal', 'sudaca', 'tortillera', 'travelo', 'verga',
    'zorra',
  ],
  br: [
    'arrombado', 'babaca', 'buceta', 'caralho', 'crioulo', 'cuzão', 'desgraçado', 'fdp', 'filho da puta', 'foda-se', 'merda',
    'mongoloide', 'otário', 'porra', 'puta', 'retardado', 'sapatão', 'traveco', 'vagabunda', 'viado',
  ],
  it: [
    'bastardo', 'cazzo', 'coglione', 'dio cane', 'frocio', 'mignotta', 'mongoloide', 'porco dio', 'puttana', 'ricchione',
    'ritardato', 'stronza', 'stronzo', 'terrone', 'troia', 'vaffanculo', 'zingaro',
  ],
  ko: [
    '개새끼', '걸레년', '게이새끼', '김치녀', '꺼져', '니거', '된장녀', '미친년', '미친놈', '병신', '보지', '시발', '씨발', '씨팔',
    '자지', '좆', '지랄', '짱깨', '쪽바리', '한남충',
  ],
  nl: [
    'flikker', 'godverdomme', 'hoer', 'kanker', 'klootzak', 'kutwijf', 'mietje', 'mongool', 'neger', 'slet', 'tering', 'trut', 'tyfus',
  ],
  hu: [
    'baszd meg', 'bazdmeg', 'buzi', 'faszfej', 'geci', 'köcsög', 'kurva', 'néger', 'nyomorék', 'picsa', 'retardált', 'ribanc', 'szarházi',
  ],
  jp: [
    'クソ野郎', '馬鹿野郎', '死ね', '殺すぞ', 'キモい', 'ブス', 'チョン', 'ニガー', '黒んぼ', '支那人', 'オカマ', 'ガイジ',
    'まんこ', 'ちんこ',
  ],
  bg: [
    'гъз', 'да ти еба', 'еба ти', 'копеле', 'курва', 'лайно', 'майна', 'мангал', 'педал', 'педераст', 'путка', 'тъпанар', 'шибан',
  ],
  nb: [
    'drittsekk', 'faen', 'fitte', 'homse', 'horunge', 'jævla', 'jævel', 'neger', 'pakkis', 'soper', 'svarting',
  ],
  ua: [
    'блядь', 'довбойоб', 'жиди', 'засранець', 'кацап', 'курва', 'мудак', 'підар', 'підор', 'пізд', 'повія', 'русня', 'сука', 'хуй',
    'хуйло', 'чурка', 'шльондра',
  ],
  fi: [
    'haista vittu', 'hintti', 'huora', 'jumalauta', 'kusipää', 'kyrpä', 'lutka', 'mulkku', 'mutakuono', 'neekeri', 'paska', 'perkele',
    'ryssä', 'saatana', 'vittu',
  ],
};
