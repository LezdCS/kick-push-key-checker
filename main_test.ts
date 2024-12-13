import { scrapeWebsite } from "./scrapper.ts";

Deno.test(function scrapeWebsiteTest() {
  scrapeWebsite('https://kick.com/xqc');
});


