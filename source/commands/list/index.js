const { CommandWrapper } = require('../../classes/index.js');
const { createSubcommandMappings } = require('../../util/fileUtil.js');

const mainId = "list";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, [
	"clubs.js",
	"petitions.js"
]);
module.exports = new CommandWrapper(mainId, "Get the petition or club list", null, true, 3000,
	/** Provide the user the petition or club list as requested */
	(interaction) => {
		subcommandExecuteDictionary[interaction.options.getSubcommand()](interaction);
	}
).setSubcommands(subcommandSlashData);
