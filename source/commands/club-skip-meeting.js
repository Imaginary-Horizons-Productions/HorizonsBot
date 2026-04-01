const { InteractionContextType, MessageFlags, time } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { cancelClubRecruitmentEvent, createClubRecruitmentEvent, clearClubReminder, scheduleClubReminder, updateClubDetails } = require('../engines/clubEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../util/mathUtil.js');

const mainId = "club-skip-meeting";
module.exports = new CommandWrapper(mainId, "Skip the next club meeting, cancelling/resetting reminders", null, [InteractionContextType.Guild], 3000,
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClub(interaction.channelId);
		cancelClubRecruitmentEvent(club, interaction.guild.scheduledEvents);
		clearClubReminder(club.id);

		let content = "This club's next meeting will be skipped.";
		switch (club.timeslot.repeatType) {
			case "weekly":
				club.timeslot.nextMeeting += timeConversion(1, "w", "s");
				createClubRecruitmentEvent(club, interaction.guild);
				scheduleClubReminder(club.id, club.timeslot.nextMeeting, interaction.guild.channels);
				content += `The next meeting will instead be ${time(club.timeslot.nextMeeting)}.`;
				break;
			default:
				club.timeslot.nextMeeting = null;
		}
		updateClubDetails(club, interaction.channel);
		updateListReference(interaction.guild.channels, "club");
		updateClub(club);
		interaction.reply({ content });
	}
);
