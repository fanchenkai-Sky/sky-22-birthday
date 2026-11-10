# Sky's 22nd Birthday · 统计生日页

路人扫码 → Happy Birthday → 填国籍 / 年龄 / 性别 → 实时统计看板（国旗排行榜 + 年龄分布 + 性别环形，每 4 秒刷新）。

## 目录结构
- `public/` 前端：`index.html` `styles.css` `app.js` `countries.js` `data.js`
- `server.js` Node/Express 后端：托管前端 + `/api/submit`、`/api/stats`
- `package.json` 依赖（express、pg）
- 数据库：**Render Postgres**（环境变量 `DATABASE_URL`），本地无则内存兜底

## 本地预览
```bash
npm install
node server.js            # http://localhost:3000
```
- 看视觉/双语：直接开 `http://localhost:3000`（走本地示例数据）
- 验证 API 闭环：开 `http://localhost:3000/?api=1`（走本地内存模式 `/api`，提交后看板实时更新）

## 部署到 Render（全包方案）
1. 把本目录推到 **GitHub 公开仓库**。
2. 在 Render 建一个 **Postgres**（免费）实例，拿到内部 `DATABASE_URL`。
3. 建一个 **Web Service** 连该仓库，`Build Command: npm install`，`Start Command: node server.js`。
4. 给 Web Service 加环境变量 `DATABASE_URL = <Postgres 内部 URL>`。
5. 部署完成后拿到 `https://<name>.onrender.com`。

## 更新流程
改 `public/` 下文件 → `git commit` → `git push` → Render 自动重部署（1–2 分钟）。

## 数据说明
仅匿名聚合三类：国籍 `nat`、年龄 `age`、性别 `gender`，不收集任何姓名/联系方式。
