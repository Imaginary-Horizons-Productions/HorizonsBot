const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary, updateClub, updateListReference } = require('../engines/referenceEngine.js');

const mainId = "club-leave";
module.exports = new CommandWrapper(mainId, "Leave this club", null, [InteractionContextType.Guild], 3000,
	/** Do cleanup associated with user leaving a club or topic */
	(interaction) => {
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
				interaction.channel.permissionOverwrites.delete(interaction.user, `/${mainId}`)
					.catch(console.error);
				if (club.voiceType === "private") {
					interaction.guild.channels.resolve(club.voiceChannelId).permissionOverwrites.delete(interaction.user, `/${mainId}`)
						.catch(console.error);
				}
				updateListReference(interaction.guild.channels, "club");
				updateClub(club);
				interaction.reply({ content: `${interaction.user} has left this channel.`, flags: MessageFlags.SuppressNotifications })
					.catch(console.error);
			}
		} else {
			interaction.reply(`Please use the \`/${mainId}\` command from the club's text channel.`)
				.catch(console.error);
		}
	}
);
