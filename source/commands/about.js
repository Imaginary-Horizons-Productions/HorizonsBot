const fs = require("fs");
const { EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const { imaginaryHorizonsIconURL } = require('../constants.js');

const mainId = "about";
module.exports = new CommandWrapper(mainId, "Get the HorizonsBot credits", null, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	(interaction) => {
		fs.promises.stat(__filename).then(stats => {
			interaction.reply({
				embeds: [
					new EmbedBuilder().setColor(7045611)
						.setAuthor({
							"name": "Click here to visit HorizonsBot's GitHub",
							"iconURL": imaginaryHorizonsIconURL,
							"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
						})
						.setTitle("HorizonsBot v2.8.0")
						.setDescription("HorizonsBot helps with channel management and other stuff on the Imaginary Horizons Community Discord.")
						.addFields({
							"name": "Design & Engineering",
							"value": "Nathaniel Tseng ( <@106122478715150336> | [GitHub](https://github.com/ntseng) )"
						},
							{
								"name": "Dice Roller",
								"value": "Lucas Ensign ( <@112785244733628416> )"
							}
						)
						.setFooter(randomEmbedFooter())
						.setTimestamp(stats.mtime)
				],
				flags: MessageFlags.Ephemeral
			});
		})
	}
);
