const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { addTopicChannel } = require('../engines/referenceEngine.js');
const { isModerator } = require('../engines/permissionEngine.js');

const mainId = "topic-add";
module.exports = new CommandWrapper(mainId, "Set up a topic", PermissionFlagsBits.ManageChannels, false, 3000,
	/** Creates a new text channel and add it to list of topic channels (to prevent duplicate petitions) */
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const channelName = interaction.options.getString('topic-name');
		addTopicChannel(interaction.guild, channelName).then(channel => {
			interaction.reply(`A new topic channel has been created: ${channel}`)
				.catch(console.error);
		});
	}
).setOptions(
	{ type: "String", name: "topic-name", description: "The new topic", required: true, choices: [] }
);
