const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');

const mainId = "club-sunset";
module.exports = new CommandWrapper(mainId, "Delete a club on a delay", null, false, 3000,
	/** Set a club to be deleted on a delay */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: "\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.", ephemeral: true });
			return;
		}

		if (interaction.channelId in getClubDictionary()) {
			const delay = parseFloat(interaction.options.getInteger("delay"));
			if (delay > 0) {
				interaction.reply(`This club has been scheduled to be deleted in ${delay} hour(s).`)
					.catch(console.error);
				setTimeout(() => {
					interaction.channel.delete(`/${mainId} by ${interaction.user}`)
						.catch(console.error);
				}, delay * 3600000);
			} else {
				interaction.reply({ content: "Please provide a number of hours that is greater than 0 for the delay.", ephemeral: true });
			}
		} else {
			interaction.reply({ content: `Please use the \`/${mainId}\` command can only be used on clubs.`, ephemeral: true })
				.catch(console.error);
		}
	}
).setOptions(
	{ type: "Integer", name: "delay", description: "Number of hours to delay deleting the club", required: true, choices: [] }
);
