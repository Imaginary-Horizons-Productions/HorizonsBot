const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../classes/Command.js');
const { getClubDictionary } = require("../helpers.js");
const { SAFE_DELIMITER } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');

const options = [];
const subcommands = [];
module.exports = new Command("club-config", "Change the configuration of the current club", "moderator/club host", options, subcommands);

/** Send the user an ephemeral message containing club configuration controls
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
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
				.setStyle(ButtonStyle.Primary)
		)],
		ephemeral: true
	});
}
