// @ts-check
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Login page
  await page.goto('http://localhost:3456', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/ss_01_login.png' });
  console.log('01_login taken ✓');

  // 2. Click "获取验证码" button
  await page.click('text=获取验证码');
  await page.waitForTimeout(1500);

  // Generate OTP from API
  const resp = await page.evaluate(async () => {
    const r = await fetch('/api/request-otp', { method: 'POST' });
    return r.json();
  });
  const code = resp.code;
  console.log(`OTP: ${code}`);

  // Fill in 6 digit inputs
  for (let i = 0; i < 6; i++) {
    await page.fill(`#otp-${i}`, code[i]);
  }
  await page.waitForTimeout(300);

  // Click "确认登录"
  await page.click('text=确认登录');
  await page.waitForTimeout(4000);

  // 3. Dashboard main view
  await page.screenshot({ path: '/tmp/ss_02_dashboard.png' });
  console.log('02_dashboard taken ✓');

  // 4. Click on a different stock to show chart
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ss_03_chart_wait.png' });
  console.log('03_chart_wait taken ✓');

  // 5. Click alert sidebar history tab
  const historyBtn = page.locator('text=历史预警');
  if (await historyBtn.isVisible()) {
    await historyBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ss_04_alerts.png' });
    console.log('04_alerts taken ✓');
  }

  await browser.close();
  console.log('All screenshots done ✅');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
