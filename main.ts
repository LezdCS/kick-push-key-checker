import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import admin from "firebase-admin";
import "jsr:@std/dotenv/load";
import { updateRemoteConfigValue } from "./update-remote-config.ts";

const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/gm, "\n");

const config = {
  credential: admin.credential.cert({
    clientEmail: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
    privateKey: privateKey,
    projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
  }),
};

export const firebase = admin.apps.length
  ? admin.app()
  : admin.initializeApp(config);

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
  updateRemoteConfigValue('test_key', 'test_value');
}
