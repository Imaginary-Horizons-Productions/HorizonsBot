const { CommandWrapper } = require('../classes');
const { checkPetition, getTopicNames } = require('../engines/referenceEngine.js');

const mainId = "petition";
const options = [
	{ type: "String", name: "topic-name", description: "Make sure the topic doesn't already exist", required: true, choices: [] }
];
const subcomands = [];
module.exports = new CommandWrapper(mainId, "Petition for a topic text channel", null, false, 3000, options, subcomands,
	/** Record a user's petition for a text channel, create channel if sufficient number of petitions */
	(interaction) => {
		const topicName = interaction.options.getString("topic-name").toLowerCase();
		if (!getTopicNames().includes(topicName)) {
			checkPetition(interaction.guild, topicName, interaction.user);
			interaction.reply(`Your petition for a **${topicName}** text channel has been recorded!`)
				.catch(console.error);
		} else {
			interaction.reply({ content: `A channel for ${topicName} already exists, you can use the Channels & Roles Browser to make it visible.`, ephemeral: true })
				.catch(console.error);
		}
	}
);
