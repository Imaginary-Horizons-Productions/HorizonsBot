const { CommandWrapper } = require('../classes');
const { ensuredPathSave } = require('../helpers.js');
const { referenceMessages, buildListMessagePayload } = require('../engines/referenceEngine.js');
const { rulesEmbedBuilder, pressKitEmbedBuilder } = require('../engines/messageEngine.js');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');

const mainId = "post-reference";
module.exports = new CommandWrapper(mainId, "Post a reference message in this channel", PermissionFlagsBits.ManageChannels, false, 3000,
	/** Send a reference message (petitions, clubs, rules) to the receiving channel */
	async (interaction) => {
		const listType = interaction.options.getString("reference").toLowerCase();
		let messageOptions;
		switch (listType) {
			case "petition":
			case "club":
				messageOptions = await buildListMessagePayload(interaction.guild.memberCount, listType);
				break;
			case "rules":
				messageOptions = { embeds: [rulesEmbedBuilder()], flags: MessageFlags.SuppressNotifications };
				break;
			case "press-kit":
				messageOptions = { embeds: [pressKitEmbedBuilder()], flags: MessageFlags.SuppressNotifications };
				break;
		}
		interaction.channel.send(messageOptions).then(message => {
			referenceMessages[listType] = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			ensuredPathSave(referenceMessages, "referenceMessageIds.json");
		}).catch(console.error);

		interaction.reply({ content: `The ${listType} reference has been posted.`, ephemeral: true })
			.catch(console.error);
	}
).setOptions(
	{
		type: "String", name: "reference", description: "which message to post", required: true, choices: [
			{ name: "the petiton list", value: "petition" },
			{ name: "the club list", value: "club" },
			{ name: "the rules embed", value: "rules" },
			{ name: "the press kit", value: "press-kit" }
		]
	}
);
