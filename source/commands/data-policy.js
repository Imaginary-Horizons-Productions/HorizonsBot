const Command = require('../classes/Command.js');
const embed = require("../../config/embeds/data-policy.json");

const options = [];
const subcomands = [];
module.exports = new Command("data-policy", "Show what user data HorizonsBot collects and how it's used", false, "none", options, subcomands);

/** Show the user the Imaginary Horizons data policy
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({ embeds: [embed], ephemeral: true });
}
