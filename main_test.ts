import { scrapeWebsite } from "./main.ts";

Deno.test(function scrapeWebsiteTest() {
  scrapeWebsite('https://kick.com/xqc');
});


