const { MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { updateListReference, getClub } = require('../engines/referenceEngine.js');
const { commandMention } = require('../util/textUtil.js');
const { createClubRecruitmentEvent, cancelClubRecruitmentEvent } = require('../engines/clubEngine.js');

const mainId = "club-leave";
module.exports = new CommandWrapper(mainId, "Leave this club", null, [InteractionContextType.Guild], 3000,
	/** Do cleanup associated with user leaving a club*/
	(interaction) => {
		const club = getClub(interaction.channel.id);
		if (!club) {
			interaction.reply({ content: `Please use the \`/${mainId}\` command from the club's text channel.`, flags: MessageFlags.Ephemeral })
				.catch(console.error);
			return;
		}

		if (interaction.user.id === club.hostId) {
			interaction.reply({ content: `As this club's host, please use ${commandMention("club-sunset")} or ${commandMention("club-promote-host")} instead.`, flags: MessageFlags.Ephemeral })
				.catch(console.error);
			return;
		}

		interaction.member.roles.remove(club.roleId);
		interaction.reply({ content: `${interaction.user} has left this club.`, flags: MessageFlags.SuppressNotifications })
			.catch(console.error);
		updateListReference(interaction.guild.channels, "club");
		cancelClubRecruitmentEvent(club, interaction.guild.scheduledEvents);
		createClubRecruitmentEvent(club, interaction.guild);
	}
);
