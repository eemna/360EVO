import { test, expect, Page } from "@playwright/test";

async function clearSession(page: Page) {
  const isLoggedIn = await page
    .getByRole("button", { name: /user menu/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isLoggedIn) {
    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
  }

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();

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
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible({
    timeout: 10000,
  });
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(redirectPattern, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
}

test("Full investor DD flow — one continuous video", async ({
  page,
  request,
}) => {
  const INVESTOR_EMAIL = `e2e-investor-${Date.now()}@test.com`;
  const INVESTOR_PASSWORD = "InvestorPass123!";
  const INVESTOR_NAME = "E2E Investor User";

  const STARTUP_EMAIL = `e2e-startup-dd-${Date.now()}@test.com`;
  const STARTUP_PASSWORD = "StartupPass123!";
  const STARTUP_NAME = "E2E Startup DD User";

  const ADMIN_EMAIL = "e2e-admin@test.com";
  const ADMIN_PASSWORD = "AdminPass123!";

  const DD_PROJECT_TITLE = `DD Project ${Date.now()}`;

  await page.addInitScript(() => {
    localStorage.setItem("cookieConsent", "true");
  });

  // ─── STEP 1 — Investor registers
  await test.step("1 — Investor registers", async () => {
    await page.goto("/register");
    await page.getByRole("button", { name: /^investor/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();

    const textInputs = page.getByRole("textbox");
    await textInputs.nth(0).fill(INVESTOR_NAME);
    await textInputs.nth(1).fill(INVESTOR_EMAIL);
    await page.locator('input[type="password"]').nth(0).fill(INVESTOR_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill(INVESTOR_PASSWORD);
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page
      .getByText(/ready to join as an investor/i)
      .waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: /complete registration/i }).click();
    await page.waitForURL("**/login**", { timeout: 30000 });
  });

  // ─── STEP 2 — Verify investor email
  await test.step("2 — Verify investor email", async () => {
    const res = await request.get(
      "http://localhost:5001/api/e2e/verify-latest-user",
    );
    expect(res.ok()).toBeTruthy();
  });

  // ─── STEP 3 — Investor logs in
  await test.step("3 — Investor logs in", async () => {
    await loginAs(page, INVESTOR_EMAIL, INVESTOR_PASSWORD, "**/app/investor**");
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 15000,
    });
  });

  // ─── STEP 4 — Investor sets up preferences
  await test.step("4 — Investor sets up preferences", async () => {
    await page.goto("/app/investor/setup");
    await page.waitForLoadState("domcontentloaded");

    await page
      .getByRole("button", { name: "FinTech" })
      .waitFor({ state: "visible", timeout: 20000 });

    await page.getByRole("button", { name: "FinTech" }).click();
    await page.getByRole("button", { name: "AI & Machine Learning" }).click();
    await page
      .getByRole("button", { name: /^continue/i })
      .click({ force: true });

    await page
      .getByRole("button", { name: "MVP" })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "MVP" }).click();
    await page.getByRole("button", { name: "GROWTH" }).click();
    await page.getByRole("button", { name: "React" }).click();
    await page.getByRole("button", { name: "Node.js" }).click();
    await page
      .getByRole("button", { name: /^continue/i })
      .click({ force: true });

    await page
      .getByPlaceholder("e.g. 50000", { exact: true })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.getByPlaceholder("e.g. 50000", { exact: true }).fill("50000");
    await page.getByPlaceholder("e.g. 500000", { exact: true }).fill("500000");
    await page.getByRole("button", { name: "MEDIUM" }).click();
    await page
      .getByRole("button", { name: /^continue/i })
      .click({ force: true });

    await page
      .getByText(/minimum trl score/i)
      .waitFor({ state: "visible", timeout: 10000 });
    await page
      .getByRole("button", { name: /^continue/i })
      .click({ force: true });

    await page
      .getByRole("button", { name: "MENA" })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "MENA" }).click();
    await page.getByRole("button", { name: "North Africa" }).click();
    await page.getByRole("button", { name: "Equity" }).click();
    await page
      .getByRole("button", { name: /^continue/i })
      .click({ force: true });

    await page
      .getByPlaceholder(/B2B SaaS/i)
      .waitFor({ state: "visible", timeout: 10000 });
    await page
      .getByPlaceholder(/B2B SaaS/i)
      .fill(
        "I focus on early-stage FinTech and AI startups in MENA that solve real financial inclusion problems with scalable technology.",
      );
    await page.getByRole("button", { name: /^save$/i }).click({ force: true });
    await expect(page.getByText(/profile saved/i)).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── STEP 5 — Startup registers and creates project
  await test.step("5 — Startup registers and creates project", async () => {
    await clearSession(page);
    await page.goto("/register");

    await page.getByRole("button", { name: /^startup/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();

    const inputs = page.getByRole("textbox");
    await inputs.nth(0).fill(STARTUP_NAME);
    await inputs.nth(1).fill(STARTUP_EMAIL);
    await page.locator('input[type="password"]').nth(0).fill(STARTUP_PASSWORD);
    await page.locator('input[type="password"]').nth(1).fill(STARTUP_PASSWORD);
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page
      .getByText(/company name/i)
      .waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("textbox").first().fill("DD Test Corp");
    await page.getByRole("button", { name: /complete registration/i }).click();
    await page.waitForURL("**/login**", { timeout: 30000 });

    const verifyRes = await request.get(
      "http://localhost:5001/api/e2e/verify-latest-user",
    );
    expect(verifyRes.ok()).toBeTruthy();

    await loginAs(page, STARTUP_EMAIL, STARTUP_PASSWORD, "**/app/startup**");

    await page.getByRole("button", { name: "Create Project" }).first().click();
    await page.getByText("Create New Project").waitFor({ state: "visible" });

    await page.getByLabel(/project title/i).fill(DD_PROJECT_TITLE);
    await page.getByLabel(/tagline/i).fill("A FinTech project for DD testing");
    await page
      .getByLabel(/short description/i)
      .fill(
        "This project is used for due diligence E2E testing. It is meaningful and descriptive.",
      );
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "FinTech" }).click();
    await page.getByRole("button", { name: /^mvp$/i }).click();
    await page.getByPlaceholder(/tunis/i).fill("Tunis, Tunisia");
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByText("React").click();
    await page.getByText("Node.js").click();
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type(
      "Full description of the DD test project. It solves a real fintech problem using modern technology and AI.",
    );
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByPlaceholder(/full name/i).fill("Jane Doe");
    await page.getByPlaceholder(/e\.g\., CEO/i).fill("CEO");
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByPlaceholder(/e\.g\., 100000/i).fill("200000");
    await page.getByPlaceholder(/milestone description/i).fill("Launch Beta");
    await page.locator('input[type="date"]').first().fill("2026-12-31");
    await page.getByRole("button", { name: /^next$/i }).click();

    await page.getByTestId("wizard-submit").click();
    await page
      .getByText("Create New Project")
      .waitFor({ state: "hidden", timeout: 20000 });
    await expect(page.getByText(DD_PROJECT_TITLE)).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── STEP 6 — Admin approves the project
  await test.step("6 — Admin approves the project", async () => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "**/app/admin**");

    await page
      .getByText("Admin Panel")
      .waitFor({ state: "visible", timeout: 20000 });
    await page.getByTestId("nav-projects").click();

    const row = page.getByRole("row").filter({ hasText: DD_PROJECT_TITLE });
    await row.getByRole("button", { name: /approve/i }).click();
    await expect(row).not.toBeVisible({ timeout: 10000 });
  });

  // ─── STEP 7 — Investor generates matches
  await test.step("7 — Investor generates matches", async () => {
    await loginAs(page, INVESTOR_EMAIL, INVESTOR_PASSWORD, "**/app/investor**");

    await page.getByRole("button", { name: /refresh matches/i }).click();
    await expect(
      page.getByRole("button", { name: /refresh matches/i }),
    ).not.toBeDisabled({ timeout: 60000 });
  });

  // ─── STEP 8 — Investor views match feed
  await test.step("8 — Investor views match feed", async () => {
    await page.getByRole("button", { name: /view all/i }).click();
    await page.waitForURL("**/investor/matches**", { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/match feed/i)).toBeVisible({ timeout: 10000 });

    const anyCard = page.locator('[class*="rounded-2xl"]').first();
    await anyCard.waitFor({ state: "visible", timeout: 15000 });

    await page.waitForTimeout(2000);

    await anyCard.click();

    await expect(
      page.getByRole("heading", { name: /match reasoning/i }),
    ).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2000);

    const viewProjectBtn = page
      .getByRole("button", { name: /view project/i })
      .first();
    const hasViewBtn = await viewProjectBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasViewBtn) {
      await viewProjectBtn.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
    }
  });

  // ─── STEP 9 — Investor requests DD
  await test.step("9 — Investor requests due diligence", async () => {
    await page.goto("/app/projects");
    await page.waitForLoadState("domcontentloaded");

    await page.getByText(DD_PROJECT_TITLE).click();
    await page.waitForURL("**/startup/projects/**", { timeout: 15000 });

    const ddBtn = page.getByRole("button", {
      name: /request due diligence|request dd/i,
    });
    await expect(ddBtn).toBeVisible({ timeout: 10000 });
    await ddBtn.click();

    const modal = page.getByRole("dialog");
    const hasModal = await modal
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasModal) {
      const textarea = modal.getByRole("textbox").first();
      if (await textarea.isVisible()) {
        await textarea.fill(
          "We are interested in your financials and traction metrics.",
        );
      }
      await modal.getByRole("button", { name: /send|submit|confirm/i }).click();
    }

    await expect(
      page.getByText(/dd request sent|request sent|already sent/i),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── STEP 10 — Startup approves DD request
  await test.step("10 — Startup approves DD request", async () => {
    await loginAs(page, STARTUP_EMAIL, STARTUP_PASSWORD, "**/app/startup**");

    await page.waitForTimeout(2000);

    await page
      .getByRole("button", { name: /review.*grant access|data room requests/i })
      .first()
      .click();

    await page.waitForURL("**/startup/dd-requests**", { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForTimeout(2000);

    const pendingTab = page.getByRole("button", { name: /pending/i }).first();
    const hasPendingTab = await pendingTab
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasPendingTab) {
      await pendingTab.click();
      await page.waitForTimeout(500);
    }

    const approveBtn = page.getByRole("button", { name: /^approve$/i }).first();
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    const modal = page.getByRole("dialog");
    const hasModal = await modal
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasModal) {
      await page.waitForTimeout(1500);
      await modal.getByRole("button", { name: /^approve$|^confirm$/i }).click();
    }

    await page.waitForTimeout(2000);

    await expect(page.getByRole("button", { name: /approved/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: /approved/i }).click();
    await page.waitForTimeout(1500);
  });

  // ─── STEP 11 — Investor sees approved data room
  await test.step("11 — Investor sees approved data room", async () => {
    await loginAs(page, INVESTOR_EMAIL, INVESTOR_PASSWORD, "**/app/investor**");
    await page.goto("/app/investor/dd-requests");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/approved/i)).toBeVisible({ timeout: 10000 });

    const openBtn = page
      .getByRole("button", { name: /open|view|access data room/i })
      .first();
    const hasBtn = await openBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasBtn) {
      await openBtn.click();
      await page.waitForURL("**/data-rooms/**", { timeout: 15000 });
      await expect(page.getByText(/data room|documents/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  // ─── STEP 12 — Investor edits preferences
  await test.step("12 — Investor edits preferences", async () => {
    await page.goto("/app/profile/me");
    await page.waitForLoadState("domcontentloaded");

    await page
      .getByRole("button", { name: "Edit", exact: true })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Edit", exact: true }).click();

    await page.waitForURL("**/investor/setup**", { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");

    await page
      .getByRole("button", { name: "FinTech" })
      .waitFor({ state: "visible", timeout: 20000 });

    for (let i = 0; i < 5; i++) {
      await page
        .getByRole("button", { name: /^continue/i })
        .click({ force: true });
      await page.waitForTimeout(400);
    }

    const thesis = page.getByPlaceholder(/B2B SaaS/i);
    await expect(thesis).toBeVisible({ timeout: 10000 });
    await thesis.clear();
    await thesis.fill(
      "Updated: I focus on FinTech and AI startups in MENA with strong unit economics and a clear path to profitability.",
    );

    await page.getByRole("button", { name: /^save$/i }).click({ force: true });
    await page.waitForURL("**/app/investor**", { timeout: 15000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
