const { ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Select = require('../classes/Select.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { SAFE_DELIMITER } = require('../constants.js');

module.exports = new Select("clubList",
	/** Provide club details embed to the user for the selected clubs */
	(interaction, args) => {
		const clubs = getClubDictionary();
		interaction.values.forEach(channelId => {
			const club = clubs[channelId];
			interaction.user.send({
				embeds: [clubEmbedBuilder(club)], components: [new ActionRowBuilder(
					{
						components: [
							new ButtonBuilder({
								custom_id: `join${SAFE_DELIMITER}${club.id}`,
								label: `Join ${club.title}`,
								style: ButtonStyle.Success
							})
						]
					}
				)]
			})
		})
		interaction.reply({ content: "Club details have been sent.", ephemeral: true });
	}
);
