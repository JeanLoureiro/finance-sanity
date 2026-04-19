import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero with headline and CTAs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /your finances/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "See features" })).toBeVisible();
  });

  test("Get started links to /login", async ({ page }) => {
    const link = page.getByRole("link", { name: "Get started" }).first();
    await expect(link).toHaveAttribute("href", "/login");
  });

  test("See features scrolls to feature grid", async ({ page }) => {
    await expect(page.locator("#features")).toBeVisible();
    await expect(page.getByText("Net Worth Dashboard")).toBeVisible();
    await expect(page.getByText("FIRE Planning")).toBeVisible();
    await expect(page.getByText("Capital Gains Tax")).toBeVisible();
  });

  test("stat strip shows key numbers", async ({ page }) => {
    await expect(page.getByText("9+")).toBeVisible();
    await expect(page.getByText("Asset classes")).toBeVisible();
    await expect(page.getByText("AUS")).toBeVisible();
    await expect(page.getByText("FIRE")).toBeVisible();
  });

  test("nav appears on scroll", async ({ page }) => {
    const nav = page.locator("nav");
    // Initially transparent (no border class)
    await expect(nav).not.toHaveClass(/border-b/);
    // Scroll down past threshold
    await page.evaluate(() => window.scrollBy(0, 100));
    await expect(nav).toHaveClass(/border-b/);
  });

  test("footer has sign in link", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("CTA banner Get started links to /login", async ({ page }) => {
    const ctaBanner = page.locator("section").filter({ hasText: "Ready to take control" });
    await expect(ctaBanner.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/login");
  });
});
