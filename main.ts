/** @jsx h */
import { h } from 'preact'
import admin from 'firebase-admin'
import 'jsr:@std/dotenv/load'
import { updateRemoteConfigValue } from './utils/update-remote-config.ts'
import { connect_pusher } from './utils/kick-websocket.ts'
import { scrapeWebsite } from './utils/scrapper.ts'
import { render } from 'preact-render-to-string'
import { StatusPage } from './views/home/home.tsx'
import { NotFoundPage } from './views/404/page.tsx'

// Constants
const KICK_URL = 'https://kick.com/xqc'
const PORT = 8001
const CRON_SCHEDULE = '0 * * * *'

// State management
const state = {
	latestKey: 'none',
	latestCluster: 'none',
	lastTimeUpdated: 'none',
}

// Initialize Firebase
const initializeFirebase = () => {
	const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(
		/\\n/gm,
		'\n',
	)
	if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set')

	const config = {
		credential: admin.credential.cert({
			clientEmail: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
			privateKey,
			projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
		}),
	}

	return admin.apps.length ? admin.app() : admin.initializeApp(config)
}

export const firebase = initializeFirebase()

// Main function to update Pusher configuration
export async function updatePusherConfig() {
	try {
		const { pusherAppKey, pusherCluster } = await scrapeWebsite(KICK_URL)
		if (!pusherAppKey || !pusherCluster) {
			throw new Error('No Pusher App Key or Cluster found')
		}

		await connect_pusher(pusherAppKey, pusherCluster)
		console.log('%c🔌 Connected to Pusher successfully! ✅', 'color: green')

		const remoteConfigKey = Deno.env.get('REMOTE_CONFIG_KEY')
		if (!remoteConfigKey) {
			throw new Error('REMOTE_CONFIG_KEY is not set')
		}

		await updateRemoteConfigValue(remoteConfigKey, pusherAppKey)

		// Update state
		Object.assign(state, {
			latestKey: pusherAppKey,
			latestCluster: pusherCluster,
			lastTimeUpdated: new Date().toISOString(),
		})
	} catch (error) {
		console.error('Error updating Pusher config:', error)
	}
}

// Request handler
const handleRequest = (req: Request) => {
	const isHome = req.url.endsWith('/')
	const { latestKey, latestCluster, lastTimeUpdated } = state

	if (isHome) {
		return new Response(
			render(
				h(StatusPage, { latestKey, latestCluster, lastTimeUpdated }),
			),
			{ headers: { 'content-type': 'text/html' } },
		)
	}

	return new Response(
		render(h(NotFoundPage, {})),
		{ status: 404, headers: { 'content-type': 'text/html' } },
	)
}

// Initial run
await updatePusherConfig()

// Schedule hourly updates
Deno.cron('Check for new Pusher App Key', CRON_SCHEDULE, updatePusherConfig)

// Start HTTP server
Deno.serve({ port: PORT }, handleRequest)
