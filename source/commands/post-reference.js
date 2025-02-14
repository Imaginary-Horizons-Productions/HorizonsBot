const { CommandWrapper } = require('../classes');
const { ensuredPathSave } = require('../util/fileUtil.js');
const { referenceMessages, buildPetitionListPayload, buildClubListPayload } = require('../engines/referenceEngine.js');
const { rulesEmbedBuilder, pressKitEmbedBuilder } = require('../engines/messageEngine.js');
const { MessageFlags, PermissionFlagsBits, EmbedBuilder, InteractionContextType } = require('discord.js');
const { isModerator } = require('../engines/permissionEngine.js');
const { commandMention } = require('../util/textUtil.js');
const { pluralKitId } = require('../constants.js');

const mainId = "post-reference";
module.exports = new CommandWrapper(mainId, "Post a reference message in this channel", PermissionFlagsBits.ManageChannels, [InteractionContextType.Guild], 3000,
	/** Send a reference message (petitions, clubs, rules) to the receiving channel */
	async (interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const listType = interaction.options.getString("reference").toLowerCase();
		let messageOptions;
		switch (listType) {
			case "petition":
				messageOptions = await buildPetitionListPayload(interaction.guild.memberCount);
				break;
			case "club":
				messageOptions = await buildClubListPayload();
				break;
			case "rules":
				messageOptions = { embeds: [rulesEmbedBuilder()], flags: MessageFlags.SuppressNotifications };
				break;
			case "press-kit":
				messageOptions = { embeds: [pressKitEmbedBuilder()], flags: MessageFlags.SuppressNotifications };
				break;
			case "proxy-thread-info":
				messageOptions = {
					embeds: [
						new EmbedBuilder().setColor("#1F9AD8")
							.setTitle("Proxy Thread Hub")
							.setDescription(`This channel serves as the hub for holding private threads with <@${pluralKitId}>. Server members can use ${commandMention("proxy-thread create")} to make private threads with PluralKit in them to simulate DMs. Due to Discord's implementation of private threads, users with the ManageThreads permission (ie our Moderators) will have access to these threads.`)
							.addFields({ name: "Inviting more members", value: "Mentioning other users will invite them to the private thread." })
							.setFooter({ text: "This functionality is prototype for pitch and not affiliated or endorsed by PluralKit." })
					],
					flags: MessageFlags.SuppressNotifications
				};
				break;
		}
		interaction.channel.send(messageOptions).then(message => {
			referenceMessages[listType] = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			ensuredPathSave(referenceMessages, "referenceMessageIds.json");
		}).catch(console.error);

		interaction.reply({ content: `The ${listType} reference has been posted.`, flags: [MessageFlags.Ephemeral] })
			.catch(console.error);
	}
).setOptions(
	{
		type: "String", name: "reference", description: "which message to post", required: true, choices: [
			{ name: "the petiton list", value: "petition" },
			{ name: "the club list", value: "club" },
			{ name: "the rules embed", value: "rules" },
			{ name: "the press kit", value: "press-kit" },
			{ name: "the proxy thread hub embed", value: "proxy-thread-info" }
		]
	}
);
