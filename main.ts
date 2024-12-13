import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import admin from "firebase-admin";
import "jsr:@std/dotenv/load";
import { updateRemoteConfigValue } from "./update-remote-config.ts";
import { connect_pusher } from "./kick-websocket.ts";

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

export async function scrapeWebsite(url: string): Promise<string | null> {
  const p = puppeteer.default;
  p.use(stealthPlugin());

  const browser = await p.launch();
  const page = await browser.newPage();

  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');

  let pusherAppKey: string | null = null;
  cdp.on('Network.webSocketCreated', ({requestId, url}) => {
    console.log('Network.webSocketCreated', requestId, url)
    // Regex breakdown:
    // app/          - Matches literal "app/" in the URL
    // (            - Start capturing group
    //   [a-f0-9]   - Match any lowercase letter a-f or digit 0-9
    //   {20}       - Exactly 20 characters of the above pattern
    // )            - End capturing group
    const pusherAppKeyRegex = /app\/([a-f0-9]{20})/;
    const match = url.match(pusherAppKeyRegex);
    if (match) {
      pusherAppKey = match[1];
      console.log('Pusher App Key:', pusherAppKey);
    }
  })

  await page.goto(url);
  await browser.close();

  return pusherAppKey;
}

if (import.meta.main) {
  const pusherAppKey = await scrapeWebsite('https://kick.com/xqc');
  if (pusherAppKey) {
    connect_pusher(pusherAppKey, 'us2');
    // await updateRemoteConfigValue('test_key', pusherAppKey);
  } else {
    console.error('No Pusher App Key found');
  }
}
