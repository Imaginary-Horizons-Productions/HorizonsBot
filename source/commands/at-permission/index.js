const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../../classes/InteractionWrapper.js');
const { createSubcommandMappings } = require('../../util/fileUtil.js');
const { isModerator } = require('../../engines/permissionEngine.js');

const mainId = "at-permission";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, [
	"allow.js",
	"disallow.js"
]);
module.exports = new CommandWrapper(mainId, "Disallow/Re-allow a user to use /at-channel", PermissionFlagsBits.ManageRoles, false, 3000,
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const userId = interaction.options.getUser("user").id;
		subcommandExecuteDictionary[interaction.options.getSubcommand()](interaction, userId);
	}
).setSubcommands(subcommandSlashData);
