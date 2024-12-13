import admin from "firebase-admin";
import "jsr:@std/dotenv/load";
import { updateRemoteConfigValue } from "./update-remote-config.ts";
import { connect_pusher } from "./kick-websocket.ts";
import { scrapeWebsite } from "./scrapper.ts";

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

      if (!Deno.env.get("DENO_DEPLOYMENT_ID")) {
        Deno.exit(0);
      }
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
        </head>
        <body>
          <h1>IRL Link Status</h1>
          <div class="status">
            <h2>Service Status</h2>
            <p>The service is running and checking for Pusher updates every hour.</p>
          </div>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  });
}
