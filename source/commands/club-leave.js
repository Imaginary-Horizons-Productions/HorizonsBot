const { MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { commandMention } = require('../util/textUtil.js');
const { createClubRecruitmentEvent } = require('../engines/clubEngine.js');

const mainId = "club-leave";
module.exports = new CommandWrapper(mainId, "Leave this club", null, [InteractionContextType.Guild], 3000,
	/** Do cleanup associated with user leaving a club or topic */
	(interaction) => {
		const { user: { id: userId }, channelId } = interaction;
		const club = getClub(channelId);
		if (club) {
			if (userId == club.hostId) {
				interaction.reply({ content: `As this club's host, please use ${commandMention("club-sunset")} or ${commandMention("club-promote-host")} instead.`, flags: MessageFlags.Ephemeral })
					.catch(console.error);
			} else {
				club.userIds = club.userIds.filter(id => id != userId);
				interaction.channel.permissionOverwrites.delete(interaction.user, `/${mainId}`)
					.catch(console.error);
				interaction.guild.channels.resolve(club.voiceChannelId).permissionOverwrites.delete(interaction.user, `/${mainId}`)
					.catch(console.error);
				updateClub(club);
				interaction.reply({ content: `${interaction.user} has left this club.`, flags: MessageFlags.SuppressNotifications })
					.catch(console.error);
				updateListReference(interaction.guild.channels, "club");
				createClubRecruitmentEvent(club, interaction.guild);
			}
		} else {
			interaction.reply(`Please use the \`/${mainId}\` command from the club's text channel.`)
				.catch(console.error);
		}
	}
);
