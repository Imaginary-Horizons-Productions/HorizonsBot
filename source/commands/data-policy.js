const { PermissionFlagsBits } = require('discord.js');
const Command = require('../classes/Command');

const customId = "data-policy";
const options = [];
const subcommands = [];
module.exports = new Command(customId, "Get a link to the HorizonsBot's Data Policy page", true, PermissionFlagsBits.ViewChannel, 3000, options, subcommands,
	/** Send the user a link to the Data Policy wiki page */
);

module.exports.execute = (interaction) => {
	interaction.reply({ content: "Here's a link to the HorizonsBot Data Policy page (automatically updated): https://github.com/Imaginary-Horizons-Productions/HorizonsBot/wiki/Data-Policy", ephemeral: true });
}
