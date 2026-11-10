/* ============================================================
   地区表（国籍 / 来源地）
   说明：香港、澳门、台湾均为中国的一部分，按规范标注为
   "Hong Kong, China / 中国香港" 等，并使用 🇨🇳。
   ============================================================ */
window.REGIONS = [
  { code: "cn",    flag: "🇨🇳", en: "China",                 zh: "中国" },
  { code: "hk",    flag: "🇨🇳", en: "Hong Kong, China",      zh: "中国香港" },
  { code: "mo",    flag: "🇨🇳", en: "Macao, China",          zh: "中国澳门" },
  { code: "tw",    flag: "🇨🇳", en: "Taiwan, China",         zh: "中国台湾" },
  { code: "au",    flag: "🇦🇺", en: "Australia",             zh: "澳大利亚" },
  { code: "us",    flag: "🇺🇸", en: "United States",         zh: "美国" },
  { code: "gb",    flag: "🇬🇧", en: "United Kingdom",        zh: "英国" },
  { code: "jp",    flag: "🇯🇵", en: "Japan",                 zh: "日本" },
  { code: "kr",    flag: "🇰🇷", en: "South Korea",           zh: "韩国" },
  { code: "in",    flag: "🇮🇳", en: "India",                 zh: "印度" },
  { code: "id",    flag: "🇮🇩", en: "Indonesia",             zh: "印度尼西亚" },
  { code: "my",    flag: "🇲🇾", en: "Malaysia",              zh: "马来西亚" },
  { code: "sg",    flag: "🇸🇬", en: "Singapore",             zh: "新加坡" },
  { code: "nz",    flag: "🇳🇿", en: "New Zealand",           zh: "新西兰" },
  { code: "fr",    flag: "🇫🇷", en: "France",                zh: "法国" },
  { code: "de",    flag: "🇩🇪", en: "Germany",               zh: "德国" },
  { code: "es",    flag: "🇪🇸", en: "Spain",                 zh: "西班牙" },
  { code: "it",    flag: "🇮🇹", en: "Italy",                 zh: "意大利" },
  { code: "ca",    flag: "🇨🇦", en: "Canada",                zh: "加拿大" },
  { code: "br",    flag: "🇧🇷", en: "Brazil",                zh: "巴西" },
  { code: "mx",    flag: "🇲🇽", en: "Mexico",                zh: "墨西哥" },
  { code: "za",    flag: "🇿🇦", en: "South Africa",          zh: "南非" },
  { code: "ng",    flag: "🇳🇬", en: "Nigeria",               zh: "尼日利亚" },
  { code: "ae",    flag: "🇦🇪", en: "United Arab Emirates",  zh: "阿联酋" },
  { code: "th",    flag: "🇹🇭", en: "Thailand",              zh: "泰国" },
  { code: "vn",    flag: "🇻🇳", en: "Vietnam",               zh: "越南" },
  { code: "ph",    flag: "🇵🇭", en: "Philippines",           zh: "菲律宾" },
  { code: "nl",    flag: "🇳🇱", en: "Netherlands",           zh: "荷兰" },
  { code: "se",    flag: "🇸🇪", en: "Sweden",                zh: "瑞典" },
  { code: "ru",    flag: "🇷🇺", en: "Russia",                zh: "俄罗斯" },
  { code: "other", flag: "🌍", en: "Other",                  zh: "其他" }
];

window.REGION_MAP = window.REGIONS.reduce((m, r) => ((m[r.code] = r), m), {});
