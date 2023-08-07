const { REST, Routes } = require('discord.js');
const { token, botId, guildId } = require('../../config/auth.json');

const rest = new REST({ version: 9 }).setToken(token);

(async () => {
	try {
		console.log('Started clearing slash commands.');

		if (botId) {
			await rest.put(Routes.applicationCommands(botId), { body: [] });

			if (guildId) {
				await rest.put(
					Routes.applicationGuildCommands(botId, guildId),
					{ body: [] },
				);
			}
		} else {
			throw new Error("Could not clear commands due to botId missing from config")
		}

		console.log('Successfully cleared slash commands.');
	} catch (error) {
		console.error(error);
	}
})();
