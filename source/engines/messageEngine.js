const fs = require('fs');
const { EmbedBuilder } = require("discord.js");

/** Create a Message Embed with common settings (author, timestamp, color)
 * @param {string} color
 * @returns {EmbedBuilder}
 */
exports.embedTemplateBuilder = function (color = "#6b81eb") {
	return new EmbedBuilder().setColor(color)
		.setAuthor({
			name: "Click here to visit HorizonsBot's GitHub",
			iconURL: "https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png",
			url: "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
		})
		.setFooter(exports.randomEmbedFooter())
		.setTimestamp();
}

exports.randomEmbedFooter = function () {
	const tips = [
		"You can roll dice with the /roll command!",
		"Once 5% of the server has used /petition for a topic, a text channel will automatically be created.",
		"Clubs are hidden by default to reduce channel clutter. Use /list to see what you're missing!",
		"Find out how to get roles on the server with /roles.",
		"Use /timestamp to get a string that Discord automatically converts into the reader's timezone!",
		"Use /at-channel if you want to ping the channel (this lets us rate limit @here and @everyone).",
		"The /timestamp command allows negative number inputs.",
		"Please do not make bounties to vote for your petitions.",
		"Some commands have optional inputs that are easy to miss. Don't forget to check for them!",
		"Some commands can be used from DMs, others are disabled."
	];
	return {
		text: tips[Math.floor(Math.random() * tips.length)],
		iconURL: 'https://media.discordapp.net/attachments/789323338946183188/1048075545017065562/light-bulb.png?width=468&height=468'
	}
}

/** Generate the club's summary embed
 * @param {Club} club
 */
exports.clubEmbedBuilder = function (club) {
	const fields = [{ name: "Club Host", value: `<@${club.hostId}>` }];
	if (club.system) {
		fields.push({ name: "Game", value: club.system });
	}
	if (club.timeslot.nextMeeting) {
		fields.push({
			name: "Next Meeting",
			value: `<t:${club.timeslot.nextMeeting}:F>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "weeks" ? "week(s)" : "day(s)"}`}`
		});
	}

	return exports.embedTemplateBuilder()
		.setTitle(`__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)`)
		.setDescription(club.description)
		.addFields(fields)
		.setImage(club.imageURL || null)
		.setColor(club.color || null);
}

/** The version embed should contain the last version's changes, known issues, and project links
 * @returns {EmbedBuilder}
 */
exports.versionEmbedBuilder = function () {
	return fs.promises.readFile('./ChangeLog.md', { encoding: 'utf8' }).then(data => {
		const dividerRegEx = /####/g;
		const changesStartRegEx = /\.\d+:/g;
		const knownIssuesStartRegEx = /### Known Issues/g;
		let titleStart = dividerRegEx.exec(data).index;
		changesStartRegEx.exec(data);
		let knownIssuesStart;
		let knownIssueStartResult = knownIssuesStartRegEx.exec(data);
		if (knownIssueStartResult) {
			knownIssuesStart = knownIssueStartResult.index;
		}
		let knownIssuesEnd = dividerRegEx.exec(data).index;

		let embed = exports.embedTemplateBuilder()
			.setTitle(data.slice(titleStart + 5, changesStartRegEx.lastIndex))
			.setURL('https://discord.gg/bcE3Syu')
			.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/734099622846398565/newspaper.png')
			.setFooter(exports.randomEmbedFooter());

		if (knownIssuesStart && knownIssuesStart < knownIssuesEnd) {
			// Known Issues section found
			embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesStart))
				.addField(`Known Issues`, data.slice(knownIssuesStart + 16, knownIssuesEnd))
		} else {
			// Known Issues section not found
			embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesEnd));
		}

		return embed.addFields({ name: "Other Discord Bots", value: "Check out other Imaginary Horizons Productions bots or commission your own on the [IHP GitHub](https://github.com/Imaginary-Horizons-Productions)" });
	})
}

exports.rulesEmbedBuilder = function () {
	return new EmbedBuilder().setColor(7045611)
		.setAuthor({
			"name": "Click here to visit HorizonsBot's GitHub",
			"iconURL": "https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png",
			"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
		})
		.setTitle("Server Rules (/info rules)")
		.setThumbnail("https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png")
		.setDescription("Imaginary Horizons is an community that values dignity, creativity, and diversity. Here are our server's rules:")
		.addFields({
			"name": "Give the Benefit of the Doubt",
			"value": "Always be prepared to see a conflict as a misunderstanding and don't intentionally pick fights. Whenever possible, try to hash out misunderstandings in private messages instead of in public chats."
		},
			{
				"name": "No Ridicule/Verbal Abuse",
				"value": "We value diversity of opinion and expression in this server. Attacking or making fun of people is not productive. This rule includes excessive self-deprecation, unreciprocated trash talk, as well as bigoted terms of any kind."
			},
			{
				"name": "Start Discussions in the Appropriate Channel",
				"value": "Please post in appropriate channels so we can keep discussion organized. If you can't find a good channel to post in, check the Channel and Roles Browser at the top of the channel list to see if you can opt-in. If you still can't find a good channel, you can /petition for one to be made."
			},
			{
				"name": "Discord Usage Tips",
				"value": "- Start your message with `@silent` to prevent it from waking people up in the middle of the night.\n- Surround text with `||` to mark it a spoiler. ||example||"
			}
		)
		.setFooter(exports.randomEmbedFooter());
}

exports.pressKitEmbedBuilder = function () {
	return new EmbedBuilder().setColor(7045611)
		.setAuthor({
			"name": "Click here to visit HorizonsBot's GitHub",
			"iconURL": "https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png",
			"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
		})
		.setTitle("Imaginary Horizons Branding (/info press-kit)")
		.setThumbnail("https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png")
		.addFields({
			"name": "Colors",
			"value": "Salmon - #f07581\nPeriwinkle - #6b81eb\nSpring Green - #b0ffe8\nWhite - #ffffff"
		},
			{
				"name": "Links",
				"value": "Server Invite - discord.gg/5EPWvu4\ntop.gg vote page - https://top.gg/servers/353575133157392385/vote"
			}
		)
		.setImage("https://cdn.discordapp.com/attachments/812099861084241982/1094738237169340558/Patreon_Banner_Final.jpg")
		.setFooter(exports.randomEmbedFooter());
}
