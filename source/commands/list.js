const { CommandWrapper } = require('../classes');
const { buildListMessagePayload } = require('../engines/referenceEngine.js');

const mainId = "list";
const options = [
	{ type: "String", name: "list-type", description: "The list to get", required: true, choices: [{ name: "Get the list of open topic petitions", value: "petition" }, { name: "Get the list of clubs on the server", value: "club" }] },
];
const subcomands = [];
module.exports = new CommandWrapper(mainId, "Get the petition or club list", null, true, 3000, options, subcomands,
	/** Provide the user the petition or club list as requested */
	(interaction) => {
		const listType = interaction.options.getString("list-type").toLowerCase();
		buildListMessagePayload(interaction.guild.memberCount, listType).then(messageOptions => {
			messageOptions.ephemeral = true;
			interaction.reply(messageOptions);
		}).catch(console.error);
	}
);
