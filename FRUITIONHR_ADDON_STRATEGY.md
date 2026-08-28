# FruitionHR Add-on Product and Monetization Strategy

**Prepared:** 27 August 2026  
**Status:** Product recommendation  
**Scope:** Add-on opportunities for an all-inclusive, employee-priced HR platform

## Executive summary

FruitionHR currently gives an actively subscribed tenant access to every module permitted by the user's role. Plan feature lists are descriptive marketing content rather than enforced module entitlements.

This is a strong commercial foundation. FruitionHR should keep its core HR platform bundled and introduce add-ons only where the customer receives a clearly separate product or service, or where FruitionHR incurs ongoing costs.

The recommended first opportunities are:

1. Payroll Concierge and Statutory Filing
2. Employee Identity and Background Verification
3. Fruition Work Insights
4. Compliance Academy
5. Attendance Pro and Field Workforce Management

The best immediate revenue opportunity is **Payroll Concierge and Statutory Filing**. The best partner-led add-on is **Employee Verification**. The strongest major new software product is **Fruition Work Insights**, positioned as transparent workforce analytics rather than surveillance.

Hosted add-ons should be billed monthly, annually, or by usage. Lifetime pricing should be limited to implementation work, static content, custom configuration, connector licences, or hardware because cloud hosting, security, support, compliance updates, storage, messaging, and third-party APIs create continuing costs.

## Current FruitionHR position

The current billing implementation supports employee-priced monthly and yearly plans, but it does not enforce module-level plan access:

- Seeded plans contain different feature descriptions, but the descriptions are serialized for display rather than used as authorization keys.
- All product modules share the same subscribed route group.
- Subscription middleware checks overall subscription usability, not individual product entitlements.
- User permissions determine which modules a user can access.
- The current payment workflow renews a base subscription and cannot fulfil a separate add-on purchase.
- The subscription pill displays the tenant's overall subscription state only.

Relevant implementation files:

- `fruitionhr-api/database/seeders/PlanSeeder.php`
- `fruitionhr-api/app/Modules/Billing/Resources/PlanResource.php`
- `fruitionhr-api/app/Support/Http/EnsureActiveSubscription.php`
- `fruitionhr-api/app/Modules/Billing/Services/PaymentService.php`
- `fruitionhr-web/src/features/billing/subscription-pill.tsx`
- `fruitionhr-web/src/app/(marketing)/pricing/page.tsx`

### Product principle

Do not remove features that paying tenants already receive. Build net-new add-ons around:

- Operational services
- Specialized content
- External data and verification
- Premium infrastructure
- Hardware and device integrations
- Usage-based communication or AI
- Risk transfer and compliance support

Existing customers should be grandfathered if an already available capability later becomes part of a paid package.

## Recommended add-on catalogue

| Priority | Add-on | Customer value | Recommended billing |
|---:|---|---|---|
| 1 | **Payroll Concierge and Statutory Filing** | Payroll review, filing packs, remittance support, compliance calendar and response-time SLA | Monthly minimum plus per employee or per filing |
| 2 | **Employee Identity and Background Verification** | NIN/BVN, education, employment, address, guarantor and reference checks | Prepaid credits or price per completed check |
| 3 | **Fruition Work Insights** | Transparent work patterns, time utilization, schedule adherence, project time and capacity trends | Per monitored employee per month |
| 4 | **Compliance Academy** | Nigerian workplace safety, data protection, anti-harassment, leadership and sector-specific courses | Per active learner per month or annual course subscription |
| 5 | **Attendance Pro** | GPS/geofencing, verified devices, field visits, offline clocking, advanced rosters and biometric integrations | Per field employee/site plus hardware where applicable |
| 6 | **Document Automation and E-signatures** | Contracts, offer letters, warnings, promotions, merge fields, approvals, signatures and expiry tracking | Monthly allowance plus usage |
| 7 | **Recruitment Plus** | Assessments, job-board distribution, CV matching, video interviews, background checks and candidate messaging | Monthly platform fee plus usage credits |
| 8 | **Analytics and HR Copilot** | Custom reports, scheduled board packs, labour forecasting, payroll variance explanations and policy assistance | Flat company fee plus AI usage allowance |
| 9 | **API, SSO and Integration Hub** | Accounting, banking, ERP, Power BI, webhooks, SSO and biometric-terminal integrations | One-time setup plus monthly maintenance |
| 10 | **Benefits and Employee Financial Services** | HMO, insurance, earned-wage access, wallets, loans and employee purchases | Partner commission, revenue share or transaction fee |
| 11 | **Assets and Exit Management** | Procurement, asset assignment, maintenance, recovery, clearance and final settlement | Flat company fee or per active employee |
| 12 | **WhatsApp and SMS Pack** | Payslip notices, leave decisions, clock reminders, approvals and announcements | Monthly allowance plus usage credits |
| 13 | **Premium HR and Compliance Desk** | Policy templates, disciplinary guidance, labour-law alerts and expert support | Flat company fee plus employee-based minimum |
| 14 | **Visitor and Workplace Access** | QR registration, badges, host alerts and visitor audit history | Flat monthly fee plus kiosk or badge hardware |

## Recommended commercial structure

FruitionHR should support four billing models rather than forcing every add-on into employee-based pricing.

### 1. Per active employee or seat

Best for:

- Work Insights
- Attendance Pro
- Compliance Academy
- Advanced workforce analytics

Only count employees actively using the add-on. For example, Work Insights should charge for monitored employees rather than every employee stored in FruitionHR.

### 2. Flat monthly company fee

Best for:

- Premium support
- White labelling
- Visitor management
- API access
- Statutory filing administration

A minimum monthly charge protects FruitionHR from servicing a small company for an uneconomical amount.

### 3. Usage-based credits

Best for:

- NIN/BVN and background checks
- SMS and WhatsApp messages
- E-signatures
- AI processing
- Candidate assessments
- Payment and payout transactions

Credits should have transparent unit prices and usage history.

### 4. One-time purchases

Best for:

- Data migration
- Payroll implementation and configuration
- Administrator training
- Custom workflows and reports
- Branded document/template packs
- Custom integrations
- Biometric or kiosk hardware
- On-premises deployment services

One-time purchase should not mean unlimited lifetime cloud service. Where continuing updates or support are required, offer an optional or mandatory annual maintenance agreement.

## Fruition Work Insights

### Positioning

Use the name **Fruition Work Insights** rather than “Employee Monitoring Software.” Position the product around transparency, capacity planning, accurate time records, workload balance, project costing, and employee self-awareness.

The product should help answer questions such as:

- Are teams overloaded or underutilized?
- Are working schedules realistic?
- Which projects consume the most time?
- Where do interruptions and excessive meetings occur?
- Are overtime and burnout risks increasing?
- Is billed client time supported by reliable work records?

### Privacy-first minimum viable product

The first release should include:

- Employee-started work sessions
- Active and idle time
- Application and website category totals
- Work schedule and schedule-adherence reporting
- Project and task time
- Labour-cost and capacity trends
- Team-level summaries by default
- Employee access to their own records
- A visible tracking indicator
- Pause and private modes
- Work-hours-only monitoring
- Company-owned-device monitoring by default
- Configurable data-retention periods
- Role-based access to named employee details
- An audit trail for every manager view and export
- Correction and dispute workflows
- GPS collection only while a field employee is clocked in

### Optional premium controls

These capabilities should be sold separately and enabled only after explicit company configuration:

- Blurred or redacted screenshots
- Longer data retention
- Investigation and anomaly alerts
- Raw URL access
- API or data-warehouse export
- Advanced security controls
- SSO and enterprise audit exports

### Capabilities to avoid

Do not introduce the following in the initial product:

- Keystroke content or password capture
- Clipboard contents
- Webcam or microphone recording
- Reading emails, chats or form contents
- Hidden monitoring on personal devices
- Continuous screen video
- Public productivity leaderboards
- Arbitrary productivity scores without context
- Automatic discipline, dismissal or performance sanctions

Monitoring results should provide evidence for human review, never become an automatic disciplinary decision.

### Indicative packaging

The following is a testing hypothesis and should be validated with prospective customers:

- **Insights Lite:** approximately US$2–$4 equivalent per monitored employee/month
- **Insights Pro:** Lite plus advanced analytics and optional premium controls
- Minimum purchase: 10 monitored employees
- Trial: 14 days with a clearly defined pilot group
- Annual payment discount: 10–15%
- One-time implementation: endpoint deployment, privacy configuration, employee communication and manager training

Leading workforce-analytics products use recurring per-worker pricing because endpoint agents, data retention, security, support and compliance create ongoing costs. ActivTrak, for example, separately monetizes workforce analytics, screen details, API/BI connectivity and extended retention.

## Privacy and employee trust

Employee information is protected personal data. A company deploying Work Insights should have a documented purpose and lawful basis, inform employees clearly, collect only necessary information, limit retention, secure the data and provide a process for employees to view or challenge records.

Recommended product safeguards include:

- A deployment checklist requiring the tenant to document purpose and lawful basis
- Employee privacy-notice templates
- Data-protection impact and legitimate-interest assessment templates
- Country-specific retention controls
- Data export, correction and deletion workflows
- Subprocessor and cross-border transfer disclosures
- A data-processing agreement
- Strict role-based access
- Encryption in transit and at rest
- Incident-response procedures
- An employee appeal and human-review workflow

The customer company will generally act as the data controller and FruitionHR as its processor. Exact responsibilities and lawful-basis decisions should be reviewed by qualified legal or data-protection professionals for each country of operation.

## Recommended launch sequence

### Phase 1: Revenue foundation — 0 to 2 months

- Introduce the add-on catalogue and entitlement architecture.
- Launch Payroll Concierge and Statutory Filing as a managed service.
- Integrate a verification partner and sell prepaid checks.
- Sell implementation, migration, training and template packs.
- Update the pricing-page promise that currently says there are no per-module add-ons.

### Phase 2: Software add-ons — 2 to 5 months

- Launch Compliance Academy.
- Add document automation and e-signature credits.
- Introduce WhatsApp/SMS usage packs.
- Launch Analytics and Integration packages.
- Expand Attendance Pro for field and physical workforces.

### Phase 3: Work Insights pilot — 4 to 8 months

- Interview 5–10 design-partner companies.
- Select agencies, BPOs, remote teams or field-service businesses with a clear need.
- Build the privacy-first desktop/mobile data collector.
- Run a 14-day pilot with voluntary, clearly informed participants.
- Measure adoption, correction requests, manager usage, employee sentiment and renewal intent.
- Add screenshots or security-oriented controls only if customer demand justifies the additional risk.

### Phase 4: Marketplace expansion — 6 to 12 months

- Add benefits, HMO, earned-wage and employee-finance partners.
- Add job boards, assessments and additional verification providers.
- Add accounting, ERP, banking and biometric integrations.
- Package related products into Compliance, Workforce, Growth and Enterprise bundles.

## Suggested bundles

### Compliance Pack

- Payroll Concierge
- Statutory filing support
- Employee verification credits
- HR policy templates
- Compliance course library

### Workforce Pack

- Fruition Work Insights
- Attendance Pro
- Field-workforce controls
- Advanced workforce analytics

### Growth Pack

- Recruitment Plus
- Candidate assessments
- Background checks
- Candidate communication credits

### Enterprise Pack

- API and webhooks
- SSO
- White label and custom domain
- Advanced audit exports
- Priority support

## Billing and entitlement changes required

FruitionHR needs a proper add-on entitlement layer before automated sales begin.

### Suggested data model

#### `addons`

- `id`
- `slug`
- `name`
- `description`
- `billing_model`
- `unit_name`
- `monthly_price`
- `annual_price`
- `one_time_price`
- `minimum_quantity`
- `is_active`
- `configuration_schema`

Suggested `billing_model` values:

- `flat`
- `per_employee`
- `per_active_seat`
- `per_device`
- `usage`
- `one_time`
- `revenue_share`

#### `tenant_addon_entitlements`

- `tenant_id`
- `addon_id`
- `status`
- `quantity`
- `starts_at`
- `ends_at`
- `trial_ends_at`
- `configuration`
- `purchased_price`
- `billing_interval`

#### `orders`, `invoices` and `invoice_items`

The current payment flow is tied to base subscription renewal. Generalize it so a payment can fulfil:

- Base-plan renewal
- Recurring add-on subscription
- Add-on usage credits
- One-time implementation or hardware purchase
- A combined invoice containing multiple line items

### Authorization model

Company entitlement and user permission must remain separate checks:

1. Does the tenant own an active entitlement to the product?
2. Does the signed-in user have permission to use that product?

Introduce a server-side `EntitlementService` and middleware. Frontend navigation may use returned entitlement slugs for presentation, but the backend must remain the enforcement authority.

Do not use tenant settings as proof of purchase. Settings should store add-on configuration only.

### Billing interface

Keep the existing subscription pill focused on the base subscription. Add a separate **Add-ons** section to the billing page showing:

- Available add-ons
- Price and billing unit
- Active quantity or seat count
- Trial status
- Renewal date
- Usage balance
- Included capabilities
- Required dependencies
- Data permissions
- Provider and support contact
- Upgrade, cancel and configure actions

## Success metrics

Track the following for each add-on:

- Add-on attachment rate
- Trial-to-paid conversion
- Monthly recurring revenue
- Average revenue per tenant
- Gross margin after partner/API costs
- Active seats versus purchased seats
- Monthly usage and feature adoption
- Add-on churn and cancellation reason
- Support cost per tenant
- Expansion revenue
- Customer and employee satisfaction

For Work Insights, also track:

- Percentage of monitored employees using self-view
- Correction and dispute frequency
- Manager report usage
- Data-retention footprint
- Privacy complaints
- Employee sentiment before and after deployment
- Whether the product improves planning outcomes rather than merely collecting more data

## Final recommendation

Maintain FruitionHR's core promise: one employee-based price for the complete core HR system. Monetize distinct operational services, external checks, premium content, advanced infrastructure, usage and new specialist products.

Launch in this order:

1. **Payroll Concierge and Statutory Filing** for immediate recurring revenue
2. **Employee Verification** as the quickest partner-based add-on
3. **Compliance Academy** as the lowest-risk software add-on
4. **Fruition Work Insights** as the strategic, higher-effort product

This approach creates new revenue without making existing customers feel that functionality they already paid for has been taken away.

## Reference sources

- [ActivTrak pricing](https://www.activtrak.com/pricing/)
- [BambooHR pricing](https://www.bamboohr.com/pricing/)
- [Workpay pricing](https://www.myworkpay.com/pricing)
- [PRISM Africa pricing](https://prism.africa/pricing)
- [Checkr pricing](https://checkr.com/pricing)
- [Gusto pricing](https://gusto.com/product/pricing)
- [Hubstaff pricing](https://hubstaff.com/pricing)
- [Nigeria Data Protection Commission FAQs](https://ndpc.gov.ng/faqs/)
- [Nigeria Data Protection Act 2023](https://ndpc.gov.ng/download/nigeria-data-protection-act-2023)
- [ICO guidance on monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/data-protection-and-monitoring-workers/)

