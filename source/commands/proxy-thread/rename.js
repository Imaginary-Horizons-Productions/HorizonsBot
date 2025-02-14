const { CommandInteraction, MessageFlags } = require("discord.js");
const { referenceMessages } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	if (interaction.channel.parentId !== referenceMessages["proxy-thread-info"].channelId) {
		interaction.reply({ content: "This doesn't appear to be a proxy thread.", flags: [MessageFlags.Ephemeral] });
		return;
	}

	const newName = interaction.options.getString("new-name");
	interaction.channel.setName(newName);
	interaction.reply({ content: `${interaction.member} renamed this thread to **${newName}**.` });
};

module.exports = {
	data: {
		name: "rename",
		description: "Rename one of your proxy threads",
		optionsInput: [
			{
				type: "String",
				name: "new-name",
				description: "The new name for the channel",
				required: true
			}
		]
	},
	executeSubcommand
};
