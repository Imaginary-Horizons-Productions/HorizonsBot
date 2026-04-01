const { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
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
		interaction.reply({
			embeds: [clubEmbedBuilder(club)],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId(`changeclubdescriptors${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Descriptors")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId(`changeclubimages${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Images")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId(`changeclubmembership${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Membership")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId(`changeclubschedule${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Schedule")
					.setStyle(ButtonStyle.Primary)
			)],
			flags: MessageFlags.Ephemeral
		});
	}
);
