const Command = require('../classes/Command.js');
const { getClubDictionary, sendClubReminder } = require("../helpers.js");

const options = [];
const subcommands = [];
module.exports = new Command("club-send-reminder", "Re-post the reminder message for the club's next meeting", "moderator/club host", options, subcommands);

/** Re-post the reminder message for the club's next meeting
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	if (!club.timeslot.nextMeeting) {
		return interaction.reply({ content: 'This club does not have a time set for its next meeting.', ephemeral: true });
	}

	sendClubReminder(club.id, interaction.guild.channels);
	interaction.reply({ content: "Club reminder sent!", ephemeral: true });
}
