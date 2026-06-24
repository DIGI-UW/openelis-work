# OpenELIS Test Catalog — Test Cases

These test cases cover the full Test Catalog module in OpenELIS Global.
Each case includes navigation path, preconditions, steps, and success criteria.

The Carbon for React UI is used throughout. Expect Carbon components:
`TextInput`, `Select`, `Toggle`, `DataTable`, `Button`, `Modal`, `Notification`.

---

## TC-01 — Create a New Test

**Section:** Test Management
**Severity:** High (core CRUD — if this fails, the catalog is broken)

### Navigation
Admin menu → Test Management → Add Test
(URL path is typically `/MasterListsPage` or similar — navigate via the UI menu)

### Preconditions
- Logged in as admin
- No existing test with prefix `QA_AUTO_`

### Steps
1. Navigate to the Admin menu (top navigation bar or hamburger menu)
2. Find and click **Test Management** or **Test Catalog** (may be under "Administration")
3. Click **Add Test** button
4. Fill in the following fields:
   - **Test Name:** `QA_AUTO_Create Test`
   - **Description:** `Automated QA test entry`
   - **Test Section / Department:** Select any available section from the dropdown
   - **Sample Type:** Select any available sample type (e.g., `Serum`, `Blood`)
   - **Result Type:** Select `Numeric` or `Alpha` — whichever is available
   - **Units:** (if numeric) enter `mg/dL`
   - **Active:** Toggle to ON/Active
5. Click **Save** or **Submit**
6. Take a screenshot of the confirmation state

### Success Criteria
- No error notification appears
- The test `QA_AUTO_Create Test` appears in the test list/table
- A success toast or confirmation message is shown

### What to Store
- Store the test name `QA_AUTO_Create Test` for use in TC-02, TC-03, TC-04

---

## TC-02 — Search / Filter for a Test

**Section:** Test Management
**Severity:** Medium (search is essential for labs with large catalogs)

### Navigation
Admin → Test Management (the main list view)

### Preconditions
- TC-01 completed successfully (the test `QA_AUTO_Create Test` exists)

### Steps
1. Navigate to the Test Management list page
2. Locate the **search bar** or **filter input** at the top of the test table
3. Type `QA_AUTO` into the search field
4. Wait for the table to filter
5. Take a screenshot of the filtered results

### Success Criteria
- The table shows at least one result containing `QA_AUTO_Create Test`
- No unrelated tests dominate the results
- The search responds without a page error

### Bonus Check (if time permits)
- Clear the search and verify the full list returns
- Search for a non-existent string like `ZZZNOMATCH999` and verify the table shows an empty state

---

## TC-03 — Edit an Existing Test

**Section:** Test Management
**Severity:** High (editing test properties is a routine lab admin task)

### Navigation
Admin → Test Management → find `QA_AUTO_Create Test` → Edit

### Preconditions
- TC-01 completed — `QA_AUTO_Create Test` exists in the catalog

### Steps
1. Navigate to the Test Management list
2. Find `QA_AUTO_Create Test` (use search from TC-02 if needed)
3. Click the **Edit** button or row action for that test
4. Modify the following field:
   - **Description:** Change to `Automated QA test entry — EDITED`
5. Click **Save** or **Update**
6. Navigate back to the test list and re-open the test (or stay on the edit page if it refreshes)
7. Take a screenshot confirming the updated description

### Success Criteria
- No error notification appears
- The test record now shows `Automated QA test entry — EDITED` in the description field
- A success toast or confirmation message is shown

---

## TC-04 — Deactivate a Test

**Section:** Test Management
**Severity:** High (deactivation controls which tests are orderable)

### Navigation
Admin → Test Management → find `QA_AUTO_Create Test` → Edit or toggle

### Preconditions
- TC-01 completed — `QA_AUTO_Create Test` exists and is Active

### Steps
1. Navigate to the Test Management list
2. Find `QA_AUTO_Create Test`
3. Either:
   - Click the **Active/Inactive toggle** directly in the table row, OR
   - Click **Edit** and toggle the **Active** field to OFF/Inactive
4. Click **Save** if required
5. Take a screenshot of the updated state
6. Verify the test now shows as **Inactive** in the list (may have a different visual indicator
   such as grayed out, a badge, or a status column)

### Success Criteria
- The test status changes to Inactive without an error
- The test still appears in the list (it should not be deleted, just deactivated)
- A success message is shown if applicable

---

## TC-05 — Add a Test Panel

**Section:** Test Configuration (Panels)
**Severity:** Medium (panels group tests for ordering efficiency)

### Navigation
Admin → Test Management → Test Panels (or Panels section)
(May also be under: Admin → Configuration → Test Panels)

### Preconditions
- Logged in as admin
- At least one active test exists (can use `QA_AUTO_Create Test` if TC-01 passed)

### Steps
1. Navigate to the **Test Panels** management section
2. Click **Add Panel** or **New Panel**
3. Fill in:
   - **Panel Name:** `QA_AUTO_Panel`
   - **Description:** `Automated QA panel`
4. Add at least one test to the panel:
   - Look for an "Add Tests" section or a test picker
   - Select any available test from the list (e.g., `QA_AUTO_Create Test` or any existing test)
5. Click **Save**
6. Take a screenshot of the saved panel

### Success Criteria
- Panel `QA_AUTO_Panel` appears in the panels list
- The associated test is shown on the panel detail view
- No error notification

---

## TC-06 — Configure Result Type and Normal Ranges

**Section:** Test Configuration (Result Configuration)
**Severity:** High (incorrect normal ranges lead to wrong clinical flags)

### Navigation
Admin → Test Management → find a test → Edit → Result configuration section

### Preconditions
- Logged in as admin
- A test exists with a numeric result type (use `QA_AUTO_Create Test` if it was created
  with `Numeric` result type; otherwise find any numeric test)

### Steps
1. Open a numeric test in Edit mode (use `QA_AUTO_Create Test` or another numeric test)
2. Find the **Normal Range** or **Reference Range** section
3. Fill in:
   - **Low Normal:** `5`
   - **High Normal:** `100`
   - **Units:** `mg/dL` (if not already set)
4. If there is a **Critical Low** / **Critical High** field, fill in:
   - **Critical Low:** `2`
   - **Critical High:** `150`
5. Click **Save**
6. Take a screenshot of the saved configuration
7. Re-open the test to verify the values persisted

### Success Criteria
- Normal range values save without error
- Re-opening the test shows the same values (persistence check)
- No validation errors for valid numeric inputs

---

## TC-07 — Add / Verify Sample Type on a Test

**Section:** Sample Types
**Severity:** High (wrong sample types prevent correct order routing)

### Navigation
Admin → Test Management → find `QA_AUTO_Create Test` → Edit → Sample Types section
OR Admin → Sample Types (standalone management page)

### Preconditions
- TC-01 completed — `QA_AUTO_Create Test` exists
- At least one sample type is configured in the system (e.g., `Serum`, `Whole Blood`)

### Steps
1. Open `QA_AUTO_Create Test` in Edit mode
2. Find the **Sample Type(s)** section or tab
3. If a sample type is already assigned, verify it is correct and proceed to step 5
4. If no sample type is assigned:
   - Click **Add Sample Type** or use the sample type selector
   - Choose an available type (e.g., `Serum`)
   - Click **Add** or **Save**
5. Take a screenshot showing the assigned sample type
6. Verify the sample type appears in the test's detail/edit view

### Success Criteria
- The test has at least one sample type associated
- No error notification when saving
- The sample type is visible in the test configuration

---

---

## TC-08 — Reactivate Test (Order Workflow Prerequisite)

**Section:** Add/Order Workflow
**Severity:** High (a test must be Active to be orderable — this validates the active/inactive gate)

### Navigation
Admin → Test Management → find `QA_AUTO_Create Test` → Edit or toggle

### Preconditions
- TC-04 completed — `QA_AUTO_Create Test` is currently Inactive

### Steps
1. Navigate to Test Management
2. Find `QA_AUTO_Create Test` (it should show as Inactive from TC-04)
3. Either:
   - Click the **Active/Inactive toggle** directly in the table row, OR
   - Click **Edit** and toggle the **Active** field back to ON/Active
4. Click **Save** if required
5. Take a screenshot confirming the test is now Active

### Success Criteria
- `QA_AUTO_Create Test` shows as **Active** in the list
- No error notification

### What to Store
- Confirm active status for use in TC-09 and TC-10

---

## TC-09 — Add Sample and Place Order (including Test Selection)

**Section:** Add/Order Workflow
**Severity:** Critical — adding a sample and selecting tests is a single workflow in OpenELIS.
If a catalog test doesn't surface here, it cannot be used clinically regardless of how it's
configured in the admin section.

### Navigation
Order → Add Order (or Sample → Add Sample)
(Look for "Add Order", "New Order", or "Add Sample" in the main navigation)

### Preconditions
- TC-08 completed — `QA_AUTO_Create Test` is Active
- At least one patient exists in the system (use any existing patient — don't create one)

### Steps
1. Navigate to the **Add Order** / **Add Sample** page
2. Fill in required patient/order fields:
   - Search for and select an existing patient (type a common name or select the first result)
   - **Requester / Requested By:** use any available provider
   - **Priority:** Routine (or the default)
   - **Order Date:** today's date
3. Proceed to the **Test Selection** section (part of the same Add Sample form)
4. In the test search/typeahead field, type `QA_AUTO`
5. Take a screenshot of the search results before selecting
6. Verify `QA_AUTO_Create Test` appears and is selectable (not grayed out)
7. Select `QA_AUTO_Create Test`
8. Also search for and add `QA_AUTO_Panel` if panels appear in the same test picker
9. Click **Submit** or **Save** to complete the order
10. Take a screenshot of the order confirmation / accession number screen

### Success Criteria
- `QA_AUTO_Create Test` appears in the test picker when searching `QA_AUTO`
- It is selectable (not grayed out or disabled)
- The order submits without error
- An accession number or order ID is generated and displayed
- `QA_AUTO_Create Test` appears in the order confirmation summary

### If the test does NOT appear in the picker
- Mark as `FAIL` — note the exact search behavior and screenshot the empty results
- This indicates the active flag isn't being respected in order entry, or the test
  wasn't properly saved to the catalog

### What to Store
- Accession number / order ID for TC-10 and TC-11

---

## TC-10 — Verify Order Appears in Worklist / Sample Queue

**Section:** Add/Order Workflow
**Severity:** High — confirms the order flows correctly into the lab processing queue

### Navigation
Worklist → By Test, OR Results Entry → search by accession
(Look for "Results Entry", "Worklist", or "Sample Queue" in the navigation)

### Preconditions
- TC-09 completed — an order exists with `QA_AUTO_Create Test` and the accession number is known

### Steps
1. Navigate to the **Worklist** or **Results Entry** section
2. Search or filter by:
   - The accession number from TC-09, OR
   - Test name `QA_AUTO` in any available test/worklist filter
3. Take a screenshot of the worklist entry
4. Verify the sample/order row shows `QA_AUTO_Create Test` listed as a pending test

### Success Criteria
- The order appears in the worklist with a pending/in-progress status
- `QA_AUTO_Create Test` is listed as a test to result on this sample
- The accession number matches the one from TC-09
- No error or "not found" message

### Bonus Check (if time permits)
- Navigate to **Worklist by Panel** and verify `QA_AUTO_Panel` appears if it was ordered in TC-09

---

## TC-11 — Enter a Result and Verify Normal Range Flag

**Section:** Add/Order Workflow — Results Entry
**Severity:** Critical — this is the full end-to-end proof: catalog config (normal ranges set
in TC-06) must correctly flag results at the point of result entry. This is a patient safety check.

### Navigation
Results Entry → search by accession number from TC-09
(Or navigate from the worklist row found in TC-10 → click to enter results)

### Preconditions
- TC-10 completed — the order is visible in the worklist
- TC-06 completed — normal range set to Low=5, High=100 for `QA_AUTO_Create Test`
- The accession number from TC-09 is known

### Steps

**Sub-test A — Normal result (should show no flag)**
1. Navigate to Results Entry and open the order by accession number
2. Find the result entry field for `QA_AUTO_Create Test`
3. Enter the value `42` (within the normal range of 5–100)
4. Take a screenshot before saving
5. Save the result
6. Verify no abnormal flag (H/L/critical) appears next to the result
7. Take a screenshot of the saved result

**Sub-test B — High result (should show H flag)**
1. Modify or add a second result entry (or create a new order if the UI doesn't allow editing)
2. Enter the value `120` (above the High Normal of 100)
3. Save the result
4. Verify an **H** (High) flag or equivalent indicator appears next to the result
5. Take a screenshot confirming the flag

**Sub-test C — Low result (should show L flag)**
1. Enter the value `2` (below the Low Normal of 5; also below Critical Low of 2 set in TC-06)
2. Save the result
3. Verify an **L** or **Critical Low** flag appears
4. Take a screenshot confirming the flag

### Success Criteria
- Value `42`: saves without a flag (or with a "Normal" indicator)
- Value `120`: saves with an **H** (High) flag visible
- Value `2`: saves with an **L** or **Critical** flag visible
- No system error during any result entry
- All three screenshots are captured

### If flags do not appear
- This is a `FAIL` — it means the normal ranges configured in TC-06 are not being applied
  at result entry. Note which sub-tests failed and what was observed.

---

## Cleanup

After all test cases complete, perform the following cleanup steps:

1. **Cancel / void the QA order** (if the UI supports it):
   - Navigate to the order placed in TC-09 using the accession number
   - Cancel or void the order to remove it from the worklist
2. **Navigate to Test Management**, search for `QA_AUTO`
3. For each `QA_AUTO_*` test item:
   - Deactivate if still active (or delete if the UI supports deletion)
4. **Navigate to Test Panels**, find and delete/deactivate `QA_AUTO_Panel`

Log all cleanup actions. If any cleanup fails, note it but do not count as a test failure.
