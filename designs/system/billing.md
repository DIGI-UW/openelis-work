# Billing: Functional Requirements Specification

**Version:** 0.4.1 (what counts as Paid on the order dashboard confirmed, BL-38; v0.4: the order dashboard shows Paid or Not paid only, with no amounts, and Odoo can set an order's payment status even with Billing off: FR-D15 revised, FR-J8, BL-37; v0.3 added tax, the patient account, finance controls, the revenue report, price check and FHIR `Invoice`: FR-A11 to FR-A13, FR-D16 to FR-D19, section O, FR-K10, FR-K11, FR-I4; v0.2 added the payment chip on the order and the order dashboard Payment column, FR-D14, FR-D15; v0.1 was the first draft from the clarify brief, decisions C-1 to C-25)
**Date:** 2026-10-20
**Author:** Casey Iiams-Hauser, Director of Product
**Status:** Draft, for review
**Source:** `billing/billing-clarify-brief.md` (decisions C-1 to C-25, crosscheck of 2026-10-20)
**Continues:** S-13 Payment & Billing Integration, `designs/sample-collection/environmental-vector-roadmap.md` (deferred 2026-04-16; no contractor delivery was received)
**Supersedes, in part:** the order-level Payment status as a hand-set value (Clinical Order Entry v4 FR-B28 keeps the field; this FRS becomes the "billing system" that sets it), the Odoo price file `/var/lib/openelis-global/odoo/odoo-test-product-mapping.csv`, and the Billing menu entry that only links to an outside address (Admin Redesign, Menu Configuration)
**Related:** Clinical Order Entry v4 (OGC-1266), Environmental and Vector Order Entry v4, Locations & Organizations (OGC-1363), Programs Management, Test Catalog, Report Print Queue (OGC-1031), Result Delivery (OGC-1506), Admin Redesign (Configuration, Menu Configuration), Navigation Redesign (D-064), Users and Roles (PR #3443), Referral redesign (OGC-796), Custom Data Export, management dashboard, FHIR data-exchange audit (PR #4660), OpenELIS FHIR IG, OpenMRS billing module (`openmrs-module-billing`)
**Decisions:** BL-1 to BL-36 (local IDs; mapped to ledger IDs at registry upkeep, see Decisions)
**Preview:** `billing-preview.html`
**Checked against:** `DIGI-UW/OpenELIS-Global-2` `develop` (2026-10-20): `org.openelisglobal.odoo.*`, `ObservationHistoryServiceImpl` (`paymentStatus`), dictionary category `patientPayment`, `frontend/src/languages/en.json`

This FRS describes the whole feature. `/breakdown` slices it into releases; the brief's suggested order is in Releases.

---

## Lab Context

### Current State

Many laboratories charge for their tests. A public hospital lab may charge walk-in patients a fee for each test, bill the hospital wards and nearby clinics that send samples once a month, bill a national insurer for insured patients, and test for free the patients whose tests a program pays for, such as tuberculosis (TB) and HIV programs funded by the Global Fund. An environmental lab charges water utilities, mining companies and food producers for testing their samples, usually after sending them a quote.

Today OpenELIS records almost none of this. At registration a clerk can pick a **Payment status** for the order from a list that mixes two different ideas ("Paid in Full", "Partial Payment", "No payment", "Normal cash payment", "Reduced insurance payment"). Nothing checks it, and nothing adds up what is owed. Most labs keep a receipt book at the cash window, a price list taped to the wall, and a spreadsheet of what each clinic owes. Some labs connect OpenELIS to Odoo, an open-source accounting system: OpenELIS then creates an Odoo invoice for the patient when the order is saved, priced from a file on the server that no one in the lab can see or change.

Insurers increasingly want claims sent electronically. In Kenya, for example, the Social Health Authority (SHA) takes claims as FHIR messages (FHIR is the standard OpenELIS already uses to exchange lab data) through the national health information exchange, and sends payment notices back the same way. A lab with no way to send claims either sends paper and waits months, or does not claim at all.

### Pain

- **Work done but never charged.** A doctor phones to add a lipid panel to a sample already in the lab; the technician adds it at the bench. A culture grows and the antibiotic susceptibility test is added. Nobody goes back to the cash window, so the patient never pays and the lab never bills anyone. No report shows this.
- **Results handed out to people who have not paid.** The cash window and the results window are run by different people. Nothing tells the results clerk that an order is unpaid.
- **Cash that disappears.** Receipt books have missing pages, refunds are written on scraps of paper, and at the end of the day nobody can say how much cash the drawer should hold.
- **Money owed but never collected.** A district hospital runs up a balance for six months because nobody sends it a statement. An insurer refuses claims sent more than 90 days after the test, and the lab learns this only when it finally sends them.
- **Prices nobody can see.** The Odoo price file is keyed by the test's English or French name. When a test is renamed its price silently drops out, and the patient is billed nothing. When an order has no patient (every environmental and vector order), the invoice goes to Odoo's first customer record, whoever that happens to be.
- **Discounts with no reason.** A cashier reduces a price for a staff member or a patient who cannot pay. That may be right, but nobody can see later who did it, how often, or why.
- **Free tests that nobody counts.** The TB program pays for TB tests, but the lab cannot tell the program what those tests were worth, which is exactly what the program's funder asks for.

### What Changes

The lab sets its prices once, in price lists it can see: a standard list for walk-in patients, and one for each insurer, program, institution or environmental client that pays a different price. Registering an order now also says who pays (**Bill to**): the patient, an insurer (with the patient's member number), a program, an institution or an environmental client. OpenELIS prices each test from that payer's list the moment it is added, including tests added later at the bench. A test that is free for a reason (quality control, a rerun, a program, a waiver) says why.

The cashier opens the **Cash Desk**, finds the order by lab number or patient, sees what the patient owes, takes cash or mobile money, and prints a numbered receipt. Refunds, voids and one-off discounts each need a reason, and everything is listed in one report the lab manager can read. Each cashier opens a shift with a starting float and closes it by counting the drawer; the difference is recorded.

Institutions, programs and environmental clients get monthly statements listing the tests whose results were released, with a reminder when a statement is overdue. Environmental clients get a quote before sampling, which becomes the order when the samples arrive. Insured patients' tests become claims, sent electronically to the insurer through the health information exchange, and the insurer's payment notice is matched back to each test automatically. Denied or underpaid claims land on a short worklist.

A small Billing overview shows the numbers that matter: cash collected today, work done but not charged, results released while unpaid, money owed by age, and the claim denial rate. Labs that use Odoo keep it for their accounts: OpenELIS sends it invoices and payments, and payments entered in Odoo come back as paid. Labs whose orders come from a hospital system that already bills the patient (OpenMRS, for example) mark those orders as billed there, so nothing is charged twice.

---

## Overview

Billing gives OpenELIS a native billing core and three optional connections.

| Part | What it does | Who uses it |
|---|---|---|
| **Prices** | Price lists per payer with dated prices for tests, panels and other fees; promotions for a period; one-off overrides with a reason | Billing manager (setup); reception (overrides) |
| **Charges** | A charge for every billable test or fee on an order, at the payer's price, kept in step with the order; a recorded reason for every test that is not charged; a queue of work done but not charged | Automatic; billing clerk works the queue |
| **Cash desk** | Payments, receipts, refunds, credits, deposits, cashier shifts, payment modes, the optional payment gate | Reception, cashiers |
| **Accounts** | Bills and statements for institutions, programs and environmental clients; quotes; what each payer owes by age; reminders; credit limits | Billing clerk |
| **eBilling and eRemittance** | Coverage checks, pre-authorization, FHIR claims to insurers, remittance matching, denials and underpayments | Billing clerk |
| **Reports and overview** | Revenue integrity, overrides, value of free services, aging, collections, the Billing overview | Lab manager, auditors |
| **Connections** (optional) | Odoo for accounting; an EMR that bills its own orders; payer adapters per country | Configured by the administrator |

Billing is switched on with a new module switch, **Billing** (`billingEnabled`, Configuration, module switches; Dependencies). When it is off, nothing in this FRS appears, and order entry keeps today's manual Payment status (`trackPayment`, Clinical Order Entry v4 FR-B28), with one exception: when Odoo is connected, Odoo's paid or not paid state sets that status, and the order dashboard shows it (FR-J8, FR-D15). The Admin feature-flags design names this switch `useBilling`; no such switch exists on `develop`, so the name is open (Open Question 1).

### Navigation & URL

The main menu gains a **Billing** section between Reports and Administration (BL-2, amends D-064). Its entries are SideNav items, not in-page tabs (D-003).

| Page | SideNav placement | Breadcrumb | URL route |
|---|---|---|---|
| Billing overview | Main menu → Billing → Overview | `Home / Billing / Overview` | `/Billing` |
| Cash Desk | Main menu → Billing → Cash Desk | `Home / Billing / Cash Desk` | `/Billing/cash-desk`; an order opens with `?labNo=` |
| Bills & Statements | Main menu → Billing → Bills & Statements | `Home / Billing / Bills & Statements` | `/Billing/bills`; filters `?payer=`, `?status=draft\|open\|overdue\|paid\|void`, `?kind=bill\|statement` |
| Quotes | Main menu → Billing → Quotes | `Home / Billing / Quotes` | `/Billing/quotes`; `?status=draft\|sent\|accepted\|expired\|converted` |
| Claims | Main menu → Billing → Claims | `Home / Billing / Claims` | `/Billing/claims`; `?status=draft\|submitted\|accepted\|partial\|rejected\|paid\|partlyPaid\|void`, `?payer=` |
| Remittances | Main menu → Billing → Remittances | `Home / Billing / Remittances` | `/Billing/remittances`; `?status=matched\|review\|applied` |
| Unbilled Work | Main menu → Billing → Unbilled Work | `Home / Billing / Unbilled Work` | `/Billing/unbilled` |
| Billing Reports | Main menu → Billing → Reports | `Home / Billing / Reports` | `/Billing/reports`; `?report=integrity\|overrides\|aging\|collections\|freeServices\|referralCosts\|denials\|revenue\|tax` |
| Price Lists (with promotions) | Admin → Resources → Billing → Price Lists | `Home / Admin Management / Billing / Price Lists` | `/MasterListsPage/priceLists`; a list opens with `?id=` |
| Billable Services | Admin → Resources → Billing → Billable Services | `Home / Admin Management / Billing / Billable Services` | `/MasterListsPage/billableServices` |
| Exemption Rules | Admin → Resources → Billing → Exemption Rules | `Home / Admin Management / Billing / Exemption Rules` | `/MasterListsPage/exemptionRules` |
| Payment Modes & Cash Points | Admin → Resources → Billing → Payment Modes & Cash Points | `Home / Admin Management / Billing / Payment Modes & Cash Points` | `/MasterListsPage/paymentModes` |
| Tax Rates | Admin → Resources → Billing → Tax Rates | `Home / Admin Management / Billing / Tax Rates` | `/MasterListsPage/taxRates` |
| Patient billing | Patient record (open patient), **Billing** section | existing patient record breadcrumb | existing patient route, `#billing` |
| Price check | Cash Desk toolbar, **Price check** | `Home / Billing / Cash Desk` | `/Billing/cash-desk?tool=priceCheck` |
| Billing settings | Admin → Config → Configuration, **Billing** area (new, BL-3) | `Home / Admin Management / Configuration` | `/MasterListsPage/configuration?area=billing` |
| Payer settings | Admin → Organization → Locations & Organizations → Organizations (open row, **Billing** section) | `Home / Admin Management / Locations & Organizations / Organizations` | `/MasterListsPage/locations` (existing) |
| Program as payer | Admin → Programs (open row, **Billing** section) | existing | existing |
| Test billing rules | Admin → Resources → Test Catalog → a test → **Billing** section | existing | existing |
| Bill to, prices, coverage check | Order entry, section 7 "Billing and notifications" (clinical, environmental, vector) | existing | existing |

Notes:

- Admin's **Billing** group sits in the global **Resources** bucket (D-010) after Test Catalog, in this order: Price Lists, Billable Services, Exemption Rules, Payment Modes & Cash Points, Tax Rates (BL-4).
- The Billing section and its entries are visible only to users with a Billing privilege (Access), and only while the Billing switch is on. Each entry shows only when its user can open it.
- The existing **Billing** main-menu entry (`menu_billing`, `banner.menu.billing`) becomes the section heading. When the Billing switch is off and a Billing address is set in Menu Configuration, the old single entry linking to that address shows instead, as today (Admin Redesign, Menu Configuration). With the switch on, the address is ignored and the Menu Configuration page says so.
- Routes are deep-linkable: filters and the open record are encoded in the URL as listed.

### Releases (suggested for `/breakdown`, not binding)

| Release | Contents |
|---|---|
| 1 | Price lists, promotions, billable services, tax, test billing rules, Bill to for patients, charges, price check, the patient record's Billing section, period close, revenue and tax reports, unbilled work, unpriced-test check, cash desk (payments, receipts, refunds, credits, shifts, payment modes, gate), overrides, exemptions, EMR-billed orders, revenue integrity, overrides and value-of-free-services reports, the overview's release 1 numbers, Odoo backend |
| 2 | Institution, program and environmental client billing: paying programs, bills, statements, opening balances, disputed lines, receipts and balance reminders by SMS or email, reminders, credit limits, aging, quotes, referral costs |
| 3 | eBilling and eRemittance: coverage checks, pre-authorization, claims, remittances, denials, underpayment, filing deadlines, follow-up claims; bills published as FHIR `Invoice` for EMRs |

The overview gains its numbers with each release.

---

## Terms

| Term | Meaning in this FRS |
|---|---|
| **Payer** | Whoever is billed for an order: the patient, an insurer, a program, an institution (a hospital, ward or clinic that sends samples) or an environmental client. Insurers, institutions and clients are Organizations; programs are Programs. |
| **Bill to** | The payer chosen on an order. One per order (BL-7). |
| **Price list** | A named list of prices for tests, panels and billable services, for a payer or group of payers. One default list. |
| **Billable service** | A fee that is not a test: sample collection, home collection, urgent surcharge, report copy, environmental certificate. |
| **Charge** | One priced line on an order: a test, a panel or a billable service, with its list price, the price charged, the patient's share and the payer's share. |
| **Free reason** | Why a released test has no charge: a non-billable rule (QC, EQA, rerun), an exemption, a waiver, billed by the EMR, or covered by a panel price. |
| **Bill** | What a payer owes for one order (patients, walk-in environmental clients). |
| **Statement** | What an institution, program or client owes for a period: every released, charged test in that period, less payments. |
| **Receipt** | Proof of a payment at the cash desk, with a lab receipt number. |
| **Claim** | A request to an insurer to pay for released tests, sent as FHIR `Claim`. |
| **Remittance** | The insurer's notice of what it paid, adjusted or denied, received as FHIR `PaymentReconciliation` or, where the country's guide uses it, `PaymentNotice`. |
| **Gate** | The optional rule that holds testing or the report until the patient's share is paid. Off by default. |
| **Shift** | One cashier's session at one cash point, opened with a float and closed with a cash count. |
| **Tax category** | How an item is taxed (for example Exempt, Standard 10%); set on the test, panel or billable service. |
| **Closed period** | A month the billing manager has closed: nothing dated in it can be added or changed. |

---

## User Stories

- As a **cashier**, I want to find an order by lab number, see exactly what the patient owes, take cash or mobile money and print a numbered receipt, so that the patient leaves with proof of payment and the drawer adds up at the end of the day.
- As a **lab manager**, I want every released test to either be charged or carry a reason it was free, so that work done at the bench is never lost revenue.
- As a **billing clerk**, I want each institution and environmental client to get a monthly statement of released tests, with a reminder when it is overdue, so that balances do not build up for months.
- As a **billing clerk**, I want insured patients' tests to go to the insurer as electronic claims, and the insurer's payment notice to be matched to each test, so that I only handle the denials and underpayments.
- As an **environmental lab manager**, I want to send a client a quote before sampling and turn it into the order when the samples arrive, so that the client pays the price we agreed.
- As a **program manager**, I want a report of what the free tests done for my program were worth, so that I can report the lab's contribution to the funder.
- As an **auditor**, I want one report of results released while unpaid, receipt gaps and voids, refunds, discounts and cash-count differences, so that I can check the cash desk without reading receipt books.

---

## Functional Requirements

### A. Prices: price lists, promotions, billable services

| ID | Requirement | Notes |
|---|---|---|
| FR-A1 | **Price Lists page** (`/MasterListsPage/priceLists`) lists every price list: Name, Used by (the payers that use it, for example "Kumul Health Cover, 2 programs"), Items priced (for example "412 of 418 billable"), Unpriced (count, a link that filters the list to unpriced items, FR-A9), Panel pricing (Panel price, Sum of tests), **Scope** (Any domain, Clinical, Environmental, Vector, or Cost list for a reference lab), Valid from, and Active. One list is the **Default** and is marked with a Tag; it cannot be deactivated. Search by name; a Status filter (Active by default, Inactive, All). Lists are deactivated, never deleted (D-002). | BL-5 |
| FR-A2 | **An open price list** (inline row expansion, D-005) shows its details (name, description, panel pricing, payers using it) and a priced-items table: Item (test, panel or billable service, with its code), Kind, Lab unit, Price, Payer billing code, Valid from, Changed by. The table has search over item name and code, filters for Kind, Lab unit and **Unpriced only**, and server-side paging (MUST E; catalogs run to 500+ tests). Items are added with a ComboBox search over the Test Catalog, panels and billable services, never a long select (D-007). | |
| FR-A3 | **Dated prices.** Changing a price asks for the date it takes effect (default today) and a reason (free text, optional). The old price stays in the item's price history with its dates. A charge always takes the price in force on the day it is created (FR-C1). A future-dated price shows "From {date}" beside the current one. | BL-5 |
| FR-A4 | **Payer billing code** per item: the code the payer uses for the test (an insurer's tariff code, for example). It is carried on claim lines (FR-G6) and statement lines. Empty means the test's own code is used. | |
| FR-A5 | **Panel pricing** is a setting of each price list: **Panel price** (the panel has its own price on the list; its member tests are not charged separately) or **Sum of tests** (the panel's charge is the sum of its member tests' prices on the list). A member test removed from an ordered panel lowers a Sum-of-tests panel's charge by that test's price and leaves a Panel-price panel unchanged; the order still shows the removed test with who removed it (D-080). | BL-12 |
| FR-A6 | **Import and export.** A price list can be exported to CSV (item code, item name, kind, price, payer code, valid from) and imported from the same format, with a preview of new, changed and unchanged prices before anything is saved (the shared import review pattern). The same CSV is accepted by the startup configuration loader, so a distribution can ship its price lists. | Reuses the shared catalog loader base and Import Review. |
| FR-A7 | **Promotions** sit inside the price list page, in a **Promotions** section of each open list and in a lab-wide Promotions list reached from the page header ("Promotions: 2 running"). A promotion has a name (printed on receipts, for example "World TB Day screening"), what it covers (one or more tests, panels, or every billable test in one or more lab units, picked by search), a fixed price or a percentage off, a start and end date, the price lists it applies to (one, several, or all non-insurer lists; an insurer's list only when named, because an insurer pays its contracted price), and a required reason. It is Scheduled, Running or Ended by its dates. Ending early sets the end date; a promotion is never deleted. | C-17, BL-14 |
| FR-A8 | **Billable Services page** (`/MasterListsPage/billableServices`): Name, Code, Kind (Collection, Surcharge, Report or certificate, Other), Added (By hand, Automatically by rule), Rule, Active. A service is priced on price lists like a test (FR-A2). Automatic rules shipped: **Urgent priority** (adds the service when the order's priority is urgent), **Home collection** (when the collection site is the patient's home), **Certificate** (one per environmental or vector order when the certificate is issued). Rules are switched on per service. Deactivated, never deleted. | C-19, BL-12 |
| FR-A9 | **Unpriced check.** Every billable test, panel and billable service in a price list's scope (FR-A1) must have a price on that list; a cost list is checked only against the tests referred to its lab. A list with unpriced items shows the count in the Unpriced column and a warning above its items table: "{count} billable items have no price on this list. Orders billed with this list will show them as unpriced." The Test Catalog completeness check (the test editor's completeness gate) gains a line "No price on {list}" per active list, as a warning, never a block. | C-22, BL-20 |
| FR-A10 | **History.** Every change to a price list, price, promotion or billable service is in the record's History (who, when, old and new value), using the shared History panel. | |
| FR-A11 | **Tax Rates page** (`/MasterListsPage/taxRates`): Name (for example "GST 10%", "Exempt"), Rate (%), Tax code (sent to Odoo and on claims and fiscal documents), Valid from and to, Active. Shipped: **Exempt** (0%), active and the default. Each test, panel and billable service has a **Tax category** (one of the rates; default Exempt) in its Billing section (FR-C4) or on the Billable Services page. A payer can be marked **Tax exempt** with a certificate number (Locations & Organizations Billing section, Programs Billing section), which removes tax from its charges. Rates are dated like prices and deactivated, never deleted. | Casey 2026-10-20; BL-32 |
| FR-A12 | **Prices with or without tax.** Each price list says whether its prices **include tax** (default No). Tax is calculated per charge on the charged price, after overrides, promotions and exemptions, at the rate in force on the charge date, and rounded once per document total (FR-L2). A charge keeps its taxable amount, rate and tax. | BL-32 |
| FR-A13 | **Where tax shows.** Receipts, bills, statements and quotes show, per line, the price and tax category, and in the totals the taxable amount and the tax per rate, then the total with tax. Claims carry tax as the payer's guide requires (left to the adapter, FR-I1). Odoo invoices carry tax lines mapped by tax code (FR-J2). The Tax report (FR-K10) totals tax by rate and period. | BL-32 |

### B. Payers and Bill to

| ID | Requirement | Notes |
|---|---|---|
| FR-B1 | **Payer on an Organization.** In Locations & Organizations, an organization's open row gains a **Billing** section: **Payer type** (Not a payer, Insurer, Institution, Environmental client), **Price list** (a ComboBox over active price lists; default: the Default list), **Statement schedule** (Monthly on day {n}, Every {n} weeks, Per order only), **Payment terms** (days, default 30), **Credit limit** (amount, optional), **Billing contact** (name, email, phone), **Tax exempt** (with certificate number, FR-A11), **Claim connection** (insurers only: the External Connection that carries claims, FR-G1), **Claim filing limit** (insurers only: days after release, optional, FR-G11), **Send claims** (insurers only: Per order when results are released, Daily batch, Weekly batch; FR-G6), **Patient's share default** (insurers only: None, a percentage, or a fixed amount per order; FR-B4, FR-E5), **Supports coverage check** and **Requires coded diagnosis** (insurers only, Yes or No), **Overrides change the claimed amount** (insurers only, default No, FR-E4), and **Payer ID** (the identifier the payer is known by on claims, stored as one of the organization's identifiers with the label "Payer ID", Locations & Organizations identifiers). An organization that sends samples also has **Who bills these orders** (Billed by the lab, Billed by the EMR; FR-B5). An organization that is a referral lab also has **What they charge us**: a price list used as that reference lab's cost list (FR-C11). A ward inherits its facility's payer settings and has no Billing section of its own. | C-7, BL-7. L&O owns the section's layout and keys. |
| FR-B2 | **Program as payer.** In Programs, a program's open row gains a **Billing** section: **Program pays for its tests** (Yes or No), **Price list** (default: the Default list), **Statement schedule** and **Billing contact**, as for organizations. When a program pays, its orders are billed to the program and the patient's share is zero (FR-E7). | C-7 |
| FR-B3 | **Bill to at order entry.** Section 7 "Billing and notifications" of every order entry domain (clinical, environmental, vector) shows **Bill to** first, as a ComboBox that searches payers by name and code: **Patient** (clinical only), any organization whose payer type is Insurer, Institution or Environmental client, and any program that pays. Defaults, in order: the order's program when it pays; the requesting organization when it is an institution or environmental client; otherwise Patient (clinical) or the requesting organization (environmental and vector). The defaulted payer shows "From the program" or "From the requesting site" under the field. | D-073 shared component. Replaces the hand-picked Payment status when Billing is on (FR-D12). |
| FR-B4 | **Insurer fields.** When Bill to is an insurer, the section shows **Member number** (required to save the order as complete, not to save a draft, D-074), **Patient's share** (None, Percentage, Fixed amount; starting value from the insurer's settings, FR-E5), and **Check coverage** when the insurer supports it (FR-G2). The member number is kept on the patient for that insurer and filled in on the patient's next order for the same insurer. | C-7, C-11 |
| FR-B5 | **Order source and who bills.** Every order has a source: **Lab** (entered in OpenELIS), **Referring facility** (an organization that sends samples), or **Electronic order** from a named external system (an `ElectronicOrder` pulled from the FHIR store). Each external system and each referring facility has a setting **Who bills these orders**: Billed by the lab (default) or Billed by the EMR. An order billed by the EMR creates no charges; section 7 shows "Billed by {system}" with **Bill in the lab instead** (a reason is required, FR-E2). | C-18, BL-17 |
| FR-B6 | **Changing Bill to** after the order was saved re-prices every unpaid charge from the new payer's price list and keeps paid charges at their paid price. If the order is on a statement or claim already sent, the change is refused with "{labNo} is on statement {no} sent {date}. Credit it from the statement first." | |
| FR-B7 | **Payer list.** The Organizations list in Locations & Organizations gains a **Payer** filter (All, Insurers, Institutions, Environmental clients, Not a payer) and a Payer column (Tag with text). | L&O change, §N |

### C. Charges, charge rules and unbilled work

| ID | Requirement | Notes |
|---|---|---|
| FR-C1 | **A charge for every billable item, created when the item is added.** Adding a test, a panel or a billable service to an order, by any route, creates a charge at the price in force that day on the Bill to payer's price list, after promotions and exemptions (FR-C9). Routes include order entry, adding a test to an existing order, reflex tests, bench add-ons, tests created from an analyzer result, and a repeat that becomes a new test. A route that creates a test must create its charge, or record its free reason (for example QC sample, FR-C6), in the same transaction. | C-8, C-22, BL-10 |
| FR-C2 | **What a charge holds:** the item, the price list and price in force, the **list price**, the **charged price** (after promotion, override or exemption), the patient's share, the payer's share, the reason when the charged price differs from the list price (promotion name, exemption rule, override reason), who and when, and its status (FR-C5). | BL-13 |
| FR-C3 | **Cancelling a test** before testing started (or after, when the test's "Charge when cancelled after testing started" is No, FR-O4) reverses its unpaid charge (status Reversed, with the cancelling user and reason from the cancellation). A paid charge is not reversed; it becomes a **credit due** on the order, settled at the Cash Desk as a refund or a patient credit (FR-D8). A charge on a statement already sent stays, and a credit line goes on the payer's next statement. A charge on a claim already sent is removed by voiding the claim and sending it again without that line when the insurer has not answered yet (FR-G9); after the insurer has answered, it is written off as an adjustment (FR-H5). | C-8, C-13 |
| FR-C4 | **Charge rules on the test.** The Test Catalog test editor gains a **Billing** section: **Billable** (Yes, No), **Charge reruns** (No, default; Yes), **Charge repeats that become new tests** (Yes, default; No), **Charge redraws after a rejected sample** (No, default; Yes), **Charge when added as a reflex test** (Yes, default; No), **Charge when added after registration** (Yes, default; No), **Pre-authorization required by** (a FilterableMultiSelect of insurers, FR-G4), **Charge when cancelled after testing started** (Yes, default; No; FR-O4), **Tax category** (FR-A11). QC and EQA samples are never charged; this is not a setting. A panel has Billable and Charge when added as a reflex. | C-19, BL-11 |
| FR-C5 | **Charge status:** Unpaid, Partly paid, Paid, Waived, Reversed, Billed to payer (charged to the payer, not yet on a statement or claim), On statement, Claimed. "On statement" and "Claimed" show the statement or claim number. A line the insurer denied keeps Claimed and appears under Claims › Needs attention until it is re-sent, moved to the patient or written off (FR-H5). "Billed by EMR" is an order status only, since such orders have no charges (FR-B5). Status is shown as a Tag with text (FR-M2). | |
| FR-C6 | **Free reasons.** A released test with no charge carries exactly one free reason: Not billable (test setting), QC sample, EQA sample, Rerun, Redraw, Reflex not charged, Added after registration not charged, Exemption ({rule}), Waived ({reason}), Billed by EMR ({system}), In panel price ({panel}). The reason shows in the order's charge list. | C-22 |
| FR-C7 | **Unbilled Work** (`/Billing/unbilled`) lists every released test that has neither a charge nor a free reason, oldest release first: Released, Lab number, Test, Lab unit, How it was added (Order entry, Added at bench, Reflex, Analyzer, Repeat, Unknown), Bill to, and actions **Charge** (creates the charge at today's price for the order's payer) and **Mark as free** (pick a free reason; Waived needs a reason note). Batch actions apply either to selected rows. Filters: lab unit, how added, period. The count shows on the Billing overview (FR-K1). | C-22, BL-20 |
| FR-C8 | **Unpriced items at order entry.** A test with no price on the payer's list shows "No price on this list" in the charge column of section 7 and adds no amount; it is listed on Unbilled Work with "No price" as how it was found until a price is added and the charge is re-priced (**Re-price** on the order). It is never charged at 0 silently. | C-22 |
| FR-C9 | **Which price applies, in order:** an accepted quote's locked price (FR-F9); a one-off override on the line (FR-E1); a running promotion on the payer's list (FR-A7); the dated list price (FR-A3). **Then the shares:** the patient's share on insured orders (FR-E5) and any exemption (FR-E6), which waives all or part of the patient's share without changing the price. The charge stores the list price beside the charged price, so the difference is always visible. | C-17 |
| FR-C10 | **Order charge list.** Section 7 of order entry and the Cash Desk both show the order's charges: Item, Price list price, Charged, Patient pays, Payer pays, Status, Reason. Totals: total charged, patient's share, already paid, **balance due**. | |
| FR-C11 | **Referral costs.** A test referred out records the reference lab's charge for it from that lab's **What they charge us** price list (FR-B1). The lab's own charge to its payer is unchanged. The Referral Costs report (FR-K6) compares what each reference lab invoiced with what was sent. | C-21 |

### D. Cash desk: payments, receipts, refunds, shifts, gate

| ID | Requirement | Notes |
|---|---|---|
| FR-D1 | **Cash Desk** (`/Billing/cash-desk`). The page opens with the cashier's shift bar (FR-D9) and one search box: lab number, patient name, patient ID or national ID, bill number, or quote number. A lab-number barcode scan opens the order at once. Below the search, **Waiting to pay** lists today's orders with a patient share still due, newest first (Lab number, Patient, Bill to, Balance due, Registered), so a cashier can take the next patient without typing. | BL-15 |
| FR-D2 | **An open order** shows a panel beside the list (not a modal): patient, lab number, Bill to, the order's charge list (FR-C10) with totals, earlier payments and receipts, any patient credit on file, and the gate state (FR-D11). Actions: **Take payment**, **Refund or credit** (when a credit is due or a payment exists), **Print bill**, **Override price** (FR-E1). | |
| FR-D3 | **Take payment.** The cashier enters the amount (default: balance due), picks a **payment mode** (FR-D7) and fills the mode's own fields (for mobile money: phone number and transaction reference; for card: last four digits and approval code; for bank transfer: reference). For cash, the cashier may type the amount tendered; the change due is shown. A payment can be **part** of the balance (status Partly paid) or more than it (a **deposit**, kept as patient credit for this order's later charges). A patient credit on file is applied first, automatically, and shown as a ticked line the cashier can untick: "Use K15.00 credit from receipt R-2026-004417." Save records the payment against the cashier's open shift and cash point and prints the receipt (FR-D5). | C-20 |
| FR-D4 | **Payments apply to charges** oldest first, the patient's share only. Each charge's status follows (Unpaid, Partly paid, Paid). The order's **Payment status** (Clinical Order Entry v4 FR-B28) is set by Billing and shown read-only in order entry with "Set by Billing": **Paid** (no patient balance), **Partly paid**, **Unpaid**, **Waived** (every patient share waived or exempt), **Billed to payer** (no patient share), **Billed by EMR**. | C-2, BL-9 |
| FR-D5 | **Receipt.** Every payment, refund and credit use prints a receipt with a lab receipt number from one gap-free sequence: prefix (setting, default `R`), year when the sequence resets yearly, and a six-digit number (`R-2026-004417`). It shows the lab name and contact, date and time, cashier, cash point, patient (name and ID), lab number, each line with list price, discount and its reason label (promotion name, exemption rule, override reason label; never the internal note), amount paid, mode and reference, balance left, and the fiscal number when one is set (FR-D6). A reprint is marked "Copy" and recorded. Receipts print on A4 or 80 mm receipt paper (setting). | C-15, BL-16 |
| FR-D6 | **Fiscal number.** A receipt has an optional fiscal number field, typed by the cashier from a fiscal device or filled by an adapter later. A setting makes it required before the receipt prints. No tax-authority connection is part of this FRS. | C-15 |
| FR-D7 | **Payment Modes & Cash Points page** (`/MasterListsPage/paymentModes`). **Payment modes:** Name, Kind (Cash, Mobile money, Card, Bank transfer, Voucher, Other), Extra fields (each with a label, whether required, and an optional pattern, for example "Phone number, required" and "Transaction reference, required"), Counted in the drawer (Yes for cash), Active. Shipped: Cash, Mobile money, Card, Bank transfer. **Cash points:** Name, Location (description), Active. Both are deactivated, never deleted. | C-20; pattern from `openmrs-module-billing` |
| FR-D8 | **Refund or credit.** For a credit due (FR-C3) or an overpayment, the cashier chooses **Refund** (money back; a reason from the override reason list and the original receipt are required; prints a refund receipt with its own number) or **Keep as credit** (the amount stays on the patient and is applied automatically to their next payment, FR-D3). A refund is a negative payment linked to the original; nothing is deleted. A refund over the **refund approval limit** (setting, empty by default meaning no approval) needs a second person with `billing:manage` to enter their sign-in, and records both names. | C-13 |
| FR-D9 | **Shifts.** A cashier opens a shift at a cash point with an **opening float** (amount). Payments can be taken only during an open shift. **Close shift** shows the expected cash (float plus cash payments less cash refunds), asks for the counted cash, records the difference and an optional note, and prints a shift summary (payments by mode, refunds, voids, receipt number range). A shift left open past midnight is closed at the next sign-in with "Closed automatically"; its count is left empty and the difference is shown as "Not counted". | C-20 |
| FR-D10 | **Void a receipt.** A receipt can be voided only during the shift that issued it, by its cashier, with a reason, in a danger confirmation Modal (D-005: destructive confirmation). The receipt keeps its number, is marked Void, and its payment is reversed. After the shift closes, a mistake is corrected with a refund. | C-15 |
| FR-D11 | **Payment gate** (setting, FR-L1): **Off** (default), **Hold testing until the patient's share is paid**, or **Hold the report until paid**. Only the patient's share counts; orders billed to an insurer, institution, program, environmental client or the EMR never wait. Hold testing: the order's samples show "Waiting for payment" in the sample acceptance and workplan views and cannot be accepted until paid, except by a user with `billing:release` who records a reason ("Released unpaid: {reason}"). Hold the report: the Report Print Queue shows the order as "Held: unpaid" and Print, Send and automatic delivery wait until paid or released by `billing:release`. Results are still entered and validated. | C-9, BL-8 |
| FR-D12 | **Order entry when Billing is on.** The manual Payment status picker is replaced by Bill to (FR-B3) and the read-only status (FR-D4). The `patientPayment` dictionary values stay for history: orders saved before Billing was switched on keep their recorded value, shown read-only as "Recorded before Billing: {value}". | Migration, §J |
| FR-D13 | **Mobile money push (optional).** When a mobile money gateway is set up (External Connections, type Mobile money), Take payment with a mobile money mode offers **Send payment request**: the patient approves on their own phone, and the payment is recorded when the gateway confirms it, with the gateway's reference. Until confirmation the payment shows "Waiting for the patient to approve" and can be cancelled. Without a gateway, mobile money is recorded by hand as in FR-D3. | S-13 PRD "payment gateway"; one gateway adapter per country |
| FR-D14 | **Payment chip on the order.** Wherever an order's summary strip or page header is shown (every order entry step and Sample check, Clinical Order Entry v4 FR-B2; environmental and vector the same, D-073), it carries a **payment chip**: a Tag with text, in the FR-M2 colours: **Unpaid {amount}**, **Partly paid, {amount} due**, **Paid**, **Waived**, **Billed to {payer}**, **Billed by EMR**, and, when the payment gate holds the order, **Held: unpaid {amount}**. The amount is the patient's balance due. Users with `billing:view` or `billing:collect` see the amount; others see the status only ("Unpaid"). For users with `billing:collect`, the chip is a link that opens the order at the Cash Desk (`/Billing/cash-desk?labNo=`); for others it is not interactive and has a tooltip naming the status source ("Set by Billing"). The chip updates without a page reload when a payment is saved elsewhere, the next time the order is opened or refreshed. With the Billing switch off, no chip is shown, unless Odoo's payment read is on (FR-J8): the chip then shows **Paid** or **Not paid** from Odoo, with no amount and no link, and a tooltip "Set by Odoo, read {time}". | Asked by Casey 2026-10-20; BL-31, BL-37 |
| FR-D15 | **Order dashboard** (`/order/clinical`, and the environmental and vector dashboards; Clinical Order Entry v4 section H). Each row gains a **Payment** column that shows only whether the order is paid: a green **Paid** tag or a red **Not paid** tag. **No amounts are shown on the dashboard**, whatever the user's privileges (amounts stay on the order's chip, FR-D14, and at the Cash Desk). **Paid** means nothing is left to collect at the lab's counter for the order: paid in full, waived or exempt, billed to a payer with no patient share, or billed by an EMR whose invoice is balanced or not readable (FR-J7). **Not paid** means a balance is due at the counter, including partly paid orders and orders the payment gate is holding. The tag's tooltip names the reason and where the status came from, never an amount: "Partly paid. Set by Billing", "Billed to Port Moresby General Hospital. Set by Billing", "Held by the payment gate. Set by Billing", "Set by Odoo, read 10:40". The dashboard gains a **Payment** filter (All, Paid, Not paid) beside the existing filters, encoded in the URL as `?payment=paid\|notPaid`. The existing **Unpaid** quick filter (Clinical Order Entry v4 FR-H1) counts Not paid orders and sets `?payment=notPaid`. There is no sort by amount. For users with `billing:collect`, a Not paid tag set by Billing links to the order at the Cash Desk (`/Billing/cash-desk?labNo=`); otherwise the tag is not interactive. The column and filter appear when Billing is on, or when Odoo is connected with its payment read on (FR-J8); with neither, the dashboard is as Clinical Order Entry v4 defines it. | Asked by Casey 2026-10-20; amounts removed and Odoo source added 2026-10-26; what counts as Paid confirmed 2026-11-01; BL-31, BL-37, BL-38 |
| FR-D16 | **Patient record, Billing section.** For users with `billing:view` or `billing:collect`, the patient record gains a **Billing** section: balance due across all the patient's orders, patient credit on file, open bills, the last 20 payments and receipts (with reprint), insurer member numbers on file, and exemptions that applied. **Take payment** opens the Cash Desk for the patient's oldest unpaid order. Users without those privileges do not see the section. | Casey 2026-10-20; BL-33 |
| FR-D17 | **Receipt by SMS or email.** After a payment the Cash Desk offers **Send receipt** to the patient's phone or email on file (or one typed for this send). The message goes through the Result Delivery outbox (product Billing) and carries the receipt number, amount, date and lab contact, never test names; email attaches the receipt PDF. | BL-33; needs the Result Delivery foundation |
| FR-D18 | **Balance reminders to patients** (setting, Off by default): when a patient's balance has been due for **{n} days after release** (default 14), one SMS or email reminder is sent with the amount, the lab number and the lab contact, never test names. Reminders show on the patient's Billing section and in Sent Messages. | BL-33 |
| FR-D19 | **Price check** (Cash Desk toolbar, `?tool=priceCheck`): pick a payer (search) and tests, panels and billable services (search); see each line's price, promotions and exemptions that would apply for a patient age entered, tax, the patient's share and the total, without registering anything. **Print estimate** prints it with "Estimate, valid today only". | Casey 2026-10-20 |

### E. Overrides, waivers and exemptions

| ID | Requirement | Notes |
|---|---|---|
| FR-E1 | **Override a price** on one charge, or on the whole order as a percentage or an amount off, from order entry section 7 or the Cash Desk. The user enters the new price (or discount), picks a **reason** from the lab's override reason list (dictionary category "Price override reason"; shipped: Hardship, Staff, Goodwill, Wrong price list, Agreed with the client, Other) and types a note; the note is required when the reason is Other. The charge keeps its list price and records who, when, list price, new price, reason and note. No approval is needed. | C-17, BL-13 |
| FR-E2 | **Waive** is an override to zero, with a reason and a note; for a waiver the note is always required. A waived charge's status is Waived and its free reason is "Waived ({reason})". Switching an order billed by the EMR to "Bill in the lab instead" records a reason the same way. | C-17 |
| FR-E3 | **Overrides on paid charges** are refused: "This line is paid. Refund or credit it at the Cash Desk instead." | |
| FR-E4 | **Overrides on insured orders** change only the patient's share; the claim line keeps the insurer's price-list amount. When the insurer's setting **Overrides change the claimed amount** is Yes, the override changes the claimed amount too and its reason label is carried on the claim line. | C-17 (provisional, Open Question 2) |
| FR-E5 | **Patient's share on insured orders** starts from the insurer's setting (None, a percentage, or a fixed amount per order) and can be changed on the order by a user with `billing:collect`, which records it like an override. | C-7 |
| FR-E6 | **Exemption Rules page** (`/MasterListsPage/exemptionRules`). An exemption waives the patient's share automatically when its condition holds when the charge is created. Conditions combine, all must hold: patient age (under, over, between, in years or months), patient sex, enrolled in program (search), order's program (search), test or panel (search), lab unit (search), payer type. Each rule has a name (printed on receipts, for example "Under-5 free care"), what it waives (all of the patient's share, or a percentage), start and end date (optional), and Active. Rules are deactivated, never deleted. Shipped: none active. Pregnancy is expressed through the order's program (for example Antenatal care); no pregnancy field is added (MUST A). | C-20, BL-19; pattern from `openmrs-module-billing` exemptions, with conditions as fields rather than scripts |
| FR-E7 | **Exemptions and payers.** An exemption waives the patient's share only. A program that pays (FR-B2) is a payer, not an exemption: its tests are charged to the program at its price list. The Value of Free Services report (FR-K5) counts both. | |
| FR-E8 | **Overrides report** (FR-K3) has three sections, each with its own totals: **Overrides and waivers** (including switching an EMR-billed order to Bill in the lab instead), **Exemptions** (by rule), and **Promotions** (by promotion). Each lists, for a period: Date, Lab number, Item, Payer, List price, Charged, Difference, Reason or rule or promotion, Note (users with `billing:view`), By. Filters: period, person, reason, item, payer, promotion, rule. Totals by reason and by person. | C-17 |

### F. Bills, statements, quotes and receivables

| ID | Requirement | Notes |
|---|---|---|
| FR-F1 | **Bills & Statements** (`/Billing/bills`) lists bills and statements: Number, Kind (Bill, Statement), Payer, Period or order, Issued, Due, Total, Paid, Balance, Status (Draft, Open, Overdue, Paid, Void), Last reminder. Filters: kind, payer (search), status, period. A row expands to its lines, payments and history. Actions: **Record payment** (amount, date, mode, reference; applied to the statement's lines oldest first), **Send** (email through Result Delivery's outbox, FR-F5), **Print**, **Credit a line** (a credit line with a reason, on the next statement), **Void** (danger confirmation, with a reason; a void statement's lines become unbilled-to-statement again). | C-24, BL-21 |
| FR-F2 | **Statements are made on schedule.** For each institution, program and environmental client with a schedule (FR-B1, FR-B2), OpenELIS creates a statement at the end of each period, holding every charge to that payer whose test was released in the period and is not on an earlier statement, plus credit lines, less payments received. The statement is Draft until a billing clerk issues it (Issue, or Issue all drafts); issuing sets its due date from the payer's payment terms. **Make statement now** creates one for a payer and period on demand. | C-24 |
| FR-F3 | **Statement contents** (printed and PDF): lab name and contact, payer and billing contact, statement number and period, issue and due date, one line per test (release date, lab number, patient name or initials per setting FR-L1, test, payer billing code, list price, discount with its reason label, price charged), billable services, credits, subtotal, payments received, **amount due**, and payment instructions (setting). Patient names on statements to institutions follow the setting **Statements show** (Patient name, Initials and patient ID); default Initials and patient ID. | C-24 |
| FR-F4 | **Bills.** Every order with a patient share, and every order billed to a payer whose statement schedule is Per order only, has a bill, created with its first charge and kept in step with the order. **Print bill** prints it at the Cash Desk or on the order. A bill lists the order's charges and the balance due; paying it at the Cash Desk prints a receipt. The bill is what Odoo receives as the invoice (FR-J2). | |
| FR-F5 | **Sending statements and reminders.** Send emails the statement PDF to the payer's billing contact through the Result Delivery outbox and Sent Messages (product **Billing**, D-222). A statement still unpaid **{n} days after its due date** (setting, default 7, then every 14 days) gets an automatic reminder to the billing contact, up to the number of reminders set (default 3). Reminders show on the statement's history and in Sent Messages. | C-24; needs Result Delivery foundation |
| FR-F6 | **Credit limit warning.** When an order is billed to a payer whose open balance plus the new order's charges passes its credit limit, order entry section 7 shows a warning: "{payer} owes K{balance}, over its K{limit} credit limit." The order still saves (never a block). The payer's row on the Aging report is marked "Over limit". | C-24, BL-22 |
| FR-F7 | **Aging** (FR-K4) lists each payer's open balance in age brackets by due date: Not yet due, 1 to 30, 31 to 60, 61 to 90, Over 90 days; plus Over limit, Disputed (FR-O3) and Last payment. A payer row opens its open statements and bills. Patients appear as one row, **Patients (all)**, aged from each bill's release date, which opens a list of patients with balances. | C-24 |
| FR-F8 | **Quotes** (`/Billing/quotes`). A quote has a client (search over payers), a contact, tests and panels (search) with sample counts per item, billable services, prices from the client's price list (overridable per line with a reason, FR-E1), a validity end date (default 30 days, setting), notes printed on the quote, and status Draft, Sent, Accepted, Expired, Converted. **Send** emails the quote PDF through the outbox; **Print**; **Mark accepted** (records who accepted and how: Signed, Email, Phone); **Re-issue** (a new quote number with today's prices, linked to the old one). A sent quote is never edited; changing it means Re-issue. | C-16, BL-18 |
| FR-F9 | **Quote to order.** At environmental or vector order entry, **Start from a quote** (a search over accepted, unexpired quotes for the requesting organization) fills the order's requester, Bill to and tests. Each test's charge takes the quote's price (locked, FR-C9). Samples beyond the quoted count, and tests not on the quote, are charged at the client's list price (after any running promotion) and flagged "Over quote". A quote can be used by several orders until its sample counts are used up; the quote shows "{used} of {quoted} samples received". | C-16; Env/Vector Order Entry v4 change, §N |
| FR-F10 | **Payments from institutions and clients** recorded on a statement (FR-F1) also show in the Collections report (FR-K7) and, when Odoo is on, are sent to Odoo (FR-J2). | |

### G. eBilling: coverage, pre-authorization and claims

| ID | Requirement | Notes |
|---|---|---|
| FR-G1 | **Claim connection.** Each insurer that takes electronic claims names an **External Connection** (type FHIR claims) holding the address of the health information exchange (HIE) or payer endpoint and its credentials, and a **payer adapter** (FR-I1). Secrets are never returned to the browser (Admin Redesign AS-31). An insurer without a connection gets paper claims: the same claim, printed and marked "Submitted on paper" by hand. | C-5 |
| FR-G2 | **Check coverage** at order entry (when the insurer supports it, FR-B1) sends the member number and patient to the insurer through its adapter and shows the answer beside the member number: **Covered** (green), **Not covered** (red, with the insurer's reason), or **Could not check** (gray, with the time). The result and time are kept on the order. It **never blocks** saving: reception can carry on or change Bill to. A check older than the setting **Coverage check valid for** (hours, default 24) is shown as "Checked {date}" without a colour. | C-11, BL-24 |
| FR-G3 | **Coded diagnosis.** When the insurer **Requires coded diagnosis**, order entry asks for one or more diagnosis codes (ICD-10, searched by code or words) before the order can be saved as complete; the free-text provisional diagnosis stays as it is. The codes travel on the claim as `Condition` resources. | C-21; Dependency on order entry v4 |
| FR-G4 | **Pre-authorization.** A test whose Billing section lists the insurer under **Pre-authorization required by** (FR-C4) shows "Needs pre-authorization" on the order. **Request pre-authorization** sends a FHIR `Claim` with `use` = `preauthorization` for those tests; the answer (Approved with its reference, Denied with reason, Pending) shows on the test. Testing is not held: a test done without approval is flagged on the claim worklist as "No pre-authorization". | C-21 |
| FR-G5 | **When lines become claimable.** A charge to an insurer becomes a claim line when its test's result is released (C-8). A billable service on the order becomes claimable with the first released test. | C-8 |
| FR-G6 | **Claims are made per order or per batch**, by the insurer's setting **Send claims** (Per order when results are released; Daily batch; Weekly batch). A claim holds the patient and coverage (member number), the lab as provider, the requesting facility and clinician, diagnosis codes when present, and one item per claim line: service code (payer billing code, else the test's LOINC or own code), service date (collection date), release date, quantity, unit price and net amount. Claim lines carry the **payer's share** (the price less the patient's share); the patient's share is shown on the claim as the payer's guide requires, left to the adapter (FR-I1). Claims are created as **Draft** and listed on Claims (FR-G7). | C-5, BL-23 |
| FR-G7 | **Claims page** (`/Billing/claims`): Claim number, Insurer, Patient (initials and member number), Orders, Lines, Claimed, Paid, Status (Draft, Submitted, Accepted, Partly accepted, Rejected, Paid, Partly paid, Void), Submitted, Filing deadline, Last update. Filters: insurer, status, period, **Needs attention** (Rejected, Partly accepted, denied lines, underpaid lines, no pre-authorization, filing deadline within 7 days). A row expands to its lines with each line's adjudication, the messages sent and received, and the history. Actions: **Submit** (one or selected Drafts), **Void** (danger confirmation), **Fix and re-send** (FR-G9), **Mark submitted on paper**. | C-5, C-24 |
| FR-G8 | **Submit** sends the claim, or a FHIR `Bundle` of the selected claims, through the insurer's adapter. The status becomes **Submitted**. The insurer's `ClaimResponse` (sent back, or fetched by the adapter) sets the status from its outcome: `complete` gives Accepted, `partial` gives Partly accepted, `error` gives Rejected, `queued` keeps Submitted. Each line's adjudication (allowed amount, paid amount, denial reason) is stored on the line. Sending uses the Result Delivery outbox pattern: queued before any attempt, retried, never lost (Result Delivery OGC-1506 FR-A7, FR-A8, not this FRS's). | C-5 |
| FR-G9 | **Corrections.** **Fix and re-send** on a claim with denied or rejected lines opens those lines for correction (member number, diagnosis codes, service code, price) and sends a **new claim** for them that points to the original (`Claim.related.claim`, relationship `prior`). Lines the insurer accepted or paid cannot be re-sent. **Void** sends the claim to the insurer with `Claim.status` = `entered-in-error` and keeps it, marked Void, with every message in its history. | C-14, BL-25 |
| FR-G10 | **Follow-up claims.** A charge to the insurer created after the order's claim was submitted (an add-on test) goes on a new claim linked to the first (relationship `associated`), made by the insurer's Send claims schedule. | C-24 |
| FR-G11 | **Filing deadline.** When the insurer has a claim filing limit, each unsent claim line shows its deadline (release date plus the limit). Lines within 7 days of the deadline (setting) are listed under Needs attention and counted on the overview; lines past the deadline are marked "Past filing deadline" and can still be sent. | C-24 |
| FR-G12 | **Claims to programs.** A program that pays is billed by statement (FR-F2), not by claim, unless the program is set up as an insurer with a claim connection. | |

### H. eRemittance: matching the insurer's payments

| ID | Requirement | Notes |
|---|---|---|
| FR-H1 | **Receiving remittances.** The insurer's remittance arrives through its adapter, as FHIR `PaymentReconciliation` or, where the country's guide uses it, `PaymentNotice` (the Kenya eClaims guide uses `PaymentNotice`). The adapter turns either into one **remittance**: insurer, payment date, amount, payment reference, and details each pointing to a claim or claim response with an amount. A remittance can also be **entered by hand** from a paper or PDF advice: insurer, date, amount, reference, then each claim and amount, matched as in FR-H3. | C-5, BL-26 |
| FR-H2 | **Remittances page** (`/Billing/remittances`): Received, Insurer, Reference, Amount, Matched, Unmatched, Status (**Matched**: every detail matched, waiting to apply; **Review**: something did not match; **Applied**). Filters: insurer, status, period. | |
| FR-H3 | **Matching.** Each detail is matched to its claim, then to the claim's lines by their adjudicated amounts. A detail matches when its claim exists, belongs to that insurer, and the amount is not more than the claim's open amount. Matched details are applied with **Apply** (one or all Matched): the payment goes to the charges, which become Paid or Partly paid, the claim becomes Paid or Partly paid, and the orders' Payment status follows with source "Set by Billing" (FR-D4). Nothing is applied automatically when anything on the remittance needs review. | C-5 |
| FR-H4 | **Review queue.** Unmatched details (unknown claim, another insurer's claim, amount over the claim's open amount) are listed on the remittance with the reason, and with **Match to a claim** (search) or **Hold as unapplied** (kept on the insurer as an unapplied payment, shown on Aging). | |
| FR-H5 | **Differences worklist.** A claim line paid less than its claimed amount (after the patient's share) appears under Claims › Needs attention with the difference and the insurer's reason, and three actions: **Accept as adjustment** (the difference is written off with the insurer's reason; Underpayment report, FR-K8), **Move to the patient's share** (the difference becomes due from the patient at the Cash Desk), **Fix and re-send** (FR-G9). | C-5, C-24 |
| FR-H6 | **Underpayment is measured against the agreed price**: the insurer's price-list amount for the line on the service date. The Underpayment report (FR-K8) totals the differences per insurer and reason. | C-24 |

### I. Payer adapters and the FHIR door

| ID | Requirement | Notes |
|---|---|---|
| FR-I1 | **One adapter per country or payer**, chosen on the insurer's claim connection: **FHIR R4 base** (shipped: `Claim`, `ClaimResponse`, `CoverageEligibilityRequest` and `CoverageEligibilityResponse`, `PaymentReconciliation`) and **Kenya eClaims** (shipped as the first country adapter, following the Kenya eClaims FHIR IG: claims as a `collection` Bundle with Patient, Encounter, Condition and Organization; coverage check as `GET Coverage?subscriber=`; remittance as `PaymentNotice`). Further adapters are added by implementing the same interface. Billing's own records never assume one message shape. | C-5, C-11, BL-26 |
| FR-I2 | **A named door.** Claims out and remittances in are their own FHIR exchange with their own service identity and their own audit, separate from the result push and the FHIR facade, as the data-exchange audit requires (PR #4660). Every message sent and received is kept with the claim or remittance. | PR #4660 |
| FR-I3 | **Profiles in the OpenELIS FHIR IG.** The claim, coverage check, pre-authorization and remittance profiles the base adapter uses are published in the OpenELIS FHIR Implementation Guide. | IG change, §N |
| FR-I4 | **Bills as FHIR `Invoice`.** OpenELIS publishes each bill and statement as a FHIR `Invoice` (with a `ChargeItem` per charge, referencing the `ServiceRequest` of the test) through the FHIR exchange, readable by the system that sent the order, so an EMR can show the lab's charges and paid status for its patient. Read-only; only for orders billed by the lab; the same named-door rules as FR-I2. This mirrors the `Invoice` that `openmrs-module-billing` exposes (FR-J7). | Casey 2026-10-20; BL-35 |

### J. Odoo backend and migration

| ID | Requirement | Notes |
|---|---|---|
| FR-J1 | **OpenELIS is the record** of prices, charges, payments, receipts, claims and remittances. Odoo, when connected (`org.openelisglobal.odoo.enabled`), is the accounting backend. Odoo never sets prices. | C-10, BL-27 |
| FR-J2 | **What goes to Odoo:** one customer invoice per **bill or statement** (not per order), to the payer's Odoo partner (the patient for patient bills; the organization or program otherwise); each payment, refund and remittance applied, as an Odoo payment against that invoice. Partners are matched by the OpenELIS payer's identifier, never by name; a payer with no match creates one. There is no fallback partner: a send that cannot find or create a partner fails and is retried (`odoo_sync_queue`, FR-J4). | C-10 |
| FR-J3 | **What comes back:** a payment entered directly in Odoo against an invoice OpenELIS sent is read back on a schedule (a new server property, `org.openelisglobal.odoo.paymentReadMinutes`, default 60, shown read-only in Integrations & exchange with the other Odoo settings) and recorded in OpenELIS as a payment with mode "Recorded in Odoo" and the Odoo reference, which sets the charges and Payment status like any other payment. The same schedule drives the order-level read in FR-J8. | C-10 |
| FR-J4 | **Retry and status.** Every Odoo send is queued in `odoo_sync_queue` before any attempt, as today (#2274), and retried with backoff; a failed send shows on the bill or statement as "Not in Odoo yet: {error}" and on the overview. | Existing retry queue |
| FR-J5 | **The price file retires.** `/var/lib/openelis-global/odoo/odoo-test-product-mapping.csv` is read once, at the first start with Billing on, into the Default price list (matched by test name in the configured locale, as the file was keyed); rows that match no test are listed in the start-up log and on Unbilled Work's "Import problems" note for the administrator. After that the file is not read. Odoo product names stay as the line description sent to Odoo (a field per price list item, optional). | C-10, BL-27 |
| FR-J6 | **Existing Payment status values** (dictionary `patientPayment`) stay on old orders and are shown read-only (FR-D12). They are not converted: "Normal insurance payment" says nothing about which insurer paid. | |
| FR-J7 | **EMR invoices.** For an order billed by the EMR (FR-B5), OpenELIS reads the EMR's FHIR `Invoice` for that order (exposed by `openmrs-module-billing`) when the payment gate needs it, and treats the order as paid when the invoice is balanced. Without a readable invoice the gate does not hold EMR-billed orders. | C-18; Dependency on the invoice-to-order link |
| FR-J8 | **Payment status from Odoo.** When Odoo is connected (`org.openelisglobal.odoo.enabled`), OpenELIS reads whether each order's Odoo invoice is paid and shows it as the order's Payment status, so a lab that keeps its accounts in Odoo sees Paid or Not paid without entering it twice. This works **with the Billing switch off**, using the invoice OpenELIS already creates when an order is saved (#2274: `account.move`, `move_type` `out_invoice`, `ref` `OE-{lab number}`). On the FR-J3 schedule, OpenELIS reads `payment_state` and `state` for the invoices of orders entered in the last 90 days (a new server property, `org.openelisglobal.odoo.paymentReadDays`, default 90, read-only in Integrations & exchange), in batches matched by `ref`. `paid` and `in_payment` set **Paid**; `not_paid` and `partial` set **Not paid**; a cancelled invoice (`state` `cancel`), a reversed one (`payment_state` `reversed`) or no invoice at all leaves the order with no Payment status; any other value leaves the status unchanged and is logged. The order's Payment status field (Clinical Order Entry v4 FR-B28) is then read-only with "Set by Odoo" and the time of the last read; the payment chip (FR-D14) and the order dashboard column and filter (FR-D15) use it. A failed read keeps the last value, and the tooltip says "Odoo not reachable, last read {time}". With `paymentReadMinutes` set to 0 the read is off and the field stays hand-set, as today. **With Billing on**, payments come back through FR-J3 instead; orders invoiced in Odoo before Billing was switched on keep being read this way until they are Paid or fall outside the read window. | Asked by Casey 2026-10-26; BL-37; Clinical Order Entry v4 FR-B28 anticipated this |

### K. Reports and the Billing overview

| ID | Requirement | Notes |
|---|---|---|
| FR-K1 | **Billing overview** (`/Billing`), built on the shared dashboard pattern used by the management dashboard (tiles over the same report queries), never a page of its own numbers. Tiles, each a link to the list behind it: **Collected today** (cash desk payments less refunds, by mode on hover), **Collected this month** (all payments, including statements and remittances), **Unbilled work** (count and value at list price, FR-C7), **Released while unpaid** (count, FR-K2), **Owed to the lab** (total open balance, with the over-90-days part), **Claims needing attention** (count, FR-G7), **Claim denial rate** (denied claim lines over submitted lines, last 30 days), **Days from release to claim** (median, last 30 days), **Open shifts** (count, with cashier names). Tiles a release has not shipped yet are not shown. | C-25, BL-29 |
| FR-K2 | **Revenue Integrity report**: one report for lab managers and auditors, with period, person and cash point filters. Sections: **Released or delivered while unpaid** (orders whose report was printed, sent or delivered while a patient share was due, with who released it and any gate release reason), **Receipt sequence** (gaps, which should never occur, and voids, with reason and cashier), **Refunds and credits** (by cashier, with reasons and approvals), **Overrides and waivers** (totals by reason and person, linking FR-K3), **Cash counts** (each closed shift: expected, counted, difference, note; shifts closed automatically). | C-23, BL-28 |
| FR-K3 | **Overrides report** as FR-E8. | C-17 |
| FR-K4 | **Aging report** as FR-F7. | C-24 |
| FR-K5 | **Value of Free Services report**: for a period, every test that was free to the patient because of an exemption, a waiver or a paying program, priced at the Default list (or a list chosen in the report), grouped by program, exemption rule and lab unit, with counts and value. Printable and exportable (CSV) for funders. | C-21 |
| FR-K6 | **Referral Costs report**: per reference lab and period, referred tests with the cost from the lab's "What they charge us" list, what the lab charged its own payer, and the margin; and **Check an invoice**, where the clerk enters a reference lab invoice's total and lines (or imports its CSV) and sees each line matched to a referred test, with tests invoiced but not sent and sent but not invoiced. | C-21 |
| FR-K7 | **Collections report**: payments received by day, mode, cash point, cashier and payer kind (patient, institution, program, client, insurer), with refunds. | C-20 |
| FR-K8 | **Denials and Underpayment report**: denied claim lines by insurer and reason over time, and underpaid lines by insurer and reason (FR-H6), with amounts. | C-24 |
| FR-K9 | **Exports.** Every report exports to CSV and prints; the charge, payment, statement, claim and remittance records are sources in Custom Data Export. | |
| FR-K10 | **Tax report**: tax collected (on payments) and tax charged (on charges) by rate, month and payer kind, with taxable amounts; exportable for the lab's tax return. | BL-32 |
| FR-K11 | **Revenue report**: for a period, charged, discounted, waived and exempted, and collected amounts, with test counts, by test or panel, lab unit, payer, payer kind and month, with a comparison to the previous period. For lab managers (`billing:view`). Also a Custom Data Export source. | Casey 2026-10-20; BL-36 |

### L. Billing settings (Configuration, Billing area)

| ID | Requirement | Notes |
|---|---|---|
| FR-L1 | **Configuration gains a Billing area** (`?area=billing`), after Orders & samples (BL-3). Settings, stored as `site_information` entries: **Payment gate** (Off, Hold testing until the patient's share is paid, Hold the report until paid; default Off); **Receipt prefix** (default R); **Restart receipt numbers each year** (default Yes); **Receipt paper** (A4, 80 mm); **Fiscal number required on receipts** (default No); **Refund approval limit** (amount, empty means none); **Statements show** (Initials and patient ID, Patient name; default Initials and patient ID); **Statement payment instructions** (text, per language); **Patient balance reminders** (Off, On after {n} days; FR-D18); **Days after due before the first reminder** (default 7), **Days between reminders** (default 14), **Reminders to send** (default 3); **Quote valid for (days)** (default 30); **Coverage check valid for (hours)** (default 24); **Warn before a claim filing deadline (days)** (default 7). | C-9, C-12, C-15 |
| FR-L2 | **Currency** is set once per deployment in the distribution configuration (code, symbol, decimal places), shown read-only in the Billing area and in Site Information, like the laboratory time zone (D-075). Decimal places default to the currency's ISO 4217 value and can be set in the distribution configuration (Indonesian rupiah, listed with 2, is used with 0). Amounts are stored exactly and rounded once per bill, statement, receipt and claim total. | C-12 |
| FR-L3 | **Settings that already exist move into the Billing area:** `trackPayment` (Track patient payment; with Billing on it is shown as "Replaced by Billing"), `billingRefNumber` and `billingRefNumberLocalization` (Billing reference number block). The Odoo settings stay in Integrations & exchange (server file, read-only, Admin Redesign CF-33). | Admin Redesign Appendix B change, §N |

### M. States, errors and accessibility

| ID | Requirement | Notes |
|---|---|---|
| FR-M1 | Every list loads with a skeleton; a load error names what failed with Retry ("Claims could not be loaded."); an empty list explains what will appear there ("No statements yet. Statements are made at the end of each payer's period."); a list emptied by filters offers Clear filters. A failed save keeps the user's input and says what failed. | Admin standard AS-34 |
| FR-M2 | Every status is text plus colour, never colour alone. Charge status: Unpaid (red), Partly paid (warm-gray), Paid (green), Waived (teal), Reversed (gray), Billed to payer (blue), On statement (blue), Claimed (purple); a released test with a free reason shows Not charged (gray) with its reason. Order Payment status: the same colours, plus Billed by EMR (gray). Remittance: Matched (blue), Review (red), Applied (green). Promotion: Scheduled (purple), Running (green), Ended (gray). Claim line adjudication: Accepted (green), Denied (red). Statement: Draft (gray), Open (blue), Overdue (red), Paid (green), Void (gray). Claim: Draft (gray), Submitted (purple), Accepted (green), Partly accepted (warm-gray), Rejected (red), Paid (green), Partly paid (warm-gray), Void (gray). Quote: Draft (gray), Sent (purple), Accepted (green), Expired (warm-gray), Converted (teal). | |
| FR-M3 | Amounts show the currency symbol and the deployment's decimal places, right-aligned in tables, with negative amounts (refunds, credits) shown with a minus sign and the word "Refund" or "Credit", never colour alone. | |
| FR-M4 | Take payment, Refund, Void, Close shift, Submit and Apply are keyboard reachable, and their accessible names include the record ("Take payment, CPHL-26-004188"; "Void receipt R-2026-004417"). The Cash Desk search takes a barcode scanner as keyboard input. | WCAG 2.1 AA |
| FR-M5 | **Concurrency.** Two cashiers paying the same order: the second save is refused with "This order was paid at {time} by {cashier}. Reload to see it." (version check, AS-26). | |
| FR-M6 | **Offline cash desk is out of scope**; when the server cannot be reached, Take payment says so and keeps the entered amount and mode on screen. | |

### O. Finance controls

| ID | Requirement | Notes |
|---|---|---|
| FR-O1 | **Closing a period.** A billing manager closes a month from the Billing overview (**Close {month}**), after a check that lists anything still open in it: shifts not closed, remittances in Review, statements in Draft. Once closed, no charge, payment, refund, credit, void, override or adjustment dated in that month can be created or changed; a correction is made in the open period and references the original. **Reopen** needs `billing:manage` and a reason, and is recorded. Odoo sends are unaffected. | Casey 2026-10-20; BL-34 |
| FR-O2 | **Opening balances.** When Billing goes live, a billing manager imports each payer's existing balance from CSV (payer code, reference, date, amount, due date), with a preview before anything is saved (the shared import review). Each row becomes an **Opening balance** line on the payer's account: on Aging, on the payer's next statement, and paid like any other line. Patients' opening balances can be imported the same way (patient ID instead of payer code). | BL-34 |
| FR-O3 | **Disputed lines.** On an issued statement, a billing clerk can mark a line **Disputed** with a reason and the payer's contact. A disputed line is shown on the statement with a Disputed tag, left out of the amount reminders ask for, and shown in its own Aging column. It is resolved by **Credit** (FR-F1) or **Undispute**, both recorded. | BL-34 |
| FR-O4 | **Tests cancelled after testing started.** When a test is cancelled after its sample was accepted for testing, its charge stays when the test's "Charge when cancelled after testing started" is Yes (default), with the reason "Cancelled after testing started"; otherwise the charge is reversed as in FR-C3. | BL-34 |

### N. Changes required in sibling specs

Sibling FR IDs carry their spec's prefix so they do not collide with this FRS's IDs.

| Spec | Change |
|---|---|
| **Clinical Order Entry v4 (OGC-1266)** | Section 7: Bill to (FR-B3), insurer fields and member number (FR-B4), Check coverage (FR-G2), coded diagnosis when the insurer requires it (FR-G3), pre-authorization flag (FR-G4), the order charge list with Override (FR-C10, FR-E1), credit limit warning (FR-F6), "Billed by {system}" with Bill in the lab instead (FR-B5). OGC-1266 FR-B28's Payment status becomes read-only "Set by Billing" when Billing is on (FR-D4); its open item 21 and the out-of-scope "billing integration" line close. The Unpaid quick filter (OGC-1266 FR-H1) uses Billing's patient balance. **Payment chip** on the summary strip and page header (OGC-1266 FR-B2; this FRS FR-D14); **Payment** column (Paid or Not paid, no amounts) and filter on the order dashboard (OGC-1266 FR-H1, FR-H2; this FRS FR-D15). With Billing off and Odoo connected, FR-B28's Payment status is set by Odoo, read-only "Set by Odoo" (this FRS FR-J8), as FR-B28 anticipated. |
| **Environmental and Vector Order Entry v4** | The same section 7 block (D-073); Bill to defaults to the requesting organization; **Start from a quote** (FR-F9); the payment chip on the summary strip and the Payment column (Paid or Not paid) and filter on the environmental and vector dashboards (FR-D14, FR-D15); the Odoo payment read (FR-J8). |
| **Locations & Organizations** | Billing section on the organization row (FR-B1), Payer filter and column (FR-B7), "What they charge us" for referral labs, "Payer ID" as an identifier label. L&O mints `admin.locations.billing.*`. |
| **Programs Management** | Billing section on the program row (FR-B2). |
| **Test Catalog** | Billing section on the test and panel editor (FR-C4), including Tax category (FR-A11) and Charge when cancelled after testing started (FR-O4); completeness check line "No price on {list}" (FR-A9). |
| **Report Print Queue (OGC-1031)** | "Held: unpaid" when the gate holds the report (FR-D11); Print, Send and automatic delivery wait until paid or released by `billing:release`; releasing records the reason. |
| **Result Delivery (OGC-1506)** | A product **Billing** in the outbox and Sent Messages for statements, reminders and quotes (FR-F5, FR-F8), with its own templates (statement email, reminder email, quote email). Merge fields: `{lab_name}`, `{payer_name}`, `{statement_number}`, `{period}`, `{amount_due}`, `{due_date}`, `{quote_number}`, `{valid_until}`, `{lab_contact}`; no patient fields. |
| **Sample acceptance and workplans** | "Waiting for payment" when the gate holds testing (FR-D11). |
| **Admin Redesign** | Configuration: a 14th area **Billing** (FR-L1, FR-L3); module switch **Billing** (`billingEnabled`); Menu Configuration's Billing address is ignored, with a note, when Billing is on. Admin SideNav: a **Billing** group in Resources (BL-4). |
| **Navigation Redesign** | A **Billing** section between Reports and Administration (BL-2, amends D-064); `menu_billing` becomes its heading; Overview, Cash Desk, Bills & Statements, Quotes, Claims, Remittances, Unbilled Work, Reports as its entries. |
| **Users and Roles (PR #3443)** | Appendix A: category `billing` maps to a new **Billing** display group. |
| **FHIR IG and data-exchange audit (PR #4660)** | Claims and remittances as a named door (FR-I2); claim, coverage, pre-authorization and remittance profiles in the IG (FR-I3). |
| **Custom Data Export** | Billing sources (FR-K9), including revenue (FR-K11). |
| **Patient record** | A Billing section for billing users (FR-D16). |
| **Management dashboard** | Shares the Billing overview's tiles (FR-K1). |
| **Patient report (OGC-1111)** | Confirm whether the patient's `useBillingNumber` and the order's `billingRefNumber` are one datum (Open Question 4). |

---

## Information & Data

Specs name the information a feature needs; how it is stored is the implementing engineer's choice.

Reused as is or widened:

| Information | Source today |
|---|---|
| Orders, their tests and panels, samples, priority, program, requester | Sample, Analysis, Panel, Program, requester and requesting organization |
| Electronic orders and the system they came from | `ElectronicOrder` (orders pulled from the FHIR store) |
| Test release (the moment a test is claimable and appears on statements) | Analysis status at release (validated and released) |
| How a test was added: order entry, added later, reflex, analyzer, repeat | Analysis creation path (the reflex engine, add-test, analyzer import); recorded on the charge (below) |
| QC and EQA samples | Environmental QC sample profile; EQA flag on the order |
| Sample rejection and redraw | Sample rejection (NCE) and the redraw request |
| Lab units | Test sections ("Lab Units") |
| Payers that are organizations | Organization (Locations & Organizations), its identifiers table (label "Payer ID") and types |
| Payers that are programs | Program (Programs Management) |
| Patient, patient ID, national ID, age, sex | Patient, Person |
| Order Payment status (hand-set today) | ObservationHistory type `paymentStatus`, dictionary category `patientPayment` (kept for orders before Billing) |
| Billing reference number on the order | `billingRefNumber`, `billingRefNumberLocalization` |
| Odoo connection, retry queue | `org.openelisglobal.odoo.*`, `odoo_sync_queue`, `OdooIntegrationService` (reworked, FR-J) |
| Outbox, templates, Sent Messages | Result Delivery foundation (product Billing added) |
| Endpoint and credentials for HIE claims and mobile money gateways | External Connection (new types FHIR claims, Mobile money) |
| Laboratory time zone and Site Information | `site_information`, distribution configuration |
| History of changes | The shared History panel (audit trail) |
| Dictionary lists | Dictionary categories (new category "Price override reason") |

New information (all declared in Dependencies):

- **Price list:** name, description, panel pricing (Panel price, Sum of tests), default flag, active; **price list item:** item (test, panel or billable service), price, valid from and to, payer billing code, optional Odoo product name, changed by and when.
- **Promotion:** name, reason, covered items (tests, panels, lab units), fixed price or percentage, start and end, the price lists it applies to.
- **Billable service:** name, code, kind, added by rule (rule and on or off), active.
- **On an Organization (Billing section):** payer type, price list, statement schedule, payment terms, credit limit, billing contact, claim connection, claim filing limit, supports coverage check, requires coded diagnosis, overrides change the claimed amount, send claims (per order, daily, weekly), patient's share default, what they charge us (a price list), who bills orders from this referring facility.
- **On a Program (Billing section):** pays for its tests, price list, statement schedule, billing contact.
- **On an external order source:** who bills these orders (lab, EMR).
- **On a test and panel (Billing section):** billable, charge reruns, charge repeats, charge redraws, charge reflex, charge when added after registration, pre-authorization required by (insurers).
- **On an order:** Bill to (payer), member number, patient's share setting, coverage check result and time, diagnosis codes (ICD-10), who bills (lab or EMR, with reason when changed), quote used.
- **On a patient:** member number per insurer; patient credit balance.
- **Charge:** order, item, how it was added, price list, list price, charged price, patient's share, payer's share, difference reason (promotion, exemption, override reason and note), status, statement or claim it is on, free reason (for released tests with no charge), created by and when; reversal (who, when, reason).
- **Payment:** amount, mode and its extra field values, cash point, shift, cashier, date, applied to which charges, receipt number, fiscal number, linked original (for refunds), approval (for refunds over the limit), source (Cash desk, Statement, Remittance, Odoo).
- **Receipt sequence:** prefix, year, last number; receipt void (who, when, reason).
- **Payment mode:** name, kind, extra fields (label, required, pattern), counted in the drawer, active. **Cash point:** name, location, active.
- **Shift:** cashier, cash point, opened, opening float, closed, expected cash, counted cash, difference, note, closed automatically.
- **Exemption rule:** name, conditions (age, sex, program enrolment, order program, items, lab units, payer type), waived share (all or percentage), start and end, active.
- **Bill and statement:** number, kind, payer, order or period, issued, due, lines (charges and credit lines), payments, status, reminders sent, void (who, when, reason).
- **Quote:** number, client, contact, items with sample counts and prices, billable services, valid until, notes, status, accepted (who, how, when), re-issued from, samples used.
- **Claim:** number, insurer, patient and coverage, orders, lines (charge, service code, quantity, unit price, net), diagnosis codes, use (claim or pre-authorization), status, related claim (prior or associated), filing deadline per line, messages sent and received with times; **line adjudication:** allowed, paid, denial reason.
- **Remittance:** insurer, date, amount, reference, source (electronic, by hand), details (claim or response reference, amount, match result), status; **unapplied payment** on an insurer.
- **Adjustment:** claim line, amount, insurer reason, action (accepted, moved to patient, re-sent), by and when.
- **Odoo link:** for each bill, statement and payment, the Odoo invoice or payment reference and last send status. For each order read under FR-J8: the Odoo invoice `ref`, the last `payment_state` and `state` read, the resulting Paid or Not paid, and the time of the last successful read (shown in the tooltip; history kept in the order's audit trail when the value changes).
- **Tax rate:** name, rate, tax code, valid from and to, active; **tax category** on each test, panel and billable service; **tax exempt** (with certificate number) on payers; **prices include tax** on each price list; on each charge, the taxable amount, rate and tax.
- **Closed periods:** month, closed by and when, reopened by, when and why.
- **Opening balance lines:** payer or patient, reference, date, amount, due date, import run.
- **Disputed line:** statement line, reason, payer contact, by and when, resolution.
- **On a test:** charge when cancelled after testing started.
- **Settings:** patient balance reminders (on or off, days).
- **Module switch** `billingEnabled` and the Billing area's settings (FR-L1); currency code, symbol and decimal places in the distribution configuration (FR-L2).

Lifecycles:

- **Charge:** Unpaid → Partly paid → Paid; or → Waived; or → Reversed (unpaid, cancelled); or → On statement → Paid; or → Claimed → Paid or Partly paid (with an adjustment, or the difference moved to the patient). Billed by EMR charges are never created; the order records it.
- **Statement:** Draft → Open (issued) → Overdue (past due) → Paid; or → Void.
- **Claim:** Draft → Submitted → Accepted, Partly accepted or Rejected → Paid or Partly paid; any state → Void. Corrections are new claims linked as `prior`.
- **Quote:** Draft → Sent → Accepted → Converted (fully used) or Expired; re-issue makes a new quote.
- **Shift:** Open → Closed (counted, or closed automatically).

Nothing in Billing is deleted. Records are reversed, voided, credited or deactivated (D-002).

---

## Access

### Who can do what

- **Cashiers and reception** (`billing:collect`) open the Cash Desk, open and close their own shifts, take payments, print receipts and bills, refund or keep a credit (with a reason; over the refund approval limit, a second person with `billing:manage` approves), void their own receipts during the shift, override or waive a price on an order with a reason, change an insured order's patient share, run a price check, send receipts by SMS or email, run coverage checks and request pre-authorization at order entry.
- **Users who create orders** (`order:create`, `order:edit`) pick Bill to and enter the member number and diagnosis codes; they see the order's charges read-only unless they also hold `billing:collect`. Everyone who can see an order sees its payment chip and the dashboard's Payment column; the amount due shows only to users with `billing:view` or `billing:collect` (FR-D14).
- **Billing clerks** (`billing:claim`) work Bills & Statements, Quotes, Claims, Remittances and Unbilled Work: issue and send statements, record payments on statements, credit lines, mark lines disputed, make and send quotes, submit, void and re-send claims, request pre-authorization from Claims, apply remittances, accept adjustments, and charge or mark free on Unbilled Work.
- **Users who release unpaid work** (`billing:release`) release an order held by the payment gate, with a reason.
- **Lab managers and auditors** (`billing:view`) see the Billing overview, every Billing report including override notes, and every Billing page read-only (Cash Desk, Bills & Statements, Quotes, Claims, Remittances, Unbilled Work) with no actions.
- **Billing managers** (`billing:manage`) edit price lists, promotions, billable services, exemption rules, payment modes and cash points, tax rates, the override reason list, close and reopen periods, import opening balances, and the Billing settings in Configuration; approve refunds over the limit; void statements.
- **Users who edit organizations and programs** (`organization:manage`; for programs, the Programs privilege in #3443, written `program:manage` here, to confirm) edit their Billing sections.
- **Users who edit tests** (`test:configure`) edit the test's Billing section.
- **Administrators** (`extconnection:manage`) set up the claim and mobile money connections.
- A user without any Billing privilege does not see the Billing section of the main menu; its routes redirect to Home. Billing pages a user cannot open are not shown in the section.

### Nominated privileges (D-235)

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| See the overview, reports and billing records | **NEW** `billing:view` | Billing | Roles with `report:run` |
| Cash desk: shifts, payments, receipts, refunds and credits, overrides and waivers, patient share, coverage check | **NEW** `billing:collect` | Billing | Roles with `order:create` |
| Statements, quotes, claims, remittances, adjustments, unbilled work | **NEW** `billing:claim` | Billing | Global Administrator (labs grant it to billing clerks in the role builder) |
| Release an order held by the payment gate | **NEW** `billing:release` | Billing | Global Administrator |
| Price lists, promotions, billable services, exemption rules, payment modes, cash points, tax rates, override reasons, Billing settings, refund approval, void statements, period close and reopen, opening balances | **NEW** `billing:manage` (named in the RBAC PRD) | Billing | Global Administrator |
| Bill to, member number, diagnosis codes at order entry | `order:create`, `order:edit` (existing) | Orders, samples and patients | As today |
| Billing section on an organization | `organization:manage` (existing) | Test catalog and reference data | As today |
| Billing section on a program | `program:manage` (Programs privilege in #3443; name to confirm) | Test catalog and reference data | As today |
| Billing section on a test or panel | `test:configure` (existing) | Test catalog and reference data | As today |
| Claim and mobile money connections | `extconnection:manage` (existing) | Administration | As today |

NEW codes: `billing:view`, `billing:collect`, `billing:claim`, `billing:release`, `billing:manage`. Category `billing` maps to a new **Billing** display group (Users and Roles Appendix A). Until PR #3443 merges, Global Administrator stands in for `billing:manage`, `billing:claim` and `billing:release`, the order entry module for `billing:collect`, and the Reports module for `billing:view`. Every check is made on the server.

Default grants here differ from the brief's first sketch (Reception and Admin for `billing:view`): granting by held privilege follows D-235.

Suggested shipped role (labs adapt it in the role builder, Users and Roles D-203): **Billing Clerk**, based on Reception, adding `billing:view`, `billing:collect` and `billing:claim`.

---

## Localization

New keys are added to `frontend/src/languages/en.json` in English, with French in each slice's Definition of Done (Admin Redesign AS-36). Before minting, run `npm run i18n:find -- "<text>"` (Constitution VII). **Status:** REUSE an existing key (verified in `en.json` on `develop`, 2026-10-20, unless marked as minted by a sibling spec), or NEW.

Rules:

- **Workspace pages** (Overview, Cash Desk, Bills & Statements, Quotes, Claims, Remittances, Unbilled Work, Reports) use `billing.<page>.*`; shared Billing words use `billing.common.*`.
- **Admin pages** use `admin.billing.<page>.*` (AS-36). Configuration settings use `admin.configuration.setting.<key>.label` / `.description` and the area key `admin.configuration.area.billing`.
- **Order entry** keeps its own namespace `order.billing.*` (`order.billing.reference` is on `develop`; Clinical Order Entry v4 mints `order.billing.paymentStatus` and `order.billing.paidExternal`).
- **Test Catalog** uses `label.testCatalog.billing.*`. **Locations & Organizations** and **Programs** mint their own keys for their Billing sections (`admin.locations.billing.*`, `admin.programs.billing.*`); this FRS lists their English only in the FRs.
- **Amounts** are formatted with the currency settings (FR-L2), never spliced into keys as text. **Counts** use ICU plural forms. Statuses have one key each; no status word is spliced into a sentence.
- **Printed documents** (receipt, bill, statement, quote) use `billing.print.*` and print in the language of the person or payer (the payer's language from Locations & Organizations; the lab default otherwise).
- **Shipped list values** (payment modes, override reasons, billable services) are dictionary entries with localized names, not interface keys.

### Navigation and page headers

| Key | English | Context | Status |
|---|---|---|---|
| `banner.menu.billing` | Billing | Main menu section heading | REUSE |
| `home.label` | Home | Breadcrumb | REUSE |
| `breadcrums.admin.managment` | Admin Management | Admin breadcrumb | REUSE |
| `sidenav.label.billing.overview` | Overview | Billing section entry, breadcrumb, page title | NEW |
| `sidenav.label.billing.cashDesk` | Cash Desk | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.bills` | Bills & Statements | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.quotes` | Quotes | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.claims` | Claims | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.remittances` | Remittances | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.unbilled` | Unbilled Work | Entry, breadcrumb, title | NEW |
| `sidenav.label.billing.reports` | Reports | Entry, breadcrumb, title | NEW |
| `sidenav.label.admin.billing` | Billing | Admin SideNav group (Resources), breadcrumb | NEW |
| `sidenav.label.admin.billing.priceLists` | Price Lists | Admin entry, title | NEW |
| `sidenav.label.admin.billing.services` | Billable Services | Admin entry, title | NEW |
| `sidenav.label.admin.billing.exemptions` | Exemption Rules | Admin entry, title | NEW |
| `sidenav.label.admin.billing.paymentModes` | Payment Modes & Cash Points | Admin entry, title | NEW |
| `billing.overview.subtitle` | What the lab has collected, what it is owed, and where money may be leaking. | Overview description | NEW |
| `billing.cashDesk.subtitle` | Find an order, take the patient's payment and print the receipt. | Cash Desk description | NEW |
| `billing.bills.subtitle` | What institutions, programs, clients and walk-in payers owe, by bill or monthly statement. | Description | NEW |
| `billing.quotes.subtitle` | Prices agreed with environmental clients before their samples arrive. | Description | NEW |
| `billing.claims.subtitle` | Electronic claims to insurers for released tests, and what the insurers answered. | Description | NEW |
| `billing.remittances.subtitle` | Insurers' payment notices, matched to the claims they pay. | Description | NEW |
| `billing.unbilled.subtitle` | Released tests that have no charge and no reason to be free. Charge them or say why they are free. | Description | NEW |
| `billing.reports.subtitle` | Revenue integrity, overrides, aging, collections, free services, referral costs and denials. | Description | NEW |
| `admin.billing.priceLists.subtitle` | What each payer is charged for tests, panels and other fees. One list is the default. | Description | NEW |
| `admin.billing.services.subtitle` | Fees that are not tests, such as sample collection or an urgent surcharge. Price them on each price list. | Description | NEW |
| `admin.billing.exemptions.subtitle` | Rules that waive the patient's share automatically, for example free care for children under 5. | Description | NEW |
| `admin.billing.paymentModes.subtitle` | How patients can pay, and the cash points where cashiers take payments. | Description | NEW |

### Shared words and statuses

| Key | English | Context | Status |
|---|---|---|---|
| `billing.common.billTo` | Bill to | Field, column | NEW |
| `billing.common.payer` | Payer | Column, filter | NEW |
| `billing.common.patient` | Patient | Payer option | NEW |
| `billing.common.payerType.insurer` | Insurer | Payer type | NEW |
| `billing.common.payerType.institution` | Institution | Payer type | NEW |
| `billing.common.payerType.client` | Environmental client | Payer type | NEW |
| `billing.common.payerType.program` | Program | Payer type | NEW |
| `billing.common.listPrice` | List price | Column | NEW |
| `billing.common.charged` | Charged | Column | NEW |
| `billing.common.patientPays` | Patient pays | Column | NEW |
| `billing.common.payerPays` | Payer pays | Column | NEW |
| `billing.common.balanceDue` | Balance due | Total | NEW |
| `billing.common.alreadyPaid` | Already paid | Total | NEW |
| `billing.common.total` | Total | Total | NEW |
| `billing.common.reason` | Reason | Column, field | NEW |
| `billing.common.note` | Note | Field | NEW |
| `billing.common.noPrice` | No price on this list | Charge cell (FR-C8) | NEW |
| `billing.status.unpaid` | Unpaid | Tag (red) | NEW |
| `billing.status.partlyPaid` | Partly paid | Tag (warm-gray) | NEW |
| `billing.status.paid` | Paid | Tag (green) | NEW |
| `billing.status.waived` | Waived | Tag (teal) | NEW |
| `billing.status.billedToPayer` | Billed to payer | Tag (blue) | NEW |
| `billing.status.billedByEmr` | Billed by EMR | Tag (gray) | NEW |
| `billing.status.reversed` | Reversed | Tag (gray) | NEW |
| `billing.status.onStatement` | On statement {number} | Tag (blue) | NEW |
| `billing.status.claimed` | Claimed {number} | Tag (purple) | NEW |
| `billing.status.notCharged` | Not charged | Tag (gray), beside the free reason | NEW |
| `billing.free.notBillable` | Not billable | Free reason | NEW |
| `billing.free.qc` | QC sample | Free reason | NEW |
| `billing.free.eqa` | EQA sample | Free reason | NEW |
| `billing.free.rerun` | Rerun | Free reason | NEW |
| `billing.free.redraw` | Redraw | Free reason | NEW |
| `billing.free.reflex` | Reflex not charged | Free reason | NEW |
| `billing.free.addedLater` | Added after registration, not charged | Free reason | NEW |
| `billing.free.exemption` | Exemption: {rule} | Free reason | NEW |
| `billing.free.waived` | Waived: {reason} | Free reason | NEW |
| `billing.free.emr` | Billed by {system} | Free reason | NEW |
| `billing.free.inPanel` | In panel price: {panel} | Free reason | NEW |
| `billing.added.orderEntry` | Order entry | How added | NEW |
| `billing.added.bench` | Added at bench | How added | NEW |
| `billing.added.reflex` | Reflex | How added | NEW |
| `billing.added.analyzer` | Analyzer | How added | NEW |
| `billing.added.repeat` | Repeat | How added | NEW |
| `billing.added.noPrice` | No price | How found (FR-C8) | NEW |
| `common.status` | Status | Column, filter | REUSE |
| `common.save` | Save | Button | REUSE |
| `common.cancel` | Cancel | Button | REUSE |
| `common.edit` | Edit | Button | REUSE |
| `common.active` | Active | Column, toggle | REUSE |
| `common.inactive` | Inactive | Filter option | REUSE |
| `common.all` | All | Filter option | REUSE |
| `common.retry` | Retry | Button | REUSE |
| `common.name` | Name | Column, field | REUSE |
| `common.description` | Description | Field | REUSE |

### Overview

| Key | English | Context | Status |
|---|---|---|---|
| `billing.overview.collectedToday` | Collected today | Tile | NEW |
| `billing.overview.collectedMonth` | Collected this month | Tile | NEW |
| `billing.overview.unbilled` | Unbilled work | Tile | NEW |
| `billing.overview.unbilledValue` | {count, plural, one {# test} other {# tests}}, {amount} at list price | Tile detail | NEW |
| `billing.overview.releasedUnpaid` | Released while unpaid | Tile | NEW |
| `billing.overview.owed` | Owed to the lab | Tile | NEW |
| `billing.overview.owedOver90` | {amount} over 90 days | Tile detail | NEW |
| `billing.overview.claimsAttention` | Claims needing attention | Tile | NEW |
| `billing.overview.denialRate` | Claim denial rate (30 days) | Tile | NEW |
| `billing.overview.daysToClaim` | Days from release to claim (median) | Tile | NEW |
| `billing.overview.openShifts` | Open shifts | Tile | NEW |
| `billing.overview.odooFailing` | {count, plural, one {# record not in Odoo yet} other {# records not in Odoo yet}} | Notification | NEW |

### Cash Desk

| Key | English | Context | Status |
|---|---|---|---|
| `billing.cashDesk.search` | Lab number, patient, patient ID, bill or quote number | Search placeholder | NEW |
| `billing.cashDesk.waiting` | Waiting to pay | Table title | NEW |
| `billing.cashDesk.col.labNo` | Lab No | Column | NEW |
| `billing.cashDesk.col.registered` | Registered | Column | NEW |
| `billing.cashDesk.takePayment` | Take payment | Button | NEW |
| `billing.cashDesk.takePaymentFor` | Take payment, {labNo} | Accessible name | NEW |
| `billing.cashDesk.refundOrCredit` | Refund or credit | Button | NEW |
| `billing.cashDesk.printBill` | Print bill | Button | NEW |
| `billing.cashDesk.overridePrice` | Override price | Button | NEW |
| `billing.cashDesk.amount` | Amount | Field | NEW |
| `billing.cashDesk.mode` | Payment mode | Field | NEW |
| `billing.cashDesk.tendered` | Cash tendered | Field | NEW |
| `billing.cashDesk.change` | Change due: {amount} | Helper | NEW |
| `billing.cashDesk.useCredit` | Use {amount} credit from receipt {receipt} | Checkbox | NEW |
| `billing.cashDesk.partNote` | Part payment. {amount} will still be due. | Helper | NEW |
| `billing.cashDesk.depositNote` | {amount} more than due. It is kept as credit for this order. | Helper | NEW |
| `billing.cashDesk.saveAndPrint` | Save and print receipt | Primary button | NEW |
| `billing.cashDesk.paid` | Payment saved. Receipt {receipt} printed. | Toast | NEW |
| `billing.cashDesk.alreadyPaid` | This order was paid at {time} by {cashier}. Reload to see it. | Error (FR-M5) | NEW |
| `billing.cashDesk.noShift` | Open a shift to take payments. | Notification | NEW |
| `billing.cashDesk.refund` | Refund | Option | NEW |
| `billing.cashDesk.keepCredit` | Keep as credit | Option | NEW |
| `billing.cashDesk.refundApproval` | Over the {amount} refund limit. A billing manager must approve. | Notification | NEW |
| `billing.cashDesk.approverSignIn` | Approver's username and password | Field | NEW |
| `billing.cashDesk.gate.waiting` | Waiting for payment: testing is held until the patient's share is paid. | Notification | NEW |
| `billing.cashDesk.gate.report` | The report is held until the patient's share is paid. | Notification | NEW |
| `billing.cashDesk.mobile.request` | Send payment request | Button | NEW |
| `billing.cashDesk.mobile.waiting` | Waiting for the patient to approve on their phone | Status | NEW |
| `billing.cashDesk.receipts` | Receipts | Section | NEW |
| `billing.cashDesk.voidReceipt` | Void receipt | Button | NEW |
| `billing.cashDesk.voidFor` | Void receipt {receipt} | Accessible name | NEW |
| `billing.cashDesk.voidConfirm` | Void receipt {receipt}? The payment is reversed and the receipt is kept, marked Void. This cannot be undone. | Danger Modal | NEW |
| `billing.shift.open` | Open shift | Button | NEW |
| `billing.shift.close` | Close shift | Button | NEW |
| `billing.shift.float` | Opening float | Field | NEW |
| `billing.shift.cashPoint` | Cash point | Field | NEW |
| `billing.shift.bar` | Shift open since {time} at {cashPoint}. {count, plural, one {# payment} other {# payments}}, {amount} cash. | Shift bar | NEW |
| `billing.shift.expected` | Expected in the drawer | Close shift | NEW |
| `billing.shift.counted` | Counted | Field | NEW |
| `billing.shift.difference` | Difference | Close shift | NEW |
| `billing.shift.notCounted` | Not counted | Value | NEW |
| `billing.shift.closedAuto` | Closed automatically | Value | NEW |

### Bills & Statements, Quotes

| Key | English | Context | Status |
|---|---|---|---|
| `billing.bills.col.number` | Number | Column | NEW |
| `billing.bills.col.kind` | Kind | Column | NEW |
| `billing.bills.kind.bill` | Bill | Value | NEW |
| `billing.bills.kind.statement` | Statement | Value | NEW |
| `billing.bills.col.period` | Period or order | Column | NEW |
| `billing.bills.col.issued` | Issued | Column | NEW |
| `billing.bills.col.due` | Due | Column | NEW |
| `billing.bills.col.paid` | Paid | Column | NEW |
| `billing.bills.col.balance` | Balance | Column | NEW |
| `billing.bills.col.lastReminder` | Last reminder | Column | NEW |
| `billing.bills.status.draft` | Draft | Tag (gray) | NEW |
| `billing.bills.status.open` | Open | Tag (blue) | NEW |
| `billing.bills.status.overdue` | Overdue | Tag (red) | NEW |
| `billing.bills.status.void` | Void | Tag (gray) | NEW |
| `billing.bills.recordPayment` | Record payment | Button | NEW |
| `billing.bills.send` | Send | Button | NEW |
| `billing.bills.print` | Print | Button | NEW |
| `billing.bills.creditLine` | Credit a line | Button | NEW |
| `billing.bills.void` | Void | Button | NEW |
| `billing.bills.issue` | Issue | Button | NEW |
| `billing.bills.issueAll` | Issue all drafts | Button | NEW |
| `billing.bills.makeNow` | Make statement now | Button | NEW |
| `billing.bills.overLimit` | {payer} owes {balance}, over its {limit} credit limit. | Warning (FR-F6) | NEW |
| `billing.quotes.col.client` | Client | Column | NEW |
| `billing.quotes.col.validUntil` | Valid until | Column | NEW |
| `billing.quotes.col.samples` | Samples | Column | NEW |
| `billing.quotes.samplesUsed` | {used} of {quoted} samples received | Value | NEW |
| `billing.quotes.status.sent` | Sent | Tag (purple) | NEW |
| `billing.quotes.status.accepted` | Accepted | Tag (green) | NEW |
| `billing.quotes.status.expired` | Expired | Tag (warm-gray) | NEW |
| `billing.quotes.status.converted` | Converted | Tag (teal) | NEW |
| `billing.quotes.new` | New quote | Button | NEW |
| `billing.quotes.markAccepted` | Mark accepted | Button | NEW |
| `billing.quotes.reissue` | Re-issue | Button | NEW |
| `billing.quotes.overQuote` | Over quote | Tag | NEW |
| `order.billing.startFromQuote` | Start from a quote | Order entry button (FR-F9) | NEW |

### Claims and Remittances

| Key | English | Context | Status |
|---|---|---|---|
| `billing.claims.col.number` | Claim | Column | NEW |
| `billing.claims.col.insurer` | Insurer | Column | NEW |
| `billing.claims.col.lines` | Lines | Column | NEW |
| `billing.claims.col.claimed` | Claimed | Column | NEW |
| `billing.claims.col.submitted` | Submitted | Column | NEW |
| `billing.claims.col.deadline` | Filing deadline | Column | NEW |
| `billing.claims.status.submitted` | Submitted | Tag (purple) | NEW |
| `billing.claims.status.accepted` | Accepted | Tag (green) | NEW |
| `billing.claims.status.partial` | Partly accepted | Tag (warm-gray) | NEW |
| `billing.claims.status.rejected` | Rejected | Tag (red) | NEW |
| `billing.claims.status.partlyPaid` | Partly paid | Tag (warm-gray) | NEW |
| `billing.claims.needsAttention` | Needs attention | Filter | NEW |
| `billing.claims.submit` | Submit | Button | NEW |
| `billing.claims.fixResend` | Fix and re-send | Button | NEW |
| `billing.claims.markPaper` | Mark submitted on paper | Button | NEW |
| `billing.claims.voidConfirm` | Void claim {number}? The insurer is told the claim was sent in error. The claim is kept, marked Void. | Danger Modal | NEW |
| `billing.claims.noPreauth` | No pre-authorization | Tag | NEW |
| `billing.claims.pastDeadline` | Past filing deadline | Tag (red) | NEW |
| `billing.claims.acceptAdjustment` | Accept as adjustment | Button | NEW |
| `billing.claims.moveToPatient` | Move to the patient's share | Button | NEW |
| `billing.remit.col.received` | Received | Column | NEW |
| `billing.remit.col.reference` | Reference | Column | NEW |
| `billing.remit.col.matched` | Matched | Column | NEW |
| `billing.remit.col.unmatched` | Unmatched | Column | NEW |
| `billing.remit.status.matched` | Matched | Tag (blue) | NEW |
| `billing.remit.status.review` | Review | Tag (red) | NEW |
| `billing.remit.status.applied` | Applied | Tag (green) | NEW |
| `billing.remit.apply` | Apply | Button | NEW |
| `billing.remit.applyAll` | Apply all matched | Button | NEW |
| `billing.remit.enterByHand` | Enter a remittance by hand | Button | NEW |
| `billing.remit.matchToClaim` | Match to a claim | Button | NEW |
| `billing.remit.holdUnapplied` | Hold as unapplied | Button | NEW |
| `billing.remit.reason.unknownClaim` | No claim {number} for this insurer | Unmatched reason | NEW |
| `billing.remit.reason.overAmount` | {amount} is more than the claim's open {open} | Unmatched reason | NEW |

### Unbilled Work and Reports

| Key | English | Context | Status |
|---|---|---|---|
| `billing.unbilled.col.released` | Released | Column | NEW |
| `billing.unbilled.col.howAdded` | How it was added | Column | NEW |
| `billing.unbilled.charge` | Charge | Button | NEW |
| `billing.unbilled.markFree` | Mark as free | Button | NEW |
| `billing.unbilled.empty` | Every released test is charged or has a reason to be free. | Empty state | NEW |
| `billing.reports.integrity` | Revenue integrity | Report name | NEW |
| `billing.reports.overrides` | Overrides | Report name | NEW |
| `billing.reports.aging` | Aging | Report name | NEW |
| `billing.reports.collections` | Collections | Report name | NEW |
| `billing.reports.freeServices` | Value of free services | Report name | NEW |
| `billing.reports.referralCosts` | Referral costs | Report name | NEW |
| `billing.reports.denials` | Denials and underpayment | Report name | NEW |
| `billing.reports.integrity.releasedUnpaid` | Released or delivered while unpaid | Section | NEW |
| `billing.reports.integrity.receipts` | Receipt sequence | Section | NEW |
| `billing.reports.integrity.noGaps` | No gaps in receipt numbers {from} to {to}. | Section text | NEW |
| `billing.reports.integrity.refunds` | Refunds and credits | Section | NEW |
| `billing.reports.integrity.cashCounts` | Cash counts | Section | NEW |
| `billing.reports.aging.notDue` | Not yet due | Column | NEW |
| `billing.reports.aging.d30` | 1 to 30 days | Column | NEW |
| `billing.reports.aging.d60` | 31 to 60 days | Column | NEW |
| `billing.reports.aging.d90` | 61 to 90 days | Column | NEW |
| `billing.reports.aging.over90` | Over 90 days | Column | NEW |
| `billing.reports.aging.overLimit` | Over limit | Tag (red) | NEW |
| `billing.reports.export` | Export CSV | Button | NEW |
| `billing.reports.revenue` | Revenue | Report name | NEW |
| `billing.reports.tax` | Tax | Report name | NEW |
| `billing.reports.aging.disputed` | Disputed | Column | NEW |
| `billing.reports.aging.patients` | Patients (all) | Row | NEW |
| `billing.overview.periods` | Periods | Section | NEW |
| `billing.overview.closePeriod` | Close {month} | Button | NEW |
| `billing.overview.reopenPeriod` | Reopen {month} | Button | NEW |
| `billing.overview.closeCheck` | Before closing {month}: {count, plural, one {# item is still open} other {# items are still open}}. | Close check | NEW |
| `billing.overview.periodClosed` | {month} closed {date} by {name} | Status | NEW |
| `billing.bills.importOpening` | Import opening balances | Button | NEW |
| `billing.bills.openingBalance` | Opening balance | Line | NEW |
| `billing.bills.dispute` | Mark disputed | Button | NEW |
| `billing.bills.undispute` | Undispute | Button | NEW |
| `billing.bills.disputed` | Disputed | Tag (warm-gray) | NEW |
| `billing.cashDesk.priceCheck` | Price check | Button, panel title | NEW |
| `billing.cashDesk.printEstimate` | Print estimate | Button | NEW |
| `billing.cashDesk.estimateNote` | Estimate, valid today only | Printed line | NEW |
| `billing.cashDesk.sendReceipt` | Send receipt | Button | NEW |
| `billing.patient.section` | Billing | Patient record section | NEW |
| `billing.patient.balance` | Balance due on all orders | Field | NEW |
| `billing.patient.credit` | Credit on file | Field | NEW |
| `billing.patient.history` | Payments and receipts | Table title | NEW |
| `admin.billing.tax.title` | Tax Rates | Page title | NEW |
| `admin.billing.tax.col.rate` | Rate | Column | NEW |
| `admin.billing.tax.col.code` | Tax code | Column | NEW |
| `admin.billing.tax.category` | Tax category | Field (test, panel, service) | NEW |
| `admin.billing.tax.exempt` | Tax exempt | Field (payer) | NEW |
| `admin.billing.tax.includes` | Prices include tax | Field (price list) | NEW |
| `billing.print.taxable` | Taxable amount | Printed label | NEW |
| `billing.print.taxLine` | {name} on {amount} | Printed line | NEW |
| `label.testCatalog.billing.cancelledAfterStart` | Charge when cancelled after testing started | Field | NEW |
| `sidenav.label.admin.billing.tax` | Tax Rates | Admin entry | NEW |
| `billing.reports.person` | Person | Filter (Revenue integrity, Overrides) | NEW |
| `billing.reports.overrides.exemptions` | Exemptions | Section (Overrides report) | NEW |
| `billing.reports.overrides.promotions` | Promotions | Section (Overrides report) | NEW |
| `billing.claims.adj.accepted` | Accepted | Line tag (green) | NEW |
| `billing.claims.adj.denied` | Denied | Line tag (red) | NEW |

### Admin pages

| Key | English | Context | Status |
|---|---|---|---|
| `admin.billing.priceLists.col.usedBy` | Used by | Column | NEW |
| `admin.billing.priceLists.col.priced` | Items priced | Column | NEW |
| `admin.billing.priceLists.priced` | {priced} of {billable} billable | Value | NEW |
| `admin.billing.priceLists.col.unpriced` | Unpriced | Column | NEW |
| `admin.billing.priceLists.col.panelPricing` | Panel pricing | Column, field | NEW |
| `admin.billing.priceLists.panel.price` | Panel price | Option | NEW |
| `admin.billing.priceLists.panel.sum` | Sum of tests | Option | NEW |
| `admin.billing.priceLists.default` | Default | Tag | NEW |
| `admin.billing.priceLists.add` | Add price list | Button | NEW |
| `admin.billing.priceLists.addItem` | Add item | Button | NEW |
| `admin.billing.priceLists.itemSearch` | Search tests, panels and services | ComboBox placeholder | NEW |
| `admin.billing.priceLists.col.item` | Item | Column | NEW |
| `admin.billing.priceLists.col.kind` | Kind | Column | NEW |
| `admin.billing.priceLists.kind.test` | Test | Value | NEW |
| `admin.billing.priceLists.kind.panel` | Panel | Value | NEW |
| `admin.billing.priceLists.kind.service` | Billable service | Value | NEW |
| `admin.billing.priceLists.col.price` | Price | Column | NEW |
| `admin.billing.priceLists.col.payerCode` | Payer billing code | Column | NEW |
| `admin.billing.priceLists.col.validFrom` | Valid from | Column | NEW |
| `admin.billing.priceLists.fromDate` | From {date} | Future price | NEW |
| `admin.billing.priceLists.unpricedOnly` | Unpriced only | Filter | NEW |
| `admin.billing.priceLists.unpricedWarning` | {count, plural, one {# billable item has no price on this list.} other {# billable items have no price on this list.}} Orders billed with this list will show them as unpriced. | Warning (FR-A9) | NEW |
| `admin.billing.priceLists.import` | Import CSV | Button | NEW |
| `admin.billing.priceLists.export` | Export CSV | Button | NEW |
| `admin.billing.promotions.title` | Promotions | Section | NEW |
| `admin.billing.promotions.running` | {count, plural, one {# running} other {# running}} | Header link | NEW |
| `admin.billing.promotions.add` | Add promotion | Button | NEW |
| `admin.billing.promotions.covers` | Covers | Field, column | NEW |
| `admin.billing.promotions.price` | Price or discount | Field, column | NEW |
| `admin.billing.promotions.dates` | Runs | Column | NEW |
| `admin.billing.promotions.appliesTo` | Price lists | Field, column | NEW |
| `admin.billing.promotions.status.scheduled` | Scheduled | Tag (purple) | NEW |
| `admin.billing.promotions.status.running` | Running | Tag (green) | NEW |
| `admin.billing.promotions.status.ended` | Ended | Tag (gray) | NEW |
| `admin.billing.promotions.endNow` | End now | Button | NEW |
| `admin.billing.services.col.code` | Code | Column | NEW |
| `admin.billing.services.col.kind` | Kind | Column | NEW |
| `admin.billing.services.kind.collection` | Collection | Value | NEW |
| `admin.billing.services.kind.surcharge` | Surcharge | Value | NEW |
| `admin.billing.services.kind.document` | Report or certificate | Value | NEW |
| `admin.billing.services.col.added` | Added | Column | NEW |
| `admin.billing.services.added.manual` | By hand | Value | NEW |
| `admin.billing.services.added.rule` | Automatically: {rule} | Value | NEW |
| `admin.billing.services.rule.urgent` | Urgent priority | Rule | NEW |
| `admin.billing.services.rule.home` | Home collection | Rule | NEW |
| `admin.billing.services.rule.certificate` | Certificate issued | Rule | NEW |
| `admin.billing.exemptions.col.conditions` | When | Column | NEW |
| `admin.billing.exemptions.col.waives` | Waives | Column | NEW |
| `admin.billing.exemptions.waives.all` | All of the patient's share | Value | NEW |
| `admin.billing.exemptions.waives.percent` | {percent}% of the patient's share | Value | NEW |
| `admin.billing.exemptions.add` | Add rule | Button | NEW |
| `admin.billing.paymentModes.modes` | Payment modes | Section | NEW |
| `admin.billing.paymentModes.cashPoints` | Cash points | Section | NEW |
| `admin.billing.paymentModes.col.fields` | Extra fields | Column | NEW |
| `admin.billing.paymentModes.col.counted` | Counted in the drawer | Column | NEW |
| `admin.billing.paymentModes.kind.cash` | Cash | Value | NEW |
| `admin.billing.paymentModes.kind.mobile` | Mobile money | Value | NEW |
| `admin.billing.paymentModes.kind.card` | Card | Value | NEW |
| `admin.billing.paymentModes.kind.bank` | Bank transfer | Value | NEW |
| `admin.configuration.area.billing` | Billing | Configuration area | NEW |
| `admin.configuration.setting.billingPaymentGate.label` | Payment gate | Setting | NEW |
| `admin.configuration.setting.billingPaymentGate.description` | Hold testing or the report until the patient's share is paid. Orders billed to an insurer, institution, program or client never wait. | Setting description | NEW |
| `admin.configuration.setting.billingPaymentGate.off` | Off | Option | NEW |
| `admin.configuration.setting.billingPaymentGate.testing` | Hold testing until the patient's share is paid | Option | NEW |
| `admin.configuration.setting.billingPaymentGate.report` | Hold the report until paid | Option | NEW |
| `admin.configuration.setting.billingReceiptPrefix.label` | Receipt prefix | Setting | NEW |
| `admin.configuration.setting.billingReceiptYearly.label` | Restart receipt numbers each year | Setting | NEW |
| `admin.configuration.setting.billingRefundLimit.label` | Refund approval limit | Setting | NEW |
| `admin.configuration.setting.billingRefundLimit.description` | Refunds above this amount need a billing manager's approval. Leave empty for no approval. | Setting description | NEW |
| `admin.configuration.setting.billingStatementNames.label` | Statements show | Setting | NEW |
| `admin.configuration.setting.billingCurrency.label` | Currency | Read-only setting | NEW |

### Order entry and Test Catalog

| Key | English | Context | Status |
|---|---|---|---|
| `order.entry.section.billing` | Billing and notifications | Section 7 | REUSE (minted by Clinical Order Entry v4; not on `develop` yet) |
| `order.billing.reference` | Billing reference | Field | REUSE |
| `order.billing.paymentStatus` | Payment status | Read-only field | REUSE (minted by Clinical Order Entry v4; not on `develop` yet) |
| `order.billing.setByBilling` | Set by Billing | Read-only reason | NEW |
| `order.billing.fromProgram` | From the program | Bill to helper | NEW |
| `order.billing.fromSite` | From the requesting site | Bill to helper | NEW |
| `order.billing.memberNumber` | Member number | Field | NEW |
| `order.billing.patientShare` | Patient's share | Field | NEW |
| `order.billing.checkCoverage` | Check coverage | Button | NEW |
| `order.billing.coverage.covered` | Covered | Tag (green) | NEW |
| `order.billing.coverage.notCovered` | Not covered: {reason} | Tag (red) | NEW |
| `order.billing.coverage.couldNot` | Could not check ({time}) | Tag (gray) | NEW |
| `order.billing.diagnosis` | Diagnosis codes (ICD-10) | Field | NEW |
| `order.billing.needsPreauth` | Needs pre-authorization | Tag | NEW |
| `order.billing.billedBy` | Billed by {system} | Read-only line | NEW |
| `order.billing.billInLab` | Bill in the lab instead | Button | NEW |
| `order.billing.recordedBefore` | Recorded before Billing: {value} | Read-only line (FR-D12) | NEW |
| `order.billing.chip.unpaid` | Unpaid {amount} | Payment chip (red), amount for billing users | NEW |
| `order.billing.chip.unpaidNoAmount` | Unpaid | Payment chip (red), other users | NEW |
| `order.billing.chip.partly` | Partly paid, {amount} due | Payment chip (warm-gray) | NEW |
| `order.billing.chip.partlyNoAmount` | Partly paid | Payment chip (warm-gray), other users | NEW |
| `order.billing.chip.paid` | Paid | Payment chip (green) | NEW |
| `order.billing.chip.waived` | Waived | Payment chip (teal) | NEW |
| `order.billing.chip.payer` | Billed to {payer} | Payment chip (blue) | NEW |
| `order.billing.chip.emr` | Billed by EMR | Payment chip (gray) | NEW |
| `order.billing.chip.held` | Held: unpaid {amount} | Payment chip (red), gate holding the order | NEW |
| `order.billing.chip.openCashDesk` | Open {labNo} at the Cash Desk | Chip link accessible name | NEW |
| `order.dashboard.col.payment` | Payment | Order dashboard column, filter label | NEW |
| `order.dashboard.payment.all` | All payment states | Filter option | NEW |
| `order.dashboard.payment.paid` | Paid | Dashboard tag (green) and filter option | NEW |
| `order.dashboard.payment.notPaid` | Not paid | Dashboard tag (red) and filter option | NEW |
| `order.dashboard.payment.tooltip` | {reason}. {source} | Dashboard tag tooltip, never an amount | NEW |
| `order.dashboard.payment.reason.partly` | Partly paid | Tooltip reason | NEW |
| `order.dashboard.payment.reason.held` | Held by the payment gate | Tooltip reason | NEW |
| `order.dashboard.payment.reason.payer` | Billed to {payer} | Tooltip reason | NEW |
| `order.dashboard.payment.reason.waived` | Waived | Tooltip reason | NEW |
| `order.dashboard.payment.reason.emr` | Billed by EMR | Tooltip reason | NEW |
| `order.billing.setByOdoo` | Set by Odoo, read {time} | Read-only reason, chip and dashboard tooltip (FR-J8) | NEW |
| `order.billing.odooUnreachable` | Odoo not reachable, last read {time} | Tooltip when the last Odoo read failed | NEW |
| `admin.integrations.odoo.paymentReadMinutes` | Read payments from Odoo every {minutes} minutes (0 is off) | Integrations & exchange, read-only (FR-J3, FR-J8) | NEW |
| `admin.integrations.odoo.paymentReadDays` | Read payment status for orders from the last {days} days | Integrations & exchange, read-only (FR-J8) | NEW |
| `label.testCatalog.billing.section` | Billing | Test editor section | NEW |
| `label.testCatalog.billing.billable` | Billable | Field | NEW |
| `label.testCatalog.billing.reruns` | Charge reruns | Field | NEW |
| `label.testCatalog.billing.repeats` | Charge repeats that become new tests | Field | NEW |
| `label.testCatalog.billing.redraws` | Charge redraws after a rejected sample | Field | NEW |
| `label.testCatalog.billing.reflex` | Charge when added as a reflex test | Field | NEW |
| `label.testCatalog.billing.addedLater` | Charge when added after registration | Field | NEW |
| `label.testCatalog.billing.preauth` | Pre-authorization required by | Field | NEW |
| `label.testCatalog.billing.qcNote` | QC and EQA samples are never charged. | Helper | NEW |
| `label.testCatalog.completeness.noPrice` | No price on {list} | Completeness warning | NEW |

### Printed documents

| Key | English | Context | Status |
|---|---|---|---|
| `billing.print.receipt` | Receipt | Title | NEW |
| `billing.print.refundReceipt` | Refund receipt | Title | NEW |
| `billing.print.copy` | Copy | Reprint marker | NEW |
| `billing.print.void` | Void | Marker | NEW |
| `billing.print.cashier` | Cashier | Label | NEW |
| `billing.print.discount` | Discount: {reason} | Line | NEW |
| `billing.print.balanceLeft` | Balance left | Label | NEW |
| `billing.print.fiscalNumber` | Fiscal number | Label | NEW |
| `billing.print.statement` | Statement | Title | NEW |
| `billing.print.amountDue` | Amount due | Label | NEW |
| `billing.print.quote` | Quote | Title | NEW |
| `billing.print.validUntil` | Valid until {date} | Line | NEW |

---

## Acceptance Criteria

Examples use the Central Public Health Laboratory (CPHL) in Port Moresby, prices in kina (K, 2 decimals). Payers in the examples are fictional except the facilities already used in sibling specs.

**Prices**

1. On the Default list, CBC is K25.00 from 1 Jan 2026. Setting K30.00 from 1 Nov 2026 shows "From 01/11/2026" beside K25.00; an order on 31 Oct is charged K25.00 and one on 1 Nov K30.00; the price history keeps both with who and when.
2. The Kumul Health Cover list prices the Lipid panel at K49.50 with Panel pricing = Panel price; an order for the panel billed to Kumul has one charge of K49.50 and its four member tests show "In panel price: Lipid panel". On a Sum-of-tests list, removing HDL from the panel lowers the panel's charge by HDL's price and the order still lists HDL as removed, with who removed it.
3. The Default list, with 6 billable tests unpriced, shows "6" in the Unpriced column and the warning above its items; the Test Catalog completeness check for one of those tests shows "No price on Default (walk-in patients)" as a warning, and the test still saves.
4. Exporting the Default list and importing it with two changed prices shows a preview "2 changed, 410 unchanged" and saves nothing until applied.
5. A promotion "World TB Day screening", GeneXpert MTB/RIF at K0.00 on the Default list from 24 to 31 March, prices orders in that week at K0.00 with the reason "Promotion: World TB Day screening" on the charge and receipt; an order on 1 April is charged the list price; ending the promotion on 28 March keeps it, marked Ended, with its dates.
6. The billable service "Urgent surcharge" with the Urgent priority rule on is added automatically to an order registered as urgent, at its price on the payer's list.

**Payers and charges**

7. An order for a patient enrolled in the National TB Program, whose program pays, defaults Bill to to the program with "From the program", and its GeneXpert charge is K0.00 to the patient and the program's list price to the program.
8. An order from Port Moresby General Hospital (payer type Institution) defaults Bill to to the hospital; one from a walk-in patient defaults to Patient.
9. Bill to = Kumul Health Cover cannot be saved as complete without a member number (it can be saved as a draft); the member number is filled in on the same patient's next Kumul order.
10. Adding Culture & sensitivity at the bench to a saved order billed to Patient creates its charge at once; with the test's "Charge when added after registration" set to No, the test instead shows "Added after registration, not charged".
11. A reflex HIV confirmatory test is charged when its test says Charge when added as a reflex = Yes, and shows "Reflex not charged" otherwise. A QC sample and an EQA sample are never charged, whatever the test says.
12. A released test with no charge and no free reason appears on Unbilled Work with how it was added; Charge creates the charge at today's price for the order's payer, Mark as free with Waived requires a note (always required for waivers), and the row leaves the list. The Overview's Unbilled work tile counts it until then.
13. A test with no price on the payer's list shows "No price on this list" in section 7, adds nothing to the total, and appears on Unbilled Work as "No price"; after the price is added, Re-price on the order charges it.
14. Cancelling an unpaid test reverses its charge; cancelling a paid test creates a credit due that the Cash Desk shows for refund or credit.
15. An order from an OpenMRS electronic order, whose system is set to Billed by the EMR, creates no charges and shows "Billed by OpenMRS (Hospital EMR)"; Bill in the lab instead requires a reason and then creates the charges.

**Cash desk**

16. A cashier without an open shift sees "Open a shift to take payments." Opening a shift at "Main reception" with a K200.00 float shows the shift bar.
17. Scanning CPHL-26-004188 opens the order beside the list with its charges, K75.00 due. Paying K100.00 cash shows "Change due: K25.00", saves, prints receipt R-2026-004417, sets the order's Payment status to Paid "Set by Billing", and order entry shows it read-only.
18. Paying K40.00 of K75.00 by mobile money requires phone number and transaction reference, sets Partly paid, and the receipt shows "Balance left K35.00".
19. Paying K100.00 on a K75.00 balance by mobile money keeps K25.00 as credit; the patient's next payment applies it automatically, shown as the ticked line "Use K25.00 credit from receipt R-2026-004417", which the cashier can untick.
20. Two cashiers opening the same order: the second save shows "This order was paid at {time} by {cashier}. Reload to see it." and records nothing.
21. With a refund approval limit of K100.00, a K60.00 refund needs a reason and prints a refund receipt with its own number; a K150.00 refund also needs a billing manager's sign-in, and both names are recorded.
22. Voiding a receipt during its shift asks for a reason in a danger confirmation and keeps the receipt marked Void with its number; after the shift is closed, Void is not offered.
23. Closing a shift with K200.00 float, K1,240.00 cash payments and K60.00 cash refunds shows K1,380.00 expected; counting K1,370.00 records a difference of minus K10.00, and the shift summary lists payments by mode and the receipt range.
24. Receipt numbers have no gaps: the Revenue Integrity report for a month shows "No gaps in receipt numbers R-2026-004001 to R-2026-004417" and lists voids with reasons.
25. With the gate set to Hold testing, an unpaid patient order's samples show "Waiting for payment" and cannot be accepted; a user with `billing:release` releases it with a reason, and the Revenue Integrity report lists it under Released while unpaid. An order billed to Port Moresby General Hospital is never held.
26. With the gate set to Hold the report, the Report Print Queue shows an unpaid order as "Held: unpaid" and automatic delivery does not send it until it is paid.
27. With the gate Off, a report printed for an unpaid order appears on the Revenue Integrity report under Released or delivered while unpaid.

**Overrides and exemptions**

28. Overriding CBC from K25.00 to K10.00 with reason Hardship needs no approval, shows "Discount: Hardship" on the receipt and never the note, and appears on the Overrides report with list price, charged price, difference, reason, note and user.
29. Choosing reason Other without a note is refused with the field error.
30. An override on a paid line is refused with "This line is paid. Refund or credit it at the Cash Desk instead."
31. On an order billed to Kumul Health Cover (Overrides change the claimed amount = No), overriding the patient's share leaves the claim line at Kumul's price; with the setting Yes, the claim line carries the overridden amount and its reason label.
32. The exemption rule "Under-5 free care" (age under 5 years, all of the patient's share) makes a 3-year-old's CBC free to the patient with "Exemption: Under-5 free care"; the Value of Free Services report counts it at the Default list price.

**Accounts and quotes**

33. Port Moresby General Hospital (monthly on day 1, terms 30 days) gets a Draft statement on 1 November with every test billed to it and released in October; issuing it sets the due date to 1 December; Send emails the PDF to the billing contact and Sent Messages shows a Billing row.
34. A statement unpaid 7 days after its due date gets a reminder, then every 14 days, up to 3; each shows in its history.
35. With a K5,000.00 credit limit and K4,950.00 open, registering a K75.00 order for the hospital shows the over-limit warning and the order still saves; Aging marks the hospital "Over limit".
36. Recording a K3,000.00 bank transfer on a K4,200.00 statement leaves K1,200.00 open and moves the remainder into the right Aging bracket.
37. A quote for Highlands Water Authority for 40 water samples (Water microbiology panel at K150.00 per sample), valid 30 days, is sent, marked accepted by email, and at environmental order entry Start from a quote fills the requester, Bill to and tests; each sample is charged K150.00 even after the list price rises; the 41st sample is charged the list price and tagged "Over quote"; the quote shows "40 of 40 samples received" and Converted.
38. A sent quote cannot be edited; Re-issue makes a new number at today's prices linked to the old one.

**eBilling and eRemittance**

39. For Kumul Health Cover (supports coverage check), Check coverage shows Covered, Not covered with the insurer's reason, or Could not check with the time, and the order saves in each case.
40. For an insurer that requires coded diagnosis, an insured order cannot be saved as complete without an ICD-10 code; the claim carries it as a `Condition`.
41. A test marked "Pre-authorization required by Kumul" shows "Needs pre-authorization"; Request pre-authorization sends a `Claim` with `use` = `preauthorization` and shows the answer; a test done without approval is flagged "No pre-authorization" on Claims.
42. With Send claims = Daily batch and a 10% patient share, released Kumul tests become claim lines for the insurer's 90% of its price, with the payer billing code; Submit sends a Bundle; a `ClaimResponse` with outcome `partial` sets Partly accepted and each line's adjudication shows allowed, paid and denial reason.
43. Fix and re-send on a claim with one denied line sends a new claim with `Claim.related` `prior` to the original, for that line only; accepted lines cannot be re-sent. Void sends `entered-in-error` and the claim stays, marked Void.
44. An add-on test charged to Kumul after the order's claim was submitted goes on a follow-up claim related `associated` to the first.
45. With a 90-day filing limit, a line released 85 days ago appears under Needs attention with its deadline; at 91 days it is tagged "Past filing deadline" and can still be sent.
46. A remittance (Kenya adapter: `PaymentNotice`) for three claims matching their open amounts shows Matched; Apply sets the charges Paid and the orders' Payment status "Set by Billing". A detail for an unknown claim puts the remittance in Review and nothing on it is applied until matched or held as unapplied.
47. A line claimed at K44.55 (Kumul's 90% of K49.50) and paid K40.00 appears with a K4.55 difference and the insurer's reason; Move to the patient's share makes K4.55 due at the Cash Desk; Accept as adjustment writes it off and the Denials and Underpayment report counts it.
48. A paper remittance entered by hand goes through the same matching.

**Connections, reports, access**

49. With Odoo on, issuing a statement creates one Odoo invoice to the hospital's partner, and the bank transfer recorded on it creates one Odoo payment; a payment entered in Odoo on a patient's bill comes back as a payment "Recorded in Odoo" and sets the order Paid. No invoice is ever sent to partner ID 1; an order with no patient is billed to its requesting organization.
50. On the first start with Billing on, the Odoo price file's rows load into the Default list; a row whose test name matches no test is listed for the administrator; afterwards, renaming a test keeps its price.
51. The Overview shows Collected today, Collected this month, Unbilled work, Released while unpaid, Owed to the lab with the over-90-days part, Claims needing attention, Claim denial rate, Days from release to claim, and Open shifts, each opening its list; tiles for features not yet shipped are not shown.
52. The Referral Costs report shows each referred test with the reference lab's cost and the lab's charge; Check an invoice lists tests invoiced but not sent.
53. A user with only `order:create` sees Bill to and the charges read-only in section 7 and no Billing section in the main menu; a user with `billing:collect` alone sees Cash Desk only; a user with `billing:view` alone sees every Billing page read-only, with no actions.
54. With the interface in French, no English text remains on any Billing page, and a statement to a payer whose language is French prints in French.
55. Every status shows text as well as colour; Take payment, Void and Submit have accessible names that include the record.
56. With the Billing switch off, no Billing menu, page, field or charge appears, and order entry shows the manual Payment status as today.
57. Every list shows a skeleton while loading, names what failed with Retry, and shows its empty-state text when empty.
58. Order CPHL-26-004188 with K75.00 due shows the chip "Unpaid K75.00" (red) on its summary strip at every order entry step; a user with `billing:collect` opens it at the Cash Desk from the chip; a user with only `order:create` sees "Unpaid" with no amount and no link. After payment the chip reads "Paid" (green) the next time the order is opened.
59. The clinical order dashboard shows a Payment column with only **Paid** or **Not paid**, and no amount for any user, including one with `billing:collect`. CPHL-26-004158 (partly paid) and CPHL-26-004172 (held by the gate) show Not paid; CPHL-26-004180 (billed to Port Moresby General Hospital), CPHL-26-004166 (waived) and CPHL-26-004230 (billed by EMR, no readable invoice) show Paid, each with a tooltip naming the reason and "Set by Billing" and no amount. The Payment filter set to Not paid sets `?payment=notPaid` and lists the same orders as the Unpaid quick filter; there is no sort by amount.
60. With "GST 10%" as the Water microbiology panel's tax category and the Environmental clients list not including tax, a K150.00 panel shows tax K15.00, and the bill's totals show taxable amount, "GST 10% on K150.00: K15.00" and the total with tax; a payer marked Tax exempt with a certificate number is charged no tax; patient lab tests in the Exempt category show no tax line.
61. The Tax report for October lists tax charged and collected by rate and payer kind, and its GST total equals the sum of GST on October's bills and statements.
62. A user with `billing:collect` sees a Billing section on Mary Kaupa's patient record with her balance across orders, her credit and her receipts; a user with only `patient:view` does not see it. Send receipt queues an SMS with the receipt number and amount and no test name.
63. With patient balance reminders on at 14 days, an unpaid patient balance released 14 days ago gets one reminder, shown in Sent Messages and on the patient's Billing section.
64. Price check for Kumul Health Cover with HbA1c and Lipid panel shows each line, the patient's 10% share and the total, prints "Estimate, valid today only", and registers nothing.
65. After September is closed, taking a payment dated 30 September, voiding a September receipt, or overriding a September charge is refused with the closed-period message; a correction made in October references the original; reopening September needs a reason and is recorded.
66. Importing opening balances for Port Moresby General Hospital (K2,400.00 due 31/08/2026) shows a preview, then the amount as an "Opening balance" line in Aging (31 to 60 days on 20/10/2026) and on the hospital's next statement.
67. Marking a K40.00 statement line Disputed shows it in Aging's Disputed column, and the next reminder asks for the amount due less K40.00; Credit or Undispute resolves it.
68. Cancelling a CBC after its sample was accepted keeps its charge with "Cancelled after testing started" when the test says Yes, and reverses it when the test says No.
69. The Revenue report for October by lab unit shows charged, discounted, waived and exempted, and collected amounts with test counts, and a comparison with September.
70. An order sent by OpenMRS and billed by the lab can be read back as a FHIR `Invoice` with one `ChargeItem` per charge and its paid status; an order billed by the EMR has no `Invoice` from OpenELIS.
71. With Billing off and Odoo connected, order CPHL-26-004201 saved at 09:12 creates its Odoo invoice `OE-CPHL-26-004201` as today. After a payment is registered against it in Odoo, the next read sets the order's Payment status to Paid, read-only "Set by Odoo, read 10:40"; the order's chip shows "Paid" with no link; the dashboard row shows Paid and leaves the Not paid filter. An order whose invoice is `partial` shows Not paid; an order whose invoice was cancelled shows no Payment status. With Odoo unreachable, the dashboard keeps the last values and the tooltip says "Odoo not reachable, last read 09:40".
72. With Billing off and `org.openelisglobal.odoo.paymentReadMinutes` set to 0, no Odoo read runs, the Payment status stays hand-set, and the dashboard shows no Payment column. With Billing on, an order invoiced in Odoo before Billing was switched on still takes its Paid or Not paid from Odoo; an order created after takes it from Billing's charges.

---

## Dependencies

- **Clinical Order Entry v4 (OGC-1266)** section 7 and the Payment status field (FR-B28); **Environmental and Vector Order Entry v4** section 7 and quote start.
- **Locations & Organizations (OGC-1363):** the organization row, identifiers table, types, and the Billing section it hosts.
- **Programs Management:** the program row and its Billing section.
- **Test Catalog:** the test editor's section pattern and completeness check.
- **Result Delivery (OGC-1506) foundation:** outbox, templates, Sent Messages, for statements, reminders and quotes (Release 2 of Billing). Billing release 1 needs none of it.
- **Report Print Queue (OGC-1031):** hold support for "Held: unpaid".
- **Odoo invoice fields (FR-J8):** `account.move.payment_state` (Odoo 14 and later) and `state`, read over the existing XML-RPC connection; the invoice `ref` format `OE-{lab number}` set by `OdooIntegrationService` today must stay stable.
- **Admin Redesign:** Configuration's Billing area, module switch, Admin Billing group. Interim home until Configuration ships: the same `site_information` entries on the existing Site Information page.
- **Navigation Redesign:** the Billing section (amends D-064).
- **Users and Roles / PR #3443:** the five NEW codes and the Billing display group.
- **Coded diagnosis at order entry** (ICD-10, searchable): new data for insurer claims (FR-G3).
- **FHIR exchange:** a named door for claims and remittances (PR #4660), new External Connection types (FHIR claims, Mobile money), IG profiles (FR-I3).
- **Payer adapters:** FHIR R4 base and Kenya eClaims (FR-I1); further countries as needed.
- **OpenMRS billing:** a FHIR `Invoice` that references the lab order, readable by OpenELIS (FR-J7). To confirm with the `openmrs-module-billing` maintainers.
- **Odoo:** the existing connection and `odoo_sync_queue`, reworked (FR-J).
- **Mobile money gateway** (optional, FR-D13): one adapter per gateway.
- **Result Delivery foundation** also for receipts and balance reminders to patients (FR-D17, FR-D18).
- **Patient record page:** hosts the Billing section (FR-D16).
- **A receipt printer** (80 mm) where labs use receipt paper.
- **New data elements** listed under Information & Data, and the module switch `billingEnabled`.

---

## Docs Impact

| Manual page | Change |
|---|---|
| Order entry (clinical, environmental, vector) | Section 7: Bill to, member number, coverage check, charges and overrides, quote start; Payment status read-only when Billing is on; the payment chip on the summary strip; the Payment column and filter on the order dashboards. |
| Locations & Organizations | Billing section, Payer filter, Payer ID identifier. |
| Programs | Billing section. |
| Test Catalog | Billing section on tests and panels; "No price" completeness warning. |
| Report Print Queue | "Held: unpaid". |
| Configuration | Billing area. |
| Patient record | Billing section. |
| Menu Configuration | Billing address ignored when Billing is on. |
| New pages | Billing overview, Cash Desk, Bills & Statements, Quotes, Claims, Remittances, Unbilled Work, Billing Reports, Price Lists, Billable Services, Exemption Rules, Payment Modes & Cash Points. |

---

## Out of Scope

- General accounting: ledgers, chart of accounts, payroll, purchasing, tax returns. Odoo or the lab's finance system does these (FR-J).
- Connections to tax authorities or fiscal devices (FR-D6 keeps a fiscal number field only).
- More than one currency, and exchange rates (FR-L2).
- Filing tax returns; the Tax report gives the lab the totals.
- An offline cash desk (FR-M6).
- A patient or client billing portal, and online card payments by the patient.
- Billing for anything other than lab tests, panels and lab billable services (no pharmacy, no consultations).
- Writing off bad debt as an accounting entry; the lab can void statements and accept adjustments, and Odoo records the write-off.
- Cost accounting (the cost of reagents and staff time per test); the Value of Free Services report uses prices, not costs.
- Per-test payers on one order (BL-7).
- Cost reporting with no collection as a scenario of its own (C-3); the Value of Free Services report covers what funders ask for.
- Choosing which order states count as Paid on the order dashboard (for example, billed to a payer showing Not paid until the payer settles). V1 uses the fixed rule in FR-D15 (BL-38); a setting may follow if labs need it.
- Scripts in exemption rules (`openmrs-module-billing` uses JavaScript rules; this FRS uses fields).

---

## Open Questions

1. **Module switch name:** `billingEnabled` (proposed) or the `useBilling` named in the Admin feature-flags design? Neither is on `develop`.
2. **Overrides on insured orders** (C-17, provisional): patient share only by default, with the per-insurer setting "Overrides change the claimed amount". Validate with the first real insurer before `/breakdown`; drop the setting if no insurer needs it.
3. **Who bills referred-in samples** from a referring facility that charges the patient itself: is "Who bills these orders" on the referring facility enough, or does it vary per program?
4. **Billing number on the patient report:** is the patient's `useBillingNumber` the same datum as the order's `billingRefNumber`, and should a masked copy drop it (Result Delivery F-15)?
5. **Hold testing gate and urgent samples:** should urgent-priority orders bypass the gate automatically, with a reason recorded, or always need `billing:release`?
6. **First country adapter:** Kenya eClaims is proposed because its guide is published. Is there a deployment that needs it first, or another country's adapter?

---

## Decisions (proposed, BL-1 to BL-38)

Local IDs, prefixed BL so they do not read as ledger IDs (the ledger's highest IDs are being assigned by sibling specs; read `openelis-design-skill-src/references/decision-log.md` at registry upkeep and map BL-n to the next free D-IDs). The brief's C-numbers are given for each.

| ID | Decision | Brief |
|---|---|---|
| BL-1 | Billing is a native core in OpenELIS (prices, charges, payments, receipts, claims, remittances), with Odoo as an optional accounting backend and OpenELIS the record. | C-2, C-10 |
| BL-2 | The main menu gains a **Billing** section between Reports and Administration, with Overview, Cash Desk, Bills & Statements, Quotes, Claims, Remittances, Unbilled Work and Reports. Amends D-064. | Design brief |
| BL-3 | Billing settings live in a new Configuration area **Billing**, stored as `site_information` entries; `trackPayment` and the billing reference number move there. | Design brief |
| BL-4 | Billing setup pages form an Admin **Billing** group in the Resources bucket: Price Lists (with promotions), Billable Services, Exemption Rules, Payment Modes & Cash Points. Payers are configured on Organizations and Programs, not on a separate payer page. | Design brief, C-7 |
| BL-5 | Prices live in price lists: a default list and one per payer or tariff, with dated prices for tests, panels and billable services and an optional payer billing code. The Odoo price file is retired. | C-6 |
| BL-6 | FHIR R4 is the eClaims standard; each country or payer has an adapter, and Billing's records never assume one message shape. | C-5 |
| BL-7 | One payer per order (Bill to), with an optional patient share on insured orders; no payer per test. | C-7 |
| BL-8 | The payment gate is a lab setting, Off by default, holding testing or the report; it applies only to the patient's share. | C-9 |
| BL-9 | The order's Payment status is set by Billing and read-only in order entry when Billing is on. | C-2, C-10 |
| BL-10 | A charge is created when a billable item is added, by any route, in the same transaction; claims and statements include only released tests. | C-8, C-22 |
| BL-11 | Charge rules (reruns, repeats, redraws, reflex, added later, pre-authorization) are set per test in the Test Catalog; QC and EQA are never charged. | C-19 |
| BL-12 | Panels are priced per price list as a panel price or the sum of their tests; fees that are not tests are billable services, added by hand or by rule. | C-19 |
| BL-13 | Every charge stores its list price beside its charged price, with the reason for any difference. | C-17 |
| BL-14 | Overrides need a reason and no approval; promotions are time-bound adjustments on price lists, applying to an insurer's list only when named; everything is reviewed afterwards in the Overrides report. Price precedence: quote, override, promotion, list price; exemptions and the insured patient's share then set the shares without changing the price. | C-17 |
| BL-15 | The Cash Desk is a page with a side panel per order, not a modal; payments need an open shift. | C-20, design brief |
| BL-16 | One gap-free receipt sequence per lab, with prefix and optional yearly reset; voided receipts keep their numbers; an optional fiscal number field; no tax-authority connection. | C-15 |
| BL-17 | Who bills is set per order source; orders billed by the EMR create no charges, and their paid status is read from the EMR's FHIR `Invoice` when the gate needs it. | C-18 |
| BL-18 | Environmental quotes are in scope: priced from the client's list, locked when accepted, used by orders until their sample counts are used up; a sent quote is re-issued, never edited. | C-16 |
| BL-19 | Exemptions are rules with field conditions (age, sex, program, items, lab unit, payer type) that waive the patient's share; a paying program is a payer, not an exemption. | C-20 |
| BL-20 | Every released test has a charge or exactly one free reason; anything else is Unbilled Work. Unpriced items are never charged at zero silently. | C-22 |
| BL-21 | Institutions, programs and environmental clients are billed by scheduled statements of released tests, with reminders through the Result Delivery outbox. | C-24 |
| BL-22 | Credit limits warn at order entry and never block. | C-24 |
| BL-23 | Insurer claims are made per order or in daily or weekly batches, per insurer. | C-5 |
| BL-24 | Coverage checks are optional per insurer and never block registration. | C-11 |
| BL-25 | A corrected claim is a new claim related `prior` to the original, for denied or rejected lines only; a claim sent by mistake is voided with `entered-in-error` and kept. | C-14 |
| BL-26 | Remittances arrive as `PaymentReconciliation` or `PaymentNotice` through the adapter, or are entered by hand; matched details are applied only when nothing on the remittance needs review. A denied line has no status of its own: its charge stays Claimed and is worked from Needs attention (refines the brief's "Denied"). | C-5 |
| BL-27 | OpenELIS sends Odoo one invoice per bill or statement and each payment; only payments entered in Odoo come back; there is no fallback partner. | C-10 |
| BL-28 | One Revenue Integrity report covers released-while-unpaid, receipt gaps and voids, refunds, overrides and cash counts. | C-23 |
| BL-29 | The Billing overview is built on the shared dashboard pattern and grows with each release. | C-25 |
| BL-30 | Refunds are negative payments linked to the original; over a lab-set limit they need a billing manager's approval; credits stay on the patient. Nothing in Billing is deleted. | C-13 |
| BL-31 | Payment status is visible on the order itself: a payment chip on the order's summary strip and page header, and a Payment column, filter and sort on every order dashboard, linking to the Cash Desk for cashiers. | Casey 2026-10-20 |
| BL-32 | Billing calculates tax: dated tax rates, a tax category per test, panel and billable service, tax-exempt payers, price lists with or without tax, tax on every printed document and claim, and a tax report. | Casey 2026-10-20 |
| BL-33 | The patient has a billing account: a Billing section on the patient record, receipts by SMS or email, optional balance reminders, and patients in Aging. | Casey 2026-10-20 |
| BL-34 | Finance controls: closed periods cannot change; opening balances are imported at go-live; statement lines can be disputed; tests cancelled after testing started keep their charge unless the test says otherwise. | Casey 2026-10-20 |
| BL-35 | OpenELIS publishes its bills and statements as FHIR `Invoice` with `ChargeItem`s for the ordering EMR, read-only, through the named door. | Casey 2026-10-20 |
| BL-36 | A Revenue report by test, lab unit, payer and month, and a price check at the Cash Desk. | Casey 2026-10-20 |
| BL-37 | The order dashboard shows only Paid or Not paid, with no amounts for anyone; Paid means nothing is due at the lab's counter. Odoo can set an order's Payment status from its invoice's `payment_state`, also with Billing off. | Casey 2026-10-26 |
| BL-38 | On the order dashboard, orders billed to a payer with no patient share, waived or exempt orders, and EMR-billed orders count as **Paid** (nothing is due at the lab's counter), with the reason in the tooltip. A setting to change which of these count as Paid may come later, if labs need a different workflow; it is not in V1. | Casey 2026-11-01 (resolves the former Open Question 7) |
