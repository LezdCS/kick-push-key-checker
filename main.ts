import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

export async function scrapeWebsite(url: string) {
  const p = puppeteer.default;
  p.use(stealthPlugin());

  const browser = await p.launch();
  const page = await browser.newPage();

  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');

  cdp.on('Network.webSocketCreated', ({requestId, url}) => {
    console.log('Network.webSocketCreated', requestId, url)
  })

  await page.goto(url);
  await browser.close();
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  scrapeWebsite('https://kick.com/xqc');
}
