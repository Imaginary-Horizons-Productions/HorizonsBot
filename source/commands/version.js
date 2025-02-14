const { AttachmentBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { versionEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "version";
module.exports = new CommandWrapper(mainId, "Get HorizonsBot's version notes", null, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	(interaction) => {
		if (interaction.options.getString("notes-length") === "last-version") {
			interaction.reply({
				content: "Here are all the changes so far: ",
				files: [new AttachmentBuilder("./ChangeLog.md")],
				flags: [MessageFlags.Ephemeral]
			});
		} else {
			versionEmbedBuilder().then(embed => {
				interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
			}).catch(console.error);
		}
	}
).setOptions(
	{
		type: "String",
		name: "notes-length",
		description: "Get the changes in last version or the full change log",
		choices: [
			{ name: "Last version", value: "last-version" },
			{ name: "Full change log", value: "full-change-log" }
		],
		required: true
	}
);
