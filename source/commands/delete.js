const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');
const { isModerator, getManagedChannels } = require('../helpers.js');

const options = [{ type: "Integer", name: "delay", description: "Number of hours to delay deleting the channel", required: true, choices: [] }];
const subcomands = [];
module.exports = new Command("delete", "(moderator) Delete a topic or club on a delay", true, options, subcomands);

/** Set a topic or club channel to be deleted on a delay
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (isModerator(interaction.user.id)) {
		if (getManagedChannels().includes(interaction.channelId)) {
			const delay = parseFloat(interaction.options.getInteger("delay"));
			if (delay > 0) {
				interaction.reply(`This channel has been scheduled to be deleted in ${delay} hour(s).`)
					.catch(console.error);
				setTimeout(() => {
					interaction.channel.delete()
						.catch(console.error);
				}, delay * 3600000);
			} else {
				interaction.reply({ content: "Please provide a number of hours that is greater than 0 for the delay.", ephemeral: true });
			}
		} else {
			interaction.reply({ content: "The delete command can only be used on topic or club channels.", ephemeral: true })
				.catch(console.error);
		}
	} else {
		interaction.reply({ content: "Deleting channels is restricted to Moderators.", ephemeral: true })
			.catch(console.error);
	}
}
