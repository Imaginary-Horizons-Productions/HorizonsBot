const { CommandWrapper } = require('../classes');
const { pressKitEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "press-kit";
module.exports = new CommandWrapper(mainId, "Get info on Imaginary Horizons as a brand", null, false, 3000,
	/** Get info on Imaginary Horizons as a brand */
	(interaction) => {
		interaction.reply({ embeds: [pressKitEmbedBuilder()], ephemeral: true });
	}
);
