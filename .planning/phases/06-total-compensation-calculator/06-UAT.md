---
status: testing
phase: 06-total-compensation-calculator
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-04-SUMMARY.md, 06-VERIFICATION.md]
started: 2026-06-19T03:27:00Z
updated: 2026-06-19T19:35:00Z
---

## Current Test

number: 3
name: Compare View — RSU/equity add/remove and rendered delta (re-test after 06-04 gap closure)
expected: |
  On /compensation, enter a primary package (base salary + an RSU grant), click "Compare Another
  Offer", add one or more RSU grants in the compare form (name, shares, price, start date, vesting
  preset), remove one, then click "Calculate Comparison". The compare grant list updates live on
  add/remove; after Calculate, the "RSU (Annual)" compare-offer cell shows a non-$0 value and the
  delta badge shows a real +/- difference vs the primary offer (not "Equivalent"/$0).
  NOTE (timeMode caveat): a today-dated 4yr/1yr-cliff grant's first vest lands ~12 months out (next
  calendar year) and is filtered out under the default "Current Year" mode. To see a non-$0
  current-year value, use a grant whose cliff/vest lands in the current calendar year, or switch the
  toggle to "Next 1 Year".
awaiting: user response

## Tests

### 1. Compensation Data Entry Modal
expected: Clicking to add or edit compensation opens a comprehensive modal (CompensationModal). The user can enter base salary, bonuses, and benefits, which immediately updates the hero chart.
result: pass

### 2. Equity Vesting Timeline
expected: The EquityVestingWidget displays a timeline of RSU vesting using a bar chart for individual vest events and a line chart for the cumulative total.
result: pass

### 3. Compare View — RSU/equity add/remove and rendered delta (re-test after 06-04 gap closure)
expected: |
  The compare form now includes an RSU/equity sub-form (grant name, shares, grant price, start date,
  vesting preset, frequency, custom months) with working add/remove controls. After "Calculate
  Comparison", the "RSU (Annual)" compare-offer cell shows a non-$0 value and the delta reflects the
  real primary-vs-compare difference (timeMode caveat as noted in Current Test).
result: pending

## Summary

total: 3
passed: 2
issues: 0
pending: 1
skipped: 0
blocked: 0
status: testing

## Gaps

- truth: "When comparing compensation packages, the package being added/compared can include RSU/equity input details (matching the primary package's CompensationModal)."
  status: resolved
  fixed_by: 06-04
  resolution: "Gap closed in code by plan 06-04. CompareView.tsx now renders an inline RSU/equity grant sub-form (name, shares, grant price, start date, vesting preset, frequency, custom months) with add/remove handlers, and handleCalculate passes the collected grants into setComparePackage via `rsuGrants: compareRsuGrants` (the old hardcoded `rsuGrants: []` is gone). gsd-verifier confirmed 7/7 must-haves against the codebase and reproduced `calcAnnualRSU` returning 37500 for an in-window grant and 0 for empty. Awaiting human re-test (Test 3) to confirm the live-UI add/remove interaction and rendered delta in the running app."
  severity: major
  test: 3
  artifacts:
    - src/components/compensation/CompareView.tsx
    - src/store/useCompensationStore.ts
