import { firebase } from './main.ts'

export async function updateRemoteConfigValue(key: string, value: string) {
	try {
		const remoteConfig = firebase.remoteConfig()

		// Get current template first
		const template = await remoteConfig.getTemplate()

		// Update the parameter value
		template.parameters[key] = {
			defaultValue: {
				value: value,
			},
			valueType: 'STRING',
		}

		// Publish the updated template
		await remoteConfig.publishTemplate(template)
		console.log(
			`%cSuccessfully updated remote config for key: %c${key}%c to value: %c${value}`,
			'color: green',
			'color: blue; font-weight: bold',
			'color: green',
			'color: blue; font-weight: bold',
		)
	} catch (error) {
		console.error(
			'%cError updating remote config: %c%o',
			'color: red; font-weight: bold',
			'color: red',
			error,
		)
		throw error
	}
}
