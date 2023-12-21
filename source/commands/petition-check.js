const { CommandWrapper } = require('../classes');
const { checkPetition } = require('../engines/referenceEngine.js');

const mainId = "petition-check";
module.exports = new CommandWrapper(mainId, "Check how many more petitions a topic needs", null, false, 3000,
	/** Check if the given petition has enough support to make into a channel */
	(interaction) => {
		const topicName = interaction.options.getString("topic").toLowerCase();
		const { petitions, threshold } = checkPetition(interaction.guild, topicName);
		interaction.reply({ content: `The petition for ${topicName} has ${petitions} petitions (needs ${threshold}).`, ephemeral: true });
	}
).setOptions(
	{ type: "String", name: "topic", description: "The petition to check", required: true, choices: [] }
);
