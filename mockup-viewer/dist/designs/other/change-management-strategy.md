# OpenELIS Global – Change Management Strategy

## Purpose

This document defines how change requests are received, logged, prioritized, and executed across OpenELIS Global projects. The goal is to ensure all work is tracked, scoped, and aligned with available paid hours — while giving customers a clear, consistent experience regardless of how or where they submit requests.

## Core Principles

1. **Every request gets logged.** If it's going to take 4 or more hours of dev time, it must have a Jira ticket. No exceptions, no matter where the request originated.
2. **One intake point.** All requests flow through a single point of contact (the Change Coordinator) before reaching developers. Devs should not be accepting or scoping work directly from customers.
3. **Priority is a rank, not a label.** We do not use "high / medium / low." Every item in the backlog has a numerical rank (1 through N). If something moves up, something else moves down. Customers need to understand this tradeoff explicitly.
4. **Scope is tied to hours.** Each project has a fixed number of paid hours. Every accepted request consumes hours from that budget. Customers must understand that adding work means other work gets deferred or dropped.
5. **A senior dev owns every issue.** Every ticket in active development is assigned a senior developer who is accountable for oversight, quality, and completion.

---

## Roles

| Role | Responsibility |
|---|---|
| **Change Coordinator** (Point Person) | Receives all incoming requests, logs them in Jira, facilitates triage, communicates priority decisions back to customers. First line of defense against scope creep. |
| **Senior Developers** | Assigned to oversee individual issues. Provide effort estimates, flag scope concerns, and ensure technical quality. |
| **Project Lead (Casey)** | Sets overall project priorities, approves scope changes that significantly impact budgeted hours, and resolves priority disputes. |
| **Customers** | Submit requests through designated channels. Participate in priority discussions with the understanding that the backlog is a ranked stack, not a wish list. |

---

## Request Intake Workflow

### Step 1: Request Received

Requests will come in from multiple channels — Slack, email, WhatsApp, Zoom calls. That's fine. But regardless of where a request originates, the following rule applies:

> **The person who receives the request is responsible for forwarding it to the Change Coordinator.** Devs who are contacted directly should acknowledge receipt and redirect the customer to the Change Coordinator. They should not estimate, commit to, or begin work based on a direct request.

**Suggested redirect language for devs:**

> "Thanks for flagging this — I want to make sure it gets properly tracked and prioritized. I'm going to loop in [Change Coordinator] so we can get this into the backlog and make sure it's scoped against the current plan."

### Step 2: Logging

The Change Coordinator logs the request in Jira as a backlog item. Every ticket should include:

- **Summary**: Clear, concise title
- **Description**: What the customer is asking for, in enough detail to estimate
- **Requesting Customer**: Which of the four customers submitted this
- **Source Channel**: Where the request came from (Slack, email, WhatsApp, Zoom)
- **Date Received**: When the request was first raised
- **Rough Size Estimate**: Quick gut-check — is this a few hours, a few days, or a few weeks? (Formal estimation happens at triage.)

Requests estimated at under 4 hours can be handled as quick-fix items and may not require a full ticket, but should still be noted in a running log (a shared Slack thread, Confluence table, or lightweight Jira task) so hours are tracked against the project budget.

### Step 3: Triage and Estimation

The team reviews new backlog items during a regular triage session (recommended: weekly, 30 minutes max). During triage:

- A **senior dev** provides or validates an **effort estimate in hours**
- The team discusses where the item should sit in the **ranked priority list** relative to existing work
- The team flags any items that would cause the project to **exceed its budgeted hours** if accepted
- A **senior dev is assigned** to oversee the issue if it moves into active work

### Step 4: Priority Communication to Customer

After triage, the Change Coordinator communicates back to the customer:

- The item has been logged (with Jira ticket reference if applicable)
- Its current **numerical priority position** in the backlog (e.g., "This is currently item #7 of 12 in the backlog")
- The **estimated effort** in hours
- The **impact on the remaining hour budget** (e.g., "Your project has 80 hours remaining this quarter. This request is estimated at 20 hours, which would leave 60 hours for the remaining 8 items in the backlog.")
- If the customer wants this item prioritized higher, **what moves down** as a consequence

**This is the critical conversation.** Customers need to understand that priority is a zero-sum ordering. We are not saying no — we are saying "yes, and here's what that means for everything else."

### Step 5: Execution and Tracking

Once work begins:

- The assigned **senior dev** is accountable for the issue
- Time is tracked against the ticket in Jira (worklogs)
- If the actual effort is trending significantly over the estimate, the senior dev flags this to the Change Coordinator and Project Lead **before** exceeding the estimate
- The Change Coordinator updates the customer if scope or timeline changes

---

## Handling Direct Developer Requests

This is the habit we're breaking. The expectation going forward:

1. **Devs do not accept, scope, or begin work from direct customer requests.** They acknowledge and redirect.
2. **Devs are not responsible for saying no to customers.** That's the Change Coordinator's job (with Project Lead backing).
3. **This is not about being bureaucratic.** It's about making sure the team's limited hours go to the right things in the right order, and that nothing falls through the cracks.

If a dev is repeatedly being contacted directly by a customer after redirection, the Change Coordinator or Project Lead should have a direct conversation with that customer to reinforce the process.

---

## Budget and Scope Management

Each customer project has a defined number of paid hours. The Change Coordinator maintains a running view of:

- **Total budgeted hours** for the project/period
- **Hours consumed** (from Jira time tracking)
- **Hours committed** (estimated hours for items currently in progress or approved)
- **Hours remaining** (budget minus consumed minus committed)

This information should be visible to the team (a simple Confluence page or Jira dashboard) and referenced in every priority conversation with customers. When the remaining hours are insufficient to cover new requests, the conversation shifts to: "Which existing items do you want to deprioritize or defer to make room?"

---

## Escalation

If a customer disagrees with a priority decision or wants to override the ranked order, the escalation path is:

1. Change Coordinator discusses tradeoffs with the customer
2. If unresolved, Project Lead (Casey) makes the final call
3. The decision and rationale are documented on the Jira ticket

---

## Quick Reference: When Does Something Need a Ticket?

| Estimated Effort | Tracking Requirement |
|---|---|
| Under 4 hours | Log in running tracker (Slack thread, Confluence table, or lightweight Jira task). Track time spent. |
| 4 hours or more | Full Jira ticket required. Must go through triage and prioritization. Senior dev assigned. |
| Any scope change to an existing ticket | Update the ticket. Re-estimate. Flag if it pushes the project over budget. |

---

## Tools

| Tool | Use |
|---|---|
| **Jira** | Backlog management, ticket tracking, time logging, priority ranking |
| **Confluence** | Strategy docs (like this one), hour budget dashboards, meeting notes from triage |
| **Slack** | Team communication, quick-fix request log, async triage discussion |
| **Email / WhatsApp / Zoom** | Customer communication as needed — but all requests must flow back into the Jira intake process |

---

## Rolling This Out

1. **Share this document** with the dev team and Change Coordinator. Make sure everyone is aligned on the redirect expectation.
2. **Notify customers** that we are implementing a streamlined request process. Frame it as a benefit: better tracking, clearer timelines, no lost requests. Provide them with the Change Coordinator's contact info and preferred channel.
3. **Set up the Jira backlog view** with numerical ranking and hour budget fields if not already in place.
4. **Start the weekly triage meeting** — keep it short, keep it consistent.
5. **Review after 4–6 weeks** to see what's working and what needs adjustment.

---

*This is a living document. Update it as the process evolves.*
