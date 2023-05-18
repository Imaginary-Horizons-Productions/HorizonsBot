const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../classes/Command.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { updateList, updateClub, getClubDictionary } = require('../helpers.js');

const id = "club-leave";
const options = [];
const subcomands = [];
module.exports = new Command(id, "Leave this club", "none", options, subcomands);

/** Do cleanup associated with user leaving a club or topic
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const { user: { id: userId }, channelId } = interaction;
	const club = getClubDictionary()[channelId];
	if (club) {
		if (userId == club.hostId) {
			const buttonsRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId(`delete${SAFE_DELIMITER}${channelId}`)
					.setLabel("Leave")
					.setStyle(ButtonStyle.Danger),
			);
			interaction.reply({ content: "If a club's host leaves, the club will be deleted. Really leave?", components: [buttonsRow], ephemeral: true })
				.catch(console.error);
		} else {
			club.userIds = club.userIds.filter(id => id != userId);
			interaction.channel.permissionOverwrites.delete(interaction.user, `/${id}`)
				.catch(console.error);
			interaction.guild.channels.resolve(club.voiceChannelId).permissionOverwrites.delete(interaction.user, `/${id}`)
				.catch(console.error);
			updateList(interaction.guild.channels, "club");
			updateClub(club);
			interaction.reply(`${interaction.user} has left this channel.`)
				.catch(console.error);
		}
	} else {
		interaction.reply(`Please use the \`/${id}\` command from the club's text channel.`)
			.catch(console.error);
	}
}
