import { test, expect } from "@playwright/test";

test("新增學員 → 量 InBody → 看到基本建議", async ({ page }) => {
  const name = `E2E_${Date.now()}`;

  // 1. 新增學員
  await page.goto("/students/new");
  await page.fill('input[id="name"]', name);
  // 選性別 = 男（預設就是 M，這裡跳過點選）
  await page.fill('input[id="weeklyClassCount"]', "2");
  await page.fill('input[id="weeklyGymCount"]', "4");
  await page.click('button[type="submit"]');

  // 應跳到學員詳細頁
  await expect(page.locator("h1")).toHaveText(name);

  // 2. 進 InBody → 新增
  await page.click('a[href*="/inbody"]');
  await page.click('a[href*="/inbody/new"]');

  // 填高體脂觸發建議
  await page.fill('input[id="weightKg"]', "80");
  await page.fill('input[id="bodyFatPct"]', "28");
  await page.fill('input[id="bmrKcal"]', "1500");
  await page.click('button[type="submit"]');

  // 3. 詳細頁應該顯示「建議先減脂再增肌」
  await expect(page.getByText(/建議先以減脂為主/)).toBeVisible();
});
