const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { SelectWrapper } = require('../classes');
const { getClubDictionary } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "clubList";
module.exports = new SelectWrapper(mainId, 3000,
	/** Provide club details embed to the user for the selected clubs */
	(interaction, args) => {
		const clubs = getClubDictionary();
		const embeds = [];
		const options = [];
		interaction.values.forEach(channelId => {
			const club = clubs[channelId];
			embeds.push(clubEmbedBuilder(club));
			options.push({
				label: club.title,
				value: club.id
			})
		});
		interaction.reply({
			content: "Here are the summaries of the clubs you've selected:",
			embeds,
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder().setCustomId("joinclubs")
						.setMaxValues(options.length)
						.setOptions(options)
						.setPlaceholder("Join club(s)…")
				)
			],
			flags: [MessageFlags.Ephemeral]
		});
	}
);
