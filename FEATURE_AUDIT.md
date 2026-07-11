# Feature Audit: QR Dine & Order

Audit date: 2026-07-11

Source reviewed:
- Feature plan from the pasted implementation brief
- Backend: `server.js`, `db.js`, `lib/syscon.js`
- Frontend: guest, pantry/kitchen, admin apps under `src/apps`
- Shared store/socket layer under `src/store` and `src/lib`
- Live SQLite database file: `database.db`

## Executive Summary

Most planned feature areas are present in some form. The project has moved from JSON storage to SQLite, has a guest ordering flow, pantry dashboard, feedback table, hospitality/SOS request flow, basic analytics, and a mock Syscon HMS integration.

However, several items are only partially wired. The biggest functional gaps are:

- The pantry KOT print UI does not use backend split KOT records, so station-separated slips are not reliably printed.
- The print CSS likely hides the KOT print stream, making KOT printing blank or incomplete.
- The frontend uses `ON_THE_WAY`, but the SQLite `orders.status` constraint does not allow it.
- Guest cancellation is exposed through an unauthenticated admin-style endpoint.
- The backend trusts guest-submitted item prices, totals, and availability.
- Guest-facing socket state currently includes all orders, not only the guest room's orders.
- Feedback, cancellation, and some admin settings flows need validation and persistence hardening.

The app builds successfully when Vite is invoked directly, but lint currently fails.

## Feature Status Matrix

| Planned Feature | Status | Notes |
| --- | --- | --- |
| SQLite database transition | Implemented with caveats | `database.db` exists with expected tables. Migration is not versioned and existing tables are not altered after schema changes. |
| Service stations and menu schema | Implemented | `service_stations`, `menu_items`, `room_bills`, `orders`, `kots`, `guest_feedback`, and `config` exist. |
| Single central KOT printer workflow | Partially implemented | Backend creates station-split KOT rows, but pantry UI ignores `order.kots` and print CSS is not set up for KOT printing. |
| Pantry-managed partial delivery | Partially implemented | Item status toggles exist and guest sees item-level status, but master order status sync has schema mismatch issues. |
| Post-delivery feedback | Partially implemented | Guest modal and database insert exist. Needs auth, duplicate prevention, rating validation, and reload-safe prompting. |
| AI recommendations | Basic placeholder | Guest UI has "Swiggy-style AI Pairings", but logic is a simple available-item slice, not real AI or contextual recommendation logic. |
| Custom/open items | Implemented with caveats | Guest can add custom free-price requests. Backend routes unknown/custom items to `indian`. Needs clearer pricing/approval handling. |
| Out-of-stock handling and swaps | Partially implemented | Kitchen can toggle stock and guests get alerts. There are no real swap recommendations, and backend does not reject unavailable items. |
| Guest order cancellation | Partially implemented, insecure | Guests can cancel `NEW` orders, but endpoint is unauthenticated and not session/room scoped. |
| Hospitality services | Implemented with caveats | Guest can request housekeeping/laundry; kitchen displays service requests. No dedicated SLA/status lifecycle yet. |
| SOS panic button | Implemented with caveats | Guest creates an emergency order and kitchen shows alarm overlay. Needs stronger acknowledgement/audit and should avoid billing sync. |
| Manager analytics dashboard | Partially implemented | Basic sales/category/top-dish/rating/suggestion views exist. Needs stronger data accuracy and filters. |
| Syscon HMS integration | Mock only | Room validation and folio posting are mocked. No real credentials/config/retry/transaction persistence. |

## Implemented Features

### SQLite and Schema

Implemented:
- `db.js` initializes SQLite through `sqlite3` and `sqlite`.
- Live `database.db` contains:
  - `service_stations`
  - `menu_items`
  - `room_bills`
  - `orders`
  - `kots`
  - `guest_feedback`
  - `config`
- Seed data exists for kitchen stations, hospitality stations, menu items, services, room bills, and config.
- `getFullState()` returns menu items, room bills, orders with parsed items, attached KOTs, feedback, stations, and config.

Issues:
- There is no schema version table or migration history.
- `CREATE TABLE IF NOT EXISTS` will not upgrade an existing table if columns/check constraints change.
- The live `orders.status` constraint allows only `NEW`, `PREPARING`, `DELIVERED`, and `CANCELLED`, while the UI also uses `ON_THE_WAY`.
- The migration renames `database.json` to a backup after migration. This is fine for a one-time migration, but should be documented and controlled.

### Guest App

Implemented:
- QR token validation through `/api/validate-token`.
- Guest menu browsing, search, category filters, veg-only filter, cart, special instructions, and order placement.
- Time-of-day special banner.
- Recommendation carousel.
- Custom/off-menu request modal.
- Hotel services tab.
- SOS tab.
- Order tracking screen.
- Cancellation button while order is `NEW`.
- Feedback modal after a known placed order becomes `DELIVERED`.
- Out-of-stock alert modal.

Issues:
- The recommendation carousel is not really AI. It returns the first four available non-service items not already in cart.
- The time-of-day special is hardcoded and can show/order an item even if that item is unavailable or removed from the database.
- Cart prices and order totals are calculated client-side and trusted by the backend.
- The backend does not verify that ordered menu items are still available.
- The out-of-stock alert does not remove unavailable cart items or recommend specific substitutes.
- Feedback is only auto-triggered if `lastOrderId` is still in memory. A page reload can lose the prompt.
- Guest receives sanitized state containing all orders, not just the room's orders.

### Pantry/Kitchen App

Implemented:
- PIN login for kitchen role.
- Active dining orders panel.
- Active hospitality requests panel.
- Item-level dispatch toggles for partial delivery.
- Out-of-stock manager using the correct stock endpoint.
- SOS full-screen alarm overlay with sound attempt.
- KOT print modal exists.

Issues:
- The pantry KOT display groups `order.items` by `item.category`, but submitted order items do not include `category`. This causes station grouping to collapse to a generic Kitchen group.
- The backend already attaches `order.kots`, but the pantry UI does not use them.
- The `markKOTReady()` function exists but is unused, so KOT status workflow is not exposed.
- The print CSS only makes `.print-section` visible during printing. The KOT modal uses `.kot-print-stream`, so `window.print()` will likely hide the KOT content.
- Partial dispatch sets local status to `ON_THE_WAY` when all items are dispatched, but SQLite does not allow that status.
- Service and SOS completion reuse the generic order update flow, which can trigger Syscon posting even for zero-value service/emergency records.

### Admin App

Implemented:
- PIN login for admin role.
- Dashboard KPIs.
- Billing/POS view and invoice print modal.
- Live order board.
- Menu editor with add/delete/toggle availability and image upload.
- Reports with sales trend, category sales, top dish, average ratings, feedback suggestions, and Syscon post audit.
- Settings screen for PINs and tax fields.

Issues:
- Live order board also uses `ON_THE_WAY`, which does not match the database constraint.
- Admin cancellation uses local `setOrders()` and syncs all orders, not the dedicated cancel endpoint.
- Admin stock toggles use `setMenuItems()` rather than the out-of-stock endpoint, so guests may not receive out-of-stock alert events from admin changes.
- New menu items do not expose a station selector. Without `station_id`, new items default to `indian`.
- Settings are structurally mismatched: the backend expects `adminPin`, `kitchenPin`, `cgst`, `sgst`, and `serviceCharge`, while the UI edits `taxRates.roomTax` and `taxRates.serviceTax`.
- `setConfig({ adminPin: value })` replaces local config instead of merging it, then syncs incomplete config to the backend.
- Room bill service charges are not persisted in the SQLite `room_bills` table. `getFullState()` always returns `roomServiceCharges: []`.

### Syscon HMS Module

Implemented:
- `lib/syscon.js` provides a mock `validateGuestRoom(room)` and `postFolioCharge(order)`.
- QR validation calls Syscon mock and upserts local `room_bills`.
- Delivered orders are posted to Syscon mock from `/api/admin/orders`.
- Admin report shows `syscon_posted` state.

Issues:
- This is not a real Syscon integration yet.
- Credentials, endpoints, hotel ID, and environment configuration are absent.
- Posting result stores only `syscon_posted`, not transaction ID, posted timestamp, error details, or retry count.
- Failed posts have no retry endpoint or background job.
- Posting is triggered for any delivered order type, not just billable food/service records.

## High-Priority Fixes

1. Align order statuses.
   - Either add `ON_THE_WAY` to the SQLite `orders.status` check constraint through a real migration, or remove `ON_THE_WAY` from the UI and use item-level `DISPATCHED` plus master `PREPARING/DELIVERED`.

2. Fix KOT printing to use backend KOTs.
   - Render `order.kots` in the pantry card.
   - Show station name from `service_stations`.
   - Print each `kot.items` group sequentially with dashed separators.
   - Add a print-only `.print-section` wrapper or update print CSS for `.kot-print-stream`.
   - Expose `PENDING`, `PRINTED`, and `READY` KOT status controls if needed.

3. Secure guest cancellation.
   - Replace `/api/admin/orders/:id/cancel` guest usage with a guest endpoint requiring `sessionId`.
   - Verify that the order belongs to the session room.
   - Keep staff/admin cancellation protected by staff auth.

4. Validate orders server-side.
   - Recalculate subtotal, tax, service charge, and total from database prices.
   - Reject unavailable menu items.
   - Treat custom/open items as approval-required or explicitly zero-price.
   - Do not trust client-submitted prices/totals.

5. Restrict guest socket state.
   - Guests should receive only menu/config and their own active/history orders.
   - Admin/kitchen can continue receiving full state after auth.

6. Fix feedback integrity.
   - Require a valid delivered order and matching room/session.
   - Enforce rating ranges from 1 to 5.
   - Prevent duplicate feedback for the same order.
   - Persist a feedback prompt state so reloads do not lose it.

7. Fix admin settings persistence.
   - Make frontend config shape match backend config.
   - Merge config updates in the store.
   - Add validation for PIN and tax/service-charge numeric fields.

8. Add real migration handling.
   - Add a `schema_migrations` table.
   - Add explicit ALTER/rebuild migrations for status constraints, new columns, and future schema changes.

## Medium-Priority Improvements

- Add station selector to admin menu editor.
- Ensure admin availability toggles trigger guest out-of-stock alerts.
- Add substitute recommendations by category, cuisine/station, veg flag, and price band.
- Add guest cart cleanup when a selected item becomes unavailable.
- Add KOT and order audit timestamps: accepted, printed, ready, dispatched, delivered, cancelled.
- Add cancellation reason and refund/void semantics.
- Add service request statuses such as `NEW`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`.
- Separate emergency incidents from billable orders.
- Add Syscon retry queue and transaction log.
- Add analytics filters by date range, room, category, station, service type, and order status.
- Add prep-time metrics from real timestamps instead of placeholder copy.
- Replace hardcoded QR secret with an environment variable.
- Add session expiry cleanup based on `lastActivity`.
- Add server-side error handling around async routes.

## Verification Notes

Build:
- `cmd /c npm run build` failed because the project path contains `&`, which breaks the npm/cmd launcher in this workspace.
- `npm run build` through PowerShell failed due local script execution policy for `npm.ps1`.
- Direct Vite build succeeded with:
  - `node .\node_modules\vite\bin\vite.js build`

Lint:
- `node .\node_modules\eslint\bin\eslint.js .` failed with 52 errors and 5 warnings.
- Main categories:
  - Unused imports and variables across React components.
  - ESLint config does not define Node globals such as `process` and `Buffer` for `server.js`.
  - React hook lint warnings/errors around synchronous `setState` in effects.
  - Empty catch/block in kitchen SOS audio flow.

Live database:
- The live database contains the expected new tables.
- Current counts observed:
  - `service_stations`: 8
  - `menu_items`: 11
  - `orders`: 1
  - `kots`: 5
  - `guest_feedback`: 0
  - `room_bills`: 4
- The sample active order has five split KOT rows in SQLite, confirming backend KOT creation works even though the current pantry UI does not render those KOT rows.

## Suggested Next Work Order

1. Fix the status model and KOT print path first, because those affect the core pantry workflow.
2. Add server-side order validation and guest state scoping before any real pilot.
3. Fix feedback/cancellation authentication and validation.
4. Repair admin settings and station assignment.
5. Add Syscon retry/transaction logging and real integration configuration.
6. Clean lint errors after functional fixes, then add focused tests for order placement, KOT splitting, cancellation, feedback, stock toggles, and Syscon posting.
