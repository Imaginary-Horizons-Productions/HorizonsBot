const Command = require('../classes/Command.js');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const embed = require("../../config/embeds/press-kit.json");

const options = [];
const subcommands = [];
module.exports = new Command("press-kit", "Get info on Imaginary Horizons as a brand", "none", options, subcommands);

/** Private message user with IHC brand info
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
