import { useState, useEffect, useCallback } from "react";

// ── Preset date range helpers ─────────────────────────────────────────────────
const fmt = (d) => d.toISOString().split("T")[0];

const PRESETS = [
  { key: "LAST_7_DAYS",      label: "Last 7 Days" },
  { key: "MONTH_TO_DATE",    label: "Month to Date" },
  { key: "LAST_MONTH",       label: "Last Month" },
  { key: "QUARTER_TO_DATE",  label: "Quarter to Date" },
];

function resolvePreset(key) {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  switch (key) {
    case "LAST_7_DAYS": {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: fmt(s), end: fmt(today) };
    }
    case "MONTH_TO_DATE":
      return { start: fmt(new Date(y, m, 1)), end: fmt(today) };
    case "LAST_MONTH":
      return { start: fmt(new Date(y, m - 1, 1)), end: fmt(new Date(y, m, 0)) };
    case "QUARTER_TO_DATE": {
      const qStart = new Date(y, Math.floor(m / 3) * 3, 1);
      return { start: fmt(qStart), end: fmt(today) };
    }
    default: return { start: fmt(today), end: fmt(today) };
  }
}

function fmtDisplay(iso) {
  if (!iso) return "";
  const [y, mo, d] = iso.split("-");
  return new Date(+y, +mo - 1, +d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MOCK_CONFIGS = [
  { id: 1, testId: 1, testName: "HIV Rapid Test", matchMode: "SPECIFIC_CODES", positiveResultCodes: ["Positive"], active: true, lastModified: "2026-02-10" },
  { id: 2, testId: 2, testName: "Malaria RDT", matchMode: "SPECIFIC_CODES", positiveResultCodes: ["Positive"], active: true, lastModified: "2026-02-10" },
  { id: 3, testId: 3, testName: "Syphilis RPR", matchMode: "SPECIFIC_CODES", positiveResultCodes: ["Reactive", "Weakly Reactive"], active: true, lastModified: "2026-03-01" },
  { id: 4, testId: 4, testName: "HBsAg", matchMode: "ALL_ABNORMAL", positiveResultCodes: [], active: false, lastModified: "2026-01-15" },
];
const MOCK_TESTS = [
  { id: 1, name: "HIV Rapid Test" }, { id: 2, name: "Malaria RDT" },
  { id: 3, name: "Syphilis RPR" }, { id: 4, name: "HBsAg" }, { id: 5, name: "COVID-19 Antigen" },
];
const MOCK_RESULT_CODES = { 1: ["Positive","Negative","Invalid","Indeterminate"], 2: ["Positive","Negative","Invalid"], 3: ["Reactive","Weakly Reactive","Non-Reactive"], 4: ["Positive","Negative"] };
const MOCK_REPORT_DATA = [
  { testId:1, testName:"HIV Rapid Test", totalTested:1240, totalPositive:87, positivityRate:7.02, normalResultCode:"Negative", nonNormalRate:8.47, resultBreakdown:[{resultCode:"Positive",count:87,rate:7.02,isPositive:true,isNormal:false},{resultCode:"Negative",count:1140,rate:91.94,isPositive:false,isNormal:true},{resultCode:"Invalid",count:10,rate:0.81,isPositive:false,isNormal:false},{resultCode:"Indeterminate",count:3,rate:0.24,isPositive:false,isNormal:false}] },
  { testId:2, testName:"Malaria RDT", totalTested:843, totalPositive:312, positivityRate:37.01, normalResultCode:"Negative", nonNormalRate:38.55, resultBreakdown:[{resultCode:"Positive",count:312,rate:37.01,isPositive:true,isNormal:false},{resultCode:"Negative",count:518,rate:61.45,isPositive:false,isNormal:true},{resultCode:"Invalid",count:13,rate:1.54,isPositive:false,isNormal:false}] },
  { testId:3, testName:"Syphilis RPR", totalTested:567, totalPositive:34, positivityRate:5.99, normalResultCode:"Non-Reactive", nonNormalRate:8.64, resultBreakdown:[{resultCode:"Reactive",count:34,rate:5.99,isPositive:true,isNormal:false},{resultCode:"Weakly Reactive",count:15,rate:2.65,isPositive:true,isNormal:false},{resultCode:"Non-Reactive",count:518,rate:91.36,isPositive:false,isNormal:true}] },
];

const Tag = ({ kind="gray", children }) => {
  const c = { green:"bg-green-100 text-green-800 border-green-300", red:"bg-red-100 text-red-800 border-red-300", blue:"bg-blue-100 text-blue-800 border-blue-300", purple:"bg-purple-100 text-purple-800 border-purple-300", gray:"bg-gray-100 text-gray-600 border-gray-300", "warm-gray":"bg-orange-50 text-orange-700 border-orange-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${c[kind]||c.gray}`}>{children}</span>;
};

const Btn = ({ kind="primary", size="md", onClick, disabled, children }) => {
  const s = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm" };
  const k = { primary:"bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed", ghost:"text-blue-600 hover:bg-blue-50 disabled:opacity-40", danger:"bg-red-600 text-white hover:bg-red-700", secondary:"bg-gray-200 text-gray-700 hover:bg-gray-300" };
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${s[size]} ${k[kind]||k.primary}`}>{children}</button>;
};

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
  </div>
);

const Notif = ({ kind="info", msg, onClose }) => {
  const c = { info:"bg-blue-50 border-blue-400 text-blue-800", success:"bg-green-50 border-green-500 text-green-800", error:"bg-red-50 border-red-500 text-red-800", warning:"bg-yellow-50 border-yellow-400 text-yellow-800" };
  return (
    <div className={`flex items-start justify-between gap-3 px-4 py-3 border-l-4 rounded text-sm ${c[kind]}`}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} className="text-lg leading-none opacity-50 hover:opacity-100 ml-2">×</button>}
    </div>
  );
};

// ── Config Admin ─────────────────────────────────────────────────────────────
function ConfigAdmin() {
  const [configs, setConfigs] = useState(MOCK_CONFIGS);
  const [expanded, setExpanded] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ testId:"", matchMode:"SPECIFIC_CODES", positiveResultCodes:[] });
  const [notif, setNotif] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);

  const notify = (kind, msg) => { setNotif({kind,msg}); setTimeout(()=>setNotif(null),3000); };
  const codes = (id) => MOCK_RESULT_CODES[Number(id)]||[];
  const toggleCode = (form, setForm, code) => setForm(f=>({...f, positiveResultCodes: f.positiveResultCodes.includes(code)?f.positiveResultCodes.filter(c=>c!==code):[...f.positiveResultCodes,code]}));
  const unconfigured = MOCK_TESTS.filter(t=>!configs.find(c=>c.testId===t.id&&c.active));

  return (
    <div className="p-6 space-y-4 min-h-screen bg-gray-50">
      <p className="text-xs text-gray-400">Admin / Test Management / <span className="text-gray-700 font-medium">Positivity Configuration</span></p>
      <h2 className="text-xl font-semibold text-gray-900">Positivity Configuration</h2>
      {notif && <Notif kind={notif.kind} msg={notif.msg} onClose={()=>setNotif(null)}/>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <input placeholder="Search configurations…" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <Btn kind="primary" size="sm" onClick={()=>setAdding(true)} disabled={adding}>+ Add Configuration</Btn>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {["","Test","Match Mode","Positive Codes","Status","Modified",""].map((h,i)=><th key={i} className="text-left px-4 py-2.5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b bg-blue-50/50">
                <td colSpan={7} className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">New Configuration</p>
                  <div className="grid grid-cols-3 gap-4 max-w-3xl mb-3">
                    <Field label="Test">
                      <select value={newForm.testId} onChange={e=>setNewForm(f=>({...f,testId:e.target.value,positiveResultCodes:[]}))} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Select a test</option>
                        {unconfigured.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Match Mode">
                      <select value={newForm.matchMode} onChange={e=>setNewForm(f=>({...f,matchMode:e.target.value,positiveResultCodes:[]}))} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="SPECIFIC_CODES">Specific Result Codes</option>
                        <option value="ALL_ABNORMAL">All Non-Normal Results</option>
                      </select>
                    </Field>
                    {newForm.matchMode==="SPECIFIC_CODES"&&newForm.testId&&(
                      <Field label="Positive Codes">
                        <div className="flex flex-wrap gap-2 border border-gray-300 rounded p-2 bg-white">
                          {codes(newForm.testId).map(c=>(
                            <label key={c} className="flex items-center gap-1 text-sm cursor-pointer">
                              <input type="checkbox" checked={newForm.positiveResultCodes.includes(c)} onChange={()=>toggleCode(newForm,setNewForm,c)} className="rounded"/>
                              {c}
                            </label>
                          ))}
                        </div>
                      </Field>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Btn kind="primary" size="sm" onClick={()=>{
                      const t=MOCK_TESTS.find(t=>t.id===Number(newForm.testId)); if(!t)return;
                      setConfigs(p=>[...p,{id:Date.now(),testId:t.id,testName:t.name,...newForm,active:true,lastModified:"2026-03-19"}]);
                      setAdding(false); setNewForm({testId:"",matchMode:"SPECIFIC_CODES",positiveResultCodes:[]}); notify("success","Configuration saved.");
                    }}>Save</Btn>
                    <Btn kind="ghost" size="sm" onClick={()=>setAdding(false)}>Cancel</Btn>
                  </div>
                </td>
              </tr>
            )}
            {configs.map(cfg=>(
              <React.Fragment key={cfg.id}>
                <tr className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <button onClick={()=>{setExpanded(expanded===cfg.id?null:cfg.id); setEditForm({matchMode:cfg.matchMode,positiveResultCodes:[...cfg.positiveResultCodes]});}} className="text-gray-400 hover:text-blue-600 w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-xs">
                      {expanded===cfg.id?"▲":"▼"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{cfg.testName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{cfg.matchMode==="SPECIFIC_CODES"?"Specific Codes":"All Non-Normal"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{cfg.matchMode==="SPECIFIC_CODES"?cfg.positiveResultCodes.join(", "):"—"}</td>
                  <td className="px-4 py-2.5"><Tag kind={cfg.active?"green":"gray"}>{cfg.active?"Active":"Inactive"}</Tag></td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{cfg.lastModified}</td>
                  <td className="px-4 py-2.5">{cfg.active&&<button onClick={()=>setDeactivateId(cfg.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">Deactivate</button>}</td>
                </tr>
                {expanded===cfg.id&&(
                  <tr className="border-b bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Edit — {cfg.testName}</p>
                      <div className="grid grid-cols-2 gap-4 max-w-xl mb-3">
                        <Field label="Match Mode">
                          <select value={editForm.matchMode} onChange={e=>setEditForm(f=>({...f,matchMode:e.target.value,positiveResultCodes:[]}))} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                            <option value="SPECIFIC_CODES">Specific Result Codes</option>
                            <option value="ALL_ABNORMAL">All Non-Normal Results</option>
                          </select>
                        </Field>
                        {editForm.matchMode==="SPECIFIC_CODES"&&(
                          <Field label="Positive Codes">
                            <div className="flex flex-wrap gap-2 border border-gray-300 rounded p-2 bg-white">
                              {codes(cfg.testId).map(c=>(
                                <label key={c} className="flex items-center gap-1 text-sm cursor-pointer">
                                  <input type="checkbox" checked={editForm.positiveResultCodes.includes(c)} onChange={()=>toggleCode(editForm,setEditForm,c)} className="rounded"/>
                                  {c}
                                </label>
                              ))}
                            </div>
                          </Field>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Btn kind="primary" size="sm" onClick={()=>{ setConfigs(p=>p.map(c=>c.id===cfg.id?{...c,...editForm,lastModified:"2026-03-19"}:c)); setExpanded(null); notify("success","Configuration saved."); }}>Save</Btn>
                        <Btn kind="ghost" size="sm" onClick={()=>setExpanded(null)}>Cancel</Btn>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {deactivateId&&(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Deactivate Configuration</h3>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to deactivate this positivity configuration?</p>
            <div className="flex justify-end gap-2">
              <Btn kind="secondary" size="sm" onClick={()=>setDeactivateId(null)}>Cancel</Btn>
              <Btn kind="danger" size="sm" onClick={()=>{ setConfigs(p=>p.map(c=>c.id===deactivateId?{...c,active:false}:c)); setDeactivateId(null); notify("success","Configuration deactivated."); }}>Deactivate</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report ────────────────────────────────────────────────────────────────────
const ALL_TESTS = MOCK_TESTS; // all tests available, no pre-configuration required

function TestPositivityConfig({ test, config, onChange }) {
  const codes = MOCK_RESULT_CODES[test.id] || [];
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{test.name}</p>
      </div>
      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="radio" name={`mode-${test.id}`} value="SPECIFIC_CODES"
            checked={config.matchMode==="SPECIFIC_CODES"}
            onChange={()=>onChange({...config,matchMode:"SPECIFIC_CODES",positiveResultCodes:[]})}
            className="accent-blue-600"/>
          Specific Codes
        </label>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="radio" name={`mode-${test.id}`} value="ALL_ABNORMAL"
            checked={config.matchMode==="ALL_ABNORMAL"}
            onChange={()=>onChange({...config,matchMode:"ALL_ABNORMAL",positiveResultCodes:[]})}
            className="accent-blue-600"/>
          All Non-Normal
        </label>
      </div>
      {config.matchMode==="SPECIFIC_CODES" && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {codes.map(c=>(
            <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" className="rounded accent-blue-600"
                checked={config.positiveResultCodes.includes(c)}
                onChange={()=>{
                  const next = config.positiveResultCodes.includes(c)
                    ? config.positiveResultCodes.filter(x=>x!==c)
                    : [...config.positiveResultCodes,c];
                  onChange({...config,positiveResultCodes:next});
                }}/>
              {c}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Report() {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [testConfigs, setTestConfigs] = useState({}); // testId -> {matchMode, positiveResultCodes}
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [exp, setExp] = useState(null);
  const [notif, setNotif] = useState(null);

  const filteredTests = ALL_TESTS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTests.find(s=>s.id===t.id)
  );

  const addTest = (test) => {
    setSelectedTests(p=>[...p,test]);
    setTestConfigs(p=>({...p,[test.id]:{matchMode:"SPECIFIC_CODES",positiveResultCodes:[]}}));
    setSearch(""); setSearchOpen(false);
  };

  const removeTest = (id) => {
    setSelectedTests(p=>p.filter(t=>t.id!==id));
    setTestConfigs(p=>{const n={...p}; delete n[id]; return n;});
  };

  const validate=()=>{
    const e={};
    if(!start)e.start="Start date is required.";
    if(!end)e.end="End date is required.";
    if(start&&end&&end<start)e.end="End date must be after start date.";
    if(!selectedTests.length)e.tests="At least one test must be selected.";
    const missingCodes = selectedTests.filter(t=>testConfigs[t.id]?.matchMode==="SPECIFIC_CODES"&&!testConfigs[t.id]?.positiveResultCodes?.length);
    if(missingCodes.length)e.codes=`Select at least one positive code for: ${missingCodes.map(t=>t.name).join(", ")}`;
    return e;
  };

  const generate=()=>{
    const e=validate(); if(Object.keys(e).length){setErrors(e);return;}
    setErrors({}); setLoading(true); setData(null); setExp(null);
    setTimeout(()=>{ setData(MOCK_REPORT_DATA.filter(r=>selectedTests.find(t=>t.id===r.testId))); setLoading(false); },1000);
  };

  const rateStyle=r=>r==null?"text-gray-400":r>=25?"text-red-700 font-bold":r>=10?"text-orange-600 font-semibold":"text-green-700 font-semibold";

  return (
    <div className="p-6 space-y-5 min-h-screen bg-gray-50">
      <p className="text-xs text-gray-400">Reports / <span className="text-gray-700 font-medium">Positivity Rate Report</span></p>
      <h2 className="text-xl font-semibold text-gray-900">Positivity Rate Report</h2>
      {notif&&<Notif kind={notif.kind} msg={notif.msg} onClose={()=>setNotif(null)}/>}

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
        <p className="text-sm font-semibold text-gray-700">Report Filters</p>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <Field label="Start Date" error={errors.start}>
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.start?"border-red-400":"border-gray-300"}`}/>
          </Field>
          <Field label="End Date" error={errors.end}>
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className={`border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.end?"border-red-400":"border-gray-300"}`}/>
          </Field>
        </div>

        {/* Test typeahead */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tests</label>
          <div className="relative max-w-sm">
            <input
              value={search}
              onChange={e=>{setSearch(e.target.value);setSearchOpen(true);}}
              onFocus={()=>setSearchOpen(true)}
              placeholder="Search and add tests…"
              className={`border rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.tests?"border-red-400":"border-gray-300"}`}
            />
            {searchOpen && filteredTests.length>0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredTests.map(t=>(
                  <button key={t.id} onClick={()=>addTest(t)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.tests && <p className="text-xs text-red-600 mt-1">{errors.tests}</p>}
        </div>

        {/* Per-test positivity configuration */}
        {selectedTests.length>0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Positivity Definition per Test</p>
            {errors.codes && <p className="text-xs text-red-600">{errors.codes}</p>}
            <div className="grid grid-cols-2 gap-3">
              {selectedTests.map(test=>(
                <div key={test.id} className="relative">
                  <button onClick={()=>removeTest(test.id)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-base leading-none z-10">×</button>
                  <TestPositivityConfig
                    test={test}
                    config={testConfigs[test.id]||{matchMode:"SPECIFIC_CODES",positiveResultCodes:[]}}
                    onChange={cfg=>setTestConfigs(p=>({...p,[test.id]:cfg}))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <Btn kind="primary" onClick={generate} disabled={loading}>{loading?"Generating…":"Generate Report"}</Btn>
          <Btn kind="ghost" onClick={()=>{setStart("");setEnd("");setSelectedTests([]);setTestConfigs({});setData(null);setErrors({});setExp(null);setSearch("");}}>Reset</Btn>
        </div>
      </div>

      {loading&&<div className="flex items-center gap-2 text-sm text-blue-600"><span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"/><span>Generating report…</span></div>}

      {!loading&&data&&(
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Report Results</p>
            <Btn kind="ghost" size="sm" onClick={()=>setNotif({kind:"success",msg:"CSV export downloaded."})}>↓ Export CSV</Btn>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {["","Test Name","Total Tested","Total Positive","Positivity Rate","Non-Normal Rate"].map((h,i)=><th key={i} className="text-left px-4 py-2.5">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(row=>(
                <React.Fragment key={row.testId}>
                  <tr className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5">
                      <button onClick={()=>setExp(exp===row.testId?null:row.testId)} className="text-gray-400 hover:text-blue-600 w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-xs">
                        {exp===row.testId?"▲":"▼"}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{row.testName}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.totalTested.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.totalPositive.toLocaleString()}</td>
                    <td className={`px-4 py-2.5 ${rateStyle(row.positivityRate)}`}>{row.positivityRate?.toFixed(2)}%</td>
                    <td className={`px-4 py-2.5 ${rateStyle(row.nonNormalRate)}`}>{row.nonNormalRate?.toFixed(2)}%</td>
                  </tr>
                  {exp===row.testId&&(
                    <tr className="border-b bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Result Breakdown — {row.testName}</p>
                        <table className="w-full max-w-2xl text-sm border border-gray-200 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {["Result Code","Count","Rate (%)","Type"].map(h=><th key={h} className="text-left px-3 py-2 border-b">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {row.resultBreakdown.map(bd=>(
                              <tr key={bd.resultCode} className={`border-b ${bd.isNormal?"bg-blue-50/60":"bg-white"}`}>
                                <td className="px-3 py-2">{bd.resultCode}</td>
                                <td className="px-3 py-2">{bd.count.toLocaleString()}</td>
                                <td className="px-3 py-2">{bd.rate.toFixed(2)}%</td>
                                <td className="px-3 py-2"><Tag kind={bd.isNormal?"blue":bd.isPositive?"green":"warm-gray"}>{bd.isNormal?"Normal":bd.isPositive?"Positive":"Other"}</Tag></td>
                              </tr>
                            ))}
                            <tr className="bg-purple-50/70 font-semibold">
                              <td className="px-3 py-2.5 text-purple-900">Non-Normal Total</td>
                              <td className="px-3 py-2.5 text-purple-900">{row.resultBreakdown.filter(b=>!b.isNormal).reduce((s,b)=>s+b.count,0).toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-purple-900">{row.nonNormalRate?.toFixed(2)}%</td>
                              <td className="px-3 py-2.5"><Tag kind="purple">Non-Normal Rate</Tag></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Widget Tile ───────────────────────────────────────────────────────────────
const SESSION_KEY = (id) => `positivity_widget_preset_${id}`;

function PositivityRateTile({ config }) {
  const { testName, testId, defaultPreset = "MONTH_TO_DATE" } = config;

  const savedPreset = typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem(SESSION_KEY(testId)) || defaultPreset
    : defaultPreset;

  const [preset, setPreset] = useState(savedPreset);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { start, end } = resolvePreset(preset);

  const fetchData = useCallback((p) => {
    setLoading(true); setData(null); setError(false);
    setTimeout(() => {
      const result = MOCK_REPORT_DATA.find(r => r.testId === testId);
      setData(result || { totalTested: 0, totalPositive: 0, positivityRate: null });
      setLoading(false);
    }, 700);
  }, [testId]);

  // Auto-fetch on mount and whenever preset changes
  useEffect(() => { fetchData(preset); }, [preset, fetchData]);

  const handlePreset = (p) => {
    setPreset(p);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY(testId), p);
  };

  const tagKind = data && data.positivityRate !== null
    ? data.positivityRate >= 25 ? "red" : data.positivityRate >= 10 ? "warm-gray" : "green"
    : "gray";
  const tagLabel = data && data.positivityRate !== null
    ? data.positivityRate >= 25 ? "High" : data.positivityRate >= 10 ? "Moderate" : "Low"
    : null;
  const rateColor = data && data.positivityRate !== null
    ? data.positivityRate >= 25 ? "text-red-700" : data.positivityRate >= 10 ? "text-orange-600" : "text-green-700"
    : "text-gray-300";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-72 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Positivity Rate</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{testName}</p>
        </div>
        {tagLabel && <Tag kind={tagKind}>{tagLabel}</Tag>}
      </div>

      {/* Preset selector */}
      <div className="px-4 pb-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {PRESETS.map((p, i) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`flex-1 py-1.5 font-medium transition-colors focus:outline-none
                ${i > 0 ? "border-l border-gray-200" : ""}
                ${preset === p.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          {fmtDisplay(start)} – {fmtDisplay(end)}
        </p>
      </div>

      {/* Metrics area */}
      <div className="px-4 pb-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-blue-600">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"/>
            Loading…
          </div>
        )}
        {error && <p className="text-xs text-red-600 py-2 text-center">Failed to load data.</p>}
        {!loading && !error && data && data.totalTested === 0 && (
          <p className="text-xs text-gray-400 italic py-3 text-center">No data available for this period.</p>
        )}
        {!loading && !error && data && data.totalTested > 0 && (
          <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className={`text-3xl font-bold leading-none ${rateColor}`}>{data.positivityRate?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Rate</p>
            </div>
            <div className="border-l border-gray-100">
              <p className="text-xl font-semibold text-gray-800">{data.totalTested.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Tested</p>
            </div>
            <div className="border-l border-gray-100">
              <p className="text-xl font-semibold text-gray-800">{data.totalPositive.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Positive</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  return (
    <div className="p-6 space-y-4 min-h-screen bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      <p className="text-sm text-gray-500">Pre-configured widgets visible based on role. Preset auto-loads on selection — last choice is remembered.</p>
      <div className="flex flex-wrap gap-4 items-start">
        <PositivityRateTile config={{testId:1,testName:"HIV Rapid Test",defaultPreset:"MONTH_TO_DATE"}}/>
        <PositivityRateTile config={{testId:2,testName:"Malaria RDT",defaultPreset:"LAST_7_DAYS"}}/>
        <PositivityRateTile config={{testId:3,testName:"Syphilis RPR",defaultPreset:"QUARTER_TO_DATE"}}/>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const TABS = [
  { label:"Dashboard", component:<Dashboard/> },
  { label:"Positivity Rate Report", component:<Report/> },
];

export default function App() {
  const [tab,setTab]=useState(0);
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <div className="bg-gray-900 text-white px-6 py-3 text-sm font-semibold tracking-wide flex items-center gap-3">
        <span className="text-blue-400 font-bold text-base">OpenELIS</span>
        <span className="text-gray-400 font-normal">Global</span>
      </div>
      <div className="border-b bg-white shadow-sm">
        <div className="flex">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab===i?"border-blue-600 text-blue-700 bg-blue-50/50":"border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {TABS[tab].component}
    </div>
  );
}
