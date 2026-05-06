import { test, expect, Page } from "@playwright/test";

async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.addInitScript(() => {
    localStorage.setItem("cookieConsent", "true");
  });
}

async function loginAs(
  page: Page,
  email: string,
  password: string,
  redirectPattern: string,
) {
  await clearSession(page);
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await expect(
    page.getByRole("button", { name: /^sign in$/i }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(redirectPattern, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
}

test("Startup registers → creates project → Admin approves", async ({
  page,
  request,
}) => {
  const STARTUP_EMAIL = `e2e-startup-${Date.now()}@test.com`;
  const STARTUP_PASSWORD = "StartupPass123!";
  const STARTUP_NAME = "E2E Startup User";

  const ADMIN_EMAIL = "e2e-admin@test.com";
  const ADMIN_PASSWORD = "AdminPass123!";

  const PROJECT_TITLE = `E2E Project ${Date.now()}`;

  await page.addInitScript(() => {
    localStorage.setItem("cookieConsent", "true");
  });

  // ─── STEP 1 — Startup registers 
  await test.step("1 — Startup registers", async () => {
    await page.goto("/register");
    await page.getByRole("button", { name: /^startup/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();

    const textInputs = page.getByRole("textbox");
    await textInputs.nth(0).fill(STARTUP_NAME);
    await textInputs.nth(1).fill(STARTUP_EMAIL);
    await page.locator('input[type="password"]').nth(0).fill(STARTUP_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill(STARTUP_PASSWORD);
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.getByText(/company name/i).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("textbox").first().fill("E2E Test Corp");
    await page.getByRole("button", { name: /complete registration/i }).click();
    await page.waitForURL("**/login**", { timeout: 30000 });
  });

  // ─── STEP 2 — Verify startup email 
  await test.step("2 — Verify startup email", async () => {
    const res = await request.get(
      "http://localhost:5001/api/e2e/verify-latest-user",
    );
    expect(res.ok()).toBeTruthy();
  });

  // ─── STEP 3 — Startup logs in
  await test.step("3 — Startup logs in", async () => {
    await loginAs(page, STARTUP_EMAIL, STARTUP_PASSWORD, "**/app/startup**");
    await expect(page.getByText(/startup dashboard/i)).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── STEP 4 — Startup creates a project
  await test.step("4 — Startup creates a project", async () => {
    await page.getByRole("button", { name: "Create Project" }).first().click();
    await page.getByText("Create New Project").waitFor({ state: "visible" });

    // Step 1: Basics
    await page.getByLabel(/project title/i).fill(PROJECT_TITLE);
    await page.getByLabel(/tagline/i).fill("An end-to-end test project");
    await page.getByLabel(/short description/i).fill(
      "This is a short description for the E2E test project that is meaningful.",
    );
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "FinTech" }).click();
    await page.getByRole("button", { name: /^mvp$/i }).click();
    await page.getByPlaceholder(/tunis/i).fill("Tunis, Tunisia");
    await page.getByRole("button", { name: /^next$/i }).click();

    // Step 2: Details
    await page.getByText("React").click();
    await page.getByText("Node.js").click();
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type(
      "This is a full description of the E2E test project. It explains the problem we solve and how we solve it with technology.",
    );
    await page.getByRole("button", { name: /^next$/i }).click();

    // Step 3: Team
    await page.getByPlaceholder(/full name/i).fill("John Doe");
    await page.getByPlaceholder(/e\.g\., CEO/i).fill("CEO");
    await page.getByRole("button", { name: /^next$/i }).click();

    // Step 4: Funding
    await page.getByPlaceholder(/e\.g\., 100000/i).fill("500000");
    await page.getByPlaceholder(/milestone description/i).fill("Launch MVP");
    await page.locator('input[type="date"]').first().fill("2026-12-31");
    await page.getByRole("button", { name: /^next$/i }).click();

    // Step 5: Submit
    await page.getByTestId("wizard-submit").click();
    await page
      .getByText("Create New Project")
      .waitFor({ state: "hidden", timeout: 20000 });
    await expect(page.getByText(PROJECT_TITLE)).toBeVisible({ timeout: 10000 });
  });

  // ─── STEP 5 — Admin logs in and approves
  await test.step("5 — Admin approves the project", async () => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "**/app/admin**");

    await page
      .getByText("Admin Panel")
      .waitFor({ state: "visible", timeout: 20000 });
    await page.getByTestId("nav-projects").click();

    const row = page.getByRole("row").filter({ hasText: PROJECT_TITLE });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole("button", { name: /approve/i }).click();

    await expect(page.getByText(PROJECT_TITLE)).not.toBeVisible({
      timeout: 10000,
    });
  });

  // ─── STEP 6 — Approved project appears in public gallery 
  await test.step("6 — Approved project appears in public gallery", async () => {
    await page.goto("/app/projects");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(PROJECT_TITLE)).toBeVisible({ timeout: 15000 });
  });

  // ─── STEP 7 — Startup sees project as APPROVED 
  await test.step("7 — Startup sees project as APPROVED", async () => {
    await loginAs(page, STARTUP_EMAIL, STARTUP_PASSWORD, "**/app/startup**");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(PROJECT_TITLE)).toBeVisible({ timeout: 15000 });

    const projectCard = page
      .locator('[class*="rounded-xl"]')
      .filter({ hasText: PROJECT_TITLE });
    await expect(projectCard.getByText("APPROVED")).toBeVisible({
      timeout: 10000,
    });
  });
});