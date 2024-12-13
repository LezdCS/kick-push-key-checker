/** @jsx h */
import { h } from "preact";

import admin from "firebase-admin";
import "jsr:@std/dotenv/load";
import { updateRemoteConfigValue } from "./update-remote-config.ts";
import { connect_pusher } from "./kick-websocket.ts";
import { scrapeWebsite } from "./scrapper.ts";
import { render } from "preact-render-to-string";
import { StatusPage } from "./views/home/home.tsx";
import { NotFoundPage } from "./views/404/page.tsx";

const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/gm, "\n");
if (!privateKey) {
  throw new Error("FIREBASE_PRIVATE_KEY is not set");
}

let latest_key = "none"
let latest_cluster = "none"
let last_time_updated = "none"

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
      last_time_updated = new Date().toISOString()

    } catch (error) {
      console.error('Pusher connection failed:', error);
    }
  } else {
    console.error('No Pusher App Key or Cluster found');
  }
}

if (import.meta.main) {
  // Run immediately once
  run();

    // Then schedule to run every hour
    Deno.cron("Check for new Pusher App Key", "0 * * * *", async () => {
      await run();
    });

  // Start HTTP server
  Deno.serve({ port: 8000 }, (req) => {
    if (req.url.endsWith('/')) {
      const html = render(
        h(StatusPage, { latestKey: latest_key, latestCluster: latest_cluster, lastTimeUpdated: last_time_updated })
      );
      
      return new Response(html, {
        headers: { "content-type": "text/html" },
      });
    }

    const notFoundHtml = render(h(NotFoundPage));
    return new Response(notFoundHtml, {
      status: 404,
      headers: { "content-type": "text/html" },
    });
  });
}
