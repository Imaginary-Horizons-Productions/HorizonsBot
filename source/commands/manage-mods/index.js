const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../../classes/index.js');
const { createSubcommandMappings } = require('../../util/fileUtil.js');
const { isModerator } = require('../../engines/permissionEngine.js');

const mainId = "manage-mods";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, [
	"promote.js",
	"demote.js"
]);
module.exports = new CommandWrapper(mainId, "Promote/demote a user to moderator", PermissionFlagsBits.ManageGuild, false, 3000,
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		subcommandExecuteDictionary[interaction.options.getSubcommand()](interaction);
	}
).setSubcommands(subcommandSlashData);
