const fs = require("fs");
const { EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { randomEmbedFooter } = require('../engines/messageEngine.js');
const { imaginaryHorizonsIconURL } = require('../constants.js');

const mainId = "roles-rundown";
module.exports = new CommandWrapper(mainId, "See what the roles on the server mean and how to get them", null, [InteractionContextType.Guild], 3000,
	/** See what the roles on the server mean and how to get them */
	(interaction) => {
		fs.promises.stat(__filename).then(stats => {
			interaction.reply({
				embeds: [
					new EmbedBuilder().setColor(7045611)
						.setAuthor({
							"name": "Click here to visit HorizonsBot's GitHub",
							"iconURL": imaginaryHorizonsIconURL,
							"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
						})
						.setTitle("Roles Rundown")
						.setThumbnail("https://media.discordapp.net/attachments/789323338946183188/1048074245386809434/old-avatar.png?width=468&height=468")
						.setDescription("Here's a quick intro to the roles on this server:")
						.addFields({
							"name": "BountyBot Season Ranks",
							"value": "<@&538801226045849640> • <@&538801106503860246> • <@&538801003173117955> • <@&572446194115018752>\nThese are the seasonal ranks in @BountyBot, you can get them by completing lots of bounties!"
						},
							{
								"name": "Staff Roles",
								"value": "<@&548049640235335730> • <@&353577109039611915>\nServer members with these roles are the moderation staff. Be sure to thank them for their work every now and again!"
							},
							{
								"name": "Supporter Role",
								"value": "<@&662764480970883074>\nThis role is given to people who are supporting the server, either by boosting with Discord Nitro or voting for us on [top.gg](https://top.gg/servers/353575133157392385/vote)."
							}
						).setFooter(randomEmbedFooter())
						.setTimestamp(stats.mtime)
				],
				flags: [MessageFlags.Ephemeral]
			})
		})
	}
);
