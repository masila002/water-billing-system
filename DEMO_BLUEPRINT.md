# MajiBill Demo Blueprint

## 1. Objective
This document defines a simple demo version of the MajiBill water billing platform. The goal is to showcase the core business flow of a utility company: onboarding a customer, creating a billing account, reading a meter, generating a bill, receiving a payment, and viewing a summary dashboard.

The demo is intentionally simplified and does not include the full multitenant architecture, production-grade audit systems, or all payment integrations described in the project brief. It focuses on demonstrating the essential user experience and business logic.

## 2. Demo Goal
The demo should help stakeholders understand:
- how utilities manage customers and connections
- how meter readings are captured and billed
- how payments are recorded and reconciled
- how tenant-specific operational dashboards work
- how a simple billing system can be extended into a larger, multitenant platform

## 3. Demo Scope
The demo will include the following modules:

### 3.1 Customer and Connection Management
- Add a customer
- Add a customer account
- Assign a meter or connection
- View customer profile
- View account status

### 3.2 Meter Reading and Billing
- Capture meter reading
- Compute consumed units
- Apply tariff rate
- Generate a bill
- Show outstanding balance

### 3.3 Payment Processing
- Record payment via M-Pesa, cash, or manual payment
- Show payment status
- Update account balance
- Display payment history

### 3.4 Dashboard and Reporting
- Total customers
- Active accounts
- Total billed amount
- Total collected amount
- Recent transactions
- Payment status summary

### 3.5 Admin and Security
- User login
- Role-based access (admin, cashier, accountant, reader)
- Basic permission checks
- Audit entry for important actions

## 4. User Roles

### Admin
- Manage users
- Configure tariffs
- View reports
- Manage customer accounts

### Cashier
- Record payments
- Reconcile transactions
- View payment records

### Meter Reader
- Enter meter readings
- Submit readings for billing

### Accountant / Finance
- Review outstanding balances
- Verify payments and bill adjustments
- View financial reports

## 5. Core Demo Flow

### Flow A: Customer onboarding
1. Admin logs in.
2. Admin creates a new customer.
3. Admin creates a service connection.
4. Customer is linked to a meter or account number.
5. Customer is marked active.

### Flow B: Meter reading and billing
1. Meter reader enters the latest reading.
2. System calculates consumption against previous reading.
3. System applies tariff rules.
4. Bill is generated for the customer.
5. Bill is shown on the dashboard and customer portal.

### Flow C: Payment
1. Customer pays the bill via M-Pesa or cash.
2. Payment is recorded.
3. System updates the outstanding balance.
4. Payment appears in transaction history.

### Flow D: Reporting
1. Admin opens the dashboard.
2. Summary KPIs are displayed.
3. Recent payments and customer activity are shown.
4. The system demonstrates operational visibility.

## 6. Demo Use Cases

### Use Case 1: New customer registration
A utility wants to onboard a new domestic customer.

### Use Case 2: Monthly consumption billing
A meter reader submits a reading and the billing engine calculates usage.

### Use Case 3: Payment collection
A customer pays outstanding dues, and the balance is updated.

### Use Case 4: Admin review
An admin checks the total billed, total collected, and unpaid accounts.

## 7. Simplified Functional Architecture

### Frontend
- Web dashboard for admins and cashiers
- Customer portal for viewing bills and making payments
- Mobile-friendly layout for field workers

### Backend
- REST API for customers, billing, readings, and payment operations
- Business logic for calculations and validation
- Role-based access logic

### Database
- Customers table
- Accounts table
- Meter readings table
- Bills table
- Payments table
- Users table
- Roles and permissions table

### Sample Data Model
- customer: id, name, phone, email, address
- account: id, customer_id, meter_number, status, balance
- meter_reading: id, account_id, reading_value, reading_date, previous_reading
- bill: id, account_id, bill_number, period, amount, status
- payment: id, bill_id, account_id, amount, method, reference, status, paid_at
- user: id, name, email, role

## 8. Minimal Demo User Interface
The demo should include the following screens:

### 8.1 Login Page
- Email / username
- Password
- Role selection (optional)

### 8.2 Dashboard
- Summary cards
- Recent bills
- Recent payments
- Alerts / overdue accounts

### 8.3 Customers Page
- List of customers
- Search by name or account number
- Add customer
- View details

### 8.4 Accounts Page
- Account list
- Account balance
- Meter number
- Connection status

### 8.5 Meter Reading Page
- Account selection
- Previous reading
- Current reading
- Usage calculation
- Submit reading

### 8.6 Billing Page
- Create bill
- Period and tariff selection
- Amount preview
- Status: pending / paid / overdue

### 8.7 Payments Page
- Payment method
- Amount input
- Reference number
- Confirm payment
- Update balance

### 8.8 Reports Page
- Total revenue
- Payment collection trends
- Unpaid bills
- Customer summary

## 9. Recommended Demo Scenario
Use one realistic narrative for the presentation:

> “Nakuru Water Utility is onboarding a new customer and managing billing operations for the month. The meter reader enters the latest reading, the system calculates consumption, the bill is generated, and the customer pays via M-Pesa. The dashboard updates automatically showing collections, outstanding balances, and active accounts.”

This narrative demonstrates the main business value in a short and understandable way.

## 10. Technical Implementation Recommendation
For a simple replica, the easiest stack is:

- Frontend: Next.js or simple React app
- Backend: NestJS or Express.js
- Database: PostgreSQL or SQLite for demo simplicity
- Authentication: basic role-based auth or mock login
- Styling: Tailwind CSS
- Payment simulation: mock M-Pesa / manual payment entry

This keeps the demo fast to build while still reflecting the real project direction.

## 11. Suggested Demo Milestones

### Milestone 1: Basic setup
- app shell
- login screen
- dashboard skeleton

### Milestone 2: Customers and accounts
- add customer
- add account
- view records

### Milestone 3: Billing workflow
- reading input
- bill generation
- tariff logic

### Milestone 4: Payments and reports
- payment recording
- status updates
- dashboard summary

### Milestone 5: Presentation polish
- branding
- sample data
- realistic dashboard cards
- polished UI flows

## 12. Acceptance Criteria
The demo is considered complete if:
- a user can log in
- a customer can be created
- a meter reading can be entered
- a bill is generated from the reading
- a payment can be recorded
- the dashboard reflects updated totals
- role-based access is enforced
- the workflow can be demonstrated live in under 10 minutes

## 13. Demo Deliverables
- Working web application
- Demo data set
- Presentation script
- Short explanation of architecture and business process
- Screenshots or recorded walkthrough for stakeholder review

## 14. Demo Notes for Presentation
Keep the demo focused on these points:
- water utility operations are operationally complex
- billing accuracy matters more than raw scale
- the platform is built for trust, compliance, and reconciliation
- the system can evolve from a local utility setup into a multitenant platform

## 15. Final Recommendation
Build the demo as a lightweight but realistic water billing product that mirrors the real MajiBill model. It should feel like a real utility system, even if it is not yet a full multitenant SaaS platform. This helps investors, partners, and stakeholders understand the product’s commercial and technical value quickly.

---

This demo document can be adapted into a full product walkthrough, pitch deck, or prototype specification as needed.
