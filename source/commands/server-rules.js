const { CommandWrapper } = require('../classes');
const { rulesEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "server-rules";
module.exports = new CommandWrapper(mainId, "Get the server rules", null, false, 3000,
	(interaction) => {
		interaction.reply({ embeds: [rulesEmbedBuilder()], ephemeral: true });
	}
);
