const { EmbedBuilder } = require('discord.js');
const Command = require('../classes/Command.js');
const { randomEmbedFooter, rulesEmbedBuilder, pressKitEmbedBuilder } = require('../engines/messageEngine.js');
const { imaginaryHorizonsIconURL } = require('../constants.js');

const customId = "info";
const options = [];
const subcommands = [
	{
		name: "horizonsbot-credits",
		description: "Get the HorizonsBot credits",
		optionsInput: []
	},
	{
		name: "server-rules",
		description: "Get the server rules",
		optionsInput: []
	},
	{
		name: "horizonsbot-data-policy",
		description: "See what data HorizonsBot collects and what it does with it",
		optionsInput: []
	},
	{
		name: "roles-rundown",
		description: "See what the roles on the server mean and how to get them",
		optionsInput: []
	},
	{
		name: "press-kit",
		description: "Get info on Imaginary Horizons as a brand",
		optionsInput: []
	}
];
module.exports = new Command(customId, "Get info about the server or HorizonsBot", false, null, 3000, options, subcommands);

/** Get one of the informational messages for the user
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	let embed = new EmbedBuilder();
	switch (interaction.options.getSubcommand()) {
		case "horizonsbot-credits":
			embed.setColor(7045611)
				.setAuthor({
					"name": "Click here to visit HorizonsBot's GitHub",
					"iconURL": imaginaryHorizonsIconURL,
					"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
				})
				.setTitle("HorizonsBot v2.2.2")
				.setDescription("HorizonsBot helps with channel management and other stuff on the Imaginary Horizons Community Discord.")
				.addFields({
					"name": "Design & Engineering",
					"value": "Nathaniel Tseng ( <@106122478715150336> | [GitHub](https://github.com/ntseng) )"
				},
					{
						"name": "Dice Roller",
						"value": "Lucas Ensign ( <@112785244733628416> | [Twitter](https://twitter.com/SillySalamndr) )"
					}
				)
				.setFooter(randomEmbedFooter());
			break;
		case "server-rules":
			embed = rulesEmbedBuilder();
			break;
		case "horizonsbot-data-policy":
			embed.setColor(7045611)
				.setAuthor({
					"name": "Click here to visit HorizonsBot's GitHub",
					"iconURL": imaginaryHorizonsIconURL,
					"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
				})
				.setTitle("Imaginary Horizons Data Policy")
				.setThumbnail("https://cdn.discordapp.com/attachments/545684759276421120/782019073562378298/shaking-hands.png")
				.setDescription("If you leave Imaginary Horizons, your data will be deleted.")
				.addFields({
					"name": "Data Collected",
					"value": "HorizonsBot stores user submitted petitions, and club details."
				},
					{
						"name": "Data Usage",
						"value": "Imaginary Horizons does not use any user data at this time."
					}
				)
				.setFooter({
					"text": "Updated: HorizonsBot version 2.2.0",
					"iconURL": imaginaryHorizonsIconURL
				})
			break;
		case "roles-rundown":
			embed.setColor(7045611)
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
				).setFooter(randomEmbedFooter());
			break;
		case "press-kit":
			embed = pressKitEmbedBuilder();
			break;
	}
	interaction.reply({ embeds: [embed], ephemeral: true });
}
