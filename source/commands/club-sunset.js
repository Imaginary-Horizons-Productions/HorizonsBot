const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "club-sunset";
module.exports = new CommandWrapper(mainId, "Delete a club on a delay", PermissionFlagsBits.ManageMessages, false, 3000,
	/** Set a club to be deleted on a delay */
	(interaction) => {
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
