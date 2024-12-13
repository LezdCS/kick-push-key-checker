/** @jsx h */
import { h } from "preact";
import { compileSass } from "../../utils/scss.ts";

interface StatusPageProps {
  latestKey: string;
  latestCluster: string;
  lastTimeUpdated: string;
}

const styles = await compileSass("./views/home/page.scss");

export function StatusPage({ latestKey, latestCluster, lastTimeUpdated }: StatusPageProps) {
  return (
    <html>
      <head>
        <title>Kick Pusher Status</title>
        <style>{styles}</style>
      </head>
      <body>
        <h1>Kick Pusher Status</h1>
        <div class="status">
          <h2>Service Status</h2>
          <p>The service is running and checking for Pusher updates every hour.</p>
        </div>
        <div class="status">
          <h2>Latest Pusher App Key</h2>
          <p>{latestKey}</p>
        </div>
        <div class="status">
          <h2>Latest Pusher Cluster</h2>
          <p>{latestCluster}</p>
        </div>
        <div class="status">
          <h2>Last Time Updated</h2>
          <p>{lastTimeUpdated}</p>
        </div>
      </body>
    </html>
  );
}