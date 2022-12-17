const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../classes/Command.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getManagedChannels, updateList, updateClub, getClubDictionary } = require('../helpers.js');

const options = [];
const subcomands = [];
module.exports = new Command("leave", "Leave a topic or club", false, options, subcomands);

module.exports.execute = (interaction) => {
	const { user: { id: userId }, channelId } = interaction;
	if (getManagedChannels().includes(channelId)) {
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
				interaction.channel.permissionOverwrites.delete(interaction.user, "/leave")
					.catch(console.error);
				interaction.guild.channels.resolve(club.voiceChannelId).permissionOverwrites.delete(interaction.user, "/leave")
					.catch(console.error);
				updateList(interaction.guild.channels, "clubs");
				updateClub(club);
				interaction.reply(`${interaction.user} has left this channel.`)
					.catch(console.error);
			}
		} else {
			interaction.channel.permissionOverwrites.delete(interaction.user, "/leave")
				.catch(console.error);
			interaction.reply(`${interaction.user} has left this channel.`)
				.catch(console.error);
		}
	} else {
		interaction.reply(`Could not find a topic or club channel associated with ${channelId}.`)
			.catch(console.error);
	}
}
