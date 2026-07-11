# UX Feasibility Audit: Guest, KDS, Admin

Audit date: 2026-07-11

Goal: check whether the current flows are feasible and low-friction for hotel guests, pantry/KDS staff, and managers, especially where users may not be technically confident.

## Current Build Status

- Production build passes with `node .\node_modules\vite\bin\vite.js build`.
- Lint still fails. Most issues are cleanup/config problems: unused imports, missing Node globals in ESLint, and React hook lint rules. These do not block the current build, but should be cleaned before handoff.

## Fixes Applied During This Pass

- Custom/off-menu items now work server-side. Previously `custom-*` ids could be treated like missing menu item ids and rejected.
- Custom item instructions are preserved into the order item name sent to KDS.
- Guest bill display now uses configured `cgst`, `sgst`, and `serviceCharge` values instead of hardcoded 5% tax and 10% service charge.
- KOT print modal now falls back to grouped order items when older/test orders do not have `order.kots`.
- Feedback submission now requires the matching order to be `DELIVERED`.

## Guest UX

### What Works

- Guest journey is understandable: scan QR, browse menu, add items, checkout, track order.
- Bottom navigation is simple: Dining, Services, SOS, Track.
- Cart and tracking are easy to find.
- Server now protects important trust points: room session, item availability, price/tax recalculation, cancellation ownership, and feedback ownership.

### Friction / Risk

- The first dining screen is busy: meal special, recommendations, custom request, category chips, full menu, search, veg filter, cart, and bottom nav all compete for attention.
- The recommendation block says "Swiggy-style AI Pairings", but it is not actually AI. This can create expectation mismatch.
- The meal special is hardcoded by item id. If that item is unavailable or deleted, the guest can still see a stale special.
- The SOS button is one-tap and very large. Good for emergencies, but risky for accidental taps unless staff are prepared for false alarms.
- Guest services are hardcoded cards instead of being driven from the service catalog in `menu_items`.
- Order tracking item labels are simple, but "Cooking / Ready / On Way" may not map perfectly to partial-dispatch operations.

### Suggestions Before String Changes

1. Make the guest home screen less busy.
   - Keep search, categories, menu, and cart.
   - Move recommendations below menu or only show them in cart as add-ons.
   - Keep custom request as a smaller cart/menu action, not a major card.

2. Use real menu data for specials.
   - Resolve the special item from `menuItems`.
   - Hide the special if unavailable.
   - Avoid letting a hardcoded stale item open the item modal.

3. Add an SOS confirmation or long-press.
   - Recommended: press opens a confirmation panel, second button sends alert.
   - Alternative: long-press for 2 seconds to trigger.

4. Drive services from the database catalog.
   - Render available service-category `menu_items`.
   - This avoids hardcoded laundry/cleaning options and keeps admin control centralized.

## KDS / Pantry UX

### What Works

- The KDS is visually cleaner than before.
- Big order cards with token, room, item list, status color, and one main action are a good direction.
- Item tapping for `PENDING -> DONE -> DISPATCHED` is useful for partial delivery.
- The KOT print stream now uses backend KOTs and has a fallback.
- Stock toggle is accessible from KDS menu mode.

### Friction / Risk

- KDS still has too many concepts for non-technical staff:
  - `Open / In Progress`
  - `Ready / Completed`
  - `Menu Editor`
  - `AS READY`
  - `ALL AT ONCE`
  - `ON_THE_WAY`
  - item statuses: `Pending`, `Done`, `Dispatched`
- The staff member must understand when to tap an item versus when to press the footer action. This is easy to teach, but not frictionless in a rush.
- The "Ready / Completed" tab mixes ready orders and delivered/completed orders. A completed history can distract the operator from what needs action now.
- Menu editing inside KDS can be dangerous. Pantry staff likely need stock toggles, not full menu editing.
- The KDS print button is small relative to its operational importance.
- Service requests and dining orders share the same KDS surface. This is useful for a single pantry desk, but can overload kitchen staff if housekeeping is handled elsewhere.
- SOS clear action marks emergency as `DELIVERED`, which is semantically wrong. Emergency incident resolution should be separate from food/service delivery.

### Suggested Simplified KDS Model

For pantry/KDS users, reduce to three modes:

1. **Now**
   - Shows only orders needing action: `NEW`, `PREPARING`, `ON_THE_WAY`.
   - Default screen after login.
   - No completed orders here.

2. **Stock**
   - Only availability toggles.
   - No add/edit/delete menu actions.

3. **Done**
   - Completed history for the shift.
   - Optional and visually quieter.

For each ticket, use one primary action at a time:

- New order: Accept
- In preparation: Mark item done, then Dispatch
- Dispatched: Delivered

Avoid asking staff to understand system states. Show the next physical action they need to perform.

## Admin UX

### What Works

- Admin now has separate sections for dashboard, billing, dining orders, hospitality requests, menu, reports, and settings.
- Separating dining orders from hospitality requests is a good operational improvement.
- Reports include useful manager-level signals: sales, ratings, suggestions, Syscon posting status.
- Settings now align better with backend config: `cgst`, `sgst`, and `serviceCharge`.

### Friction / Risk

- Admin is still very dense. It is better for managers than line staff.
- Admin order board duplicates some KDS behavior. This is acceptable for oversight, but managers could accidentally operate live orders.
- Menu editor still lacks station assignment when adding items. New items can default to `indian`, causing wrong KOT routing.
- Admin stock toggles still appear to sync through full menu save in parts of the UI. KDS stock toggle uses the out-of-stock endpoint, which is better because it alerts guests.
- Billing service charges are derived from delivered food orders in `getFullState()`. That avoids earlier empty bills, but it is still not a true ledger table.
- Syscon integration is still mock-only. The UI can show posting statuses, but real retry/audit behavior is not production-ready.

### Suggestions Before String Changes

1. Limit Admin live-order actions.
   - Keep status changes in KDS.
   - Admin should mostly monitor, cancel/refund with confirmation, and view history.

2. Add station assignment to menu creation/editing.
   - Required for reliable KOT routing.
   - Defaulting all unknown items to Indian Kitchen is risky.

3. Use the same availability endpoint everywhere.
   - Admin and KDS stock toggles should both call `/api/admin/menu_items/out-of-stock`.
   - This keeps guest alerts consistent.

4. Create a real billing ledger table.
   - Do not derive folio service charges only from delivered orders.
   - Store posted charge id, Syscon transaction id, retry count, and posting error.

## Remaining Correctness Issues

- Lint fails with 48 errors and 6 warnings after this pass.
- `getSanitizedState` in `server.js` is unused.
- ESLint does not know Node globals like `process` and `Buffer`.
- Many React files import `React` unnecessarily for the current JSX transform.
- KDS `setOrders()` still syncs full order arrays after some local optimistic updates, which is heavier than necessary.
- Admin cancellation uses broad state sync rather than always using the dedicated cancellation endpoint.
- Server async routes do not have centralized error handling.
- Sessions use `lastActivity`, but no cleanup interval exists.
- QR secret is hardcoded.
- SOS is modeled as an order and completed as `DELIVERED`; it should eventually be an incident record.

## Recommended Next Implementation Order

1. Simplify KDS into `Now`, `Stock`, and `Done`.
2. Move full menu editing out of KDS; keep only stock toggles there.
3. Add a confirmation or long-press to SOS.
4. Make guest specials/services database-driven.
5. Add station assignment in Admin menu editor.
6. Replace broad optimistic full-array syncs with targeted endpoints.
7. Clean lint and ESLint config.
8. Add a real ledger/Syscon posting table.

## Bottom Line

The system is now much closer functionally: core ordering, split KOTs, scoped guest state, secure cancellation, server-side price validation, feedback validation, and KDS dispatch are present.

For actual hotel staff, the largest remaining UX problem is cognitive load in the KDS. The most important simplification is to make the KDS action-oriented instead of state-oriented: staff should see "Accept", "Dispatch", and "Delivered", not need to reason about internal status names.
