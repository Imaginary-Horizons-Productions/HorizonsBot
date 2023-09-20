const { CommandWrapper } = require('../classes');
const { versionEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "version";
const options = [
	{ type: "Boolean", name: "full-notes", description: "Get the file with the full version notes?", required: true, choices: [] }
];
const subcomands = [];
module.exports = new CommandWrapper(mainId, "Get HorizonsBot's version notes", null, true, 3000, options, subcomands,
	/** Send version information */
	(interaction) => {
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
);
