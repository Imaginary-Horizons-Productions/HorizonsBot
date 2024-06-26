const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../../classes/InteractionWrapper.js');
const { createSubcommandMappings } = require('../../util/fileUtil.js');

const mainId = "proxy-thread";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, [
	"create.js",
	"disband.js",
	"rename.js"
]);
module.exports = new CommandWrapper(mainId, "Manage proxy threads", PermissionFlagsBits.SendMessagesInThreads, false, 3000,
	(interaction) => {
		subcommandExecuteDictionary[interaction.options.getSubcommand()](interaction);
	}
).setSubcommands(subcommandSlashData);
