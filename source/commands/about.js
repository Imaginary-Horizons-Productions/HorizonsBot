const { EmbedBuilder } = require('discord.js');
const Command = require('../classes/Command.js');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const { imaginaryHorizonsIconURL } = require('../constants.js');

const customId = "about";
const options = [];
const subcommands = [];
module.exports = new Command(customId, "Get the HorizonsBot credits", false, null, 3000, options, subcommands);

/** Get the HorizonsBot credits
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	interaction.reply({
		embeds: [
			new EmbedBuilder().setColor(7045611)
				.setAuthor({
					"name": "Click here to visit HorizonsBot's GitHub",
					"iconURL": imaginaryHorizonsIconURL,
					"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
				})
				.setTitle("HorizonsBot v2.3.0")
				.setDescription("HorizonsBot helps with channel management and other stuff on the Imaginary Horizons Community Discord.")
				.addFields({
					"name": "Design & Engineering",
					"value": "Nathaniel Tseng ( <@106122478715150336> | [GitHub](https://github.com/ntseng) )"
				},
					{
						"name": "Dice Roller",
						"value": "Lucas Ensign ( <@112785244733628416> | [Twitter](https://twitter.com/SillySalamndr) )"
					}
				)
				.setFooter(randomEmbedFooter())
		],
		ephemeral: true
	})
}
