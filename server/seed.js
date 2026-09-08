/**
 * Наполнение демо-данными для volonter.by.
 * Запуск: node seed.js            — заполнит, только если база пуста
 *         node seed.js --force    — очистит и заполнит заново
 */
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, 'data', 'volonterby.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT DEFAULT '',
  city TEXT NOT NULL DEFAULT '', password_hash TEXT, about TEXT DEFAULT '',
  avatar_seed INTEGER, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  user_id INTEGER PRIMARY KEY, skills TEXT DEFAULT '', interests TEXT DEFAULT '',
  schedule TEXT DEFAULT '', verified INTEGER DEFAULT 0, last_active TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER, author_name TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'organization', city TEXT NOT NULL, title TEXT NOT NULL,
  description TEXT DEFAULT '', category TEXT NOT NULL DEFAULT 'other',
  date_start TEXT, date_end TEXT, time_text TEXT DEFAULT '', urgent INTEGER DEFAULT 0,
  volunteers_needed INTEGER DEFAULT 1, volunteers_found INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', conditions TEXT DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, volunteer_id INTEGER NOT NULL,
  message TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'applied', rating INTEGER,
  review TEXT DEFAULT '', hours INTEGER DEFAULT 0, created_at TEXT NOT NULL,
  UNIQUE (request_id, volunteer_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER, from_user INTEGER NOT NULL,
  to_user INTEGER NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
`);

const count = db.prepare(`SELECT COUNT(*) c FROM users`).get().c;
const force = process.argv.includes('--force');
if (count > 0 && !force) {
  console.log(`База уже содержит данные (${count} пользователей). Для пересоздания запустите: node seed.js --force`);
  process.exit(0);
}
if (force) {
  db.exec(`DELETE FROM responses; DELETE FROM requests; DELETE FROM messages; DELETE FROM sessions; DELETE FROM volunteer_profiles; DELETE FROM users; DELETE FROM sqlite_sequence;`);
  console.log('Старые данные удалены.');
}

const now = () => new Date().toISOString();
const D = (offsetDays) => { const d = new Date('2026-09-08T10:00:00'); d.setDate(d.getDate() + offsetDays); return d.toISOString().slice(0, 10); };

function hash(pw, salt = randomBytes(12).toString('hex')) {
  return salt + ':' + createHash('sha256').update(salt + pw).digest('hex');
}

const addUser = db.prepare(`INSERT INTO users (role,name,email,phone,city,password_hash,about,avatar_seed,created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
const addProfile = db.prepare(`INSERT INTO volunteer_profiles (user_id,skills,interests,schedule,verified,last_active) VALUES (?,?,?,?,?,?)`);
const addRequest = db.prepare(`INSERT INTO requests (author_id,author_name,author_type,city,title,description,category,date_start,date_end,time_text,urgent,volunteers_needed,volunteers_found,status,conditions,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const addResponse = db.prepare(`INSERT INTO responses (request_id,volunteer_id,message,status,rating,review,hours,created_at) VALUES (?,?,?,?,?,?,?,?)`);

const U = {};
function user(role, name, email, city, about, { phone = '', seed = null, verified = 0, skills = '', interests = '', schedule = '' } = {}) {
  const info = addUser.run(role, name, email, phone, city, hash('1234'), about, seed ?? Math.floor(Math.random() * 90000) + 1, now());
  const id = Number(info.lastInsertRowid);
  U[email.split('@')[0]] = id;
  if (role === 'volunteer') addProfile.run(id, skills, interests, schedule, verified, now());
  return id;
}

/* ---------------- Волонтёры ---------------- */
user('volunteer', 'Алеся Ковалёва', 'alesia@demo.by', 'Минск',
  'Ухаживаю за бабушкой с 2022 года — знаю, как важно доброе слово и вовремя принесённые продукты. Помогаю пожилым соседям и приюту для кошек.',
  { phone: '+375 29 111-22-33', seed: 12, verified: 1, skills: 'уход за пожилыми,доставка продуктов,помощь животным,собеседник', interests: 'помощь пожилым,приюты,одинокие люди', schedule: 'будни после 18:00, выходные' });
user('volunteer', 'Максим Жук', 'maksim@demo.by', 'Гродно',
  'Строитель по профессии. Могу починить, прибить, собрать, перевезти. Свои инструменты и руки всегда со мной. Два года помогаю приюту и одиноким пенсионерам.',
  { phone: '+375 33 444-55-66', seed: 340, verified: 1, skills: 'мелкий ремонт,строительство,переезды,работа руками', interests: 'ремонт для пожилых,приюты,субботники', schedule: 'по договорённости, вечера' });
user('volunteer', 'Ирина Лебедь', 'irina@demo.by', 'Брест',
  'Художница и педагог. Провожу занятия по рисованию для детей в больницах и детских домах. Люблю придумывать, чем занять и увлечь детей.',
  { phone: '+375 25 777-88-99', seed: 556, verified: 1, skills: 'занятия с детьми,рисование,творчество,аниматор', interests: 'дети,больницы,развивающие занятия', schedule: 'суббота, воскресенье' });
user('volunteer', 'Дмитрий Сокол', 'dmitry@demo.by', 'Витебск',
  'IT-специалист. Помогаю пожилым людям разобраться с техникой: настроить ноутбук, смартфон, оплатить услуги онлайн. Также делаю переводы документов.',
  { phone: '+375 29 222-11-00', seed: 783, verified: 1, skills: 'IT-помощь,настройка техники,переводы,оплата онлайн', interests: 'цифровая грамотность пожилых,переводы', schedule: 'будни вечером, онлайн' });
user('volunteer', 'Екатерина Новак', 'ekaterina@demo.by', 'Гомель',
  'Психолог. Поддерживаю людей в кризисных ситуациях, помогаю в больницах и хосписах. Верю, что разговор иногда лечит не хуже лекарств.',
  { phone: '+375 44 555-11-22', seed: 921, verified: 1, skills: 'психологическая поддержка,уход за больными,доставка', interests: 'хосписы,больницы,горячая линия', schedule: 'вторник, четверг, выходные' });
user('volunteer', 'Павел Гринкевич', 'pavel@demo.by', 'Могилёв',
  'Экоактивист и волонтёр-спасатель. Участвую в субботниках, уборках берегов, акциях по высадке деревьев. Есть машина — могу подвозить грузы и людей.',
  { phone: '+375 29 999-00-11', seed: 118, verified: 0, skills: 'экология,субботники,физ.помощь,первая помощь,перевозки', interests: 'экология,город,парки', schedule: 'выходные' });
user('volunteer', 'Анна Мороз', 'anna@demo.by', 'Минск',
  'Переводчик (английский, польский, русский). Помогаю с переводами документов, анкетами и заявлениями. Могу подтянуть школьников по языкам онлайн.',
  { phone: '+375 33 123-45-67', seed: 675, verified: 0, skills: 'переводы,документы,репетиторство', interests: 'переводы,помощь с документами', schedule: 'вечера будней, онлайн' });

/* ---------------- Организации и частные лица ---------------- */
user('organization', 'БФ «Вектор добра»', 'vektor@demo.by', 'Минск',
  'Благотворительный фонд. Помогаем пожилым, детям в больницах и людям в сложной жизненной ситуации. Координируем волонтёров по Минску и области.');
user('organization', 'Приют «Добрый дом»', 'prijut@demo.by', 'Гродно',
  'Приют для животных. Нужны руки для выгула собак, уборки вольеров и заботы о кошках. Всегда рады новым волонтёрам!');
user('organization', 'Хоспис «Дом милосердия»', 'hospis@demo.by', 'Минск',
  'Областной хоспис. Ищем волонтёров для общения с подопечными, творческих занятий и помощи персоналу. Доброта лечит.');
user('organization', 'Служба «Милосердие»', 'miloserdie@demo.by', 'Гомель',
  'Церковная социальная служба. Развозим обеды одиноким пенсионерам, помогаем многодетным семьям и бездомным.');
user('organization', 'ЭкоДом', 'ecodom@demo.by', 'Могилёв',
  'Экологическая инициатива. Организуем субботники, уборки парков и берегов рек, раздельный сбор. Зовём всех неравнодушных!');
user('person', 'Марфа Ивановна', 'marta@demo.by', 'Минск', 'Мне 84 года, живу одна. Нужна помощь с тяжёлыми пакетами из магазина и иногда — просто живой разговор.', { phone: '+375 29 000-12-34', seed: 22 });
user('person', 'Николай Петрович', 'nikolay@demo.by', 'Витебск', 'Пенсионер, 72 года. Живу в частном доме, самому уже тяжело с ремонтом и забором.', { phone: '+375 33 555-00-11', seed: 44 });
user('person', 'Светлана', 'svetlana@demo.by', 'Брест', 'Ухаживаю за мамой (86 лет). Нужна помощь, чтобы научить её пользоваться планшетом и видеозвонками.', { seed: 66 });
user('person', 'Игорь', 'igor@demo.by', 'Могилёв', 'У меня после операции ограничена подвижность. Иногда жизненно нужно срочно доставить лекарства из аптеки.', { phone: '+375 29 777-11-22', seed: 88 });
user('person', 'Ольга', 'olga@demo.by', 'Гродно', 'Переезжаю в другую квартиру, нужна мужская сила, чтобы перенести мебель и коробки.', { seed: 123 });
user('person', 'Тамара Васильевна', 'tamara@demo.by', 'Бобруйск', 'Мне 78 лет, плохо хожу. Нужен сопровождающий на приём к врачу раз в неделю.', { phone: '+375 25 111-22-33', seed: 222 });

/* ---------------- Заявки ---------------- */
function req(author, { city, title, desc, cat, from, to = null, time = '', urgent = 0, need = 1, found = 0, status = 'open', cond = '', ago = 1 }) {
  const a = db.prepare(`SELECT id, name, role FROM users WHERE id = ?`).get(U[author]);
  const created = new Date(Date.now() - ago * 86400000).toISOString();
  const info = addRequest.run(a.id, a.name, a.role === 'volunteer' ? 'person' : a.role, city, title, desc, cat, from, to, time, urgent, need, found, status, cond, created);
  return Number(info.lastInsertRowid);
}
function resp(reqId, volunteer, { message = '', status = 'applied', rating = null, review = '', hours = 0, ago = 1 } = {}) {
  addResponse.run(reqId, U[volunteer], message, status, rating, review, hours, new Date(Date.now() - ago * 86400000).toISOString());
}

/* --- прошлые (завершённые) --- */
const h1 = req('vektor', { city: 'Минск', title: 'Сортировка гуманитарной помощи на складе', desc: 'Нужно разобрать и рассортировать вещи и продукты для подопечных фонда. Работа несложная, но нужны руки.', cat: 'склад', from: D(-15), status: 'done', ago: 16 });
resp(h1, 'alesia', { message: 'Могу прийти во вторник после обеда!', status: 'done', rating: 5, review: 'Алеся — золотой человек. Работала быстро, аккуратно, подбадривала всех вокруг.', hours: 4, ago: 15 });
resp(h1, 'dmitry', { message: 'Буду в среду с 10:00.', status: 'done', rating: 5, review: 'Спасибо Дмитрию — взялся за самое тяжёлое, всё разложил по полочкам.', hours: 3, ago: 15 });

const h2 = req('vektor', { city: 'Минск', title: 'Акция «Собери ребёнка в школу»', desc: 'Формируем школьные наборы для детей из многодетных семей. Нужна помощь в упаковке и развозе.', cat: 'дети', from: D(-9), status: 'done', ago: 10 });
resp(h2, 'irina', { message: 'Возьму на себя оформление и упаковку красиво :)', status: 'done', rating: 5, review: 'Ирина превратила обычные наборы в праздник! Дети в восторге.', hours: 5, ago: 9 });
resp(h2, 'alesia', { message: 'Помогу с развозом по адресам.', status: 'done', rating: 5, review: '', hours: 3, ago: 9 });

const h3 = req('prijut', { city: 'Гродно', title: 'Генеральная уборка вольеров в приюте', desc: 'Приводим приют в порядок к осени: мытьё вольеров, замена подстилок, мелкий ремонт.', cat: 'животные', from: D(-20), status: 'done', ago: 21 });
resp(h3, 'maksim', { message: 'Приду с инструментами. Что чинить — покажете на месте.', status: 'done', rating: 5, review: 'Максим починил три вольера и дверь в подсобке. Без него бы не справились!', hours: 6, ago: 20 });

const h4 = req('ecodom', { city: 'Могилёв', title: 'Уборка парка «Подниколье»', desc: 'Осенний субботник: уборка мусора, листвы, покраска лавочек. Инвентарь выдадим.', cat: 'экология', from: D(-7), status: 'done', ago: 8 });
resp(h4, 'pavel', { message: 'Буду с машиной — вывезу собранное.', status: 'done', rating: 5, review: 'Павел — мотор нашей команды. Приехал раньше всех и уехал позже всех.', hours: 5, ago: 7 });

/* --- текущие и будущие --- */
const r1 = req('marta', { city: 'Минск', title: 'Помочь с покупкой продуктов', desc: 'Живу одна, тяжело носить пакеты из магазина. Нужна помощь раз в неделю: сходить в магазин по моему списку и принести продукты.', cat: 'пожилые', from: D(4), time: '10:00–12:00', need: 1, found: 1, status: 'in_progress', cond: 'Продукты покупаю за свой счёт, нужен только человек с сильными руками и добрым сердцем.' });
resp(r1, 'alesia', { message: 'Здравствуйте, Марфа Ивановна! С удовольствием помогу — я как раз живу в соседнем дворе. Могу приходить каждую неделю в субботу утром.', status: 'accepted', ago: 2 });

const r2 = req('prijut', { city: 'Гродно', title: 'Выгул собак и уход за кошками в приюте', desc: 'Ищем волонтёров на выходные: выгулять собак (нужна физподготовка), покормить и почистить клетки кошек.', cat: 'животные', from: D(5), to: D(6), time: '11:00–15:00', need: 3, cond: 'Любовь к животным обязательна. Собаки разные — подберём по вашим силам.' });
resp(r2, 'maksim', { message: 'Буду в субботу и воскресенье. С собаками на «ты» :)', status: 'applied', ago: 1 });
resp(r2, 'anna', { message: 'Могу в воскресенье помочь с кошками.', status: 'applied', ago: 1 });

const r3 = req('vektor', { city: 'Минск', title: 'Разгрузка гуманитарной помощи', desc: 'Приходит фура с вещами для подопечных. Нужно разгрузить и разложить на складе. Физподготовка приветствуется.', cat: 'склад', from: D(7), time: '09:00', need: 4, urgent: 1, cond: 'При себе иметь перчатки. Обед — за наш счёт.' });
resp(r3, 'alesia', { message: 'Приду, захвачу подругу — вместе быстрее!', status: 'applied', ago: 1 });
resp(r3, 'dmitry', { message: 'Готов помочь с 9:00.', status: 'applied', ago: 1 });
resp(r3, 'pavel', { message: 'Могу приехать с машиной для развоза по точкам.', status: 'applied', ago: 1 });

const r4 = req('nikolay', { city: 'Витебск', title: 'Починить забор и калитку на даче', desc: 'Забор покосился после ветра, калитка не закрывается. Нужны руки и немного стройматериалов (оплачу).', cat: 'ремонт', from: null, time: 'по договорённости', need: 1, cond: 'Желательно со своим инструментом.' });
resp(r4, 'maksim', { message: 'Здравствуйте, Николай Петрович! Я строитель, с инструментами. Могу приехать на выходных.', status: 'applied', ago: 1 });

const r5 = req('hospis', { city: 'Минск', title: 'Творческие мастер-классы для подопечных хосписа', desc: 'Ищем волонтёра, который проведёт мастер-класс (рисование, поделки, музыка). Группа 6–8 человек, возраст разный.', cat: 'творчество', from: D(10), time: '15:00', need: 1, cond: 'Опыт не обязателен, важно желание и терпение.' });
resp(r5, 'irina', { message: 'Я художница, провожу занятия с детьми. Приду со всеми материалами.', status: 'applied', ago: 1 });

const r6 = req('svetlana', { city: 'Брест', title: 'Научить маму пользоваться планшетом', desc: 'Маме 86 лет, подарили планшет, чтобы общаться с внуками. Нужно 2–3 занятия: видеозвонки, фото, кнопка «домой», чтобы не терялась.', cat: 'IT-помощь', from: null, time: 'вечер, по договорённости', need: 1, cond: 'Терпение — главное требование!' });
resp(r6, 'dmitry', { message: 'Занимаюсь этим постоянно — помогу и маме, и вам. Могу онлайн или приехать.', status: 'applied', ago: 1 });

const r7 = req('miloserdie', { city: 'Гомель', title: 'Развоз обедов одиноким пенсионерам', desc: 'Каждую субботу развозим горячие обеды по 15 адресам. Нужны волонтёры с машинами и просто помощники.', cat: 'пожилые', from: D(11), to: null, time: '10:00–14:00', need: 3, cond: 'Желательно наличие машины (компенсируем топливо).' });
resp(r7, 'ekaterina', { message: 'Без машины, но могу ездить с водителем и разносить обеды, поговорить с бабушками и дедушками.', status: 'applied', ago: 1 });

const r8 = req('igor', { city: 'Могилёв', title: 'Срочно: доставить лекарства из аптеки', desc: 'После операции плохо хожу. Нужно срочно забрать заказ из аптеки и привезти домой. Аптека на Крупской, живу на Челюскинцев.', cat: 'доставка', from: D(1), time: 'до 18:00', need: 1, urgent: 1, cond: 'Нужно сегодня-завтра!' });
resp(r8, 'pavel', { message: 'Живу рядом, могу заехать в аптеку прямо сейчас. Скиньте номер заказа.', status: 'applied', ago: 1 });

const r9 = req('vektor', { city: 'Минск', title: 'Перевод документов с польского языка', desc: 'Помочь подопечной семье перевести документы (справки) с польского на русский. Объём небольшой, работа онлайн.', cat: 'переводы', from: null, time: 'онлайн', need: 1, cond: 'Польский на уровне B1+' });
resp(r9, 'anna', { message: 'Я переводчик, польский — рабочий язык. Готова помочь.', status: 'applied', ago: 1 });

const r10 = req('olga', { city: 'Гродно', title: 'Помощь с переездом', desc: 'Переезжаю с 2-го этажа без лифта. Нужно перенести мебель и коробки (примерно 2 часа работы). Грузчиков нанимать дорого.', cat: 'переезды', from: D(13), time: '10:00', need: 2, cond: 'Физическая подготовка. Угощу обедом!' });
resp(r10, 'maksim', { message: 'Готов помочь, есть тележка и опыт переездов :)', status: 'applied', ago: 1 });

const r11 = req('hospis', { city: 'Минск', title: 'Перенос мебели в новое отделение хосписа', desc: 'Закупили мебель для нового отделения. Нужно занести и расставить по комнатам 3-й этаж, есть лифт.', cat: 'ремонт', from: D(18), time: '09:00', need: 3, cond: 'По возможности — перчатки.' });

const r12 = req('tamara', { city: 'Бобруйск', title: 'Сопровождение на приём к врачу', desc: 'Раз в неделю езжу в поликлинику на физиотерапию. Плохо хожу — нужен сопровождающий, чтобы помочь с транспортом и в очередях.', cat: 'пожилые', from: D(8), time: '08:30', need: 1, cond: 'Понедельники, утро.' });

/* --- пара сообщений для наглядности чата --- */
const sendMsg = db.prepare(`INSERT INTO messages (request_id, from_user, to_user, text, created_at) VALUES (?,?,?,?,?)`);
sendMsg.run(r1, U['alesia'], U['marta'], 'Марфа Ивановна, я Алеся. Могу прийти в субботу в 10:00. Напишу список, что нужно купить?', new Date(Date.now() - 2 * 86400000).toISOString());
sendMsg.run(r1, U['marta'], U['alesia'], 'Спасибо, милая! Список передам — он у меня на холодильнике, продиктую по телефону.', new Date(Date.now() - 2 * 86400000 + 3600000).toISOString());
sendMsg.run(r4, U['maksim'], U['nikolay'], 'Николай Петрович, подскажите адрес дачи — прикину, какие материалы понадобятся.', new Date(Date.now() - 1 * 86400000).toISOString());

console.log('Готово! База наполнена демо-данными.');
console.log('  Волонтёры: alesia@demo.by, maksim@demo.by, irina@demo.by, dmitry@demo.by, ekaterina@demo.by, pavel@demo.by, anna@demo.by');
console.log('  Организации: vektor@demo.by, prijut@demo.by, hospis@demo.by, miloserdie@demo.by, ecodom@demo.by');
console.log('  Частные лица: marta@demo.by, nikolay@demo.by, svetlana@demo.by, igor@demo.by, olga@demo.by, tamara@demo.by');
console.log('  Пароль у всех демо-аккаунтов: 1234');
