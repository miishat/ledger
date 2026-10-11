# Canadian retirement contributions for Salary & Tax and Compensation

Research date: October 10, 2026. Scope: employment contributions and employer matching, annual tax estimates, and the distinctions needed before implementation. Primary sources are CRA, Revenu Québec and FCAC. This document is research, not an implementation plan or a complete payroll compliance specification.

Re-audited October 10, 2026. The [independent source audit](2026-10-10-retirement-source-audit.md) resolves the earlier Quebec registered-plan QPP uncertainty and adds carryforward/PRPP qualifications. The [independent app audit](2026-10-10-retirement-app-audit.md) adds scenario-transfer, comparison, persistence and forecast findings. The [feature specification](../superpowers/specs/2026-10-10-retirement-contributions-design.md) defines proposed behavior; no application implementation was performed.

## 1. Identify the actual plan before calculating

“RSP” is an informal label. Use the registered plan type: group RRSP, registered pension plan (RPP) with defined contribution (DC) or defined benefit (DB) provision, deferred profit sharing plan (DPSP), or pooled registered pension plan (PRPP). Québec voluntary retirement savings plans (VRSPs) are similar to PRPPs. DC plans specify contributions; DB plans promise a pension based on a benefit formula. A group RRSP is an individual RRSP funded through payroll, with possible employer contributions. The employer's plan documents determine eligible earnings and match rules. [FCAC: Employer pension plans](https://www.canada.ca/en/financial-consumer-agency/services/retirement-planning/employer-sponsored-pension.html)

CPP/QPP are public pension deductions already calculated from employment earnings. They must remain separate from workplace retirement contributions. Employer CPP/QPP contributions are statutory employer costs, distinct from a voluntary retirement match. [CRA: CPP contribution calculation](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums.html)

## 2. Federal annual treatment

| Plan destination | Employee deduction | Employer amount in employee employment income | Effect on retirement room |
| --- | --- | --- | --- |
| Group RRSP | Deductible RRSP contribution, within personal deduction capacity | Yes | Employee and employer contributions consume current RRSP contribution room |
| DC RPP | Employee RPP deduction | No | Current PA generally includes employee plus employer contributions; reduces following year's newly earned RRSP room |
| DB RPP | Employee RPP deduction | No | PA reflects pension benefits accrued, rather than employee or employer cash contributions |
| DPSP | Employee contributions prohibited | No current employment income inclusion | Employer contribution and allocated forfeitures create PA for following year |
| PRPP, including qualifying VRSP | Member deduction within shared RRSP capacity | No | Employer contributions use current RRSP capacity; employee deduction capacity is reduced by employer PRPP contributions |

Employee RPP contributions generally appear in T4 box 20 and are deducted at federal line 20700. Past service before 1990 has special limits and should not share an ordinary current-service input. [CRA: RPP deduction](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-20700-registered-pension-plan-rpp-deduction.html)

Employer RRSP contributions are taxable benefits; employer contributions to registered RPPs and qualifying PRPPs are excluded. Employee amounts withheld from salary are employee contributions, not an additional employer benefit. Administration fees can have different taxable treatment from contributions. [CRA: Contributions to savings and pension plans](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/benefits-allowances-chart/saving-pensions.html)

RRSP/member PRPP deductions belong at federal line 20800. Deductible contributions reduce income tax; withdrawals are generally taxable. Contribution receipts and the tax deduction are still required when payroll already allowed withholding relief. [CRA: RRSP deduction](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-20800-rrsp-deduction.html), [CRA: Claim contributions](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/claim-your-rrsp-prpp-contributions-on-your-tax-return.html)

DPSPs accept employer payments and allocated forfeitures, not employee contributions. Annual allocations are constrained by the lesser of 18% of compensation and half the money purchase limit. Employer amounts vest after two years of membership or earlier under the plan. A paired employee RRSP/employer DPSP arrangement therefore needs two destinations. [CRA: DPSP contributions](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/deferred-profit-sharing-plans/contributions.html)

PRPP employer amounts are neither employment income nor an employee deduction. They reduce current unused RRSP deduction room; combined member RRSP/PRPP contributions also share the excess-contribution calculation. [CRA: PRPP contributions, benefits and transfers](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pooled-registered-pension-plans-prpps/contributions-benefits-transfers.html), [CRA: PRPP employer questions](https://www.canada.ca/en/revenue-agency/services/tax/pooled-registered-pension-plan-prpp/pooled-registered-pension-plan-prpp-questions-answers-employers.html)

An additional PRPP registration rule restricts annual employer funding above the year's RRSP dollar limit unless the member directs the excess contribution. This is distinct from the member's assessed room; do not treat it as an unconditional personal contribution ceiling. [Income Tax Act 147.5(3)(c)](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.5.html)

## 3. Earnings bases and Québec

Employee RRSP or RPP deductions reduce deductible income, not the original salary used for CPP/QPP, EI or QPIP. Gross employment earnings and pensionable/insurable earnings are separate from income after retirement deductions. CRA describes pensionable earnings as employment remuneration, including applicable benefits. [CRA: Pensionable and insurable earnings](https://www.canada.ca/en/revenue-agency/services/tax/canada-pension-plan-cpp-employment-insurance-ei-rulings/cpp-ei-explained/canada-pension-plan-employment-insurance-explained-10.html)

Employer group RRSP contributions are CPP pensionable. EI depends on withdrawal rights: ordinarily withdrawable contributions are cash benefits and insurable; contributions that cannot be withdrawn before retirement or employment termination are non-cash benefits and not insurable. HBP/LLP access alone does not defeat the restricted-plan exception. The distinction does not remove the taxable benefit or CPP treatment. [CRA: Employers' taxable benefits guide, RRSP section](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4130/employers-guide-taxable-benefits-allowances.html)

Québec employer RRSP contributions and related administration costs are taxable benefits reported in RL-1 boxes A and L, with G/I where applicable. [Revenu Québec: Employer RRSP contributions](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/taxable-benefits/list-of-taxable-benefits/other-benefits/rrsp-contributions-made-by-the-employer/)

Employer RRSP contributions are QPP pensionable. Québec QPIP has a matching withdrawal restriction exception: restricted group RRSP contributions, allowing only HBP/LLP exceptions, are not subject to QPIP. Otherwise include applicable employer RRSP contributions in QPIP earnings. Direct employer remittance to the RRSP issuer is exempt from Québec source income tax deductions. [Revenu Québec: Other benefits, RRSP row and notes 9 and 10](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/taxable-benefits/list-of-taxable-benefits/other-benefits/)

Employer RPP, DPSP, PRPP and VRSP contributions are not Québec taxable benefits. [Revenu Québec: Contributions to certain plans](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/in-certain-situations/taxable-benefits/list-of-taxable-benefits/other-benefits/contributions-made-and-other-amounts-paid-by-employers-to-certain-plans/)

Re-audit resolution: the “Other benefits” aggregate plan row has an overbroad QPP footnote. Reading Quebec Pension Plan Act section 45 with Taxation Act sections 38, 47.6, 47.9, 852 and 870 supports excluding ordinary employer registered RPP/DPSP/qualifying PRPP funding from additional QPP earnings. Registered DPSPs are not the unregistered profit-sharing arrangements added by section 45(b). This is a statutory interpretation, corroborated by Retraite Quebec's plan-specific guidance, not a blanket inference that all non-taxable benefits escape QPP. See the [source audit's statutory analysis and official corroboration](2026-10-10-retirement-source-audit.md#quebec-determination). Unregistered arrangements remain excluded from this research scope.

## 4. Annual tax liability is different from paycheque withholding

For federal payroll, deductible employee RPP contributions reduce remuneration subject to income tax withholding. Employee and employer RRSP contributions and member PRPP contributions can reduce withholding when the employer has reasonable grounds that the employee can deduct them. Direct payroll RRSP remittance does not ordinarily require a T1213 letter; separately arranged personal RRSP contributions generally need CRA authorization to change withholding. [CRA: Employers' payroll guide, reducing remuneration and RRSP withholding](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001/employers-guide-payroll-deductions-remittances.html)

Québec subtracts employee RPP contributions and employee RRSP/VRSP/PRPP contributions withheld and sent directly to the administrator from remuneration for source income tax. A separately authorized reduction uses TP-1016-V. These are withholding rules, not an extra annual deduction. [Revenu Québec: Reducing remuneration](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/source-deductions-of-quebec-income-tax/reducing-the-remuneration-subject-to-source-deductions/)

Calculator implication, derived from these rules: show “Estimated Annual Tax” and “Cash After Contributions” separately. A personal RRSP paid outside payroll may lower final annual liability while leaving the current paycheque unchanged. Do not label annual estimated savings as an assured refund or payroll withholding amount. Deduction relief already received during payroll must not be added again as a second tax saving.

## 5. 2026 limits and room timing

| Parameter | 2026 value | Meaning |
| --- | --- | --- |
| RRSP annual dollar limit | $33,810 | Ceiling for newly earned room before PA and adjustments, not everybody's contribution limit |
| DC RPP money purchase limit | $35,390 | Relevant combined pension allocation ceiling, also constrained by earnings |
| DPSP dollar limit | $17,695 | Half the money purchase ceiling |
| DB benefit limit | $3,932.22 | Pension benefit limit per year of service, not an employee deduction limit |
| YMPE | $74,600 | CPP/QPP first earnings ceiling |
| YAMPE | $85,000 | CPP2/QPP2 earnings ceiling |
| Published 2027 RRSP dollar limit | $35,390 | Applicable to 2027 new room |

[CRA: Registered plan limits](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html)

Ordinary DC RPP allocations are constrained by the lesser of 18% of current compensation and the money purchase ceiling, with plan terms, other pension credits and allocations also relevant. Do not cap employee RPP deductions using the RRSP dollar limit or personal RRSP room. [CRA: Money purchase registration rules](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/newsletters-technical-manual/no-91-4r.html)

Simplified ordinary RRSP deduction-limit equation, excluding connected-person cases:

```text
new_room_y = max(0, min(18% * earned_income_(y-1), RRSP_dollar_limit_y) - PA_(y-1))
deduction_limit_y = max(0, unused_deduction_room_(y-1) + new_room_y + PAR_y - net_PSPA_y)
```

A 2026 RPP/DPSP PA affects 2027 newly earned RRSP room. Salary in 2026 does not establish available 2026 RRSP room. CRA's assessed statement is preferable to inferring room from current salary. PSPA and PAR need their own timing; they are not ordinary employee contribution deductions. [CRA: How contributions affect the deduction limit](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html)

The prior unused deduction-room carryforward in this simplified equation is signed and can be negative. CRA Chart 3 preserves that negative raw balance even when the displayed deduction limit is floored at zero; reconstructing carryforward from the displayed zero would erase a deficit. [CRA T4040, Chart 3](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html)

Deduction limit and available contribution room differ when contributions were already made but not deducted. A person with a $15,000 deduction limit and $4,000 previously reported undeducted contributions ordinarily has $11,000 capacity for new contributions before accounting for further current transactions. Carrying forward a deduction does not restore contribution capacity. Employer PRPP amounts further constrain deductible member contributions. [CRA: Definitions for RRSPs](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/definitions-rrsps.html)

Current-service DC PA generally includes employee contributions, employer contributions and applicable forfeitures/surplus allocations. The usual DB pension credit is `max(0, 9 * benefit_earned_in_year - 600)`. DB integration, multiple provisions, partial-year arrangements and special plans can change the result. Use the administrator's actual PA when available. Neither PA nor employer DB funding is a reliable cash valuation of the employee's pension. [CRA: Pension Adjustment Guide, sections 5 to 7](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4084/pension-adjustment-guide.html)

First-60-day RRSP contributions have reporting/deduction-year rules. The published deadline for a 2025 deduction was March 2, 2026. This research does not rely on an unverified 2026-return deadline. Excess contributions generally attract 1% monthly tax above the applicable $2,000 allowance; that allowance is not deductible room. Mandatory qualifying group-plan contributions have special excess-tax provisions, so a simple warning must not claim to calculate the complete penalty. [CRA: Retirement registered plans guide, Schedule 7 and excess contributions](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html)

## 6. Calculator equations and examples

The following are product modelling recommendations derived from the research, not prescribed CRA payroll formulas. Assume ordinary employment, sufficient deduction capacity, current-service registered contributions and no unrelated taxable benefits. The independent source audit verifies the ordinary employer registered-plan classification, including Quebec. It does not extend these equations to unregistered arrangements or a complete payroll compliance engine.

```text
C = cash salary + cash bonus + other cash employment remuneration
E = employee retirement contribution paid from C
M = employer retirement contribution paid directly to plan
employment_income = C + employer_RRSP_M
pensionable_earnings = C + employer_RRSP_M
EI_earnings = C + employer_RRSP_M_if_withdrawable
QPIP_earnings = C + employer_RRSP_M_if_withdrawable  # Quebec
retirement_deduction = employee_RPP_E + deductible_RRSP_employee_and_employer + deductible_PRPP_member
income_before_other_deductions = employment_income - retirement_deduction
spendable_cash = C - employee_payroll_contributions - income_tax - E
employer_compensation_value = C + M + other_employer_benefits
DC_retirement_funding = E + M
```

Income tax credits, enhanced CPP/QPP deductions and other tax features must still be computed from their proper inputs. Employment income can also affect credits independently of taxable income. Employer contributions never become spendable cash merely because they appear in employment income. Employee contributions are already part of salary and must not be added again to employer compensation value.

| Scenario | Employment income | Retirement deduction | Income before other deductions | Retirement funding | Cash reduction before tax relief |
| --- | --- | --- | --- | --- | --- |
| $100,000 salary, employee $5,000 + employer $5,000 group RRSP | $105,000 | $10,000 | $95,000 | $10,000 | $5,000 |
| Same salary and contributions to DC RPP | $100,000 | $5,000 | $95,000 | $10,000 | $5,000 |
| Employee $5,000 RRSP + employer $5,000 DPSP | $100,000 | $5,000 | $95,000 | $10,000 | $5,000 |
| Employee $5,000 PRPP + employer $5,000 PRPP | $100,000 | $5,000 | $95,000 | $10,000 | $5,000 |

These rows can produce different CPP/EI/QPIP and room effects even when income before other deductions matches. At $50,000 salary with a $2,500 employer RRSP contribution, pensionable earnings become $52,500; restricted-plan EI earnings remain $50,000 while withdrawable-plan EI earnings become $52,500. Do not test only high salaries where statutory maxima conceal this difference.

For matching, distinguish a match ratio from a salary cap. Example: 50% match on employee contributions up to 6% of $100,000 eligible earnings, annual employer cap $4,000:

```text
matched_employee_amount = min(employee_eligible_contribution, eligible_earnings * 6%)
employer_match = min(matched_employee_amount * 50%, 4000)
```

Employee $4,000 produces employer $2,000; employee $6,000 or $8,000 produces employer $3,000. An unconditional 3% salary contribution is a different rule. Annual match estimates also need eligibility dates, eligible bonus treatment, tiered rates, plan destination, and any per-pay-period cap or year-end true-up. These are employer contract facts, not a universal Canadian match rule.

An official example also shows why a flat employee pension rate is insufficient for some DB plans. Federal public service Group 2 members pay 8.00% up to the 2026 YMPE of $74,600 and 10.58% above it. Assuming $100,000 of eligible salary and ordinary full-year membership, employee RPP contributions would be `74,600 * 8% + 25,400 * 10.58% = $8,655.32`, separate from CPP/QPP. Group 1 rates are 9.10% and 11.69%. Membership and service exceptions matter, including a 1% rate after 35 years of pensionable service. These are specific plan examples, not Canadian defaults. [Treasury Board: 2026 public sector pension contribution rates](https://www.canada.ca/en/treasury-board-secretariat/services/pension-plan/active-members/pension-contribution-rates-major-public-sector-pension-plans.html)

## 7. Explicit unknowns and boundaries

- Unknown personal room must be displayed as unknown. A confirmed $0 room is meaningful and cannot share the unknown representation.
- Employer plan rules must supply eligible earnings, withdrawal restriction, contribution dates, match tiers, cap, vesting and true-up. “Employer match 5%” alone is insufficient.
- DB contributions can be estimated for cash and tax effects; DB benefit valuation and exact PA need administrator information.
- Past-service buybacks, foreign plans, connected persons, corrective contributions, pension transfers, HBP/LLP repayments and detailed excess-contribution penalties require separate treatment.
- Province of employment drives payroll withholding; annual provincial liability may depend on year-end residence. An annual calculator must disclose its province assumption.
- This research supports a retirement-aware annual estimate. It does not establish exact pay-period withholding for multiple employers, partial years, age-based exemptions or unusual benefits.
- Before claiming accurate pension calculations across all Canadian provinces and plan types, resolve the Québec aggregate-table footnote against each registered plan's QPP treatment. Until then, use a clearly limited estimate or withhold unsupported Québec plan calculations rather than silently applying the generic equation.



## Ledger calculator integration findings

This section is based on a read-only inspection of the current checkout on 2026-10-10. It is a recommendation for future design, not an implementation plan or a claim that these features are present.

### Current behavior and gaps

| Area | Verified current behavior | Implication for this feature |
| --- | --- | --- |
| Salary & Tax | `src/components/planner/SalaryTaxTool.tsx` accepts RRSP/FHSA contributions and an optional CRA RRSP deduction limit. An entered zero means unknown. | Add an employee workplace RPP deduction separately from RRSP; known zero room must eventually be distinguishable from unknown. |
| Shared tax calculation | `annualSalaryTax` in `src/utils/finance/canadaTax.ts` derives tax, CPP/QPP, EI, QPIP, and employment credits from one gross-income argument. RRSP/FHSA deductions reduce taxable income, while the UI separately subtracts actual contributions from cash. | One gross figure cannot represent all group RRSP cases. Preserve separate cash, employment-income, pensionable-earnings, and insurable-earnings amounts, including provincial credit bases. |
| Compensation matching | `calcAnnualRRSP` in `src/store/useCompensationStore.ts` computes min(annual base salary x match percentage, dollar cap). No employee contribution is supplied; a zero dollar cap yields zero. | The current result is a capped salary percentage, not a participation-sensitive match. Existing values cannot tell us the employer's match ratio or the employee contribution. |
| Compensation totals | `calcTotalComp` adds employer RRSP funding to salary, bonus, equity, and ESPP benefit. | Adding employer funding to gross package value is appropriate as a compensation presentation choice. Adding the employee's own contribution again would double count salary. |
| Compensation after-tax estimate | `useTakeHomeEstimate` taxes total compensation with RRSP/FHSA deductions set to zero. `CompHeroWidget` labels resulting annual fractions Net Monthly/Net Biweekly and discloses its broad assumptions. | Group RRSP match is treated as taxable without its possible offsetting deduction and remains inside the cash-like result. Replace this approximation for retirement contributions with separately reconciled cash and retirement amounts. |
| Comparison and charts | `CompareView` and `CompHeroWidget` use the same RRSP match function in comparisons, totals, and monthly breakdowns. | Any future change must propagate through these consumers. A change to the edit form alone would leave conflicting estimates. |
| Currency | `compensationFx.ts` converts stock-related amounts; salary and current RRSP dollar cap are left unchanged. | Retirement contributions and Canadian tax/room limits should have an explicit CAD basis. Do not apply stock FX conversion to already-CAD retirement figures. |

The current annual model intentionally estimates annual employee taxes. Monthly and biweekly amounts are annual averages, not an exact paycheque or payroll withholding simulation. Preserve that scope when adding retirement inputs.

### Recommended first scope

Support group RRSP matching, defined-contribution RPP matching, and an employee-RRSP/employer-DPSP arrangement. Allow a defined-benefit RPP employee contribution as an annual dollar deduction for Salary & Tax, without inventing an employer match or pension valuation. Research covers PRPP/VRSP, but they should receive an explicit treatment or an explicit unsupported state, not be silently mapped to an RPP.

For each workplace arrangement, capture employee and employer **destinations** separately. An arrangement can contain both a workplace RPP and a group RRSP. A single generic "pension %" cannot describe that situation.

Salary & Tax should expose, conceptually:

- Employee workplace pension contribution, separate from mandatory CPP/QPP.
- Employee group RRSP contribution and additional personal RRSP contribution, with clear prevention of duplicate entry.
- Employer RRSP contribution where applicable.
- CRA deduction limit and available contribution room as distinct optional amounts, with tax year and known/unknown states.
- For employer group RRSP funding, withdrawal restrictions that determine EI and Quebec QPIP treatment.

Compensation should expose employee contribution, employer match ratio, salary percentage eligible for matching, optional employer dollar cap, and eligible earnings basis. Base salary only and base plus eligible cash bonus are possible plan terms; equity eligibility must never be inferred. An unconditional employer contribution is different from a conditional match.

Recommended result concepts are **Cash Take-Home**, **Employee Retirement Contribution**, **Employer Retirement Contribution**, **Total Retirement Funding**, and **Total Compensation**. The employee contribution is already part of salary and must not increase total compensation. Employer retirement funding can increase package value but does not increase cash take-home. Defined-benefit employer funding, if provided, is an employer funding amount, not an actuarial value of the employee's promised pension.

### Matching arithmetic to resolve before implementation

For a simple conditional matching tier, let B be eligible earnings, E the employee contribution eligible for this tier, q the employee salary fraction matched, m the employer dollars per employee dollar, and C an optional employer dollar cap:

```text
eligibleEmployeeContribution = min(E, B x q)
employerMatch = min(m x eligibleEmployeeContribution, C)
```

When no dollar cap applies, omit that cap rather than assuming that zero means either unlimited or none. The cap semantics must be explicit.

Example: on $100,000 eligible earnings, a 50% match on employee contributions up to 6% of earnings:

| Employee contribution | Employer match, before any dollar cap | Total funding |
| --- | ---: | ---: |
| $0 | $0 | $0 |
| $3,000 | $1,500 | $4,500 |
| $6,000 | $3,000 | $9,000 |
| $8,000 | $3,000 | $11,000 |

These are illustrative employer terms, not a statutory Canadian matching rule. Tiered matching, eligibility dates, changes in salary, per-pay caps, and annual true-up can produce different outcomes. The annual version should state its assumptions rather than imply exact payroll matching.

### Annual cash and tax reconciliation

For a contribution-only example, with sufficient RRSP deductibility and excluding administration fees:

```text
employmentIncome = cashEmploymentPay + employerGroupRrsp
rrspDeduction = deductible(employeeGroupRrsp + personalRrsp + employerGroupRrsp)
rppDeduction = deductibleEmployeeRpp
taxableIncome = employmentIncome - rrspDeduction - rppDeduction
                - deductibleAdditionalCppOrQpp - otherModeledDeductions

cashAfterContributions = cashEmploymentPay - incomeTax
                         - employeeCppOrQpp - employeeEi - employeeQpip
                         - employeeRpp - employeeGroupRrsp - personalRrsp
                         - otherEmployeeCashContributions

retirementFunding = employeeRetirementContributions + employerRetirementContributions
```

These expressions describe the retirement component. The existing equity/ESPP cash-realization assumptions still need to be preserved or made explicit. Employer RPP/DPSP/qualifying PRPP funding is not added to employment income using the group RRSP rule. PRPP additionally requires its own deduction/room logic.

If cash salary is $100,000, employee group RRSP contributions are $5,000, and the employer puts $5,000 into that RRSP, employment income is $105,000 and the assumed deductible RRSP total is $10,000. Income after those RRSP deductions is $95,000 before additional CPP/QPP or other deductions. Cash contributions from salary are $5,000, not $10,000; retirement funding is $10,000.

With a DC RPP on the same contribution amounts, employment income remains $100,000 and the employee RPP deduction is $5,000. Income after the RPP deduction is also $95,000 before other deductions, but the room and earnings-base treatment differs. The $10,000 ordinary DC pension credit generally affects the following year's RRSP limit. This is why similar income-tax arithmetic cannot justify treating the plans interchangeably.

### Migration, boundaries, and future verification

- Preserve existing saved RRSP match estimates as legacy assumptions until the user supplies actual matching terms. Do not infer an employee contribution or reinterpret the old salary percentage as a match ratio.
- Migrate the current zero-means-unknown CRA limit to an explicit unknown state. Offer known zero separately. Keep deduction capacity and contribution capacity separate, especially where unused contributions already exist.
- Keep a supplied current-year CRA limit authoritative for this estimate. Do not subtract this year's ordinary RPP/DPSP PA from it again. Any optional next-year estimate needs prior-year earned income, carryforwards, and relevant adjustments.
- If room is exceeded, preserve the full employee cash outflow and the contractual employer match in the scenario; restrict assumed tax deductions and flag the excess. An app should not silently rewrite the employer contract to make a scenario fit room.
- Tax savings should compare like-for-like scenarios. Employer RRSP benefit income must be present in the contribution scenario and the comparison definition must be explicit. "Tax savings" is not the entire economic value of employer funding.
- A contribution deduction changes bracket use, provincial adjustments, and marginal displays. Update all dependent helpers, not just the final net figure.

Meaningful verification cases for a future implementation include no employee participation, partial/full match, employee over-contribution relative to the match threshold, dollar caps, zero vs unknown room, group RRSP employer plus employee room usage, DC RPP with zero RRSP room, RRSP/DPSP split, restricted/unrestricted withdrawals below earnings ceilings, Quebec QPP/QPIP differences, higher-income cases at contribution maxima, and reconciliation of cash versus package value. Also verify saved-data migration, comparisons/charts, salary changes, and CAD amounts. No application code or tests were changed as part of this research.
