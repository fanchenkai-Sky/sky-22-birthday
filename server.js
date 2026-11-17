/* Sky's 22nd Birthday · Node 后端
   - 静态托管 public/（首屏 + 看板前端）
   - /api/submit  匿名提交 {nat, age, gender}
   - /api/stats   返回全部记录（前端聚合）
   - 数据库：Render Postgres（DATABASE_URL），本地无则内存兜底
*/
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

// ---- 数据库：优先 Postgres，本地无 DATABASE_URL 时内存兜底 ----
let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  pool.query(
    `CREATE TABLE IF NOT EXISTS entries (
       id SERIAL PRIMARY KEY,
       nat TEXT NOT NULL,
       age INT,
       gender TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  ).then(() => console.log("entries 表就绪")).catch((e) => console.error("建表失败:", e));
}
const mem = [];

// ---- API ----
app.post("/api/submit", async (req, res) => {
  const { nat, age, gender } = req.body || {};
  if (!nat || !gender || !(Number(age) > 0)) {
    return res.status(400).json({ error: "invalid payload" });
  }
  const rec = { nat: String(nat), age: Number(age), gender: String(gender) };
  try {
    if (pool) {
      await pool.query(
        "INSERT INTO entries (nat, age, gender) VALUES ($1, $2, $3)",
        [rec.nat, rec.age, rec.gender]
      );
    } else {
      mem.push(rec);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("submit error:", e);
    res.status(500).json({ error: "db error" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const rows = pool
      ? (await pool.query("SELECT nat, age, gender FROM entries")).rows
      : mem;
    res.json(rows);
  } catch (e) {
    console.error("stats error:", e);
    res.status(500).json({ error: "db error" });
  }
});

// ---- 自检端点：一眼确认数据落点（防静默降级）----
app.get("/api/health", async (req, res) => {
  let count = null;
  let dbOk = false;
  if (pool) {
    try {
      const r = await pool.query("SELECT COUNT(*)::int AS n FROM entries");
      count = r.rows[0].n;
      dbOk = true;
    } catch (e) {
      console.error("health db error:", e);
    }
  } else {
    console.error("!! WARNING: DATABASE_URL 未设置，数据仅存内存，重启即丢失 !!");
    count = mem.length;
  }
  res.json({
    storage: dbOk ? "postgres" : "memory",
    count,
    warning: dbOk ? null : "DATABASE_URL missing — data is NOT persistent"
  });
});

// ---- 静态前端 ----
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Sky22 listening on " + PORT));
