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
		"Once 5% of the server has used /petition for a topic, a text channel will automatically be created",
		"Clubs and topics are hidden by default to reduce channel clutter. Use /list to see what you're missing!",
		"Find out how to get roles on the server with /roles",
		"Use /timestamp to get a string that Discord automatically converts into the reader's timezone!",
		"Use /at-channel if you want to ping the channel (this lets us rate limit @here and @everyone)",
		"The /timestamp command allows negative number inputs"
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
