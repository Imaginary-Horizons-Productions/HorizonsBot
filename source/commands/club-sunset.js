const Command = require('../classes/Command.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const id = "club-sunset";
const options = [{ type: "Integer", name: "delay", description: "Number of hours to delay deleting the club", required: true, choices: [] }];
const subcomands = [];
module.exports = new Command(id, "Delete a club on a delay", false, "moderator/club host", options, subcomands);

/** Set a club to be deleted on a delay
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (interaction.channelId in getClubDictionary()) {
		const delay = parseFloat(interaction.options.getInteger("delay"));
		if (delay > 0) {
			interaction.reply(`This club has been scheduled to be deleted in ${delay} hour(s).`)
				.catch(console.error);
			setTimeout(() => {
				interaction.channel.delete(`/${id} by ${interaction.user}`)
					.catch(console.error);
			}, delay * 3600000);
		} else {
			interaction.reply({ content: "Please provide a number of hours that is greater than 0 for the delay.", ephemeral: true });
		}
	} else {
		interaction.reply({ content: `Please use the \`/${id}\` command can only be used on clubs.`, ephemeral: true })
			.catch(console.error);
	}
}
