var DB_NAME = "ReadingAppDB";
var DB_VERSION = 2;

function openDB() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains("books")) {
        var bs = db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
        bs.createIndex("lastReadAt", "lastReadAt");
      }
      if (!db.objectStoreNames.contains("chapters")) {
        var cs = db.createObjectStore("chapters", { keyPath: "id", autoIncrement: true });
        cs.createIndex("bookId", "bookId");
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("aiCache")) {
        var ac = db.createObjectStore("aiCache", { keyPath: "id" });
        ac.createIndex("chapterId", "chapterId");
      }
      if (!db.objectStoreNames.contains("highlights")) {
        var hl = db.createObjectStore("highlights", { keyPath: "id", autoIncrement: true });
        hl.createIndex("chapterId", "chapterId");
      }
      if (!db.objectStoreNames.contains("userNotes")) {
        var un = db.createObjectStore("userNotes", { keyPath: "id", autoIncrement: true });
        un.createIndex("chapterId", "chapterId");
      }
      if (!db.objectStoreNames.contains("discussions")) {
        var ds = db.createObjectStore("discussions", { keyPath: "id", autoIncrement: true });
        ds.createIndex("chapterId", "chapterId");
      }
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
  });
}

/* ---- generic CRUD ---- */
async function getAll(store) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction(store, "readonly"); var s = tx.objectStore(store); var q = s.getAll(); q.onsuccess = function () { r(q.result); }; q.onerror = function () { j(q.error); }; });
}
async function getByIndex(store, idx, val) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction(store, "readonly"); var s = tx.objectStore(store).index(idx); var q = s.getAll(val); q.onsuccess = function () { r(q.result); }; q.onerror = function () { j(q.error); }; });
}
async function put(store, obj) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction(store, "readwrite"); var s = tx.objectStore(store); var q = s.put(obj); q.onsuccess = function () { r(q.result); }; q.onerror = function () { j(q.error); }; });
}
async function add(store, obj) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction(store, "readwrite"); var s = tx.objectStore(store); var q = s.add(obj); q.onsuccess = function () { r(q.result); }; q.onerror = function () { j(q.error); }; });
}
async function del(store, id) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction(store, "readwrite"); var s = tx.objectStore(store); var q = s.delete(id); q.onsuccess = function () { r(); }; q.onerror = function () { j(q.error); }; });
}
async function clearByIndex(store, idx, val) {
  var db = await openDB();
  return new Promise(function (r, j) {
    var tx = db.transaction(store, "readwrite");
    var s = tx.objectStore(store).index(idx);
    var q = s.openCursor(val);
    q.onsuccess = function (e) { var c = e.target.result; if (c) { c.delete(); c.continue(); } };
    tx.oncomplete = function () { r(); };
    tx.onerror = function () { j(tx.error); };
  });
}

/* ---- Books ---- */
export async function getAllBooks() { return getAll("books"); }
export async function addBook(book) { return add("books", book); }
export async function updateBook(book) { return put("books", book); }
export async function deleteBook(id) {
  /* delete book + its chapters + related data */
  var chs = await getByIndex("chapters", "bookId", id);
  for (var i = 0; i < chs.length; i++) {
    await clearByIndex("highlights", "chapterId", chs[i].id);
    await clearByIndex("userNotes", "chapterId", chs[i].id);
    await clearByIndex("aiCache", "chapterId", chs[i].id);
    await clearByIndex("discussions", "chapterId", chs[i].id);
  }
  await clearByIndex("chapters", "bookId", id);
  return del("books", id);
}

/* ---- Chapters ---- */
export async function getChaptersByBook(bookId) {
  var chs = await getByIndex("chapters", "bookId", bookId);
  return chs.sort(function (a, b) { return a.number - b.number; });
}
export async function addChapter(ch) { return add("chapters", ch); }
export async function updateChapter(ch) { return put("chapters", ch); }

/* ---- Highlights ---- */
export async function getHighlights(chapterId) { return getByIndex("highlights", "chapterId", chapterId); }
export async function addHighlight(h) { return add("highlights", h); }
export async function deleteHighlight(id) { return del("highlights", id); }

/* ---- User Notes ---- */
export async function getUserNotes(chapterId) { return getByIndex("userNotes", "chapterId", chapterId); }
export async function addUserNote(n) { return add("userNotes", n); }
export async function updateUserNote(n) { return put("userNotes", n); }
export async function deleteUserNote(id) { return del("userNotes", id); }

/* ---- AI Cache ---- */
export async function getAiCache(id) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction("aiCache", "readonly"); var q = tx.objectStore("aiCache").get(id); q.onsuccess = function () { r(q.result || null); }; q.onerror = function () { j(q.error); }; });
}
export async function setAiCache(obj) { return put("aiCache", obj); }

/* ---- Discussions (章末+选段讨论) ---- */
export async function getDiscussions(chapterId) {
  var ds = await getByIndex("discussions", "chapterId", chapterId);
  return ds.sort(function (a, b) { return a.createdAt - b.createdAt; });
}
export async function addDiscussion(d) { return add("discussions", d); }
export async function deleteDiscussion(id) { return del("discussions", id); }

/* ---- Settings ---- */
export async function getSetting(key) {
  var db = await openDB();
  return new Promise(function (r, j) { var tx = db.transaction("settings", "readonly"); var q = tx.objectStore("settings").get(key); q.onsuccess = function () { r(q.result ? q.result.value : null); }; q.onerror = function () { j(q.error); }; });
}
export async function setSetting(key, value) { return put("settings", { key: key, value: value }); }

/* ---- API Call (OpenAI-compatible, works with OpenRouter/DeepSeek/etc) ---- */
export async function callAI(settings, messages, featureModelKey) {
  var model = (featureModelKey && settings[featureModelKey]) || settings.modelName;
  if (!settings.apiUrl || !settings.apiKey || !model) {
    throw new Error("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199API\u5730\u5740\u3001\u5BC6\u94A5\u548C\u6A21\u578B\u540D\u79F0");
  }
  var res = await fetch(settings.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.apiKey },
    body: JSON.stringify({ model: model, messages: messages, max_tokens: settings.maxOutputTokens||2000 }),
  });
  if (!res.ok) {
    var errText = await res.text();
    throw new Error("API\u8C03\u7528\u5931\u8D25(" + res.status + "): " + errText.substring(0, 200));
  }
  var data = await res.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error("API\u8FD4\u56DE\u683C\u5F0F\u5F02\u5E38");
}

/* ---- Parsers ---- */
export function parseTxt(text, filename) {
  var title = filename.replace(/\.txt$/i, "");
  var lines = text.split("\n");
  /* 宽松匹配：第__章/回/篇/部（中间任意1-10字符）+ 英文章节 */
  var chPat = /^(第.{1,10}[章回篇部]|Chapter\s+[\s\S]{1,20}|Part\s+[\dIVXLCDM]+|Section\s+[A-Z\d]+|Passage\s+\d+|Text\s+\d+|Directions\s*:)/i;
  var starts = [];
  lines.forEach(function(line, idx) {
    var trimmed = line.trim();
    if (chPat.test(trimmed) && trimmed.length <= 80) starts.push(idx);
  });
  var chapters = [];
  if (starts.length >= 2) {
    if (starts[0] > 0) {
      var pre = lines.slice(0, starts[0]).join("\n").trim();
      if (pre && pre.length > 20) chapters.push({ title: "\u524D\u8A00", content: pre });
    }
    for (var i = 0; i < starts.length; i++) {
      var si = starts[i];
      var ei = i < starts.length - 1 ? starts[i + 1] : lines.length;
      var block = lines.slice(si, ei).join("\n").trim();
      if (block) chapters.push({ title: lines[si].trim().substring(0, 50), content: block });
    }
    return { title: title, chapters: chapters };
  }
  /* Fallback 2: 4+空行分章 */
  var bigGapParts = text.split(/\n{4,}/);
  if (bigGapParts.length >= 2) {
    var validParts = bigGapParts.filter(function(s){ return s.trim() && s.trim().length > 50; });
    if (validParts.length >= 2) {
      for (var g = 0; g < validParts.length; g++) {
        var partText = validParts[g].trim();
        var firstLine = partText.split("\n")[0].trim().substring(0, 50);
        chapters.push({ title: firstLine.length < 60 ? firstLine : "\u7B2C" + (g+1) + "\u7AE0", content: partText });
      }
      return { title: title, chapters: chapters };
    }
  }
  /* Fallback 3: split by double newlines into ~2000 char chunks */
  var paras = text.split(/\n\s*\n/).filter(function (s) { return s.trim(); });
  if (paras.length <= 1) { chapters.push({ title: "\u7B2C1\u7AE0", content: text }); }
  else {
    var chunk = ""; var chNum = 1;
    for (var j = 0; j < paras.length; j++) {
      chunk += paras[j] + "\n\n";
      if (chunk.length > 2000 || j === paras.length - 1) { chapters.push({ title: "\u7B2C" + chNum + "\u7AE0", content: chunk.trim() }); chunk = ""; chNum++; }
    }
  }
  return { title: title, chapters: chapters };
}

export function parseHtml(html, filename) {
  var title = filename.replace(/\.html?$/i, "");
  var parser = new DOMParser(); var doc = parser.parseFromString(html, "text/html");
  var titleEl = doc.querySelector("title");
  if (titleEl && titleEl.textContent.trim()) title = titleEl.textContent.trim();
  var headings = doc.querySelectorAll("h1,h2,h3"); var chapters = [];
  if (headings.length > 1) {
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i]; var chTitle = h.textContent.trim().substring(0, 50); var content = ""; var next = h.nextElementSibling;
      while (next && !["H1","H2","H3"].includes(next.tagName)) { content += next.textContent + "\n\n"; next = next.nextElementSibling; }
      if (content.trim()) chapters.push({ title: chTitle, content: content.trim() });
    }
  }
  if (chapters.length === 0) { return parseTxt(doc.body ? doc.body.textContent : html, filename); }
  return { title: title, chapters: chapters };
}

/* ---- 智能分段 ---- */
/* 1. 先按双换行分段；如果只有1-2段，改用单换行分段
   2. 合并太短的行（标题、错误回车）到相邻段落 */
export function smartSplitParagraphs(content) {
  if (!content || !content.trim()) return [];
  /* 先试双换行 */
  var paras = content.split(/\n\s*\n/).map(function(s){return s.trim();}).filter(function(s){return s;});
  /* 如果只分出1-2段但内容很长，换成单换行分段 */
  if (paras.length <= 2 && content.length > 500) {
    paras = content.split(/\n/).map(function(s){return s.trim();}).filter(function(s){return s;});
  }
  if (paras.length <= 1) return paras;
  /* 合并短行 */
  var endPunc = /[。！？.!?\u2026\u201D\u300D)）】」》]$/;
  var result = [];
  var buf = "";
  for (var i = 0; i < paras.length; i++) {
    var p = paras[i];
    if (buf) {
      p = buf + "\n" + p;
      buf = "";
    }
    if (p.length < 40 && !endPunc.test(p) && i < paras.length - 1) {
      buf = p;
    } else {
      result.push(p);
    }
  }
  if (buf) {
    if (result.length > 0) {
      result[result.length - 1] = result[result.length - 1] + "\n" + buf;
    } else {
      result.push(buf);
    }
  }
  return result;
}
/* 保留旧名兼容 */
export var mergeShortParagraphs = smartSplitParagraphs;

/* ---- Export/Import ---- */
export async function exportData() {
  var books = await getAllBooks(); var allChapters = []; var allHL = []; var allNotes = []; var allDisc = []; var allAI = [];
  for (var i = 0; i < books.length; i++) {
    var chs = await getChaptersByBook(books[i].id); allChapters = allChapters.concat(chs);
    for (var j = 0; j < chs.length; j++) {
      var hl = await getHighlights(chs[j].id); allHL = allHL.concat(hl);
      var notes = await getUserNotes(chs[j].id); allNotes = allNotes.concat(notes);
      var disc = await getDiscussions(chs[j].id); allDisc = allDisc.concat(disc);
      var s1 = await getAiCache("story-" + chs[j].id); if (s1) allAI.push(s1);
      var s2 = await getAiCache("ann-" + chs[j].id); if (s2) allAI.push(s2);
    }
  }
  var settings = await getSetting("userSettings");
  return JSON.stringify({ books: books, chapters: allChapters, highlights: allHL, userNotes: allNotes, discussions: allDisc, aiCache: allAI, settings: settings });
}
export async function importData(jsonStr) {
  var data = JSON.parse(jsonStr);
  if (data.books) for (var i = 0; i < data.books.length; i++) await put("books", data.books[i]);
  if (data.chapters) for (var j = 0; j < data.chapters.length; j++) await put("chapters", data.chapters[j]);
  if (data.highlights) for (var k = 0; k < data.highlights.length; k++) await put("highlights", data.highlights[k]);
  if (data.userNotes) for (var l = 0; l < data.userNotes.length; l++) await put("userNotes", data.userNotes[l]);
  if (data.discussions) for (var m = 0; m < data.discussions.length; m++) await put("discussions", data.discussions[m]);
  if (data.aiCache) for (var n = 0; n < data.aiCache.length; n++) await put("aiCache", data.aiCache[n]);
  if (data.settings) await put("settings", { key: "userSettings", value: data.settings });
}
