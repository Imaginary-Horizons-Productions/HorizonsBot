const { CommandWrapper } = require('../classes');
const { createSubcommandMappings } = require('../util/configUtil');

const mainId = "name";
const { slashData: subcommandSlashData, executeDictionary: subcommandExecuteDictionary } = createSubcommandMappings(mainId, []);
module.exports = new CommandWrapper(mainId, "description", null, false, 3000,
	/** Command specifications go here */
	(interaction) => {

	}
).setOptions(
	{
		type: "",
		name: "",
		description: "",
		required: false,
		choices: [] // elements are objects with properties: name, value
	}
).setSubcommands(subcommandSlashData);
