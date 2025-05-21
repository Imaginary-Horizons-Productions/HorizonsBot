const { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');

const mainId = "club-config";
module.exports = new CommandWrapper(mainId, "Change the configuration of the current club", null, [InteractionContextType.Guild], 3000,
	/** Send the user an ephemeral message containing club configuration controls */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channel.id, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClubDictionary()[interaction.channelId];
		interaction.reply({
			embeds: [clubEmbedBuilder(club)],
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId(`changeclubinfo${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Name/Description")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId(`changeclubseats${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Members")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId(`changeclubmeeting${SAFE_DELIMITER}${club.id}`)
					.setLabel("Set Meeting Time")
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId("switchclubvoicetype")
					.setLabel(`Switch Voice Channel Type to ${club.voiceType === "private" ? "Stage" : "Private"}`)
					.setStyle(ButtonStyle.Secondary)
			)],
			flags: MessageFlags.Ephemeral
		});
	}
);
