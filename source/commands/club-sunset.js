const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');
const { InteractionContextType, MessageFlags } = require('discord.js');

const mainId = "club-sunset";
module.exports = new CommandWrapper(mainId, "Remove a club's voice channel and remove it from the club dictionary on a delay", null, [InteractionContextType.Guild], 3000,
	/** Set a club to be deleted on a delay */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClubDictionary()[interaction.channelId];
		if (club) {
			const delay = parseFloat(interaction.options.getInteger("delay"));
			if (delay > 0) {
				interaction.reply(`This club has been scheduled to be archived in ${delay} hour(s).`)
					.catch(console.error);
				setTimeout(() => {
					const voiceChannel = guild.channels.resolve(club.voiceChannelId);
					if (voiceChannel) {
						voiceChannel.delete();
						removeClub(id, guild.channels);
					}
				}, delay * 3600000);
			} else {
				interaction.reply({ content: "Please provide a number of hours that is greater than 0 for the delay.", flags: MessageFlags.Ephemeral });
			}
		} else {
			interaction.reply({ content: `Please use the \`/${mainId}\` command can only be used on clubs.`, flags: MessageFlags.Ephemeral })
				.catch(console.error);
		}
	}
).setOptions(
	{ type: "Integer", name: "delay", description: "Number of hours to delay archiving the club", required: true, choices: [] }
);
