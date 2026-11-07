// Telegram mini ilova: so'z kartochkalari va testlar.
// Har bir ilova (rus / ingliz) index.html da window.ILOVA = { yukla, ... } beradi:
//   yukla() → Promise<[{ id, nomi, izoh, toifa?, kartalar: [{ old, oldIzoh, orqa, orqaIzoh, misol, ovoz }],
//                        savollar: [{ q, o: [to'g'ri, ...noto'g'ri], e }] }]>
// Natijalar Telegram CloudStorage'da (Telegram'dan tashqarida — localStorage'da) saqlanadi.
(() => {
  const tg = window.Telegram?.WebApp;
  const C = window.ILOVA;
  const $ = (s, el = document) => el.querySelector(s);
  const ilova = $('#ilova');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- Saqlash ----------
  // Ikkala ilova bir xil github.io domenida turadi, shuning uchun kalit ilovaga qarab har xil.
  const KALIT = `natija-${C.til}`;
  let natija = { eng: {}, yod: {} }; // eng: guruh → eng yaxshi ball, yod: guruh → yodlangan kartalar soni
  const cloud = tg?.CloudStorage && tg.isVersionAtLeast?.('6.9') ? tg.CloudStorage : null;
  function oqi() {
    return new Promise((tayyor) => {
      const ol = (matn) => {
        try { Object.assign(natija, JSON.parse(matn || '{}')); } catch { /* buzilgan bo'lsa — boshidan */ }
        tayyor();
      };
      if (cloud) cloud.getItem(KALIT, (xato, qiymat) => ol(xato ? localStorage.getItem(KALIT) : qiymat));
      else ol(localStorage.getItem(KALIT));
    });
  }
  function saqla() {
    const matn = JSON.stringify(natija);
    localStorage.setItem(KALIT, matn);
    cloud?.setItem(KALIT, matn, () => {});
  }

  // ---------- Yordamchilar ----------
  const tebran = (tur) => {
    const h = tg?.HapticFeedback;
    if (!h) return;
    if (tur === 'ok' || tur === 'xato') h.notificationOccurred(tur === 'ok' ? 'success' : 'error');
    else h.impactOccurred('light');
  };
  function aralash(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const ovozBor = 'speechSynthesis' in window;
  function ayt(matn) {
    if (!ovozBor || !matn) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(matn);
    u.lang = C.til;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // Orqaga tugmasi: Telegram'da tepadagi tizim tugmasi, brauzerda — ekrandagi tugma.
  let orqagaFn = null;
  function orqaga(fn) {
    orqagaFn = fn;
    if (tg?.BackButton) fn ? tg.BackButton.show() : tg.BackButton.hide();
  }
  tg?.BackButton?.onClick(() => orqagaFn?.());
  const orqaTugma = () => (tg?.BackButton && tg.platform !== 'unknown' ? '' : `<button class="orqa" data-orqa>‹ Orqaga</button>`);
  ilova.addEventListener('click', (e) => { if (e.target.closest('[data-orqa]')) orqagaFn?.(); });

  // ---------- Bosh sahifa ----------
  let guruhlar = [];
  let rejim = 'karta';
  let toifa = null;

  function bosh() {
    orqaga(null);
    const toifalar = [...new Set(guruhlar.map((g) => g.toifa).filter(Boolean))];
    if (toifalar.length && !toifalar.includes(toifa)) toifa = toifalar[0];
    const korinadi = guruhlar.filter((g) => !toifa || g.toifa === toifa);
    const jamiYod = Object.values(natija.yod).reduce((a, b) => a + b, 0);
    const testlar = Object.keys(natija.eng).length;
    const ism = tg?.initDataUnsafe?.user?.first_name;
    ilova.innerHTML = `
      <header class="bosh">
        <img class="logo" src="${C.logo}" alt="">
        <div>
          <h1>${esc(C.nomi)}</h1>
          <p>${ism ? `Salom, ${esc(ism)}! ` : ''}${esc(C.shior)}</p>
        </div>
      </header>
      <div class="statlar">
        <div><b>${jamiYod}</b><span>so'z yodlandi</span></div>
        <div><b>${testlar}</b><span>test yechildi</span></div>
      </div>
      <div class="tablar">
        <button data-rejim="karta" class="${rejim === 'karta' ? 'faol' : ''}">🃏 Kartochkalar</button>
        <button data-rejim="test" class="${rejim === 'test' ? 'faol' : ''}">📝 Test</button>
      </div>
      ${toifalar.length ? `<div class="toifalar">${toifalar.map((t) => `<button data-toifa="${esc(t)}" class="${t === toifa ? 'faol' : ''}">${esc(t)}</button>`).join('')}</div>` : ''}
      <div class="guruhlar">
        ${korinadi.map((g) => {
          const ball = natija.eng[g.id];
          const yod = natija.yod[g.id] || 0;
          const belgi = rejim === 'test'
            ? (ball != null ? `<em class="${ball === g.savollar.length ? 'toliq' : ''}">${ball}/${g.savollar.length}</em>` : '')
            : (yod ? `<em class="${yod >= g.kartalar.length ? 'toliq' : ''}">${yod >= g.kartalar.length ? '✓' : `${yod}/${g.kartalar.length}`}</em>` : '');
          return `<button class="guruh" data-guruh="${esc(g.id)}">
            ${g.belgi ? `<span class="belgi">${g.belgi}</span>` : ''}
            <span class="g-nomi">${esc(g.nomi)}</span>
            <span class="g-izoh">${esc(g.izoh)}</span>${belgi}
          </button>`;
        }).join('')}
      </div>`;
    ilova.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.rejim) { rejim = b.dataset.rejim; tebran(); bosh(); }
      else if (b.dataset.toifa) { toifa = b.dataset.toifa; tebran(); bosh(); }
      else if (b.dataset.guruh) {
        tebran();
        const g = guruhlar.find((x) => x.id === b.dataset.guruh);
        rejim === 'test' ? test(g) : kartalar(g);
      }
    };
    window.scrollTo(0, 0);
  }

  // ---------- Kartochkalar ----------
  function kartalar(g) {
    orqaga(bosh);
    let navbat = aralash(g.kartalar.map((_, i) => i));
    const bildi = new Set();
    const jami = g.kartalar.length;

    function chiz() {
      if (!navbat.length) return tugadi();
      const k = g.kartalar[navbat[0]];
      ilova.innerHTML = `
        ${orqaTugma()}
        <div class="sarlavha"><b>${esc(g.nomi)}</b><span>${bildi.size}/${jami}</span></div>
        <div class="chiziq"><i style="width:${(bildi.size / jami) * 100}%"></i></div>
        <div class="karta-joy">
          <div class="karta" data-ochish>
            <div class="yuz old">
              ${k.belgi ? `<div class="k-belgi">${k.belgi}</div>` : ''}
              <div class="k-soz">${esc(k.old)}</div>
              ${k.oldIzoh ? `<div class="k-izoh">${esc(k.oldIzoh)}</div>` : ''}
              <div class="k-maslahat">👆 Bosing — tarjimasi</div>
            </div>
            <div class="yuz orqa">
              <div class="k-soz">${esc(k.orqa)}</div>
              ${k.orqaIzoh ? `<div class="k-izoh">${k.orqaIzoh}</div>` : ''}
              ${k.misol ? `<div class="k-misol">${k.misol}</div>` : ''}
            </div>
          </div>
          ${ovozBor ? `<button class="ovoz" data-ovoz title="Eshitish">🔊</button>` : ''}
        </div>
        <div class="tugmalar">
          <button class="qayta" data-javob="0">🔁 Yana ko'raman</button>
          <button class="bildim" data-javob="1">✅ Bilaman</button>
        </div>`;
      ilova.onclick = (e) => {
        if (e.target.closest('[data-ovoz]')) return ayt(k.ovoz ?? k.old);
        if (e.target.closest('[data-ochish]')) { $('.karta').classList.toggle('ochiq'); return tebran(); }
        const b = e.target.closest('[data-javob]');
        if (!b) return;
        const i = navbat.shift();
        if (b.dataset.javob === '1') { bildi.add(i); tebran('ok'); }
        else { navbat.push(i); tebran(); } // bilmagan so'z oxiriga qaytadi
        chiz();
      };
    }

    function tugadi() {
      natija.yod[g.id] = Math.max(natija.yod[g.id] || 0, jami);
      saqla();
      ilova.innerHTML = `
        <div class="yakun">
          <div class="katta">🎉</div>
          <h2>Barakalla!</h2>
          <p>«${esc(g.nomi)}» mavzusidagi ${jami} ta so'zning hammasini ko'rib chiqdingiz.</p>
          <button class="asosiy" data-test>📝 Endi test yechish</button>
          <button class="ikkinchi" data-qayta>🔁 Yana bir marta</button>
          <button class="ikkinchi" data-orqa>🏠 Bosh sahifa</button>
        </div>`;
      ilova.onclick = (e) => {
        if (e.target.closest('[data-test]')) test(g);
        else if (e.target.closest('[data-qayta]')) kartalar(g);
      };
    }
    chiz();
  }

  // ---------- Test ----------
  function test(g) {
    orqaga(bosh);
    const savollar = g.savollar.map((s) => ({ ...s, v: aralash(s.o.map((matn, i) => ({ matn, togri: i === 0 }))) }));
    let i = 0;
    let ball = 0;

    function chiz() {
      if (i >= savollar.length) return tugadi();
      const s = savollar[i];
      ilova.innerHTML = `
        ${orqaTugma()}
        <div class="sarlavha"><b>${esc(g.nomi)}</b><span>${i + 1}/${savollar.length}</span></div>
        <div class="chiziq"><i style="width:${(i / savollar.length) * 100}%"></i></div>
        <div class="savol">${esc(s.q)}</div>
        <div class="variantlar">
          ${s.v.map((v, j) => `<button class="variant" data-v="${j}">${esc(v.matn)}</button>`).join('')}
        </div>
        <div class="izoh-joy"></div>`;
      ilova.onclick = (e) => {
        const b = e.target.closest('[data-v]');
        if (!b || b.disabled) return;
        const tanlov = s.v[b.dataset.v];
        ilova.querySelectorAll('.variant').forEach((x, j) => {
          x.disabled = true;
          if (s.v[j].togri) x.classList.add('togri');
        });
        if (tanlov.togri) { ball++; tebran('ok'); } else { b.classList.add('xato'); tebran('xato'); }
        $('.izoh-joy').innerHTML = `
          <div class="izoh ${tanlov.togri ? 'ok' : 'yoq'}">
            <b>${tanlov.togri ? "✅ To'g'ri!" : "❌ Noto'g'ri"}</b>${s.e ? `<span>💡 ${esc(s.e)}</span>` : ''}
          </div>
          <button class="asosiy" data-keyingi>${i + 1 < savollar.length ? 'Keyingi savol →' : 'Natijani ko\'rish'}</button>`;
        $('[data-keyingi]').onclick = (ev) => { ev.stopPropagation(); i++; chiz(); };
      };
    }

    function tugadi() {
      const jami = savollar.length;
      const oldingi = natija.eng[g.id];
      natija.eng[g.id] = Math.max(oldingi ?? 0, ball);
      saqla();
      const foiz = ball / jami;
      const [emoji, gap] = foiz === 1 ? ['🏆', "Ajoyib! Hammasi to'g'ri!"] : foiz >= 0.7 ? ['🎉', 'Zo\'r natija!'] : foiz >= 0.4 ? ['👍', "Yomon emas, yana mashq qiling!"] : ['💪', 'Kartochkalarni takrorlab, qayta urinib ko\'ring!'];
      tebran(foiz >= 0.7 ? 'ok' : undefined);
      ilova.innerHTML = `
        <div class="yakun">
          <div class="katta">${emoji}</div>
          <h2>${ball} / ${jami}</h2>
          <p>${gap}</p>
          ${oldingi != null && ball > oldingi ? `<p class="rekord">🔥 Yangi rekord! (oldin: ${oldingi})</p>` : ''}
          <button class="asosiy" data-qayta>🔁 Qayta yechish</button>
          <button class="ikkinchi" data-karta>🃏 Kartochkalarni ko'rish</button>
          <button class="ikkinchi" data-orqa>🏠 Bosh sahifa</button>
        </div>`;
      ilova.onclick = (e) => {
        if (e.target.closest('[data-qayta]')) test(g);
        else if (e.target.closest('[data-karta]')) kartalar(g);
      };
    }
    chiz();
  }

  // ---------- Ishga tushirish ----------
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor?.(C.sarlavhaRangi);
  tg?.setBackgroundColor?.(C.sarlavhaRangi);
  Promise.all([C.yukla(), oqi()])
    .then(([g]) => { guruhlar = g; bosh(); })
    .catch((xato) => {
      ilova.innerHTML = `<div class="yakun"><div class="katta">😕</div><h2>Yuklab bo'lmadi</h2><p>${esc(xato.message)}</p><button class="asosiy" onclick="location.reload()">Qayta urinish</button></div>`;
    });
})();
