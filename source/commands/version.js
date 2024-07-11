const { AttachmentBuilder } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { versionEmbedBuilder } = require('../engines/messageEngine.js');

const mainId = "version";
module.exports = new CommandWrapper(mainId, "Get HorizonsBot's version notes", null, true, 3000,
	(interaction) => {
		if (interaction.options.getString("notes-length") === "last-version") {
			interaction.reply({
				content: "Here are all the changes so far: ",
				files: [new AttachmentBuilder("./ChangeLog.md")],
				ephemeral: true
			});
		} else {
			versionEmbedBuilder().then(embed => {
				interaction.reply({ embeds: [embed], ephemeral: true });
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
