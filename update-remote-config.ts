import { firebase } from "./main.ts";

export async function updateRemoteConfigValue(key: string, value: string) {
  try {
    const remoteConfig = firebase.remoteConfig();

    // Get current template first
    const template = await remoteConfig.getTemplate();
    
    // Update the parameter value
    template.parameters[key] = {
      defaultValue: {
        value: value
      },
      valueType: "STRING"
    };

    // Publish the updated template
    await remoteConfig.publishTemplate(template);
    console.log(`Successfully updated remote config value for key: ${key}`);
  } catch (error) {
    console.error("Error updating remote config:", error);
    throw error;
  }
}
