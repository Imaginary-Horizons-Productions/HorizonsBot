const Command = require('../classes/Command.js');
const { pressKitEmbedBuilder } = require('../engines/messageEngine.js');

const customId = "press-kit";
const options = [];
const subcommands = [];
module.exports = new Command(customId, "Get info on Imaginary Horizons as a brand", false, null, 3000, options, subcommands);

/** Get info on Imaginary Horizons as a brand
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({ embeds: [pressKitEmbedBuilder()], ephemeral: true });
}
