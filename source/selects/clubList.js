const { MessageFlags } = require('discord.js');
const { SelectWrapper } = require('../classes');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "clubList";
module.exports = new SelectWrapper(mainId, 3000,
	/** Provide club details embed to the user for the selected clubs */
	async (interaction, args) => {
		const clubs = getClubDictionary();
		const components = [];
		for (const channelId of interaction.values) {
			const club = clubs[channelId];
			components.push(club.asContainer(club.hasGuildMember(interaction.user.id) ? "info" : "invite", (await interaction.guild.roles.fetch(club.roleId)).members.size));
		}
		interaction.reply({ components, flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
	}
);
