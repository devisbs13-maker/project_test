// tools/fix-web-encoding.js
// Запуск: node tools/fix-web-encoding.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "apps", "web", "src");
const exts = new Set([".ts", ".tsx", ".css", ".json", ".md"]);

const replacers = [
  // уберём BOM и частые мусорные хвосты
  { from: /^\uFEFF/, to: "" },              // BOM в начале
  { from: /п»ї/g, to: "" },                 // видимый BOM
  { from: /\r\n?/g, to: "\n" },             // нормализуем CRLF -> LF
  // иногда в текст попадают обратные слеши-экраны
  { from: /\\n\s*\\n/g, to: "\n\n" },
  { from: /\\n/g, to: "\n" },
  // явные мусорные маркеры
  { from: /�/g, to: "" },
];

// точечные замены «англ -> рус» для главного экрана (если вдруг кто-то залил английский)
const uiFixes = [
  { fileContains: "Welcome! Use the links below to navigate", pairs: [
    ["Welcome! Use the links below to navigate", "Куда направимся?"],
    ["Quests", "Квесты"],
    ["Jobs", "Работа"],
    ["Arena (PvP, later)", "Арена (PvP, позже)"],
    ["Guild (clans, later)", "Гильдия (кланы, позже)"],
    ["Character", "Персонаж"],
    ["Leaderboard", "Лидеры"],
    ["Clan", "Клан"],
  ]},
];

function walk(dir, acc) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const d of list) {
    if (d.name === "node_modules" || d.name.startsWith(".")) continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, acc);
    else {
      const ext = path.extname(p);
      if (exts.has(ext)) acc.push(p);
    }
  }
  return acc;
}

function fixText(text) {
  let out = text;
  for (const r of replacers) out = out.replace(r.from, r.to);
  return out;
}

function maybeApplyUiFixes(filePath, text) {
  let out = text;
  for (const fix of uiFixes) {
    if (text.includes(fix.fileContains)) {
      for (const [en, ru] of fix.pairs) {
        out = out.replaceAll(en, ru);
      }
    }
  }
  return out;
}

function run() {
  if (!fs.existsSync(ROOT)) {
    console.error("Path not found:", ROOT);
    process.exit(1);
  }
  const files = walk(ROOT, []);
  let changed = 0;
  for (const f of files) {
    try {
      let text = fs.readFileSync(f, "utf8");
      const before = text;
      text = fixText(text);
      text = maybeApplyUiFixes(f, text);
      if (text !== before) {
        fs.writeFileSync(f, text, { encoding: "utf8" }); // без BOM
        changed++;
        console.log("fixed:", path.relative(process.cwd(), f));
      }
    } catch (e) {
      console.warn("skip:", f, e.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run();

