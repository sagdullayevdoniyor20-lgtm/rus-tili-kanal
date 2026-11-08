# Rus tili kanali boti

Har kuni Telegram kanalga özi post qiladi:

- 🌅 **~09:00** — mavzu rasmi va tagida 10–15 ta söz (rusça — özbekça)
- 🇷🇺 **~10:00** — Rossiya haqida rasm (Wikimedia Commons saytidan) va rusça + özbekça qisqa tavsif
- 🌆 **~18:00** — şu mavzu böyiça 10 ta test (Telegram quiz): söz birikmalari va gaplar

Hozir **30 ta mavzu** tayyor (oziq-ovqat, oila, uy, kiyim, transport...). 30-kundan keyin bot boşidan boşlaydi.
GitHub Actions'da bepul işlaydi, kompyuter yoqiq turişi şart emas.

---

## Örnatiş

### 1. Telegram
1. @BotFather → `/newbot` → **token**ni oling.
2. Kanal oçing va botni kanalga **admin** qiling ("Xabar joylaş" ruxsati bilan).

### 2. GitHub
1. Yangi **public** repo oçing va şu papkadagi hamma fayllarni yuklang (`.github` papkasi ham!).
2. **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `BOT_TOKEN` | BotFather bergan token |
| `CHANNEL` | `@rustilinoldan2` |

3. **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**.

### 3. Sinab köriş
**Actions → Rus tili kanali → Run workflow** → `words` ni tanlang → kanalga 1-mavzu çiqadi.
Keyin yana **Run workflow** → `quiz` → şu mavzu testlari çiqadi.

Şundan keyin bot har kuni özi işlaydi.

---

## Fayllar

| Fayl | Nima |
|---|---|
| `content/topics.json` | Barça mavzular: sözlar va testlar |
| `images/` | Har bir mavzuning rasmi (`1.png`, `2.png`, ...) |
| `tools/render.py` | Rasmlarni yasaydigan dastur |
| `run.js` | Kanalga joylaydigan bot |
| `content/russia.json` | Rossiyadagi 30 ta joy: nomi, rasm qidiriş sözi va 3 xil matn (rusça/özbekça). Har 30 kunda keyingi matn olinadi |
| `data.json` | Qaysi mavzu navbatda ekani (bot özi yangilaydi) |
| `config.json` | Haşteglar va test vaqti matni |

## Yangi mavzu qöşiş

`content/topics.json` oxiriga yangi mavzu qöşing (mavjudlaridan nusxa oling, `id` ni keyingi raqam qiling).
Testlarda **birinçi variant doim töğri javob** — bot variantlarni özi aralaştiradi.
Keyin rasmlarni qayta yasang:

```
python3 tools/render.py "@kanal_nomi"
```

(Pillow kutubxonasi va Inter şrifti kerak. Buni Claude'dan sörasangiz, özi qilib beradi.)

## Vaqtni özgartiriş

`.github/workflows/post.yml` dagi `cron` qatorlari UTC vaqtda yozilgan (Toşkent = UTC+5):
- `47 3 * * *` → 08:47 Toşkent (rasm)
- `47 4 * * *` → 09:47 Toşkent (Rossiya rasmi)
- `47 12 * * *` → 17:47 Toşkent (test)

GitHub ba'zan 5–20 daqiqa keçiktiradi — bu normal.

## Telegram mini ilova

`app/` papkasida söz kartoçkalari va testlar ilovasi bor. U `content/topics.json` dagi mavzulardan foydalanadi, şuning uçun yangi mavzu qöşilsa, ilovada ham çiqadi.

1. **Settings → Pages** → Branch: `main`, papka: `/ (root)` → Save.
2. Manzil: `https://sagdullayevdoniyor20-lgtm.github.io/rus-tili-kanal/app/`
3. @BotFather → botingiz → **Bot Settings → Menu Button** → şu manzil (yoki `/newapp`).
