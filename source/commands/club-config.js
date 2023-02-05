const { Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../classes/Command.js');
const { getClubDictionary, clubInviteBuilder } = require("../helpers.js");
const { SAFE_DELIMITER } = require('../constants.js');

const options = [];
const subcommands = [];
module.exports = new Command("club-config", "(club leader or moderator) Change the configuration of the current club", false, options, subcommands);

/** Send the user an ephemeral message containing club configuration controls
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	if (club) {
		const { embeds } = clubInviteBuilder(club);
		const components = [new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`changeclubinfo${SAFE_DELIMITER}${club.id}`)
				.setLabel("Set Name/Description")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId(`changeclubseats${SAFE_DELIMITER}${club.id}`)
				.setLabel("Set Members")
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId(`changeclubmeeting${SAFE_DELIMITER}${club.id}`)
				.setLabel("Set Meeting Time")
				.setStyle(ButtonStyle.Primary)
		)];
		interaction.reply({ embeds, components, ephemeral: true });
	} else {
		interaction.reply({ content: "Please configure club settings from the club's text channel.", ephemeral: true });
	}
}
