const Command = require('../classes/Command.js');

const options = [];
const subcommands = [];
module.exports = new Command("commands", "Get a link to HorizonsBot's commands page", true, null, 3000, options, subcommands);

module.exports.execute = (interaction) => {
	interaction.reply({ content: "Here's a link to the HorizonsBot Commands page (automatically updated): https://github.com/Imaginary-Horizons-Productions/HorizonsBot/wiki/Commands", ephemeral: true });
}
