const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { addTopicChannel } = require('../engines/referenceEngine.js');

const mainId = "topic-add";
const options = [
	{ type: "String", name: "topic-name", description: "The new topic", required: true, choices: [] },
];
const subcomands = [];
module.exports = new CommandWrapper(mainId, "Set up a topic", PermissionFlagsBits.ManageChannels, false, 3000, options, subcomands,
	/** Creates a new text channel and add it to list of topic channels (to prevent duplicate petitions) */
	(interaction) => {
		const channelName = interaction.options.getString('topic-name');
		addTopicChannel(interaction.guild, channelName).then(channel => {
			interaction.reply(`A new topic channel has been created: ${channel}`)
				.catch(console.error);
		});
	}
);
