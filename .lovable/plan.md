

## Plan: Enable Payment Processing (Stripe + PayPal)

### Current State
Users select a plan and a "pending" request is created in `plan_requests`. Super admins manually approve. No actual payment processing exists.

### Approach

#### Phase 1: Enable Stripe (credit/debit card payments)
Lovable has a built-in Stripe integration. We will:
1. **Enable Stripe** via the Lovable Stripe tool — this sets up the Stripe secret key and exposes checkout/subscription tools
2. **Create Stripe products and prices** for the 3 plans (Small €49/mo, Pro €79/mo, Full €199/mo) plus yearly variants
3. **Add a checkout flow**: when user clicks "Inizia con [Plan]" on `PianiPricing.tsx` or `Landing.tsx`, redirect to Stripe Checkout for subscription
4. **Create a webhook edge function** to handle `checkout.session.completed` and `customer.subscription.updated` events — automatically activate the user's subscription in `user_subscriptions`
5. **Update `PianiPricing.tsx`** with a Stripe checkout button (authenticated users) and keep the registration link for unauthenticated users

#### Phase 2: Enable PayPal (when account is ready)
Since the PayPal account is not yet available (pending maintenance), we will:
1. **Prepare the architecture** — add a PayPal button placeholder alongside Stripe on the pricing cards
2. **When ready**: create an edge function for PayPal checkout using PayPal REST API, store the PayPal client ID/secret as Supabase secrets, and handle webhook events for subscription activation
3. Show both payment options side by side on the checkout step

#### UI Changes
- **Pricing cards** (`PianiPricing.tsx` + `Landing.tsx`): "Inizia con [Plan]" button opens a payment method selector (Stripe card / PayPal) for authenticated users, or redirects to registration for unauthenticated
- **Post-payment**: automatic subscription activation, no manual admin approval needed
- **`plan_requests` table**: kept as fallback for edge cases or manual overrides

#### Payment Icons
Add small Stripe/PayPal/credit card icons in a "Metodi di pagamento accettati" footer below the plans grid.

### Implementation Order
1. Enable Stripe via Lovable tool (requires Stripe secret key from user)
2. Create Stripe products/prices for 3 plans (monthly + yearly)
3. Build checkout edge function + webhook handler
4. Update pricing pages with Stripe checkout buttons
5. Add PayPal placeholder (disabled state with "Coming soon" tooltip)
6. When PayPal account is ready: add PayPal secret, build PayPal checkout edge function

### What We Need From You
- **Stripe**: We need to enable the Stripe integration first. Do you already have a Stripe account? I'll walk you through connecting it.
- **PayPal**: We'll add the placeholder now and activate it once your account is ready.

