import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
const CHILDREN = [
  { id: "daigo", name: "橙吾", grade: "中1", emoji: "⚽", color: "#333333", colorLight: "#F5F5F5", subjects: ["国語", "数学", "英語", "理科", "社会"], mode: "managed" },
  { id: "eishi", name: "叡志", grade: "小5", emoji: "🦎", color: "#29B6F6", colorLight: "#E6F7FF", subjects: ["国語", "算数", "理科", "社会", "英語"], mode: "managed" },
  { id: "yuzuki", name: "優珠綺", grade: "小2", emoji: "🌸", color: "#D64CB0", colorLight: "#FDF0FA", subjects: ["国語", "算数", "生活", "音楽", "図工", "体育"], mode: "managed" },
  { id: "yukino", name: "優綺乃", grade: "2歳", emoji: "🍓", color: "#E74860", colorLight: "#FFF0F3", subjects: [], mode: "managed" },
];
// Default test config per child (used only when no stored config exists)
var DEF_TEST_CFG = {
  daigo:  { types: ["定期テスト", "北辰テスト"], subjects: ["国語", "数学", "英語", "理科", "社会"], hasRank: true },
  eishi:  { types: ["テスト"], subjects: ["算数", "国語", "理科", "社会"], hasRank: false },
  yuzuki: { types: ["テスト"], subjects: ["国語", "算数"], hasRank: false },
  yukino: { types: ["テスト"], subjects: [], hasRank: false },
};
const DEF_REWARDS = [
  { id: "r1", name: "ゲーム30分延長", cost: 10, emoji: "🎮" },
  { id: "r2", name: "ゲーム1時間延長", cost: 18, emoji: "🕹️" },
  { id: "r3", name: "100円に換金", cost: 20, emoji: "💰" },
  { id: "r4", name: "500円に換金", cost: 90, emoji: "💴" },
  { id: "r5", name: "好きなおやつ", cost: 8, emoji: "🍫" },
];
const DEF_BONUS = [
  { id: "bc1", name: "自分からやった", points: 2, emoji: "🌟", color: "#FF9800" },
  { id: "bc2", name: "お手伝い", points: 1, emoji: "🧹", color: "#4CAF50" },
  { id: "bc3", name: "兄弟に優しくした", points: 1, emoji: "💕", color: "#E91E63" },
  { id: "bc4", name: "片付け", points: 1, emoji: "🗂️", color: "#2196F3" },
  { id: "bc5", name: "朝の準備を時間内に", points: 1, emoji: "⏰", color: "#9C27B0" },
];
const DJ = ["月", "火", "水", "木", "金", "土", "日"];
const SK = "madoka-v9";
function getToday() {
  var n = new Date();
  return {
    now: n,
    td: n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"),
    tdi: n.getDay() === 0 ? 6 : n.getDay() - 1,
  };
}
var NOW = new Date();
var TD = getToday().td;
var TDI = getToday().tdi;
// ═══ EISHI WORKBOOKS PRESET ═══
var EISHI_WBS = [
  { id: "wb_chal_koku", name: "チャレンジ国語", subject: "国語", type: "challenge", totalUnits: 5, doneUnits: 2, hasTest: true, testDone: false, minPerUnit: 15, priority: "high", monthly: true },
  { id: "wb_chal_san", name: "チャレンジ算数", subject: "算数", type: "challenge", totalUnits: 6, doneUnits: 2, hasTest: true, testDone: false, minPerUnit: 15, priority: "high", monthly: true },
  { id: "wb_chal_ri", name: "チャレンジ理科", subject: "理科", type: "challenge", totalUnits: 4, doneUnits: 2, hasTest: true, testDone: false, minPerUnit: 15, priority: "high", monthly: true },
  { id: "wb_chal_sha", name: "チャレンジ社会", subject: "社会", type: "challenge", totalUnits: 4, doneUnits: 1, hasTest: true, testDone: false, minPerUnit: 15, priority: "high", monthly: true },
  { id: "wb_pit_koku", name: "ぴったりトレーニング国語", subject: "国語", type: "pages", totalPages: 112, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "wb_pit_san", name: "ぴったりトレーニング算数", subject: "算数", type: "pages", totalPages: 128, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "wb_pit_ri", name: "ぴったりトレーニング理科", subject: "理科", type: "pages", totalPages: 72, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "wb_pit_sha", name: "ぴったりトレーニング社会", subject: "社会", type: "pages", totalPages: 120, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "wb_kanji", name: "漢字MAXドリル小4", subject: "国語", type: "pages", totalPages: 142, donePages: 14, minPerPage: 5, priority: "normal", dailyPages: 2 },
];
// ═══ YUZUKI WORKBOOKS PRESET ═══
var YUZUKI_WBS = [
  { id: "yw_chal_koku", name: "チャレンジ国語", subject: "国語", type: "challenge", totalUnits: 15, doneUnits: 15, hasTest: true, testDone: true, minPerUnit: 5, priority: "high", monthly: true },
  { id: "yw_chal_san", name: "チャレンジ算数", subject: "算数", type: "challenge", totalUnits: 15, doneUnits: 15, hasTest: true, testDone: true, minPerUnit: 5, priority: "high", monthly: true },
  { id: "yw_pit_san", name: "ぴったりトレーニング算数", subject: "算数", type: "pages", totalPages: 112, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "yw_pit_kanji", name: "ぴったりトレーニング漢字", subject: "国語", type: "pages", totalPages: 93, donePages: 0, minPerPage: 3, priority: "normal" },
  { id: "yw_kanji", name: "漢字MAXドリル小1", subject: "国語", type: "pages", totalPages: 106, donePages: 12, minPerPage: 3, priority: "normal", dailyPages: 2 },
];
// ═══ DAIGO WORKBOOKS PRESET ═══
var DAIGO_WBS = [];
// ═══ YUKINO WORKBOOKS PRESET ═══
var YUKINO_WBS = [];
function mkData() {
  return { tasks: {}, points: {}, rewards: DEF_REWARDS, bonusCats: DEF_BONUS, studyLogs: {}, workbooks: { daigo: DAIGO_WBS.map(function (w) { return Object.assign({}, w); }), eishi: EISHI_WBS.map(function (w) { return Object.assign({}, w); }), yuzuki: YUZUKI_WBS.map(function (w) { return Object.assign({}, w); }), yukino: YUKINO_WBS.map(function (w) { return Object.assign({}, w); }) }, todayChecks: {}, tests: {} };
}
function clone(d) {
  return JSON.parse(JSON.stringify(d));
}
function dl(s) {
  try {
    var d = new Date(s);
    return (d.getMonth() + 1) + "/" + d.getDate() + "(" + DJ[d.getDay() === 0 ? 6 : d.getDay() - 1] + ")";
  } catch (e) {
    return s || "";
  }
}
function ft(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
function ensurePts(d, cid) {
  if (!d.points) d.points = {};
  if (!d.points[cid]) d.points[cid] = { balance: 0, history: [] };
  if (!d.points[cid].history) d.points[cid].history = [];
  return d;
}
// ═══ APP ═══
export default function App() {
  // Refresh date every render
  var _t = getToday();
  NOW = _t.now; TD = _t.td; TDI = _t.tdi;
  const [data, setData] = useState(mkData);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // null = login screen, "parent" or child id
  const dataRef = useRef(data);
  const savingRef = useRef(false);
  // Keep dataRef in sync
  useEffect(function () { dataRef.current = data; }, [data]);
  // Parse and normalize stored data
  function parseStored(raw) {
    try {
      var p = JSON.parse(raw);
      if (p && typeof p === "object" && p.tasks) {
        if (!p.bonusCats) p.bonusCats = DEF_BONUS;
        if (!p.studyLogs) p.studyLogs = {};
        if (!p.rewards) p.rewards = DEF_REWARDS;
        if (!p.points) p.points = {};
        if (!p.workbooks) p.workbooks = {};
        if (!p.workbooks.daigo) p.workbooks.daigo = DAIGO_WBS.map(function (w) { return Object.assign({}, w); });
        if (!p.workbooks.eishi) p.workbooks.eishi = EISHI_WBS.map(function (w) { return Object.assign({}, w); });
        if (!p.workbooks.yuzuki) p.workbooks.yuzuki = YUZUKI_WBS.map(function (w) { return Object.assign({}, w); });
        if (!p.workbooks.yukino) p.workbooks.yukino = YUKINO_WBS.map(function (w) { return Object.assign({}, w); });
        if (!p.todayChecks) p.todayChecks = {};
        if (!p.tests) p.tests = {};
        if (!p._dailySelections) p._dailySelections = {}; // 2026-05-19 B案
        return p;
      }
    } catch (e) { /* ignore */ }
    return null;
  }
  // Reload from shared storage
  var reload = useCallback(async function () {
    if (savingRef.current) return;
    try {
      var { data: row } = await supabase.from("app_data").select("value").eq("key", SK).single();
      if (row && row.value) {
        var p = parseStored(JSON.stringify(row.value));
        if (p && JSON.stringify(p) !== JSON.stringify(dataRef.current)) { setData(p); }
      }
    } catch (e) { /* ignore */ }
  }, []);
  // Initial load
  useEffect(function () {
    var ok = true;
    async function load() {
      try {
        var { data: row } = await supabase.from("app_data").select("value").eq("key", SK).single();
        if (ok && row && row.value) {
          var p = parseStored(JSON.stringify(row.value));
          if (p) setData(p);
        }
      } catch (e) { /* ignore */ }
      if (ok) setReady(true);
    }
    load();
    return function () { ok = false; };
  }, []);
  // Poll for updates every 15 seconds + reload on visibility change
  useEffect(function () {
    var iv = setInterval(reload, 15000);
    function onVis() {
      if (document.visibilityState === "visible") {
        var _t2 = getToday();
        NOW = _t2.now; TD = _t2.td; TDI = _t2.tdi;
        reload();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return function () {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reload]);
  var save = useCallback(async function (d) {
    savingRef.current = true;
    setData(d);
    try {
      await supabase.from("app_data").upsert({ key: SK, value: d, updated_at: new Date().toISOString() });
    } catch (e) { /* ignore */ }
    savingRef.current = false;
  }, []);
  // Login screen
  if (!ready) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F7F6F3" }}>
        <style>{cssText}</style>
        <div style={{ fontSize: 50 }}>📚</div>
        <div style={{ fontSize: 17, fontWeight: 800, marginTop: 12, fontFamily: "'Zen Maru Gothic',sans-serif" }}>まどかファミリー学習帳</div>
        <div style={{ fontSize: 13, color: "#999", marginTop: 4, fontFamily: "'Zen Maru Gothic',sans-serif" }}>読み込み中...</div>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #F7F6F3, #EDE9FF)", fontFamily: "'Zen Maru Gothic',sans-serif" }}>
        <style>{cssText}</style>
        <div style={{ fontSize: 50, marginBottom: 6 }}>📚</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#333", marginBottom: 4 }}>まどかファミリー学習帳</div>
        <div style={{ fontSize: 13, color: "#999", marginBottom: 28 }}>だれが使いますか？</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 240 }}>
          <button onClick={function () { setUser("parent"); }} style={{ padding: "14px 0", borderRadius: 16, border: "2px solid #555", background: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", color: "#333" }}>
            👩‍👧‍👦 お母さん
          </button>
          {CHILDREN.map(function (c) {
            return (
              <button key={c.id} onClick={function () { setUser(c.id); }} style={{ padding: "14px 0", borderRadius: 16, border: "2px solid " + c.color, background: c.colorLight, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", color: c.color }}>
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  var isP = user === "parent";
  var sel = isP ? null : user;
  return <MainView data={data} save={save} isP={isP} fixedChild={sel} onLogout={function () { setUser(null); }} />;
}
// ═══ MAIN VIEW ═══
function MainView(p) {
  var data = p.data, save = p.save, isP = p.isP, fixedChild = p.fixedChild, onLogout = p.onLogout;
  const [sel, setSel] = useState(fixedChild || "eishi");
  const [tab, setTab] = useState("home");
  var ch = CHILDREN.find(function (c) { return c.id === sel; }) || CHILDREN[0];
  var isM = ch.mode === "managed";
  var pts = (data.points[ch.id] && data.points[ch.id].balance) || 0;
  var navs = [
    { id: "home", icon: "🏠", l: "ホーム" },
  ];
  if (isM) navs.push({ id: "workbooks", icon: "📖", l: "問題集" });
  if (isM) navs.push({ id: "points", icon: "🌟", l: "ポイント" });
  if (isM) navs.push({ id: "review", icon: "📊", l: "ふりかえり" });
  if (isM) navs.push({ id: "tests", icon: "📝", l: "テスト" });
  if (isM) navs.push({ id: "rewards", icon: "🎁", l: "ごほうび" });
  return (
    <div style={S.app}>
      <style>{cssText}</style>
      {/* Logout + mode label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
        <button onClick={onLogout} style={{ background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>← もどる</button>
        <span style={{ fontSize: 12, color: "#999", fontWeight: 600 }}>{isP ? "👩‍👧‍👦 お母さん" : ch.emoji + " " + ch.name}</span>
      </div>
      {/* Header */}
      <header style={{ ...S.header, background: "linear-gradient(135deg," + ch.color + "," + ch.color + "cc)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{isP ? "まどかファミリー学習帳" : ch.name + "の学習帳"}</div>
            <div style={{ fontSize: 11, opacity: .9, marginTop: 2 }}>{NOW.getMonth() + 1}月{NOW.getDate()}日（{DJ[TDI]}）</div>
          </div>
          {isM && <div style={S.badge}>⭐{pts}pt</div>}
        </div>
      </header>
      {/* Child tabs - only for parent */}
      {isP && (
        <div style={S.childBar}>
          {CHILDREN.map(function (c) {
            return (
              <button key={c.id} onClick={function () { setSel(c.id); setTab("home"); }} style={{ ...S.childTab, background: sel === c.id ? c.color : "#fff", color: sel === c.id ? "#fff" : "#666", borderColor: sel === c.id ? c.color : "#e8e8e8" }}>
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      )}
      {/* Main */}
      <main style={{ padding: "6px 12px", paddingBottom: 70 }}>
        {tab === "home" && <HomeTab ch={ch} data={data} save={save} isP={isP} setTab={setTab} />}
        {tab === "workbooks" && isM && <WorkbooksTab ch={ch} data={data} save={save} isP={isP} />}
        {tab === "points" && isM && <PointsTab ch={ch} data={data} save={save} isP={isP} />}
        {tab === "review" && isM && <ReviewTab ch={ch} data={data} save={save} isP={isP} />}
        {tab === "tests" && isM && <TestsTab ch={ch} data={data} save={save} isP={isP} />}
        {tab === "rewards" && isM && <RewardsTab ch={ch} data={data} save={save} isP={isP} />}
      </main>
      {/* Nav */}
      <nav style={S.nav}>
        {navs.map(function (t) {
          return (
            <button key={t.id} onClick={function () { setTab(t.id); }} style={{ ...S.navBtn, color: tab === t.id ? ch.color : "#aaa" }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 400, marginTop: 1 }}>{t.l}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
function pageLabel(wb, numPages) {
  var start = (wb.donePages || 0) + 1;
  var end = Math.min(start + numPages - 1, wb.totalPages);
  if (start > wb.totalPages) return "完了";
  if (start === end) return "P" + start;
  return "P" + start + "-P" + end;
}
// 2026-05-19 B案: 前日に選ばれて未完だったworkbookを優先pick、なければ dayOfYear % length のローテーション
// kind: "chal"（チャレンジ）or "pit"（ぴったり）。前日の _dailySelections と todayChecks を見る
function pickWithPriority(candidates, ch, kind, dayOfYear, data) {
  if (!candidates || !candidates.length) return null;
  try {
    var yDate = new Date(NOW);
    yDate.setDate(yDate.getDate() - 1);
    var yTD = yDate.getFullYear() + "-" + String(yDate.getMonth() + 1).padStart(2, "0") + "-" + String(yDate.getDate()).padStart(2, "0");
    var ySel = (data._dailySelections && data._dailySelections[ch.id] && data._dailySelections[ch.id][yTD]) || {};
    var yWbId = ySel[kind];
    if (yWbId) {
      var preferred = candidates.find(function (w) { return w.id === yWbId; });
      if (preferred) {
        var yChecks = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][yTD]) || {};
        var doneKey = kind === "chal" ? "chal_" + preferred.id : "pit_" + preferred.id;
        var testKey = kind === "chal" ? "chaltest_" + preferred.id : null;
        var wasDone = !!yChecks[doneKey] || (testKey && !!yChecks[testKey]);
        if (!wasDone) return preferred;
      }
    }
  } catch (e) { /* fall through to rotation */ }
  return candidates[dayOfYear % candidates.length];
}
function buildTodayPlan(ch, data) {
  var wbs = (data.workbooks && data.workbooks[ch.id]) || [];
  var todayDone = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][TD]) || {};
  var carryover = (data.carryover && data.carryover[ch.id]) || [];
  var plan = [];
  var dayOfYear = Math.floor((NOW - new Date(NOW.getFullYear(), 0, 0)) / 86400000);
  // Carryover items first
  carryover.forEach(function (ci) {
    plan.push({
      id: "carry_" + ci.id, label: ci.label, subject: ci.subject || "", time: ci.time || "",
      wbId: ci.wbId, action: ci.action, pages: ci.pages, emoji: "🔄",
      done: !!todayDone["carry_" + ci.id], note: "きのうのつづき", isCarryover: true,
    });
  });
  var carryCount = carryover.length;
  var maxNew = Math.max(2, 4 - carryCount);
  if (ch.id === "daigo") {
    var tc = 0;
    if (tc < maxNew) {
      var tchal = wbs.filter(function (w) { return w.type === "challenge" && (w.doneUnits < w.totalUnits || (w.hasTest && !w.testDone)); });
      if (tchal.length > 0) {
        var tpick = pickWithPriority(tchal, ch, "chal", dayOfYear, data);
        if (tpick.doneUnits < tpick.totalUnits) {
          plan.push({ id: "today_chal_" + tpick.id, label: tpick.name + " 第" + (tpick.doneUnits + 1) + "回", subject: tpick.subject, time: "15分", wbId: tpick.id, action: "unit", emoji: "📕", done: !!todayDone["chal_" + tpick.id] });
          tc++;
        } else if (tpick.hasTest && !tpick.testDone) {
          plan.push({ id: "today_chaltest_" + tpick.id, label: tpick.name + " テスト", subject: tpick.subject, time: "15分", wbId: tpick.id, action: "test", emoji: "📝", done: !!todayDone["chaltest_" + tpick.id] });
          tc++;
        }
      }
    }
    if (tc < maxNew) {
      var tkanji = wbs.find(function (w) { return w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (tkanji) {
        plan.push({ id: "today_kanji", label: tkanji.name + " " + pageLabel(tkanji, tkanji.dailyPages), subject: tkanji.subject, time: (tkanji.dailyPages * (tkanji.minPerPage || 5)) + "分", wbId: tkanji.id, action: "pages", pages: tkanji.dailyPages, emoji: "✏️", done: !!todayDone["kanji"] });
        tc++;
      }
    }
    if (tc < maxNew) {
      var tpit = wbs.filter(function (w) { return w.type === "pages" && !w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (tpit.length > 0) {
        var tpp = pickWithPriority(tpit, ch, "pit", dayOfYear, data);
        plan.push({ id: "today_pit_" + tpp.id, label: tpp.name + " " + pageLabel(tpp, 2), subject: tpp.subject, time: (2 * (tpp.minPerPage || 3)) + "分", wbId: tpp.id, action: "pit_pages", pages: 2, emoji: "📗", done: !!todayDone["pit_" + tpp.id] });
        tc++;
      }
    }
  } else if (ch.id === "eishi") {
    plan.push({ id: "today_smile", label: "スマイルゼミ", subject: "", time: "", action: "smile", emoji: "📱", done: !!todayDone["smile"] });
    var nc = 0;
    if (nc < maxNew) {
      var chal = wbs.filter(function (w) { return w.type === "challenge" && (w.doneUnits < w.totalUnits || (w.hasTest && !w.testDone)); });
      if (chal.length > 0) {
        var pick = pickWithPriority(chal, ch, "chal", dayOfYear, data);
        if (pick.doneUnits < pick.totalUnits) {
          plan.push({ id: "today_chal_" + pick.id, label: pick.name + " 第" + (pick.doneUnits + 1) + "回", subject: pick.subject, time: "15分", wbId: pick.id, action: "unit", emoji: "📕", done: !!todayDone["chal_" + pick.id] });
          nc++;
        } else if (pick.hasTest && !pick.testDone) {
          plan.push({ id: "today_chaltest_" + pick.id, label: pick.name + " テスト", subject: pick.subject, time: "15分", wbId: pick.id, action: "test", emoji: "📝", done: !!todayDone["chaltest_" + pick.id] });
          nc++;
        }
      }
    }
    if (nc < maxNew) {
      var kanji = wbs.find(function (w) { return w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (kanji) {
        plan.push({ id: "today_kanji", label: kanji.name + " " + pageLabel(kanji, kanji.dailyPages), subject: kanji.subject, time: (kanji.dailyPages * (kanji.minPerPage || 5)) + "分", wbId: kanji.id, action: "pages", pages: kanji.dailyPages, emoji: "✏️", done: !!todayDone["kanji"] });
        nc++;
      }
    }
    if (nc < maxNew) {
      var pit = wbs.filter(function (w) { return w.type === "pages" && !w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (pit.length > 0) {
        var pp = pickWithPriority(pit, ch, "pit", dayOfYear, data);
        plan.push({ id: "today_pit_" + pp.id, label: pp.name + " " + pageLabel(pp, 2), subject: pp.subject, time: (2 * (pp.minPerPage || 3)) + "分", wbId: pp.id, action: "pit_pages", pages: 2, emoji: "📗", done: !!todayDone["pit_" + pp.id] });
        nc++;
      }
    }
  } else if (ch.id === "yuzuki") {
    plan.push({ id: "today_smile", label: "スマイルゼミ", subject: "", time: "", action: "smile", emoji: "📱", done: !!todayDone["smile"] });
    var yc = wbs.filter(function (w) { return w.type === "challenge" && (w.doneUnits < w.totalUnits || (w.hasTest && !w.testDone)); });
    if (yc.length > 0) {
      yc.forEach(function (cw) {
        if (cw.doneUnits < cw.totalUnits) plan.push({ id: "today_chal_" + cw.id, label: cw.name + " 第" + (cw.doneUnits + 1) + "回", subject: cw.subject, time: "5分", wbId: cw.id, action: "unit", emoji: "📕", done: !!todayDone["chal_" + cw.id] });
        else if (cw.hasTest && !cw.testDone) plan.push({ id: "today_chaltest_" + cw.id, label: cw.name + " テスト", subject: cw.subject, time: "5分", wbId: cw.id, action: "test", emoji: "📝", done: !!todayDone["chaltest_" + cw.id] });
      });
    }
    var yp = wbs.filter(function (w) { return w.type === "pages" && (w.donePages || 0) < w.totalPages; });
    if (yp.length > 0) {
      var yk = yp.find(function (w) { return w.dailyPages; });
      var yo = yp.filter(function (w) { return !w.dailyPages; });
      if (yk) plan.push({ id: "today_kanji", label: yk.name + " " + pageLabel(yk, yk.dailyPages), subject: yk.subject, time: (yk.dailyPages * (yk.minPerPage || 3)) + "分", wbId: yk.id, action: "pages", pages: yk.dailyPages, emoji: "✏️", done: !!todayDone["kanji"] });
      if (yo.length > 0) { var ypp = pickWithPriority(yo, ch, "pit", dayOfYear, data); plan.push({ id: "today_pit_" + ypp.id, label: ypp.name + " " + pageLabel(ypp, 2), subject: ypp.subject, time: (2 * (ypp.minPerPage || 3)) + "分", wbId: ypp.id, action: "pit_pages", pages: 2, emoji: "📗", done: !!todayDone["pit_" + ypp.id] }); }
    }
  } else if (ch.id === "yukino") {
    var ync = 0;
    if (ync < maxNew) {
      var ynchal = wbs.filter(function (w) { return w.type === "challenge" && (w.doneUnits < w.totalUnits || (w.hasTest && !w.testDone)); });
      if (ynchal.length > 0) {
        var ynpick = pickWithPriority(ynchal, ch, "chal", dayOfYear, data);
        if (ynpick.doneUnits < ynpick.totalUnits) {
          plan.push({ id: "today_chal_" + ynpick.id, label: ynpick.name + " 第" + (ynpick.doneUnits + 1) + "回", subject: ynpick.subject, time: "15分", wbId: ynpick.id, action: "unit", emoji: "📕", done: !!todayDone["chal_" + ynpick.id] });
          ync++;
        } else if (ynpick.hasTest && !ynpick.testDone) {
          plan.push({ id: "today_chaltest_" + ynpick.id, label: ynpick.name + " テスト", subject: ynpick.subject, time: "15分", wbId: ynpick.id, action: "test", emoji: "📝", done: !!todayDone["chaltest_" + ynpick.id] });
          ync++;
        }
      }
    }
    if (ync < maxNew) {
      var ynkanji = wbs.find(function (w) { return w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (ynkanji) {
        plan.push({ id: "today_kanji", label: ynkanji.name + " " + pageLabel(ynkanji, ynkanji.dailyPages), subject: ynkanji.subject, time: (ynkanji.dailyPages * (ynkanji.minPerPage || 5)) + "分", wbId: ynkanji.id, action: "pages", pages: ynkanji.dailyPages, emoji: "✏️", done: !!todayDone["kanji"] });
        ync++;
      }
    }
    if (ync < maxNew) {
      var ynpit = wbs.filter(function (w) { return w.type === "pages" && !w.dailyPages && (w.donePages || 0) < w.totalPages; });
      if (ynpit.length > 0) {
        var ynpp = pickWithPriority(ynpit, ch, "pit", dayOfYear, data);
        plan.push({ id: "today_pit_" + ynpp.id, label: ynpp.name + " " + pageLabel(ynpp, 2), subject: ynpp.subject, time: (2 * (ynpp.minPerPage || 3)) + "分", wbId: ynpp.id, action: "pit_pages", pages: 2, emoji: "📗", done: !!todayDone["pit_" + ynpp.id] });
        ync++;
      }
    }
  }
  var tasks = Object.values(data.tasks[ch.id] || {});
  tasks.filter(function (t) { return t.date === TD && !t.done; }).forEach(function (t) {
    plan.push({ id: "today_task_" + t.id, label: t.title, subject: t.subject || "", time: "", taskId: t.id, action: "task", emoji: "📝", done: false });
  });
  return plan;
}
function HomeTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP, setTab = p.setTab;
  var isM = ch.mode === "managed";
  var pts = (data.points[ch.id] && data.points[ch.id].balance) || 0;
  var logs = (data.studyLogs[ch.id] || []).filter(function (l) { return l.date === TD; });
  var todayStudySec = logs.reduce(function (s, l) { return s + l.seconds; }, 0);
  var studyMin = Math.floor(todayStudySec / 60);
  var timeLimit = ch.id === "eishi" ? 50 : 0; // 50min limit for eishi
  // Build today's plan from workbooks
  var plan = isM ? buildTodayPlan(ch, data) : [];
  var donePlanCount = plan.filter(function (t) { return t.done; }).length;
  var pendingPlan = plan.filter(function (t) { return !t.done; });
  var donePlan = plan.filter(function (t) { return t.done; });
  // 2026-05-19 B案: 今日の自動選択（チャレンジ・ぴったり）を_dailySelectionsに保存
  // 翌日のpickWithPriorityがこれを見て、未完なら同じ workbook を優先選択する
  var _planKey = plan.map(function (it) { return it.id; }).join(",");
  useEffect(function () {
    if (!isM) return;
    var todayChalItem = plan.find(function (it) { return (it.action === "unit" || it.action === "test") && !it.isCarryover; });
    var todayPitItem = plan.find(function (it) { return it.action === "pit_pages" && !it.isCarryover; });
    if (!todayChalItem && !todayPitItem) return;
    var newSel = {
      chal: todayChalItem ? todayChalItem.wbId : null,
      pit: todayPitItem ? todayPitItem.wbId : null,
    };
    var existing = (data._dailySelections && data._dailySelections[ch.id] && data._dailySelections[ch.id][TD]) || {};
    if (existing.chal === newSel.chal && existing.pit === newSel.pit) return;
    var d = clone(data);
    if (!d._dailySelections) d._dailySelections = {};
    if (!d._dailySelections[ch.id]) d._dailySelections[ch.id] = {};
    d._dailySelections[ch.id][TD] = newSel;
    save(d);
  }, [ch.id, _planKey]);
  // Manual tasks (for self-managed / non-workbook)
  var tasks = Object.values(data.tasks[ch.id] || {});
  var manualToday = tasks.filter(function (t) { return t.date === TD && !t.done; });
  var manualDoneN = tasks.filter(function (t) { return t.done && t.doneDate === TD; }).length;
  var totalRemain = pendingPlan.length + (ch.mode === "self" ? manualToday.length : 0);
  var totalDone = donePlanCount + manualDoneN;
  var checkPlanItem = function (item) {
    var d = clone(data);
    if (!d.todayChecks) d.todayChecks = {};
    if (!d.todayChecks[ch.id]) d.todayChecks[ch.id] = {};
    if (!d.todayChecks[ch.id][TD]) d.todayChecks[ch.id][TD] = {};
    if (!d.carryover) d.carryover = {};
    var isPartial = !!item._partial;
    var pagesAdvanced = item.pages || 0;
    if (isPartial) pagesAdvanced = Math.max(1, Math.floor(pagesAdvanced / 2)); // partial = advance half
    var checkKey = "";
    if (item.action === "unit") {
      checkKey = "chal_" + item.wbId;
      if (!d.workbooks) d.workbooks = {};
      var wb = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
      if (wb) wb.doneUnits = Math.min(wb.totalUnits, (wb.doneUnits || 0) + 1);
    } else if (item.action === "test") {
      checkKey = "chaltest_" + item.wbId;
      var wb2 = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
      if (wb2) wb2.testDone = true;
    } else if (item.action === "pages") {
      checkKey = "kanji";
      var wb3 = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
      if (wb3) wb3.donePages = Math.min(wb3.totalPages, (wb3.donePages || 0) + pagesAdvanced);
    } else if (item.action === "pit_pages") {
      checkKey = "pit_" + item.wbId;
      var wb4 = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
      if (wb4) wb4.donePages = Math.min(wb4.totalPages, (wb4.donePages || 0) + pagesAdvanced);
    } else if (item.action === "smile") {
      checkKey = "smile";
    } else if (item.action === "task") {
      checkKey = "task_" + item.taskId;
      if (d.tasks[ch.id] && d.tasks[ch.id][item.taskId]) {
        d.tasks[ch.id][item.taskId].done = true;
        d.tasks[ch.id][item.taskId].doneDate = TD;
      }
    }
    d.todayChecks[ch.id][TD][checkKey] = true;
    // If partial, add remaining to carryover for tomorrow
    if (isPartial && (item.action === "pages" || item.action === "pit_pages")) {
      var remainPages = (item.pages || 2) - pagesAdvanced;
      if (remainPages > 0) {
        if (!d.carryover[ch.id]) d.carryover[ch.id] = [];
        // Remove old carryover for same workbook
        d.carryover[ch.id] = d.carryover[ch.id].filter(function (c) { return c.wbId !== item.wbId; });
        var wbForLabel = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
        var nextStart = wbForLabel ? (wbForLabel.donePages || 0) + 1 : 0;
        d.carryover[ch.id].push({
          id: item.wbId + "_" + nextStart,
          wbId: item.wbId,
          label: (wbForLabel ? wbForLabel.name : "問題集") + " P" + nextStart + (remainPages > 1 ? "-P" + (nextStart + remainPages - 1) : ""),
          subject: item.subject || "",
          action: item.action,
          pages: remainPages,
          time: (remainPages * 3) + "分",
        });
      }
    } else {
      // Complete: clear any carryover for this workbook
      if (item.wbId && d.carryover[ch.id]) {
        d.carryover[ch.id] = d.carryover[ch.id].filter(function (c) { return c.wbId !== item.wbId; });
      }
      // Also clear carryover if it was a carryover item
      if (item.isCarryover && d.carryover[ch.id]) {
        d.carryover[ch.id] = d.carryover[ch.id].filter(function (c) { return ("carry_" + c.id) !== item.id; });
      }
    }
    // Clear timer data if requested (完了・途中完了時、save競合を防ぐため同じdで処理)
    if (item._clearTimerKey) {
      if (!d._timers) d._timers = {};
      delete d._timers[item._clearTimerKey];
    }
    // ポイント・履歴IDを先に決定（studyLogのmetaに埋め込むため。2026-05-16）
    ensurePts(d, ch.id);
    var _pc = d._pointConfig || {};
    var ptAmt;
    if (isPartial) { ptAmt = _pc.partialDone || 1; }
    else if (item.action === "test") { ptAmt = _pc.chalTest || 2; }
    else if (item.action === "unit") { ptAmt = _pc.chalUnit || 1; }
    else if (item.action === "pages" || item.action === "pit_pages") { ptAmt = _pc.pageDone || 1; }
    else if (item.action === "smile") { ptAmt = _pc.smileDone || 1; }
    else { ptAmt = _pc.taskDone || 1; }
    var _ptHistoryId = "tp" + Date.now();
    var _wbAdvance = (item.wbId && (item.action === "pages" || item.action === "pit_pages") && pagesAdvanced > 0) ? { wbId: item.wbId, pages: pagesAdvanced } : undefined;
    // Save elapsed time + meta（ふりかえりから記録削除時に連動取消できるように）
    if (item._elapsed && item._elapsed > 0) {
      d.todayChecks[ch.id][TD]["time_" + item.id] = item._elapsed;
      if (!d.studyLogs) d.studyLogs = {};
      if (!d.studyLogs[ch.id]) d.studyLogs[ch.id] = [];
      d.studyLogs[ch.id].push({
        id: "sl" + Date.now(),
        date: TD,
        seconds: item._elapsed,
        title: item.label + (isPartial ? "（途中まで）" : ""),
        subject: item.subject || "",
        meta: {
          checkKey: checkKey,
          checkDate: TD,
          ptAwarded: ptAmt,
          ptHistoryId: _ptHistoryId,
          wbAdvance: _wbAdvance,
          isPartial: !!isPartial,
          customTaskId: item.action === "task" ? item.taskId : undefined,
        }
      });
    }
    // Award points (configurable)
    d.points[ch.id].balance += ptAmt;
    d.points[ch.id].history.push({ type: "earn", amount: ptAmt, reason: item.label + (isPartial ? " 途中まで" : " 完了"), date: TD, id: _ptHistoryId });
    save(d);
  };
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Stats */}
      <div style={{ ...S.card, background: "linear-gradient(135deg," + ch.colorLight + ",white)" }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{ch.emoji} {ch.name}（{ch.grade}）</div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
          <MStat l="完了" v={totalDone} c="#4CAF50" />
          <MStat l="残り" v={totalRemain} c="#FF9800" />
          <MStat l="学習" v={studyMin + "分"} c="#2196F3" />
          {isM && <MStat l="pt" v={pts} c="#FFB300" />}
        </div>
        {/* Time limit bar for Eishi */}
        {timeLimit > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: studyMin >= timeLimit ? "#E53935" : "#2196F3", fontWeight: 700 }}>⏰ {studyMin}分 / {timeLimit}分</span>
              <span style={{ color: "#aaa" }}>{studyMin >= timeLimit ? "今日の学習終了！" : "のこり" + (timeLimit - studyMin) + "分"}</span>
            </div>
            <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: studyMin >= timeLimit ? "#E53935" : "linear-gradient(90deg, #2196F3, #42A5F5)", width: Math.min(100, Math.round((studyMin / timeLimit) * 100)) + "%", transition: "width .5s" }} />
            </div>
          </div>
        )}
      </div>
      {/* TODAY'S PLAN — the main feature */}
      {isM && plan.length > 0 && (
        <TodayPlanCard ch={ch} data={data} save={save} isP={isP} plan={plan} pendingPlan={pendingPlan} donePlan={donePlan} totalRemain={totalRemain} timeLimit={timeLimit} studyMin={studyMin} checkPlanItem={checkPlanItem} />
      )}
      {/* Manual tasks for today (all modes) */}
      {ch.mode === "self" && manualToday.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📋 今日のタスク</div>
          {manualToday.slice(0, 6).map(function (t) {
            return <TItem key={t.id} task={t} ch={ch} data={data} save={save} canDel={false} />;
          })}
        </div>
      )}
      {/* Workbook progress on home */}
      {isM && (data.workbooks && data.workbooks[ch.id] || []).length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📖 問題集の進捗</div>
          {(data.workbooks[ch.id] || []).map(function (wb) {
            if (wb.type === "challenge") {
              var pct2 = wb.totalUnits > 0 ? Math.round((wb.doneUnits / wb.totalUnits) * 100) : 0;
              var allDone = wb.doneUnits >= wb.totalUnits && (!wb.hasTest || wb.testDone);
              return (
                <div key={wb.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{wb.name}</span>
                    <span style={{ color: allDone ? "#4CAF50" : ch.color, fontWeight: 700 }}>{allDone ? "✅" : pct2 + "%"}</span>
                  </div>
                  <div style={S.progBar}><div style={{ height: "100%", borderRadius: 3, background: ch.color, width: pct2 + "%" }} /></div>
                </div>
              );
            } else {
              var pct3 = wb.totalPages > 0 ? Math.round(((wb.donePages || 0) / wb.totalPages) * 100) : 0;
              return (
                <div key={wb.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{wb.name}</span>
                    <span style={{ color: ch.color, fontWeight: 700 }}>{pct3}%</span>
                  </div>
                  <div style={S.progBar}><div style={{ height: "100%", borderRadius: 3, background: ch.color, width: pct3 + "%" }} /></div>
                </div>
              );
            }
          })}
        </div>
      )}
      {totalRemain === 0 && totalDone === 0 && plan.length === 0 && (
        <div style={{ textAlign: "center", padding: 30, color: "#bbb" }}>
          <div style={{ fontSize: 36 }}>{ch.emoji}</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>タスクを追加して始めよう！</div>
        </div>
      )}
    </div>
  );
}
// ═══ TODAY PLAN CARD with parent editing ═══
function TodayPlanCard(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  var plan = p.plan, pendingPlan = p.pendingPlan, donePlan = p.donePlan;
  var totalRemain = p.totalRemain, timeLimit = p.timeLimit, studyMin = p.studyMin, checkPlanItem = p.checkPlanItem;
  const [editing, setEditing] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addSubj, setAddSubj] = useState(ch.subjects[0] || "");
  const [addWbId, setAddWbId] = useState("");
  const [addWbPages, setAddWbPages] = useState("2");
  const [kanjiInput, setKanjiInput] = useState("");
  const [showKanji, setShowKanji] = useState(false);
  const [dayOffset, setDayOffset] = useState(0); // 0=today, 1=tomorrow, etc.
  var wbs = (data.workbooks && data.workbooks[ch.id]) || [];
  // Target date for editing
  var targetDate = new Date(NOW);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  var targetTD = targetDate.getFullYear() + "-" + String(targetDate.getMonth() + 1).padStart(2, "0") + "-" + String(targetDate.getDate()).padStart(2, "0");
  var isToday = dayOffset === 0;
  var dayLabel = isToday ? "今日" : dayOffset === 1 ? "明日" : (targetDate.getMonth() + 1) + "/" + targetDate.getDate();
  // Get hidden items (parent removed for target date)
  var hidden = (data.todayOverrides && data.todayOverrides[ch.id] && data.todayOverrides[ch.id][targetTD] && data.todayOverrides[ch.id][targetTD].hidden) || [];
  // 2026-05-19: 過去14日のお母さん追加タスクで未完了のものを今日のプランに繰り越し表示
  var collectAdded = function () {
    if (!data.todayOverrides || !data.todayOverrides[ch.id]) return [];
    var ovr = data.todayOverrides[ch.id];
    var todayList = (ovr[targetTD] && ovr[targetTD].added) || [];
    if (!isToday) return todayList;
    var maxDays = 14;
    var fromPast = [];
    var pastDates = Object.keys(ovr).filter(function (d) { return d < targetTD; }).sort();
    pastDates.forEach(function (d) {
      var diff = Math.floor((new Date(targetTD) - new Date(d)) / 86400000);
      if (diff > maxDays) return;
      var dList = (ovr[d] && ovr[d].added) || [];
      var dChecks = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][d]) || {};
      dList.forEach(function (a) {
        if (!dChecks["custom_" + a.id]) {
          fromPast.push(Object.assign({}, a, { _fromDate: d }));
        }
      });
    });
    return fromPast.concat(todayList);
  };
  var added = collectAdded();
  var visiblePending = pendingPlan.filter(function (item) { return hidden.indexOf(item.id) === -1; });
  var todayDone = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][targetTD]) || {};
  var addedItems = added.map(function (a) {
    // 繰越タスクは元日付の done を見る（未完了なら今日に表示し続ける）
    var isDone;
    if (a._fromDate) {
      var fromChecks = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][a._fromDate]) || {};
      isDone = !!fromChecks["custom_" + a.id];
    } else {
      isDone = !!todayDone["custom_" + a.id];
    }
    return { id: a.id, label: a.label, subject: a.subject || "", time: a.time || "", action: "custom", emoji: a.emoji || "✏️", done: isDone, wbId: a.wbId, pages: a.pages, wbAction: a.wbAction, _fromDate: a._fromDate };
  }).filter(function (a) { return !a.done; });
  // 「✅ 今日おわったもの」は今日のtodayChecksでチェックされたものを表示（繰越タスクが今日完了したら含まれる）
  var addedDone = added.map(function (a) {
    return { id: a.id, label: a.label, done: !!todayDone["custom_" + a.id], _fromDate: a._fromDate };
  }).filter(function (a) { return a.done; });
  var allPending = isToday ? visiblePending.concat(addedItems) : addedItems;
  var allDone = isToday ? donePlan.concat(addedDone) : addedDone;
  var actualRemain = allPending.length;
  var ensureOverrides = function (d, date) {
    if (!d.todayOverrides) d.todayOverrides = {};
    if (!d.todayOverrides[ch.id]) d.todayOverrides[ch.id] = {};
    if (!d.todayOverrides[ch.id][date]) d.todayOverrides[ch.id][date] = { hidden: [], added: [] };
  };
  var hideItem = function (itemId) {
    var d = clone(data);
    ensureOverrides(d, targetTD);
    d.todayOverrides[ch.id][targetTD].hidden.push(itemId);
    save(d);
  };
  var unhideItem = function (itemId) {
    var d = clone(data);
    if (d.todayOverrides && d.todayOverrides[ch.id] && d.todayOverrides[ch.id][targetTD]) {
      d.todayOverrides[ch.id][targetTD].hidden = d.todayOverrides[ch.id][targetTD].hidden.filter(function (h) { return h !== itemId; });
    }
    save(d);
  };
  // 問題集からタスク追加。チャレンジ型は「第N回」or「テスト」を判定、ページ型はページ範囲（2026-05-19 改修：P1-PNaNバグ修正）
  var addCustom = function () {
    if (!addLabel.trim() && !addWbId) return;
    var d = clone(data);
    ensureOverrides(d, targetTD);
    if (addWbId) {
      var wb = wbs.find(function (w) { return w.id === addWbId; });
      if (!wb) { save(d); setAddLabel(""); setAddWbId(""); return; }
      if (wb.type === "challenge") {
        // チャレンジ型：次にやるべき課題を判定
        var unitsLeft = (wb.doneUnits || 0) < (wb.totalUnits || 0);
        var testLeft = !unitsLeft && wb.hasTest && !wb.testDone;
        if (unitsLeft) {
          var nextUnit = (wb.doneUnits || 0) + 1;
          d.todayOverrides[ch.id][targetTD].added.push({
            id: "cust" + Date.now(),
            label: wb.name + " 第" + nextUnit + "回",
            subject: wb.subject,
            time: (wb.minPerUnit || 15) + "分",
            wbId: wb.id,
            wbAction: "unit",
            emoji: "📕"
          });
        } else if (testLeft) {
          d.todayOverrides[ch.id][targetTD].added.push({
            id: "cust" + Date.now(),
            label: wb.name + " テスト",
            subject: wb.subject,
            time: (wb.minPerUnit || 15) + "分",
            wbId: wb.id,
            wbAction: "test",
            emoji: "📝"
          });
        } else {
          // すべて完了済み → 何もしない
          save(d); setAddLabel(""); setAddWbId(""); return;
        }
      } else {
        // ページ型（既存挙動）
        var pages = parseInt(addWbPages) || 2;
        var label = wb.name + " " + pageLabel(wb, pages);
        d.todayOverrides[ch.id][targetTD].added.push({
          id: "cust" + Date.now(),
          label: label,
          subject: wb.subject,
          time: (pages * (wb.minPerPage || 3)) + "分",
          wbId: wb.id,
          wbAction: "pages",
          pages: pages,
          emoji: "📖"
        });
      }
    } else {
      d.todayOverrides[ch.id][targetTD].added.push({ id: "cust" + Date.now(), label: addLabel.trim(), subject: addSubj, time: "", emoji: "✏️" });
    }
    save(d);
    setAddLabel("");
    setAddWbId("");
  };
  // 漢字練習を1つのタスクとして追加（2026-05-16 修正：以前は1文字ずつ別タスクに分解されていた）
  var addKanji = function () {
    if (!kanjiInput.trim()) return;
    var chars = kanjiInput.trim().split("").filter(function (c) { return c.trim(); });
    if (chars.length === 0) return;
    var d = clone(data);
    ensureOverrides(d, targetTD);
    var kanjiStr = chars.join("");
    d.todayOverrides[ch.id][targetTD].added.push({
      id: "kanji" + Date.now() + Math.random(),
      label: "漢字練習：「" + kanjiStr + "」をノートに1行ずつ書く",
      subject: "国語",
      time: (chars.length * 2) + "分",
      emoji: "✏️"
    });
    save(d);
    setKanjiInput("");
  };
  // 2026-05-19: 繰越タスクの削除は元日付の added から削除する必要があるため、_fromDate を受け取る
  var removeCustom = function (custId, fromDate) {
    var targetDateForRemove = fromDate || targetTD;
    var d = clone(data);
    if (d.todayOverrides && d.todayOverrides[ch.id] && d.todayOverrides[ch.id][targetDateForRemove]) {
      d.todayOverrides[ch.id][targetDateForRemove].added = d.todayOverrides[ch.id][targetDateForRemove].added.filter(function (a) { return a.id !== custId; });
    }
    save(d);
  };
  var checkCustom = function (item) {
    var d = clone(data);
    if (!d.todayChecks) d.todayChecks = {};
    if (!d.todayChecks[ch.id]) d.todayChecks[ch.id] = {};
    if (!d.todayChecks[ch.id][targetTD]) d.todayChecks[ch.id][targetTD] = {};
    d.todayChecks[ch.id][targetTD]["custom_" + item.id] = true;
    // 2026-05-19: 繰越タスクは元日付にも完了印を入れて、翌日から再度繰り越されないようにする
    if (item._fromDate && item._fromDate !== targetTD) {
      if (!d.todayChecks[ch.id][item._fromDate]) d.todayChecks[ch.id][item._fromDate] = {};
      d.todayChecks[ch.id][item._fromDate]["custom_" + item.id] = true;
    }
    ensurePts(d, ch.id);
    var _pc = d._pointConfig || {};
    // 2026-05-19: wbActionに応じてポイントも切替（チャレンジ追加時に1pt固定にならないように）
    var ptAmt;
    if (item.wbAction === "test") { ptAmt = _pc.chalTest || 2; }
    else if (item.wbAction === "unit") { ptAmt = _pc.chalUnit || 1; }
    else if (item.wbAction === "pages" || item.wbAction === "pit_pages") { ptAmt = _pc.pageDone || 1; }
    else { ptAmt = _pc.taskDone || 1; }
    var _ptHistoryId = "cp" + Date.now();
    var _wbAdvance = (item.wbId && item.pages && (item.wbAction === "pages" || item.wbAction === "pit_pages" || !item.wbAction)) ? { wbId: item.wbId, pages: item.pages } : undefined;
    var _wbChallengeUndo = (item.wbId && (item.wbAction === "unit" || item.wbAction === "test")) ? { wbId: item.wbId, wbAction: item.wbAction } : undefined;
    d.points[ch.id].balance += ptAmt;
    d.points[ch.id].history.push({ type: "earn", amount: ptAmt, reason: item.label + " 完了", date: targetTD, id: _ptHistoryId });
    if (item._elapsed && item._elapsed > 0) {
      if (!d.studyLogs) d.studyLogs = {};
      if (!d.studyLogs[ch.id]) d.studyLogs[ch.id] = [];
      d.studyLogs[ch.id].push({
        id: "sl" + Date.now(),
        date: targetTD,
        seconds: item._elapsed,
        title: item.label,
        subject: item.subject || "",
        meta: {
          checkKey: "custom_" + item.id,
          checkDate: targetTD,
          carryoverFromDate: (item._fromDate && item._fromDate !== targetTD) ? item._fromDate : undefined,
          ptAwarded: ptAmt,
          ptHistoryId: _ptHistoryId,
          wbAdvance: _wbAdvance,
          wbChallengeUndo: _wbChallengeUndo,
          isPartial: false,
          customTaskId: item.id,
        }
      });
    }
    // タイマークリア（完了時）
    if (item._clearTimerKey) {
      if (!d._timers) d._timers = {};
      delete d._timers[item._clearTimerKey];
    }
    // 2026-05-19: 問題集を進める：wbAction に応じて分岐
    if (item.wbId) {
      var target = (d.workbooks[ch.id] || []).find(function (w) { return w.id === item.wbId; });
      if (target) {
        if (item.wbAction === "unit") {
          target.doneUnits = Math.min(target.totalUnits || 0, (target.doneUnits || 0) + 1);
        } else if (item.wbAction === "test") {
          target.testDone = true;
        } else if (item.pages && (item.wbAction === "pages" || item.wbAction === "pit_pages" || !item.wbAction)) {
          target.donePages = Math.min(target.totalPages || 0, (target.donePages || 0) + item.pages);
        }
      }
    }
    save(d);
  };
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.cardTitle}>{isP ? "📋 " + dayLabel + "のやること" : "📋 きょうやること"}</div>
        {isP && (
          <button onClick={function () { setEditing(!editing); }} style={{ ...S.addBtn, background: editing ? "#999" : ch.color, marginTop: -6 }}>
            {editing ? "✓ 完了" : "✏️ 編集"}
          </button>
        )}
      </div>
      {/* Day selector (edit mode) */}
      {isP && editing && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
          {[0, 1, 2, 3, 4, 5, 6].map(function (off) {
            var dd = new Date(NOW);
            dd.setDate(dd.getDate() + off);
            var lbl = off === 0 ? "今日" : off === 1 ? "明日" : (dd.getMonth() + 1) + "/" + dd.getDate();
            return (
              <button key={off} onClick={function () { setDayOffset(off); }} style={{ ...S.smBtn, background: dayOffset === off ? ch.color : "#f0f0f0", color: dayOffset === off ? "#fff" : "#666", whiteSpace: "nowrap", minWidth: 44 }}>{lbl}</button>
            );
          })}
        </div>
      )}
      {timeLimit > 0 && studyMin >= timeLimit && actualRemain > 0 && isToday && (
        <div style={{ background: "#FFF3E0", borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 12, color: "#E65100" }}>
          ⏰ 今日は{timeLimit}分がんばりました！残りのタスクは明日やろう。
        </div>
      )}
      {actualRemain === 0 && allDone.length > 0 && isToday && (
        <div style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#4CAF50", marginTop: 6 }}>今日のぶん、ぜんぶ終わったよ！</div>
        </div>
      )}
      {!isToday && !editing && actualRemain === 0 && (
        <div style={{ textAlign: "center", padding: 16, color: "#ccc" }}>
          <div style={{ fontSize: 13 }}>{dayLabel}の予定はまだありません</div>
        </div>
      )}
      {/* Pending items */}
      {allPending.map(function (item) {
        if (editing) {
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f3f3f3" }}>
              <button onClick={function () { if (item.action === "custom") removeCustom(item.id, item._fromDate); else hideItem(item.id); }} style={{ width: 24, height: 24, borderRadius: 12, border: "none", background: "#FFEBEE", color: "#E53935", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              <span style={{ fontSize: 16 }}>{item.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
            </div>
          );
        }
        if (!isToday) return (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f3f3" }}>
            <span style={{ fontSize: 16 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              {item.subject && <div style={{ fontSize: 10, color: "#999" }}>{item.subject}</div>}
            </div>
          </div>
        );
        if (item.action === "custom") {
          return <PlanItem key={item.id} item={item} ch={ch} data={data} save={save} checkPlanItem={function (it) { checkCustom(it); }} />;
        }
        return <PlanItem key={item.id} item={item} ch={ch} data={data} save={save} checkPlanItem={checkPlanItem} />;
      })}
      {/* Hidden items (show in edit mode) */}
      {editing && isToday && hidden.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>🚫 {dayLabel}はやらない</div>
          {hidden.map(function (hid) {
            var orig = plan.find(function (pp) { return pp.id === hid; });
            if (!orig) return null;
            return (
              <div key={hid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", opacity: .4 }}>
                <button onClick={function () { unhideItem(hid); }} style={{ width: 24, height: 24, borderRadius: 12, border: "none", background: "#E8F5E9", color: "#4CAF50", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↩</button>
                <span style={{ fontSize: 13, textDecoration: "line-through" }}>{orig.label}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* Add custom task (edit mode) */}
      {editing && (
        <div style={{ marginTop: 10, padding: 10, background: "#f9f9f9", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>＋ {dayLabel}のタスクを追加</div>
          {/* Toggle: free text or workbook */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={function () { setAddWbId(""); }} style={{ ...S.smBtn, background: !addWbId ? ch.color : "#f0f0f0", color: !addWbId ? "#fff" : "#666", flex: 1 }}>自由入力</button>
            <button onClick={function () { setAddWbId(wbs.length > 0 ? wbs[0].id : ""); }} style={{ ...S.smBtn, background: addWbId ? ch.color : "#f0f0f0", color: addWbId ? "#fff" : "#666", flex: 1 }}>問題集から</button>
          </div>
          {addWbId ? (
            <div>
              <select value={addWbId} onChange={function (e) { setAddWbId(e.target.value); }} style={{ ...S.input, marginBottom: 6 }}>
                {wbs.map(function (wb) { return <option key={wb.id} value={wb.id}>{wb.name}（{wb.subject}）</option>; })}
              </select>
              {/* 2026-05-19: チャレンジ型は「第N回 or テスト」を表示、ページ型はページ数入力 */}
              {(function () {
                var selWb = wbs.find(function (w) { return w.id === addWbId; });
                if (!selWb) return null;
                if (selWb.type === "challenge") {
                  var unitsLeft = (selWb.doneUnits || 0) < (selWb.totalUnits || 0);
                  var testLeft = !unitsLeft && selWb.hasTest && !selWb.testDone;
                  var nextMsg, isDone = false;
                  if (unitsLeft) {
                    nextMsg = "📕 次に追加されるのは「第" + ((selWb.doneUnits || 0) + 1) + "回」（" + (selWb.minPerUnit || 15) + "分）です";
                  } else if (testLeft) {
                    nextMsg = "📝 次に追加されるのは「テスト」（" + (selWb.minPerUnit || 15) + "分）です";
                  } else {
                    nextMsg = "✅ この問題集はすべて完了しています";
                    isDone = true;
                  }
                  return (
                    <div style={{ fontSize: 11, color: isDone ? "#aaa" : "#555", marginBottom: 6, padding: "8px 10px", background: isDone ? "#f5f5f5" : "#FFFDE7", borderRadius: 8, lineHeight: 1.5 }}>
                      {nextMsg}
                    </div>
                  );
                }
                return (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#666" }}>ページ数</span>
                    <input type="number" value={addWbPages} onChange={function (e) { setAddWbPages(e.target.value); }} style={{ ...S.input, width: 50, textAlign: "center" }} />
                  </div>
                );
              })()}
              <button onClick={addCustom} style={{ ...S.smBtn, background: ch.color, color: "#fff", width: "100%", padding: 8 }}>追加</button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={addLabel} onChange={function (e) { setAddLabel(e.target.value); }} placeholder="例: 算数テスト勉強" style={{ ...S.input, flex: 1 }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={addSubj} onChange={function (e) { setAddSubj(e.target.value); }} style={{ ...S.input, flex: 1 }}>
                  {ch.subjects.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                  <option value="">なし</option>
                </select>
                <button onClick={addCustom} style={{ ...S.smBtn, background: ch.color, color: "#fff", whiteSpace: "nowrap" }}>追加</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Kanji practice quick-add (parent mode, always visible) */}
      {isP && !editing && isToday && (
        <div style={{ marginTop: 8 }}>
          {!showKanji ? (
            <button onClick={function () { setShowKanji(true); }} style={{ width: "100%", padding: 8, borderRadius: 8, border: "2px dashed #CE93D8", background: "transparent", fontSize: 12, fontWeight: 700, color: "#9C27B0", cursor: "pointer" }}>
              ✏️ 漢字練習を追加
            </button>
          ) : (
            <div style={{ padding: 10, background: "#F3E5F5", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7B1FA2", marginBottom: 6 }}>✏️ 練習したい漢字を入力</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={kanjiInput} onChange={function (e) { setKanjiInput(e.target.value); }} placeholder="例: 森林海" style={{ ...S.input, fontSize: 18, letterSpacing: 4, textAlign: "center" }} />
                <button onClick={addKanji} style={{ ...S.smBtn, background: "#9C27B0", color: "#fff", whiteSpace: "nowrap" }}>追加</button>
                <button onClick={function () { setShowKanji(false); setKanjiInput(""); }} style={{ ...S.smBtn, background: "#eee", color: "#999" }}>✕</button>
              </div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>入力した漢字をまとめて1つの「漢字練習」タスクとして追加します</div>
            </div>
          )}
        </div>
      )}
      {/* Done items */}
      {allDone.length > 0 && !editing && isToday && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>✅ 今日おわったもの</div>
          {allDone.map(function (item) {
            var elapsed = (data.todayChecks && data.todayChecks[ch.id] && data.todayChecks[ch.id][targetTD] && data.todayChecks[ch.id][targetTD]["time_" + item.id]) || 0;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", opacity: .5 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>
                </div>
                <div style={{ flex: 1, fontSize: 13, textDecoration: "line-through" }}>{item.label}</div>
                {elapsed > 0 && <div style={{ fontSize: 11, color: "#999" }}>{Math.floor(elapsed / 60)}分{elapsed % 60}秒</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ═══ PLAN ITEM with Start/Pause/Resume/Complete/Partial/Stop ═══
// Timer state persisted in data._timers so switching child tabs doesn't lose it
function PlanItem(p) {
  var item = p.item, ch = p.ch, data = p.data, save = p.save, checkPlanItem = p.checkPlanItem;
  var timerKey = ch.id + "_" + item.id;
  var stored = (data._timers && data._timers[timerKey]) || null;
  const [display, setDisplay] = useState(0);
  var ivRef = useRef(null);
  var running = stored && stored.running;
  var paused = stored && !stored.running && stored.base > 0;
  var calcElapsed = function () {
    if (!stored) return 0;
    return (stored.base || 0) + (stored.running && stored.startedAt ? Math.floor((Date.now() - stored.startedAt) / 1000) : 0);
  };
  useEffect(function () {
    setDisplay(calcElapsed());
    if (running) {
      ivRef.current = setInterval(function () { setDisplay(calcElapsed()); }, 1000);
    } else {
      if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
    }
    return function () { if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; } };
  }, [running, stored && stored.startedAt, stored && stored.base]);
  useEffect(function () {
    function onVis() {
      if (document.visibilityState === "visible") {
        setDisplay(calcElapsed());
        if (running) {
          if (ivRef.current) clearInterval(ivRef.current);
          ivRef.current = setInterval(function () { setDisplay(calcElapsed()); }, 1000);
        }
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return function () { document.removeEventListener("visibilitychange", onVis); };
  }, [running, stored && stored.startedAt, stored && stored.base]);
  var saveTimer = function (obj) {
    var d = clone(data);
    if (!d._timers) d._timers = {};
    d._timers[timerKey] = obj;
    save(d);
  };
  var clearTimerData = function (d) {
    if (!d._timers) d._timers = {};
    delete d._timers[timerKey];
    return d;
  };
  var handleStart = function () {
    saveTimer({ running: true, startedAt: Date.now(), base: 0 });
  };
  var handlePause = function () {
    var elapsed = calcElapsed();
    saveTimer({ running: false, startedAt: null, base: elapsed });
  };
  var handleResume = function () {
    saveTimer({ running: true, startedAt: Date.now(), base: stored ? stored.base || 0 : 0 });
  };
  var handleComplete = function () {
    var elapsed = calcElapsed();
    // タイマークリア情報をitemに乗せてcheckPlanItemに渡す
    // checkPlanItem内でclone(data)するので、_clearTimerKeyを見てそこでもクリアする
    var itemWithTime = Object.assign({}, item, { _elapsed: elapsed, _clearTimerKey: timerKey });
    checkPlanItem(itemWithTime);
  };
  var handlePartial = function () {
    var elapsed = calcElapsed();
    var itemWithTime = Object.assign({}, item, { _elapsed: elapsed, _partial: true, _clearTimerKey: timerKey });
    checkPlanItem(itemWithTime);
  };
  var handleQuit = function () {
    var elapsed = calcElapsed();
    var d = clearTimerData(clone(data));
    if (elapsed > 10) {
      if (!d.studyLogs) d.studyLogs = {};
      if (!d.studyLogs[ch.id]) d.studyLogs[ch.id] = [];
      d.studyLogs[ch.id].push({ id: "sl" + Date.now(), date: TD, seconds: elapsed, title: item.label + "（中断）", subject: item.subject || "" });
    }
    save(d);
  };
  var hasPages = item.action === "pages" || item.action === "pit_pages";
  var started = running || paused;
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f3f3f3" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: ch.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>{item.label}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            {item.subject}{item.time ? " ・ " + item.time : ""}
            <span style={{ marginLeft: 4, color: "#FFB300", fontWeight: 700 }}>+{item.action === "test" ? 2 : 1}pt</span>
          </div>
          {item.note && <div style={{ fontSize: 10, color: "#FF9800", marginTop: 2 }}>📝 {item.note}</div>}
          {item._fromDate && (function () {
            try {
              var fDay = new Date(item._fromDate);
              var diff = Math.floor((new Date(TD) - fDay) / 86400000);
              var lbl = diff === 1 ? "きのうから" : diff <= 7 ? diff + "日前から" : (fDay.getMonth() + 1) + "/" + fDay.getDate() + "から";
              return <div style={{ fontSize: 10, color: "#FF9800", marginTop: 2, fontWeight: 700 }}>📌 {lbl}</div>;
            } catch (e) { return null; }
          })()}
        </div>
        {!started && (
          <button onClick={handleStart} style={{ padding: "6px 12px", borderRadius: 10, border: "none", background: ch.color, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            ▶ 開始
          </button>
        )}
      </div>
      {/* Timer & Controls */}
      {started && (
        <div style={{ marginTop: 8, padding: 12, background: running ? ch.color + "08" : "#f5f5f5", borderRadius: 10, border: running ? "2px solid " + ch.color + "25" : "2px solid #e0e0e0", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888" }}>{running ? "⏱️ 学習中..." : "⏸ 一時停止中"}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: running ? ch.color : "#999", fontVariantNumeric: "tabular-nums", margin: "4px 0" }}>{ft(display)}</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {running ? (
              <button onClick={handlePause} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#FF9800", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ⏸ 一時停止
              </button>
            ) : (
              <button onClick={handleResume} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: ch.color, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ▶ 再開
              </button>
            )}
            <button onClick={handleComplete} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#4CAF50", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              ✓ 完了
            </button>
            {hasPages && (
              <button onClick={handlePartial} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#7E57C2", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                △ 途中まで
              </button>
            )}
            <button onClick={handleQuit} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#eee", color: "#999", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              ✕ やめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// ═══ TIMER ═══
function Timer(p) {
  var ch = p.ch, data = p.data, save = p.save, task = p.task;
  const [on, setOn] = useState(false);
  const [display, setDisplay] = useState(0);
  const [saved, setSaved] = useState(false);
  var startRef = useRef(null);
  var baseRef = useRef(0);
  var ivRef = useRef(null);
  var calcElapsed = function () {
    return baseRef.current + (startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0);
  };
  useEffect(function () {
    if (on) {
      startRef.current = Date.now();
      setDisplay(calcElapsed());
      ivRef.current = setInterval(function () { setDisplay(calcElapsed()); }, 1000);
    } else {
      if (startRef.current) {
        baseRef.current = baseRef.current + Math.floor((Date.now() - startRef.current) / 1000);
        startRef.current = null;
      }
      if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
      setDisplay(baseRef.current);
    }
    return function () { if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; } };
  }, [on]);
  useEffect(function () {
    function onVis() {
      if (document.visibilityState === "visible" && startRef.current) {
        setDisplay(calcElapsed());
        if (ivRef.current) clearInterval(ivRef.current);
        ivRef.current = setInterval(function () { setDisplay(calcElapsed()); }, 1000);
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return function () { document.removeEventListener("visibilitychange", onVis); };
  }, []);
  var stop = function () {
    var elapsed = calcElapsed();
    setOn(false);
    if (elapsed > 10) {
      var d = clone(data);
      if (!d.studyLogs[ch.id]) d.studyLogs[ch.id] = [];
      d.studyLogs[ch.id].push({ id: "sl" + Date.now(), date: TD, seconds: elapsed, title: task ? task.title : "自由学習", subject: task ? (task.subject || "") : "" });
      save(d);
      setSaved(true);
      setTimeout(function () { setSaved(false); }, 2000);
    }
  };
  var resetTimer = function () {
    baseRef.current = 0; startRef.current = null; setDisplay(0);
  };
  return (
    <div style={{ background: on ? ch.color + "10" : "#f9f9f9", borderRadius: 12, padding: 10, marginTop: 6, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#888" }}>⏱️ タイマー</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: on ? ch.color : "#333", fontVariantNumeric: "tabular-nums" }}>{ft(display)}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4 }}>
        {!on
          ? <button onClick={function () { setOn(true); setSaved(false); }} style={{ ...S.smBtn, background: ch.color, color: "#fff" }}>▶ スタート</button>
          : <button onClick={stop} style={{ ...S.smBtn, background: "#E53935", color: "#fff" }}>⏸ ストップ</button>
        }
        {display > 0 && !on && <button onClick={resetTimer} style={{ ...S.smBtn, background: "#eee", color: "#666" }}>リセット</button>}
      </div>
      {saved && <div style={{ marginTop: 4, fontSize: 11, color: "#4CAF50", fontWeight: 700 }}>✅ {Math.floor(display / 60)}分{display % 60}秒を記録！</div>}
    </div>
  );
}
// ═══ TASK ITEM ═══
function TItem(p) {
  var task = p.task, ch = p.ch, data = p.data, save = p.save, canDel = p.canDel;
  const [showT, setShowT] = useState(false);
  var isM = ch.mode === "managed";
  var pv = task.points || 1;
  var toggle = function () {
    var d = clone(data);
    if (!d.tasks[ch.id]) return;
    var t = d.tasks[ch.id][task.id];
    if (!t) return;
    var was = t.done;
    t.done = !was;
    t.doneDate = !was ? TD : null;
    if (isM) {
      ensurePts(d, ch.id);
      if (!was) {
        d.points[ch.id].balance += pv;
        d.points[ch.id].history.push({ type: "earn", amount: pv, reason: t.title, date: TD, id: "e" + Date.now() });
      } else {
        d.points[ch.id].balance = Math.max(0, d.points[ch.id].balance - pv);
        d.points[ch.id].history.push({ type: "undo", amount: pv, reason: "取消", date: TD, id: "u" + Date.now() });
      }
    }
    save(d);
  };
  var remove = function () {
    var d = clone(data);
    if (d.tasks[ch.id]) delete d.tasks[ch.id][task.id];
    save(d);
  };
  return (
    <div style={{ borderBottom: "1px solid #f3f3f3" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
        <button onClick={toggle} style={{ ...S.check, borderColor: task.done ? "#4CAF50" : ch.color, background: task.done ? "#4CAF50" : "#fff" }}>
          {task.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
        </button>
        <div style={{ flex: 1, opacity: task.done ? 0.5 : 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            {task.subject || ""}{task.date ? " " + dl(task.date) : ""}
            {isM && <span style={{ marginLeft: 4, color: "#FFB300", fontWeight: 700 }}>+{pv}pt</span>}
          </div>
        </div>
        {!task.done && <button onClick={function () { setShowT(!showT); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", opacity: .4 }}>⏱️</button>}
        {canDel && <button onClick={remove} style={S.delBtn}>🗑</button>}
      </div>
      {showT && !task.done && <Timer ch={ch} data={data} save={save} task={task} />}
    </div>
  );
}
// ═══ TASKS TAB ═══
function TasksTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [subj, setSubj] = useState(ch.subjects[0]);
  const [due, setDue] = useState("");
  const [pts, setPts] = useState("1");
  const [showFT, setShowFT] = useState(false);
  var isM = ch.mode === "managed";
  var canAdd = isP || ch.mode === "self";
  var tasks = Object.values(data.tasks[ch.id] || {});
  var pending = tasks.filter(function (t) { return !t.done; });
  var done = tasks.filter(function (t) { return t.done; });
  var add = function () {
    if (!title.trim()) return;
    var d = clone(data);
    if (!d.tasks[ch.id]) d.tasks[ch.id] = {};
    var id = "t" + Date.now();
    d.tasks[ch.id][id] = { id: id, title: title.trim(), subject: subj, date: due || TD, points: parseInt(pts) || 1, done: false, doneDate: null };
    save(d);
    setTitle("");
    setDue("");
    setPts("1");
    setShow(false);
  };
  var logs = (data.studyLogs[ch.id] || []).filter(function (l) { return l.date === TD; });
  var studySec = logs.reduce(function (s, l) { return s + l.seconds; }, 0);
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{ch.emoji} タスク</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={function () { setShowFT(!showFT); }} style={{ ...S.addBtn, background: "#2196F3" }}>{showFT ? "✕" : "⏱️"}</button>
          {canAdd && <button onClick={function () { setShow(!show); }} style={{ ...S.addBtn, background: ch.color }}>{show ? "✕" : "＋ 追加"}</button>}
        </div>
      </div>
      {showFT && <div style={S.card}><Timer ch={ch} data={data} save={save} task={null} /></div>}
      {studySec > 0 && (
        <div style={{ ...S.card, background: "#E3F2FD", padding: 10, fontSize: 12, color: "#1565C0", fontWeight: 600 }}>
          📊 今日の学習：{Math.floor(studySec / 60)}分{studySec % 60}秒
        </div>
      )}
      {!isP && isM && <div style={{ background: "#FFFDE7", borderRadius: 12, padding: 10, marginBottom: 10, fontSize: 13, color: "#8D6E00" }}>✅ チェック → ポイントGET！ ⏱️でタイマーも使えるよ</div>}
      {show && (
        <div style={{ ...S.card, animation: "slideUp .2s ease" }}>
          <input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder="タスク内容" style={S.input} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <select value={subj} onChange={function (e) { setSubj(e.target.value); }} style={{ ...S.input, flex: 1 }}>
              {ch.subjects.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
            </select>
            <input type="date" value={due} onChange={function (e) { setDue(e.target.value); }} style={{ ...S.input, flex: 1 }} />
          </div>
          {isM && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#666" }}>⭐pt</span>
              <input type="number" min="1" value={pts} onChange={function (e) { setPts(e.target.value); }} style={{ ...S.input, width: 60 }} />
            </div>
          )}
          <button onClick={add} style={{ ...S.subBtn, background: ch.color, marginTop: 10 }}>登録</button>
        </div>
      )}
      {pending.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📋 未完了（{pending.length}）</div>
          {pending.map(function (t) { return <TItem key={t.id} task={t} ch={ch} data={data} save={save} canDel={canAdd} />; })}
        </div>
      )}
      {done.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.cardTitle, color: "#bbb" }}>✅ 完了（{done.length}）</div>
          {done.slice(0, 10).map(function (t) { return <TItem key={t.id} task={t} ch={ch} data={data} save={save} canDel={canAdd} />; })}
        </div>
      )}
    </div>
  );
}
// ═══ WORKBOOKS TAB ═══
function WorkbooksTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  var wbs = (data.workbooks && data.workbooks[ch.id]) || [];
  const [showAddChal, setShowAddChal] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [chalName, setChalName] = useState("");
  const [chalSubj, setChalSubj] = useState(ch.subjects[0]);
  const [chalUnits, setChalUnits] = useState("5");
  const [chalMin, setChalMin] = useState("15");
  const [chalHasTest, setChalHasTest] = useState(true);
  const [pageName, setPageName] = useState("");
  const [pageSubj, setPageSubj] = useState(ch.subjects[0]);
  const [pageTotal, setPageTotal] = useState("");
  const [pageMin, setPageMin] = useState("3");
  const [pageDaily, setPageDaily] = useState("");
  const [pageNote, setPageNote] = useState("");
  // 2026-05-19: ページ型問題集の donePages を直接編集（誤って進めた分の訂正用）
  const [editPagesId, setEditPagesId] = useState(null);
  const [editPagesVal, setEditPagesVal] = useState("");
  // 2026-05-19: チャレンジ型問題集の doneUnits / testDone を直接編集
  const [editUnitsId, setEditUnitsId] = useState(null);
  const [editUnitsVal, setEditUnitsVal] = useState("");
  const [editTestDoneVal, setEditTestDoneVal] = useState(false);
  var startEditUnits = function (wb) {
    setEditUnitsId(wb.id);
    setEditUnitsVal(String(wb.doneUnits || 0));
    setEditTestDoneVal(!!wb.testDone);
  };
  var cancelEditUnits = function () {
    setEditUnitsId(null);
    setEditUnitsVal("");
    setEditTestDoneVal(false);
  };
  var saveEditUnits = function (wbId) {
    var n = parseInt(editUnitsVal);
    if (isNaN(n)) { cancelEditUnits(); return; }
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (target) {
      var maxU = target.totalUnits || 0;
      target.doneUnits = Math.min(maxU, Math.max(0, n));
      if (target.hasTest) target.testDone = !!editTestDoneVal;
    }
    save(d);
    cancelEditUnits();
  };
  var startEditPages = function (wb) {
    setEditPagesId(wb.id);
    setEditPagesVal(String(wb.donePages || 0));
  };
  var cancelEditPages = function () {
    setEditPagesId(null);
    setEditPagesVal("");
  };
  var saveEditPages = function (wbId) {
    var n = parseInt(editPagesVal);
    if (isNaN(n)) { cancelEditPages(); return; }
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (target) {
      var maxP = target.totalPages || 0;
      target.donePages = Math.min(maxP, Math.max(0, n));
    }
    save(d);
    cancelEditPages();
  };
  var markUnit = function (wbId) {
    var wb = wbs.find(function (w) { return w.id === wbId; });
    if (!wb) return;
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (target) target.doneUnits = Math.min(target.totalUnits, (target.doneUnits || 0) + 1);
    ensurePts(d, ch.id);
    d.points[ch.id].balance += 1;
    d.points[ch.id].history.push({ type: "earn", amount: 1, reason: wb.name + " 第" + target.doneUnits + "回完了", date: TD, id: "wb" + Date.now() });
    save(d);
  };
  var markTest = function (wbId) {
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (target) target.testDone = true;
    ensurePts(d, ch.id);
    d.points[ch.id].balance += 2;
    d.points[ch.id].history.push({ type: "earn", amount: 2, reason: target.name + " テスト完了", date: TD, id: "wbt" + Date.now() });
    save(d);
  };
  var markPages = function (wbId, pages) {
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (!target) return;
    target.donePages = Math.min(target.totalPages, (target.donePages || 0) + pages);
    ensurePts(d, ch.id);
    d.points[ch.id].balance += 1;
    d.points[ch.id].history.push({ type: "earn", amount: 1, reason: target.name + " " + pages + "p完了", date: TD, id: "wbp" + Date.now() });
    save(d);
  };
  var deleteWb = function (wbId) {
    var d = clone(data);
    d.workbooks[ch.id] = (d.workbooks[ch.id] || []).filter(function (w) { return w.id !== wbId; });
    save(d);
  };
  var resetChallenge = function (wbId) {
    var d = clone(data);
    var target = d.workbooks[ch.id].find(function (w) { return w.id === wbId; });
    if (target) { target.doneUnits = 0; target.testDone = false; }
    save(d);
  };
  var addChallenge = function () {
    if (!chalName.trim()) return;
    var d = clone(data);
    if (!d.workbooks[ch.id]) d.workbooks[ch.id] = [];
    d.workbooks[ch.id].push({ id: "wb_c" + Date.now(), name: chalName.trim(), subject: chalSubj, type: "challenge", totalUnits: parseInt(chalUnits) || 5, doneUnits: 0, hasTest: chalHasTest, testDone: false, minPerUnit: parseInt(chalMin) || 15, priority: "high", monthly: true });
    save(d);
    setChalName(""); setChalUnits("5"); setChalMin("15"); setChalHasTest(true); setShowAddChal(false);
  };
  var addPageBook = function () {
    if (!pageName.trim() || !pageTotal) return;
    var d = clone(data);
    if (!d.workbooks[ch.id]) d.workbooks[ch.id] = [];
    var wb = { id: "wb_p" + Date.now(), name: pageName.trim(), subject: pageSubj, type: "pages", totalPages: parseInt(pageTotal) || 100, donePages: 0, minPerPage: parseInt(pageMin) || 3, priority: "normal" };
    if (pageDaily.trim()) wb.dailyPages = parseInt(pageDaily) || 0;
    if (pageNote.trim()) wb.note = pageNote.trim();
    d.workbooks[ch.id].push(wb);
    save(d);
    setPageName(""); setPageTotal(""); setPageMin("3"); setPageDaily(""); setPageNote(""); setShowAddPage(false);
  };
  var challenges = wbs.filter(function (w) { return w.type === "challenge"; });
  var pageBooks = wbs.filter(function (w) { return w.type === "pages"; });
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>{ch.emoji} {ch.name}の問題集</h2>
      {/* Challenge section */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.cardTitle}>📕 チャレンジ</div>
          {isP && <button onClick={function () { setShowAddChal(!showAddChal); }} style={{ ...S.addBtn, background: ch.color }}>{showAddChal ? "✕" : "＋ 追加"}</button>}
        </div>
        {showAddChal && (
          <div style={{ padding: 10, background: "#f9f9f9", borderRadius: 10, marginBottom: 10 }}>
            <input value={chalName} onChange={function (e) { setChalName(e.target.value); }} placeholder="名前（例：チャレンジ国語）" style={S.input} />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <select value={chalSubj} onChange={function (e) { setChalSubj(e.target.value); }} style={{ ...S.input, flex: 1 }}>{ch.subjects.map(function (s) { return <option key={s} value={s}>{s}</option>; })}</select>
              <input type="number" value={chalUnits} onChange={function (e) { setChalUnits(e.target.value); }} placeholder="回数" style={{ ...S.input, width: 50, flex: "none" }} />
              <input type="number" value={chalMin} onChange={function (e) { setChalMin(e.target.value); }} placeholder="分/回" style={{ ...S.input, width: 50, flex: "none" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>テストあり</span>
              <button onClick={function () { setChalHasTest(!chalHasTest); }} style={{ ...S.smBtn, background: chalHasTest ? ch.color : "#e0e0e0", color: chalHasTest ? "#fff" : "#999", minWidth: 50 }}>{chalHasTest ? "ON" : "OFF"}</button>
            </div>
            <button onClick={addChallenge} style={{ ...S.smBtn, background: ch.color, color: "#fff", width: "100%", marginTop: 6, padding: 8 }}>追加</button>
          </div>
        )}
        {challenges.length > 0 ? challenges.map(function (wb) {
          var total = wb.totalUnits || 0;
          var done = wb.doneUnits || 0;
          var allDone = done >= total && (!wb.hasTest || wb.testDone);
          var pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={wb.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f3f3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{wb.name || wb.subject}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{wb.subject}・第{done}回 / 全{total}回{wb.hasTest ? "＋テスト" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {!allDone && done < total && <button onClick={function () { markUnit(wb.id); }} style={{ ...S.smBtn, background: ch.color, color: "#fff", fontSize: 10 }}>第{done + 1}回 ✓</button>}
                  {!allDone && done >= total && wb.hasTest && !wb.testDone && <button onClick={function () { markTest(wb.id); }} style={{ ...S.smBtn, background: "#FF9800", color: "#fff", fontSize: 10 }}>テスト ✓</button>}
                  {allDone && <span style={{ fontSize: 12, color: "#4CAF50", fontWeight: 700 }}>✅</span>}
                  {isP && <button onClick={function () { startEditUnits(wb); }} style={{ ...S.smBtn, background: "#f0f0f0", color: "#666", fontSize: 10 }} title="完了回数を直接編集">✏️</button>}
                </div>
              </div>
              <div style={{ ...S.progBar, marginTop: 6 }}><div style={{ height: "100%", borderRadius: 3, background: ch.color, width: pct + "%" }} /></div>
              {isP && editUnitsId === wb.id && (
                <div style={{ marginTop: 8, padding: 8, background: "#FFFDE7", borderRadius: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>完了回数:</span>
                  <input type="number" value={editUnitsVal} onChange={function (e) { setEditUnitsVal(e.target.value); }} min="0" max={total} style={{ ...S.input, width: 60, textAlign: "center", padding: "4px 6px" }} />
                  <span style={{ fontSize: 11, color: "#999" }}>/ {total}回</span>
                  {wb.hasTest && (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 6 }}>
                      <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>テスト:</span>
                      <button onClick={function () { setEditTestDoneVal(!editTestDoneVal); }} style={{ ...S.smBtn, background: editTestDoneVal ? "#4CAF50" : "#e0e0e0", color: editTestDoneVal ? "#fff" : "#999", fontSize: 11, minWidth: 56 }}>{editTestDoneVal ? "完了" : "未"}</button>
                    </span>
                  )}
                  <button onClick={function () { saveEditUnits(wb.id); }} style={{ ...S.smBtn, background: "#4CAF50", color: "#fff", fontSize: 11 }}>保存</button>
                  <button onClick={cancelEditUnits} style={{ ...S.smBtn, background: "#eee", color: "#666", fontSize: 11 }}>×</button>
                </div>
              )}
              {isP && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {allDone && <button onClick={function () { resetChallenge(wb.id); }} style={{ ...S.smBtn, background: "#2196F3", color: "#fff", fontSize: 10 }}>🔄 来月号にリセット</button>}
                  <button onClick={function () { deleteWb(wb.id); }} style={{ ...S.smBtn, background: "#eee", color: "#999", fontSize: 10 }}>🗑 削除</button>
                </div>
              )}
            </div>
          );
        }) : <div style={{ fontSize: 12, color: "#ccc" }}>チャレンジはまだ登録されていません</div>}
      </div>
      {/* Page-based workbooks */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.cardTitle}>📗 問題集</div>
          {isP && <button onClick={function () { setShowAddPage(!showAddPage); }} style={{ ...S.addBtn, background: ch.color }}>{showAddPage ? "✕" : "＋ 追加"}</button>}
        </div>
        {showAddPage && (
          <div style={{ padding: 10, background: "#f9f9f9", borderRadius: 10, marginBottom: 10 }}>
            <input value={pageName} onChange={function (e) { setPageName(e.target.value); }} placeholder="名前（例：漢字MAXドリル小4）" style={S.input} />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <select value={pageSubj} onChange={function (e) { setPageSubj(e.target.value); }} style={{ ...S.input, flex: 1 }}>{ch.subjects.map(function (s) { return <option key={s} value={s}>{s}</option>; })}</select>
              <input type="number" value={pageTotal} onChange={function (e) { setPageTotal(e.target.value); }} placeholder="総ページ" style={{ ...S.input, width: 60, flex: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input type="number" value={pageMin} onChange={function (e) { setPageMin(e.target.value); }} placeholder="分/p" style={{ ...S.input, width: 50, flex: "none" }} />
              <input type="number" value={pageDaily} onChange={function (e) { setPageDaily(e.target.value); }} placeholder="毎日p（任意）" style={{ ...S.input, flex: 1 }} />
            </div>
            <input value={pageNote} onChange={function (e) { setPageNote(e.target.value); }} placeholder="メモ（任意）" style={{ ...S.input, marginTop: 6 }} />
            <button onClick={addPageBook} style={{ ...S.smBtn, background: ch.color, color: "#fff", width: "100%", marginTop: 6, padding: 8 }}>追加</button>
          </div>
        )}
        {pageBooks.length > 0 ? pageBooks.map(function (wb) {
          var total = wb.totalPages || 0;
          var done = wb.donePages || 0;
          var pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={wb.id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f3f3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {wb.name}
                    {wb.dailyPages && <span style={{ marginLeft: 6, fontSize: 9, background: "#E3F2FD", color: "#1565C0", padding: "1px 5px", borderRadius: 6 }}>毎日{wb.dailyPages}p</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{wb.subject}・{done}/{total}p（残{total - done}p）</div>
                  {wb.note && <div style={{ fontSize: 10, color: "#FF9800", marginTop: 2 }}>📝 {wb.note}</div>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={function () { markPages(wb.id, 1); }} style={{ ...S.smBtn, background: "#eee", color: "#333", fontSize: 10 }}>+1p</button>
                  <button onClick={function () { markPages(wb.id, wb.dailyPages || 2); }} style={{ ...S.smBtn, background: ch.color, color: "#fff", fontSize: 10 }}>+{wb.dailyPages || 2}p</button>
                  {isP && <button onClick={function () { startEditPages(wb); }} style={{ ...S.smBtn, background: "#f0f0f0", color: "#666", fontSize: 10 }} title="完了ページを直接編集">✏️</button>}
                </div>
              </div>
              <div style={{ ...S.progBar, marginTop: 6 }}><div style={{ height: "100%", borderRadius: 3, background: pct >= 80 ? "#4CAF50" : ch.color, width: pct + "%" }} /></div>
              {isP && editPagesId === wb.id && (
                <div style={{ marginTop: 8, padding: 8, background: "#FFFDE7", borderRadius: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>完了ページ:</span>
                  <input type="number" value={editPagesVal} onChange={function (e) { setEditPagesVal(e.target.value); }} min="0" max={total} style={{ ...S.input, width: 60, textAlign: "center", padding: "4px 6px" }} />
                  <span style={{ fontSize: 11, color: "#999" }}>/ {total}p</span>
                  <button onClick={function () { saveEditPages(wb.id); }} style={{ ...S.smBtn, background: "#4CAF50", color: "#fff", fontSize: 11 }}>保存</button>
                  <button onClick={cancelEditPages} style={{ ...S.smBtn, background: "#eee", color: "#666", fontSize: 11 }}>×</button>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <div style={{ fontSize: 10, color: "#bbb" }}>{pct}%完了</div>
                {isP && <button onClick={function () { deleteWb(wb.id); }} style={{ background: "none", border: "none", fontSize: 11, cursor: "pointer", color: "#ccc" }}>🗑 削除</button>}
              </div>
            </div>
          );
        }) : <div style={{ fontSize: 12, color: "#ccc" }}>問題集はまだ登録されていません</div>}
      </div>
    </div>
  );
}
// ═══ POINTS TAB (ポイント獲得) ═══
function PointsTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [ptV, setPtV] = useState("1");
  const [emj, setEmj] = useState("⭐");
  const [awarded, setAwarded] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editEmj, setEditEmj] = useState("");
  const [editName, setEditName] = useState("");
  const [editPts, setEditPts] = useState("");
  const [showPlanCfg, setShowPlanCfg] = useState(false);
  var cats = data.bonusCats || DEF_BONUS;
  var pts = (data.points[ch.id] && data.points[ch.id].balance) || 0;
  // Point config for today's plan items (stored per data, not per child)
  var planCfg = data._pointConfig || {};
  var planPts = {
    taskDone: planCfg.taskDone || 1,
    chalUnit: planCfg.chalUnit || 1,
    chalTest: planCfg.chalTest || 2,
    pageDone: planCfg.pageDone || 1,
    smileDone: planCfg.smileDone || 1,
    partialDone: planCfg.partialDone || 1,
  };
  var award = function (cat) {
    var d = clone(data);
    ensurePts(d, ch.id);
    d.points[ch.id].balance += cat.points;
    d.points[ch.id].history.push({ type: "earn", amount: cat.points, reason: cat.name, date: TD, id: "b" + Date.now() });
    save(d);
    setAwarded(cat.id);
    setTimeout(function () { setAwarded(null); }, 1500);
  };
  var addCat = function () {
    if (!name.trim()) return;
    var d = clone(data);
    var arr = d.bonusCats || [];
    arr.push({ id: "bc" + Date.now(), name: name.trim(), points: parseInt(ptV) || 1, emoji: emj || "⭐", color: "#607D8B" });
    d.bonusCats = arr;
    save(d);
    setName("");
    setPtV("1");
    setEmj("⭐");
    setShowAdd(false);
  };
  var delCat = function (cid) {
    var d = clone(data);
    d.bonusCats = (d.bonusCats || []).filter(function (c) { return c.id !== cid; });
    save(d);
  };
  var startEdit = function (cat) {
    setEditId(cat.id);
    setEditEmj(cat.emoji);
    setEditName(cat.name);
    setEditPts(String(cat.points));
  };
  var saveEdit = function () {
    var d = clone(data);
    d.bonusCats = (d.bonusCats || []).map(function (c) {
      if (c.id === editId) {
        return Object.assign({}, c, { emoji: editEmj || c.emoji, name: editName.trim() || c.name, points: parseInt(editPts) || c.points });
      }
      return c;
    });
    save(d);
    setEditId(null);
  };
  var cancelEdit = function () { setEditId(null); };
  var savePlanCfg = function (key, val) {
    var d = clone(data);
    if (!d._pointConfig) d._pointConfig = {};
    d._pointConfig[key] = parseInt(val) || 1;
    save(d);
  };
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Current points display */}
      <div style={{ ...S.card, textAlign: "center", padding: 16, background: "linear-gradient(135deg," + ch.colorLight + ",#fff)" }}>
        <div style={{ fontSize: 13, color: "#888" }}>{ch.name}のポイント</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: ch.color, margin: "4px 0" }}>⭐ {pts}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 6 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{ch.emoji} ポイントをもらう</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {isP && <button onClick={function () { setShowPlanCfg(!showPlanCfg); }} style={{ ...S.smBtn, background: showPlanCfg ? ch.color : "#f0f0f0", color: showPlanCfg ? "#fff" : "#666" }}>⚙️</button>}
          {isP && <button onClick={function () { setShowAdd(!showAdd); }} style={{ ...S.addBtn, background: ch.color }}>{showAdd ? "✕" : "＋"}</button>}
        </div>
      </div>
      <div style={{ ...S.card, background: ch.colorLight, textAlign: "center", padding: 12 }}>
        <div style={{ fontSize: 12, color: "#888" }}>🌟 勉強以外でもポイントがもらえるよ！</div>
      </div>
      {/* Plan point config */}
      {isP && showPlanCfg && (
        <div style={{ ...S.card, border: "2px solid " + ch.color + "30" }}>
          <div style={S.cardTitle}>⚙️ 今日のやること ポイント設定</div>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>各項目を完了した時にもらえるポイント数</div>
          {[
            { key: "taskDone", label: "タスク完了" },
            { key: "chalUnit", label: "チャレンジ1回完了" },
            { key: "chalTest", label: "チャレンジテスト完了" },
            { key: "pageDone", label: "ページ教材完了" },
            { key: "smileDone", label: "スマイルゼミ完了" },
            { key: "partialDone", label: "途中まで完了" },
          ].map(function (item) {
            return (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input type="number" value={planPts[item.key]} onChange={function (e) { savePlanCfg(item.key, e.target.value); }} style={{ ...S.input, width: 50, textAlign: "center", padding: "4px" }} />
                  <span style={{ fontSize: 11, color: "#999" }}>pt</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>🏅 ボーナスポイント</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {cats.map(function (cat) {
            if (editId === cat.id) {
              return (
                <div key={cat.id} style={{ padding: 10, borderRadius: 14, border: "2px solid " + ch.color, background: "#fff" }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    <input value={editEmj} onChange={function (e) { setEditEmj(e.target.value); }} style={{ ...S.input, width: 36, textAlign: "center", padding: "4px" }} />
                    <input value={editName} onChange={function (e) { setEditName(e.target.value); }} style={{ ...S.input, flex: 1, padding: "4px 6px" }} />
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
                    <input type="number" value={editPts} onChange={function (e) { setEditPts(e.target.value); }} style={{ ...S.input, width: 44, textAlign: "center", padding: "4px" }} />
                    <span style={{ fontSize: 11, color: "#999" }}>pt</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={saveEdit} style={{ ...S.smBtn, background: "#4CAF50", color: "#fff", flex: 1, fontSize: 10 }}>保存</button>
                    <button onClick={cancelEdit} style={{ ...S.smBtn, background: "#eee", color: "#666", flex: 1, fontSize: 10 }}>×</button>
                  </div>
                </div>
              );
            }
            return (
              <button key={cat.id} onClick={function () { award(cat); }} style={{ padding: 12, borderRadius: 14, border: "2px solid " + (cat.color || "#ccc") + "30", background: awarded === cat.id ? (cat.color || "#ccc") + "15" : "#fff", cursor: "pointer", textAlign: "center", position: "relative" }}>
                {isP && <span onClick={function (e) { e.stopPropagation(); startEdit(cat); }} style={{ position: "absolute", top: 2, left: 5, fontSize: 10, cursor: "pointer", color: "#bbb" }}>✏️</span>}
                {isP && <span onClick={function (e) { e.stopPropagation(); delCat(cat.id); }} style={{ position: "absolute", top: 2, right: 5, fontSize: 10, cursor: "pointer", color: "#ccc" }}>✕</span>}
                <div style={{ fontSize: 26 }}>{cat.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{cat.name}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: cat.color || "#666", marginTop: 2 }}>+{cat.points}pt</div>
                {awarded === cat.id && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.85)", borderRadius: 14, fontSize: 18, fontWeight: 900, color: "#4CAF50" }}>✅ GET!</div>}
              </button>
            );
          })}
        </div>
      </div>
      {showAdd && (
        <div style={{ ...S.card, animation: "slideUp .2s ease" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={emj} onChange={function (e) { setEmj(e.target.value); }} style={{ ...S.input, width: 44, textAlign: "center" }} />
            <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder="項目名" style={{ ...S.input, flex: 1 }} />
            <input type="number" value={ptV} onChange={function (e) { setPtV(e.target.value); }} style={{ ...S.input, width: 50 }} />
          </div>
          <button onClick={addCat} style={{ ...S.subBtn, background: ch.color, marginTop: 8 }}>追加</button>
        </div>
      )}
    </div>
  );
}
// ═══ REVIEW TAB ═══
function ReviewTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  var logs = (data.studyLogs && data.studyLogs[ch.id]) || [];
  var checks = (data.todayChecks && data.todayChecks[ch.id]) || {};
  var wbs = (data.workbooks && data.workbooks[ch.id]) || [];
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null); // date string or null
  const [editLogId, setEditLogId] = useState(null);
  const [editMin, setEditMin] = useState("");
  const [editSec, setEditSec] = useState("");
  var viewDate = new Date(NOW.getFullYear(), NOW.getMonth() + monthOffset, 1);
  var viewYear = viewDate.getFullYear();
  var viewMonth = viewDate.getMonth();
  var viewMonthLabel = viewYear + "年" + (viewMonth + 1) + "月";
  var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  var firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  var startPad = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  var monthDays = [];
  for (var i = 0; i < startPad; i++) monthDays.push(null);
  for (var d = 1; d <= daysInMonth; d++) {
    var ds = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    var dayLogs = logs.filter(function (l) { return l.date === ds; });
    var daySec = dayLogs.reduce(function (s, l) { return s + l.seconds; }, 0);
    var dayChecks = checks[ds] || {};
    var doneCount = Object.keys(dayChecks).filter(function (k) { return k !== "_plan" && !k.startsWith("time_") && dayChecks[k] === true; }).length;
    monthDays.push({ date: ds, day: d, sec: daySec, count: doneCount, logs: dayLogs });
  }
  var monthLogs = logs.filter(function (l) {
    return l.date && l.date.startsWith(viewYear + "-" + String(viewMonth + 1).padStart(2, "0"));
  });
  var monthSec = monthLogs.reduce(function (s, l) { return s + l.seconds; }, 0);
  var monthTaskCount = 0;
  for (var dd = 1; dd <= daysInMonth; dd++) {
    var dds = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
    var dc = checks[dds] || {};
    monthTaskCount += Object.keys(dc).filter(function (k) { return k !== "_plan" && !k.startsWith("time_") && dc[k] === true; }).length;
  }
  var activeDays = monthDays.filter(function (d) { return d && (d.sec > 0 || d.count > 0); }).length;
  var canGoBack = monthOffset > -11;
  var canGoForward = monthOffset < 0;
  var weeklyData = [];
  var weekStart = 1;
  while (weekStart <= daysInMonth) {
    var weekEnd = Math.min(weekStart + 6, daysInMonth);
    var wSec = 0;
    var wCount = 0;
    for (var wd = weekStart; wd <= weekEnd; wd++) {
      var wds = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(wd).padStart(2, "0");
      var wLogs = logs.filter(function (l) { return l.date === wds; });
      wSec += wLogs.reduce(function (s, l) { return s + l.seconds; }, 0);
      var wChecks = checks[wds] || {};
      wCount += Object.keys(wChecks).filter(function (k) { return k !== "_plan" && !k.startsWith("time_") && wChecks[k] === true; }).length;
    }
    weeklyData.push({ label: weekStart + "〜" + weekEnd + "日", sec: wSec, count: wCount });
    weekStart = weekEnd + 1;
  }
  var maxWeekSec = Math.max.apply(null, weeklyData.map(function (w) { return w.sec; }).concat([1]));
  // Day detail data
  var dayDetail = null;
  if (selectedDay) {
    var sdLogs = logs.filter(function (l) { return l.date === selectedDay; });
    var sdChecks = checks[selectedDay] || {};
    var sdDoneCount = Object.keys(sdChecks).filter(function (k) { return k !== "_plan" && !k.startsWith("time_") && sdChecks[k] === true; }).length;
    var sdSec = sdLogs.reduce(function (s, l) { return s + l.seconds; }, 0);
    dayDetail = { date: selectedDay, logs: sdLogs, doneCount: sdDoneCount, totalSec: sdSec };
  }
  var startEditLog = function (log) {
    setEditLogId(log.id);
    setEditMin(String(Math.floor(log.seconds / 60)));
    setEditSec(String(log.seconds % 60));
  };
  var saveEditLog = function () {
    var newSec = (parseInt(editMin) || 0) * 60 + (parseInt(editSec) || 0);
    if (newSec < 0) newSec = 0;
    var dd = clone(data);
    if (dd.studyLogs && dd.studyLogs[ch.id]) {
      dd.studyLogs[ch.id] = dd.studyLogs[ch.id].map(function (l) {
        if (l.id === editLogId) return Object.assign({}, l, { seconds: newSec });
        return l;
      });
    }
    save(dd);
    setEditLogId(null);
  };
  // 学習記録の削除 → 紐付く完了チェック・ポイント・問題集進捗も連動して巻き戻す（2026-05-16 改修）
  var deleteLog = function (logId) {
    var dd = clone(data);
    if (!dd.studyLogs || !dd.studyLogs[ch.id]) { return; }
    var log = dd.studyLogs[ch.id].find(function (l) { return l.id === logId; });
    if (!log) { return; }
    if (log.meta) {
      // ─── meta あり：正確に巻き戻す ───
      var m = log.meta;
      // 1) todayChecks の完了チェックを取消
      if (m.checkDate && m.checkKey && dd.todayChecks && dd.todayChecks[ch.id] && dd.todayChecks[ch.id][m.checkDate]) {
        delete dd.todayChecks[ch.id][m.checkDate][m.checkKey];
      }
      // 1b) 2026-05-19: 繰越タスクの場合は元日付の完了印も取消（翌日からまた繰越されるように）
      if (m.carryoverFromDate && m.checkKey && dd.todayChecks && dd.todayChecks[ch.id] && dd.todayChecks[ch.id][m.carryoverFromDate]) {
        delete dd.todayChecks[ch.id][m.carryoverFromDate][m.checkKey];
      }
      // 2) ポイント取消
      if (m.ptAwarded && dd.points && dd.points[ch.id]) {
        dd.points[ch.id].balance = Math.max(0, dd.points[ch.id].balance - m.ptAwarded);
        if (m.ptHistoryId && dd.points[ch.id].history) {
          dd.points[ch.id].history = dd.points[ch.id].history.filter(function (h) { return h.id !== m.ptHistoryId; });
        }
      }
      // 3) 問題集ページの巻き戻し
      if (m.wbAdvance && m.wbAdvance.wbId && m.wbAdvance.pages && dd.workbooks && dd.workbooks[ch.id]) {
        var wbBack = dd.workbooks[ch.id].find(function (w) { return w.id === m.wbAdvance.wbId; });
        if (wbBack) wbBack.donePages = Math.max(0, (wbBack.donePages || 0) - m.wbAdvance.pages);
      }
      // 3b) チャレンジ完了の巻き戻し（2026-05-19 追加）
      if (m.wbChallengeUndo && m.wbChallengeUndo.wbId && dd.workbooks && dd.workbooks[ch.id]) {
        var wbCh = dd.workbooks[ch.id].find(function (w) { return w.id === m.wbChallengeUndo.wbId; });
        if (wbCh) {
          if (m.wbChallengeUndo.wbAction === "unit") {
            wbCh.doneUnits = Math.max(0, (wbCh.doneUnits || 0) - 1);
          } else if (m.wbChallengeUndo.wbAction === "test") {
            wbCh.testDone = false;
          }
        }
      }
      // 4) カスタムタスクなら todayOverrides.added からも削除
      if (m.checkKey && m.checkKey.indexOf("custom_") === 0) {
        var custId = m.checkKey.substring("custom_".length);
        if (dd.todayOverrides && dd.todayOverrides[ch.id] && dd.todayOverrides[ch.id][m.checkDate]) {
          dd.todayOverrides[ch.id][m.checkDate].added = (dd.todayOverrides[ch.id][m.checkDate].added || []).filter(function (a) { return a.id !== custId; });
        }
      }
      // 5) 手動タスクの場合 tasks.done = false に戻す
      if (m.customTaskId && dd.tasks && dd.tasks[ch.id] && dd.tasks[ch.id][m.customTaskId]) {
        dd.tasks[ch.id][m.customTaskId].done = false;
        dd.tasks[ch.id][m.customTaskId].doneDate = null;
      }
    } else {
      // ─── meta なしの旧ログ：ヒューリスティックで紐付けを推定（漢字練習1文字タスク等の救済）───
      var normalize = function (s) {
        return (s || "").replace(/\s+/g, "").replace(/（途中まで）/g, "").replace(/完了$/, "");
      };
      var lTitle = normalize(log.title);
      if (lTitle && dd.todayOverrides && dd.todayOverrides[ch.id] && dd.todayOverrides[ch.id][log.date]) {
        var addedArr = dd.todayOverrides[ch.id][log.date].added || [];
        var matched = addedArr.find(function (a) {
          var al = normalize(a.label);
          if (!al) return false;
          return al === lTitle || al.indexOf(lTitle) >= 0 || lTitle.indexOf(al) >= 0;
        });
        if (matched) {
          var legacyCheckKey = "custom_" + matched.id;
          if (dd.todayChecks && dd.todayChecks[ch.id] && dd.todayChecks[ch.id][log.date]) {
            delete dd.todayChecks[ch.id][log.date][legacyCheckKey];
          }
          var legacyPt = (dd._pointConfig && dd._pointConfig.taskDone) || 1;
          if (dd.points && dd.points[ch.id]) {
            dd.points[ch.id].balance = Math.max(0, dd.points[ch.id].balance - legacyPt);
            var hist = dd.points[ch.id].history || [];
            for (var hi = hist.length - 1; hi >= 0; hi--) {
              if (hist[hi].date === log.date && hist[hi].reason && hist[hi].reason.indexOf(matched.label) === 0) {
                hist.splice(hi, 1);
                break;
              }
            }
          }
          dd.todayOverrides[ch.id][log.date].added = addedArr.filter(function (a) { return a.id !== matched.id; });
        }
      }
    }
    // studyLogs から削除
    dd.studyLogs[ch.id] = dd.studyLogs[ch.id].filter(function (l) { return l.id !== logId; });
    save(dd);
  };
  var addManualLog = function () {
    var dd = clone(data);
    if (!dd.studyLogs) dd.studyLogs = {};
    if (!dd.studyLogs[ch.id]) dd.studyLogs[ch.id] = [];
    dd.studyLogs[ch.id].push({ id: "sl" + Date.now(), date: selectedDay, seconds: 0, title: "手動追加", subject: "" });
    save(dd);
  };
  // この日の記録をすべてリセット（2026-05-16 追加）
  var resetDay = function () {
    if (!selectedDay) return;
    if (typeof window !== "undefined" && window.confirm) {
      if (!window.confirm(selectedDayLabel + "の記録をすべてリセットします。\n\n・完了タスクのチェック\n・獲得したポイント\n・学習時間の記録\n・その日に追加したタスク\n\nをすべて取り消します。\n\nよろしいですか？")) return;
    }
    var dd = clone(data);
    // 問題集ページ・手動タスクの巻き戻し（meta 付きログから）
    var dayLogs = (dd.studyLogs && dd.studyLogs[ch.id] || []).filter(function (l) { return l.date === selectedDay; });
    dayLogs.forEach(function (l) {
      if (l.meta && l.meta.wbAdvance && l.meta.wbAdvance.wbId && l.meta.wbAdvance.pages && dd.workbooks && dd.workbooks[ch.id]) {
        var wbR = dd.workbooks[ch.id].find(function (w) { return w.id === l.meta.wbAdvance.wbId; });
        if (wbR) wbR.donePages = Math.max(0, (wbR.donePages || 0) - l.meta.wbAdvance.pages);
      }
      // 2026-05-19 追加: チャレンジ完了の巻き戻し
      if (l.meta && l.meta.wbChallengeUndo && l.meta.wbChallengeUndo.wbId && dd.workbooks && dd.workbooks[ch.id]) {
        var wbChR = dd.workbooks[ch.id].find(function (w) { return w.id === l.meta.wbChallengeUndo.wbId; });
        if (wbChR) {
          if (l.meta.wbChallengeUndo.wbAction === "unit") {
            wbChR.doneUnits = Math.max(0, (wbChR.doneUnits || 0) - 1);
          } else if (l.meta.wbChallengeUndo.wbAction === "test") {
            wbChR.testDone = false;
          }
        }
      }
      if (l.meta && l.meta.customTaskId && dd.tasks && dd.tasks[ch.id] && dd.tasks[ch.id][l.meta.customTaskId]) {
        dd.tasks[ch.id][l.meta.customTaskId].done = false;
        dd.tasks[ch.id][l.meta.customTaskId].doneDate = null;
      }
      // 2026-05-19 追加: 繰越タスクの完了印は元日付からも削除
      if (l.meta && l.meta.carryoverFromDate && l.meta.checkKey && dd.todayChecks && dd.todayChecks[ch.id] && dd.todayChecks[ch.id][l.meta.carryoverFromDate]) {
        delete dd.todayChecks[ch.id][l.meta.carryoverFromDate][l.meta.checkKey];
      }
    });
    // studyLogs クリア
    if (dd.studyLogs && dd.studyLogs[ch.id]) {
      dd.studyLogs[ch.id] = dd.studyLogs[ch.id].filter(function (l) { return l.date !== selectedDay; });
    }
    // todayChecks クリア
    if (dd.todayChecks && dd.todayChecks[ch.id]) {
      delete dd.todayChecks[ch.id][selectedDay];
    }
    // todayOverrides クリア（追加タスク・非表示の両方）
    if (dd.todayOverrides && dd.todayOverrides[ch.id]) {
      delete dd.todayOverrides[ch.id][selectedDay];
    }
    // points.history のその日分を削除＋balance再調整
    if (dd.points && dd.points[ch.id]) {
      var allHist = dd.points[ch.id].history || [];
      var balanceDelta = 0;
      var keep = [];
      allHist.forEach(function (h) {
        if (h.date === selectedDay) {
          if (h.type === "earn" || h.type === "bonus") balanceDelta -= h.amount || 0;
          else if (h.type === "spend" || h.type === "undo") balanceDelta += h.amount || 0;
        } else {
          keep.push(h);
        }
      });
      dd.points[ch.id].history = keep;
      dd.points[ch.id].balance = Math.max(0, (dd.points[ch.id].balance || 0) + balanceDelta);
    }
    save(dd);
    setSelectedDay(null);
  };
  // Parse selected day label
  var selectedDayLabel = "";
  if (selectedDay) {
    var sp = selectedDay.split("-");
    selectedDayLabel = parseInt(sp[1]) + "月" + parseInt(sp[2]) + "日";
  }
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>{ch.emoji} ふりかえり</h2>
      {/* Month Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 10 }}>
        <button onClick={function () { if (canGoBack) { setMonthOffset(monthOffset - 1); setSelectedDay(null); } }} disabled={!canGoBack} style={{ background: "none", border: "none", fontSize: 20, cursor: canGoBack ? "pointer" : "default", opacity: canGoBack ? 1 : .3 }}>◀</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#333", minWidth: 120, textAlign: "center" }}>{viewMonthLabel}</div>
        <button onClick={function () { if (canGoForward) { setMonthOffset(monthOffset + 1); setSelectedDay(null); } }} disabled={!canGoForward} style={{ background: "none", border: "none", fontSize: 20, cursor: canGoForward ? "pointer" : "default", opacity: canGoForward ? 1 : .3 }}>▶</button>
      </div>
      {/* Month Summary */}
      <div style={{ ...S.card, background: "linear-gradient(135deg," + ch.colorLight + ",white)" }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <MStat l="タスク完了" v={monthTaskCount + "個"} c="#4CAF50" />
          <MStat l="学習時間" v={Math.floor(monthSec / 3600) > 0 ? Math.floor(monthSec / 3600) + "時間" + Math.floor((monthSec % 3600) / 60) + "分" : Math.floor(monthSec / 60) + "分"} c="#2196F3" />
          <MStat l="活動日数" v={activeDays + "/" + daysInMonth + "日"} c="#FF9800" />
        </div>
      </div>
      {/* Subject breakdown */}
      {(function () {
        var subjMap = {};
        monthLogs.forEach(function (l) {
          var subj = l.subject || "その他";
          if (!subjMap[subj]) subjMap[subj] = 0;
          subjMap[subj] += l.seconds;
        });
        var subjArr = Object.keys(subjMap).map(function (s) { return { name: s, sec: subjMap[s] }; }).sort(function (a, b) { return b.sec - a.sec; });
        var maxSubjSec = subjArr.length > 0 ? subjArr[0].sec : 1;
        var colors = ["#2196F3", "#4CAF50", "#FF9800", "#E53935", "#9C27B0", "#00BCD4", "#795548", "#607D8B"];
        if (subjArr.length === 0) return null;
        return (
          <div style={S.card}>
            <div style={S.cardTitle}>📚 教科べつ学習時間</div>
            {subjArr.map(function (s, i) {
              var pct = Math.round((s.sec / maxSubjSec) * 100);
              var min = Math.floor(s.sec / 60);
              var hr = Math.floor(s.sec / 3600);
              var timeStr = hr > 0 ? hr + "時間" + Math.floor((s.sec % 3600) / 60) + "分" : min + "分";
              return (
                <div key={s.name} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: "#555" }}>{s.name}</span>
                    <span style={{ color: colors[i % colors.length], fontWeight: 700 }}>{timeStr}</span>
                  </div>
                  <div style={S.progBar}><div style={{ height: "100%", borderRadius: 3, background: colors[i % colors.length], width: pct + "%" }} /></div>
                </div>
              );
            })}
          </div>
        );
      })()}
      {/* Monthly Calendar */}
      <div style={S.card}>
        <div style={S.cardTitle}>📅 カレンダー（日付をタップで詳細）</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {["月", "火", "水", "木", "金", "土", "日"].map(function (dw) {
            return <div key={dw} style={{ textAlign: "center", fontSize: 10, color: dw === "土" ? "#2196F3" : dw === "日" ? "#E53935" : "#999", fontWeight: 600, paddingBottom: 4 }}>{dw}</div>;
          })}
          {monthDays.map(function (md, idx) {
            if (!md) return <div key={"pad" + idx} />;
            var isToday = md.date === TD;
            var isSel = md.date === selectedDay;
            var hasAct = md.count > 0 || md.sec > 0;
            return (
              <div key={md.date} onClick={function () { setSelectedDay(isSel ? null : md.date); setEditLogId(null); }} style={{ textAlign: "center", padding: 3, borderRadius: 6, background: isSel ? ch.color + "25" : isToday ? ch.color + "18" : hasAct ? "#E8F5E9" : "transparent", border: isSel ? "2px solid " + ch.color : isToday ? "2px solid " + ch.color + "60" : "2px solid transparent", minHeight: 36, cursor: "pointer" }}>
                <div style={{ fontSize: 11, fontWeight: isSel || isToday ? 800 : 400, color: isSel ? ch.color : isToday ? ch.color : "#555" }}>{md.day}</div>
                {hasAct && (
                  <div style={{ marginTop: 1 }}>
                    {md.count > 0 && <div style={{ fontSize: 7, color: "#4CAF50", fontWeight: 700 }}>{md.count}個</div>}
                    {md.sec > 0 && <div style={{ fontSize: 7, color: "#2196F3" }}>{Math.floor(md.sec / 60)}分</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Day Detail */}
      {dayDetail && (
        <div style={{ ...S.card, border: "2px solid " + ch.color + "30", animation: "fadeIn .2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={S.cardTitle}>📖 {selectedDayLabel}の学習内容</div>
            <button onClick={function () { setSelectedDay(null); }} style={{ ...S.smBtn, background: "#eee", color: "#666" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <MStat l="タスク" v={dayDetail.doneCount + "個"} c="#4CAF50" />
            <MStat l="学習時間" v={Math.floor(dayDetail.totalSec / 60) + "分"} c="#2196F3" />
          </div>
          {dayDetail.logs.length === 0 && <div style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: 10 }}>この日の記録はありません</div>}
          {dayDetail.logs.map(function (l) {
            var isEditing = editLogId === l.id;
            return (
              <div key={l.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                {isEditing ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 4 }}>{l.title}{l.subject ? "（" + l.subject + "）" : ""}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" value={editMin} onChange={function (e) { setEditMin(e.target.value); }} style={{ ...S.input, width: 50, textAlign: "center" }} />
                      <span style={{ fontSize: 11, color: "#999" }}>分</span>
                      <input type="number" value={editSec} onChange={function (e) { setEditSec(e.target.value); }} style={{ ...S.input, width: 50, textAlign: "center" }} />
                      <span style={{ fontSize: 11, color: "#999" }}>秒</span>
                      <button onClick={saveEditLog} style={{ ...S.smBtn, background: "#4CAF50", color: "#fff" }}>保存</button>
                      <button onClick={function () { setEditLogId(null); }} style={{ ...S.smBtn, background: "#eee", color: "#666" }}>×</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{l.title}</div>
                      {l.subject && <div style={{ fontSize: 10, color: "#999" }}>{l.subject}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ch.color }}>{Math.floor(l.seconds / 60)}分{l.seconds % 60 > 0 ? l.seconds % 60 + "秒" : ""}</span>
                      {isP && <button onClick={function () { startEditLog(l); }} style={{ background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "#bbb" }}>✏️</button>}
                      {isP && <button onClick={function () { deleteLog(l.id); }} style={{ background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "#ddd" }}>🗑</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {isP && (
            <button onClick={addManualLog} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 8, border: "2px dashed " + ch.color + "40", background: "transparent", fontSize: 12, fontWeight: 700, color: ch.color, cursor: "pointer" }}>
              ＋ 学習記録を手動で追加
            </button>
          )}
          {isP && (dayDetail.logs.length > 0 || dayDetail.doneCount > 0) && (
            <button onClick={resetDay} style={{ width: "100%", marginTop: 6, padding: 8, borderRadius: 8, border: "1.5px solid #E53935", background: "#fff", fontSize: 11, fontWeight: 700, color: "#E53935", cursor: "pointer" }}>
              ⚠️ この日の記録をすべてリセット
            </button>
          )}
          {isP && dayDetail.logs.length > 0 && (
            <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
              ※ 🗑で記録を削除すると、対応する<br />完了チェック・ポイントも自動で取り消されます
            </div>
          )}
        </div>
      )}
      {/* Weekly Bar Graph */}
      <div style={S.card}>
        <div style={S.cardTitle}>⏱️ 週ごとの学習時間</div>
        {weeklyData.map(function (w) {
          var pct = maxWeekSec > 0 ? Math.round((w.sec / maxWeekSec) * 100) : 0;
          return (
            <div key={w.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: "#666" }}>{w.label}</span>
                <span style={{ color: ch.color, fontWeight: 700 }}>{Math.floor(w.sec / 60)}分 / {w.count}個</span>
              </div>
              <div style={S.progBar}><div style={{ height: "100%", borderRadius: 3, background: ch.color, width: pct + "%" }} /></div>
            </div>
          );
        })}
      </div>
      {/* Workbook Progress */}
      <div style={S.card}>
        <div style={S.cardTitle}>📖 問題集の進捗</div>
        {wbs.map(function (wb) {
          if (wb.type === "challenge") {
            var total = wb.totalUnits + (wb.hasTest ? 1 : 0);
            var done = wb.doneUnits + (wb.testDone ? 1 : 0);
            var pct3 = Math.round((done / total) * 100);
            return (
              <div key={wb.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{wb.name}</span>
                  <span style={{ color: pct3 >= 100 ? "#4CAF50" : ch.color, fontWeight: 700 }}>{pct3 >= 100 ? "✅ 完了" : done + "/" + total}</span>
                </div>
                <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 5, background: pct3 >= 100 ? "#4CAF50" : ch.color, width: pct3 + "%" }} />
                </div>
              </div>
            );
          } else {
            var pct4 = wb.totalPages > 0 ? Math.round(((wb.donePages || 0) / wb.totalPages) * 100) : 0;
            return (
              <div key={wb.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{wb.name}</span>
                  <span style={{ color: ch.color, fontWeight: 700 }}>{wb.donePages || 0}/{wb.totalPages}p（{pct4}%）</span>
                </div>
                <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 5, background: pct4 >= 100 ? "#4CAF50" : ch.color, width: pct4 + "%" }} />
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
// ═══ REWARDS TAB (ごほうび) ═══
function RewardsTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  const [showAdd, setShowAdd] = useState(false);
  const [rN, setRN] = useState("");
  const [rC, setRC] = useState("10");
  const [rE, setRE] = useState("🎁");
  const [confirm, setConfirm] = useState(null);
  var pts = (data.points[ch.id] && data.points[ch.id].balance) || 0;
  var hist = (data.points[ch.id] && data.points[ch.id].history) || [];
  var rewards = data.rewards || DEF_REWARDS;
  var exchange = function (r) {
    if (pts < r.cost) return;
    var d = clone(data);
    ensurePts(d, ch.id);
    d.points[ch.id].balance -= r.cost;
    d.points[ch.id].history.push({ type: "spend", amount: r.cost, reason: r.name, date: TD, id: "sp" + Date.now() });
    save(d);
    setConfirm(null);
  };
  var addR = function () {
    if (!rN.trim()) return;
    var d = clone(data);
    var arr = d.rewards || [];
    arr.push({ id: "r" + Date.now(), name: rN.trim(), cost: parseInt(rC) || 10, emoji: rE || "🎁" });
    d.rewards = arr;
    save(d);
    setRN("");
    setRC("10");
    setRE("🎁");
    setShowAdd(false);
  };
  var delR = function (rid) {
    var d = clone(data);
    d.rewards = (d.rewards || []).filter(function (r) { return r.id !== rid; });
    save(d);
  };
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ ...S.card, textAlign: "center", padding: 24, background: "linear-gradient(135deg," + ch.colorLight + ",#fff)" }}>
        <div style={{ fontSize: 13, color: "#888" }}>{ch.name}のポイント</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: ch.color, margin: "6px 0" }}>⭐ {pts}</div>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={S.cardTitle}>🏪 ごほうびショップ</div>
          {isP && <button onClick={function () { setShowAdd(!showAdd); }} style={{ ...S.addBtn, background: ch.color, fontSize: 10 }}>{showAdd ? "✕" : "＋"}</button>}
        </div>
        {showAdd && (
          <div style={{ padding: 8, background: "#f9f9f9", borderRadius: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={rE} onChange={function (e) { setRE(e.target.value); }} style={{ ...S.input, width: 40, textAlign: "center" }} />
              <input value={rN} onChange={function (e) { setRN(e.target.value); }} placeholder="名前" style={{ ...S.input, flex: 1 }} />
              <input type="number" value={rC} onChange={function (e) { setRC(e.target.value); }} style={{ ...S.input, width: 50 }} />
            </div>
            <button onClick={addR} style={{ ...S.subBtn, background: ch.color, marginTop: 6, padding: 8, fontSize: 12 }}>追加</button>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {rewards.map(function (r) {
            var ok = pts >= r.cost;
            return (
              <div key={r.id} style={{ padding: 10, borderRadius: 14, textAlign: "center", position: "relative", background: ok ? "#fff" : "#f8f8f8", border: ok ? "2px solid " + ch.color + "25" : "2px solid #eee", opacity: ok ? 1 : .5 }}>
                {isP && <span onClick={function () { delR(r.id); }} style={{ position: "absolute", top: 2, right: 5, fontSize: 10, cursor: "pointer", color: "#ccc" }}>✕</span>}
                <div style={{ fontSize: 24 }}>{r.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{r.name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#FFB300", margin: "2px 0" }}>{r.cost}pt</div>
                {confirm === r.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={function () { exchange(r); }} style={{ ...S.smBtn, background: "#4CAF50", color: "#fff", flex: 1, fontSize: 9 }}>はい</button>
                    <button onClick={function () { setConfirm(null); }} style={{ ...S.smBtn, background: "#eee", color: "#666", flex: 1, fontSize: 9 }}>やめる</button>
                  </div>
                ) : (
                  <button onClick={function () { if (ok) setConfirm(r.id); }} style={{ padding: "3px 10px", borderRadius: 8, border: "none", fontSize: 10, fontWeight: 700, background: ok ? ch.color : "#ddd", color: ok ? "#fff" : "#999", cursor: ok ? "pointer" : "default" }}>{ok ? "交換" : "不足"}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {hist.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📜 履歴</div>
          {hist.slice().reverse().slice(0, 15).map(function (h) {
            return (
              <div key={h.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ color: "#666" }}>{h.reason}</span>
                <span style={{ fontWeight: 800, color: h.type === "earn" || h.type === "bonus" ? "#4CAF50" : "#E53935" }}>{h.type === "earn" || h.type === "bonus" ? "+" : "-"}{h.amount}pt</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ═══ TESTS TAB ═══
function TestsTab(p) {
  var ch = p.ch, data = p.data, save = p.save, isP = p.isP;
  var defCfg = DEF_TEST_CFG[ch.id] || { types: ["テスト"], subjects: [], hasRank: false };
  var tdata = (data.tests && data.tests[ch.id]) || {};
  var testTypes = tdata._types || defCfg.types;
  var testSubjects = tdata._subjects || defCfg.subjects;
  var hasRank = tdata._hasRank !== undefined ? tdata._hasRank : defCfg.hasRank;
  var records = tdata.records || [];
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState(testTypes[0]);
  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState(TD);
  const [addScores, setAddScores] = useState({});
  const [addRank, setAddRank] = useState("");
  const [addRankTotal, setAddRankTotal] = useState("");
  const [detail, setDetail] = useState(null);
  const [showSubjAdd, setShowSubjAdd] = useState(false);
  const [newSubj, setNewSubj] = useState("");
  const [showTypeAdd, setShowTypeAdd] = useState(false);
  const [newType, setNewType] = useState("");
  const [editId, setEditId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  // Ensure tests data structure exists
  function ensureTests(d) {
    if (!d.tests) d.tests = {};
    if (!d.tests[ch.id]) d.tests[ch.id] = { records: [], _subjects: testSubjects.slice(), _types: testTypes.slice(), _hasRank: hasRank };
    if (!d.tests[ch.id]._subjects) d.tests[ch.id]._subjects = testSubjects.slice();
    if (!d.tests[ch.id]._types) d.tests[ch.id]._types = testTypes.slice();
    if (d.tests[ch.id]._hasRank === undefined) d.tests[ch.id]._hasRank = hasRank;
    if (!d.tests[ch.id].records) d.tests[ch.id].records = [];
    return d;
  }
  var setScore = function (subj, val) {
    var s = Object.assign({}, addScores);
    s[subj] = val;
    setAddScores(s);
  };
  var resetForm = function () {
    setAddType(testTypes[0]);
    setAddName("");
    setAddDate(TD);
    setAddScores({});
    setAddRank("");
    setAddRankTotal("");
    setEditId(null);
  };
  var saveRecord = function () {
    var scores = {};
    var total = 0;
    var count = 0;
    testSubjects.forEach(function (subj) {
      var v = parseInt(addScores[subj]);
      if (!isNaN(v)) { scores[subj] = v; total += v; count++; }
    });
    if (count === 0) return;
    var rec = {
      id: editId || ("t" + Date.now()),
      type: addType,
      name: addName.trim() || addType,
      date: addDate || TD,
      scores: scores,
      total: total,
      avg: Math.round(total / count * 10) / 10,
    };
    if (hasRank && addRank) {
      rec.rank = parseInt(addRank) || null;
      rec.rankTotal = parseInt(addRankTotal) || null;
    }
    var d = ensureTests(clone(data));
    if (editId) {
      d.tests[ch.id].records = d.tests[ch.id].records.map(function (r) { return r.id === editId ? rec : r; });
    } else {
      d.tests[ch.id].records.push(rec);
    }
    save(d);
    resetForm();
    setShowAdd(false);
  };
  var delRecord = function (rid) {
    var d = ensureTests(clone(data));
    d.tests[ch.id].records = d.tests[ch.id].records.filter(function (r) { return r.id !== rid; });
    save(d);
    setDetail(null);
  };
  var startEdit = function (rec) {
    setEditId(rec.id);
    setAddType(rec.type);
    setAddName(rec.name === rec.type ? "" : rec.name);
    setAddDate(rec.date);
    setAddScores(Object.assign({}, rec.scores));
    setAddRank(rec.rank ? String(rec.rank) : "");
    setAddRankTotal(rec.rankTotal ? String(rec.rankTotal) : "");
    setShowAdd(true);
    setDetail(null);
  };
  // ─── Config management ───
  var addSubject = function () {
    if (!newSubj.trim()) return;
    var d = ensureTests(clone(data));
    if (d.tests[ch.id]._subjects.indexOf(newSubj.trim()) === -1) {
      d.tests[ch.id]._subjects.push(newSubj.trim());
    }
    save(d);
    setNewSubj("");
    setShowSubjAdd(false);
  };
  var delSubject = function (subj) {
    var d = ensureTests(clone(data));
    d.tests[ch.id]._subjects = d.tests[ch.id]._subjects.filter(function (s) { return s !== subj; });
    save(d);
  };
  var addTestType = function () {
    if (!newType.trim()) return;
    var d = ensureTests(clone(data));
    if (d.tests[ch.id]._types.indexOf(newType.trim()) === -1) {
      d.tests[ch.id]._types.push(newType.trim());
    }
    save(d);
    setNewType("");
    setShowTypeAdd(false);
  };
  var delTestType = function (t) {
    var d = ensureTests(clone(data));
    d.tests[ch.id]._types = d.tests[ch.id]._types.filter(function (x) { return x !== t; });
    save(d);
  };
  var toggleRank = function () {
    var d = ensureTests(clone(data));
    d.tests[ch.id]._hasRank = !hasRank;
    save(d);
  };
  // Sort records newest first
  var sorted = records.slice().sort(function (a, b) { return b.date > a.date ? 1 : b.date < a.date ? -1 : 0; });
  // Group by type for chart
  var byType = {};
  testTypes.forEach(function (t) { byType[t] = sorted.filter(function (r) { return r.type === t; }).reverse(); });
  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.cardTitle}>📝 テストの成績</div>
          <div style={{ display: "flex", gap: 6 }}>
            {isP && <button onClick={function () { setShowSettings(!showSettings); }} style={{ ...S.smBtn, background: showSettings ? ch.color : "#f0f0f0", color: showSettings ? "#fff" : "#666" }}>⚙️ 設定</button>}
            {isP && <button onClick={function () { resetForm(); setShowAdd(true); }} style={{ ...S.addBtn, background: ch.color }}>＋ 記録</button>}
          </div>
        </div>
      </div>
      {/* Settings panel */}
      {isP && showSettings && (
        <div style={{ ...S.card, border: "2px solid " + ch.color + "30" }}>
          <div style={S.cardTitle}>⚙️ テスト設定（{ch.name}）</div>
          {/* Test types */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>テストの種類</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              {testTypes.map(function (t) {
                return (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 10px", borderRadius: 8, background: "#f0f0f0", fontSize: 12, fontWeight: 700, color: "#555" }}>
                    {t}
                    {testTypes.length > 1 && <span onClick={function () { delTestType(t); }} style={{ cursor: "pointer", opacity: 0.4, fontSize: 10, marginLeft: 3 }}>✕</span>}
                  </span>
                );
              })}
              {!showTypeAdd && <button onClick={function () { setShowTypeAdd(true); }} style={{ background: "none", border: "1px dashed " + ch.color, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: ch.color, cursor: "pointer", fontFamily: "inherit" }}>＋追加</button>}
            </div>
            {showTypeAdd && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input value={newType} onChange={function (e) { setNewType(e.target.value); }} placeholder="例：北辰テスト" style={{ ...S.input, flex: 1 }} />
                <button onClick={addTestType} style={{ ...S.smBtn, background: ch.color, color: "#fff" }}>追加</button>
                <button onClick={function () { setShowTypeAdd(false); setNewType(""); }} style={{ ...S.smBtn, background: "#eee", color: "#666" }}>×</button>
              </div>
            )}
          </div>
          {/* Subjects */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>教科</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              {testSubjects.map(function (subj) {
                return (
                  <span key={subj} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 10px", borderRadius: 8, background: ch.colorLight, fontSize: 12, fontWeight: 700, color: ch.color }}>
                    {subj}
                    <span onClick={function () { delSubject(subj); }} style={{ cursor: "pointer", opacity: 0.4, fontSize: 10, marginLeft: 3 }}>✕</span>
                  </span>
                );
              })}
              {!showSubjAdd && <button onClick={function () { setShowSubjAdd(true); }} style={{ background: "none", border: "1px dashed " + ch.color, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: ch.color, cursor: "pointer", fontFamily: "inherit" }}>＋追加</button>}
            </div>
            {showSubjAdd && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input value={newSubj} onChange={function (e) { setNewSubj(e.target.value); }} placeholder="教科名" style={{ ...S.input, flex: 1 }} />
                <button onClick={addSubject} style={{ ...S.smBtn, background: ch.color, color: "#fff" }}>追加</button>
                <button onClick={function () { setShowSubjAdd(false); setNewSubj(""); }} style={{ ...S.smBtn, background: "#eee", color: "#666" }}>×</button>
              </div>
            )}
          </div>
          {/* Rank toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>順位を記録する</div>
            <button onClick={toggleRank} style={{ ...S.smBtn, background: hasRank ? ch.color : "#e0e0e0", color: hasRank ? "#fff" : "#999", minWidth: 60 }}>{hasRank ? "ON" : "OFF"}</button>
          </div>
        </div>
      )}
      {/* Add/Edit form */}
      {showAdd && (
        <div style={{ ...S.card, border: "2px solid " + ch.color + "30" }}>
          <div style={S.cardTitle}>{editId ? "✏️ 記録を編集" : "📝 テスト結果を入力"}</div>
          {testTypes.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {testTypes.map(function (t) {
                return <button key={t} onClick={function () { setAddType(t); }} style={{ ...S.smBtn, background: addType === t ? ch.color : "#f0f0f0", color: addType === t ? "#fff" : "#666", flex: 1 }}>{t}</button>;
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>テスト名</div>
              <input value={addName} onChange={function (e) { setAddName(e.target.value); }} placeholder={addType} style={S.input} />
            </div>
            <div style={{ flex: 0, minWidth: 120 }}>
              <div style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>日付</div>
              <input type="date" value={addDate} onChange={function (e) { setAddDate(e.target.value); }} style={S.input} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>点数</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6, marginBottom: 10 }}>
            {testSubjects.map(function (subj) {
              return (
                <div key={subj}>
                  <div style={{ fontSize: 10, color: "#999", marginBottom: 2, textAlign: "center" }}>{subj}</div>
                  <input type="number" value={addScores[subj] || ""} onChange={function (e) { setScore(subj, e.target.value); }} placeholder="--" style={{ ...S.input, textAlign: "center", padding: "8px 4px" }} />
                </div>
              );
            })}
          </div>
          {hasRank && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#666", whiteSpace: "nowrap" }}>順位</div>
              <input type="number" value={addRank} onChange={function (e) { setAddRank(e.target.value); }} placeholder="順位" style={{ ...S.input, width: 60, textAlign: "center" }} />
              <span style={{ fontSize: 12, color: "#999" }}>/</span>
              <input type="number" value={addRankTotal} onChange={function (e) { setAddRankTotal(e.target.value); }} placeholder="人数" style={{ ...S.input, width: 60, textAlign: "center" }} />
              <span style={{ fontSize: 11, color: "#999" }}>人中</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveRecord} style={{ ...S.subBtn, background: ch.color }}>{editId ? "更新" : "保存"}</button>
            <button onClick={function () { setShowAdd(false); resetForm(); }} style={{ ...S.subBtn, background: "#eee", color: "#666" }}>キャンセル</button>
          </div>
        </div>
      )}
      {/* Score trend per type */}
      {testTypes.map(function (type) {
        var typeRecs = byType[type] || [];
        if (typeRecs.length === 0) return null;
        return (
          <div key={type} style={S.card}>
            <div style={S.cardTitle}>📈 {type}の推移</div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 0, minWidth: typeRecs.length * 70 }}>
                {typeRecs.map(function (rec) {
                  var maxScore = testSubjects.length * 100;
                  var barH = maxScore > 0 ? Math.round((rec.total / maxScore) * 100) : 0;
                  return (
                    <div key={rec.id} onClick={function () { setDetail(detail === rec.id ? null : rec.id); }} style={{ flex: 1, minWidth: 60, textAlign: "center", cursor: "pointer", padding: "0 2px" }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: ch.color }}>{rec.total}</div>
                      <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        <div style={{ width: 28, height: Math.max(4, barH * 0.6), background: "linear-gradient(180deg," + ch.color + "," + ch.color + "88)", borderRadius: "4px 4px 0 0" }} />
                      </div>
                      <div style={{ fontSize: 8, color: "#999", marginTop: 3 }}>{rec.name}</div>
                      <div style={{ fontSize: 8, color: "#bbb" }}>{dl(rec.date)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      {/* Record list */}
      {sorted.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>📋 テスト一覧</div>
          {sorted.map(function (rec) {
            var isOpen = detail === rec.id;
            return (
              <div key={rec.id} style={{ borderBottom: "1px solid #f5f5f5", padding: "10px 0" }}>
                <div onClick={function () { setDetail(isOpen ? null : rec.id); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#333" }}>{rec.name}</span>
                    {testTypes.length > 1 && <span style={{ fontSize: 10, color: "#999", marginLeft: 6 }}>{rec.type}</span>}
                    <div style={{ fontSize: 10, color: "#bbb" }}>{dl(rec.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: ch.color }}>{rec.total}<span style={{ fontSize: 10, color: "#999" }}>点</span></div>
                    {rec.rank && <div style={{ fontSize: 10, color: "#888" }}>{rec.rank}{rec.rankTotal ? "/" + rec.rankTotal : ""}位</div>}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 8, animation: "fadeIn .2s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 4, marginBottom: 8 }}>
                      {testSubjects.map(function (subj) {
                        var sc = rec.scores[subj];
                        if (sc === undefined || sc === null) return null;
                        var color = sc >= 80 ? "#4CAF50" : sc >= 60 ? "#FF9800" : "#E53935";
                        return (
                          <div key={subj} style={{ textAlign: "center", padding: 6, borderRadius: 8, background: "#f9f9f9" }}>
                            <div style={{ fontSize: 9, color: "#999" }}>{subj}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: color }}>{sc}</div>
                          </div>
                        );
                      })}
                    </div>
                    {isP && (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={function () { startEdit(rec); }} style={{ ...S.smBtn, background: "#f0f0f0", color: "#666" }}>✏️ 編集</button>
                        <button onClick={function () { delRecord(rec.id); }} style={{ ...S.smBtn, background: "#fdeaea", color: "#E53935" }}>🗑 削除</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {sorted.length === 0 && !showAdd && (
        <div style={{ ...S.card, textAlign: "center", padding: 30, color: "#ccc" }}>
          <div style={{ fontSize: 36 }}>📝</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>まだテストの記録がありません</div>
        </div>
      )}
    </div>
  );
}
// ═══ SHARED ═══
function MStat(p) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: p.c }}>{p.v}</div>
      <div style={{ fontSize: 9, color: "#999", marginTop: 1 }}>{p.l}</div>
    </div>
  );
}
// ═══ CSS ═══
var cssText = "@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Zen Maru Gothic',sans-serif}input,select,textarea,button{font-family:inherit}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}";
// ═══ STYLES ═══
var S = {
  app: { fontFamily: "'Zen Maru Gothic',sans-serif", background: "#F7F6F3", minHeight: "100vh", maxWidth: 480, margin: "0 auto", paddingBottom: 80 },
  modeBar: { display: "flex", gap: 4, padding: "8px 12px" },
  modeBtn: { flex: 1, padding: 8, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  header: { padding: "16px 14px 14px", color: "#fff", borderRadius: "0 0 20px 20px" },
  badge: { background: "rgba(255,255,255,.2)", borderRadius: 12, padding: "4px 10px", fontSize: 13, fontWeight: 800 },
  childBar: { display: "flex", gap: 6, padding: "10px 12px 4px", overflowX: "auto" },
  childTab: { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 16, border: "2px solid", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
  card: { background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  cardTitle: { fontSize: 14, fontWeight: 800, color: "#333", marginBottom: 10 },
  check: { width: 24, height: 24, borderRadius: 12, border: "2px solid", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#fff" },
  addBtn: { padding: "6px 14px", borderRadius: 16, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  subBtn: { width: "100%", padding: 10, borderRadius: 10, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  smBtn: { padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  delBtn: { background: "none", border: "none", fontSize: 14, cursor: "pointer", opacity: .3, padding: 4 },
  input: { width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e0e0e0", fontSize: 13, outline: "none", background: "#FAFAFA", fontFamily: "inherit" },
  linkBtn: { background: "none", border: "none", color: "#2D7DD2", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 0" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-around", background: "#fff", borderTop: "1px solid #eee", padding: "6px 0 10px", zIndex: 100 },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "3px 8px", position: "relative" },
  progBar: { height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
};
