const Command = require('../classes/Command.js');
const { saveObject } = require('../helpers.js');
const { referenceMessages: listMessages, buildListMessagePayload } = require('../engines/referenceEngine.js');
const embed = require("../../config/embeds/rules.json");

const customId = "post-reference";
const options = [
	{
		type: "String", name: "reference", description: "which message to post", required: true, choices: [
			{ name: "the petiton list", value: "petition" },
			{ name: "the club list", value: "club" },
			{ name: "the rules embed", value: "rules" }
		]
	}
];
const subcomands = [];
module.exports = new Command(customId, "Post a reference message in this channel", false, "moderator", options, subcomands);

/** Send a reference message (petitions, clubs, rules) to the receiving channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = async (interaction) => {
	const listType = interaction.options.getString("reference").toLowerCase();
	let messageOptions;
	switch (listType) {
		case "petition":
		case "club":
			messageOptions = await buildListMessagePayload(interaction.guild.memberCount, listType);
			break;
		case "rules":
			messageOptions = { embeds: [embed] };
			break;
	}
	interaction.channel.send(messageOptions).then(message => {
		listMessages[listType] = {
			"messageId": message.id,
			"channelId": message.channelId
		}
		saveObject(listMessages, "referenceMessageIds.json");
	}).catch(console.error);

	interaction.reply({ content: `The ${listType} reference has been posted.`, ephemeral: true })
		.catch(console.error);
}
