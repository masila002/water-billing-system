# Seven-minute utility pitch

## Before the meeting

Run `npm run dev`, open http://127.0.0.1:3000 and choose Administrator. In settings, select Local demo and reset fictional data. Keep one browser tab for the presentation. Verify the overview shows six active customers and six active accounts. Use a modern desktop browser with storage enabled; no internet is needed once installed.

Describe this honestly: “MajiBill is a water billing workflow demo built by 404HubSpot. Today we are demonstrating the operating journey with fictional records and simulated payments.”

## The walkthrough

1. **Overview (45 seconds).** Show customers, billed amounts, confirmed collections and outstanding bills. These figures come from the demo records and change as you work.
2. **Customer (45 seconds).** Add `Demo Pitch Customer` with the suggested customer number. Optional phone/email may be left empty. Search the register to show the record.
3. **Connection (45 seconds).** Open Accounts → Connect a meter. Select the new customer, use `ACC-PITCH` / `MTR-PITCH`, Domestic tariff and opening reading **100**.
4. **Reading and bill (60 seconds).** Open Meter readings → Capture reading. Select `ACC-PITCH`, enter **120**, retain today's date. Point out the **20 m³** usage and **KES 1,650** estimated bill preview (KES 75/m³ + KES 150 fixed). Saving the reading creates the invoice automatically; a reading lower than 100 is rejected.
5. **Bill (30 seconds).** Open Bills to show the invoice created from the saved reading, then View / print it. The bill amount is added to the account balance immediately.
6. **Collection (75 seconds).** Open Payments → Record payment. Select the pitch bill, record **KES 650**, choose M-Pesa (simulated), reference `DEMO-PITCH-1`. Show Bills: balance **KES 1,000**, partially paid. Record the remaining **KES 1,000**, reference `DEMO-PITCH-2`. Show the receipt and settled bill. No live money moves.
7. **Visibility (60 seconds).** Reports shows collections and outstanding accounts; export balances to CSV. Activity log shows who recorded each action. Reload to demonstrate persistence. Switch to Meter reader: customer/payment write actions disappear.

Close with the concrete next step: validate a utility's tariff, sample data and daily process, then agree a scoped pilot. ZUCAR is the proposed reseller context; this demo does not claim an executed partnership or customer endorsement.

## Recovery

- Duplicate identifier/reference: choose another value or reset the demo before restarting the pitch.
- All bills settled: create another customer/account/reading/bill or reset.
- Storage error: enable browser storage; for damaged sample state use the explicit reset in settings. Reset replaces demo changes only.
- API unavailable: use settings to select Local demo. There is no automatic fallback that disguises a server failure.
- Do not show browser demo roles as secure login, activity as tamper-evident audit, or simulated M-Pesa as a live integration.
