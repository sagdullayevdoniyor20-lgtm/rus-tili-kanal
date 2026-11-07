// Rus tili kanali boti — GitHub Actions uchun.
//
//   node run.js words  → navbatdagi mavzu rasmi + so'zlar ro'yxati (ertalab)
//   node run.js quiz   → shu mavzu bo'yicha testlar (kechqurun)
//   node run.js russia → Rossiya haqida rasm (10:00, Wikimedia Commons'dan)
//
// Mavzular: content/topics.json, rasmlar: images/<id>.png
// Holat (qaysi mavzu navbatda): data.json
// Qo'shimcha kutubxona kerak emas (Node.js 18+).

const fs = require("fs");
const path = require("path");

const BOT_TOKEN = (process.env.BOT_TOKEN || "").trim();
const CHANNEL = (process.env.CHANNEL || "").trim();
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, "data.json");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const topics = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "topics.json"), "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Toshkent vaqti bo'yicha bugungi sana (YYYY-MM-DD)
function today() {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return {};
  }
}
const data = Object.assign({ next: 1, current: null, lastWordsDate: null, lastQuizDate: null }, loadData());
const saveData = () => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

async function tg(method, body, isForm = false) {
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description}`);
  return json.result;
}

function footer() {
  return (cfg.HASHTAGS ? `\n\n${cfg.HASHTAGS}` : "") + (CHANNEL ? `\n👉 ${esc(CHANNEL)}` : "");
}

// Variantlarni aralashtirish (har safar bir xil tartib chiqishi uchun "seed" bilan)
function shuffle(arr, seed) {
  const a = arr.map((v, i) => [v, i]);
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Ertalab: rasm + so'zlar ----------
async function postWords() {
  if (data.lastWordsDate === today()) return console.log("Bugungi mavzu allaqachon joylangan.");
  const t = topics.find((x) => x.id === data.next) || topics[0];

  const lines = [`📚 <b>Mavzu №${t.id}: ${esc(t.ru.toUpperCase())}</b> — ${esc(t.uz)}`, ""];
  for (const [em, ru, uz] of t.words) lines.push(`${/^[0-9]+$/.test(em) ? `<b>${em}</b>` : em} <b>${esc(ru)}</b> — ${esc(uz)}`);
  lines.push("", `💡 Bugun soat ${cfg.QUIZ_TIME_TEXT} da shu so‘zlar bo‘yicha test bo‘ladi!`);
  const caption = (lines.join("\n") + footer()).slice(0, 1024);

  const form = new FormData();
  form.append("chat_id", CHANNEL);
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  const file = fs.readFileSync(path.join(ROOT, "images", `${t.id}.png`));
  form.append("photo", new Blob([file], { type: "image/png" }), `${t.id}.png`);
  await tg("sendPhoto", form, true);

  data.current = t.id;
  data.lastWordsDate = today();
  data.next = t.id >= topics.length ? 1 : t.id + 1; // 30-mavzudan keyin boshidan boshlanadi
  saveData();
  console.log(`Mavzu №${t.id} joylandi.`);
}

// ---------- Kechqurun: testlar ----------
async function postQuiz() {
  if (data.lastQuizDate === today()) return console.log("Bugungi test allaqachon joylangan.");
  if (!data.current) return console.log("Hali birorta mavzu joylanmagan — test yo‘q.");
  const t = topics.find((x) => x.id === data.current);

  await tg("sendMessage", {
    chat_id: CHANNEL,
    parse_mode: "HTML",
    text: `📝 <b>Test vaqti!</b>\n\nMavzu №${t.id}: <b>${esc(t.ru.toUpperCase())}</b> — ${esc(t.uz)}\n${t.quiz.length} ta savol. Qani, nechtasiga to‘g‘ri javob berasiz? 👇`,
  });

  for (let i = 0; i < t.quiz.length; i++) {
    const q = t.quiz[i];
    const mixed = shuffle(q.o, t.id * 100 + i + 7);
    await tg("sendPoll", {
      chat_id: CHANNEL,
      question: `${i + 1}/${t.quiz.length}. ${q.q}`.slice(0, 300),
      options: mixed.map(([text]) => ({ text })),
      type: "quiz",
      is_anonymous: true,
      correct_option_id: mixed.findIndex(([, idx]) => idx === 0), // 0-variant — to'g'ri javob
      explanation: q.e ? `💡 ${q.e}`.slice(0, 200) : undefined,
    });
    await sleep(1500);
  }

  await tg("sendMessage", {
    chat_id: CHANNEL,
    parse_mode: "HTML",
    text: `✅ Test tugadi! Natijangizni izohlarda yozing.\nErtaga ertalab — yangi mavzu 📚${footer()}`,
  });

  data.lastQuizDate = today();
  saveData();
  console.log(`Mavzu №${t.id} testi joylandi.`);
}

// ---------- 10:00: Rossiya haqida rasm (Wikimedia Commons'dan) ----------
const UA = "rus-tili-kanal-bot/1.0 (https://github.com/sagdullayevdoniyor20-lgtm/rus-tili-kanal)";
const stripHtml = (s) => String(s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Commons'dan shu joy bo'yicha sifatli (gorizontal, katta) rasm topadi.
// Avval "Quality images" (Commons tekshirgan sifatli fotolar) ichidan qidiradi,
// topilmasa — oddiy qidiruvning eng mos 3 ta natijasidan oladi.
async function searchCommons(search, top) {
  const p = new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrnamespace: "6",
    gsrsearch: search, gsrlimit: "30",
    prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1600",
  });
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?${p}`);
  return Object.values(j.query?.pages || {})
    .sort((a, b) => a.index - b.index)
    .map((pg) => pg.imageinfo?.[0])
    .filter((ii) => ii && ii.mime === "image/jpeg" && ii.width >= 1400 && ii.width >= ii.height * 1.2 && ii.thumburl)
    .slice(0, top);
}

async function findCommonsImage(query) {
  let good = await searchCommons(`${query} filetype:bitmap incategory:"Quality_images"`, 5);
  if (!good.length) good = await searchCommons(`${query} filetype:bitmap`, 3);
  if (!good.length) throw new Error(`Commons'da rasm topilmadi: ${query}`);
  const ii = good[Math.floor(Math.random() * good.length)];
  const m = ii.extmetadata || {};
  return {
    url: ii.thumburl,
    page: ii.descriptionurl,
    author: stripHtml(m.Artist?.value).slice(0, 80),
    license: stripHtml(m.LicenseShortName?.value),
  };
}

async function postRussia() {
  if (data.lastRussiaDate === today()) return console.log("Bugungi Rossiya rasmi allaqachon joylangan.");
  const places = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "russia.json"), "utf8"));
  const p = places.find((x) => x.id === data.russiaNext) || places[0];
  // Har 30 kunlik aylanishda boshqa matn: 1-aylanish — 1-matn, 2-si — 2-matn, ...
  const round = data.russiaRound || 0;
  const m = p.matnlar[round % p.matnlar.length];

  const img = await findCommonsImage(p.q);
  const imgRes = await fetch(img.url, { headers: { "User-Agent": UA } });
  if (!imgRes.ok) throw new Error(`Rasm yuklanmadi: ${imgRes.status}`);
  const bytes = await imgRes.arrayBuffer();

  const credit = [img.author, img.license].filter(Boolean).join(", ");
  const caption = (
    `🇷🇺 <b>${esc(p.ru)}</b>\n${esc(m.ru)}\n\n` +
    `🇺🇿 <b>${esc(p.uz)}</b>\n${esc(m.uz)}\n\n` +
    `📷 <a href="${esc(img.page)}">${esc(credit || "Wikimedia Commons")}</a> / Wikimedia Commons` +
    footer()
  ).slice(0, 1024);

  const form = new FormData();
  form.append("chat_id", CHANNEL);
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "russia.jpg");
  await tg("sendPhoto", form, true);

  data.lastRussiaDate = today();
  data.russiaNext = p.id >= places.length ? 1 : p.id + 1;
  if (p.id >= places.length) data.russiaRound = round + 1; // ro'yxat tugadi — keyingi aylanishda keyingi matn
  saveData();
  console.log(`Rossiya rasmi №${p.id} (${p.ru}), ${(round % p.matnlar.length) + 1}-matn joylandi: ${img.page}`);
}

(async () => {
  if (process.argv[2] === "russia-test") {
    // Kanalga yubormasdan, faqat rasm topilishini tekshiradi
    const places = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "russia.json"), "utf8"));
    for (const p of places) {
      try {
        const img = await findCommonsImage(p.q);
        console.log(`✅ ${p.id}. ${p.ru} → ${img.page}`);
        await sleep(1500);
      } catch (e) {
        console.log(`❌ ${p.id}. ${p.ru} → ${e.message}`);
      }
    }
    return;
  }
  if (!BOT_TOKEN || !CHANNEL) {
    console.error("BOT_TOKEN yoki CHANNEL topilmadi. GitHub Secrets'ni tekshiring.");
    process.exit(1);
  }
  const mode = process.argv[2];
  if (mode === "words") await postWords();
  else if (mode === "quiz") await postQuiz();
  else if (mode === "russia") await postRussia();
  else {
    console.error("Ishlatish: node run.js words | quiz | russia");
    process.exit(1);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
