const { InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { rulesEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "server-rules";
module.exports = new CommandWrapper(mainId, "Get the server rules", null, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	(interaction) => {
		interaction.reply({ embeds: [rulesEmbedBuilder()], flags: [MessageFlags.Ephemeral] });
	}
);
