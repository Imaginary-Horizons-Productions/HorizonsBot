const Command = require('../classes/Command.js');
const { listMessages, buildListMessagePayload } = require('../engines/referenceEngine.js');
const { saveObject } = require('../helpers.js');

const id = "pin-list";
const options = [
	{ type: "String", name: "list-type", description: "The list to pin", required: true, choices: [{ name: "Pin the petiton list", value: "petition" }, { name: "Pin the club list", value: "club" }] }
];
const subcomands = [];
module.exports = new Command(id, "Pin the petition or club list message in this channel", "moderator", options, subcomands);

/** Pin the list message for open petitions or clubs to the receiving channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const listType = interaction.options.getString("list-type").toLowerCase();
	buildListMessagePayload(interaction.guild.memberCount, listType).then(messageOptions => {
		interaction.channel.send(messageOptions).then(message => {
			listMessages[listType] = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			saveObject(listMessages, "listMessageIds.json");
			message.pin();
		})
	}).catch(console.error);

	interaction.reply({ content: `Pinning the ${listType} list succeded.`, ephemeral: true })
		.catch(console.error);
}
