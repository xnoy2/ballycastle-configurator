# BCF Admin User Guide
**Ballycastle Climbing Frames — Admin Portal**

---

## Getting Started

### How to Log In
1. Go to the admin portal URL
2. Enter your admin **email** and **password**
3. Click **Sign In**

> If you forget your password, use the **Forgot Password** link on the login page.

---

## Navigation Overview

Once logged in, you will see the main menu across the top of the screen:

| Tab | What It Does |
|-----|-------------|
| **Dashboard** | Summary of all activity at a glance |
| **Configurator** | Set up products, options, surfaces, and installation types |
| **Quotes** | View and manage quote requests from clients |
| **Users** | Add and manage clients, workers, and admins |
| **Orders** | View and manage all installation orders |
| **Extras** | Manage add-on items available to clients |
| **Reviews** | View client reviews |
| **Referrals** | Track referral programme entries |

---

## Managing Quotes

Quotes are submitted by prospective clients through the configurator on the website.

### Viewing Quotes
1. Click the **Quotes** tab
2. New quotes show an **amber "New"** badge — these need attention
3. Click any quote card to expand and see what the client selected

### Processing a Quote
1. Review the items the client chose and the total price
2. Update the **status** using the dropdown:

| Status | When to Use |
|--------|------------|
| Pending Review | Received but not yet looked at |
| Under Review | You are actively reviewing or contacting the client |
| Approved | Agreed — ready to create an order |
| Not Approved | Declined |

3. Add **admin notes** if needed (clients can see these when you respond)
4. Once approved, create the order in the **Orders** tab

> **Rule:** Do not leave a quote on "New" for more than 48 hours. Update the status as soon as you have reviewed it.

---

## Managing Users

### Adding a New Client
1. Click **Users** → **+ Add User**
2. Fill in: Name, Email, Phone
3. Set **Role = Client**
4. Click **Save**
5. Send the client their login link (see Generating Login Links below)

### Adding a New Worker
1. Click **Users** → **+ Add User**
2. Fill in: Name, Email, Phone
3. Set **Role = Worker**
4. Click **Save**
5. Click **🔑 Temp Password** on their row → generate or enter a temporary password
6. Share the temporary password with the worker securely
7. The worker sets their own password on first login

### Editing a User
1. Find the user using the **search box** or **role filter** dropdown
2. Click **✏️ Edit** on their row
3. Update name, email, or phone
4. Click **Save**

### Generating a Login Link
- **For clients:** Open the order → Order Details tab → click **🔗 Get Login Link** → copy and send to the client
- **For workers:** Click **🔗 Login Link** on their row in the Users tab

> Login links expire. If a client or worker says their link doesn't work, generate a new one.

### Resetting a Worker's Password
1. Find the worker in the Users tab
2. Click **🔑 Temp Password**
3. Generate or enter a new temporary password
4. Share it with the worker — they will be prompted to set their own on next login

### Deleting a User
> ⚠️ This is permanent. The user will lose all login access.

1. Find the user → click **🗑️ Delete**
2. Confirm when prompted

---

## Managing Orders

Orders are the heart of the system. Every installation job is tracked as an order.

### Opening an Order
1. Click the **Orders** tab
2. Find the order in the list (search by client name or order number)
3. Click on the order to open it

Inside each order there are **6 tabs**:

---

### Tab 1 — Order Details

Complete this tab first when an order is created.

| Field | What to Enter | Why It Matters |
|-------|--------------|----------------|
| Address | Full installation address | Shown to worker and client |
| Assign Worker | Select from the worker dropdown | Worker will only see the job once assigned |
| Installation Date | The confirmed installation date | Triggers instant notification to client and worker |
| Time Window | e.g., "9:00 am – 12:00 pm" | Tells both parties when to expect the visit |
| Product Order | e.g., "Rathlin Climbing Frame" | Shown on the worker's job view |
| Notes | Internal office notes | Visible to admin and worker only — not the client |
| Birthday Booking | Toggle on if applicable | Shows a birthday alert to the worker |

**Sending the client their portal link:**
- Click **🔗 Get Login Link** → copy and send to the client by email or message

---

### Tab 2 — Build Progress

This tab shows everything the worker has done on site.

- **Build stages** are the main steps (e.g., Groundwork, Frame Construction, Final Inspection)
- Each stage can contain **tasks** — specific sub-steps the worker completes
- Workers update stages and tasks from their Worker Panel
- Photos uploaded by the worker appear grouped by stage and task

> You cannot manually mark stages as Done from the admin side — only workers can do this from their panel.

**To view site photos:**
- Click on any stage row to expand it
- All photos uploaded for that stage and its tasks will appear

---

### Tab 3 — Payments

Manage the full financial record of the order here.

**Step 1 — Set the contract amount**
- Enter the agreed price in the **Base Contract Amount** field

**Step 2 — Add the payment schedule**
- Click **Add Milestone**
- Enter: label (e.g., "50% Deposit"), amount, and due date
- Repeat for each payment stage
- These milestones appear in the client's portal

**Step 3 — Record received payments**
- When a payment arrives, click **Add Payment**
- Enter: date received, method (Bank Transfer / Card / Cash / Other), amount, reference
- The balance due updates automatically

**Step 4 — Add amendments if needed**
- If scope changes (extras added, reductions agreed), click **Add Amendment**
- Enter: description, amount (use a **negative number** for reductions), approval date
- Amendments adjust the contract total automatically

> **Rule:** Record every payment within 24 hours. If payments are not logged, the client portal will show incorrect status.

---

### Tab 4 — Extras & Variations

- View any extras the client has requested
- Review variation requests submitted by the client
- Update status (Approved / Not Approved) and add admin notes
- Admin notes are shown to the client when you respond

---

### Tab 5 — Documents

- Upload documents for this order (specifications, quotes, invoices, T&Cs)
- Select the correct **category** when uploading so the client can find them
- Clients can download all documents from their portal

---

### Tab 6 — Build Photos (Gallery)

- View all photos uploaded by the worker
- Grouped by stage → task
- Supports images and files (PDFs, Word docs, etc.)

---

## Notifications — What Triggers Them

The following actions send automatic notifications to clients and/or workers:

| Your Action | Who Gets Notified |
|-------------|------------------|
| Set or change installation date | Client ✅ + Worker ✅ |
| Set or change time window | Client ✅ + Worker ✅ |
| Toggle Birthday Booking ON | Client ✅ + Worker ✅ |
| Update the Product Order field | Worker ✅ only |
| Update the internal Notes field | Worker ✅ only |
| Assign a worker to an order | Worker ✅ only (new job alert) |

> **Important:** Notifications only go to the worker if one is assigned. Always assign the worker before updating these fields if you want them to be informed.

---

## Configurator

The Configurator tab controls what options are available when clients build a quote.

| Section | What It Controls |
|---------|-----------------|
| Products | Main climbing frame models |
| Selections | Options within each product (slide type, swing, etc.) |
| Ground Surfaces | What surface the frame sits on (grass, bark, rubber) |
| Installation Options | How the frame is installed |

> ⚠️ Do not delete products or options that are linked to active orders.

---

## New Order Checklist

Use this every time a new order is created:

- [ ] Client profile exists in Users tab (name, email, phone correct)
- [ ] Order linked to the correct client
- [ ] Installation address entered
- [ ] Worker assigned
- [ ] Installation date confirmed and entered
- [ ] Time window entered
- [ ] Product Order field filled in
- [ ] Birthday Booking toggled on if applicable
- [ ] Build stages are set up for the order
- [ ] Base contract amount entered in Payments tab
- [ ] Payment schedule (milestones) added
- [ ] Client login link generated and sent
- [ ] Any specification documents uploaded to Documents tab

## Pre-Installation Day Checklist

- [ ] Worker is confirmed and assigned
- [ ] Installation date and time are correct in the system
- [ ] Client has received their portal link
- [ ] Client has added any access notes they need to (gate codes, dogs, etc.)
- [ ] Birthday booking flag is set if applicable
- [ ] Worker has the job showing in their panel

## Post-Installation Checklist

- [ ] All build stages show as ✅ Done
- [ ] All photos uploaded and visible
- [ ] Final payment recorded
- [ ] Balance Due shows £0 (or agreed remaining amount)
- [ ] Client portal shows 100% build progress
- [ ] Outstanding documents uploaded

---

## Common Problems & Fixes

| Problem | What to Check |
|---------|--------------|
| Worker can't see their job | Is a worker assigned to the order? Ask them to log out and back in |
| Client portal shows wrong payment balance | Check all payments are recorded in the Payments tab |
| Notifications not arriving | Is the worker assigned? Has the `worker_notifications` table been set up? |
| Build progress stuck at 0% | Worker may not have started updating stages — contact them |
| Login link not working | Generate a new link — old links expire |
| Stage won't mark as Done | Worker has incomplete tasks — all must be ticked first |

---

*BCF Admin Guide · Last updated May 2026*
