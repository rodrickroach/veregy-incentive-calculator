import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "veregy-incentive-dashboard-v3";
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const SPLITS = [100, 50, 40, 30, 25, 20, 15, 10, 5];
const STAGES = ["Prospect", "Qualified", "Budgeting", "Proposal", "Closing", "Won"];
const PAYOUT_SPLITS = [0.35, 0.35, 0.15, 0.15];

function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function withCommas(n) {
  if (n === "" || n === null || n === undefined) return "";
  const num = String(n).replace(/,/g, "");
  if (num === "" || isNaN(Number(num))) return n;
  return Number(num).toLocaleString("en-US");
}

function getTier(gm) {
  if (gm >= 18 && gm <= 20) return { rate: 7, quick: 1.4, label: "18.00% - 20.00%" };
  if (gm >= 20.01 && gm <= 22.5) return { rate: 8, quick: 1.6, label: "20.01% - 22.50%" };
  if (gm >= 22.51 && gm <= 25) return { rate: 9, quick: 1.8, label: "22.51% - 25.00%" };
  if (gm >= 25.01 && gm <= 28) return { rate: 10, quick: 2.0, label: "25.01% - 28.00%" };
  if (gm >= 28.1) return { rate: 11, quick: 2.2, label: "28.10%+" };
  return { rate: 0, quick: 0, label: "Below threshold" };
}

function calcDeal(amount, margin, dealPercent) {
  const tier = getTier(margin);
  const pool = amount * (tier.rate / 100);
  const solo = pool * 0.2;
  const yours = solo * (dealPercent / 100);
  return { tier, pool, solo, yours };
}

function quarterLabel(monthIndex, year) {
  return `Q${Math.floor(monthIndex / 3) + 1} ${year}`;
}

function firstPayout(closeMonthIndex) {
  if (closeMonthIndex <= 2) return { monthIndex: 4, yearAdd: 0 };
  if (closeMonthIndex <= 5) return { monthIndex: 7, yearAdd: 0 };
  if (closeMonthIndex <= 8) return { monthIndex: 10, yearAdd: 0 };
  return { monthIndex: 1, yearAdd: 1 };
}

function nextPayout(monthIndex, year) {
  const ordered = [1, 4, 7, 10];
  let idx = ordered.indexOf(monthIndex);
  idx = (idx + 1) % ordered.length;
  const nextMonth = ordered[idx];
  if (nextMonth <= monthIndex) year += 1;
  return { monthIndex: nextMonth, year };
}

function buildPayouts(incentive, closeMonthIndex, closeYear) {
  const first = firstPayout(closeMonthIndex);
  let current = { monthIndex: first.monthIndex, year: closeYear + first.yearAdd };
  const rows = [];
  for (let i = 0; i < PAYOUT_SPLITS.length; i += 1) {
    rows.push({
      label: `${MONTHS[current.monthIndex]} ${current.year}`,
      quarter: quarterLabel(current.monthIndex, current.year),
      amount: incentive * PAYOUT_SPLITS[i],
      pct: PAYOUT_SPLITS[i] * 100,
    });
    current = nextPayout(current.monthIndex, current.year);
  }
  return rows;
}

function blankForm() {
  const now = new Date();
  return {
    projectName: "",
    client: "",
    amount: "",
    margin: "20",
    dealPercent: "100",
    stage: "Proposal",
    projectMonth: String(now.getMonth()),
    projectYear: String(now.getFullYear()),
    notes: "",
  };
}

export default function App() {
  const [form, setForm] = useState(blankForm());
  const [savedDeals, setSavedDeals] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedDeals(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDeals));
  }, [savedDeals]);

  const live = useMemo(() => {
    const amount = Number(String(form.amount).replace(/,/g, "")) || 0;
    const margin = parseFloat(form.margin) || 0;
    const dealPercent = parseFloat(form.dealPercent) || 0;
    const base = calcDeal(amount, margin, dealPercent);
    const payouts = buildPayouts(
      base.yours,
      parseInt(form.projectMonth, 10) || 0,
      parseInt(form.projectYear, 10) || new Date().getFullYear()
    );
    return { ...base, payouts };
  }, [form]);

  const totals = useMemo(() => {
    const out = {
      pipelineAmount: 0,
      totalIncentive: 0,
      likelyNow: 0,
      quarterMap: {},
    };

    for (const deal of savedDeals) {
      out.pipelineAmount += deal.amount || 0;
      out.totalIncentive += deal.yourIncentive || 0;
      if (["Proposal", "Closing", "Won"].includes(deal.stage)) out.likelyNow += deal.yourIncentive || 0;
      for (const p of deal.payouts || []) {
        out.quarterMap[p.quarter] = (out.quarterMap[p.quarter] || 0) + p.amount;
      }
    }

    const quarterRows = Object.entries(out.quarterMap)
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => {
        const [aq, ay] = a.label.split(" ");
        const [bq, by] = b.label.split(" ");
        return (Number(ay) * 10 + Number(aq.replace("Q", ""))) - (Number(by) * 10 + Number(bq.replace("Q", "")));
      });

    return { ...out, quarterRows };
  }, [savedDeals]);

  function update(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAmountChange(value) {
    const clean = value.replace(/[^\d]/g, "");
    update("amount", clean ? withCommas(clean) : "");
  }

  function resetForm() {
    setForm(blankForm());
    setEditingId(null);
  }

  function saveDeal() {
    const amount = Number(String(form.amount).replace(/,/g, "")) || 0;
    const margin = parseFloat(form.margin) || 0;
    const dealPercent = parseFloat(form.dealPercent) || 0;
    const projectMonth = parseInt(form.projectMonth, 10) || 0;
    const projectYear = parseInt(form.projectYear, 10) || new Date().getFullYear();

    const base = calcDeal(amount, margin, dealPercent);
    const payouts = buildPayouts(base.yours, projectMonth, projectYear);

    const deal = {
      id: editingId || String(Date.now()),
      projectName: form.projectName || "Untitled Deal",
      client: form.client || "",
      amount,
      margin,
      dealPercent,
      stage: form.stage,
      projectMonth,
      projectMonthLabel: MONTHS[projectMonth],
      projectYear,
      notes: form.notes || "",
      tierLabel: base.tier.label,
      yourIncentive: base.yours,
      soloIncentive: base.solo,
      payouts,
    };

    setSavedDeals(prev => {
      const exists = prev.some(d => d.id === deal.id);
      return exists ? prev.map(d => d.id === deal.id ? deal : d) : [deal, ...prev];
    });

    resetForm();
  }

  function editDeal(deal) {
    setEditingId(deal.id);
    setForm({
      projectName: deal.projectName || "",
      client: deal.client || "",
      amount: withCommas(deal.amount || ""),
      margin: String(deal.margin || ""),
      dealPercent: String(deal.dealPercent || "100"),
      stage: deal.stage || "Proposal",
      projectMonth: String(deal.projectMonth || 0),
      projectYear: String(deal.projectYear || new Date().getFullYear()),
      notes: deal.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteDeal(id) {
    setSavedDeals(prev => prev.filter(d => d.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="hero card gradient">
          <div>
            <h1>Veregy Incentive Dashboard</h1>
            <p>Simple calculator, pipeline tracker, edit and delete controls, and quarter payout projection.</p>
          </div>
          <div className="pillRow">
            <span className="pill blue">Pipeline</span>
            <span className="pill green">Payouts</span>
            <span className="pill orange">Edit/Delete</span>
          </div>
        </div>

        <div className="statsGrid">
          <div className="card stat blueCard">
            <div className="statLabel">Total Pipeline Amount</div>
            <div className="statValue">{money(totals.pipelineAmount)}</div>
          </div>
          <div className="card stat greenCard">
            <div className="statLabel">Expected Incentive</div>
            <div className="statValue">{money(totals.totalIncentive)}</div>
          </div>
          <div className="card stat orangeCard">
            <div className="statLabel">Likely to Hit</div>
            <div className="statValue">{money(totals.likelyNow)}</div>
          </div>
          <div className="card stat purpleCard">
            <div className="statLabel">Saved Pipeline Deals</div>
            <div className="statValue">{savedDeals.length}</div>
          </div>
        </div>

        <div className="mainGrid">
          <div className="card formCard">
            <h2>{editingId ? "Edit Deal" : "New Deal"}</h2>

            <label>Project Name</label>
            <input value={form.projectName} onChange={e => update("projectName", e.target.value)} placeholder="Crowley ISD - Lighting" />

            <label>Client</label>
            <input value={form.client} onChange={e => update("client", e.target.value)} placeholder="Crowley ISD" />

            <label>Amount</label>
            <div className="inputPrefix">
              <span>$</span>
              <input value={form.amount} onChange={e => handleAmountChange(e.target.value)} placeholder="10,000,000" />
            </div>

            <label>Margin</label>
            <div className="inputSuffix">
              <input type="number" step="0.01" value={form.margin} onChange={e => update("margin", e.target.value)} />
              <span>%</span>
            </div>

            <label>Deal Percentage</label>
            <div className="inputSuffix">
              <input type="number" step="0.01" value={form.dealPercent} onChange={e => update("dealPercent", e.target.value)} />
              <span>%</span>
            </div>

            <label>Date</label>
            <select value={form.stage} onChange={e => update("stage", e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="twoCol">
              <div>
                <label>Project Month</label>
                <select value={form.projectMonth} onChange={e => update("projectMonth", e.target.value)}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label>Project Year</label>
                <input type="number" value={form.projectYear} onChange={e => update("projectYear", e.target.value)} />
              </div>
            </div>

            <label>Notes</label>
            <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Board timing, funding, procurement, next step"></textarea>

            <div className="quickBox">
              <div className="quickTitle">Quick rule</div>
              <div className="quickBig">{live.tier.quick.toFixed(1)}% of deal</div>
              <div className="quickSmall">Live incentive: {money(live.yours)}</div>
            </div>

            <div className="buttonRow">
              <button onClick={saveDeal}>{editingId ? "Update Deal" : "Save Deal"}</button>
              <button className="secondary" onClick={resetForm}>Clear</button>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h2>Current Deal Snapshot</h2>
              <div className="miniGrid">
                <div className="miniBox"><div className="miniLabel">Tier</div><div className="miniValue">{live.tier.label}</div></div>
                <div className="miniBox"><div className="miniLabel">Pool at Tier</div><div className="miniValue">{money(live.pool)}</div></div>
                <div className="miniBox"><div className="miniLabel">Solo Incentive</div><div className="miniValue">{money(live.solo)}</div></div>
                <div className="miniBox"><div className="miniLabel">Your Incentive</div><div className="miniValue">{money(live.yours)}</div></div>
              </div>
            </div>

            <div className="card">
              <h2>Live Payout Projection</h2>
              <div className="list">
                {live.payouts.map(p => (
                  <div className="listRow" key={p.label}>
                    <div>
                      <div className="rowTitle">{p.label}</div>
                      <div className="rowSub">{p.quarter}, {p.pct}%</div>
                    </div>
                    <div className="rowAmt">{money(p.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="twoColWide">
              <div className="card">
                <h2>Quarter Payout Projection</h2>
                <div className="list">
                  {totals.quarterRows.length === 0 ? (
                    <div className="empty">No saved pipeline deals yet.</div>
                  ) : totals.quarterRows.map(q => (
                    <div className="listRow" key={q.label}>
                      <div className="rowTitle">{q.label}</div>
                      <div className="rowAmt">{money(q.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Saved Pipeline</h2>
                {savedDeals.length === 0 ? (
                  <div className="empty">No deals saved yet.</div>
                ) : (
                  <div className="dealList">
                    {savedDeals.map(deal => (
                      <div className="dealCard" key={deal.id}>
                        <div className="dealTop">
                          <div>
                            <div className="dealTitle">{deal.projectName}</div>
                            <div className="dealSub">{deal.client || "No client"}</div>
                            <div className="dealSub">
                              {money(deal.amount)}, {deal.margin}% margin, {deal.dealPercent}% deal percentage
                            </div>
                            <div className="dealSub">
                              {deal.stage}, {deal.projectMonthLabel} {deal.projectYear}
                            </div>
                          </div>
                          <div className="dealActions">
                            <button className="secondary small" onClick={() => editDeal(deal)}>Edit</button>
                            <button className="danger small" onClick={() => deleteDeal(deal.id)}>Delete</button>
                          </div>
                        </div>
                        <div className="dealMetrics">
                          <div className="miniBox"><div className="miniLabel">Tier</div><div className="miniValue">{deal.tierLabel}</div></div>
                          <div className="miniBox"><div className="miniLabel">Incentive</div><div className="miniValue">{money(deal.yourIncentive)}</div></div>
                          <div className="miniBox"><div className="miniLabel">1st Payout</div><div className="miniValue">{money((deal.payouts && deal.payouts[0]?.amount) || 0)}</div></div>
                        </div>
                        {deal.notes ? <div className="notes">Notes: {deal.notes}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2>Quick Cheat Table</h2>
              <table>
                <thead>
                  <tr>
                    <th>Deal Size</th>
                    <th>Low Margin</th>
                    <th>Mid Margin</th>
                    <th>High Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {[5000000, 10000000, 15000000, 20000000].map(size => (
                    <tr key={size}>
                      <td>{money(size)}</td>
                      <td>{money(size * 0.014)}</td>
                      <td>{money(size * 0.018)}</td>
                      <td>{money(size * 0.022)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="foot">Low = 1.4%, Mid = 1.8%, High = 2.2%, before deal percentage split.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
