# Retirement integration audit of the current Ledger app

Audit date: 2026-10-10. Checkout HEAD: `8b31993c1cddf4a38b4a98c43f306c44d26f22fa`. Read-only application review; only this report was created. No implementation or commits. Reviewed the project instructions and requesting-code-review skill. Scope is retirement contribution and matching integration, with essential tax/income baselines and downstream consumers. This is not a comprehensive review of provincial tax legislation, payroll compliance, or unrelated investment features.

Audit reconciliation: the independent [source audit](2026-10-10-retirement-source-audit.md) subsequently resolved the ordinary Quebec registered-plan QPP question through statutory interpretation and specific official guidance. References below to the earlier uncertainty describe the original research state, not a remaining ordinary-plan implementation blocker.

The existing `docs/research/canadian-retirement-contributions.md` accurately describes its principal current-app findings. It omits several material handoff, persistence, comparison, and forecast seams described below. Legislative treatment below refers to that research document; this audit independently verifies application behavior, not the legal research's web sources.

## Findings requiring explicit design decisions

### 1. The Compensation after-tax result includes retirement funding as spendable compensation

Sources: `src/store/useCompensationStore.ts:120-121,148-155`; `src/hooks/useTakeHomeEstimate.ts:18-27`; `src/components/compensation/CompHeroWidget.tsx:84-85,356-383`.

The current employer RRSP estimate is added to total package value. The hook sends that entire package to the employment tax calculator with both deduction inputs set to zero. The resulting `net` is divided into Net Monthly and Net Biweekly. There is no employee contribution or separate employer plan remittance to remove from spendable cash. The widget explicitly discloses the approximation, but the output is unsuitable as a retirement-aware cash reconciliation. Its phrase "RRSP match is actually tax-sheltered" is also too broad: taxable employer RRSP income, available deductions, room, and cash remittance are different concepts.

At $100,000 base pay with a legacy $5,000 employer RRSP amount, the current path estimates taxes on $105,000 and treats the remaining employer funding as part of net pay. A future path must establish employer contribution destination and deductibility, then reconcile cash independently from taxable employment income and package value. Employee amounts are already included in salary and cannot also increase total compensation.

### 2. "Full breakdown" does not transfer a complete compensation scenario

Source: `src/components/compensation/CompHeroWidget.tsx:88-105,395-406`.

The action rounds total package value and writes only `inputs['salary-tax'].income`. Existing RRSP, FHSA, province, and CRA deduction-limit fields remain. A confirmation protects a different saved income but does not reconcile contributions or plan assumptions. The destination can therefore combine employer retirement funding inside gross income with unrelated personal contribution inputs. Keeping the saved income intentionally opens a different scenario. This is a currently observable handoff seam, absent from the research table.

A future design needs a complete, reviewable transfer contract or clear scenario separation. Replacing income alone cannot silently imply synchronized retirement results.

### 3. The current "match" is a capped employer salary percentage

Sources: `src/store/useCompensationStore.ts:31-47,81-97,120-121`; `src/components/compensation/CompensationModal.tsx:151-164,529-545`; `src/components/compensation/CompareView.tsx:85-101,160`.

Only `rrspMatchPercent` and `rrspMatchCap` exist. The function calculates `min(annualBaseSalary * percentage / 100, cap)`. No employee participation input exists. A zero cap means zero funding, not unlimited. Bonus and equity are excluded from eligible earnings. Current-year matching uses the salary-history weighted annual base; next-1-year matching uses current base salary. Neither eligibility dates, period caps, annual true-up, match tiers, unconditional employer contributions, nor destinations are represented.

Both primary edit and comparison construct these fields. Primary setters merge partial updates, while comparison replaces the whole package. New fields need handling in both paths. There are no nonnegative bounds on the primary retirement `NumberInput` fields: unlike `CalculatorField`, they pass no `min`. The helper itself does not validate percentages, caps, finite values, or malformed imported values. This can produce negative or NaN package results. Input invariants belong in the future contract rather than being assumed from labels.

Legacy values cannot establish a match ratio or an employee contribution. Preserve their capped-salary estimate until actual plan terms are entered; do not reinterpret old data as confirmed plan facts.

### 4. Salary & Tax supports personal deductions, not workplace plan destinations

Sources: `src/components/planner/SalaryTaxTool.tsx:25,112-118,127-140,151-169,229-244`; `src/components/planner/toolRegistry.tsx:202-214`.

The tool accepts gross employment income, province, RRSP, FHSA, and one optional RRSP deduction limit. There is no RPP contribution, employer RRSP benefit, RRSP/DPSP split, PRPP/VRSP treatment, PA, benefit accrual, deduction carryforward, contribution timing, or withdrawal-restriction field. Entered zero is explicitly unknown. A positive limit caps modeled RRSP deductions; full RRSP/FHSA outflow is subtracted only in Net After Contributions. Net Annual/Monthly/Biweekly continue to include the contribution money, and the deductions component warns of this (`DeductionsBreakdown.tsx:100-101`).

The variable called `room` equals `max(0, entered deduction limit - entered contribution)`. This is remaining modeled deduction capacity, not verified available capacity for new contributions when previously reported undeducted amounts exist. Known zero cannot be expressed. The efficiency card can render zero capacity (`RrspEfficiencyCard.tsx:89-120`), but a user can reach that only through using up a positive entered limit, not by entering a zero CRA limit.

FHSA deductions are assumed within applicable rules; no capacity data or cap is applied in this path. Avoid making this adjacent simplified behavior a template for new retirement limits. Gross income and contribution fields in the UI are nonnegative through `CalculatorField.tsx:23-26,44-50`, but persisted inputs are merged without validation.

### 5. One tax input currently represents several distinct earnings bases

Sources: `src/utils/finance/canadaTax.ts:212-223,293-324,349-382`.

`annualSalaryTax(gross, province, rrsp, fhsa)` calls `employeeContributions(gross, province)`. CPP/QPP, EI and QPIP all use this one pay figure. RRSP/FHSA reduce taxable income, not statutory contribution earnings. Enhanced CPP/QPP is deducted from federal taxable income. Base pension, EI, QPIP and employment credits feed federal tax; provincial credits have their own province-dependent treatment. Quebec worker deduction also uses gross. Current constants include YMPE $74,600 and YAMPE $85,000; tax tables are explicitly 2026.

This is a coherent ordinary-employment/personal-RRSP baseline. Lowering gross to mimic an employee RPP deduction would incorrectly lower CPP/EI/QPIP and credit bases. Adding restricted employer group RRSP funding to gross would incorrectly raise EI/QPIP earnings wherever those amounts are excluded. Taxable employment income, cash remuneration, pensionable earnings, EI earnings, QPIP earnings, and credit bases must remain distinguishable.

Current `net` is `gross - income tax - employee statutory contributions`. It cannot express a taxable non-cash benefit independently from spendable pay. RPP is not the `pension` field: that field specifically represents CPP/QPP. Enhanced CPP/QPP deductibility and base CPP/QPP credit treatment must survive extension.

### 6. Marginal-rate and shelter helpers carry important different semantics

Sources: `src/utils/finance/canadaTax.ts:398-426,430-465,488-566,585-596`; `src/components/planner/RrspEfficiencyCard.tsx:39,85-120`.

The salary marginal rate and its breakdown compare income tax at gross and gross+$100 with fixed RRSP/FHSA deductions. Recomputing statutory contributions can change deductions and tax credits. They describe marginal income tax on additional salary, not the complete payroll deduction change and not necessarily the value of a further retirement deduction.

`marginalSlices` instead holds gross and statutory contributions fixed, raises RRSP shelter, and uses exact annual-tax differences to derive bands and savings. It includes provincial bracket offsets, Ontario surtax/health-premium/reduction thresholds, BC reduction crossover, and selected personal-amount phaseouts. Helpers solving thresholds repeatedly call the same annual model with a synthetic RRSP amount. A new tax context must propagate into these closures, the breakdown, `taxWithShelter`, `takeHomeWithDeductions`, and all output consumers. Updating the annual result alone can leave efficiency suggestions wrong.

Existing tax savings compare the same gross with and without modeled RRSP/FHSA deductions. Employer RRSP introduces an employment-income change; choose and state the comparison baseline. Do not remove employer taxable income in one side accidentally or add savings twice after withholding relief.

`taxWithShelter` accepts one aggregate shelter amount and calls the annual model with FHSA zero (`canadaTax.ts:489-490`). The current efficiency card calls `marginalSlices` directly, preserving separate existing RRSP and FHSA arguments (`RrspEfficiencyCard.tsx:39`); `taxWithShelter` has no production caller in the current source search. Treat its single shelter argument as an explicit aggregate rather than silently using it to replace a richer retirement context. The breakdown chart enumerates only income taxes and statutory CPP/QPP/EI/QPIP (`DeductionsBreakdown.tsx:12-25`); a workplace employee deduction needs its own cash row and an appropriate cash denominator if the scenario includes taxable non-cash benefits.

## Complete consumer and persistence map

| Seam | Current behavior and source | Required future consideration |
| --- | --- | --- |
| Main Compensation page | Package total controls populated state; current RRSP percent appears in package summary. `src/pages/Compensation.tsx:44-45,173,219`. | Total and summary terminology must express actual destination/assumptions, even when employee cash funding exists without an employer match. |
| Compensation hero | Annual pie includes RRSP; monthly RRSP equals annual match/12. `CompHeroWidget.tsx:119-131,154-173,325-340`. Its only production render found is on the Compensation page. | Label monthly amounts as estimates. Salary changes do not currently change monthly RRSP timing because a uniform annual average is used. Funding and cash must reconcile across annual and monthly displays. |
| Offer comparison | Store packages are used directly; RRSP and total comparison rows call shared helpers. `CompareView.tsx:33,317-344`. Local form begins with zero contributions and salary, rather than persisted comparison values (`35-45`). | Comparison needs full retirement inputs and preservation of saved plan data when reopened. It currently has no after-tax comparison calculation. |
| Currency/live stock | Primary display hook applies live price and optional CAD stock conversion. `useCompensationDisplay.ts:15-30`; `compensationFx.ts:12-20` scales stock prices only. | RRSP caps/salary are already CAD-native. Comparison bypasses display hook and live-price/FX resolution. Forecaster also uses raw stored stock prices. A retirement extension should explicitly preserve CAD basis and disclose these existing wider package inconsistencies. |
| Local persistence | Compensation and planner keys are registered in `storageKeys.ts:13,17`. Both persist version 1 with identity migration (`useCompensationStore.ts:292-298`; `usePlannerStore.ts:32-38`). `useToolInputs` spreads saved entries over defaults (`43-46`). | Optional/null/known-zero schema requires an explicit representation. Planner values currently permit number/string/boolean only (`usePlannerStore.ts:5-6`); null cannot just be introduced through current typed setters. Nested package data is not normalized during identity migration. |
| Old planner tools | Salary & Tax copies legacy income/province from `income-tax` or `take-home-pay` only if `salary-tax` is absent. `SalaryTaxTool.tsx:96-110`. | Preserve this earlier migration path when adding retirement defaults; importing old planner inputs must not bypass it accidentally. |
| Backup/export/import | Backup v2 takes raw persisted store envelopes and writes recognized keys after outer-envelope validation. `backup.ts:3,8-10,61-108`. No retirement/package field validation. Import reloads the app (`BackupControls.tsx:109-110`). | Store version and outer backup version are different contracts. Verify rehydration from both local legacy state and backups, including comparison, unknown/zero, old scalar assumptions, partial data and malformed inputs. |
| Drive snapshots | Push calls `buildBackup` (`syncService.ts:42`); pull calls `restoreBackup` and prunes absent recognized keys according to writer app version (`105-115`). | The same schema migrates after a snapshot is loaded. Preserve authoritative personal room and plan inputs across sync, and account for older writers. |
| Other equity consumers | `EquityVestingWidget` and dashboard `UpcomingVestsWidget` consume RSU grants, not RRSP or package totals. | No direct retirement calculation currently exists in those consumers; avoid assuming they need retirement funding fields merely because they share the compensation store. |

## Forecast and projection coupling

`useForecasterSettings.ts:63-88,103-119` uses account-valued CAD net worth, three completed months of budget net savings, and compensation lump sums. It does not use Compensation after-tax cash as the monthly savings input. `budgetSelectors.ts:49-60` measures income less expenses; payroll contributions absent from transaction records do not become a separate savings stream.

`compFeed.ts:18-76` emits only RSU, cash bonus, and ESPP gains. Employer RRSP funding and employee retirement contributions are absent. `compTax.ts:14-26` has income and province but no deduction or earnings-base context. Its auto rate calls salary marginal tax with zero RRSP/FHSA. Saved Salary & Tax income takes precedence, falling back to base salary when zero/absent (`useForecasterSettings.ts:67-80`), so changing deductions in Salary & Tax has no effect on the forecast haircut. The raw stored package price also bypasses the primary display hook's CAD and live-price path.

`forecast.ts:12-21,70-95` compounds a single balance and adds aggregate monthly savings/lumps. There is no plan/account destination, restricted-access balance, retirement withdrawal taxation, PA/room ledger, or DB pension income model. FIRE outputs consume this projection, so retirement integration requires an explicit decision about liquid cash versus total invested wealth. Automatic employee funding must not be counted again if the budget's savings already includes it. Employer funding cannot be run through the generic employment-income haircut for RPP/DPSP destinations. Existing account balances can already contain retirement holdings; adding future contributions must not also recreate their opening balances.

Budget month-end forecasting (`src/utils/budget/cashFlowForecast.ts:18-50`) is independent of compensation and salary tax. It uses actual transactions and detected recurring cashflows. No direct coupling to new retirement inputs is currently present.

## Acceptance scenarios to carry into a future specification

1. Zero employee participation gives zero conditional employer match; partial/full participation, over-threshold participation and optional caps reconcile employee funding, employer funding, package total and cash. Confirm that no cap and a known zero cap have distinct semantics.
2. Preserve a saved legacy $100,000 salary, 5% match and $5,000 cap as a legacy $5,000 estimate after migration. Do not fabricate employee contributions. Verify primary, compare, backup import and Drive load.
3. Known zero RRSP capacity allows no current RRSP deduction; unknown capacity remains unknown with disclosed assumptions. Positive limits and undeducted prior contributions distinguish deduction capacity from capacity for new deposits.
4. $100,000 cash plus $5,000 employee/$5,000 employer group RRSP: $105,000 employment income, assumed $10,000 deductible RRSP, $5,000 employee cash outflow, $10,000 funding and $105,000 package before other benefits. Match room shortfalls preserve cash outflow and contractual employer funding rather than reducing the contract.
5. Equivalent DC RPP: $100,000 employment income, $5,000 employee deduction, $10,000 funding, appropriate following-year PA. Known zero current RRSP room must not block the employee RPP deduction. RRSP/DPSP destination split has its separate current room and following-year PA treatment.
6. Below statutory ceilings, compare $50,000 salary plus $2,500 restricted and unrestricted employer group RRSP. Pensionable earnings increase appropriately; EI and Quebec QPIP must reflect restriction rules. Repeat at maxima to prove saturation does not conceal errors. Resolve research's Quebec registered-plan earnings caveat before unsupported accuracy claims.
7. Mixed RPP plus personal/group RRSP and FHSA: preserve statutory contributions on proper earnings; enhanced CPP/QPP deductions and tax credits remain correct; cash is subtracted once. DB annual employee dollars require no invented match or actuarial value.
8. Provincial deductions affect bracket fill, marginal breakdown and efficiency bands, including Ontario surtax/health premium, Quebec provincial offset, BC reduction and BPA phaseouts. Reconcile savings from bands to the same annual scenario.
9. Compensation handoff either transfers an internally consistent full scenario with review of saved inputs or states its limited scope. Different saved income, province, personal deductions and room must not silently combine with an employer match.
10. Salary change, current-year and next-1-year modes, annual package, monthly chart, comparison and all labels agree on contribution assumptions. Retirement CAD amounts are not scaled by stock FX.
11. Forecast future retirement funding only according to an explicit decision about cash versus invested wealth and budget inclusion. Do not double count employee deposits, tax employer plan funding as a generic cash lump, or include DB promises as accessible liquid cash.
12. Save/reload and backup/sync round trips preserve plan destinations, rules, employee inputs, withdrawal restriction, tax year, known/unknown/zero and comparison data. Reject or explicitly preserve unsupported/malformed data instead of producing NaN or negative funding.

## Verification and boundaries

Focused existing tests passed: 14 files, 205 tests, 23.64 seconds. The selection covered annual tax helpers, Salary & Tax UI/efficiency/breakdown, after-tax hook, compensation hero/edit/compare/store/FX, compensation tax/feed, backups and forecaster UI. No new tests were written and no app behavior was changed.

Existing coverage includes fixed gross payroll contributions under personal RRSP deductions, Quebec contributions, gross-tax versus cash distinctions, deduction limit capping with full cash outflow, marginal decomposition and shelter bands (`canadaTax.test.ts:23-41,201-255,306-448`; `SalaryTaxTool.test.tsx:201-269`), compensation link overwrite confirmation (`CompHeroWidget.test.tsx:81-107`) and CAD-native retirement/bonus (`compensationFx.test.ts:86-90`). Current store tests only exercise CAD flag persistence (`useCompensationStore.test.ts:10-27`). Compare/edit tests do not verify retirement match arithmetic. No employee/employer plan treatment, plan-specific earnings, known-zero-room migration or retirement funding forecast tests exist in the inspected paths.

Passing current tests establishes existing simplified behavior only. It cannot establish retirement-aware behavior the app does not represent. No browser, full verification, release/deployment, or independent legislative-table audit was performed. Material implementation blockers are the missing product decisions about supported plans, actual employer rules, legacy interpretation, capacity representation, scenario handoff, and forecast inclusion. Existing research also names the unresolved Quebec plan-specific earnings question.
