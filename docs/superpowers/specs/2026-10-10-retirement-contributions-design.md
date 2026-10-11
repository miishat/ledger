# Canadian retirement contributions and employer matching

Date: 2026-10-10
Status: Reviewed draft specification for user review. Independent source and app audits and fresh-context specification review completed. Implementation is not authorized by this document.
Tax-table baseline: Ledger's existing 2026 annual employee estimate.

## Problem Statement

Employees cannot enter workplace pension contributions in Salary & Tax. Compensation has a field called RRSP Match, but calculates a capped percentage of salary without knowing the employee contribution or matching terms. Its after-tax result treats employer retirement funding as cash-like compensation without the corresponding RRSP deduction. Copying the package into Salary & Tax carries those assumptions into another calculator.

Users need consistent estimates of cash after contributions, employee and employer retirement funding, income tax, and room usage. They also need plan types to remain distinct: an RRSP match, registered pension contribution, and DPSP allocation do not have interchangeable tax treatment.

## Solution

Extend the two existing calculators with one shared retirement-aware annual calculation contract. Keep Salary & Tax usable independently, and let Compensation calculate workplace contributions from an employer's actual matching terms. Show spendable cash separately from employer-funded retirement compensation.

Approaches considered:

1. Add one pension deduction field and retain the current RRSP match formula. Smallest surface change, but leaves participation, employer RRSP tax treatment, and inter-calculator inconsistencies unresolved.
2. Add typed workplace plans, participation-sensitive matching, shared tax inputs, explicit room states, and consistent results across both screens. Recommended: covers the requested gaps while retaining an annual estimator.
3. Build a complete pay-period payroll and pension-administration engine. Requires pay dates, employer history, age exemptions, province-of-employment handling, plan-specific limits, and actuarial rules. Excluded from this feature.

### Included plan types

| Arrangement | Employee destination | Employer destination | Included behavior |
| --- | --- | --- | --- |
| Group RRSP | RRSP | RRSP | Employee funding, conditional/unconditional employer funding, income benefit, deductions, current room usage, withdrawal-based earnings treatment |
| Defined-contribution pension | DC RPP | DC RPP | Current-service employee deduction, employer funding, matching, estimated ordinary pension adjustment |
| Defined-benefit pension | DB RPP | DB RPP | Entered current-service employee deduction, optional entered employer funding and actual administrator PA; no actuarial valuation or invented match |
| RRSP with DPSP match | RRSP | DPSP | Separate employee RRSP room/deduction and employer DPSP funding/PA |
| PRPP / qualifying Quebec VRSP | PRPP / VRSP | Same registered arrangement | Member deduction, employer funding, shared current RRSP capacity, and their distinct tax treatment |

Multiple workplace arrangements may coexist. A personal RRSP contribution remains separate from workplace contributions. Employee CPP/QPP remains an automatically calculated public pension deduction, not a workplace plan input.

## User Stories

1. As an employee, I want to select my actual workplace plan type so that its tax and room rules are applied correctly.
2. As an employee, I want to enter my pension contribution in annual dollars so that Salary & Tax reflects money withheld from my salary.
3. As an employee, I want to enter workplace and personal RRSP contributions separately so that I do not count either twice.
4. As an employee, I want to enter employer RRSP funding separately so that its income benefit and offsetting deduction are represented.
5. As an employee, I want to see cash after my contributions so that I can compare it with my household spending needs.
6. As an employee, I want to see employer retirement funding separately so that I do not mistake it for cash I can spend.
7. As an employee, I want to see my own and my employer's total DC retirement funding so that I understand the amount going into my plan.
8. As an employee, I want matching to depend on my participation so that contributing nothing does not earn a conditional match.
9. As an employee, I want to distinguish a match ratio from a percentage-of-salary threshold so that a 50% match on 6% is modeled correctly.
10. As an employee, I want employer dollar caps and unconditional contributions supported so that my contract can be represented.
11. As an employee, I want tiered matching and eligible bonus treatment supported so that common matching contracts fit the calculator.
12. As an employee with an RRSP/DPSP arrangement, I want employee and employer destinations kept separate so that current-year RRSP room is not overstated or understated.
13. As a pension member, I want an RPP deduction even when RRSP room is zero so that valid pension contributions are not rejected.
14. As a DB pension member, I want to enter the contribution from my plan statement so that the app does not guess an actuarial pension value.
15. As a Quebec employee, I want verified QPP/QPIP treatment so that federal CPP assumptions are not copied indiscriminately.
16. As an employee, I want to distinguish known zero room from unknown room so that the estimate describes what is actually known.
17. As an employee, I want deduction capacity and new contribution capacity shown separately so that prior undeducted contributions do not create fictitious room.
18. As an employee, I want to compare offers using the same CAD valuation and calculation rules so that package differences are meaningful.
19. As an employee, I want an explicit transfer of my Compensation scenario to Salary & Tax so that the detailed breakdown reconciles without overwriting unrelated personal inputs.
20. As an existing user, I want my saved numbers preserved and ambiguous old matching assumptions highlighted so that an upgrade does not silently reinterpret my contract.
21. As a user restoring a backup, I want retirement settings, room states, and review status preserved so that restored estimates match the original dataset.
22. As a phone or keyboard user, I want the new inputs and results to remain accessible so that the feature works without horizontal scrolling or hidden controls.

## Implementation Decisions

### 1. Calculation boundary and ownership

REQ-01. Use one deterministic annual estimate contract shared by both calculators. It accepts province, modeled cash employment remuneration, independently classified employment/CPP-or-QPP/EI/QPIP earnings, employment-credit/worker-deduction bases, workplace contribution amounts, personal RRSP/FHSA amounts, deduction capacity, and the tax year. It returns income taxes, statutory employee contributions, deducted amounts, actual employee cash outflow, employer funding, and assumption/validation states. A normalized scenario preserves the difference between cash, taxable benefits, and assumed equity realization; transferring only a salary number cannot reproduce this contract.

REQ-02. Keep workplace matching calculation distinct from tax calculation. Resolve plan amounts first, then pass classified totals to the tax estimate. Screens, charts, comparisons, and scenario transfer must consume the same resolved result rather than recalculate their own matching rules.

REQ-03. Salary & Tax owns its standalone pay and workplace scenario. Compensation owns primary and comparison workplace plan contracts. Shared personal tax settings contain province and optional CRA limits, not one global workplace contract. Comparison edits must not mutate the primary package.

REQ-03a. The planner store owns one typed shared tax profile containing province, the supplied capacity values and their source years/known states. Existing consumers read that profile rather than maintaining duplicate province/limit values. Compensation persists its Include Personal Deductions selection once for both offers; each imported Salary & Tax snapshot persists its own inclusion selection. Resetting Salary & Tax resets its pay/workplace scenario and personal contribution amounts, with an explanation that included personal amounts affect Compensation, but retains the shared province and CRA settings. An explicit Clear CRA Limits action resets the shared limits to unknown. Resetting an offer does not erase shared tax settings or the other offer.

REQ-04. Extend persisted planner state with a typed Salary & Tax retirement scenario rather than placing an object into a flat input map that currently permits only scalar values. Retain the other planner tools and their input contracts. Store ordinary data only, not computed caches or callable functions.

### 2. Salary & Tax inputs and outputs

REQ-05. The entered gross annual pay excludes employer contributions separately entered in workplace plans. Preserve existing salary, province, personal RRSP, and FHSA inputs. Rename or explain the existing RRSP input as Personal RRSP Contribution; retain its saved amount and explain the distinction when workplace RRSP funding is first added.

REQ-06. Each workplace row has a plan type, optional name, employee annual contribution, and applicable employer annual contribution. Group RRSP rows require a withdrawal-restriction selection; unknown is a real state. A standalone Salary & Tax row accepts annual dollar amounts, not an inferred employer match. Add/remove/edit rows immediately recalculates the estimate.

REQ-07. DB rows accept employee current-service annual dollars. Employer funding and administrator PA are optional known/unknown inputs. Unknown employer funding must be described as Pension Funding Not Entered, not converted into a verified zero or a pension value. Employee DB contributions must not be shown as a DC investment-account balance.

REQ-08. The leading net results show Cash After Contributions annually and annual-average monthly/biweekly amounts. A separately labeled Net Before Voluntary Contributions may be shown as supporting detail. Every displayed net label identifies whether employee contributions were subtracted. Division by 12 or 26 is an annual average, not a pay-period withholding prediction.

REQ-09. Show taxable income, income tax, employee CPP/QPP, EI, QPIP where applicable, employee workplace contributions, personal contributions, and employer retirement funding separately. Cash pay reconciles to cash after contributions plus income tax, statutory employee contributions, and actual employee-funded contributions. A taxable employer RRSP benefit appears as a separate employment-income adjustment, not as cash received.

REQ-10. Tax Savings From Contributions compares the same cash earnings, employer funding, and statutory earnings classification with and without the modeled employee/member deductions. The baseline retains any deductible employer RRSP contribution and employer PRPP room reduction; otherwise the display would misrepresent employer funding as employee deduction savings. No payroll tax relief is added a second time as a refund.

REQ-11. Bracket fills, marginal-rate breakdown, Ontario premium, provincial adjustments, and RRSP efficiency use the retirement-aware calculation context. Marginal rate measures income-tax change for an additional $100 of cash pay with entered retirement dollar amounts held fixed. Explain that it is not the change in cash after contributions or a recalculated salary-linked employer contract. RRSP efficiency uses current taxable income with RPP/FHSA deductions and benefit/earnings bases held fixed. It never uses an RPP deduction as RRSP room consumption. Hypothetical tax-saving bands can extend beyond known capacity only when labeled hypothetical; actionable additional-contribution suggestions are bounded by both known remaining deduction capacity and known new contribution room. An unknown bound remains disclosed as an assumption, not an unlimited allowance.

### 3. Compensation participation and matching

REQ-12. Compensation uses the same plan kinds and allows multiple arrangements. An employee contribution can be annual dollars or a percentage of eligible earnings. Eligible earnings are explicit: base salary, or base plus the modeled cash bonus. Equity and ESPP gain are not eligible unless entered through an explicit eligible-earnings annual dollar override.

REQ-13. For ordinary matching plans, support employee participation, zero or more incremental matching tiers, an optional unconditional employer contribution in annual dollars or a percentage of eligible earnings, and an optional employer annual dollar cap. A tier specifies its employee salary-percentage interval and employer dollars per employee dollar. Tiers are ordered and non-overlapping; intervals have 0 <= lower < upper <= 100. Explicit unmatched gaps are allowed. An annual cap of zero means zero; No Annual Cap is a separate state. New arrangements start with zero contributions and no guessed contractual matching terms; labels and defaults never imply that a statutory Canadian match rate exists.

REQ-14. For a tier with eligible earnings B, employee dollars E, salary percentages lower/upper, and match ratio r dollars per employee dollar, match equals r times max(0, min(E, B times upper/100) minus B times lower/100). Sum tier matches and unconditional employer funding, then apply the employer cap to that combined amount. The cap does not reduce the employee contribution. With B=0, percentage employee funding and conditional matching are zero; annual-dollar employee funding is retained. An unconditional annual-dollar employer contribution remains subject to its cap, while an unconditional salary percentage produces zero. Employer contractual matching and statutory plan limit warnings are separate calculations.

REQ-15. Example contract: 50% match on employee contributions from 0% through 6% of $100,000 eligible earnings. Employee contributions of $0/$3,000/$6,000/$8,000 produce matches of $0/$1,500/$3,000/$3,000. A $2,000 employer cap changes the last two matches to $2,000. An unconditional contribution can remain positive when employee participation is zero.

REQ-16. Annual percentage calculations use the same current-year base salary history and bonus estimate as the rest of Compensation. Next 1 Year uses its existing annualized salary basis. Both modes' tax results are hypothetical annual equivalents calculated with the available tax-table year, 2026 at this baseline. Next 1 Year does not claim to allocate payroll or room across 2026 and 2027; label its tax/room result Annualized Using 2026 Rules and apply supplied 2026 opening capacity to that hypothetical annual scenario. Do not substitute the published 2027 RRSP dollar limit without a complete 2027 tax-table update. State that retirement matching uses annual aggregate terms and assumes the entered arrangement applies for the whole selected period; exact enrollment dates, per-pay matching, annual true-ups, and mid-period contract changes are excluded. Annual-dollar inputs describe the selected period and are not silently prorated.

REQ-17. DB plans have no automatic matching formula. Accept annual employee contributions and optional employer funding supplied by the user. The official below/above-YMPE public-service example is documentation, not a default contribution schedule for all Canadian pensions.

REQ-18. Gross total compensation includes employer retirement funding once and never adds employee contributions a second time. Show Cash After Contributions, Employer Retirement Funding, and Total Compensation as distinct results. Where DB employer funding is unknown, use Known Compensation and Pension Value Not Estimated; cash tax calculation can still be available.

REQ-19. Gross compensation charts and tooltips use resolved employer funding by destination. Employee contributions appear in contribution/cash breakdowns rather than being stacked onto gross compensation. Monthly retirement bars are labeled annual averages and sum to the resolved annual funding; they do not imply actual deposit dates or vesting.

REQ-20. Both offers use one resolved CAD stock/FX context before total, tax, match, chart, and delta calculations. Base salary and retirement dollars are CAD and are not stock-FX converted. If stock components cannot be valued in CAD, show Conversion Needed for combined CAD totals, after-tax estimates, and transfer; continue to display known native components and cash-only details separately. Do not tax an unconverted USD stock value as CAD. Reuse existing rate controls; add no new FX provider. For the retirement-aware estimate, preserve the current approximation that RSU vest value and ESPP gain are employment-income amounts realized as cash through sale; show the assumption on results and transfer. This feature does not turn those approximations into accurate stock-option tax or sale-proceeds accounting.

REQ-21. Comparison initializes from the persisted comparison package, including its retirement configuration. Save edits through the existing comparison flow; switching views or reloading does not reset stored retirement inputs to zero. Comparison shows gross known compensation, employer funding, and employee cash contribution deltas as separate items. When After Tax is selected, it also compares Cash After Contributions under the same personal/profile settings, showing ranges or unavailable states when required. An unknown employer DB funding amount is not used as zero in a funding delta.

### 4. Verified tax classification

REQ-22. Ordinary employee RRSP/RPP/member PRPP contributions do not reduce original CPP/QPP, EI, or QPIP earnings. Eligible employee current-service RPP amounts reduce income tax through an RPP deduction, independently of RRSP room.

REQ-23. Employer group RRSP funding increases employment income and CPP/QPP pensionable earnings. Both employee and employer RRSP contributions participate in RRSP deduction capacity and current contribution-room usage. Include employer group RRSP in EI/QPIP earnings when withdrawable; exclude it when withdrawals are restricted until retirement or termination except HBP/LLP.

REQ-24. For a group RRSP with unknown withdrawal restrictions, run restricted and withdrawable branches while retaining the same known funding amounts. EI/QPIP differences change tax credits and can therefore change income tax, savings, marginal/efficiency results, and cash. Propagate the range or uncertainty through every dependent result; if a result cannot be ranged intelligibly, show Earnings Treatment Needed. Do not show one unqualified income-tax result or choose the favorable branch silently. A branch-independent amount, or a range that collapses at statutory maxima, may be displayed as one amount with its unresolved assumption retained. A transferred snapshot retains the unknown restriction and its branch status.

REQ-25. Ordinary employer contributions to registered RPP/DPSP/qualifying PRPP/VRSP are not employee employment income, employee deductions, or additional CPP/QPP/EI/QPIP earnings. The source audit establishes Quebec classification through statutory interpretation corroborated by plan-specific official guidance. Unregistered arrangements and administration fees are outside this contract.

REQ-26. Employer PRPP/VRSP contributions consume shared current RRSP capacity but are not deducted by the employee. With a known RRSP deduction limit L and employer PRPP/VRSP funding P, deductible member RRSP/PRPP capacity is max(0, L - P). Employee RPP deduction is separate. Unknown L leaves member deductibility explicitly assumed, not verified.

REQ-27. Use the existing enhanced CPP/QPP deductions and standard credits exactly once, calculated from correct earnings. Federal/provincial employment-income credits or worker deductions must use their proper employment-income inputs rather than substituting cash after retirement contributions. Canada employment amount and the corresponding modeled Yukon amount use eligible employment income before employee retirement deductions, including ordinary taxable employer RRSP benefits and excluding ordinary employer RPP/DPSP/PRPP funding. Apply the Quebec worker-deduction rules to its eligible employment-income base; maintain that base separately from CPP/QPP and EI/QPIP earnings so withdrawal restrictions cannot inadvertently remove an income benefit.

### 5. Deduction capacity, contribution room, and PA

REQ-28. CRA RRSP Deduction Limit and CRA Available Contribution Room are distinct optional year-tagged fields. Unknown and known zero are distinguishable. Available contribution room can be negative if the supplied CRA statement already records excess contributions. Reject non-finite input; do not coerce negative supplied contribution room to an unknown state.

REQ-29. Limits are scenario-opening values before the contributions included in the modeled annual scenario. Explain this basis so amounts already accounted for are not subtracted twice. The user supplies the CRA amounts for the modeled year; the app does not infer room from salary or compute a future deduction limit.

REQ-30. When a deduction limit is known, cap the aggregate current modeled deductible RRSP/member PRPP amounts after employer PRPP funding consumes its capacity. Employer RRSP is in that aggregate. Preserve all actual cash contributions and contractual employer funding even where deductions are capped. For component display, allocate allowed deduction first to employer RRSP, then member workplace RRSP/PRPP in stable row order, then personal RRSP. This is a scenario-display convention, not a CRA-mandated claim order.

REQ-31. Available contribution room constrains new current-year member RRSP, employer group RRSP, member PRPP/VRSP, and employer PRPP/VRSP funding together. Known deduction capacity alone cannot establish available contribution room. If only the deduction limit is entered, display deductible capacity without calling it remaining contribution room.

REQ-32. Do not claim prior undeducted contributions as a new cash contribution or automatically deduct them. This version models the supplied year's new contributions. Users with prior undeducted amounts enter their available new contribution room separately; a full carryforward deduction optimizer is excluded.

REQ-33. Ordinary RPP/DPSP PA is shown separately as an estimated following-year room effect, never deducted from a supplied current-year CRA limit or current taxable income. A simple DC estimate uses employee plus employer current-service contributions and discloses that forfeitures, surplus allocations, other provisions, and administrator adjustments are absent. An actual entered PA overrides the estimate. DB PA remains unknown unless supplied by the administrator.

REQ-34. Annual registered-plan dollar ceilings are versioned with the existing tax year. The 2026 RRSP dollar limit is $33,810, DC money-purchase limit $35,390, and DPSP dollar limit $17,695. They are explanatory new-room/allocation ceilings, not an automatic personal RRSP contribution limit. For ordinary contribution-only DC rows, the estimated pension credit is employee plus employer funding; for DPSP it is employer funding. With administrator/user-confirmed Registered-Plan Compensation C, test ordinary DC credits against min(18% of C, money-purchase limit), DPSP credits against min(18% of C, DPSP limit), and the sum of ordinary DC/DPSP credits for this employer against min(18% of C, money-purchase limit). Warn for any applicable exceedance; preserve all amounts and describe deduction results as conditional on administrator confirmation rather than silently enforcing an invented plan contract.

REQ-34a. Registered-Plan Compensation is an optional advanced annual dollar input, independent of match-eligible earnings. It represents the applicable statutory employer compensation under the RPP or DPSP definition; do not substitute total package value, a salary matching threshold, or estimated future equity automatically. Without a confirmed basis, show Earnings Limit Not Verified and check dollar ceilings only. The DPSP statutory definition omits the RPP definition's prescribed-amount paragraph; if both arrangements exist and their bases differ, require separate confirmed bases and mark any unsupported combined legal check unverified. Disclose that DB provisions, forfeitures, surplus allocations, multiple/non-arm's-length employers, exemptions, and corrective allocations can affect aggregate rules; no Within All Legal Limits certification is produced.

REQ-35. Excess-room warnings state the modeled excess and distinguish nondeductible amounts from room usage. Do not add the $2,000 general excess allowance to deductible capacity. Do not calculate complete overcontribution tax, automatic corrective refunds, HBP/LLP repayments, or payroll compliance.

REQ-35a. For PRPP/VRSP employer funding above the tax year's RRSP dollar limit, flag Member Direction Needed unless the user confirms that direction. This separate registration condition does not replace assessed contribution-room checks or automatically reduce the contract's funding amount.

### 6. Inter-calculator transfer and dependent consumers

REQ-36. Full Breakdown transfers a reviewed snapshot containing modeled cash employment remuneration, employer taxable benefits, classified earnings/credit bases, annual employee/employer workplace amounts, destinations, withdrawal restrictions, effective tax-table year, source time mode, valuation/equity-sale assumptions, and the Include Personal Deductions selection. It does not transfer total package value as salary. Snapshot provenance and the shared CRA settings' known/unknown/year states remain visible so equality is assessed under the same effective tax context. Keep decimal precision until display.

REQ-37. Before replacing a differing saved Salary & Tax scenario, show what will change and offer Replace Scenario or Keep Existing. Apply replacement atomically across pay, workplace amounts, effective year, and the personal-deduction inclusion selection. Preserve personal RRSP/FHSA input values and shared CRA limits; do not merge old workplace rows into imported rows or duplicate workplace funding. If Compensation excluded personal deductions, keep their saved values visible as Excluded From This Scenario in Salary & Tax and allow explicit inclusion; do not silently include them on transfer. Standalone Salary & Tax includes personal deductions by default. Keep Existing opens the saved scenario with a clear notice that it differs from the package; cancel changes nothing. An unchanged scenario opens directly. Later Compensation edits do not silently mutate the transferred snapshot. Later shared CRA-setting changes are intentional inputs to both screens, not a frozen copied capacity ledger.

REQ-37a. Imported realized equity/ESPP amounts are already included once in the snapshot's modeled gross cash remuneration. Their source breakdown is provenance, not a second amount added to pay. Editing gross pay, workplace contributions, restrictions, or personal inclusion in Salary & Tax rebuilds employment, CPP/QPP, EI/QPIP, employment-credit bases, deductions, and cash from the edited canonical inputs; imported derived earnings totals must not remain stale overrides. Mark the snapshot Edited After Transfer when calculation inputs differ from the imported values. Original provenance can remain visible but is not presented as a current reconciled source breakdown. Manual gross edits replace the modeled aggregate cash amount without re-adding captured equity.

REQ-38. Compensation can optionally include the saved Personal RRSP Contribution and FHSA Contribution in its after-tax estimate through an explicit Include Personal Deductions control, off by default. Workplace contributions always come from that offer's own rows. Display whether personal deductions are included. Transfer carries this selection so both screens reconcile with it either on or off. Both offers share the selected personal-deduction toggle and shared CRA settings for a like-for-like comparison. Toggling personal deductions does not overwrite saved personal amounts or import Salary & Tax's workplace plans into an offer.

REQ-39. Preserve the Forecaster's explicit tax-baseline priority: when a saved Salary & Tax scenario exists, its complete normalized scenario is the automatic haircut baseline; otherwise use the primary Compensation scenario with personal deductions off. Show the selected baseline source. Never combine one scenario's income with another scenario's workplace rows. Hold resolved contribution dollars fixed for the marginal approximation and use the available table-year rules; do not claim future-year payroll precision. If the baseline is invalid or has unresolved earnings branches, the automatic haircut uses a displayed range or is unavailable with a manual-rate option. The forecast still imports bonus/equity/ESPP cash events only. Do not schedule employer retirement funding as spendable lump sums or silently subtract retirement funding from manually entered forecast cash flow. Existing manual haircut settings remain authoritative.

### 7. Persistence and legacy review

REQ-40. Migrate compensation and planner schemas with idempotent normalization on ordinary hydration, backup restoration, undo, and Drive pull. Keep old keys, unrelated planner tools, salary history, equity grants, and original legacy values. Extend existing backups instead of creating an unrelated persistence store.

REQ-41. An old package with nonzero RRSP match settings receives a preserved Legacy RRSP Estimate and Retirement Details Need Review state. Its old gross funding estimate remains visible under that label until reviewed. Do not infer an employee participation rate, destination, withdrawal restriction, or match ratio. Withhold a precise new after-tax cash result for an unresolved legacy plan. Review lets the user enter actual terms or explicitly retain an annual-dollar group RRSP estimate with required tax assumptions.

REQ-42. An old package with both match fields zero becomes no workplace plan, without a review notice. A positive percentage with a zero cap is still an ambiguous legacy plan even though its old computed funding is zero. Review completion is persisted and not reopened on every load; importing an older unresolved dataset restores its review state.

REQ-43. Existing positive CRA deduction limits remain preserved supplied amounts with Source Year Unknown and Limits Need Review, because the old schema stores no year. Pending confirmation, always use the preserved positive amount as a provisional estimate cap and label it Unverified Legacy Limit; it is not verified current-year capacity and establishes no new contribution room. Confirming a matching source year verifies that supplied amount for the scenario. A value with an explicitly different year is not used as a current-year numeric cap. With a genuinely unknown current-year limit and no provisional legacy cap, assume all modeled eligible current-year RRSP/member PRPP receipts are deductible, after the required employer PRPP treatment, and prominently label deductibility assumed; no room or legality is inferred. Old zero values migrate to unknown. Never reinterpret an old deduction limit as available contribution room. Existing RRSP and FHSA cash inputs retain their exact numbers.

REQ-44. Invalid retirement rows are not partially calculated or silently discarded. Preserve recoverable raw values, show affected-row review errors, and withhold dependent precise results. Validate finite numbers, destinations, employee percentage from 0 to 100, nonnegative contributions/caps, ordered tier intervals from 0 to 100, and nonnegative finite match ratios. Legitimate employer ratios above 100% remain allowed. Inputs do not lose precision during editing, saving, transfer, or import.

### 8. Presentation and accessibility

REQ-45. Place workplace retirement inputs in grouped sections on Salary & Tax and the existing Compensation benefits area. Keep technical plan rules in short contextual help. Short labels use clear terms such as Employee Contribution, Employer Match Rate, Match Up To, Annual Employer Cap, and Withdrawal Restrictions.

REQ-46. Retain the app's mobile layout rules, themes, modal/sheet behavior, visible labels, keyboard operation, and accessible status announcements. At 320/360/390 pixels, use stacked plan cards and wrapping results without horizontal scrolling. Comparison retirement details use the existing mobile comparison pattern. Do not ship a new final visual layout without showing a reviewable mockup first.

REQ-47. Keep the tax-year label and stale-year warning. Personal room supplied for another year must not be treated as verified capacity for the current modeled year. Users can view and correct it; estimates using unknown current-year capacity retain an assumption label.

## Testing Decisions

User-confirmed coverage: shared retirement/tax calculations and the public annual estimate and matching contract; saved-data migration through existing persisted-store/backup boundaries; and browser tests for both calculator screens. The user confirmed this coverage on 2026-10-10. No expanded payroll-withholding scope is assumed without a user request. Assert externally observable amounts, assumptions, errors, persistence, and reconciliation rather than component internals or private helper call order.

Use existing annual Canadian tax test fixtures and calculator component tests as prior art. Add high-level browser coverage for both routes, the edit sheets, comparisons, and Full Breakdown. Freeze dates and supply deterministic stock/FX values; tests must not depend on live quote services.

### Acceptance matrix

| ID | Scenario | Required observable result |
| --- | --- | --- |
| A01 | $100,000 cash pay, $5,000 employee + $5,000 employer group RRSP, adequate capacity | Employment income $105,000; RRSP deduction $10,000; income before other deductions $95,000; employee cash outflow $5,000; retirement funding $10,000 |
| A02 | Same contribution amounts to DC RPP, known zero RRSP capacity | Employment income $100,000; RPP deduction $5,000; RPP deduction is unaffected by zero RRSP capacity; estimated ordinary PA $10,000 affects following year |
| A03 | $5,000 employee RRSP + $5,000 employer DPSP | Current RRSP usage $5,000; employee deduction $5,000; ordinary estimated DPSP PA $5,000; employer money does not enter cash or employment income |
| A04 | $5,000 member + $5,000 employer PRPP; deduction limit $12,000 | Employer money excluded from income/deduction; remaining member deduction capacity $7,000; member deduction $5,000; combined room usage $10,000 |
| A05 | 50% match through 6% of $100,000 eligible pay | $0/$3,000/$6,000/$8,000 participation earns $0/$1,500/$3,000/$3,000 employer match; a zero employer cap gives zero |
| A06 | Tier 1: 100% through 3%; tier 2: 50% from 3% through 6%; employee $6,000 | Employer funding $4,500 before any cap, with employee dollars counted once across tiers |
| A07 | Unconditional employer $2,000 with zero employee participation | Employer funding $2,000 if no lower cap; no invented employee cash deduction |
| A08 | $50,000 cash pay + $2,500 employer group RRSP, restricted versus withdrawable | CPP/QPP earnings $52,500 in both; EI earnings $50,000/$52,500; Quebec QPIP follows the same restricted/unrestricted distinction |
| A09 | Ordinary registered employer RPP/DPSP/PRPP/VRSP contribution in Quebec | No additional employment income or QPP/QPIP/EI earnings attributable to that employer contribution, under the audited ordinary-plan classification |
| A10 | Employer group RRSP restriction unknown below earnings maxima | Range/uncertainty propagates through income tax, EI/QPIP, cash, savings and derived helpers; no unqualified single branch; transfer preserves uncertainty |
| A11 | Deduction limit known zero, room unknown | RRSP/member PRPP deduction zero; actual contributions retained; room is unknown rather than a fabricated known zero |
| A12 | Deduction limit $15,000, available contribution room $11,000, new modeled RRSP total $12,000 | New contribution-room excess $1,000; eligible modeled deduction $12,000; app does not confuse excess-room status with deduction capacity |
| A13 | Deduction limit $6,000, employee RRSP $7,000 + employer RRSP $3,000 | Aggregate deduction $6,000; full employee cash outflow $7,000 retained; actual retirement funding $10,000 retained |
| A14 | DB current-service employee contribution $8,655.32 with unknown employer funding and PA | Exact entered employee deduction/outflow; unknown employer funding/PA labeled; no invented pension valuation or match |
| A15 | Workplace contribution added at provincial adjustment/bracket boundaries | Tax total, marginal breakdown, taxable-income fills, efficiency, premium, and cash results all reconcile to the same context |
| A16 | No workplace plans and personal deductions off | Existing annual tax results retained within rounding tolerance, with no phantom employer funding or employee deduction |
| A17 | CAD salary/retirement with USD equity and resolved 1.35 rate | Both offers, totals, deltas, and transferred CAD values use the same conversion once; retirement CAD amounts unchanged |
| A18 | USD stock valuation cannot be converted | Combined CAD/tax/transfer result unavailable as specified; known native/cash-only figures stay visible; no USD-as-CAD tax estimate |
| A19 | Full Breakdown replaces a saved workplace scenario | Pay and workplace rows update atomically; personal deductions/limits retained; no old row duplication; cancellation preserves every saved value |
| A20 | Transfer with Include Personal Deductions on, then repeat off with nonzero saved personal amounts | Both calculators produce the same annual cash/tax/workplace results under each selection; off retains saved values but excludes them explicitly; changing a shared room setting updates both |
| A21 | Persisted primary and comparison, then reload/restore/undo | Retirement terms, unknown/zero/year states, legacy review, exact amounts, and both offers survive; repeated normalization is unchanged |
| A22 | Legacy match 5%, cap $4,000, $100,000 salary | Old $4,000 gross estimate retained and labeled legacy; participation/destination are not inferred; precise new cash estimate requires review |
| A23 | Automatic forecast haircut after RPP/RRSP changes | Uses retirement-aware fixed-contribution marginal context; no employer retirement lump sum appears; manual haircut unchanged |
| A24 | All supported provinces/territories, low and above-ceiling earnings | Correct public pension identity and employer-benefit classification; employee deductions never lower statutory earnings; new tax behavior changes only supported retirement context |
| A25 | 320/360/390-pixel layouts, keyboard-only flows, themes | Inputs, plan cards, help, errors, comparison, and result labels are usable without horizontal scrolling; announced errors have associated labels |
| A26 | Frozen October 2026 Next 1 Year case, then January 2027 without a tax-table update | Annualized 2026 basis and hypothetical room usage stay explicit; stale table warning appears in January; a 2027 CRA limit is not silently used with 2026 tax rules |
| A27 | Legacy CRA limit $6,000 with no source year and $10,000 eligible receipts; repeat with known-zero/matching-year, explicit stale year, and negative available room | Legacy estimate deduction $6,000 with unverified-cap warning; confirmed zero deduction $0; explicit stale-year limit not used so unknown-capacity estimate assumes $10,000 deductible and labels that assumption; negative room shows an existing deficit; all saved numbers survive |
| A28 | Deduction limit $15,000, new room $11,000, modeled new deposits $10,000 | Additional new-deposit suggestion limited to $1,000 despite $5,000 remaining deduction capacity; wider efficiency bands labeled hypothetical |
| A29 | Match tier from 3% to 6%, employee dollars at 3%/4%/6%, then zero eligible earnings | Unmatched first 3% earns nothing; exact interval boundaries yield correct incremental amounts; no divide-by-zero; annual-dollar employee funding retained at zero eligible earnings |
| A30 | Unconditional employer $2,000 plus conditional match $3,000, combined cap $4,000 | Employer funding $4,000, not $5,000; employee outflow unchanged; zero cap produces zero |
| A31 | Both offers have different workplace rows; toggle/reset/reload; saved Salary & Tax absent/invalid | Offer ownership and persisted toggle preserved; reset does not clear shared limits; Forecaster selects one complete baseline or explicit unavailable/manual state |
| A32 | Compensation includes salary, bonus, RSU vest value, ESPP gain, and employer RRSP | Transfer preserves the disclosed realization assumption, classified earnings/credit bases, and total workplace funding; all cash/tax results reconcile with personal inclusion both on and off |
| A33 | Restore old income-tax/take-home-pay inputs, cap-only legacy data, positive-percent/zero-cap, malformed rows, reviewed typed plan retaining old scalars | Old seeding still works; unresolved data explicitly reviewed; typed plan discriminator prevents legacy scalars reopening completed review; no NaN, negative funding, or silent row deletion |
| A34 | Confirmed ordinary plan compensation $50,000 with $9,000/$9,001 DC or DPSP credit | $9,000 equals the earnings bound; $9,001 produces an earnings warning; changing match-eligible salary alone does not change statutory compensation |
| A35 | High enough confirmed compensation, DC credit at $35,390/$35,391 and DPSP at $17,695/$17,696; two ordinary DC/DPSP rows together over $35,390 | Equal ceilings accepted in the ordinary check; above ceilings warned; combined employer credit warning catches individually smaller rows; actual contributions preserved |
| A36 | PRPP employer funding $33,810/$33,811 in 2026 with member direction absent/present | Above-dollar funding flags Member Direction Needed when absent; direction clears that particular condition without clearing personal contribution-room warnings |
| A37 | Registered-plan compensation unknown, or mixed provisions outside the ordinary aggregate model | Dollar-bound warnings remain; earnings/aggregate checks explicitly unverified; estimated equity is not silently treated as statutory plan compensation |
| A38 | Transfer a mixed salary/equity/group-RRSP scenario, then edit gross pay, employer RRSP and restriction in Salary & Tax | Each edit rebuilds earnings, credits, tax, deductions and cash; no captured equity is added twice and no stale imported earnings remain; Edited After Transfer makes the intentional divergence clear |

Exact income-tax golden cases must be grounded independently in current CRA/provincial rules or the existing audited fixtures, not generated by calling the function under test. Contribution examples above intentionally isolate retirement arithmetic from other tax deductions and credits. Verify statutory employee differences below contribution maxima as well as saturation cases.

Before release, run the repository's full verification command after the final changes and reviews. Document browser coverage and any explicit remaining assumptions. Focused tests passing is not release approval.

## Out of Scope

- Exact pay-period withholding, pension payroll remittance, payslip reproduction, multiple-employer reconciliation, age elections, or differing residence/employment provinces.
- DB pension valuation, pension-income forecasting, benefit accrual calculation, buybacks/past service, actuarial employer contribution estimates, pension transfers, and foreign/unregistered plans.
- Automated CRA room discovery, next-year room generation, deduction carryforward optimization, complete contribution legality checks, and excess-tax calculation.
- Multiple-employer registered-plan aggregation, non-arm's-length employer relationships, prescribed compensation adjustments, and general legal-capacity certification.
- Retirement account balances, account transactions, investing returns, withdrawal planning, and automatic retirement deposits into Forecaster or dashboard accounts.
- Enrollment-date/per-pay matching, actual deposit/vesting schedules, annual true-up, and changes to equity taxation beyond the currency/cash assumptions necessary for consistent retirement estimates.
- New tax brackets or unrelated calculator refactoring. A newly confirmed existing tax defect is recorded separately unless it prevents correct retirement treatment.

## Further Notes

### Source and audit traceability

The source audit and app audit supersede weaker wording in the first research note. Requirements use ordinary registered plans with valid current-service contributions. Legislative interpretation must be identified as such; neither the research nor this specification constitutes a complete payroll compliance engine.

- [Original research and worked examples](../../research/canadian-retirement-contributions.md)
- [Independent source audit](../../research/2026-10-10-retirement-source-audit.md)
- [Independent app audit and consumer map](../../research/2026-10-10-retirement-app-audit.md)
- [Independent specification review and resolved findings](../../research/2026-10-10-retirement-spec-review.md)
- [CRA employer contribution classification](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/benefits-allowances-chart/saving-pensions.html)
- [CRA RRSP deduction-limit rules](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html)
- [CRA annual registered-plan limits](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html)
- [RPP statutory compensation definition](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.1.html)
- [DPSP compensation definition and credit limits](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.html)
- [CRA Canada employment amount base](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31260-canada-employment-amount.html)
- [Revenu Quebec eligible work income](https://www.revenuquebec.ca/en/definitions/eligible-work-income/)

### Review and delivery boundary

The independent fresh-context review recorded ten findings across the initial review and re-review. All ten were resolved and the final narrow review found no new actionable contradiction. The review closes specification findings only; it does not approve application implementation or release. The existing app baseline passed 205 relevant tests across 14 files, as recorded in the app audit. The 38 acceptance cases in this specification remain implementation requirements, not executed new-feature tests.

This document is the local proposed specification. No issue publication, implementation plan, application changes, deployment, or release is authorized by writing it. Before implementation, review the spec, show the proposed new input/result layout, and resolve any requested scope changes. Testing coverage is user-confirmed as recorded above; this confirmation does not authorize implementation.
