const { Interaction } = require('discord.js');
const Command = require('../classes/Command.js');
const { randomEmbedFooter } = require('../controllers/messageController.js');
const embed = require("../../config/embeds/rules.json");

const options = [];
const subcommands = [];
module.exports = new Command("rules", "Get the server rules", false, options, subcommands);

/** Private message the server rules to the user
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
