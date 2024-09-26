const { InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');

const mainId = "commands";
module.exports = new CommandWrapper(mainId, "Get a link to HorizonsBot's commands page", null, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	(interaction) => {
		interaction.reply({ content: "Here's a link to the HorizonsBot Commands page (automatically updated): https://github.com/Imaginary-Horizons-Productions/HorizonsBot/wiki/Commands", ephemeral: true });
	}
);
