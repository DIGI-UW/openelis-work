# Setting up CLSI reporting rules from your own M100

For labs that interpret with CLSI. OpenELIS does not include CLSI's reporting tiers, so you enter them once from your lab's own copy of CLSI M100 (36th edition, 2026, or the edition your lab uses). You need about an hour per organism group.

**Before you start**

- Have your lab's licensed copy of M100 open at Table 1 (Tables 1A to 1J, "Antimicrobial Agents That Should Be Considered for Testing and Reporting").
- Your AST panels exist in Admin › Microbiology reference data › AST panels, one per organism group you test.
- You have the Microbiology reference data admin permission.

## 1. Read one Table 1 page the way OpenELIS needs it

Each Table 1 page covers one organism group and has four tier columns:

| Tier | What it means | Report default in OpenELIS |
|---|---|---|
| Tier 1 | Test and report routinely | Report |
| Tier 2 | Test routinely, report by your cascade rules | Cascade |
| Tier 3 | Test routinely only if you serve patients at high risk of MDROs, report by cascade | Cascade, or leave out of the panel |
| Tier 4 | Test and report only when a clinician asks | Don't report |

Three things on the page change how you enter a row:

- **Rows are grouped in boxes.** A Tier 2 or Tier 3 agent in the same box as Tier 1 agents is the one to release when those Tier 1 agents are resistant. Those Tier 1 agents are the cascade's trigger.
- **A shaded Tier 1 cell** means the Tier 2 agent beside it has no trigger. Leave Trigger agents blank: OpenELIS lists the rule under **Needs a condition** until you write your own, and the agent starts unticked.
- **"X or Y"** (for example cefotaxime or ceftriaxone) means test one of them. Add a row for each, and keep only the one you test on your panel. A trigger list naming both is met by whichever you tested.

Below the band marked **Urine Only** are agents for urinary isolates only. Read every footnote: they carry species restrictions, specimen exclusions and "MIC only" notes.

## 2. Set the tier on each AST panel agent

1. Open Admin › Microbiology reference data › AST panels and choose the panel for the organism group.
2. For each antibiotic, set **Tier** to the M100 tier (1 to 4; Tier 4 is "On request").
3. Save. The panel is now ordered by tier on the AST run.

## 3. Build the reporting rules

1. Open Admin › Microbiology reference data › AST rules and choose **Export** to get the reporting rules workbook.
2. On the Reporting rules sheet, add one row per agent for the organism group:
   - **Tier** column: the M100 tier. Import turns it into the report default from the table above.
   - **Trigger agents**: for Tier 2 and Tier 3 agents, the codes of the agents in the same box that release them, separated by semicolons. Usually these are the Tier 1 agents; a Tier 3 agent next to Tier 2 agents (the carbapenem combinations) cascades on those Tier 2 agents. OpenELIS turns the list into "any of these is R".
   - **Sample types**: Urine for agents under Urine Only.
3. Turn footnotes into extra rows:
   - "Only for species X" or "X only": add a row at species level for that organism. Set the group row to Don't report.
   - "Not routinely reported from urine" or "from the lower respiratory tract": add a Don't report row for that sample type.
   - "Consider Tier 1 for these genera": add species rows set to Report.
   - "Surrogate for agent Y" (cefoxitin for oxacillin, cefazolin for oral cephalosporins in urine): add an **interpretation rule** on the same page that reports the result as agent Y.
   - "Confirm before reporting": add a rule note so the tech sees it.
4. Choose **Import** and review the preview. Check the **Needs a condition** group and any warnings about trigger agents that have no row, then apply it.

## 4. Check it

1. In the Preview at the bottom of AST rules, pick the organism, a sample type, and resistant results for the Tier 1 agents.
2. Confirm the Tier 2 agents in the same box are suggested and ticked, and the Tier 4 agents are not.
3. Repeat for a urine sample.

## 5. Each new M100 edition

Check the edition's "Overview of Changes" and the agents in bold in Table 1 (new or changed). Change only those rows, and record the edition in **Written for**.
