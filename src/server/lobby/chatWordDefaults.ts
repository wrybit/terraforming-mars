import {LANGUAGE} from '../../common/constants';

// Default words the lobby chat masks, one list per app language: insults, sexual slurs, slurs against women, gay
// and trans people, disabled people, foreigners and ethnic groups, and far-right terms. Every list applies to every
// message (players write in mixed languages); the languages only keep the lists maintainable on the admin page.
//
// An entry also catches longer words it starts ("arsch" in "Arschloch", not in "Barsch"). So entries that start
// ordinary words of ANY language are left out, e.g. "homo" (homogen), "kut" (Kutsche), "kuk" (Finnish kukka),
// "negro" (Spanish and Portuguese for black), "fica" (Portuguese: stays), "paki" (Pakistan), "spic" (spicy),
// "cock" (cocktail), "fasz" (Faszination), "жид" (жидкий), "хер" (Херсон), "pikk" (Finnish pikku), "kusi" (Polish
// kusić), "dago" (Dagobert), "spaz" (Italian spazio), "конча" (кончать). Chinese and Japanese entries match anywhere
// in a text, those scripts have no spaces between words; so short ones that sit inside ordinary words are left out
// there too (カス in カスタム, デブ in デブリ, 日你 in 今日你好).
// The test of the chat filters checks a list of such ordinary words against all defaults.
export const DEFAULT_CHAT_WORDS: Readonly<Record<LANGUAGE, ReadonlyArray<string>>> = {
  en: [
    'arsehole', 'assclown', 'asshole', 'asswipe', 'bastard', 'beaner', 'bellend', 'bitch', 'bollocks', 'bullshit', 'ching chong',
    'chink', 'cocksucker', 'coon', 'cumdump', 'cumslut', 'cunt', 'dagos', 'darkie', 'dickhead', 'dipshit', 'douchebag', 'dumbass',
    'dumbfuck', 'dyke', 'f4ggot', 'fag', 'faggit', 'faggot', 'fatass', 'feminazi', 'fuck', 'gas the jews', 'gaylord', 'go back to africa',
    'golliwog', 'gook', 'half-breed', 'heil hitler', 'holohoax', 'honky', 'injuns', 'jigaboo', 'jizz', 'kike', 'kill yourself', 'kkk',
    'kys', 'lesbo', 'libtard', 'motherfucker', 'n1gga', 'n1gger', 'nigga', 'nigger', 'nignog', 'oven dodger', 'paedo', 'pikey', 'piss',
    'polack', 'poofter', 'porch monkey', 'pussy', 'raghead', 'rapist', 'redskin', 'retard', 'sandnigger', 'shemale', 'shit', 'sieg heil',
    'skank', 'slut', 'subhuman', 'towelhead', 'trannie', 'tranny', 'turd', 'twat', 'wanker', 'wetback', 'white power',
    'white pride', 'whore', 'wog', 'zipperhead', '1488',
  ],
  de: [
    'abschaum', 'affenarsch', 'arsch', 'arschgeige', 'arschloch', 'asoziale', 'ausländer raus', 'bastard', 'behindi', 'blödmann',
    'depp', 'deutschland den deutschen', 'drecks', 'drecksau', 'dreckskerl', 'dummfick', 'fettsack', 'fettschwein', 'fick',
    'flittchen', 'fotze', 'gaskammer', 'hackfresse', 'heil hitler', 'hirnamputiert', 'hohlbirne', 'hurensohn', 'hure', 'idiot',
    'judenpack', 'juden raus', 'judensau', 'judenschwein', 'kackbratze', 'kameltreiber', 'kampflesbe', 'kanacke', 'kanake',
    'kinderficker', 'kopftuchmädchen', 'krüppel', 'kümmeltürke', 'missgeburt', 'mistgeburt', 'nafri', 'nazi', 'neger', 'nutte',
    'penner', 'pimmel', 'pisser', 'pissnelke', 'polacke', 'rassenschande', 'saftsack', 'scheiß', 'scheiss', 'schlampe', 'schlitzauge',
    'schlitzi', 'schwachkopf', 'schwachmat', 'schwanzlutscher', 'schwuchtel', 'sieg heil', 'spacko', 'spast', 'spasti', 'stricher',
    'titten', 'transe', 'trottel', 'tunte', 'umvolkung', 'untermensch', 'vergasen', 'verpiss', 'volksverräter', 'vollidiot',
    'vollpfosten', 'votze', 'wichs', 'wichser', 'wixer', 'zigeuner',
  ],
  fr: [
    'abruti', 'baltringue', 'bamboula', 'bâtard', 'batard', 'bicot', 'boche', 'bougnoule', 'branleur', 'branleuse', 'casse-toi',
    'chienne', 'chinetoque', 'chintok', 'conasse', 'connard', 'connasse', 'couille', 'crétin', 'crouille', 'enculé', 'encule',
    'enculer', 'enfoiré', 'enfoire', 'fils de pute', 'garce', 'gouine', 'grognasse', 'merde', 'nègre', 'négresse', 'négro',
    'niakoué', 'nique', 'pédé', 'pétasse', 'pouffiasse', 'pute', 'putain', 'raclure', 'ritals', 'salaud', 'salope', 'sale arabe',
    'sale juif', 'sale noir', 'ta gueule', 'tafiole', 'tapette', 'tarlouze', 'travelo', 'trou du cul', 'va te faire', 'youpin',
  ],
  ru: [
    'ахуе', 'бля', 'выеб', 'гандон', 'гнида', 'говно', 'даун', 'дебил', 'дерьмо', 'долбан', 'долбоеб', 'долбоёб', 'еба', 'ебл', 'жидов',
    'жиды', 'заеб', 'залупа', 'зиг хайль', 'москаль', 'мразь', 'мудак', 'мудил', 'нахуй', 'нигер', 'обосра', 'отсос', 'падла',
    'пендос', 'педераст', 'педик', 'пидар', 'пидор', 'пизд', 'потаскуха', 'распизд', 'сдохни', 'срань', 'сука', 'сучк', 'тварь',
    'уеб', 'уёб', 'ублюдок', 'урод', 'хохлы', 'хохол', 'хуе', 'хуё', 'хуй', 'черномаз', 'черножоп', 'чмо', 'чурка', 'чучмек',
    'шалава', 'шлюха',
  ],
  cn: [
    '傻逼', '傻屄', '傻b', '煞笔', '草泥马', '草你妈', '操你妈', '肏', '妈逼', '他妈的', '你妈死了', '滚你妈', '屌', '鸡巴',
    '婊子', '绿茶婊', '骚货', '贱货', '贱人', '王八蛋', '狗日', '狗娘养', '杂种', '畜生', '蠢货', '废物', '死全家', '去死', '脑残',
    '智障', '黑鬼', '黑奴', '尼哥', '支那', '小日本', '日本鬼子', '鬼佬', '阿三', '基佬', '娘炮', '人妖',
  ],
  pl: [
    'brudas', 'chuj', 'ciapaty', 'ciota', 'cipa', 'ciul', 'cwel', 'czarnuch', 'debil', 'dupek', 'dziwka', 'gnój', 'gówno', 'huj',
    'idiota', 'jeba', 'jebać', 'jebac', 'jebany', 'jebn', 'kretyn', 'kurew', 'kurwa', 'kurwy', 'kutas', 'lesba', 'murzyn', 'pedał',
    'pierdol', 'pizda', 'pojeb', 'popapraniec', 'ruchać', 'skurwysyn', 'spierdal', 'sukinsyn', 'szmata', 'wypierdal', 'zjeb', 'żydek',
  ],
  es: [
    'bollera', 'boludo', 'cabrón', 'cabron', 'carajo', 'chinga', 'concha de tu madre', 'conchetumare', 'coño', 'culero', 'follar',
    'gilipollas', 'hijo de puta', 'hijueputa', 'imbécil', 'joder', 'jodido', 'joto', 'malnacido', 'malparido', 'mamaguevo', 'mamón',
    'marica', 'maricón', 'maricon', 'marimacho', 'mariposón', 'mierda', 'mongólico', 'negrata', 'pajero', 'pelotudo', 'pendejo',
    'pinche', 'polla', 'puta', 'puto', 'retrasado', 'sarasa', 'sidoso', 'subnormal', 'sudaca', 'tarado', 'tortillera', 'travelo', 'verga',
    'zorra',
  ],
  br: [
    'arrombada', 'arrombado', 'babaca', 'baitola', 'boiola', 'bosta', 'buceta', 'cacete', 'caralho', 'corno', 'crioulo', 'cuzão',
    'desgraçado', 'escroto', 'fdp', 'filha da puta', 'filho da puta', 'foda-se', 'foder', 'fodido', 'imbecil', 'merda', 'mongoloide',
    'otário', 'pau no cu', 'porra', 'punheteiro', 'puta', 'putinha', 'retardado', 'safado', 'sapatão', 'tição', 'traveco', 'vadia',
    'vagabunda', 'vai se foder', 'vai tomar no cu', 'viado', 'xoxota',
  ],
  it: [
    'bagascia', 'baldracca', 'bastardo', 'bocchinara', 'cagna', 'cazzo', 'checca', 'coglione', 'cornuto', 'culattone', 'dio cane',
    'fottiti', 'fottuto', 'frocio', 'imbecille', 'mignotta', 'minchia', 'mongoloide', 'muso giallo', 'negraccio', 'porca madonna',
    'porco dio', 'puttana', 'ricchione', 'rincoglionito', 'ritardato', 'sborra', 'segaiolo', 'sfigato', 'stronza', 'stronzo',
    'succhiacazzi', 'terrone', 'troia', 'troione', 'vaffanculo', 'zingaro', 'zoccola',
  ],
  ko: [
    'ㅂㅅ', 'ㅅㅂ', '개같은', '개년', '개놈', '개새끼', '걸레년', '게이새끼', '김치녀', '꺼져', '꼴통', '느금마', '니거', '니애미',
    '닥쳐', '된장녀', '등신', '또라이', '똥남아', '미친년', '미친놈', '미친새끼', '병신', '보지', '븅신', '빡대가리', '시발', '썅',
    '씨발', '씨팔', '씹', '애미', '엠창', '자지', '좆', '지랄', '짱깨', '쪽바리', '창녀', '튀기', '한남충', '호로', '흑형',
  ],
  nl: [
    'aars', 'achterlijk', 'debiel', 'flikker', 'godver', 'godverdomme', 'hoer', 'kanker', 'klootzak', 'kuthoer', 'kutwijf', 'kutzooi',
    'lesbo', 'makak', 'mietje', 'mongool', 'neger', 'nikker', 'pokkenlijer', 'potenrammer', 'schijt', 'slet', 'sodemieter', 'sukkel',
    'tering', 'trut', 'tyfus', 'zwartjoekel',
  ],
  hu: [
    'anyád', 'baszd meg', 'bazdmeg', 'bazmeg', 'buzeráns', 'buzi', 'büdös cigány', 'faszfej', 'faszkalap', 'faszság',
    'fasszopó', 'geci', 'hülye', 'idióta', 'kibaszott', 'köcsög', 'kurva', 'lófasz', 'mocskos', 'néger', 'nyomorék', 'picsa', 'pöcs',
    'retardált', 'retkes', 'ribanc', 'seggfej', 'szarházi', 'szarjál', 'szopj',
  ],
  jp: [
    'キチガイ', '気違い', 'きちがい', 'クズ', 'クソ野郎', '馬鹿野郎', '死ね', '殺すぞ', 'くたばれ', '消えろ', 'キモい', 'ブス', 'ビッチ',
    'ヤリマン', 'まんこ', 'ちんこ', 'ちんぽ', 'チョン', 'チャンコロ', 'ジャップ', 'ニガー', '黒んぼ', '土人', '支那人', 'オカマ',
    'ガイジ', '池沼',
  ],
  bg: [
    'гъз', 'да ти еба', 'дебил', 'еба ти', 'идиот', 'копеле', 'кучи син', 'курва', 'лайно', 'майна', 'мангал', 'мръсник', 'педал',
    'педераст', 'пиклю', 'пичка', 'путка', 'седесар', 'скапаняк', 'тъпак', 'тъпанар', 'урод', 'чернилка', 'шибан',
  ],
  nb: [
    'drittsekk', 'faen', 'fanden', 'fitta', 'fitte', 'føkk', 'helvete', 'hestkuk', 'homse', 'horebukk', 'horunge', 'jævel', 'jævla',
    'kødd', 'kuksuger', 'neger', 'pakkis', 'rasshøl', 'soper', 'svarting', 'svartskalle', 'tulling',
  ],
  ua: [
    'бидло', 'блядь', 'виблядок', 'гівно', 'дебіл', 'довбень', 'довбойоб', 'жиди', 'засранець', 'їба', 'йобан', 'кацап', 'курва',
    'лайно', 'мразь', 'мудак', 'нахуй', 'підар', 'підор', 'пізд', 'повія', 'покидьок', 'русня', 'срака', 'сука', 'тварюка', 'уйобок',
    'хуй', 'хуйло', 'чмо', 'чурка', 'шльондра', 'шмара',
  ],
  fi: [
    'haista vittu', 'hintti', 'huora', 'jumalauta', 'kusipää', 'kyrpä', 'lutka', 'mulkku', 'mutakuono', 'neekeri', 'paska',
    'paskiainen', 'perkele', 'pillu', 'runkkari', 'ryssä', 'saatana', 'vittu', 'vitun',
  ],
};
