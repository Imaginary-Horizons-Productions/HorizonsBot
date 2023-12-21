const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { sendClubReminder } = require('../engines/clubEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "club-send-reminder";
module.exports = new CommandWrapper(mainId, "Re-post the reminder message for the club's next meeting", PermissionFlagsBits.ManageMessages, false, 3000,
	/** Re-post the reminder message for the club's next meeting */
	(interaction) => {
		const club = getClubDictionary()[interaction.channelId];
		if (!club.timeslot.nextMeeting) {
			return interaction.reply({ content: 'This club does not have a time set for its next meeting.', ephemeral: true });
		}

		sendClubReminder(club.id, interaction.guild.channels);
		interaction.reply({ content: "Club reminder sent!", ephemeral: true });
	}
);
