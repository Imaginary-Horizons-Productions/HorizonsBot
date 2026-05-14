const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getClub } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');

const mainId = "club-config";
module.exports = new CommandWrapper(mainId, "Change the configuration of the current club", null, [InteractionContextType.Guild], 3000,
	/** Send the user an ephemeral message containing club configuration controls */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channel.id, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClub(interaction.channelId);
		interaction.reply({ components: [club.asContainer("config")], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
	}
);
