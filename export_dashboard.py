#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sky's 22nd Birthday · 数据看板图片导出
用法: python3 export_dashboard.py
- 自动拉线上 /api/stats；若为 0 条则用示例数据并在图上标注 SAMPLE
- 用 headless Chrome 截图，输出 sky22-dashboard.png
"""
import json, subprocess, urllib.request, os, sys
from collections import Counter

API = "https://sky-22-birthday.onrender.com/api/stats"
HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = os.path.join(HERE, "sky22-dashboard.png")

REGIONS = {
    "cn": ("🇨🇳", "China", "中国"), "hk": ("🇨🇳", "Hong Kong, China", "中国香港"),
    "mo": ("🇨🇳", "Macao, China", "中国澳门"), "tw": ("🇨🇳", "Taiwan, China", "中国台湾"),
    "au": ("🇦🇺", "Australia", "澳大利亚"), "us": ("🇺🇸", "United States", "美国"),
    "gb": ("🇬🇧", "United Kingdom", "英国"), "jp": ("🇯🇵", "Japan", "日本"),
    "kr": ("🇰🇷", "South Korea", "韩国"), "in": ("🇮🇳", "India", "印度"),
    "id": ("🇮🇩", "Indonesia", "印度尼西亚"), "my": ("🇲🇾", "Malaysia", "马来西亚"),
    "sg": ("🇸🇬", "Singapore", "新加坡"), "nz": ("🇳🇿", "New Zealand", "新西兰"),
    "fr": ("🇫🇷", "France", "法国"), "de": ("🇩🇪", "Germany", "德国"),
    "es": ("🇪🇸", "Spain", "西班牙"), "it": ("🇮🇹", "Italy", "意大利"),
    "ca": ("🇨🇦", "Canada", "加拿大"), "br": ("🇧🇷", "Brazil", "巴西"),
    "mx": ("🇲🇽", "Mexico", "墨西哥"), "za": ("🇿🇦", "South Africa", "南非"),
    "ng": ("🇳🇬", "Nigeria", "尼日利亚"), "ae": ("🇦🇪", "United Arab Emirates", "阿联酋"),
    "th": ("🇹🇭", "Thailand", "泰国"), "vn": ("🇻🇳", "Vietnam", "越南"),
    "ph": ("🇵🇭", "Philippines", "菲律宾"), "nl": ("🇳🇱", "Netherlands", "荷兰"),
    "se": ("🇸🇪", "Sweden", "瑞典"), "ru": ("🇷🇺", "Russia", "俄罗斯"),
    "other": ("🌍", "Other", "其他"),
}
GENDER = {
    "male": ("Male", "男", "#5b8def"), "female": ("Female", "女", "#ff6fb5"),
    "nb": ("Non-binary", "非二元", "#9b7cff"), "na": ("Prefer not to say", "不愿说", "#8a8aa0"),
}
SAMPLE = [
    ("au",22,"female"),("au",20,"male"),("au",23,"female"),("au",19,"male"),
    ("au",25,"female"),("au",21,"nb"),("au",30,"male"),("au",18,"female"),
    ("au",24,"male"),("au",22,"female"),("au",27,"female"),("au",20,"na"),
    ("cn",22,"male"),("cn",21,"female"),("cn",23,"male"),("cn",19,"female"),
    ("cn",24,"female"),("cn",22,"male"),("cn",20,"female"),("cn",25,"male"),
    ("cn",21,"nb"),("us",22,"female"),("us",24,"male"),("us",19,"female"),
    ("us",26,"male"),("gb",23,"female"),("gb",21,"male"),("gb",20,"female"),
    ("jp",22,"male"),("jp",24,"female"),("jp",19,"male"),("kr",21,"female"),
    ("in",22,"male"),("in",25,"female"),("id",20,"female"),("my",23,"male"),
    ("sg",22,"female"),("nz",24,"male"),("fr",26,"female"),("de",21,"male"),
    ("ca",23,"female"),("br",22,"male"),("other",28,"female"),("au",35,"male"),
    ("cn",40,"female"),("us",31,"male"),("gb",29,"female"),
]

def fetch():
    try:
        with urllib.request.urlopen(API, timeout=25) as r:
            return json.load(r), True
    except Exception as e:
        print("拉取线上数据失败，改用示例数据:", e)
        return [], False

def age_bucket(a):
    try: a = int(a)
    except: return "na"
    if a < 1: return "na"
    if a <= 17: return "u17"
    if a <= 21: return "18-21"
    if a <= 25: return "22-25"
    if a <= 30: return "26-30"
    if a <= 40: return "31-40"
    return "40+"

AGE_ORDER = ["u17","18-21","22-25","26-30","31-40","40+","na"]
AGE_LABEL = {"u17":"≤17","18-21":"18–21","22-25":"22–25","26-30":"26–30","31-40":"31–40","40+":"40+","na":"未知"}

def bar(label, count, ratio, pct, flag=""):
    w = max(4, round(ratio*100))
    return (f'<div class="row"><div class="lab">{flag}{label}</div>'
            f'<div class="val">{count} · {pct}%</div>'
            f'<div class="track"><div class="fill" style="width:{w}%"></div></div></div>')

def build_html(rows, is_live):
    total = len(rows)
    nat = Counter(x["nat"] for x in rows)
    gen = Counter(x["gender"] for x in rows)
    age = Counter(age_bucket(x["age"]) for x in rows)
    top = nat.most_common(8)
    rest = sum(n for _, n in nat.most_common()[8:])
    if rest: top.append(("__other", rest))
    maxn = top[0][1] if top else 1
    def nat_meta(k):
        if k == "__other":
            return ("🌍", "Other", "其他")
        return REGIONS.get(k, ("🌍", k, k))
    nat_html = "".join(
        bar(nat_meta(k)[1], n, n/maxn, round(n/total*100) if total else 0,
            nat_meta(k)[0]+" ")
        for k,n in top
    ) or '<div class="empty">暂无数据</div>'
    maxa = max(age.values()) if age else 1
    age_html = "".join(
        bar(AGE_LABEL[k], age[k], age[k]/maxa, round(age[k]/total*100) if total else 0)
        for k in AGE_ORDER if age[k]
    ) or '<div class="empty">暂无数据</div>'
    # 性别环形（conic-gradient）
    segs, acc = [], 0.0
    for k in ("male","female","nb","na"):
        if gen[k]:
            p = gen[k]/total*100
            c = GENDER[k][2]
            segs.append(f"{c} {acc:.2f}% {acc+p:.2f}%")
            acc += p
    donut = "conic-gradient(" + ",".join(segs) + ")" if segs else "rgba(255,255,255,.08)"
    legend = "".join(
        f'<div class="lg"><i style="background:{GENDER[k][2]}"></i><span>{GENDER[k][0]}</span><b>{gen[k]} · {round(gen[k]/total*100)}%</b></div>'
        for k in ("male","female","nb","na") if gen[k]
    ) or '<div class="empty">暂无数据</div>'
    badge = ("<span class='live'><i></i>LIVE · 实时数据</span>" if is_live
             else "<span class='sample'>SAMPLE · 示例数据（现场暂无提交）</span>")
    stamp = "现场尚未开始扫码，此为效果预览" if not is_live else "数据每 4 秒自动刷新"

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:900px;min-height:1500px;background:#0b0716;color:#fff;font-family:-apple-system,"PingFang SC",sans-serif;position:relative;overflow:hidden}}
.aur{{position:absolute;inset:0;background:
 radial-gradient(600px 400px at 12% 8%,#4a1d6e 0%,transparent 60%),
 radial-gradient(500px 420px at 88% 18%,#7a2258 0%,transparent 60%),
 radial-gradient(600px 500px at 50% 92%,#14426b 0%,transparent 62%);opacity:.75}}
.wrap{{position:relative;padding:56px 60px 48px}}
.top{{text-align:center;margin-bottom:34px}}
.kick{{font-family:'Cormorant Garamond',serif;font-size:18px;letter-spacing:5px;color:#d9b8ff;text-transform:uppercase}}
.h1{{font-family:'Great Vibes',cursive;font-size:76px;line-height:1.05;margin:6px 0 2px;
 background:linear-gradient(100deg,#ff8fb1,#ffd36b,#8be8ff,#c39bff);-webkit-background-clip:text;background-clip:text;color:transparent}}
.sub{{font-size:15px;color:#cbb8e8;letter-spacing:1px}}
.badge{{margin-top:16px}}
.live,.sample{{display:inline-block;font-size:13px;padding:7px 16px;border-radius:999px;letter-spacing:1px}}
.live{{background:rgba(80,220,160,.12);color:#7ff0bb;border:1px solid rgba(80,220,160,.35)}}
.live i{{display:inline-block;width:7px;height:7px;border-radius:50%;background:#5fe0a0;margin-right:7px}}
.sample{{background:rgba(255,196,90,.12);color:#ffd58a;border:1px solid rgba(255,196,90,.35)}}
.hero{{text-align:center;margin:26px 0 34px}}
.hero .num{{font-size:120px;font-weight:800;line-height:1;
 background:linear-gradient(100deg,#ff8fb1,#c39bff);-webkit-background-clip:text;background-clip:text;color:transparent}}
.hero .cap{{font-size:17px;color:#e8dcf7;letter-spacing:3px;margin-top:2px}}
.card{{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);border-radius:22px;
 padding:24px 28px;margin-bottom:20px;backdrop-filter:blur(10px)}}
.card h2{{font-size:17px;font-weight:600;letter-spacing:1px;margin-bottom:18px;color:#fff}}
.card h2 small{{font-size:12px;color:#a99bc4;font-weight:400;margin-left:8px}}
.row{{display:grid;grid-template-columns:190px 74px 1fr;align-items:center;gap:12px;margin:11px 0;font-size:14px}}
.lab{{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f0e9fb}}
.val{{text-align:right;color:#d9c9f2;font-variant-numeric:tabular-nums}}
.track{{height:9px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden}}
.fill{{height:100%;border-radius:99px;background:linear-gradient(90deg,#ff6fb5,#a06bff,#5fe0ff)}}
.mid{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
.donut{{width:200px;height:200px;border-radius:50%;margin:0 auto;position:relative;background:{donut}}}
.donut:after{{content:'';position:absolute;inset:26px;border-radius:50%;background:#120b22}}
.donut-txt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2}}
.donut-txt b{{font-size:40px;line-height:1}}
.donut-txt span{{font-size:12px;color:#c8b6e6;letter-spacing:2px}}
.lg{{display:flex;align-items:center;gap:10px;margin:13px 0;font-size:13px}}
.lg i{{width:11px;height:11px;border-radius:3px}}
.lg span{{flex:1;color:#e6dcf5}}
.lg b{{color:#cbb8e8;font-variant-numeric:tabular-nums}}
.empty{{color:#8a7ba8;font-size:13px;text-align:center;padding:16px}}
.foot{{text-align:center;color:#8f80ad;font-size:12px;margin-top:14px;letter-spacing:1px}}
</style></head><body><div class="aur"></div><div class="wrap">
<div class="top"><div class="kick">Sky's 22nd Birthday · 2026</div>
<div class="h1">Happy Birthday Sky</div>
<div class="sub">A Portrait of the World · 一幅世界的画像</div>
<div class="badge">{badge}</div></div>
<div class="hero"><div class="num">{total}</div><div class="cap">PEOPLE JOINED · 人已参与</div></div>
<div class="card"><h2>Nationalities <small>国籍分布</small></h2>{nat_html}</div>
<div class="mid">
 <div class="card"><h2>Age <small>年龄分布</small></h2>{age_html}</div>
 <div class="card"><h2>Gender <small>性别</small></h2>
  <div class="donut"><div class="donut-txt"><b>{total}</b><span>PEOPLE</span></div></div>
  <div style="margin-top:22px">{legend}</div></div>
</div>
<div class="foot">{stamp} · Made with strangers, Sydney</div>
</div></body></html>"""

def main():
    rows, live = fetch()
    if not rows:
        rows = [{"nat":n,"age":a,"gender":g} for n,a,g in SAMPLE]
        live = False
        print("线上 0 条 → 使用示例数据（图上已标注 SAMPLE）")
    else:
        print(f"线上 {len(rows)} 条 → 生成真实数据看板")
    html = build_html(rows, live)
    tmp = os.path.join(HERE, "_dashboard_tmp.html")
    open(tmp, "w", encoding="utf-8").write(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    f"--user-data-dir={HERE}/.chrome-shot", "--hide-scrollbars",
                    "--window-size=900,1500", f"--screenshot={OUT}", f"file://{tmp}"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    os.remove(tmp)
    if os.path.exists(OUT):
        print("已生成:", OUT, os.path.getsize(OUT), "bytes")
    else:
        print("截图失败"); sys.exit(1)

if __name__ == "__main__":
    main()
