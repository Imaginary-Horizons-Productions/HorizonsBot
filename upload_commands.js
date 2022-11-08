const { REST, Routes } = require('discord.js');
const { token, testBotId, testGuildId } = require('./config/auth.json');
const { commandFiles } = require('./source/commands/_commandDictionary');

const commands = [];
for (const file of commandFiles) {
	const command = require(`./source/commands/${file}`);
	if (command.data) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST({ version: 10 }).setToken(token);


(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(testBotId, testGuildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
