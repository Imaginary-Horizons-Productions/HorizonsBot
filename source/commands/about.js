const Command = require('../classes/Command.js');
const { Interaction } = require('discord.js');
const embed = require("../../config/embeds/about.json");

const options = [];
const subcommands = [];
module.exports = new Command("about", "Get the HorizonsBot credits", false, false, options, subcommands);

/**Private message author with description of the bot and contributors
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({ embeds: [embed], ephemeral: true });
}
