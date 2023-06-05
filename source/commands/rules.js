const Command = require('../classes/Command.js');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const embed = require("../../config/embeds/rules.json");

const options = [];
const subcommands = [];
module.exports = new Command("rules", "Get the server rules", true, "none", options, subcommands);

/** Private message the server rules to the user
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
