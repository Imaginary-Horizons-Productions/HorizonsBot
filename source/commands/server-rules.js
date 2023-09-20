const { CommandWrapper } = require('../classes');
const { rulesEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "server-rules";
const options = [];
const subcommands = [];
module.exports = new CommandWrapper(mainId, "Get the server rules", null, false, 3000, options, subcommands,
	/** Get the server rules */
	(interaction) => {
		interaction.reply({ embeds: [rulesEmbedBuilder()], ephemeral: true });
	}
);
