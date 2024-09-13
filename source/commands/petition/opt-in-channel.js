const { CommandInteraction } = require("discord.js");
const { checkChannelPetition, findOptInChannelWithName } = require("../../engines/customizationEngine");
const { updateListReference } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const channelName = interaction.options.getString("channel-name").toLowerCase().replace(/ /g, "-");
	const dupeChannel = await findOptInChannelWithName(channelName, interaction.guild);
	if (dupeChannel) {
		interaction.reply({ content: `${dupeChannel} already exists. You can use <id:customize> to make it visible.`, ephemeral: true });
		return;
	}

	const stats = await checkChannelPetition(interaction.guild, channelName, interaction.user);
	switch (stats.result) {
		case "signatureAdded":
			interaction.reply({ content: `Your petition has been recorded. ${stats.threshold - stats.petitionCount} more petitions are needed to create the channel.`, ephemeral: true });
			break;
		case "duplicateSignature":
			interaction.reply({ content: `You've already petitioned for a ${channelName} channel.`, ephemeral: true });
			break;
		case "petitionFulfilled":
			interaction.reply({ content: `${stats.channel} has been created.`, ephemeral: true });
			break;
	}
	updateListReference(interaction.guild.channels, "petition");
};

module.exports = {
	data: {
		name: "opt-in-channel",
		description: "Make sure the channel doesn't already exist",
		optionsInput: [
			{
				type: "String",
				name: "channel-name",
				description: "Channel names are forced lowercase by Discord",
				required: true
			}
		]
	},
	executeSubcommand
};
