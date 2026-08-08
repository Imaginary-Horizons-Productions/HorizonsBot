const { MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');
const { createClubRecruitmentEvent } = require('../engines/clubEngine.js');

const mainId = "club-kick";
module.exports = new CommandWrapper(mainId, "Remove a user from a club", null, [InteractionContextType.Guild], 3000,
	/** Remove visibility of receiving channel from mentioned user */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClub(interaction.channelId);
		const guildMember = interaction.options.getMember("target");
		const wasBanned = interaction.options.getBoolean("ban");
		guildMember.roles.remove(club.roleId);
		if (wasBanned) {
			club.bannedUserIds.push(guildMember.id);
		}
		interaction.reply({ content: `${guildMember} has been ${wasBanned ? "banned" : "kicked"} from this club.`, flags: MessageFlags.SuppressNotifications })
			.catch(console.error);
		updateClub(club);
		updateListReference(interaction.guild.channels, "club");
		createClubRecruitmentEvent(club, interaction.guild);
	}
).setOptions(
	{ type: "User", name: "target", description: "The user's mention", required: true, choices: [] },
	{ type: "Boolean", name: "ban", description: "Prevent the user from rejoining?", required: false, choices: [] }
);
