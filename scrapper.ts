import puppeteer from 'puppeteer-extra'
import stealthPlugin from 'puppeteer-extra-plugin-stealth'

interface PusherConfig {
	pusherAppKey: string | null
	pusherCluster: string | null
}

export async function scrapeWebsite(url: string): Promise<PusherConfig> {
	// Pre-compile regex patterns
	const PUSHER_APP_KEY_REGEX = /app\/([a-f0-9]{20})/
	const PUSHER_CLUSTER_REGEX = /ws-([a-z0-9]+)\.pusher\.com/

	try {
		// Initialize puppeteer with stealth plugin
		const browser = await puppeteer
			.default
			.use(stealthPlugin())
			.launch({
				headless: true, // Use new headless mode
				args: ['--no-sandbox', '--disable-setuid-sandbox'], // Better compatibility
				// browserWSEndpoint: "wss://", TODO: Use ScrapingFish service so we can deploy this project on serverless
			})

		const page = await browser.newPage()
		const cdp = await page.target().createCDPSession()

		// Enable required CDP domains in parallel
		await Promise.all([
			cdp.send('Network.enable'),
			cdp.send('Page.enable'),
		])

		const config: PusherConfig = {
			pusherAppKey: null,
			pusherCluster: null,
		}

		cdp.on('Network.webSocketCreated', ({ url }) => {
			// Check for app key
			const appKeyMatch = url.match(PUSHER_APP_KEY_REGEX)
			if (appKeyMatch) {
				config.pusherAppKey = appKeyMatch[1]
				console.log(
					'%cPusher App Key: %c%s',
					'color: green',
					'color: blue; font-weight: bold',
					config.pusherAppKey,
				)
			}

			// Check for cluster
			const clusterMatch = url.match(PUSHER_CLUSTER_REGEX)
			if (clusterMatch) {
				config.pusherCluster = clusterMatch[1]
				console.log(
					'%cPusher Cluster: %c%s',
					'color: green',
					'color: blue; font-weight: bold',
					config.pusherCluster,
				)
			}
		})

		await page.goto(url, {
			waitUntil: 'networkidle0', // Wait until network is idle
			timeout: 30000, // 30 second timeout
		})

		await browser.close()
		return config
	} catch (error) {
		console.error('Scraping failed:', error)
		throw error
	}
}
