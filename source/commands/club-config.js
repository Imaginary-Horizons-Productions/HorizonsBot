const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "club-config";
const options = [];
const subcommands = [];
module.exports = new CommandWrapper(mainId, "Change the configuration of the current club", PermissionFlagsBits.ManageMessages, false, 3000, options, subcommands,
	/** Send the user an ephemeral message containing club configuration controls */
	(interaction) => {
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
			ephemeral: true
		});
	}
);
