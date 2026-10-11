# Retirement specification contradiction review

Date: 2026-10-10. Fresh-context, read-only review of the proposed specification and the independent source/app audits. Only this report was written. No application, specification, persistence data, or tests were changed. Findings refer to requirement IDs so that later editorial changes do not invalidate references.

Initial verdict: revise before implementation planning. The main separation of cash, employment income, retirement funding, deduction capacity, and contribution room is sound. The findings below record the initial review. See the re-review disposition at the end for their current status.

## Findings

### F1. P1: A rolling compensation period has no defined tax-year or room basis

Evidence: REQ-01, REQ-16, REQ-28/29, REQ-34, REQ-47, A20. `src/store/useCompensationStore.ts` defines Next 1 Year as a date-to-date RSU window, with current base salary annualized. The spec simultaneously requires a single tax year, annual statutory ceilings, scenario-opening CRA room, and year-matched verified capacity.

Example: a Next 1 Year scenario opened in October 2026 spans 2026 and 2027. Treating its full retirement funding as actual 2026 new contributions against 2026 available room would be false. Transferring this amount into a calendar-year Salary & Tax scenario would silently change its meaning.

Revision: explicitly retain one annualized comparison using the selected supported tax-table year, label Next 1 Year cash/tax as an annualized estimate using that year's rules, and describe room usage as a hypothetical single-year scenario, not actual rolling-period compliance. Transfer the estimate basis and tax-table year with the snapshot. Do not invent 2027 tables or split statutory ceilings across calendar years. Add a frozen October date case and a January rollover case showing that stale CRA values lose verified status while their numbers remain available for correction.

### F2. P1: Unknown RRSP restrictions affect income tax, not only EI/QPIP and cash

Evidence: REQ-24 says income tax can still be shown while EI/QPIP and final cash show a range. REQ-27 and `src/utils/finance/canadaTax.ts` show that EI/QPIP premiums feed federal credits and that EI also feeds ordinary non-Quebec provincial credits. Below premium maxima, the restricted and withdrawable branches therefore change income tax too.

Revision: calculate complete restricted and withdrawable annual results, including statutory contributions, their associated credits, income tax, and cash. Any derived scalar with unequal branch values must display a range or an unresolved state. Apply this rule to marginal results, contribution savings, efficiency displays, comparison deltas, Full Breakdown, and automated forecast haircut as applicable. Do not pair one branch's income tax with another branch's cash. An equal result may collapse visually while retaining the unresolved restriction flag. Extend A10 to assert income-tax uncertainty as well as cash uncertainty.

### F3. P1: Cash and transferable taxable equity context are not specified together

Evidence: REQ-01 independently classifies earnings, REQ-18 promises Cash After Contributions, and REQ-36 transfers cash employment remuneration and workplace rows. The app audit records RSU/ESPP values inside the current compensation tax total. The current code in `CompHeroWidget.tsx` sends `calcTotalComp` to the tax hook; that total includes equity value. A snapshot containing cash pay and retirement rows alone cannot reproduce an equity-including Compensation tax calculation as promised by A20.

Revision: state the precise equity realization assumption retained by the annual compensation estimate. Either disclose that valued RSU/ESPP benefits are assumed realized and included in modeled cash remuneration, or retain them as separately identified taxable noncash benefit components with corresponding tax/credit earnings bases. Carry every tax-relevant component and the assumption into Full Breakdown. If the product chooses a cash-only comparison, explicitly exclude equity from both compared tax estimates and label the remaining package valuation separately. Add a transfer case with salary, bonus, RSUs, ESPP, and group RRSP; check cash, taxable employment income, payroll earnings, package value, and tax equality separately.

REQ-27 should also specify ordinary credit bases rather than leave them to implementation inference. Employer group RRSP benefits are employment income for the Canada employment amount and ordinary current-employment Quebec worker deduction; employee retirement deductions do not reduce these employment-income bases. Registered employer RPP/DPSP/PRPP funding is excluded from those bases under the audited classification. This matters at low earnings, where credits have not saturated. The [CRA Canada employment amount rules](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31260-canada-employment-amount.html) use employment-income lines 10100/10400. [Revenu Quebec's eligible-work-income definition](https://www.revenuquebec.ca/en/definitions/eligible-work-income/) includes employment income with listed exclusions, including solely taxable benefits from previous employment. These sources establish the bases, not the specification's 2026 indexed numerical constants.

### F4. P2: Legacy positive CRA values have no recoverable year

Evidence: REQ-43 preserves positive old deduction limits as known; REQ-28/47 require year-tagged limits. Existing flat `salary-tax` inputs have a scalar limit and no source year. An upgrade cannot prove that a positive saved value belongs to the current modeled year. Assigning the current year during migration would manufacture verification.

Revision: preserve a legacy positive amount as a known supplied value with year unknown and a review state. Do not apply it as verified modeled-year capacity until the user confirms its year. Old zero remains unknown as specified. Clearly define numeric known/unknown separately from usable-for-selected-year status. Test positive legacy values with no year, known zero with a matching year, stale positive values, and a negative supplied available contribution-room value through local hydration, backup, and Drive restore.

### F5. P2: Efficiency suggestions can exceed known new-contribution room

Evidence: REQ-11 requires the existing RRSP efficiency feature to use retirement-aware tax context, while REQ-30/31 distinguish deduction capacity from contribution room. The app audit describes efficiency as suggesting further shelter contributions. A person can have more deduction capacity than new-contribution room because prior contributions already used room.

Example: deduction limit $15,000, available contribution room $11,000, new deposits $10,000. Remaining deduction capacity is $5,000, but only $1,000 of additional new deposits fits the supplied room. A $5,000 contribution suggestion based on deduction capacity alone would conflict with REQ-31, even though the tax calculation of that hypothetical deduction is possible.

Revision: distinguish hypothetical deduction-efficiency bands from actionable additional-contribution suggestions. For new deposits, use the lesser of remaining deduction capacity and nonnegative remaining available contribution room, when both are known and year-matched. Unknown room must remain visibly unverified; it cannot turn a tax-savings band into a verified contribution recommendation. Do not introduce an undeducted-receipt optimizer. Add this exact differing-capacity case to the acceptance matrix.

### F6. P2: Supported-plan statutory warning math is incomplete

Evidence: REQ-34 names DC/DPSP money/earnings bounds but does not define their compensation basis, aggregate treatment, or PRPP warning. The source audit expressly adds the PRPP employer annual RRSP-dollar restriction with a member-direction exception. The included plan list supports PRPP/VRSP, so omitting this qualification weakens the claim that supported-plan ceilings are covered.

Revision: specify ordinary DC/DPSP warning formulas and their stated registered-plan compensation basis, separately from contractual match-eligible earnings. Disclose that independently checking multiple provisions is not complete aggregate PA/legal eligibility validation. Add an employer PRPP/VRSP warning above the selected year's annual RRSP dollar limit, explicitly qualified by the member-direction exception; preserve the actual amount and contractual matching. If that warning is deferred, explicitly scope REQ-34 to DC/DPSP and name the PRPP limitation. Add below/equal/above-ceiling examples and a low-salary earnings-bound example. No extra plan-administration UI is needed merely to report this limitation.

### F7. P2: Interval math needs a zero-earnings rule and exact invalidity boundary

Evidence: REQ-13/14 and A05/A06 correctly describe incremental tiers but do not settle zero eligible earnings, zero-width tiers, or interval gaps. Annual dollar participation with zero eligible earnings is permitted by the surrounding requirements; dividing contributions by eligible earnings would produce an undefined ratio.

Revision: define each match as `ratio * max(0, min(employeeDollars, upperPercent * eligibleEarnings / 100) - lowerPercent * eligibleEarnings / 100)`. Sum the tiers, add the specified unconditional annual amount, then apply the optional combined cap. Require `0 <= lower < upper <= 100`; allow explicitly unmatched gaps; reject overlaps rather than repairing them silently. For zero eligible earnings, percentage participation and conditional tier match are zero, dollar participation is retained, and unconditional annual dollars remain eligible subject to the cap. Add gap, exact-boundary, zero-earnings, and unconditional-plus-cap cases. The current two-tier $4,500 example is arithmetically correct.

### F8. P2: Shared profile changes, personal toggle, and forecast fallback need explicit ownership

Evidence: REQ-03 shares province and limits; REQ-37 preserves personal inputs and shared limits; REQ-38 adds a shared offer toggle; REQ-39 changes forecast tax context. Existing `useForecasterSettings.ts` selects saved Salary & Tax income when nonzero and otherwise falls back to Compensation base salary. Once each calculator owns different workplace rows, mixing fallback pay with unrelated saved workplace deductions is possible. The persistence requirements also do not say whether the new toggle is saved or reset.

Revision: define one authoritative persisted location for shared province/year-tagged limits, their reset behavior, and the persisted Include Personal Deductions state. Full Breakdown preserves those shared settings and personal amounts, but its review must show the personal deduction inclusion difference when Compensation's toggle is off. For the forecast, use the complete valid standalone Salary & Tax context when selected, or a complete Compensation fallback context; do not mix pay from one owner with workplace rows from another. Unknown/invalid retirement context must produce an explicit unavailable or assumption state for automatic haircut, while a manual rate remains usable. Add acceptance coverage for two offers with different rows, toggle off/on, reset, reload, forecast fallback, and invalid/unknown contexts.

## Non-blocking acceptance and scope notes

- A21 should explicitly exercise the older `income-tax` / `take-home-pay` seeding path, raw malformed rows, positive-percent/zero-cap legacy estimates, cap-only legacy data, and reviewed typed rows retaining original legacy scalars. A store-version/type discriminator must stop preserved old scalars from reopening review on every normalization. REQ-40/44 already support preservation; these examples make it verifiable.
- DB employer funding unknown and DB PA unknown are appropriately distinct from zero. The review found no need to estimate an actuarial pension value or add an automatic retirement funding forecast.
- The source audit has already resolved the ordinary Quebec registered-plan classification. REQ-25 and the document status can record that conclusion and its statutory-interpretation qualification instead of appearing to retain an unresolved research hold.
- Keep advanced tiers, annual earnings overrides, PA detail, and uncommon plan help within the existing grouped retirement sections. The specification does not require a separate retirement dashboard or a dense expanded form for every plan. Its mockup-before-implementation boundary is appropriate.
- REQ-30, REQ-31, REQ-32, and A12 correctly allow a deduction-capacity result to differ from new-contribution room. Do not revise A12 to cap all deductions at available contribution room, and do not add prior undeducted amounts to new cash outflow.

## Verification boundary

Reviewed the three requested documents and narrow calculation, transfer, persisted planner, compensation period, backup, and forecast consumers. Live primary sources were checked only to confirm credit-income bases. This report is a specification review, not a fresh certification of all legal tables, an implementation test run, or release validation. The app audit's prior passing tests remain evidence of existing behavior only.

## Re-review disposition

Re-reviewed the revised specification including A26 through A37 and the source audit's statutory-compensation follow-up on 2026-10-10. No implementation was inspected or changed during this follow-up.

| Initial finding | Disposition | Revised evidence |
| --- | --- | --- |
| F1 | Closed | REQ-16 makes both tax results annual equivalents under the available 2026 rules; REQ-36 carries effective year and source time mode; A26 covers October and stale January behavior. |
| F2 | Closed | REQ-24 now propagates complete restricted/withdrawable branches through tax, cash, savings and helpers; A10 preserves uncertainty in transfer. |
| F3 | Substantially addressed; F9 remains | REQ-01/20/27/36 specify realization assumptions, separate cash/benefit/credit bases, and a full snapshot; A32 checks on/off inclusion. Editing that rich snapshot is still unspecified. |
| F4 | Substantially addressed; F10 remains | REQ-43 preserves a source-year-unknown amount with review and disallows verified current-year status. Whether that amount actually caps the provisional calculation remains optional. |
| F5 | Closed | REQ-11 bounds additional-deposit suggestions using both capacities and identifies hypothetical bands; A28 asserts the $1,000 result. |
| F6 | Closed within the stated ordinary-plan scope | REQ-34/34a supply ordinary individual and aggregate warning formulas, confirmed statutory compensation, and unverified states; REQ-35a adds PRPP member direction. A34 through A37 cover these cases. The source audit identifies the separate RPP/DPSP definitions and warns against using approximate equity as confirmed statutory compensation. |
| F7 | Closed | REQ-13/14 supply exact intervals, gap handling, zero-earnings behavior and combined cap; A29/A30 cover boundaries. |
| F8 | Closed | REQ-03a/37/38 define shared profile, persisted inclusion and reset behavior; REQ-39 uses one complete baseline with source indication and invalid/uncertain behavior; A20/A31 cover ownership and persistence. |

### F9. P2: Editing a rich transferred scenario has no recomputation rule

Evidence: REQ-05/06 permit immediate gross-pay and workplace edits in Salary & Tax. REQ-36 now transfers classified earnings and credit bases along with cash, taxable benefits, and equity-sale assumptions, but neither REQ-36/37 nor A32 says how those imported bases respond to later edits.

Example: transfer $100,000 salary, $20,000 realized-as-cash equity, and $5,000 employer RRSP. Employment income is $125,000 while modeled cash is $120,000. Later changing the cash-pay input to $130,000 must not leave employment income at $125,000, or add the inherited $20,000 equity on top of that new total a second time. Changing the employer RRSP row must also rebuild pensionable earnings, applicable EI/QPIP branches, and employment-credit bases.

Revision: define which remuneration components are editable and make all classified bases derived from the edited remuneration components and workplace rows. If the existing gross input edits total modeled cash, its replacement is the new total, not an amount added to preserved imported equity. Preserve the disclosed sale assumption and provenance or explicitly convert to a standalone scenario with a reviewable change; never retain stale derived bases. Fixed annual-dollar workplace amounts stay fixed unless edited. Add edit-after-transfer checks for cash-pay, employer RRSP, restriction changes, personal inclusion, reload, and a second transfer. These checks must assert cash and tax reconciliation as well as provenance.

### F10. P2: Provisional legacy and unknown-capacity deductions still lack one numeric policy

Evidence: REQ-26 says unknown limits leave deductibility assumed. REQ-43 allows any displayed provisional cap to be labeled an unverified legacy assumption, but does not require or prohibit using it. A27 checks preservation/review states without an amount assertion.

Example: preserved legacy limit $6,000 with source year unknown and $10,000 new RRSP receipts can yield either a provisional $6,000 deduction using the old cap or a $10,000 assumed deduction after treating its year as unknown. Both appear permitted by the text, so identical restored data need not produce one defined result.

Revision: choose one deterministic policy. To preserve the old estimate, use the positive year-unknown legacy amount as an explicitly unverified provisional deduction cap until year confirmation. A value with an explicitly mismatched year is not a numeric current-year cap. Specify the unknown-current-year default too, for example assuming all modeled eligible new receipts deductible after the employer-PRPP rule while retaining an unverified-capacity label, or withholding an amount until a user chooses an assumption. Do not present either branch as verified. Extend A27 to assert the exact provisional allowed deduction, the result after year confirmation, and the result after explicitly assigning a mismatched year.

Second-pass verdict: two P2 specification clarifications remained at that revision. No original P1 finding remained. The final narrow disposition below supersedes that second-pass status.

## Final narrow disposition

Re-reviewed REQ-37a, REQ-43, A27 and A38 on 2026-10-10 against the adjoining gross-pay, transfer, capacity, and stale-year requirements. Both remaining findings are closed at the specification level.

| Finding | Final disposition | Evidence |
| --- | --- | --- |
| F9 | Closed | REQ-37a explicitly treats imported equity/ESPP breakdown as provenance within the existing modeled cash total, replaces that total on manual gross edits, and rebuilds earnings, credits, deductions and cash from canonical edited inputs. It prevents stale earnings overrides and marks intentional divergence Edited After Transfer. A38 verifies gross, employer RRSP and restriction edits without duplicated equity or stale bases. |
| F10 | Closed | REQ-43 always applies a preserved positive year-unknown legacy amount as a provisional unverified cap. Matching-year confirmation verifies the supplied amount; an explicitly stale year removes it as a numeric current-year cap. Genuinely unknown capacity assumes modeled eligible new receipts deductible under a prominent assumption label. A27 asserts the $6,000 provisional, $0 confirmed-zero and $10,000 stale-year/unknown-capacity examples. Contribution room remains independently unknown or supplied. |

No new actionable contradiction was found in these edits. REQ-37a is consistent with REQ-05 because modeled cash remuneration excludes the separately classified employer RRSP benefit. The provisional legacy cap is consistent with REQ-47 because its numeric use is expressly unverified; it does not invent a source year or new-contribution room. REQ-26/30 still apply the employer PRPP capacity treatment and the existing deduction allocation convention.

Final verdict: all F1 through F10 are resolved within the stated annual-estimator scope. The proposed specification can be handed back for user review and later implementation planning. This is specification closure, not approval of application behavior, legal-capacity certification, implementation, or release. No app changes, tests, or commits were made by this review.
