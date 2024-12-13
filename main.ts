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

if (import.meta.main) {
  const { pusherAppKey, pusherCluster } = await scrapeWebsite('https://kick.com/xqc');
  if (pusherAppKey && pusherCluster) {
    try {
      await connect_pusher(pusherAppKey, pusherCluster);
      console.log("%c🔌 Connected to Pusher successfully! ✅", "color: green")
      await updateRemoteConfigValue('test_key', pusherAppKey);
      Deno.exit(0);
    } catch (error) {
      console.error('Pusher connection failed:', error);
    }
  } else {
    console.error('No Pusher App Key or Cluster found');
  }
}
