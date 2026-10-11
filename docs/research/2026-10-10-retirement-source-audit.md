# Canadian retirement contribution source audit

Audit date: October 10, 2026. Audited document: `docs/research/canadian-retirement-contributions.md`. Research only. This audit changes no application code and does not certify payroll compliance. Sources below were checked live; the current Quebec Pension Plan Act displayed a consolidation date of August 12, 2026. Ordinary registered contributions are assumed, with no revoked registration, unregistered benefit arrangement or exceptional transfer.

## Decisive findings and required corrections

| Severity | Finding | Required correction |
| --- | --- | --- |
| P1 | Quebec aggregate benefit-table note 2 groups registered pensions together with other trusts and says amounts attract QPP. That grouping conflicts with the statutory route and specific plan guidance. | Replace the broad Quebec hold with the ordinary registered-plan matrix below. Explain the statutory interpretation and exclude unregistered arrangements. |
| P1 | Deduction capacity and contribution capacity must remain separate, including previously undeducted contributions. | A deduction limit is not automatically new-contribution capacity. Preserve unused contributions as potentially deductible receipts, rather than subtracting them from the maximum total deduction claim. |
| P2 | The displayed RRSP deduction-limit formula is supported by CRA Chart 3, including its outer zero floor. The negative carryforward distinction is unstated. | Define unused deduction room as a signed CRA carryforward. Do not rebuild it from the displayed nonnegative deduction limit. |
| P2 | The PRPP discussion omits the employer annual dollar restriction with member direction exception. | Add the separate PRPP registration rule; do not confuse it with the member's assessed room or turn it into an unconditional ceiling. |
| P3 | DPSP vesting wording can be clearer. | Specify vesting after two years of membership, or earlier under plan terms. The existing linked CRA contributions page supports this claim. |

## Quebec determination

This is an interpretation of the statutes read together, corroborated by plan-specific official guidance. It is not an inference based merely on the absence of a taxable benefit.

1. [Quebec Pension Plan Act, section 45](https://www.legisquebec.gouv.qc.ca/en/document/cs/R-9) imports employment income under the Taxation Act in paragraph (a), adding deductions made in computing that employment income. Its listed overrides do not override section 38. Paragraph (b) separately adds payments to a statutory profit-sharing plan, employee trust or employee benefit plan.
2. [Taxation Act, section 38](https://www.legisquebec.gouv.qc.ca/en/document/cs/I-3) excludes benefits from employer registered RPP, PRPP and DPSP contributions in paragraphs (a), (a.1) and (e). Section 47.6 excludes these section 38 arrangements from the employee benefit plan definition. Section 47.9 excludes DPSPs from employee trusts. Sections 852 and 870 define profit-sharing plans and registered DPSPs separately. These are not interchangeable labels.
3. [Revenu Quebec's specific profit-sharing/trust guidance](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/profit-sharing-plans-employee-trusts-and-employee-benefit-plans/) describes the section 45(b) arrangements. Its reporting route includes RL-25 for profit-sharing plans, rather than making every registered DPSP a pensionable trust payment.
4. [Retraite Quebec's SIPP guidance](https://www.retraitequebec.gouv.qc.ca/en/professionals-employers/employer-pension-plans-private-sector/do-you-want-set-pension-plan/simplified-pension-plan/characteristics-simplified-pension-plan-sipp) provides a 2026 example of QPP, EI and QPIP savings when employer funding goes into the registered pension plan rather than an RRSP. This independently corroborates ordinary DC RPP exclusion.
5. [Retraite Quebec's VRSP FAQ](https://www.retraitequebec.gouv.qc.ca/en/faq/rver/Pages/faq-RVER.aspx) states that employer VRSP contributions are exempt from payroll taxes. The full page returned 403 on direct open, but its official indexed result included the comparison table. The legal determination for a qualifying VRSP uses its registered PRPP status, not the indexed excerpt alone.

The contradictory [aggregate Other Benefits table, note 2](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/taxable-benefits/list-of-taxable-benefits/other-benefits/) must be recorded rather than silently ignored. For ordinary registered RPP/DPSP/PRPP contributions, the statutory exclusions and specific plan guidance support excluding employer contributions from QPP earnings. No exception for an ordinary employer RPP contribution based solely on its size was found in section 38(a). Plan registration limits remain separate; a payment outside the registered plan cannot inherit this treatment.

## Verified treatment matrix

These columns show the increment caused by an ordinary employer contribution. Employee salary deductions do not reduce original statutory earnings bases.

| Employer destination | Federal and Quebec employment income | CPP outside Quebec | QPP in Quebec | EI | QPIP | Employee tax deduction and room |
| --- | --- | --- | --- | --- | --- | --- |
| Group RRSP, withdrawable before retirement or termination | Add contribution | Add | Add | Add | Add | Deductible RRSP receipt within personal capacity; uses current contribution room |
| Group RRSP, withdrawal restricted until retirement or termination, with HBP/LLP access only | Add contribution | Add | Add | No addition | No addition | Same RRSP deduction/room rule |
| Registered DC RPP | No addition | No addition | No addition | No addition | No addition | Employee contribution deduction; ordinary PA affects following year's RRSP room |
| Registered DB RPP | No addition | No addition | No addition | No addition | No addition | Current-service employee deduction; administrator PA represents accrual, not cash funding |
| Registered DPSP | No addition | No addition | No addition | No addition | No addition | No employee contribution; employer allocations create PA for following year |
| Qualifying registered PRPP/VRSP | No addition | No addition | No addition | No addition | No addition | Employer amount is not member deduction; it uses shared current room and reduces member deduction capacity |

Federal sources: [CRA savings/pension benefit treatment](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/benefits-allowances-chart/saving-pensions.html), [T4130 RRSP and PRPP sections](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4130/employers-guide-taxable-benefits-allowances.html), [PRPP contributions](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pooled-registered-pension-plans-prpps/contributions-benefits-transfers.html). Quebec RRSP QPIP restriction: [Other Benefits table notes 9 and 10](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/special-cases-source-deductions-and-employer-contributions/taxable-benefits/list-of-taxable-benefits/other-benefits/). Quebec registered-plan treatment follows the statutory analysis above. Federal DPSP, RPP and PRPP benefit exclusions are explicit in [Income Tax Act 6(1)(a)(i)](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-6.html), rather than inferred from the omission of DPSP from CRA's short benefit list.

Directly employer-paid RRSP administration fees are taxable and CPP pensionable but noncash and not EI insurable. Keep fees outside contribution receipts and match funding. Quebec fees require their own benefit treatment. [CRA T4130](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4130/employers-guide-taxable-benefits-allowances.html)

## Personal capacity and carryforward

The assessed deduction limit remains preferable to estimating room from salary. Ordinary current-year RPP/DPSP PA is not subtracted again from that assessed current-year limit. [CRA deduction limit determination](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html)

CRA Chart 3 supports both zero floors in the existing equation. Step 8 separately preserves negative unused deduction room. Thus the equation is acceptable as a simplified displayed-limit equation only if its prior carryforward is signed. Example: signed carryforward -$5,000 plus new room $3,000 produces displayed limit $0 and raw -$2,000, which must not disappear in a future-year calculation. [CRA T4040, Chart 3](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html)

For an ordinary year, let D be the assessed deduction limit, U previously reported undeducted contributions, N new member/individual contributions, and M employer PRPP contributions. Ignoring other transactions, new-contribution capacity is D - U - M. A total member/individual deduction claim can draw from U + N, constrained by D - M. Previously undeducted contributions are therefore capacity already used and potentially deductible receipts. At D=$15,000, U=$4,000 and M=$0, new capacity is $11,000 while total eligible deductions could reach $15,000. These equations are modelling inferences, not the complete excess-tax return. [CRA definitions](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/definitions-rrsps.html), [CRA PRPP employer questions](https://www.canada.ca/en/revenue-agency/services/tax/pooled-registered-pension-plan-prpp/pooled-registered-pension-plan-prpp-questions-answers-employers.html)

## Limits, deductions and vesting checks

| Claim | Audit result | Primary source |
| --- | --- | --- |
| 2026 RRSP $33,810; MP $35,390; DPSP $17,695; DB $3,932.22; YMPE $74,600; YAMPE $85,000; published 2027 RRSP $35,390 | Verified | [CRA registered-plan limits](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html) |
| Ordinary DC contributions/allocations constrained by 18% compensation and MP ceiling | Verified with aggregate PA/provision qualifications; not a personal RRSP deduction ceiling | [CRA MP registration rules, paragraphs 12 to 13](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/newsletters-technical-manual/no-91-4r.html) |
| Employee current-service RPP contribution deducted separately from RRSP room | Verified; accept deductible ordinary registered contributions, not unlimited arbitrary payments | [CRA line 20700](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-20700-registered-pension-plan-rpp-deduction.html) |
| DPSP employee contributions prohibited; annual allocations limited to lesser 18% compensation or half MP; two-year membership vesting | Verified | [CRA DPSP contributions](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/deferred-profit-sharing-plans/contributions.html) |
| PRPP employer contributions must not exceed annual RRSP dollar limit without member direction | Add missing qualification, separate from personal room | [Income Tax Act 147.5(3)(c)](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.5.html) |
| DB usual PA is 9 times benefit earned minus $600 | Verified as usual rule, with zero floor and administrator-specific exceptions; do not value DB pension by employer cash | [CRA Pension Adjustment Guide, section 7](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4084/pension-adjustment-guide.html) |

## Remaining boundaries

### Follow-up: statutory compensation and ordinary warning bounds

Registered-plan compensation is distinct from employer contract match-eligible earnings. [Income Tax Act 147.1(1)](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.1.html) generally includes employer-related employment income required under sections 5/6, prescribed amounts and specified approved nonresident remuneration, subject to its exclusions. [DPSP 147(5.1)(a)(ii)](https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-147.html) adopts that definition without its paragraph (b) prescribed amounts. Ordinary taxable employer RRSP benefits belong to employment compensation. Actual taxable equity benefits may belong too; estimated future equity, employee ESPP purchase payments and capital gains are not automatically employment compensation.

[CRA's archived 2002 RPP consultation, question 3](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/consultation-sessions/rpp-consultation-session-questions-industry-november-21-2002.html) confirms stock-option employment benefits enter section 147.1 compensation through section 6. This is older corroboration, not the sole current authority. [Current CRA security-options guidance](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/security-options.html) covers RSU/ESPP arrangements whose agreements determine timing/value. The spec therefore uses optional confirmed Registered-Plan Compensation and marks an unconfirmed 18% earnings check unverified instead of assuming the package's approximate equity values qualify.

### Scope boundary

No global Quebec registered-plan hold is needed for the ordinary annual contribution estimate. Exclude unregistered pensions, nonqualifying or revoked PRPPs, employee trusts, nondeferred profit-sharing plans and employee benefit plans unless separately researched. Do not generalize the matrix to withdrawals, transfer payments, corrective contributions, unusual employment exemptions or full payroll withholding. Employer match terms, eligible earnings, vesting before ownership, dates and true-up remain employer contract facts. Statutory maxima must flag a scenario that exceeds them without silently changing the contractual match or cash outflow.
