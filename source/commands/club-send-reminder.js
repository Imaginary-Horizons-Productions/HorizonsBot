const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { sendClubReminder } = require('../engines/clubEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "club-send-reminder";
module.exports = new CommandWrapper(mainId, "Re-post the reminder message for the club's next meeting", null, [InteractionContextType.Guild], 3000,
	/** Re-post the reminder message for the club's next meeting */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClubDictionary()[interaction.channelId];
		if (!club.timeslot.nextMeeting) {
			return interaction.reply({ content: 'This club does not have a time set for its next meeting.', flags: MessageFlags.Ephemeral });
		}

		sendClubReminder(club.id, interaction.guild.channels);
		interaction.reply({ content: "Club reminder sent!", flags: MessageFlags.Ephemeral });
	}
);
