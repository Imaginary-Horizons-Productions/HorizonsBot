const Command = require('../classes/Command.js');
const { Interaction } = require('discord.js');
const embed = require("../../config/embeds/rules.json");

const options = [];
const subcommands = [];
module.exports = new Command("rules", "Get the server rules", false, options, subcommands);

/** Private message the server rules to the user
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({ embeds: [embed], ephemeral: true });
}
