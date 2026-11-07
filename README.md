# Rus tili kanali boti

Har kuni Telegram kanalga o'zi post qiladi:

- 🌅 **~09:00** — mavzu rasmi va tagida 10–15 ta so'z (ruscha — o'zbekcha)
- 🇷🇺 **~10:00** — Rossiya haqida rasm (Wikimedia Commons saytidan) va ruscha + o'zbekcha qisqa tavsif
- 🌆 **~18:00** — shu mavzu bo'yicha 10 ta test (Telegram quiz): so'z birikmalari va gaplar

Hozir **30 ta mavzu** tayyor (oziq-ovqat, oila, uy, kiyim, transport...). 30-kundan keyin bot boshidan boshlaydi.
GitHub Actions'da bepul ishlaydi, kompyuter yoqiq turishi shart emas.

---

## O'rnatish

### 1. Telegram
1. @BotFather → `/newbot` → **token**ni oling.
2. Kanal oching va botni kanalga **admin** qiling ("Xabar joylash" ruxsati bilan).

### 2. GitHub
1. Yangi **public** repo oching va shu papkadagi hamma fayllarni yuklang (`.github` papkasi ham!).
2. **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `BOT_TOKEN` | BotFather bergan token |
| `CHANNEL` | `@rustilinoldan2` |

3. **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**.

### 3. Sinab ko'rish
**Actions → Rus tili kanali → Run workflow** → `words` ni tanlang → kanalga 1-mavzu chiqadi.
Keyin yana **Run workflow** → `quiz` → shu mavzu testlari chiqadi.

Shundan keyin bot har kuni o'zi ishlaydi.

---

## Fayllar

| Fayl | Nima |
|---|---|
| `content/topics.json` | Barcha mavzular: so'zlar va testlar |
| `images/` | Har bir mavzuning rasmi (`1.png`, `2.png`, ...) |
| `tools/render.py` | Rasmlarni yasaydigan dastur |
| `run.js` | Kanalga joylaydigan bot |
| `content/russia.json` | Rossiyadagi 30 ta joy: nomi, rasm qidirish so'zi va 3 xil matn (ruscha/o'zbekcha). Har 30 kunda keyingi matn olinadi |
| `data.json` | Qaysi mavzu navbatda ekani (bot o'zi yangilaydi) |
| `config.json` | Hashteglar va test vaqti matni |

## Yangi mavzu qo'shish

`content/topics.json` oxiriga yangi mavzu qo'shing (mavjudlaridan nusxa oling, `id` ni keyingi raqam qiling).
Testlarda **birinchi variant doim to'g'ri javob** — bot variantlarni o'zi aralashtiradi.
Keyin rasmlarni qayta yasang:

```
python3 tools/render.py "@kanal_nomi"
```

(Pillow kutubxonasi va Inter shrifti kerak. Buni Claude'dan so'rasangiz, o'zi qilib beradi.)

## Vaqtni o'zgartirish

`.github/workflows/post.yml` dagi `cron` qatorlari UTC vaqtda yozilgan (Toshkent = UTC+5):
- `47 3 * * *` → 08:47 Toshkent (rasm)
- `47 4 * * *` → 09:47 Toshkent (Rossiya rasmi)
- `47 12 * * *` → 17:47 Toshkent (test)

GitHub ba'zan 5–20 daqiqa kechiktiradi — bu normal.

## Telegram mini ilova

`app/` papkasida so'z kartochkalari va testlar ilovasi bor. U `content/topics.json` dagi mavzulardan foydalanadi, shuning uchun yangi mavzu qo'shilsa, ilovada ham chiqadi.

1. **Settings → Pages** → Branch: `main`, papka: `/ (root)` → Save.
2. Manzil: `https://sagdullayevdoniyor20-lgtm.github.io/rus-tili-kanal/app/`
3. @BotFather → botingiz → **Bot Settings → Menu Button** → shu manzil (yoki `/newapp`).
