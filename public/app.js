/* ============================================================
   Sky's 22nd Birthday · 交互逻辑
   流程：问候(Happy Birthday) → 问卷(先填) → 揭晓统计(后看)
   中英双语 / 实时看板 / 玻璃拟态
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 文案字典 ---------- */
  const dict = {
    en: {
      greeting_sub: "It's my 22nd birthday — and I turned it into a tiny world portrait.",
      greeting_sub_zh: "今天是我 22 岁生日，我把它做成了一幅小小的世界画像。",
      greeting_line: "Scanning this means you're now part of it. Spare 30 seconds to tell me where you're from, how old you are, and your gender — then watch the world light up.",
      btn_start: "Start · 开始",
      form_title: "Leave your mark",
      form_title_zh: "留个痕迹",
      form_sub: "30 seconds. Anonymous. Only nationality, age & gender.",
      lbl_nat: "Where are you from? / 你来自哪里？",
      lbl_age: "Your age? / 你的年龄？",
      lbl_gender: "Gender? / 性别？",
      g_male: "Male", g_female: "Female", g_nb: "Non-binary", g_na: "Prefer not to say",
      btn_reveal: "Reveal the birthday 🎂",
      skip: "Skip · 直接看",
      privacy: "Anonymous stats · only nationality, age & gender. No names collected.",
      privacy_zh: "匿名统计 · 仅收国籍/年龄/性别，不收集姓名。",
      hb_sub: "22 · the in-between age / 在之间的年纪",
      live: "joined", live_zh: "人已参与",
      h_nat: "Nationalities", h_nat_zh: "国籍分布",
      h_age: "Age", h_age_zh: "年龄分布",
      h_gender: "Gender", h_gender_zh: "性别",
      h_qr: "Scan to share", h_qr_zh: "扫码分享",
      footer: "Made with strangers · Sydney 2026",
      others: "Other", age_na: "Unknown"
    },
    zh: {
      greeting_sub: "今天是我 22 岁生日，我把它做成了一幅小小的世界画像。",
      greeting_sub_zh: "It's my 22nd birthday — and I turned it into a tiny world portrait.",
      greeting_line: "你扫了这个码，就已经是它的一部分了。花 30 秒告诉我你来自哪里、几岁、什么性别——然后看这个世界被点亮。",
      btn_start: "开始 · Start",
      form_title: "留个痕迹",
      form_title_zh: "Leave your mark",
      form_sub: "30 秒。匿名。只收国籍、年龄、性别。",
      lbl_nat: "你来自哪里？ / Where are you from?",
      lbl_age: "你的年龄？ / Your age?",
      lbl_gender: "性别？ / Gender?",
      g_male: "男", g_female: "女", g_nb: "非二元", g_na: "不愿说",
      btn_reveal: "揭晓生日 🎂",
      skip: "直接看 · Skip",
      privacy: "匿名统计 · 仅收国籍/年龄/性别，不收集姓名。",
      privacy_zh: "Anonymous stats · only nationality, age & gender. No names collected.",
      hb_sub: "22 · 在之间的年纪 / the in-between age",
      live: "人已参与", live_zh: "joined",
      h_nat: "国籍分布", h_nat_zh: "Nationalities",
      h_age: "年龄分布", h_age_zh: "Age",
      h_gender: "性别", h_gender_zh: "Gender",
      h_qr: "扫码分享", h_qr_zh: "Scan to share",
      footer: "Made with strangers · Sydney 2026",
      others: "其他", age_na: "未知"
    }
  };

  const GENDER = {
    male:   { en: "Male",           zh: "男",     color: "#5b8def" },
    female: { en: "Female",         zh: "女",     color: "#ff6fb5" },
    nb:     { en: "Non-binary",     zh: "非二元", color: "#9b7cff" },
    na:     { en: "Prefer not to say", zh: "不愿说", color: "#8a8aa0" }
  };

  const AGE_ORDER = ["u17", "18-21", "22-25", "26-30", "31-40", "40+", "na"];
  const AGE_LABEL = {
    u17:   { en: "≤17",     zh: "17 岁以下" },
    "18-21": { en: "18–21", zh: "18–21" },
    "22-25": { en: "22–25", zh: "22–25" },
    "26-30": { en: "26–30", zh: "26–30" },
    "31-40": { en: "31–40", zh: "31–40" },
    "40+":   { en: "40+",   zh: "40+" },
    na:     { en: "Unknown", zh: "未知" }
  };

  let lang = "en";

  /* ---------- 多语言 ---------- */
  function applyLang(l) {
    lang = l;
    document.body.classList.toggle("lang-zh", l === "zh");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[l][key] != null) el.textContent = dict[l][key];
    });
    document.getElementById("lang-toggle").textContent = l === "en" ? "中文" : "EN";
    // 动态内容若已渲染，重绘标签
    if (document.getElementById("screen-stats").classList.contains("active")) {
      renderStats(DataStore.getStats(), true);
    }
  }
  document.getElementById("lang-toggle").addEventListener("click", () => {
    applyLang(lang === "en" ? "zh" : "en");
  });

  function t(key) { return dict[lang][key]; }
  function regionLabel(code) {
    const r = window.REGION_MAP[code];
    if (!r) return t("others");
    return lang === "zh" ? r.zh : r.en;
  }
  function regionFlag(code) {
    const r = window.REGION_MAP[code];
    return r ? r.flag : "🌍";
  }

  /* ---------- 屏幕切换 ---------- */
  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.getElementById("btn-start").addEventListener("click", () => show("screen-survey"));
  document.getElementById("btn-skip").addEventListener("click", () => {
    show("screen-stats");
    renderStats(DataStore.getStats());
    DataStore.subscribe((s) => renderStats(s));
    launchConfetti();
  });

  /* ---------- 问卷 ---------- */
  const form = document.getElementById("survey");
  const genderBox = document.getElementById("f-gender");
  let pickedGender = null;

  // 填充地区下拉
  const natSel = document.getElementById("f-nat");
  window.REGIONS.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.code;
    opt.textContent = r.flag + "  " + (lang === "zh" ? r.zh : r.en);
    natSel.appendChild(opt);
  });

  genderBox.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      genderBox.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      pickedGender = b.getAttribute("data-g");
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nat = natSel.value;
    const age = document.getElementById("f-age").value;
    if (!nat || !age || !pickedGender) {
      // 简单提示
      if (!pickedGender) genderBox.style.outline = "1px solid var(--rose)";
      return;
    }
    genderBox.style.outline = "none";
    document.getElementById("btn-reveal").disabled = true;
    DataStore.submit({ nat, age, gender: pickedGender }).then(() => {
      show("screen-stats");
      renderStats(DataStore.getStats());
      DataStore.subscribe((s) => renderStats(s));
      launchConfetti();
    });
  });

  /* ---------- 看板渲染 ---------- */
  function countUp(el, to) {
    const from = parseInt(el.textContent.replace(/\D/g, ""), 10) || 0;
    if (from === to) { el.textContent = to; return; }
    const dur = 600, t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderStats(stats, relabelOnly) {
    // 实时人数
    countUp(document.getElementById("live-count"), stats.total);

    // 国籍：Top 8 + 其他
    const natCounts = stats.nat.slice();
    let top = natCounts.slice(0, 8);
    const rest = natCounts.slice(8);
    const restCount = rest.reduce((s, x) => s + x.count, 0);
    if (restCount > 0) top = top.concat([{ key: "__other", count: restCount }]);
    const maxNat = top.length ? top[0].count : 1;
    const natHtml = top.map((x) => {
      const flag = x.key === "__other" ? "🌍" : regionFlag(x.key);
      const label = x.key === "__other" ? t("others") : regionLabel(x.key);
      const pct = stats.total ? Math.round((x.count / stats.total) * 100) : 0;
      return barRow(flag + " " + label, x.count, x.count / maxNat, pct);
    }).join("");
    document.getElementById("nat-bars").innerHTML = natHtml;
    animateBars("nat-bars");

    // 年龄
    const ageMap = {};
    stats.age.forEach((a) => (ageMap[a.key] = a.count));
    const ageRows = AGE_ORDER.filter((k) => ageMap[k]).map((k) => {
      const c = ageMap[k];
      const maxAge = Math.max(...Object.values(ageMap), 1);
      const pct = stats.total ? Math.round((c / stats.total) * 100) : 0;
      const lab = (AGE_LABEL[k] ? (lang === "zh" ? AGE_LABEL[k].zh : AGE_LABEL[k].en) : k);
      return barRow(lab, c, c / maxAge, pct);
    }).join("");
    document.getElementById("age-bars").innerHTML = ageRows;
    animateBars("age-bars");

    // 性别环形
    renderDonut(stats);
  }

  function barRow(label, count, ratio, pct) {
    const w = Math.max(6, Math.round(ratio * 100));
    return (
      '<div class="bar-row">' +
        '<div class="bar-label"><span class="txt">' + label + "</span></div>" +
        '<div class="bar-val">' + count + " · " + pct + "%</div>" +
        '<div class="bar-track"><div class="bar-fill" data-w="' + w + '"></div></div>' +
      "</div>"
    );
  }
  function animateBars(id) {
    requestAnimationFrame(() => {
      document.querySelectorAll("#" + id + " .bar-fill").forEach((f) => {
        f.style.width = f.getAttribute("data-w") + "%";
      });
    });
  }

  function renderDonut(stats) {
    const svg = document.getElementById("donut");
    const R = 52, C = 2 * Math.PI * R;
    const genMap = {};
    stats.gender.forEach((g) => (genMap[g.key] = g.count));
    const segs = ["male", "female", "nb", "na"].filter((k) => genMap[k]);
    const total = stats.total || 1;
    let acc = 0;
    let html = '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14"/>';
    segs.forEach((k) => {
      const v = genMap[k];
      const frac = v / total;
      const len = frac * C;
      html +=
        '<circle class="donut-seg" cx="60" cy="60" r="' + R + '" fill="none" ' +
        'stroke="' + GENDER[k].color + '" stroke-width="14" stroke-linecap="butt" ' +
        'stroke-dasharray="' + len + " " + (C - len) + '" ' +
        'stroke-dashoffset="' + (-acc) + '"/>';
      acc += len;
    });
    svg.innerHTML = html;
    // 中心：总人数
    document.getElementById("donut-center").innerHTML =
      '<div class="num">' + stats.total + '</div><div class="cap">' + (lang === "en" ? "people" : "人") + "</div>";

    // 图例
    const legend = segs.map((k) => {
      const v = genMap[k];
      const pct = Math.round((v / total) * 100);
      const label = lang === "zh" ? GENDER[k].zh : GENDER[k].en;
      return (
        '<div class="legend-row">' +
          '<span class="sw" style="background:' + GENDER[k].color + '"></span>' +
          '<span class="lg-txt">' + label + "</span>" +
          '<span class="lg-val">' + v + " · " + pct + "%</span>" +
        "</div>"
      );
    }).join("");
    document.getElementById("gender-legend").innerHTML = legend;
  }

  /* ---------- 二维码（指向当前 URL，部署后即为真实地址）---------- */
  function renderQR() {
    const box = document.getElementById("qrcode");
    const urlEl = document.getElementById("qr-url");
    const url = location.href;
    urlEl.textContent = url;
    if (window.QRCode) {
      box.innerHTML = "";
      new QRCode(box, { text: url, width: 134, height: 134, colorDark: "#1a0e22", colorLight: "#ffffff" });
    } else {
      box.textContent = "QR offline";
    }
  }
  window.addEventListener("load", renderQR);

  /* ---------- 彩带 ---------- */
  function launchConfetti() {
    const canvas = document.getElementById("confetti");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = window.innerWidth, H = window.innerHeight;
    const colors = ["#ff5e8a", "#ffc24b", "#8b6cff", "#5fe0ff", "#ffffff"];
    const N = 150;
    const parts = [];
    for (let i = 0; i < N; i++) {
      parts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.5,
        r: 4 + Math.random() * 6,
        c: colors[(Math.random() * colors.length) | 0],
        vy: 2 + Math.random() * 4,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
        life: 1
      });
    }
    const t0 = performance.now();
    function frame(now) {
      const el = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      parts.forEach((p) => {
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        p.vy += 0.05;
        if (el > 2.2) p.life -= 0.02;
        if (p.y < H + 30 && p.life > 0) alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });
      if (alive && el < 6) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 初始化 ---------- */
  applyLang("en");
  show("screen-greeting");
})();
