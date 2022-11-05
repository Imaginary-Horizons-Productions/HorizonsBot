const Command = require('../classes/Command.js');
const { versionEmbedBuilder } = require('../helpers.js');

const options = [
	{ type: "Boolean", name: "full-notes", description: "Get the file with the full version notes?", required: true, choices: [] }
];
const subcomands = [];
module.exports = new Command("version", "Get HorizonsBot's version notes", false, false, options, subcomands);

module.exports.execute = (interaction) => {
	// Send version information
	if (interaction.options.getBoolean("full-notes")) {
		interaction.reply({
			content: "Here are all the changes so far: ",
			files: [{
				attachment: "./ChangeLog.md",
				name: 'HorizonsBotChangeLog.md'
			}],
			ephemeral: true
		});
	} else {
		versionEmbedBuilder().then(embed => {
			interaction.reply({ embeds: [embed], ephemeral: true });
		}).catch(console.error);
	}
}
