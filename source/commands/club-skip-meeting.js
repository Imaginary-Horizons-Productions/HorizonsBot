const { CommandWrapper } = require('../classes/index.js');
const { cancelClubEvent, createClubEvent, clearClubReminder, scheduleClubReminderAndEvent, updateClubDetails } = require('../engines/clubEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');
const { getClubDictionary, updateClub, updateList } = require('../engines/referenceEngine.js');
const { timeConversion } = require('../helpers.js');

const mainId = "club-skip-meeting";
module.exports = new CommandWrapper(mainId, "Skip the next club meeting, cancelling/resetting reminders", null, false, 3000,
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, ephemeral: true });
			return;
		}

		const club = getClubDictionary()[interaction.channelId];
		cancelClubEvent(club, interaction.guild.scheduledEvents);
		clearClubReminder(club.id);

		if (club.timeslot.periodCount && club.timeslot.periodUnits) {
			club.timeslot.nextMeeting += timeConversion(club.timeslot.periodCount, club.timeslot.periodUnits[0], "s");
			createClubEvent(club, interaction.guild);
			scheduleClubReminderAndEvent(club.id, club.timeslot.nextMeeting, interaction.guild.channels);
		} else {
			club.timeslot.nextMeeting = null;
		}
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "club");
		updateClub(club);
		interaction.reply({ content: `This club's next meeting will be skipped.${club.timeslot.periodCount && club.timeslot.periodUnits ? `The next meeting will instead be <t:${club.timeslot.nextMeeting}>.` : ""}` });
	}
);
