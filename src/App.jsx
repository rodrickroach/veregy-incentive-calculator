import React, { useMemo, useState } from 'react'
import {
  Calculator,
  DollarSign,
  Percent,
  Users,
  Calendar,
  Smartphone,
  Table2,
  BadgePercent,
} from 'lucide-react'

const splitOptions = ['50', '40', '30', '25', '20', '15', '10', '5']
const cheatDealSizes = [5000000, 10000000, 15000000, 20000000]

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function getTier(gm) {
  if (gm >= 18 && gm <= 20) {
    return { tierLabel: '18.00% - 20.00%', incentivePercent: 7, repEffectivePercent: 1.4, quickLabel: '1.4% of deal' }
  }
  if (gm >= 20.01 && gm <= 22.5) {
    return { tierLabel: '20.01% - 22.50%', incentivePercent: 8, repEffectivePercent: 1.6, quickLabel: '1.6% of deal' }
  }
  if (gm >= 22.51 && gm <= 25.0) {
    return { tierLabel: '22.51% - 25.00%', incentivePercent: 9, repEffectivePercent: 1.8, quickLabel: '1.8% of deal' }
  }
  if (gm >= 25.01 && gm <= 28.0) {
    return { tierLabel: '25.01% - 28.00%', incentivePercent: 10, repEffectivePercent: 2.0, quickLabel: '2.0% of deal' }
  }
  if (gm >= 28.1) {
    return { tierLabel: '28.10%+', incentivePercent: 11, repEffectivePercent: 2.2, quickLabel: '2.2% of deal' }
  }
  return { tierLabel: 'Below plan threshold', incentivePercent: 0, repEffectivePercent: 0, quickLabel: 'No payout tier' }
}

function App() {
  const [projectName, setProjectName] = useState('Crowley ISD - Lighting')
  const [projectValue, setProjectValue] = useState('10000000')
  const [grossMargin, setGrossMargin] = useState('20')
  const [isSplitDeal, setIsSplitDeal] = useState(false)
  const [splitPercent, setSplitPercent] = useState('50')

  const tier = useMemo(() => getTier(parseFloat(grossMargin) || 0), [grossMargin])

  const results = useMemo(() => {
    const value = parseFloat(projectValue) || 0
    const split = isSplitDeal ? (parseFloat(splitPercent) || 0) / 100 : 1

    const poolAtTier = value * (tier.incentivePercent / 100)
    const soloIncentive = poolAtTier * 0.2
    const yourIncentive = soloIncentive * split

    const installments = [
      { label: '1st Qtr', date: 'May 15', pct: 35 },
      { label: '2nd Qtr', date: 'Aug 15', pct: 35 },
      { label: '3rd Qtr', date: 'Nov 15', pct: 15 },
      { label: '4th Qtr', date: 'Feb 15', pct: 15 },
    ].map((item) => ({
      ...item,
      amount: yourIncentive * (item.pct / 100),
    }))

    return { split, poolAtTier, soloIncentive, yourIncentive, installments }
  }, [projectValue, splitPercent, isSplitDeal, tier])

  const quickFormula = useMemo(() => {
    if (tier.repEffectivePercent === 0) return 'No incentive in current tier'
    if (!isSplitDeal) return `Deal Size x ${tier.repEffectivePercent.toFixed(1)}%`
    return `Deal Size x ${tier.repEffectivePercent.toFixed(1)}% x ${splitPercent}%`
  }, [tier, isSplitDeal, splitPercent])

  const mentalMath = useMemo(() => {
    const value = parseFloat(projectValue) || 0
    const base = value * (tier.repEffectivePercent / 100)
    const afterSplit = isSplitDeal ? base * ((parseFloat(splitPercent) || 0) / 100) : base
    return { base, afterSplit }
  }, [projectValue, tier, isSplitDeal, splitPercent])

  const cheatRows = useMemo(() => {
    const bands = [
      { label: 'Low Margin', pct: 1.4 },
      { label: 'Mid Margin', pct: 1.8 },
      { label: 'High Margin', pct: 2.2 },
    ]
    return cheatDealSizes.map((size) => ({
      size,
      values: bands.map((b) => size * (b.pct / 100)),
    }))
  }, [])

  return (
    <div className="page">
      <div className="wrap">
        <section className="hero card">
          <div className="hero-icon"><Calculator size={26} /></div>
          <div className="hero-copy">
            <h1>Veregy Incentive Calculator</h1>
            <p>Simple mobile-first web app for quick incentive estimates on iPhone.</p>
            <div className="badges">
              <span className="badge"><Smartphone size={14} /> Mobile Ready</span>
              <span className="badge"><BadgePercent size={14} /> Fast Math</span>
              <span className="badge"><Table2 size={14} /> Cheat Table</span>
            </div>
          </div>
        </section>

        <div className="grid">
          <section className="card">
            <h2>Deal Inputs</h2>

            <label>Project Name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} />

            <label>Project Value</label>
            <div className="input-icon">
              <DollarSign size={16} />
              <input type="number" inputMode="decimal" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} />
            </div>

            <label>Gross Margin %</label>
            <div className="input-icon">
              <Percent size={16} />
              <input type="number" step="0.01" inputMode="decimal" value={grossMargin} onChange={(e) => setGrossMargin(e.target.value)} />
            </div>

            <div className="toggle-box">
              <div>
                <div className="toggle-title">Split Deal</div>
                <div className="toggle-sub">Turn on if you are sharing the incentive</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={isSplitDeal} onChange={(e) => setIsSplitDeal(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            {isSplitDeal && (
              <>
                <label>Your Split %</label>
                <div className="input-icon">
                  <Users size={16} />
                  <select value={splitPercent} onChange={(e) => setSplitPercent(e.target.value)}>
                    {splitOptions.map((pct) => (
                      <option key={pct} value={pct}>{pct}%</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="quick-rule">
              <div className="quick-small">Quick rule</div>
              <div className="quick-big">{tier.quickLabel}</div>
              <div className="quick-small">{quickFormula}</div>
            </div>
          </section>

          <div className="stack">
            <section className="stats">
              <div className="card stat">
                <div className="stat-label">Tier Used</div>
                <div className="stat-value small">{tier.tierLabel}</div>
                <div className="stat-note">Rate: {percent(tier.incentivePercent)}</div>
              </div>
              <div className="card stat">
                <div className="stat-label">Pool at Tier</div>
                <div className="stat-value">{currency(results.poolAtTier)}</div>
                <div className="stat-note">Deal size x tier rate</div>
              </div>
              <div className="card stat">
                <div className="stat-label">Solo Incentive</div>
                <div className="stat-value">{currency(results.soloIncentive)}</div>
                <div className="stat-note">Pool x 20%</div>
              </div>
              <div className="card stat">
                <div className="stat-label">Your Incentive</div>
                <div className="stat-value">{currency(results.yourIncentive)}</div>
                <div className="stat-note">{isSplitDeal ? `After ${splitPercent}% split` : 'Solo payout'}</div>
              </div>
            </section>

            <section className="card">
              <h2>One Screen Math</h2>
              <div className="three-grid">
                <div className="soft-box">
                  <div className="soft-small">1. Pick margin tier</div>
                  <div className="soft-big">{percent(grossMargin)} gives you {tier.quickLabel}</div>
                </div>
                <div className="soft-box">
                  <div className="soft-small">2. Estimate solo amount</div>
                  <div className="soft-big">{currency(mentalMath.base)}</div>
                </div>
                <div className="soft-box">
                  <div className="soft-small">3. Apply split if needed</div>
                  <div className="soft-big">{currency(mentalMath.afterSplit)}</div>
                </div>
              </div>
              <div className="formula-box">
                <div className="soft-small">Simple formula</div>
                <div className="formula">{quickFormula}</div>
                <div className="soft-small">Exact sheet logic: Project Value x Tier % x 20%{isSplitDeal ? ` x ${splitPercent}%` : ''}</div>
              </div>
            </section>

            <section className="card">
              <h2><Calendar size={18} style={{verticalAlign:'text-bottom', marginRight:6}} />Installment Schedule</h2>
              <div className="installments">
                {results.installments.map((item) => (
                  <div className="installment" key={item.label}>
                    <div>
                      <div className="inst-title">{item.label}</div>
                      <div className="inst-sub">{item.date}, {item.pct}%</div>
                    </div>
                    <div className="inst-amt">{currency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>Quick Cheat Table</h2>
              <div className="table-wrap">
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
                    {cheatRows.map((row) => (
                      <tr key={row.size}>
                        <td>{currency(row.size)}</td>
                        <td>{currency(row.values[0])}</td>
                        <td>{currency(row.values[1])}</td>
                        <td>{currency(row.values[2])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="footnote">Low = 1.4%, Mid = 1.8%, High = 2.2%, before any split.</div>
            </section>

            <section className="card">
              <h2>Install on iPhone</h2>
              <div className="soft-box">
                <div className="inst-title">How to add to Home Screen</div>
                <div className="steps">1. Open this web app in Safari.</div>
                <div className="steps">2. Tap the Share button.</div>
                <div className="steps">3. Tap Add to Home Screen.</div>
                <div className="steps">4. Name it Incentive Calculator and save it.</div>
              </div>
              <div className="footnote">For full app-like install behavior later, this can be upgraded into a PWA.</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
