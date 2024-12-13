import admin from "firebase-admin";
import "jsr:@std/dotenv/load";
import { updateRemoteConfigValue } from "./update-remote-config.ts";
import { connect_pusher } from "./kick-websocket.ts";
import { scrapeWebsite } from "./scrapper.ts";

const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/gm, "\n");
if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not set");
}

let latest_key = ""
let latest_cluster = ""

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

export async function run() {
  const { pusherAppKey, pusherCluster } = await scrapeWebsite('https://kick.com/xqc');
  
  if (pusherAppKey && pusherCluster) {
    try {
      await connect_pusher(pusherAppKey, pusherCluster);
      console.log("%c🔌 Connected to Pusher successfully! ✅", "color: green");

      const remoteConfigKey = Deno.env.get("REMOTE_CONFIG_KEY");
      if (!remoteConfigKey) {
        throw new Error("REMOTE_CONFIG_KEY is not set");
      }

      await updateRemoteConfigValue(remoteConfigKey, pusherAppKey);

      latest_key = pusherAppKey
      latest_cluster = pusherCluster

    } catch (error) {
      console.error('Pusher connection failed:', error);
    }
  } else {
    console.error('No Pusher App Key or Cluster found');
  }
}

if (import.meta.main) {
  // Run immediately once
  await run();

  if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
    // Then schedule to run every hour
    Deno.cron("Check for new Pusher App Key", "0 * * * *", async () => {
      await run();
    });
  }

  // Start HTTP server
  Deno.serve({ port: 8000 }, async (req) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IRL Link Status</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              background: #f5f5f5;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #2c3e50;
              font-size: 2.5rem;
              margin-bottom: 2rem;
            }
            .status {
              background: white;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .status h2 {
              color: #3498db;
              margin-top: 0;
              font-size: 1.5rem;
            }
            .status p {
              margin: 0;
              font-size: 1.1rem;
              line-height: 1.5;
            }
            .status:hover {
              transform: translateY(-2px);
              transition: transform 0.2s ease;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <h1>Kick Pusher Status</h1>
          <div class="status">
            <h2>Service Status</h2>
            <p>The service is running and checking for Pusher updates every hour.</p>
          </div>
          <div class="status">
            <h2>Latest Pusher App Key</h2>
            <p>${latest_key}</p>
          </div>
          <div class="status">
            <h2>Latest Pusher Cluster</h2>
            <p>${latest_cluster}</p>
          </div>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  });
}
