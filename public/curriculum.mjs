/**
 * Singapore Primary 1 Chinese practice companion.
 * Lesson titles and character requirements are factual curriculum metadata.
 * All focus-word glosses, teaching tips and practice sentences were written for
 * this app. They are supplementary practice, not textbook passages.
 * Source checks and their access limitations are recorded in ../sources/README.md.
 */

const officialUrl = 'https://www.moe.gov.sg/-/media/files/primary/2024-character-list-primary-one-to-two-chinese.pdf';

export const course = {
  title: '小一华文乐园',
  subtitle: 'A little Chinese, every day',
  edition: '欢乐伙伴 2.0 · Standard Chinese · Primary 1',
  level: 'P1',
  verifiedAt: '2026-10-08',
  contentNote: 'All 19 lesson themes and their recognition/writing lists, with original guided practice. Focus words may include oral vocabulary before children are expected to read or write every character.',
  sources: [
    { label: 'MOE character requirements', url: officialUrl, note: '2024 Primary 1–2 standard Chinese character list. Official indexed text and public lesson lists were checked; direct PDF retrieval was unavailable during this build.' },
    { label: 'Lesson titles and sequence', url: 'https://dao.sg/syllabus/2340074', note: 'Dao: 欢乐伙伴 2.0 lesson order and titles. Its character lists differ from the standard MOE requirements, so this app uses MOE character requirements instead. Checked 8 October 2026.' },
    { label: 'Character-list cross-check', url: 'https://www.an2.net/zh-tw/tools/primary-characters/sg', note: 'Independent public transcription. All 38 Primary 1 recognition/writing lists matched the indexed standard MOE table.' }
  ]
};

const words = (...rows) => rows.map(([hanzi, pinyin, english, emoji]) => ({ hanzi, pinyin, english, emoji }));
const practice = (...rows) => rows.map(([zh, pinyin, en, pieces]) => ({ zh, pinyin, en, pieces }));
const sound = (label, syllables, tip) => ({ label, syllables, tip });

const characterSets = {
  1: { recognition: [...'衣鱼雨一二五耳牙口人'], writing: [...'一二五口人'], sourceUrl: 'https://dao.sg/lesson/2340078' },
  2: { recognition: [...'木土马八巴你我也他弟不爸她妈的父母女儿'], writing: [...'木土八也不女儿'], sourceUrl: 'https://dao.sg/lesson/2340080' },
  3: { recognition: [...'力河禾立米合气和哥几七了个句可以吗去'], writing: [...'力禾几七个可去'], sourceUrl: 'https://dao.sg/lesson/2340082' },
  4: { recognition: [...'日石子字车四十士只把尺是书出自己它吃'], writing: [...'日子车四十巴士只'], sourceUrl: 'https://dao.sg/lesson/2340084' },
  5: { recognition: [...'山羊毛草太阳王三伞包老师早安半午奶玩具'], writing: [...'山羊毛王三书早午'], sourceUrl: 'https://dao.sg/lesson/2340086' },
  6: { recognition: [...'鸟竹田苗象家刀网在里上下大小来哭笑男爷姐'], writing: [...'田刀在上下大小来'], sourceUrl: 'https://dao.sg/lesson/2340088' },
  7: { recognition: [...'果开瓜火花叶面关朵两片画笔长广多少床'], writing: [...'开火关两长广多少'], sourceUrl: 'https://dao.sg/lesson/2340090' },
  8: { recognition: [...'目舌手足本工厂走跑飞妹门看见问又头们身体'], writing: [...'目手本工门见又头'], sourceUrl: 'https://dao.sg/lesson/2340092' },
  9: { recognition: [...'牛井虫弓贝心豆六支条九粒今什么华文点说语'], writing: [...'牛贝六支九什么文'], sourceUrl: 'https://dao.sg/lesson/2340094' },
  10: { recognition: [...'月天地风雷电水寸方正反白好坏对古旧有没云'], writing: [...'月天水寸正反白古'], sourceUrl: 'https://dao.sg/lesson/2340096' },
  11: { recognition: [...'甲丁前后左右中间边同学朋友坐高发直起回周末'], writing: [...'后左右中间面的同学画回'], sourceUrl: 'https://dao.sg/lesson/2340102' },
  12: { recognition: [...'鸡饭鸭元饿饱饼干狗喜欢肉猫采歌唱青菜汤蛋香'], writing: [...'包半元吃干肉虫今米豆'], sourceUrl: 'https://dao.sg/lesson/2340104' },
  13: { recognition: [...'用刷巾抹洗要脸放冲凉东西到先请很泡变谢'], writing: [...'用牙巾以要东西雨马先点'], sourceUrl: 'https://dao.sg/lesson/2340106' },
  14: { recognition: [...'这双袜那皮鞋件服被还色红都动作快收拾穿事做'], writing: [...'是皮衣和里尺还自己好'], sourceUrl: 'https://dao.sg/lesson/2340108' },
  15: { recognition: [...'甜苦臭生重喝甘汁买斤串弯选最抱拿办法圆切怎'], writing: [...'生果汁买斤它办法看'], sourceUrl: 'https://dao.sg/lesson/2340110' },
  16: { recognition: [...'扫户桌椅兄房阿叔会写啊完业躲进净谁打听声'], writing: [...'父母她他会你们爸妈打'], sourceUrl: 'https://dao.sg/lesson/2340112' },
  17: { recognition: [...'昨晚星明庆祝节爱给国乐课台讲故每童因为'], writing: [...'昨明给快乐没有这老师每'], sourceUrl: 'https://dao.sg/lesson/2340114' },
  18: { recognition: [...'兔尾短眼睛爪尖物虎狮园期带黑站叫认话再孩'], writing: [...'爪尖气玩我弟妹站叫再'], sourceUrl: 'https://dao.sg/lesson/2340116' },
  19: { recognition: [...'组屋公校场商店梯扶常球步图习伙伴游拍兴戏'], writing: [...'公园姐哥习起到高兴心'], sourceUrl: 'https://dao.sg/lesson/2340118' },
};

// App-authored pronunciation aids for common readings in the lesson's topic.
// These are not additional MOE character requirements or a full dictionary.
const contextualReadings = {
  7: { 长: 'cháng' }, // length
  11: { 发: 'fà' }, // hair when describing a classmate
  12: { 干: 'gān' }, // 饼干
  13: { 抹: 'mā' }, // 抹布
  15: { 重: 'zhòng', 切: 'qiē' }, // weight and cutting fruit
  17: { 乐: 'lè', 为: 'wèi' }, // 快乐 and 因为
  18: { 爪: 'zhuǎ' }, // an animal's claws
  19: { 兴: 'xìng' } // 高兴
};

// Speak these whole words/phrases to give device TTS the pronunciation context.
const contextualExamples = {
  7: { 长: '长短' },
  11: { 发: '头发' },
  12: { 干: '饼干' },
  13: { 抹: '抹布' },
  15: { 重: '很重', 切: '切西瓜' },
  17: { 乐: '快乐', 为: '因为' },
  18: { 爪: '爪子' },
  19: { 兴: '高兴' }
};

const lessonContent = [
  {
    id: 1, book: '1A', title: '我上学了', pinyin: 'Wǒ shàngxué le', english: 'I have started school', theme: 'starting school', emoji: '🎒',
    focus: words(
      ['学校', 'xuéxiào', 'school', '🏫'],
      ['衣', 'yī', 'clothes', '👕'],
      ['鱼', 'yú', 'fish', '🐟'],
      ['雨', 'yǔ', 'rain', '🌧️'],
      ['口', 'kǒu', 'mouth', '👄'],
      ['人', 'rén', 'person', '🧍'],
      ['耳', 'ěr', 'ear', '👂']
    ),
    sentences: practice(
      ['我看见一条鱼。', 'Wǒ kànjiàn yì tiáo yú.', 'I see a fish.', ['我', '看见', '一条', '鱼']],
      ['下雨了。', 'Xià yǔ le.', 'It is raining.', ['下雨', '了']],
      ['我背着书包去学校。', 'Wǒ bēizhe shūbāo qù xuéxiào.', 'I carry my schoolbag to school.', ['我', '背着书包', '去', '学校']]
    ),
    pinyinFocus: sound('Hear the tone', ['yī', 'yú', 'yǔ'], 'Listen to 衣, 鱼 and 雨. The tone changes the word. Point to the matching picture, then say it.')
  },
  {
    id: 2, book: '1A', title: '你家有几个人', pinyin: 'Nǐ jiā yǒu jǐ ge rén', english: 'How many people are in your family?', theme: 'family', emoji: '🏠',
    focus: words(
      ['爸爸', 'bàba', 'dad', '👨'],
      ['妈妈', 'māma', 'mum', '👩'],
      ['弟弟', 'dìdi', 'younger brother', '👦'],
      ['我', 'wǒ', 'I; me', '🙋'],
      ['你', 'nǐ', 'you', '🫵'],
      ['木', 'mù', 'wood', '🪵'],
      ['马', 'mǎ', 'horse', '🐴']
    ),
    sentences: practice(
      ['爸爸和我一起画画。', 'Bàba hé wǒ yìqǐ huàhuà.', 'Dad and I draw together.', ['爸爸', '和我', '一起', '画画']],
      ['弟弟有一匹小马。', 'Dìdi yǒu yì pǐ xiǎo mǎ.', 'My younger brother has a little horse.', ['弟弟', '有', '一匹', '小马']],
      ['妈妈也喜欢看书。', 'Māma yě xǐhuan kàn shū.', 'Mum likes reading too.', ['妈妈', '也', '喜欢', '看书']]
    ),
    pinyinFocus: sound('Mum and a horse', ['mā', 'má', 'mǎ', 'mà'], 'Say the four tones slowly. 妈 mā has a high, level tone; 马 mǎ has a dipping tone.')
  },
  {
    id: 3, book: '1A', title: '今天是我的生日', pinyin: 'Jīntiān shì wǒ de shēngrì', english: 'Today is my birthday', theme: 'birthdays', emoji: '🎂',
    focus: words(
      ['生日', 'shēngrì', 'birthday', '🎂'],
      ['哥哥', 'gēge', 'older brother', '🧑'],
      ['七', 'qī', 'seven', '7️⃣'],
      ['米', 'mǐ', 'uncooked rice', '🌾'],
      ['河', 'hé', 'river', '🏞️'],
      ['可以', 'kěyǐ', 'may; can', '✅'],
      ['去', 'qù', 'go', '🚶']
    ),
    sentences: practice(
      ['哥哥送我七支笔。', 'Gēge sòng wǒ qī zhī bǐ.', 'My older brother gives me seven pens.', ['哥哥', '送我', '七支', '笔']],
      ['我们可以去河边吗？', 'Wǒmen kěyǐ qù hébiān ma?', 'May we go to the riverside?', ['我们', '可以', '去河边', '吗']],
      ['生日那天我很开心。', 'Shēngrì nà tiān wǒ hěn kāixīn.', 'I feel happy on my birthday.', ['生日那天我', '很', '开心']]
    ),
    pinyinFocus: sound('A gentle puff', ['gē', 'kě', 'hé'], 'Listen to the beginning of each syllable. Keep g, k and h short before the vowel.')
  },
  {
    id: 4, book: '1A', title: '我喜欢打篮球', pinyin: 'Wǒ xǐhuan dǎ lánqiú', english: 'I like playing basketball', theme: 'playtime', emoji: '🏀',
    focus: words(
      ['篮球', 'lánqiú', 'basketball', '🏀'],
      ['喜欢', 'xǐhuan', 'like', '💛'],
      ['四', 'sì', 'four', '4️⃣'],
      ['十', 'shí', 'ten', '🔟'],
      ['书', 'shū', 'book', '📘'],
      ['尺', 'chǐ', 'ruler', '📏'],
      ['车', 'chē', 'vehicle', '🚗']
    ),
    sentences: practice(
      ['我和姐姐打篮球。', 'Wǒ hé jiějie dǎ lánqiú.', 'My older sister and I play basketball.', ['我', '和姐姐', '打', '篮球']],
      ['这里有四本书。', 'Zhèlǐ yǒu sì běn shū.', 'There are four books here.', ['这里', '有', '四本', '书']],
      ['弟弟喜欢红色的车。', 'Dìdi xǐhuan hóngsè de chē.', 'My younger brother likes red cars.', ['弟弟', '喜欢', '红色的', '车']]
    ),
    pinyinFocus: sound('Four or ten?', ['sì', 'shí', 'shū', 'chǐ'], 'Listen carefully to 四 sì and 十 shí. The sounds at the start are different.')
  },
  {
    id: 5, book: '1A', title: '现在几点', pinyin: 'Xiànzài jǐ diǎn', english: 'What time is it now?', theme: 'daily routines', emoji: '🕒',
    focus: words(
      ['早安', 'zǎo ān', 'good morning', '🌅'],
      ['老师', 'lǎoshī', 'teacher', '🧑‍🏫'],
      ['太阳', 'tàiyáng', 'sun', '☀️'],
      ['三', 'sān', 'three', '3️⃣'],
      ['半', 'bàn', 'half', '◐'],
      ['午', 'wǔ', 'noon', '🌞'],
      ['羊', 'yáng', 'sheep', '🐑']
    ),
    sentences: practice(
      ['我对老师说早安。', 'Wǒ duì lǎoshī shuō zǎo ān.', 'I say good morning to my teacher.', ['我', '对老师', '说', '早安']],
      ['我们三点半去玩。', 'Wǒmen sān diǎn bàn qù wán.', 'We go to play at half past three.', ['我们三点半', '去', '玩']],
      ['太阳出来了。', 'Tàiyáng chūlái le.', 'The sun has come out.', ['太阳', '出来', '了']]
    ),
    pinyinFocus: sound('Finish the sound', ['ān', 'bàn', 'sān', 'yáng'], 'Let an end at the front of your mouth. In ang, the sound ends further back.')
  },
  {
    id: 6, book: '1A', title: '这是我的学校', pinyin: 'Zhè shì wǒ de xuéxiào', english: 'This is my school', theme: 'our school', emoji: '🏫',
    focus: words(
      ['学校', 'xuéxiào', 'school', '🏫'],
      ['鸟', 'niǎo', 'bird', '🐦'],
      ['竹', 'zhú', 'bamboo', '🎋'],
      ['大', 'dà', 'big', '🐘'],
      ['小', 'xiǎo', 'small', '🐭'],
      ['上', 'shàng', 'up; above', '⬆️'],
      ['下', 'xià', 'down; below', '⬇️']
    ),
    sentences: practice(
      ['小鸟在学校里。', 'Xiǎoniǎo zài xuéxiào lǐ.', 'The little bird is in the school.', ['小鸟', '在', '学校', '里']],
      ['姐姐笑着走过来。', 'Jiějie xiàozhe zǒu guòlái.', 'My older sister walks over with a smile.', ['姐姐', '笑着', '走', '过来']],
      ['大书放在小书下面。', 'Dà shū fàng zài xiǎo shū xiàmiàn.', 'The big book is placed under the small book.', ['大书', '放在', '小书', '下面']]
    ),
    pinyinFocus: sound('Say iao together', ['niǎo', 'xiǎo', 'xiào'], 'Slide smoothly through iao in one syllable. Try 小 xiǎo, then 笑 xiào.')
  },
  {
    id: 7, book: '1A', title: '我的东西不见了', pinyin: 'Wǒ de dōngxi bú jiàn le', english: 'My things are missing', theme: 'finding our things', emoji: '🔎',
    focus: words(
      ['笔', 'bǐ', 'pen; pencil', '✏️'],
      ['画', 'huà', 'picture; draw', '🖼️'],
      ['床', 'chuáng', 'bed', '🛏️'],
      ['花', 'huā', 'flower', '🌸'],
      ['开', 'kāi', 'open', '🔓'],
      ['关', 'guān', 'close', '🔒'],
      ['两', 'liǎng', 'two (before a measure word)', '✌️']
    ),
    sentences: practice(
      ['我的两支笔在床上。', 'Wǒ de liǎng zhī bǐ zài chuáng shàng.', 'My two pencils are on the bed.', ['我的', '两支笔', '在', '床上']],
      ['请把门打开。', 'Qǐng bǎ mén dǎkāi.', 'Please open the door.', ['请', '把门', '打开']],
      ['这幅画里有三朵花。', 'Zhè fú huà lǐ yǒu sān duǒ huā.', 'There are three flowers in this picture.', ['这幅画里', '有', '三朵', '花']]
    ),
    pinyinFocus: sound('An or ang?', ['guān', 'guāng', 'chuáng'], 'Listen for the ending. 关 guān ends in n; 床 chuáng ends in ng.')
  },
  {
    id: 8, book: '1A', title: '我感冒了', pinyin: 'Wǒ gǎnmào le', english: 'I have a cold', theme: 'caring for our bodies', emoji: '🤧',
    focus: words(
      ['感冒', 'gǎnmào', 'have a cold', '🤧'],
      ['身体', 'shēntǐ', 'body', '🧍'],
      ['手', 'shǒu', 'hand', '✋'],
      ['头', 'tóu', 'head', '🙂'],
      ['走', 'zǒu', 'walk', '🚶'],
      ['跑', 'pǎo', 'run', '🏃'],
      ['看见', 'kànjiàn', 'see', '👀']
    ),
    sentences: practice(
      ['妹妹用手摸摸头。', 'Mèimei yòng shǒu mōmo tóu.', 'My younger sister touches her head with her hand.', ['妹妹', '用手', '摸摸', '头']],
      ['我感冒了，想休息。', 'Wǒ gǎnmào le, xiǎng xiūxi.', 'I have a cold and want to rest.', ['我', '感冒了', '想', '休息']],
      ['门外有一只飞鸟。', 'Mén wài yǒu yì zhī fēiniǎo.', 'There is a bird flying outside the door.', ['门外', '有', '一只', '飞鸟']]
    ),
    pinyinFocus: sound('The ou sound', ['shǒu', 'tóu', 'zǒu'], 'Let o glide into u. Say 手, 头 and 走 slowly, then at a comfortable speed.')
  },
  {
    id: 9, book: '1A', title: '今天有体育课吗', pinyin: 'Jīntiān yǒu tǐyù kè ma', english: 'Do we have PE today?', theme: 'school subjects', emoji: '⚽',
    focus: words(
      ['今天', 'jīntiān', 'today', '📅'],
      ['华文', 'huáwén', 'Chinese language', '📕'],
      ['体育课', 'tǐyù kè', 'PE lesson', '⚽'],
      ['六', 'liù', 'six', '6️⃣'],
      ['九', 'jiǔ', 'nine', '9️⃣'],
      ['什么', 'shénme', 'what', '❓'],
      ['说', 'shuō', 'say; speak', '💬']
    ),
    sentences: practice(
      ['今天我们练习说华文。', 'Jīntiān wǒmen liànxí shuō huáwén.', 'Today we practise speaking Chinese.', ['今天我们', '练习', '说华文']],
      ['九点有体育课。', 'Jiǔ diǎn yǒu tǐyù kè.', 'There is a PE lesson at nine o’clock.', ['九点', '有', '体育课']],
      ['盒子里有六粒豆。', 'Hézi lǐ yǒu liù lì dòu.', 'There are six beans in the box.', ['盒子里', '有', '六粒', '豆']]
    ),
    pinyinFocus: sound('The iu sound', ['liù', 'jiǔ', 'qiú'], 'Say each syllable as one smooth sound. Keep the third tone in 九 short and gentle in a sentence.')
  },
  {
    id: 10, book: '1A', title: '课室里有什么', pinyin: 'Kèshì lǐ yǒu shénme', english: 'What is in the classroom?', theme: 'our classroom', emoji: '📚',
    focus: words(
      ['课室', 'kèshì', 'classroom', '🏫'],
      ['有', 'yǒu', 'have; there is', '✅'],
      ['没有', 'méiyǒu', 'do not have; there is not', '🙅'],
      ['水', 'shuǐ', 'water', '💧'],
      ['白', 'bái', 'white', '⚪'],
      ['月', 'yuè', 'moon; month', '🌙'],
      ['天', 'tiān', 'sky; day', '🌤️']
    ),
    sentences: practice(
      ['课室里有白色的门。', 'Kèshì lǐ yǒu báisè de mén.', 'There is a white door in the classroom.', ['课室里', '有', '白色的', '门']],
      ['我的杯子里没有水。', 'Wǒ de bēizi lǐ méiyǒu shuǐ.', 'There is no water in my cup.', ['我的', '杯子里', '没有', '水']],
      ['我们画天上的月亮。', 'Wǒmen huà tiān shàng de yuèliang.', 'We draw the moon in the sky.', ['我们', '画', '天上的', '月亮']]
    ),
    pinyinFocus: sound('Keep ü round', ['yuè', 'yǔ', 'shuǐ'], 'In yǔ and yuè, the u represents ü. Round your lips; do not add another syllable.')
  },
  {
    id: 11, book: '1B', title: '我的同学', pinyin: 'Wǒ de tóngxué', english: 'My classmates', theme: 'classmates', emoji: '🧑‍🤝‍🧑',
    focus: words(
      ['同学', 'tóngxué', 'classmate', '🎒'],
      ['朋友', 'péngyou', 'friend', '🧑‍🤝‍🧑'],
      ['左', 'zuǒ', 'left', '⬅️'],
      ['右', 'yòu', 'right', '➡️'],
      ['中间', 'zhōngjiān', 'middle', '↔️'],
      ['坐', 'zuò', 'sit', '🪑'],
      ['高', 'gāo', 'tall; high', '🦒']
    ),
    sentences: practice(
      ['新同学坐在我右边。', 'Xīn tóngxué zuò zài wǒ yòubiān.', 'The new classmate sits on my right.', ['新同学', '坐在', '我', '右边']],
      ['朋友站在我们中间。', 'Péngyou zhàn zài wǒmen zhōngjiān.', 'Our friend stands between us.', ['朋友', '站在', '我们', '中间']],
      ['我和同学一起回家。', 'Wǒ hé tóngxué yìqǐ huí jiā.', 'My classmate and I go home together.', ['我', '和同学', '一起', '回家']]
    ),
    pinyinFocus: sound('Left and sit', ['zuǒ', 'zuò', 'yòu'], '左 zuǒ and 坐 zuò begin the same way. Listen to the tone to tell them apart.')
  },
  {
    id: 12, book: '1B', title: '你想吃什么', pinyin: 'Nǐ xiǎng chī shénme', english: 'What would you like to eat?', theme: 'mealtimes', emoji: '🍚',
    focus: words(
      ['饭', 'fàn', 'cooked rice; meal', '🍚'],
      ['鸡', 'jī', 'chicken', '🐔'],
      ['青菜', 'qīngcài', 'green vegetables', '🥬'],
      ['汤', 'tāng', 'soup', '🥣'],
      ['蛋', 'dàn', 'egg', '🥚'],
      ['饿', 'è', 'hungry', '😋'],
      ['饱', 'bǎo', 'full after eating', '😊']
    ),
    sentences: practice(
      ['我的饭里有青菜。', 'Wǒ de fàn lǐ yǒu qīngcài.', 'There are green vegetables in my rice.', ['我的', '饭里', '有', '青菜']],
      ['我想喝一碗蛋汤。', 'Wǒ xiǎng hē yì wǎn dàntāng.', 'I would like a bowl of egg soup.', ['我', '想喝', '一碗', '蛋汤']],
      ['弟弟吃饱了。', 'Dìdi chī bǎo le.', 'My younger brother has eaten enough.', ['弟弟', '吃', '饱了']]
    ),
    pinyinFocus: sound('Long and short endings', ['fàn', 'dàn', 'tāng'], 'Listen to n at the end of 饭 and 蛋, then ng at the end of 汤.')
  },
  {
    id: 13, book: '1B', title: '我爱干净', pinyin: 'Wǒ ài gānjìng', english: 'I like keeping clean', theme: 'keeping clean', emoji: '🧼',
    focus: words(
      ['洗', 'xǐ', 'wash', '🧼'],
      ['脸', 'liǎn', 'face', '🙂'],
      ['牙刷', 'yáshuā', 'toothbrush', '🪥'],
      ['毛巾', 'máojīn', 'towel', '🧺'],
      ['冲凉', 'chōngliáng', 'take a shower', '🚿'],
      ['先', 'xiān', 'first; before', '1️⃣'],
      ['谢谢', 'xièxie', 'thank you', '💛']
    ),
    sentences: practice(
      ['吃饭前我先洗手。', 'Chī fàn qián wǒ xiān xǐ shǒu.', 'I wash my hands before eating.', ['吃饭前我', '先', '洗手']],
      ['蓝色的毛巾挂好了。', 'Lánsè de máojīn guà hǎo le.', 'The blue towel has been hung up.', ['蓝色的', '毛巾', '挂好了']],
      ['妹妹用清水洗脸。', 'Mèimei yòng qīngshuǐ xǐ liǎn.', 'My younger sister washes her face with clean water.', ['妹妹', '用', '清水', '洗脸']]
    ),
    pinyinFocus: sound('Smile softly for x', ['xǐ', 'xiān', 'xiè'], 'Listen to the soft x sound in 洗, 先 and 谢. Say the whole syllable without an extra "s".')
  },
  {
    id: 14, book: '1B', title: '你看见我的袜子了吗', pinyin: 'Nǐ kànjiàn wǒ de wàzi le ma', english: 'Have you seen my socks?', theme: 'getting dressed', emoji: '🧦',
    focus: words(
      ['袜子', 'wàzi', 'socks', '🧦'],
      ['皮鞋', 'píxié', 'leather shoes', '👞'],
      ['衣服', 'yīfu', 'clothes', '👕'],
      ['红色', 'hóngsè', 'red', '🔴'],
      ['穿', 'chuān', 'wear; put on', '🧥'],
      ['收拾', 'shōushi', 'tidy up', '🧺'],
      ['双', 'shuāng', 'pair', '👟']
    ),
    sentences: practice(
      ['这双袜子是红色的。', 'Zhè shuāng wàzi shì hóngsè de.', 'This pair of socks is red.', ['这双袜子', '是', '红色的']],
      ['我自己穿好衣服。', 'Wǒ zìjǐ chuān hǎo yīfu.', 'I get dressed by myself.', ['我', '自己', '穿好', '衣服']],
      ['哥哥把皮鞋放好。', 'Gēge bǎ píxié fàng hǎo.', 'My older brother puts his leather shoes away.', ['哥哥', '把', '皮鞋', '放好']]
    ),
    pinyinFocus: sound('A light last syllable', ['wàzi', 'yīfu', 'shōushi'], 'Keep zi in 袜子, fu in 衣服 and shi in 收拾 short and light. They have a neutral tone.')
  },
  {
    id: 15, book: '1B', title: '我最喜欢吃西瓜', pinyin: 'Wǒ zuì xǐhuan chī xīguā', english: 'Watermelon is my favourite fruit', theme: 'fruit', emoji: '🍉',
    focus: words(
      ['西瓜', 'xīguā', 'watermelon', '🍉'],
      ['果汁', 'guǒzhī', 'fruit juice', '🧃'],
      ['甜', 'tián', 'sweet', '🍬'],
      ['苦', 'kǔ', 'bitter', '🍵'],
      ['买', 'mǎi', 'buy', '🛍️'],
      ['圆', 'yuán', 'round', '⚪'],
      ['切', 'qiē', 'cut', '🔪']
    ),
    sentences: practice(
      ['妈妈买了一个圆西瓜。', 'Māma mǎi le yí ge yuán xīguā.', 'Mum bought a round watermelon.', ['妈妈', '买了', '一个', '圆西瓜']],
      ['这杯果汁很甜。', 'Zhè bēi guǒzhī hěn tián.', 'This cup of fruit juice is sweet.', ['这杯', '果汁', '很甜']],
      ['爸爸把西瓜切好了。', 'Bàba bǎ xīguā qiē hǎo le.', 'Dad has cut up the watermelon.', ['爸爸', '把西瓜', '切好了']]
    ),
    pinyinFocus: sound('Hear the rising tone', ['tián', 'yuán', 'qiē'], '甜 tián and 圆 yuán rise gently. 切 qiē stays high and level.')
  },
  {
    id: 16, book: '1B', title: '好帮手', pinyin: 'Hǎo bāngshǒu', english: 'A helpful pair of hands', theme: 'helping at home', emoji: '🧹',
    focus: words(
      ['扫', 'sǎo', 'sweep', '🧹'],
      ['桌', 'zhuō', 'table; desk', '🪵'],
      ['椅', 'yǐ', 'chair', '🪑'],
      ['房', 'fáng', 'room; house', '🏠'],
      ['写', 'xiě', 'write', '✍️'],
      ['听', 'tīng', 'listen', '👂'],
      ['会', 'huì', 'can; know how to', '🌟']
    ),
    sentences: practice(
      ['我会帮爸爸扫地。', 'Wǒ huì bāng bàba sǎo dì.', 'I can help Dad sweep the floor.', ['我会', '帮爸爸', '扫地']],
      ['姐姐把椅子放好。', 'Jiějie bǎ yǐzi fàng hǎo.', 'My older sister puts the chair in place.', ['姐姐', '把椅子', '放好']],
      ['我写完作业再去玩。', 'Wǒ xiě wán zuòyè zài qù wán.', 'I finish my homework before going to play.', ['我', '写完作业', '再', '去玩']]
    ),
    pinyinFocus: sound('Third-tone practice', ['sǎo', 'yǐ', 'xiě'], 'Practise the dipping tone in each word on its own. In a sentence, it may sound shorter.')
  },
  {
    id: 17, book: '1B', title: '我们一起来庆祝', pinyin: 'Wǒmen yìqǐ lái qìngzhù', english: 'Let us celebrate together', theme: 'celebrations', emoji: '🎉',
    focus: words(
      ['庆祝', 'qìngzhù', 'celebrate', '🎉'],
      ['节', 'jié', 'festival', '🏮'],
      ['快乐', 'kuàilè', 'happy', '😄'],
      ['明天', 'míngtiān', 'tomorrow', '🌅'],
      ['昨天', 'zuótiān', 'yesterday', '📅'],
      ['给', 'gěi', 'give; for', '🎁'],
      ['故事', 'gùshi', 'story', '📖']
    ),
    sentences: practice(
      ['我们给老师一张卡片。', 'Wǒmen gěi lǎoshī yì zhāng kǎpiàn.', 'We give our teacher a card.', ['我们', '给老师', '一张', '卡片']],
      ['明天大家一起庆祝。', 'Míngtiān dàjiā yìqǐ qìngzhù.', 'Tomorrow everyone will celebrate together.', ['明天大家', '一起', '庆祝']],
      ['爷爷昨天讲了一个故事。', 'Yéye zuótiān jiǎng le yí ge gùshi.', 'Grandpa told a story yesterday.', ['爷爷昨天', '讲了', '一个故事']]
    ),
    pinyinFocus: sound('Qing and zhu', ['qìng', 'zhù', 'jié'], 'Say 庆祝 in two clear syllables. Let each fourth tone fall without shouting.')
  },
  {
    id: 18, book: '1B', title: '到动物园去', pinyin: 'Dào dòngwùyuán qù', english: 'A trip to the zoo', theme: 'animals', emoji: '🦁',
    focus: words(
      ['动物园', 'dòngwùyuán', 'zoo', '🦁'],
      ['兔', 'tù', 'rabbit', '🐇'],
      ['老虎', 'lǎohǔ', 'tiger', '🐅'],
      ['狮子', 'shīzi', 'lion', '🦁'],
      ['尾巴', 'wěiba', 'tail', '🐒'],
      ['眼睛', 'yǎnjing', 'eyes', '👀'],
      ['短', 'duǎn', 'short', '📏']
    ),
    sentences: practice(
      ['小兔的尾巴很短。', 'Xiǎotù de wěiba hěn duǎn.', 'The little rabbit has a short tail.', ['小兔的', '尾巴', '很', '短']],
      ['我看见老虎的眼睛。', 'Wǒ kànjiàn lǎohǔ de yǎnjing.', 'I see the tiger’s eyes.', ['我', '看见', '老虎的', '眼睛']],
      ['弟弟想再去动物园。', 'Dìdi xiǎng zài qù dòngwùyuán.', 'My younger brother wants to go to the zoo again.', ['弟弟', '想', '再去', '动物园']]
    ),
    pinyinFocus: sound('Light endings', ['shīzi', 'wěiba', 'yǎnjing'], 'The last syllable in these words is light. Listen once, then say the word with a relaxed voice.')
  },
  {
    id: 19, book: '1B', title: '我家附近有公园', pinyin: 'Wǒ jiā fùjìn yǒu gōngyuán', english: 'There is a park near my home', theme: 'our neighbourhood', emoji: '🌳',
    focus: words(
      ['公园', 'gōngyuán', 'park', '🌳'],
      ['组屋', 'zǔwū', 'HDB apartment block', '🏢'],
      ['商店', 'shāngdiàn', 'shop', '🏪'],
      ['球场', 'qiúchǎng', 'ball court; playing field', '🏀'],
      ['散步', 'sànbù', 'take a walk', '🚶'],
      ['游戏', 'yóuxì', 'game', '🧩'],
      ['高兴', 'gāoxìng', 'happy; glad', '😊']
    ),
    sentences: practice(
      ['我们走进公园。', 'Wǒmen zǒujìn gōngyuán.', 'We walk into the park.', ['我们', '走进', '公园']],
      ['组屋旁边有一家商店。', 'Zǔwū pángbiān yǒu yì jiā shāngdiàn.', 'There is a shop beside the HDB block.', ['组屋旁边', '有', '一家', '商店']],
      ['伙伴带我去球场。', 'Huǒbàn dài wǒ qù qiúchǎng.', 'My friend takes me to the ball court.', ['伙伴', '带我', '去', '球场']]
    ),
    pinyinFocus: sound('Listen, then say', ['gōngyuán', 'qiúchǎng', 'gāoxìng'], 'Clap once for each syllable. Keep the tones clear as you name places around your home.')
  }
];

export const lessons = lessonContent.map(lesson => {
  const source = characterSets[lesson.id];
  return {
    ...lesson,
    recognition: [...source.recognition],
    writing: [...source.writing],
    characterReadings: { ...(contextualReadings[lesson.id] || {}) },
    characterExamples: { ...(contextualExamples[lesson.id] || {}) },
    sourceUrl: source.sourceUrl,
    characterSourceUrl: officialUrl,
    recognitionSourceUrl: officialUrl,
    writingSourceUrl: officialUrl,
    characterSourcePage: lesson.book === '1A' ? 1 : 2,
    sourceNote: 'Complete lesson character lists, cross-checked against public curriculum sources. Focus words and sentences are original supplementary practice; some words are for listening and speaking before all their characters are required for reading or writing.'
  };
});
