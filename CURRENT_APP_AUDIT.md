# Current App Audit

Date: 2026-07-12

## Current Feature Coverage

### Guest
- QR/session validation is room scoped.
- Guests receive only menu/config plus their own room orders.
- Food ordering validates prices and availability on the server.
- Cart billing uses configured CGST, SGST, and service charge.
- Custom/off-menu requests are supported as zero-price kitchen requests.
- Active food order tracking shows only real active statuses.
- Cancel is allowed only while an order is `NEW`.
- Services are driven from active `Services` menu items.
- SOS creates an emergency request and triggers the KDS alert flow.
- Feedback is accepted only for delivered orders from the same session/room.

### Kitchen / KDS
- KDS has simplified modes: `Now`, `Done`, and `Stock`.
- The sidebar opens expanded by default for easier first-time use.
- Staff can accept, prepare, dispatch partial items, dispatch full orders, and mark delivered.
- Partial dispatch is now persisted by the backend and updates order status server-side.
- Dispatched/completed items can no longer be toggled back accidentally.
- Stock toggles use the out-of-stock endpoint and notify guests when an item becomes unavailable.
- SOS appears as a full-screen alert and can be cleared by staff.

### Admin
- Admin has dashboard, billing, dining orders, hospitality requests, menu, reports, and settings.
- Live order status changes now use targeted order API calls.
- Admin cancellation now uses the dedicated cancellation endpoint.
- Admin stock toggles now use the out-of-stock endpoint.
- Add Dish now includes kitchen/service station assignment.
- Menu cards show the assigned station so routing can be checked visually.
- Deleting a dish now requires confirmation.

### Backend
- Orders are validated against database menu items before insertion.
- Server recalculates subtotal, tax, service charge, and total.
- KOT splitting uses item `station_id`, with custom items routed to `indian`.
- Partial dispatch updates order items and master order status.
- Syscon posting is restricted to delivered billable food orders.
- Guest cancellation, feedback, and order state are session/room scoped.

## Remaining Recommendations

- Move `QR_SECRET` and staff PIN defaults to environment-backed production secrets.
- Replace mock Syscon calls in `lib/syscon.js` with the real PMS/HMS integration contract before launch.
- Consider soft-delete/archive for menu items instead of hard deletion, so historical reports remain easier to reason about.
- Add SLA/escalation metadata for service requests if housekeeping/laundry teams need separate operational queues.
- Run browser walkthrough testing on tablet-sized KDS screens and low-end mobile phones before deployment.

## Verification

- `node .\node_modules\eslint\bin\eslint.js .` passes.
- `node .\node_modules\vite\bin\vite.js build` passes.
