/* ============================================================
   数据层（DataStore）
   ------------------------------------------------------------
   - 线上模式：调自有后端 API（同源 /api），任何人可匿名提交 + 公开读取，
     看板每 4 秒轮询刷新 → 真正实现「持续更新 / 实时统计」。
   - 本地预览：localStorage + 跨标签页广播 + 示例数据。
   - 调试：本地访问加 ?api=1 可强制走 /api（配合本地 server.js 内存模式）。
   ============================================================ */
(function () {
  const KEY = "sky22_entries";
  const SEED_FLAG = "sky22_seeded";
  const listeners = new Set();
  let pollTimer = null;

  // 部署后（非 localhost）走自有 API；本地预览退回示例数据；?api=1 可强制 API。
  const isLocalPreview = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const forceApi = location.search.indexOf("api=1") !== -1;
  const CLOUD_MODE = !isLocalPreview || forceApi;

  // ---- 年龄分桶 ----
  function ageBucket(a) {
    a = Number(a);
    if (!a || a < 1) return "na";
    if (a <= 17) return "u17";
    if (a <= 21) return "18-21";
    if (a <= 25) return "22-25";
    if (a <= 30) return "26-30";
    if (a <= 40) return "31-40";
    return "40+";
  }

  // ---- 本地读写 ----
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

  // ---- 示例数据（仅本地预览）----
  const SAMPLE = [
    ["au",22,"female"],["au",20,"male"],["au",23,"female"],["au",19,"male"],
    ["au",25,"female"],["au",21,"nb"],["au",30,"male"],["au",18,"female"],
    ["au",24,"male"],["au",22,"female"],["au",27,"female"],["au",20,"na"],
    ["cn",22,"male"],["cn",21,"female"],["cn",23,"male"],["cn",19,"female"],
    ["cn",24,"female"],["cn",22,"male"],["cn",20,"female"],["cn",25,"male"],
    ["cn",21,"nb"],
    ["us",22,"female"],["us",24,"male"],["us",19,"female"],["us",26,"male"],
    ["gb",23,"female"],["gb",21,"male"],["gb",20,"female"],
    ["jp",22,"male"],["jp",24,"female"],["jp",19,"male"],
    ["kr",21,"female"],["in",22,"male"],["in",25,"female"],
    ["id",20,"female"],["my",23,"male"],["sg",22,"female"],["nz",24,"male"],
    ["fr",26,"female"],["de",21,"male"],["ca",23,"female"],["br",22,"male"],
    ["other",28,"female"],["au",35,"male"],["cn",40,"female"],["us",31,"male"],
    ["gb",29,"female"]
  ].map(([nat, age, gender]) => ({ nat, age, gender, ts: Date.now() }));

  function seedIfEmpty() {
    if (CLOUD_MODE) return;
    if (!localStorage.getItem(SEED_FLAG) && read().length === 0) {
      write(SAMPLE);
      localStorage.setItem(SEED_FLAG, "1");
    }
  }

  // ---- 提交 ----
  async function submit(entry) {
    const rec = { nat: entry.nat, age: Number(entry.age), gender: entry.gender };
    if (CLOUD_MODE) {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nat: rec.nat, age: rec.age, gender: rec.gender })
      });
      if (!res.ok) throw new Error("submit failed: " + res.status);
      await refresh();
    } else {
      const arr = read();
      arr.push({ ...rec, ts: Date.now() });
      write(arr);
      notify();
    }
    return rec;
  }

  // ---- 拉取并广播 ----
  async function refresh() {
    if (!CLOUD_MODE) return;
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) { console.error("[sky22] stats failed:", res.status); return; }
      const rows = await res.json();
      notify(compute((rows || []).map((r) => ({ nat: r.nat, age: r.age, gender: r.gender }))));
    } catch (e) { console.error("[sky22] stats error:", e); }
  }

  // ---- 聚合（与语言无关，只算计数）----
  function compute(entries) {
    const total = entries.length;
    const nat = {}, age = {}, gen = {};
    entries.forEach((e) => {
      nat[e.nat] = (nat[e.nat] || 0) + 1;
      const b = ageBucket(e.age);
      age[b] = (age[b] || 0) + 1;
      gen[e.gender] = (gen[e.gender] || 0) + 1;
    });
    const natArr = Object.keys(nat).map((k) => ({ key: k, count: nat[k] }))
      .sort((a, b) => b.count - a.count);
    const ageArr = Object.keys(age).map((k) => ({ key: k, count: age[k] }));
    const genArr = Object.keys(gen).map((k) => ({ key: k, count: gen[k] }));
    return { total, nat: natArr, age: ageArr, gender: genArr };
  }

  function getStats() { return compute(read()); }

  function subscribe(cb) {
    listeners.add(cb);
    if (CLOUD_MODE && !pollTimer) {
      refresh();
      pollTimer = setInterval(refresh, 4000);
    }
    return () => listeners.delete(cb);
  }
  function notify(stats) {
    const s = stats || getStats();
    listeners.forEach((cb) => cb(s));
  }

  // 本地跨标签页实时同步
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) notify();
  });

  seedIfEmpty();

  window.DataStore = { submit, getStats, subscribe, ageBucket, CLOUD_MODE };
})();
