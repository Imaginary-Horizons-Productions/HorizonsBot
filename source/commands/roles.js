const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');
const embed = require("../../config/embeds/roles.json");
const { randomEmbedFooter } = require('../helpers.js');

const options = [];
const subcommands = [];
module.exports = new Command("roles", "Get a rundown of the server's roles", false, options, subcommands);

/** Private message the user with roles info
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
