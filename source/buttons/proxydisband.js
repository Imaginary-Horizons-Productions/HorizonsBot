const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { SKIP_INTERACTION_HANDLING } = require('../constants');

const mainId = "proxydisband";
module.exports = new ButtonWrapper(mainId, 3000,
	(interaction, args) => {
		interaction.reply({
			content: "Really disband this thread?",
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId(SKIP_INTERACTION_HANDLING)
						.setStyle(ButtonStyle.Danger)
						.setLabel("Disband")
				)
			],
			ephemeral: true,
			fetchReply: true
		}).then(reply => {
			const collector = reply.createMessageComponentCollector({ max: 1 });
			collector.on("collect", collectedInteraction => {
				collectedInteraction.channel.delete();
			});
		})
	}
);
