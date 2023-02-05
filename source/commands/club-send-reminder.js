const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');
const { getClubDictionary, sendClubReminder, isModerator } = require("../helpers.js");

const options = [];
const subcommands = [];
module.exports = new Command("club-send-reminder", "(club leader or moderator) Re-post the reminder message for the club's next meeting", false, options, subcommands);

/** Re-post the reminder message for the club's next meeting
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	if (!club) {
		return interaction.reply({ content: "Please send club reminders in the club's text channel.", ephemeral: true });
	}

	if (!isModerator(interaction.user.id) && interaction.user.id !== club.hostId) {
		return interaction.reply({ content: "Promoting a club leader is restricted to the current club leader and Moderators.", ephemeral: true });
	}

	sendClubReminder(club, interaction.guild.channels);
	interaction.reply({ content: "Club reminder sent!", ephemeral: true });
}
