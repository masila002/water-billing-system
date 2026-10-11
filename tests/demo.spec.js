import { test, expect } from "@playwright/test";
async function enter(page, role = "admin") {
  await page.goto("/");
  await page.screenshot({
    path: "test-results/demo-welcome.png",
    fullPage: true,
  });
  await page.getByLabel("Explore as").selectOption(role);
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your water network." }),
  ).toBeVisible();
}
async function nav(page, name) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function save(page, label = "Save record") {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: label, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("full pitch: customer, meter, reading, bill, partial/full receipt, report and reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await page.screenshot({
    path: "test-results/demo-overview.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "New customer", exact: true }).click();
  await page.getByLabel("Full name").fill("Demo Pitch Customer");
  await page.getByLabel("Phone number").fill("+254700000000");
  await page.getByLabel("Location").fill("Nakuru");
  await save(page);
  await nav(page, "Accounts");
  await page.getByRole("button", { name: "Connect a meter" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Customer", { exact: false })
    .selectOption({ label: "CUS-0007 · Demo Pitch Customer" });
  await page.getByLabel("Account number").fill("ACC-PITCH");
  await page.getByLabel("Meter number").fill("MTR-PITCH");
  await page.getByLabel("Opening meter reading").fill("100");
  await save(page, "Create account");
  await nav(page, "Meter readings");
  await page.getByRole("button", { name: "Capture reading" }).click();
  await page
    .getByLabel("Service account")
    .selectOption({ label: "ACC-PITCH · Demo Pitch Customer · MTR-PITCH" });
  await page.getByLabel("Current reading").fill("120");
  await expect(page.locator("#reading-preview")).toContainText("20.000");
  await save(page, "Save reading");
  await nav(page, "Bills");
  await page.getByRole("button", { name: "Issue bill", exact: true }).click();
  await expect(page.locator("#bill-preview")).toContainText("1,650");
  await save(page, "Issue bill");
  const bill = page.getByRole("row").filter({ hasText: "Demo Pitch Customer" });
  await expect(bill).toContainText("1,650");
  await bill.getByRole("button", { name: "View / print" }).click();
  await expect(page.getByRole("dialog")).toContainText("20 m³");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await nav(page, "Payments");
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Bill", { exact: false })
    .selectOption({ index: 0 });
  await page.getByLabel("Amount (KES)").fill("650");
  await page.getByLabel("Reference").fill("DEMO-PITCH-PARTIAL");
  await save(page, "Record payment");
  await nav(page, "Bills");
  await expect(
    page.getByRole("row").filter({ hasText: "Demo Pitch Customer" }),
  ).toContainText("partially paid");
  await expect(
    page.getByRole("row").filter({ hasText: "Demo Pitch Customer" }),
  ).toContainText("1,000");
  await nav(page, "Payments");
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .click();
  await expect(page.getByLabel("Amount (KES)")).toHaveValue("1000.00");
  await page.getByLabel("Reference").fill("DEMO-PITCH-FINAL");
  await save(page, "Record payment");
  const receipts = page
    .getByRole("row")
    .filter({ hasText: "Demo Pitch Customer" });
  await expect(receipts).toHaveCount(2);
  await receipts.first().getByRole("button", { name: "View / print" }).click();
  await expect(page.getByRole("dialog")).toContainText("DEMO-PITCH-FINAL");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".app-shell")).toBeHidden();
  await page.screenshot({
    path: "test-results/demo-receipt.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await nav(page, "Reports");
  await expect(
    page.getByRole("heading", { name: "Know where you stand." }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export account balances" }).click();
  expect((await downloadPromise).suggestedFilename()).toContain("accounts");
  await page.screenshot({
    path: "test-results/demo-reports.png",
    fullPage: true,
  });
  await nav(page, "Activity log");
  await expect(page.locator("[data-table]")).toContainText("payment recorded");
  await page.reload();
  await nav(page, "Accounts");
  await expect(
    page.getByRole("row").filter({ hasText: "ACC-PITCH" }),
  ).toContainText("0.00");
  expect(errors).toEqual([]);
});
test("roles, keyboard dialog and narrow layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, "reader");
  await nav(page, "Customers");
  await expect(page.getByRole("button", { name: "New customer" })).toHaveCount(
    0,
  );
  await nav(page, "Meter readings");
  await page.getByRole("button", { name: "Capture reading" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Demo role").selectOption("cashier");
  await nav(page, "Bills");
  await expect(page.getByRole("button", { name: "Issue bill" })).toHaveCount(0);
  await nav(page, "Overview");
  await page.screenshot({
    path: "test-results/demo-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({
    path: "test-results/demo-mobile-360.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("storage corruption, explicit reset and API failure never fabricate success", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("majibill-demo-v1", "broken"));
  await enter(page);
  await expect(page.locator("#view")).toContainText("damaged or incompatible");
  await page.getByRole("button", { name: "Demo settings" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset fictional demo data" }).click();
  await expect(page.locator("#view")).not.toContainText(
    "damaged or incompatible",
  );
  await page.getByRole("button", { name: "Demo settings" }).click();
  await page.getByLabel("Data source").selectOption("api");
  await page.getByLabel("API base URL").fill("http://127.0.0.1:1/api");
  await save(page, "Apply settings");
  await expect(page.locator("#view")).toContainText(
    "Workspace data unavailable",
  );
  await expect(
    page.getByText("API unavailable", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("majibill-mode"))).toBe(
    "api",
  );
});
test("blocked browser storage shows recovery guidance instead of a blank page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.setItem = function () {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await enter(page);
  await expect(page.locator("#view")).toContainText(
    "Demo storage is unavailable",
  );
});
test("enter demo starts the local workspace even after a previous API session", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("majibill-mode", "api"));
  await enter(page);
  await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
  await expect(page.locator("#view")).not.toContainText(
    "Workspace data unavailable",
  );
});
