const Command = require('../classes/Command.js');
const embed = require("../../config/embeds/about.json");
const { randomEmbedFooter } = require('../engines/messageEngine.js');

const options = [];
const subcommands = [];
module.exports = new Command("about", "Get the HorizonsBot credits", "none", options, subcommands);

/** Private message the user with a description of the bot and contributors
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	embed.footer = randomEmbedFooter();
	interaction.reply({ embeds: [embed], ephemeral: true });
}
