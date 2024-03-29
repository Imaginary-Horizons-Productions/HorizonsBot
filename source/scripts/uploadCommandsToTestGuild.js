const { REST, Routes } = require('discord.js');
const { token, botId, guildId } = require('../../config/auth.json');
const { commandFiles } = require('../commands/_commandDictionary');

const commands = [];
for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	if (command.builder) {
		commands.push(command.builder.toJSON());
	}
}

const rest = new REST({ version: 9 }).setToken(token);


(async () => {
	try {
		console.log('Started refreshing slash commands on test guild.');

		await rest.put(
			Routes.applicationGuildCommands(botId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded slash commands on test guild.');
	} catch (error) {
		console.error(error);
	}
})();
