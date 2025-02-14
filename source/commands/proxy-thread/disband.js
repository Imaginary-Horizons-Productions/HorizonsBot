const { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { referenceMessages } = require("../../engines/referenceEngine");
const { SKIP_INTERACTION_HANDLING } = require("../../constants");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	if (interaction.channel.parentId !== referenceMessages["proxy-thread-info"].channelId) {
		interaction.reply({ content: "This doesn't appear to be a proxy thread.", flags: [MessageFlags.Ephemeral] });
		return;
	}

	interaction.reply({
		content: "Really disband this thread?",
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId(SKIP_INTERACTION_HANDLING)
					.setStyle(ButtonStyle.Danger)
					.setLabel("Disband")
			)
		],
		flags: [MessageFlags.Ephemeral],
		withResponse: true
	}).then(response => response.resource.message).then(reply => {
		const collector = reply.createMessageComponentCollector({ max: 1 });
		collector.on("collect", collectedInteraction => {
			collectedInteraction.channel.delete();
		});
	})
};

module.exports = {
	data: {
		name: "disband",
		description: "Disband a proxy thread"
	},
	executeSubcommand
};
