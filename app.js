import { catalog } from "./data.js";

const STORAGE_KEYS = {
  passwordHash: "learnsite.passwordHash.v1",
  session: "learnsite.session.v1",
  progress: "learnsite.progress.v1",
  weekly: "learnsite.weekly.v1",
  answers: "learnsite.answers.v1",
  notes: "learnsite.notes.v1",
  importedDocs: "learnsite.importedDocs.v1",
  llm: "learnsite.llm.v1",
};

function nowIso() {
  return new Date().toISOString();
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readJson(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function toast(title, msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="toast__icon"></div>
    <div>
      <div class="toast__title">${escapeHtml(title)}</div>
      <div class="toast__msg">${escapeHtml(msg)}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "all .22s ease";
  }, 2200);
  setTimeout(() => el.remove(), 2600);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getProgress() {
  return readJson(STORAGE_KEYS.progress, {
    completed: {},
    updatedAt: nowIso(),
  });
}

function defaultWeekly() {
  return {
    total: 12,
    items: [
      { id: "w1", text: "牛客网代码题 4 题", done: false },
      { id: "w2", text: "回顾与整理 2 题", done: false },
      { id: "w3", text: "复盘与沉淀 1 篇", done: false },
    ],
    updatedAt: nowIso(),
  };
}

function getWeekly() {
  const w = readJson(STORAGE_KEYS.weekly, null);
  if (!w || !Array.isArray(w.items)) return defaultWeekly();
  return w;
}

function setWeekly(next) {
  writeJson(STORAGE_KEYS.weekly, { ...next, updatedAt: nowIso() });
}

function parseWeeklyText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items = lines.map((line, idx) => {
    const m = line.match(/^\[(x| )\]\s*(.+)$/i);
    if (m) return { id: `w${idx + 1}`, text: m[2].trim(), done: m[1].toLowerCase() === "x" };
    return { id: `w${idx + 1}`, text: line.replace(/^\[\]\s*/, "").trim(), done: false };
  }).filter((x) => x.text.length > 0);

  return { items, updatedAt: nowIso() };
}

function weeklyToText(w) {
  const items = w?.items || [];
  return items.map((it) => `[${it.done ? "x" : " "}] ${it.text}`).join("\n");
}

function setCompleted(id, on) {
  const p = getProgress();
  if (on) p.completed[id] = nowIso();
  else delete p.completed[id];
  p.updatedAt = nowIso();
  writeJson(STORAGE_KEYS.progress, p);
  renderKpis();
}

function isCompleted(id) {
  const p = getProgress();
  return Boolean(p.completed[id]);
}

function totalLessonIds() {
  return [...catalog.it.steps, ...catalog.finance.steps].map((s) => s.id);
}

function getDailyTasks() {
  const stored = readJson("learnsite.daily.v1", null);
  const base = stored && Array.isArray(stored.items) && stored.items.length ? stored : defaultDaily();
  return { ...base, items: base.items.map((x) => ({ ...x, done: Boolean(getProgress().completed[x.id]) })) };
}

function defaultDaily() {
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date().getDay()];
  return {
    weekday,
    items: [
      { id: "d1", text: "完成 1 次核心学习", note: "45-60 分钟", done: false },
      { id: "d2", text: "整理 1 条笔记或复盘", note: "20-30 分钟", done: false },
      { id: "d3", text: "回顾本周目标并收尾", note: "10-15 分钟", done: false },
    ],
    updatedAt: nowIso(),
  };
}

function setDailyTasks(next) {
  writeJson("learnsite.daily.v1", { ...next, updatedAt: nowIso() });
}

function getMilestones() {
  const stored = readJson("learnsite.milestones.v1", null);
  if (stored && Array.isArray(stored.items) && stored.items.length) return stored;
  return defaultMilestones();
}

function defaultMilestones() {
  return {
    items: [
      { id: "m1", title: "建立稳定学习节奏", desc: "形成每日打开网站、处理任务、完成复盘的习惯", progress: 85 },
      { id: "m2", title: "打造可复用知识库", desc: "把文档、笔记和导入内容整理为标准模块", progress: 70 },
      { id: "m3", title: "沉淀个人学习方法", desc: "让学习过程可视化、可追踪、可持续", progress: 60 },
    ],
    updatedAt: nowIso(),
  };
}

function setMilestones(next) {
  writeJson("learnsite.milestones.v1", { ...next, updatedAt: nowIso() });
}

function renderKpis() {
  const w = getWeekly();
  const completed = (w.items || []).filter((it) => it.done).length;
  const total = w.items?.length || 0;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  setText("#kpiCompleted", String(completed));
  setText("#kpiTotal", String(total));
  setText("#kpiRate", `${rate}%`);
  const bar = document.querySelector("#kpiBar");
  if (bar) bar.style.width = `${rate}%`;
}

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el) el.textContent = text;
}

function toggleMarkup(id) {
  const on = !isCompleted(id);
  setCompleted(id, on);
  toast(on ? "已标记完成" : "已取消完成", id);
  renderAll();
}

function toggleWeekly(id) {
  const w = getWeekly();
  const nextItems = (w.items || []).map((it) => (it.id === id ? { ...it, done: !it.done } : it));
  setWeekly({ ...w, items: nextItems });
  rerenderWeekly();
}

function rerenderWeekly() {
  const weeklyList = document.querySelector("#weeklyList");
  if (!weeklyList) return;
  const w = getWeekly();
  if (!w.items.length) {
    weeklyList.innerHTML = `<div class="muted" style="font-size:13px">还没有本周目标，点右上角“编辑”添加。</div>`;
    return;
  }
  weeklyList.innerHTML = w.items
    .map((it) => {
      return `
        <div class="weeklyItem ${it.done ? "is-done" : ""}">
          <button class="toggle ${it.done ? "is-on" : ""}" data-weekly-toggle="${escapeHtml(it.id)}" type="button">
            <span class="check"></span>
            <span class="toggle__text">${it.done ? "已完成" : "待完成"}</span>
          </button>
          <div class="weeklyItem__main">
            <div class="weeklyItem__title">${escapeHtml(it.text)}</div>
            <div class="weeklyItem__meta">${escapeHtml(it.done ? "完成了就很棒，继续保持" : "建议拆到当天可完成")}</div>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll("[data-weekly-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => toggleWeekly(btn.getAttribute("data-weekly-toggle")));
  });
}

function roadmapStep(step) {
  const on = isCompleted(step.id);
  return `
    <div class="step">
      <div class="dot" style="background:${on ? "rgba(52,211,153,.95)" : "rgba(48,197,255,.85)"}"></div>
      <div>
        <div class="step__title">${escapeHtml(step.title)}</div>
        <div class="step__meta">${escapeHtml(step.meta)}</div>
      </div>
      <div class="step__actions">
        <button class="toggle ${on ? "is-on" : ""}" data-toggle="${escapeHtml(step.id)}" type="button">
          <span class="check"></span>
          <span class="toggle__text">${on ? "已完成" : "标记完成"}</span>
        </button>
      </div>
    </div>
  `;
}

function renderHomeSnippets() {
  const daily = getDailyTasks();
  const weekly = getWeekly();
  const milestones = getMilestones();
  const dailyList = document.querySelector("#dailyList");
  const weeklyList = document.querySelector("#weeklyList");
  const milestoneList = document.querySelector("#milestoneList");
  const dailyRate = document.querySelector("#dailyRate");
  const dailyMeta = document.querySelector("#dailyMeta");
  const weeklyMeta = document.querySelector("#weeklyMeta");
  const milestoneMeta = document.querySelector("#milestoneMeta");
  const stageTitle = document.querySelector("#stageTitle");
  const stageDesc = document.querySelector("#stageDesc");
  const stageBar = document.querySelector("#stageBar");
  const stageRate = document.querySelector("#stageRate");
  const dailyRing = document.querySelector("#dailyRing");

  if (dailyMeta) dailyMeta.textContent = `${daily.weekday} · ${daily.items.length} 项`;
  if (weeklyMeta) weeklyMeta.textContent = `${weekly.items.length} 个本周目标`;
  if (milestoneMeta) milestoneMeta.textContent = `${milestones.items.length} 个里程碑`;
  if (stageTitle) stageTitle.textContent = "建立一套小而精的学习系统";
  if (stageDesc) stageDesc.textContent = "围绕知识沉淀、目标推进和复盘改进，形成长期可持续的个人学习操作台。";

  const dailyDone = daily.items.filter((x) => x.done).length;
  const dailyPercent = daily.items.length ? Math.round((dailyDone / daily.items.length) * 100) : 0;
  if (dailyRate) dailyRate.textContent = `${dailyPercent}%`;
  if (dailyRing) dailyRing.style.background = `conic-gradient(from 180deg, rgba(91,108,255,.95) 0% ${dailyPercent}%, rgba(255,255,255,.14) ${dailyPercent}% 100%)`;

  if (dailyList) {
    dailyList.innerHTML = daily.items.length
      ? daily.items.map((it) => `
        <button class="dailyTask ${it.done ? "is-done" : ""}" data-daily-toggle="${escapeHtml(it.id)}" type="button">
          <div class="dailyTask__icon">${it.done ? "✓" : "○"}</div>
          <div class="dailyTask__main">
            <div class="dailyTask__title">${escapeHtml(it.text)}</div>
            <div class="dailyTask__meta">${escapeHtml(it.note || "")}</div>
          </div>
        </button>
      `).join("")
      : `<div class="muted" style="font-size:13px">还没有每日任务，点击“编辑每日”添加。</div>`;
  }

  if (weeklyList) {
    const completed = weekly.items.filter((it) => it.done).length;
    const rate = weekly.items.length ? Math.round((completed / weekly.items.length) * 100) : 0;
    const statusText = rate >= 80 ? "节奏很稳，继续推进" : rate >= 50 ? "稳步推进中" : "先把主线拉起来";
    const track = document.querySelector("#weeklyTrack");
    if (track) {
      track.innerHTML = `
        <div class="weeklyTrack__rail"></div>
        ${weekly.items.map((it, idx) => `
          <div class="weeklyTrack__step ${it.done ? "is-done" : ""}">
            <div class="weeklyTrack__dot">${idx + 1}</div>
            <div class="weeklyTrack__info">
              <div class="weeklyTrack__title">${escapeHtml(it.text)}</div>
              <div class="weeklyTrack__meta">${escapeHtml(it.done ? "已完成" : statusText)}</div>
            </div>
          </div>
        `).join("")}
      `;
    }
    weeklyList.innerHTML = weekly.items.length
      ? weekly.items.map((it, idx) => `
        <button class="weeklyGoal ${it.done ? "is-done" : ""}" data-weekly-toggle="${escapeHtml(it.id)}" type="button">
          <div class="weeklyGoal__index">${String(idx + 1).padStart(2, "0")}</div>
          <div class="weeklyGoal__main">
            <div class="weeklyGoal__title">${escapeHtml(it.text)}</div>
            <div class="weeklyGoal__meta">${escapeHtml(it.done ? "已完成" : statusText)}</div>
          </div>
        </button>
      `).join("")
      : `<div class="muted" style="font-size:13px">还没有本周目标，点击“编辑每周”添加。</div>`;
    const bar = document.querySelector("#kpiBar");
    if (bar) bar.style.width = `${rate}%`;
    setText("#kpiCompleted", String(completed));
    setText("#kpiTotal", String(weekly.items.length));
    setText("#kpiRate", `${rate}%`);
    const status = document.querySelector("#weeklyStatus");
    if (status) status.textContent = statusText;
  }

  if (milestoneList) {
    milestoneList.innerHTML = milestones.items.length
      ? milestones.items.map((m) => `
        <div class="milestone">
          <div class="milestone__top">
            <div class="milestone__title">${escapeHtml(m.title)}</div>
            <div class="milestone__pct">${m.progress}%</div>
          </div>
          <div class="progressbar progressbar--thin"><div class="progressbar__fill" style="width:${m.progress}%"></div></div>
          <div class="milestone__desc">${escapeHtml(m.desc)}</div>
        </div>
      `).join("")
      : `<div class="muted" style="font-size:13px">还没有阶段目标，点击“编辑阶段”添加。</div>`;
  }
  const avg = milestones.items.length ? Math.round(milestones.items.reduce((s, m) => s + m.progress, 0) / milestones.items.length) : 0;
  if (stageBar) stageBar.style.width = `${avg}%`;
  if (stageRate) stageRate.textContent = `${avg}%`;
}

function renderRoadmapList(trackKey, targetId) {
  const t = catalog[trackKey];
  const el = document.querySelector(`#${targetId}`);
  if (!el || !t) return;
  el.innerHTML = (t.steps || [])
    .map((s) => {
      const on = isCompleted(s.id);
      return `
        <div class="item">
          <div class="item__main">
            <div class="item__title">${escapeHtml(s.title)}</div>
            <div class="item__body">${escapeHtml(s.body)}</div>
            <div class="tagrow">
              ${(s.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
          <div>
            <button class="toggle ${on ? "is-on" : ""}" data-toggle="${escapeHtml(s.id)}" type="button">
              <span class="check"></span>
              <span class="toggle__text">${on ? "已完成" : "标记完成"}</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function bindDynamicEvents() {
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => toggleMarkup(btn.getAttribute("data-toggle")));
  });
  document.querySelectorAll("[data-daily-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = getProgress();
      const id = btn.getAttribute("data-daily-toggle");
      if (!id) return;
      if (p.completed[id]) delete p.completed[id]; else p.completed[id] = nowIso();
      p.updatedAt = nowIso();
      writeJson(STORAGE_KEYS.progress, p);
      renderAll();
    });
  });
  document.querySelectorAll("[data-weekly-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => toggleWeekly(btn.getAttribute("data-weekly-toggle")));
  });

  const answers = readJson(STORAGE_KEYS.answers, {});
  document.querySelectorAll("[data-answer]").forEach((ta) => {
    const id = ta.getAttribute("data-answer");
    ta.value = String(answers?.[id] || "");
    ta.addEventListener("input", () => {
      const next = readJson(STORAGE_KEYS.answers, {});
      next[id] = ta.value;
      writeJson(STORAGE_KEYS.answers, next);
    });
  });
}

function defaultNotes() {
  return [
    {
      id: uid("note"),
      category: "it",
      title: "窗口函数：ROW_NUMBER 的常见写法",
      tags: ["SQL", "窗口函数", "复盘"],
      body:
        "## 一句话理解\nROW_NUMBER() 用来给分组内的行编号，常用于“每组取 TopN / 取最近一条”。\n\n## 例子\n- 每个用户最近一笔订单\n\n## 常见坑\n- 忘记 PARTITION BY\n- 排序方向写反\n\n## 练习\n把“最近一笔”改成“最近 3 笔”。\n\n## 我的复盘\n我容易把 order by 写错方向。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: uid("note"),
      category: "finance",
      title: "三大报表勾稽：快速检查逻辑",
      tags: ["报表", "现金流", "基础"],
      body:
        "## 一句话理解\n利润表决定“赚没赚钱”，现金流决定“钱到没到”，资产负债表决定“钱在哪里”。\n\n## 关键勾稽\n- 期初现金 + 现金流净额 = 期末现金\n\n## 常见误解\n利润高不等于现金流好。\n\n## 我的复盘\n我会优先看经营性现金流与应收变化。",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

function getNotes() {
  const notes = readJson(STORAGE_KEYS.notes, null);
  if (!notes || !Array.isArray(notes)) {
    const d = defaultNotes();
    writeJson(STORAGE_KEYS.notes, d);
    return d;
  }
  return notes;
}

function saveNotes(notes) {
  writeJson(STORAGE_KEYS.notes, notes);
}

function normalizeImportedEntry(entry) {
  return {
    ...entry,
    sourceType: "imported",
    sourceName: entry.source_name || entry.sourceName || entry.source_path || "文档导入",
    body: entry.body || "",
    title: entry.title || "未命名文档",
    category: entry.category || "general",
    tags: Array.isArray(entry.tags) ? entry.tags : splitTags(entry.tags),
    updatedAt: entry.updated_at || entry.updatedAt || nowIso(),
    createdAt: entry.created_at || entry.createdAt || nowIso(),
  };
}

function getImportedDocs() {
  return readJson(STORAGE_KEYS.importedDocs, []);
}

function saveImportedDocs(docs) {
  writeJson(STORAGE_KEYS.importedDocs, docs);
}

function getLocalKnowledgeEntries() {
  return readJson("learnsite.knowledgeEntries.local.v1", []);
}

function saveLocalKnowledgeEntries(entries) {
  writeJson("learnsite.knowledgeEntries.local.v1", entries);
}

function norm(s) {
  return String(s || "").toLowerCase();
}

function noteMatches(note, q, category) {
  if (category && category !== "all" && note.category !== category) return false;
  if (!q) return true;
  const qq = norm(q);
  const hay = [
    note.title,
    note.body,
    (note.tags || []).join(","),
    note.category,
  ]
    .map(norm)
    .join("\n");
  return hay.includes(qq);
}

function splitTags(text) {
  return String(text || "")
    .split(/[，,\n\t]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function markdownToText(md) {
  return String(md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\r/g, "");
}

function guessCategory(text) {
  const t = norm(text);
  if (/(sql|数据库|查询|表|窗口函数|join|select|insert|update|delete)/i.test(t)) return "it";
  if (/(金融|报表|估值|现金流|资产负债|利润|债券|股票|宏观)/i.test(t)) return "finance";
  return "general";
}

function makeNoteFromText(text, filename = "") {
  const raw = String(text || "").trim();
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const titleFromFile = filename ? filename.replace(/\.[^.]+$/, "") : "";
  const heading = lines.find((l) => /^#{1,3}\s+/.test(l)) || lines[0] || titleFromFile || "未命名文档";
  const title = heading.replace(/^#{1,3}\s+/, "").trim();
  const body = lines.join("\n");
  const category = guessCategory(`${title}\n${body}\n${filename}`);
  const tags = Array.from(new Set([
    ...(category === "it" ? ["信息技术"] : category === "finance" ? ["金融"] : ["通用"]),
    ...(title.match(/\b[A-Za-z]{3,}\b/g) || []).slice(0, 3),
  ])).slice(0, 6);
  return {
    id: uid("note"),
    category,
    title: title || titleFromFile || "未命名文档",
    tags,
    body: body || raw,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    source: filename || "",
  };
}

function setKbSection(section) {
  document.querySelectorAll(".kbNav__item").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-kb-section") === section);
  });
  document.querySelectorAll(".kbPanel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.getAttribute("data-kb-panel") === section);
  });
  if (section === "notes") {
    const n = document.querySelector("#kbNotesList");
    if (n && !n.innerHTML.trim()) renderKnowledgeBase();
  }
}

async function fetchKnowledgeEntries() {
  try {
    const res = await fetch("./api/knowledge?limit=200");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items.map(normalizeImportedEntry) : [];
  } catch {
    return [];
  }
}

function mapEntryToNote(n, idx = 0) {
  return {
    id: `kb_${idx}_${(n.title || "note").replace(/\s+/g, "_").slice(0, 40)}`,
    title: n.title || "未命名",
    body: [n.summary, n.body].filter(Boolean).join("\n\n") || n.body || n.summary || "",
    category: n.category || "general",
    tags: n.tags || [],
    updatedAt: n.updated_at || n.created_at || nowIso(),
    sourceType: n.source_type || "imported",
    sourceName: n.source_name || n.source_path || "文档导入",
    sourcePath: n.source_path || "",
  };
}

async function renderKnowledgeBase() {
  const listEl = document.querySelector("#kbNotesList");
  if (!listEl) return;

  renderKbPinned();
  renderKbResources();
  renderKbAssistant();

  const q = document.querySelector("#kbSearch")?.value || "";
  const category = document.querySelector("#kbCategory")?.value || "all";

  const localNotes = getNotes().map((n) => ({ ...n, sourceType: "local" }));
  const storedImported = getLocalKnowledgeEntries().map((n, idx) => mapEntryToNote(normalizeImportedEntry(n), idx));
  const remoteImported = (await fetchKnowledgeEntries()).map((n, idx) => mapEntryToNote(n, idx + 1000));
  const importedNotes = [...storedImported, ...remoteImported];

  const notes = [...localNotes, ...importedNotes].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const filtered = notes.filter((n) => noteMatches(n, q, category));

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted" style="font-size:13px">没有匹配的笔记。你可以点右上角“新建笔记”或上传文档导入。</div>`;
    return;
  }

  const localCount = localNotes.length;
  const importedCount = importedNotes.length;
  const stats = `本地 ${localCount} 条 · 导入 ${importedCount} 条 · 当前显示 ${filtered.length} 条`;

  listEl.innerHTML = `
    <div class="cardSub" style="margin-bottom:12px">
      <div class="cardSub__head">
        <div class="cardSub__title">知识库总览</div>
        <div class="cardSub__meta">${escapeHtml(stats)}</div>
      </div>
      <div class="cardSub__body">
        <div class="homeStats" style="margin-top:0">
          <div class="homeStat"><div class="homeStat__label">总条目</div><div class="homeStat__value">${notes.length}</div></div>
          <div class="homeStat"><div class="homeStat__label">本地笔记</div><div class="homeStat__value">${localCount}</div></div>
          <div class="homeStat"><div class="homeStat__label">导入条目</div><div class="homeStat__value">${importedCount}</div></div>
        </div>
      </div>
    </div>
    ${filtered
      .map((n) => {
        const tags = (n.tags || []).slice(0, 6);
        return `
          <div class="item">
            <div class="item__main">
              <div class="item__title">${escapeHtml(n.title || "未命名")}</div>
              <div class="item__body">${escapeHtml((n.body || "").slice(0, 180))}${(n.body || "").length > 180 ? "…" : ""}</div>
              <div class="tagrow">
                <span class="tag">${escapeHtml(n.category === "it" ? "信息技术" : n.category === "finance" ? "金融" : "通用")}</span>
                <span class="tag">${escapeHtml(n.sourceType === "imported" ? "导入文档" : "本地笔记")}</span>
                ${n.sourceName ? `<span class="tag">${escapeHtml(n.sourceName)}</span>` : ""}
                ${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
              </div>
            </div>
            <div>
              ${n.sourceType === "local" ? `<button class="btn btn--ghost btn--sm" type="button" data-edit-note="${escapeHtml(n.id)}">编辑</button>` : ""}
            </div>
          </div>
        `;
      })
      .join("")}
  `;
}

function ymd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daySeed(s) {
  // 简单可重复 hash：保证“每天自动更新”，且同一天稳定
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDaily(items, count) {
  const arr = items.slice();
  const seed = daySeed(ymd());
  let x = seed || 1;
  // 洗牌（LCG）
  for (let i = arr.length - 1; i > 0; i--) {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function fmtPublished(s) {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function renderKbPinned() {
  const el = document.querySelector("#kbPinned");
  if (!el) return;

  // 先显示占位，避免白屏
  el.innerHTML = `
    <div class="cardSub">
      <div class="cardSub__head">
        <div class="cardSub__title">今日置顶（自动更新）</div>
        <div class="cardSub__meta">加载中…</div>
      </div>
      <div class="cardSub__body">
        <div class="muted" style="font-size:13px">正在从后端抓取最新文章…</div>
      </div>
    </div>
  `;

  fetchJson("./api/pinned?count=3")
    .then((data) => {
      const picks = (data?.items || []).slice(0, 3);
      if (!picks.length) throw new Error("空数据");
      el.innerHTML = `
        <div class="cardSub">
          <div class="cardSub__head">
            <div class="cardSub__title">今日置顶（自动更新）</div>
            <div class="cardSub__meta">${escapeHtml(data?.date || ymd())}</div>
          </div>
          <div class="cardSub__body">
            <div class="miniList">
              ${picks
                .map(
                  (r) => `
                    <a class="miniItem" href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer">
                      <div class="miniItem__title">${escapeHtml(r.title)}</div>
                      <div class="miniItem__desc">${escapeHtml(r.source || "")}${r.published_at ? " · " + escapeHtml(fmtPublished(r.published_at)) : ""}</div>
                      <div class="tagrow">
                        <span class="tag">${escapeHtml(r.category === "it" ? "信息技术" : r.category === "finance" ? "金融" : "通用")}</span>
                        <span class="tag">${escapeHtml(r.source || "")}</span>
                      </div>
                    </a>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
    })
    .catch(() => {
      // 后端不可用时：退回到内置池（离线兜底）
      const pool = (catalog.resources || []).filter(Boolean);
      const picks = pickDaily(pool, 3);
      el.innerHTML = `
        <div class="cardSub">
          <div class="cardSub__head">
            <div class="cardSub__title">今日置顶（离线兜底）</div>
            <div class="cardSub__meta">${escapeHtml(ymd())}</div>
          </div>
          <div class="cardSub__body">
            <div class="miniList">
              ${picks
                .map(
                  (r) => `
                    <a class="miniItem" href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer">
                      <div class="miniItem__title">${escapeHtml(r.title)}</div>
                      <div class="miniItem__desc">${escapeHtml(r.desc || "")}</div>
                      <div class="tagrow">
                        <span class="tag">${escapeHtml(r.category === "it" ? "信息技术" : r.category === "finance" ? "金融" : "通用")}</span>
                        ${(r.tags || []).slice(0, 4).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
                      </div>
                    </a>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
    });
}

function renderKbResources() {
  const el = document.querySelector("#kbResources");
  if (!el) return;
  const items = (catalog.resources || []).slice();
  const groups = [
    { key: "it", title: "学习资源：信息技术" },
    { key: "finance", title: "学习资源：金融" },
  ];
  el.innerHTML = `
    <div class="cardSub">
      <div class="cardSub__head">
        <div class="cardSub__title">内置学习资源（直接打开学习）</div>
        <div class="cardSub__meta">建议：先看置顶，再按需深入</div>
      </div>
      <div class="cardSub__body">
        ${groups
          .map((g) => {
            const rs = items.filter((x) => x.category === g.key);
            return `
              <div class="resGroup">
                <div class="resGroup__title">${escapeHtml(g.title)}</div>
                <div class="miniList">
                  ${rs
                    .map(
                      (r) => `
                        <a class="miniItem" href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer">
                          <div class="miniItem__title">${escapeHtml(r.title)}</div>
                          <div class="miniItem__desc">${escapeHtml(r.desc || "")}</div>
                          <div class="tagrow">
                            ${(r.tags || []).slice(0, 5).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
                          </div>
                        </a>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function getLlmConfig() {
  return readJson(STORAGE_KEYS.llm, {
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    apiKey: "",
  });
}

function setLlmConfig(cfg) {
  writeJson(STORAGE_KEYS.llm, cfg);
}

function renderKbAssistant() {
  const el = document.querySelector("#kbAssistant");
  if (!el) return;
  const cfg = getLlmConfig();
  el.innerHTML = `
    <div class="cardSub">
      <div class="cardSub__head">
        <div class="cardSub__title">学习助手（大模型问答）</div>
        <div class="cardSub__meta">${escapeHtml(cfg.model || "")}</div>
      </div>
      <div class="cardSub__body">
        <div class="assistantGrid">
          <div class="assistantBox">
            <div id="chatLog" class="chatLog"></div>
            <div class="chatBar">
              <input id="chatInput" class="input chatInput" placeholder="输入你的问题（例如：窗口函数和 GROUP BY 的区别？）" />
              <button id="btnChatSend" class="btn btn--primary" type="button">发送</button>
            </div>
            <div class="hint">说明：需要你在“设置”里填入 API Key（保存在本地浏览器）。</div>
          </div>
          <div class="assistantSide">
            <button id="btnLlmSettings" class="btn btn--ghost" type="button">设置 API Key</button>
            <div class="muted" style="font-size:12px; margin-top:10px">
              建议提问格式：<br/>
              1）我现在在学什么？<br/>
              2）我卡在哪里？贴出你的 SQL/笔记片段<br/>
              3）希望输出：解释/例题/复盘建议
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog id="importPreviewDialog" class="modal">
      <form method="dialog" class="modal__card">
        <div class="modal__head">
          <div>
            <div class="modal__title">文档导入预览</div>
            <div class="modal__desc">先检查系统拆分出的知识条目，再确认入库。</div>
          </div>
          <button class="btn btn--ghost btn--sm" value="cancel" type="submit">关闭</button>
        </div>
        <div id="importPreviewList" class="list"></div>
        <div class="modal__actions">
          <button id="btnImportConfirm" class="btn btn--primary" value="ok" type="submit">确认入库</button>
        </div>
      </form>
    </dialog>

    <dialog id="llmDialog" class="modal">
      <form method="dialog" class="modal__card">
        <div class="modal__head">
          <div>
            <div class="modal__title">学习助手设置</div>
            <div class="modal__desc">API Key 仅保存在你的浏览器本地。</div>
          </div>
          <button class="btn btn--ghost btn--sm" value="cancel" type="submit">关闭</button>
        </div>
        <div class="kbEditGrid">
          <div class="formrow">
            <label class="label" for="llmBaseUrl">Base URL</label>
            <input id="llmBaseUrl" class="input" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="formrow">
            <label class="label" for="llmModel">Model</label>
            <input id="llmModel" class="input" placeholder="gpt-4.1-mini" />
          </div>
          <div class="formrow">
            <label class="label" for="llmApiKey">API Key</label>
            <input id="llmApiKey" class="input" type="password" placeholder="sk-..." />
          </div>
        </div>
        <div class="modal__actions">
          <button id="btnLlmSave" class="btn btn--primary" value="ok" type="submit">保存</button>
        </div>
      </form>
    </dialog>
  `;
}

function bindKnowledgeBaseEvents() {
  const btnNew = document.querySelector("#btnNewNote");
  const search = document.querySelector("#kbSearch");
  const cat = document.querySelector("#kbCategory");
  const docUpload = document.querySelector("#kbDocUpload");
  const dialog = document.querySelector("#noteDialog");
  const previewDialog = document.querySelector("#importPreviewDialog");
  const previewList = document.querySelector("#importPreviewList");
  const btnImportConfirm = document.querySelector("#btnImportConfirm");
  const dlgTitle = document.querySelector("#noteDialogTitle");
  const inTitle = document.querySelector("#noteTitle");
  const inCat = document.querySelector("#noteCat");
  const inTags = document.querySelector("#noteTags");
  const inBody = document.querySelector("#noteBody");
  const btnSave = document.querySelector("#btnSaveNote");
  const btnDelete = document.querySelector("#btnDeleteNote");
  const navItems = document.querySelectorAll("[data-kb-section]");

  if (!dialog) return;

  let currentId = null;
  let pendingImportEntries = [];

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => setKbSection(btn.getAttribute("data-kb-section") || "notes"));
  });

  function openFor(note, isNew = false) {
    currentId = isNew ? null : note?.id || null;
    setKbSection("notes");
    if (dlgTitle) dlgTitle.textContent = currentId ? "编辑笔记" : "新建笔记";
    if (inTitle) inTitle.value = note?.title || "";
    if (inCat) inCat.value = note?.category || "it";
    if (inTags) inTags.value = (note?.tags || []).join(",");
    if (inBody) inBody.value = note?.body || "";
    if (btnDelete) btnDelete.style.display = currentId ? "inline-flex" : "none";
    dialog.showModal();
  }

  function newNoteTemplate() {
    return {
      category: "it",
      title: "",
      tags: [],
      body:
        "## 一句话理解\n\n## 关键概念/公式\n\n## 例子\n\n## 常见坑\n\n## 练习\n\n## 我的复盘\n",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  if (btnNew) btnNew.addEventListener("click", () => openFor(newNoteTemplate(), true));
  if (search) search.addEventListener("input", () => renderKnowledgeBase());
  if (cat) cat.addEventListener("change", () => renderKnowledgeBase());

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute("data-edit-note");
    if (!id) return;
    const note = getNotes().find((n) => n.id === id);
    if (note) openFor(note);
  });

  function saveFromDialog() {
    const title = (inTitle?.value || "").trim() || "未命名";
    const category = inCat?.value || "it";
    const tags = (inTags?.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const body = inBody?.value || "";

    const notes = getNotes();
    if (!currentId) {
      const n = {
        id: uid("note"),
        category,
        title,
        tags,
        body,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      saveNotes([n, ...notes]);
      writeJson(STORAGE_KEYS.notes, [n, ...notes]);
      toast("已保存", "新笔记已创建");
      renderKnowledgeBase();
      dialog.close();
      return;
    }
    const next = notes.map((n) =>
      n.id === currentId ? { ...n, category, title, tags, body, updatedAt: nowIso() } : n
    );
    saveNotes(next);
    writeJson(STORAGE_KEYS.notes, next);
    toast("已保存", "笔记已更新");
    renderKnowledgeBase();
    dialog.close();
  }

  if (btnSave) btnSave.addEventListener("click", saveFromDialog);

  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      if (!currentId) return;
      const next = getNotes().filter((n) => n.id !== currentId);
      saveNotes(next);
      toast("已删除", "笔记已移除");
      currentId = null;
      renderKnowledgeBase();
      dialog.close();
    });
  }

  function renderImportPreview(entries, filename) {
    if (!previewList || !previewDialog) return;
    previewList.innerHTML = entries.length
      ? entries.map((e, idx) => `
        <div class="item">
          <div class="item__main">
            <div class="item__title">${escapeHtml(e.title || `条目 ${idx + 1}`)}</div>
            <div class="item__body">${escapeHtml(e.summary || (e.body || "").slice(0, 180))}</div>
            <div class="tagrow">
              <span class="tag">${escapeHtml(e.category || "general")}</span>
              ${(e.tags || []).slice(0, 6).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
        </div>
      `).join("")
      : `<div class="muted" style="font-size:13px">未解析到可入库内容。</div>`;
    pendingImportEntries = entries;
    previewDialog.dataset.filename = filename || "";
    previewDialog.showModal();
  }

  if (btnImportConfirm) {
    btnImportConfirm.addEventListener("click", async () => {
      if (!pendingImportEntries.length) return;
      try {
        const enriched = pendingImportEntries.map((e) => ({
          ...e,
          title: e.title?.trim() || "未命名文档",
          summary: e.summary || summarizeText(e.body || ""),
          tags: Array.from(new Set([...(e.tags || []), ...splitTags(e.title || "")])).slice(0, 8),
        }));
        const res = await fetch("./api/import-doc/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: enriched, filename: previewDialog?.dataset.filename || "" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const saved = pendingImportEntries.map((e) => ({
          ...e,
          sourceType: "imported",
          sourceName: previewDialog?.dataset.filename || e.sourceName || "文档导入",
          sourcePath: previewDialog?.dataset.filename || e.sourcePath || "",
          updatedAt: nowIso(),
          createdAt: e.createdAt || nowIso(),
        }));
        saveLocalKnowledgeEntries([...saved, ...getLocalKnowledgeEntries()]);
        saveImportedDocs([{ filename: previewDialog?.dataset.filename || "", importedAt: nowIso(), count: data.inserted || 0 }, ...getImportedDocs()]);
        toast("导入成功", `已确认入库 ${data.inserted || 0} 条`);
        await renderKnowledgeBase();
        if (previewDialog?.open) previewDialog.close();
      } catch (e) {
        toast("入库失败", e?.message || "请重试");
      } finally {
        pendingImportEntries = [];
      }
    });
  }

  if (docUpload) {
    docUpload.addEventListener("change", async () => {
      const file = docUpload.files?.[0];
      if (!file) return;
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("./api/import-doc/preview", { method: "POST", body: form });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderImportPreview(Array.isArray(data?.preview) ? data.preview : [], file.name);
      } catch (e) {
        toast("导入失败", e?.message || "无法解析文档");
      } finally {
        docUpload.value = "";
      }
    });
  }
}

function appendChat(role, text) {
  const log = document.querySelector("#chatLog");
  if (!log) return;
  const item = document.createElement("div");
  item.className = `chatMsg chatMsg--${role}`;
  item.innerHTML = `
    <div class="chatMsg__role">${escapeHtml(role === "user" ? "我" : "助手")}</div>
    <div class="chatMsg__text">${escapeHtml(text)}</div>
  `;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function bindAssistantEvents() {
  const input = document.querySelector("#chatInput");
  const send = document.querySelector("#btnChatSend");
  const btnSettings = document.querySelector("#btnLlmSettings");
  const dlg = document.querySelector("#llmDialog");
  const baseUrl = document.querySelector("#llmBaseUrl");
  const model = document.querySelector("#llmModel");
  const apiKey = document.querySelector("#llmApiKey");
  const btnSave = document.querySelector("#btnLlmSave");

  if (btnSettings && dlg) {
    btnSettings.addEventListener("click", () => {
      const cfg = getLlmConfig();
      if (baseUrl) baseUrl.value = cfg.baseUrl || "";
      if (model) model.value = cfg.model || "";
      if (apiKey) apiKey.value = cfg.apiKey || "";
      dlg.showModal();
    });
  }

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const cfg = getLlmConfig();
      setLlmConfig({
        ...cfg,
        baseUrl: baseUrl?.value || cfg.baseUrl,
        model: model?.value || cfg.model,
        apiKey: apiKey?.value || cfg.apiKey,
      });
      toast("已保存", "学习助手配置已更新");
      renderAll();
    });
  }

  async function doSend() {
    const q = (input?.value || "").trim();
    if (!q) return;
    const cfg = getLlmConfig();
    if (!cfg.apiKey) {
      toast("还没配置", "请先设置 API Key");
      return;
    }
    appendChat("user", q);
    if (input) input.value = "";

    try {
      const system = {
        role: "system",
        content:
          "你是一个严谨、耐心的学习导师。回答用中文，优先给出可执行的学习步骤、最小例子与常见坑。不要虚构资料来源；需要引用时给出可点击链接建议。",
      };
      const resp = await openAiChat({
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        messages: [system, { role: "user", content: q }],
      });
      const text =
        resp?.choices?.[0]?.message?.content ||
        "（未收到有效回答）";
      appendChat("assistant", text);
    } catch (e) {
      appendChat("assistant", `出错了：${e?.message || e}`);
    }
  }

  if (send) send.addEventListener("click", doSend);
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSend();
    });
  }
}

async function openAiChat({ baseUrl, apiKey, model, messages }) {
  const url = `${baseUrl.replace(/\/+$/,"")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`请求失败：${res.status} ${text.slice(0, 200)}`);
  }
  return await res.json();
}

function exportData() {
  const payload = {
    version: 2,
    exportedAt: nowIso(),
    progress: getProgress(),
    weekly: getWeekly(),
    answers: readJson(STORAGE_KEYS.answers, {}),
    notes: getNotes(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `learnsite-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("已导出", "已下载 JSON 文件");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || "{}"));
      if (!data || !data.version) throw new Error("格式不正确");

      if (data.progress) writeJson(STORAGE_KEYS.progress, data.progress);
      if (data.weekly) writeJson(STORAGE_KEYS.weekly, data.weekly);
      if (data.answers) writeJson(STORAGE_KEYS.answers, data.answers);
      if (data.notes && Array.isArray(data.notes)) writeJson(STORAGE_KEYS.notes, data.notes);

      toast("已导入", "数据已写入本地");
      renderAll();
    } catch (e) {
      toast("导入失败", e?.message || "无法解析文件");
    }
  };
  reader.readAsText(file);
}

function getSession() {
  return readJson(STORAGE_KEYS.session, null);
}

function setSession(session) {
  if (!session) localStorage.removeItem(STORAGE_KEYS.session);
  else writeJson(STORAGE_KEYS.session, session);
}

function isAuthed() {
  const session = getSession();
  const passwordHash = localStorage.getItem(STORAGE_KEYS.passwordHash);
  return Boolean(session?.ok && session?.at && passwordHash);
}

function currentPath() {
  const p = location.pathname.split("/").pop() || "index.html";
  return p === "" ? "index.html" : p;
}

function redirectToLogin() {
  const next = encodeURIComponent(currentPath() + location.search + location.hash);
  location.replace(`./login.html?next=${next}`);
}

function readNextParam() {
  try {
    const u = new URL(location.href);
    return u.searchParams.get("next") || "./index.html";
  } catch {
    return "./index.html";
  }
}

async function ensureAuth() {
  const btnLogout = document.querySelector("#btnLogout");
  const btnExport = document.querySelector("#btnExport");
  const importFile = document.querySelector("#importFile");

  const authed = isAuthed();
  if (btnLogout) btnLogout.hidden = !authed;
  if (btnExport) btnExport.hidden = !authed;
  const fileBtn = document.querySelector(".filebtn");
  if (fileBtn) fileBtn.hidden = !authed;

  const isLoginPage = currentPath() === "login.html";
  if (!authed && !isLoginPage) {
    redirectToLogin();
    return;
  }

  if (authed && isLoginPage) {
    location.replace(readNextParam());
    return;
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      setSession(null);
      toast("已退出", "本地会话已清除");
      redirectToLogin();
    });
  }

  if (btnExport) btnExport.addEventListener("click", exportData);
  if (importFile) {
    importFile.addEventListener("change", () => {
      const f = importFile.files?.[0];
      if (f) importData(f);
      importFile.value = "";
    });
  }

  const btnEditDaily = document.querySelector("#btnEditDaily");
  const btnEditWeekly = document.querySelector("#btnEditWeekly");
  const btnEditMilestone = document.querySelector("#btnEditMilestone");
  const btnEditStageDirect = document.querySelector("#btnEditStageDirect");
  const dailyDialog = document.querySelector("#dailyDialog");
  const dailyTextarea = document.querySelector("#dailyTextarea");
  const btnDailyReset = document.querySelector("#btnDailyReset");
  const btnDailySave = document.querySelector("#btnDailySave");
  const weeklyDialog = document.querySelector("#weeklyDialog");
  const weeklyTextarea = document.querySelector("#weeklyTextarea");
  const btnWeeklyReset = document.querySelector("#btnWeeklyReset");
  const btnWeeklySave = document.querySelector("#btnWeeklySave");
  const milestoneDialog = document.querySelector("#milestoneDialog");
  const milestoneTextarea = document.querySelector("#milestoneTextarea");
  const btnMilestoneReset = document.querySelector("#btnMilestoneReset");
  const btnMilestoneSave = document.querySelector("#btnMilestoneSave");

  function openDailyDialog() {
    if (!dailyDialog || !dailyTextarea) return;
    dailyTextarea.value = getDailyTasks().items.map((it) => `${it.text} | ${it.note || ""}`).join("\n");
    dailyDialog.showModal();
  }
  function openWeeklyDialog() {
    if (!weeklyDialog || !weeklyTextarea) return;
    weeklyTextarea.value = weeklyToText(getWeekly());
    weeklyDialog.showModal();
  }
  function openMilestoneDialog() {
    if (!milestoneDialog || !milestoneTextarea) return;
    milestoneTextarea.value = getMilestones().items.map((m) => `${m.title} | ${m.progress} | ${m.desc}`).join("\n");
    milestoneDialog.showModal();
  }

  if (btnEditDaily) btnEditDaily.addEventListener("click", openDailyDialog);
  if (btnEditWeekly) btnEditWeekly.addEventListener("click", openWeeklyDialog);
  if (btnEditMilestone) btnEditMilestone.addEventListener("click", openMilestoneDialog);
  if (btnEditStageDirect) btnEditStageDirect.addEventListener("click", openMilestoneDialog);

  if (btnDailyReset) btnDailyReset.addEventListener("click", () => { const d = defaultDaily(); setDailyTasks(d); if (dailyTextarea) dailyTextarea.value = d.items.map((it) => `${it.text} | ${it.note}`).join("\n"); renderAll(); toast("已恢复默认", "你可以继续编辑"); });
  if (btnDailySave) btnDailySave.addEventListener("click", () => { if (!dailyTextarea) return; const items = String(dailyTextarea.value || "").split(/\r?\n/).map((line, idx) => { const [text, note = ""] = line.split("|").map((s) => s.trim()); return text ? { id: `d${idx + 1}`, text, note, done: false } : null; }).filter(Boolean); setDailyTasks({ weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date().getDay()], items: items.length ? items : defaultDaily().items }); renderAll(); toast("已保存", "每日任务已更新"); });
  if (btnWeeklyReset) btnWeeklyReset.addEventListener("click", () => { const d = defaultWeekly(); setWeekly(d); if (weeklyTextarea) weeklyTextarea.value = weeklyToText(d); renderAll(); toast("已恢复默认", "你可以继续编辑"); });
  if (btnWeeklySave) btnWeeklySave.addEventListener("click", () => { if (!weeklyTextarea) return; const next = parseWeeklyText(weeklyTextarea.value); setWeekly(next); renderAll(); toast("已保存", "本周目标已更新"); });
  if (btnMilestoneReset) btnMilestoneReset.addEventListener("click", () => { const d = defaultMilestones(); setMilestones(d); if (milestoneTextarea) milestoneTextarea.value = d.items.map((m) => `${m.title} | ${m.progress} | ${m.desc}`).join("\n"); renderAll(); toast("已恢复默认", "你可以继续编辑"); });
  if (btnMilestoneSave) btnMilestoneSave.addEventListener("click", () => { if (!milestoneTextarea) return; const items = String(milestoneTextarea.value || "").split(/\r?\n/).map((line, idx) => { const [title, progress = "0", desc = ""] = line.split("|").map((s) => s.trim()); return title ? { id: `m${idx + 1}`, title, progress: Math.max(0, Math.min(100, Number(progress) || 0)), desc } : null; }).filter(Boolean); setMilestones({ items: items.length ? items : defaultMilestones().items }); renderAll(); toast("已保存", "阶段目标已更新"); });

  const form = document.querySelector("#authForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.querySelector("#password");
      const pwd = input?.value || "";
      if (pwd.length < 4) {
        toast("密码太短", "至少 4 位");
        return;
      }
      const h = await sha256(pwd);
      const existing = localStorage.getItem(STORAGE_KEYS.passwordHash);
      if (!existing) {
        localStorage.setItem(STORAGE_KEYS.passwordHash, h);
        setSession({ ok: true, at: nowIso() });
        toast("已设置密码", "开始学习吧");
        location.replace(readNextParam());
        return;
      }
      if (existing !== h) {
        toast("密码不正确", "请重试");
        return;
      }
      setSession({ ok: true, at: nowIso() });
      toast("登录成功", "欢迎回来");
      location.replace(readNextParam());
    });
  }
}

function renderAll() {
  renderKpis();
  renderHomeSnippets();
  rerenderWeekly();
  renderKnowledgeBase();
  setKbSection("notes");
  bindDynamicEvents();
}

function boot() {
  setText("#buildInfo", `build ${new Date().toISOString().slice(0, 10)}`);
  ensureAuth().then(() => {
    renderAll();
    bindKnowledgeBaseEvents();
    bindAssistantEvents();
  });
}

boot();

