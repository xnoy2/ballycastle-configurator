# Ballycastle Climbing Frames — System Guide
**BCF Operations Portal · Admin · Client · Worker**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin Guide](#admin-guide)
3. [Client Guide](#client-guide)
4. [Worker Guide](#worker-guide)
5. [Troubleshooting](#troubleshooting)
6. [Checklists](#checklists)
7. [Data & Integration Rules](#data--integration-rules)

---

## System Overview

The BCF portal is a web-based system with three separate user types, each with their own login and view.

| Role | How They Log In | What They Do |
|------|----------------|--------------|
| **Admin** | Email + password at `/admin` | Manages all orders, quotes, users, payments, and configuration |
| **Client** | Magic link emailed to them | Views their order status, build progress, photos, and payments |
| **Worker** | Magic link (first time) + password | Updates build stages, marks tasks complete, uploads site photos |

**Golden rule:** Every order must have a client, a worker, and a set of build stages before any work begins. If any of these are missing, the data will be incomplete.

---

## Admin Guide

### Logging In

1. Go to the admin URL provided
2. Enter your admin email and password
3. If you forget your password, use the "Forgot Password" option

---

### Dashboard Overview

When you log in you will see the main navigation across the top:

| Tab | What it contains |
|-----|-----------------|
| Dashboard | Summary stats and recent activity |
| Configurator | Product modules, selections, ground surfaces, installation options |
| Quotes | All quote requests from clients |
| Users | All clients, workers, and admins |
| Orders | All active and completed orders |
| Extras | Add-on items available to clients |
| Reviews | Client reviews |
| Referrals | Referral programme entries |

---

### Managing Quotes

**What is a quote?**
A quote is a request submitted by a prospective client through the configurator. It shows what they selected and the estimated price.

**How to process a quote:**
1. Click the **Quotes** tab — new quotes appear with an amber "New" badge
2. Click on a quote card to expand it and see the items selected
3. Change the status from the dropdown:
   - **Pending Review** — you have received it but not yet looked at it
   - **Under Review** — you are actively reviewing/contacting the client
   - **Approved** — agreed and moving to order
   - **Not Approved** — declined
4. Add any admin notes in the notes field (clients see these when you send them)
5. Once approved, create an order manually in the Orders tab

> ⚠️ **Do not leave quotes sitting on "New" for more than 48 hours.** Change the status as soon as you have reviewed it so the team knows the progress.

---

### Managing Users

#### Adding a New Client

1. Click **Users** → click **+ Add User**
2. Fill in: Name, Email, Phone
3. Set Role = **Client**
4. Click Save
5. The client record is created — they will need a login link to access their portal

#### Adding a New Worker

1. Click **Users** → click **+ Add User**
2. Fill in: Name, Email, Phone
3. Set Role = **Worker**
4. Click Save
5. Send the worker their first login:
   - Find the worker in the list
   - Click **🔑 Temp Password** — generate or enter a temporary password
   - Share the password with the worker securely
   - The worker must set their own password on first login

#### Editing a User

1. Find the user in the Users list (use the search box or role filter)
2. Click **✏️ Edit** on their row
3. Update name, email, or phone
4. Click Save

#### Deleting a User

> ⚠️ Deleting a user is permanent and will remove their login access.

1. Find the user → click **🗑️ Delete**
2. Confirm the deletion when prompted
3. The user will no longer be able to log in

---

### Managing Orders

Orders are the core of the system. Every installation job is tracked as an order.

#### Creating an Order

Orders are created by approving a quote or manually through the system. Once created:

1. Click the **Orders** tab
2. Find the order and click on it to open it
3. Fill in the details across all tabs (see below)

---

#### Order Details Tab

This is the first thing to complete when an order is created.

| Field | What to enter | Why it matters |
|-------|---------------|----------------|
| Address | Full installation address | Workers and clients both see this |
| Assign Worker | Select from worker dropdown | Without this, no worker will see the job |
| Installation Date | Pick the date | Triggers a notification to the client and worker |
| Time Window | e.g., "9:00 am - 12:00 pm" | Tells client and worker when to expect the visit |
| Product Order | e.g., "Rathlin Climbing Frame" | Shown to worker on their job view |
| Notes | Internal notes only | Only visible to admin and worker, not the client |
| Birthday Booking | Toggle on if applicable | Shows birthday alert to worker — reminder to bring freebies |

**To generate the client's login link:**
- Click **🔗 Get Login Link** — copy and send this to the client by email or text

---

#### Build Progress Tab

This is where you monitor what the worker is doing on site.

- Each order has a set of **Build Stages** (e.g., Order Confirmed, Groundwork, Frame Construction)
- Each stage can contain **Tasks** (sub-steps within a stage)
- Workers update stages and tasks from their Worker Panel
- You can see in real-time what has been completed

> ℹ️ You cannot manually force stages to "Done" from admin — the worker must do this from their panel. You can, however, see all progress and photos.

**To view uploaded photos:**
- Click on any stage to expand it
- Photos are grouped by stage and task

---

#### Payments Tab

Use this tab to manage the full financial picture of an order.

**Step 1 — Set the contract amount:**
- Enter the base contract value in the **Base Contract Amount** field
- This is the agreed price before any amendments

**Step 2 — Add the payment schedule:**
- Click **Add Milestone**
- Enter a label (e.g., "50% Deposit"), amount, and due date
- Repeat for each payment stage
- Milestones are shown to the client in their portal

**Step 3 — Record received payments:**
- When a payment arrives, click **Add Payment**
- Enter: date received, method (Bank Transfer / Card / Cash / Other), amount, reference
- The balance due updates automatically

**Step 4 — Add amendments if needed:**
- If the scope changes (extra work, reductions), click **Add Amendment**
- Enter description, amount (use a negative number for reductions), and approval date
- Amendments adjust the contract total automatically

> ⚠️ Always record payments as they arrive — if payments are not logged, the client's portal will show incorrect payment status.

---

#### Documents Tab

- Upload any documents related to the order (specifications, quotes, invoices, T&Cs)
- Select the correct **category** when uploading — this helps clients find documents in their portal
- Clients can download all documents from their portal

---

### Sending Notifications

Notifications are sent automatically to clients and workers when you:

| Action | Who gets notified |
|--------|------------------|
| Set or change installation date | Client + Worker |
| Set or change time window | Client + Worker |
| Toggle Birthday Booking on | Client + Worker |
| Update Product Order field | Worker only |
| Update internal Notes field | Worker only |
| Assign a worker to an order | Worker (new job alert) |

> ℹ️ Notifications are instant — the client or worker will see them in their bell icon immediately if they are logged in, or on their next visit.

---

### Product Configurator

The Configurator tab controls what clients and admins can select when building a quote.

**Products:** The main climbing frame modules (e.g., Rathlin, Causeway)
**Selections:** Options within a product (e.g., slide type, swing attachment)
**Ground Surfaces:** What surface the frame will sit on (e.g., grass, bark, rubber)
**Installation Options:** How the frame will be delivered/installed

> ⚠️ Changes here affect all future quotes and configurations. Do not delete products or options that are linked to active orders.

---

## Client Guide

### Accessing Your Portal

You will receive an email with a **login link**. Click that link to access your portal — no password is needed.

> ⚠️ Login links expire. If your link does not work, contact BCF and ask for a new one.

---

### Dashboard

The dashboard gives you an at-a-glance view of your order:

- **Quote Status** — where your quote is in the approval process
- **Build Progress** — percentage of your installation completed
- **Payment Status** — how much of the total you have paid
- **Installation Date & Time** — when your frame will be installed

If your booking is a **birthday booking**, you will see a special banner on your dashboard.

---

### Build Progress

This shows you exactly what stage your climbing frame build is at.

- Each row is a **build stage** (e.g., Order Confirmed, Groundwork, Frame Construction)
- Inside each stage, you can see the individual **tasks** the worker has completed
- When a task is completed, the worker's notes appear — this tells you what was done
- A progress bar at the top shows the overall percentage complete

> ℹ️ You cannot mark stages complete yourself — this is done by your assigned worker on site.

---

### Photos & Files

All photos taken by the worker during your installation are available here.

- Photos are grouped by build stage and task
- Click any photo to view it full-screen
- Files (PDFs, specs, etc.) can be downloaded directly

---

### Delivery Tab

Shows your installation details:
- Full address
- Installation date and time window
- Your assigned worker's name and photo

**What to prepare before your installation day:**
- Ensure access to the installation area is clear
- Remove any garden furniture or obstacles from the area
- Ensure someone is home during the time window
- If you have gate codes or access instructions, add them in the **Access Notes** field (see below)

**Adding Access Notes:**
1. Click the **Delivery** tab
2. Find the Access Notes field
3. Type any important access instructions (gate codes, key location, dog in garden, etc.)
4. Click Save
5. Your worker will be notified immediately

---

### Payments Tab

This shows your full payment picture:

- **Contract Total** — the agreed price for your installation
- **Payment Schedule** — the milestones you need to pay (e.g., 50% deposit, final payment)
- **Amount Paid** — what has been received so far
- **Balance Due** — what remains outstanding

> ℹ️ If a payment you have made is not showing, contact BCF so they can record it in the system.

---

### Documents Tab

All documents related to your order are stored here:
- Your original quote
- Specification documents
- Invoices
- Terms & Conditions

Click any document to download or view it.

---

### Extras & Variations

**Extras:** Browse and request additional items for your climbing frame (e.g., extra swing, slide upgrade)

**Variations:** If you want to change something from the original order, submit a variation request here. BCF will review it and update the status (Approved / Not Approved) with a note.

---

### Refer a Friend

- Share your unique referral link with friends or family
- If they place an order, you will receive a reward
- Track the status of your referrals in this tab

---

### Notifications (Bell Icon)

The bell icon in the top corner shows your notifications:
- Build stage updates
- New photos uploaded
- Installation date confirmed or changed
- Messages from BCF

Click any notification to mark it as read. You can also click **Mark all read** to clear them all.

---

## Worker Guide

### First Login — Setting Your Password

1. BCF will give you a temporary password
2. Go to the Worker Panel login page
3. Enter your email and the temporary password
4. You will be prompted to set your own new password
5. Enter a new password (minimum 8 characters), confirm it, and click **Set Password & Log In**
6. You are now in your Worker Panel

---

### Worker Panel Overview

**On a phone (mobile view):**
- Bottom navigation bar with four tabs: **Jobs | Alerts | Profile | Sign Out**
- Start on the **Jobs** tab to see your assigned jobs

**On a computer (desktop view):**
- Sidebar on the left with your profile, jobs list, and sign-out button
- Main area on the right shows the selected job

---

### Viewing Your Jobs

**On mobile:**
1. Tap **Jobs** in the bottom nav
2. You will see a list of all jobs assigned to you
3. Each card shows: client name, order number, address, installation date, and status
4. Tap any card to open the job detail

**On desktop:**
1. Your jobs are listed in the left sidebar
2. Click on a job to open it in the main area

---

### Working Through a Job

Each job has two sections:

**Left — Build Stages**
This is where you record your progress.

**Right — Client Details**
This shows the client's name, address, product, notes, and any access notes they have left.

---

### Updating Build Stages

Build stages are the main steps of the installation (e.g., Order Confirmed, Groundwork, Frame Construction). You must complete them in order.

**To start a stage:**
1. Click on the stage row to expand it
2. Click the **Start** button to mark it as In Progress

**To add a task inside a stage:**
1. Click the **+ Task** button inside the expanded stage
2. Type the task label and press Enter
3. The task is now saved

**To complete a task:**
1. Tick the checkbox next to the task
2. A modal will appear — type a description of what was done (required)
3. Optionally attach photos or files
4. Click **✅ Mark Complete**

> ⚠️ The description you write is visible to the client — keep it professional and clear (e.g., "Groundwork dug to required depth and levelled").

**To mark a stage as Done:**
1. All tasks within the stage must be completed first
2. Once all tasks are ticked, the **✓ Done** button will become active
3. Click **✓ Done** and confirm
4. The stage will show as ✅ Complete

> ℹ️ Completing a stage automatically updates the pipeline in the admin system — you do not need to do anything else.

**To undo a stage (if you made a mistake):**
- Click the **Undo** button on a done stage
- You can only undo the most recently completed stage (to avoid data loss)

---

### Uploading Photos

Photos are attached to tasks when you complete them, but you can also add more photos by editing a completed task.

**To edit a completed task and add photos:**
1. Expand the stage
2. Click the **Edit** link next to the completed task
3. Add new photos or files in the file upload area
4. Click **💾 Save Changes**

**To view all photos for a job:**
- Click the **📂 View All by Stage & Task** button in the right column

---

### Client Details & Access Notes

The **Client Details** card on the right shows:
- Client name, email, phone, address
- Product being installed
- Internal notes from the BCF office
- **Access Notes** — instructions the client has added (gate codes, access requirements, etc.)

> ℹ️ If the client updates their access notes while you are logged in, you will receive a notification and the notes update in real-time.

**Birthday Booking alert:**
If the job shows a 🎂 **Birthday Booking** banner — remember to bring freebies/gifts for the installation. This has been flagged as a special occasion.

---

### Your Notifications

Tap the **Alerts** tab (mobile) or the bell icon (desktop) to see your notifications.

You will receive a notification when:
- You are assigned to a new job
- The installation date or time is updated
- The job is marked as a birthday booking
- The product order details are changed
- The office adds internal notes
- The client updates their access notes

Tap any notification to mark it as read.

---

### Updating Your Profile

**On mobile:** Tap **Profile** in the bottom nav
**On desktop:** Click your name/avatar card in the left sidebar

**Profile Photo:**
1. Click your avatar or the "📷 Change Photo" button
2. Select a photo from your device
3. The photo is saved automatically

**Display Name:**
1. Edit the name field
2. Click **💾 Save Name**

**Change Password:**
1. Enter your new password (minimum 8 characters)
2. Confirm the new password
3. Click **🔒 Update Password**

---

## Troubleshooting

### For All Users

---

**Problem: I cannot log in / my link doesn't work**
- Magic links expire after a short time. Request a new one from BCF admin.
- Make sure you are clicking the most recent link (only the latest link works).
- Check your spam/junk folder for the email.

**Problem: The page is blank or not loading**
- Refresh the page (Ctrl+R on Windows, Cmd+R on Mac).
- Clear your browser cache and try again.
- Try a different browser (Chrome or Safari recommended).
- Check your internet connection.

**Problem: I can't see my changes after saving**
- Refresh the page.
- If the problem persists, log out and log back in.

---

### For Admins

**Problem: The worker I assigned doesn't appear on the order**
1. Confirm the worker exists in the Users tab with the correct role (Worker).
2. Re-open the order and re-select the worker from the dropdown.
3. Check that the worker can log in and see their panel.

**Problem: Notifications are not being sent**
- Check that the `worker_notifications` table exists in the database (Supabase migrations must have been run).
- Check that the worker has an active account and is assigned to the order.

**Problem: The client's payment balance looks wrong**
- Check the Payments tab — ensure all received payments are recorded.
- Check that any amendments have been entered correctly (negative amounts reduce the total).
- The balance is calculated automatically — it is not manually set.

**Problem: A worker cannot see their job**
- Confirm the worker is assigned to the order in the Order Details tab.
- Have the worker log out and log back in to refresh their job list.

**Problem: A build stage won't mark as done**
- All tasks within the stage must be completed first.
- The worker must complete each task (tick it and add notes) before the "Done" button activates.
- If a task was added by mistake, the worker can contact admin to have it removed.

---

### For Clients

**Problem: I cannot see my build progress**
- Build stages are updated by your worker. If the progress shows 0%, the worker has not yet started or has not updated the system.
- Contact BCF if you believe work has started but the system has not been updated.

**Problem: I paid but the payment is not showing**
- Payments are manually recorded by BCF admin. Contact the office with your payment details (date, method, amount, reference) so they can record it.

**Problem: I cannot access my documents**
- Documents are uploaded by BCF admin. If you are expecting a document and it is not there, contact BCF.

**Problem: My login link does not work**
- Links expire. Reply to your email or contact BCF and ask for a fresh login link.

---

### For Workers

**Problem: I can't see my job**
- Confirm you are logged in with the correct email.
- Ask admin to verify the order has been assigned to you.
- Log out and log back in to refresh your jobs list.

**Problem: The "Done" button is greyed out**
- You have incomplete tasks. Complete all tasks in the stage first (tick each checkbox and add notes).
- Once all tasks are ticked, the button will become active.

**Problem: My photo upload failed**
- Check your internet connection.
- Try a smaller photo (very large files may time out).
- Make sure the file is an image (JPG, PNG, WEBP, HEIC) or a supported file type.

**Problem: I accidentally marked a stage as done**
- Click the **Undo** button on the stage immediately.
- Undo is only available on the most recently completed stage.
- If the Undo button is not available, contact BCF admin.

**Problem: My avatar or name isn't saving**
- Make sure your profile row exists in the system. If you are a newly added worker, ask admin to confirm your profile has been created.
- Try refreshing the page and saving again.

**Problem: I updated my password but now can't log in**
- Try your new password again — it sometimes takes a moment to update.
- If locked out, contact BCF admin who can reset your password from the Users tab.

---

## Checklists

### ✅ New Order Checklist (Admin)

Use this checklist every time a new order is created.

- [ ] Client profile exists in the Users tab (name, email, phone)
- [ ] Order has been created and linked to the client
- [ ] Installation address entered in Order Details
- [ ] Worker assigned to the order
- [ ] Installation date set
- [ ] Installation time window set
- [ ] Product Order field filled in (e.g., "Rathlin Climbing Frame")
- [ ] Birthday Booking toggled on if applicable
- [ ] Build stages are configured for the order
- [ ] Base contract amount entered in Payments tab
- [ ] Payment schedule (milestones) added
- [ ] Client login link generated and sent to client
- [ ] Any specification documents uploaded to Documents tab

---

### ✅ Payment Recording Checklist (Admin)

Use this when a payment is received.

- [ ] Open the order in the Orders tab
- [ ] Click the Payments tab
- [ ] Click Add Payment
- [ ] Enter: date received, method, amount, reference number
- [ ] Confirm the Balance Due has updated correctly
- [ ] If the payment is the final payment, confirm the order status is correct

---

### ✅ Pre-Installation Day Checklist (Admin)

- [ ] Worker is assigned and has confirmed the date
- [ ] Installation date and time window are correct in the system
- [ ] Client has been sent their login link and can access the portal
- [ ] Client has added access notes if required (gate code, dog, etc.)
- [ ] Any special requirements noted (birthday booking, site access photos uploaded)
- [ ] Worker has seen the job in their panel

---

### ✅ Worker On-Site Checklist

- [ ] Logged into Worker Panel and can see the job
- [ ] Checked Client Details card for access notes and special requirements
- [ ] Noted if Birthday Booking banner is showing (bring freebies)
- [ ] Mark the first stage as "In Progress" when work begins
- [ ] Complete tasks within each stage as work progresses
- [ ] Add a clear description when completing each task
- [ ] Upload photos at each completed stage
- [ ] Mark each stage as "Done" before moving to the next
- [ ] All stages marked Done when job is complete

---

### ✅ Post-Installation Checklist (Admin)

- [ ] All build stages show as ✅ Done
- [ ] All photos are uploaded and visible in the order
- [ ] Final payment has been recorded
- [ ] Balance Due shows £0 or correct amount
- [ ] Client portal shows 100% build progress
- [ ] Any outstanding documents uploaded to Documents tab

---

## Data & Integration Rules

### Core Rules — What Must Always Be Linked

These rules ensure the system works correctly and nothing falls through the gaps.

---

#### 1. Every Order Must Have a Worker Assigned Before Work Starts

**Why:** If no worker is assigned, the worker will not see the job in their panel. No stages will be updated. The client portal will show no worker name.

**How to check:** Open the order → Order Details tab → "Assign Worker" field must not be empty.

---

#### 2. Every Order Must Have Build Stages

**Why:** Without stages, there is nothing for the worker to update. The build progress will stay at 0% for the client.

**How to check:** Open the order → Build Progress tab → stages must be listed. If empty, stages need to be added in the database or contact technical support.

---

#### 3. Payment Records Must Be Entered as They Arrive

**Why:** The system calculates balance due and payment percentage automatically. If a payment is not recorded, the client portal will show incorrect payment status and the balance due will be wrong.

**Rule:** Record every payment within 24 hours of receiving it.

---

#### 4. Installation Date Must Be Set Before Notifying the Client

**Why:** Setting the installation date automatically triggers a notification to both the client and the worker. If you set it before you are ready to communicate, they will be notified prematurely.

**Rule:** Only set the installation date in the system when it is confirmed with the client.

---

#### 5. Worker Notifications Are Triggered by Admin Actions

The following admin actions automatically notify the assigned worker:

| Admin Action | Worker Notification |
|-------------|-------------------|
| Assign worker to order | "🔨 New Job Assigned" |
| Set/change installation date | "📅 Installation Date Set" |
| Set/change time window | "🕐 Time Window Updated" |
| Toggle Birthday Booking on | "🎂 Birthday Booking!" |
| Update Product Order field | "📦 Product Order Updated" |
| Update Notes field | "📝 Job Notes Updated" |

And this client action notifies the worker:

| Client Action | Worker Notification |
|-------------|-------------------|
| Client saves Access Notes | "📝 Access Notes Updated" |

> ⚠️ These notifications only fire if a worker is assigned. Always assign the worker before updating these fields if you want them to be notified.

---

#### 6. Task Notes Written by Workers Are Visible to Clients

When a worker completes a task, they must write a description of what was done. This description is displayed to the client in their Build Progress tab.

**Rule:** Workers must write professional, client-appropriate notes. Do not use internal shorthand or abbreviations.

**Example of good notes:** "Foundation trench dug to 300mm depth and levelled. Weed membrane laid."
**Example of bad notes:** "Done dig. check tmrw"

---

#### 7. Photos Are Stored Against Tasks, Not Stages

When a worker uploads a photo, it is linked to the specific task they completed. This means:
- Photos will not appear in the gallery if the task has been deleted
- Always complete the task (with notes) before uploading photos
- If a task is accidentally deleted, its photos become "orphaned" and are filtered out of the gallery automatically

---

#### 8. Magic Links Are Single-Use and Time-Limited

- Client and worker magic links expire after a short time
- Each "Get Login Link" generates a new link — only the most recent one works
- If a client or worker says their link does not work, generate a new one

---

#### 9. GHL Pipeline Integration (Automatic)

When a worker marks a **build stage as Done**, the system automatically advances the opportunity in Go High Level (GHL) to the next pipeline stage.

- This happens in the background — the worker does not need to do anything in GHL
- If the GHL update fails, the stage is still marked Done in BCF — GHL is updated on a best-effort basis
- If GHL stages appear out of sync, check that `ghl_opportunity_id` is set on the order

---

#### 10. Storage: Avatars vs Order Photos

Two separate storage areas are used:

| Bucket | Used For | Access |
|--------|----------|--------|
| `avatars` | Worker profile photos | Public URLs |
| `order-photos` | Build site photos and files | Signed URLs (expire after 1 hour) |

**Rule:** Order photos are secure — links expire. Do not save or share signed photo URLs for long-term use. Always view photos through the portal, not via the URL directly.

---

### Data Flow Summary

```
Quote submitted by client
        ↓
Admin reviews and approves quote
        ↓
Order created + client and worker assigned
        ↓
Admin sets installation date → Client + Worker notified
        ↓
Worker marks stages In Progress → Client sees real-time progress
        ↓
Worker completes tasks → Notes + photos attached → GHL updated
        ↓
Worker marks all stages Done → 100% progress shown to client
        ↓
Admin records final payment → Balance Due = £0
        ↓
Order complete
```

---

*Last updated: May 2026 · Ballycastle Climbing Frames*
