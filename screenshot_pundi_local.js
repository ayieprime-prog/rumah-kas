const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('Testing Pundi local dev server...\n');

    // Test login page
    console.log('📄 Login page:');
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    await page.waitForTimeout(500);

    const loginTitle = await page.title();
    console.log(`   Title: "${loginTitle}"`);

    const loginH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'NOT FOUND';
    });
    console.log(`   Header: "${loginH1}"`);

    await page.screenshot({
      path: '/tmp/claude-0/-home-user-ds-coffee-manajemen-keuangan/f7d7af8d-d50d-5691-b3ba-f7bc7c66b2e6/scratchpad/pundi_login_screenshot.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved: pundi_login_screenshot.png');

    // Test register page
    console.log('\n📝 Register page:');
    await page.goto('http://localhost:3000/register', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    await page.waitForTimeout(500);

    const registerTitle = await page.title();
    console.log(`   Title: "${registerTitle}"`);

    const registerH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'NOT FOUND';
    });
    console.log(`   Header: "${registerH1}"`);

    await page.screenshot({
      path: '/tmp/claude-0/-home-user-ds-coffee-manajemen-keuangan/f7d7af8d-d50d-5691-b3ba-f7bc7c66b2e6/scratchpad/pundi_register_screenshot.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved: pundi_register_screenshot.png');

    // Test favicon
    console.log('\n🎨 Favicon:');
    const faviconHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="icon"]');
      return link ? link.getAttribute('href') : 'NOT FOUND';
    });
    console.log(`   Favicon href: "${faviconHref}"`);

    console.log('\n✅ Pundi local test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
