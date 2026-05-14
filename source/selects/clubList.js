const { MessageFlags } = require('discord.js');
const { SelectWrapper } = require('../classes');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "clubList";
module.exports = new SelectWrapper(mainId, 3000,
	/** Provide club details embed to the user for the selected clubs */
	(interaction, args) => {
		const clubs = getClubDictionary();
		interaction.reply({
			components: interaction.values.map(channelId => {
				const club = clubs[channelId];
				return club.asContainer(club.hasGuildMember(interaction.user.id) ? "info" : "invite");
			}),
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
		});
	}
);
