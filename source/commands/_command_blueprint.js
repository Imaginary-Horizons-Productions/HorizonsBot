const { CommandWrapper } = require('../classes');

const mainId = "name";
const options = [
	{
		type: "",
		name: "",
		description: "",
		required: false,
		choices: [] // elements are objects with properties: name, value
	}
];
const subcommands = [
	{
		name: "",
		description: "",
		optionsInput: [
			{
				type: "",
				name: "",
				description: "",
				required: false,
				choices: [] // elements are objects with properties: name, value
			}
		]
	}
];
module.exports = new CommandWrapper(mainId, "description", null, false, 3000, options, subcommands,
	/** Command specifications go here */
	(interaction) => {

	}
);
