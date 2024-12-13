import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

export async function scrapeWebsite(url: string): Promise<{ pusherAppKey: string | null, pusherCluster: string | null }> {
    const p = puppeteer.default;
    p.use(stealthPlugin());
  
    const browser = await p.launch();
    const page = await browser.newPage();
  
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Page.enable');
  
    let pusherAppKey: string | null = null;
    let pusherCluster: string | null = null;
    cdp.on('Network.webSocketCreated', ({requestId, url}) => {
      // console.log('Network.webSocketCreated', requestId, url)
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
        console.log('%cPusher App Key: %c%s', 'color: green', 'color: blue; font-weight: bold', pusherAppKey);
      }
      // Regex breakdown:
      // ws-          - Matches literal "ws-" in the URL
      // (            - Start capturing group
      //   [a-z0-9]+  - Match one or more lowercase letters or digits
      // )            - End capturing group
      // \.pusher\.com - Matches literal ".pusher.com" in the URL
      const pusherClusterRegex = /ws-([a-z0-9]+)\.pusher\.com/;
      const matchCluster = url.match(pusherClusterRegex);
      if (matchCluster) {
        pusherCluster = matchCluster[1];
        console.log('%cPusher Cluster: %c%s', 'color: green', 'color: blue; font-weight: bold', pusherCluster);
      }
    })
  
    await page.goto(url);
    await browser.close();
  
    return { pusherAppKey, pusherCluster };
  }
  