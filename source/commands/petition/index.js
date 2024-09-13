const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../../classes/index.js');
const { createSubcommandMappings } = require('../../util/fileUtil.js');

const mainId = "petition";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, [
	"pingable-role.js",
	"opt-in-channel.js"
]);
module.exports = new CommandWrapper(mainId, "Allows server members to petition for text-channels or pingable roles", PermissionFlagsBits.SendMessages, false, 3000,
	(interaction) => {
		subcommandExecuteDictionary[interaction.options.getSubcommand()](interaction);
	}
).setSubcommands(subcommandSlashData);
