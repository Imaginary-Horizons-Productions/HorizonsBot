const Command = require('../classes/Command.js');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const embed = require("../../config/embeds/roles.json");

const options = [];
const subcommands = [];
module.exports = new Command("roles", "Get a rundown of the server's roles", "none", options, subcommands);

/** Private message the user with roles info
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
