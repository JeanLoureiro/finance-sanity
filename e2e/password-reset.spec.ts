import { test, expect } from "@playwright/test";
import path from "path";

const EVIDENCE_DIR = "/var/folders/py/gmf_g6wn6258cgn_m8jz5k640000gn/T/no-mistakes-evidence/01KWP4X5F2B0CA8W8V8ZXWSCAP";

test.describe("Password reset PKCE callback flow", () => {
  test("reset-password page shows error when no type=recovery param", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "reset-password-no-params.png"), fullPage: true });
  });

  test("reset-password page shows error when error=invalid_link param is present", async ({ page }) => {
    await page.goto("/auth/reset-password?error=invalid_link");
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "reset-password-error-param.png"), fullPage: true });
  });

  test("reset-password page shows verifying state then error when type=recovery but no real session", async ({ page }) => {
    await page.goto("/auth/reset-password?type=recovery");
    // It briefly shows "Verifying reset link…" then transitions to error (no real session)
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "reset-password-recovery-no-session.png"), fullPage: true });
  });

  test("callback route without code redirects to reset-password error page", async ({ page }) => {
    await page.goto("/api/auth/callback?next=/auth/reset-password");
    // Should land on reset-password with error param
    await expect(page).toHaveURL(/\/auth\/reset-password\?error=invalid_link/);
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "callback-no-code-redirects.png"), fullPage: true });
  });

  test("callback route rejects open-redirect next param (non-/ prefix)", async ({ page }) => {
    // next=https://evil.com should be sanitised to /
    const response = await page.request.get(
      "/api/auth/callback?next=https://evil.com&code=fake",
      { maxRedirects: 0 }
    );
    // The route sanitises next to "/" and then proceeds to exchange (which will fail), ending at error page
    // The important thing: the redirect target must not include evil.com
    const location = response.headers()["location"] ?? "";
    expect(location).not.toContain("evil.com");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "callback-open-redirect-blocked.png"), fullPage: true });
  });

  test("forgot-password page renders correctly", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByText("Financial Sanity")).toBeVisible();
    await expect(page.getByText("Reset your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "forgot-password-page.png"), fullPage: true });
  });
});
