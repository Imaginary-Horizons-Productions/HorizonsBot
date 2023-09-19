const Command = require('../classes/Command.js');
const { rulesEmbedBuilder } = require('../engines/messageEngine.js');

const customId = "server-rules";
const options = [];
const subcommands = [];
module.exports = new Command(customId, "Get the server rules", false, null, 3000, options, subcommands);

/** Get the server rules
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({ embeds: [rulesEmbedBuilder()], ephemeral: true });
}
