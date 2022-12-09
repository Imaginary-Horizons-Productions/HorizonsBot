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
		"Use /at-channel if you want to ping the channel (this lets us rate limit @here and @everyone)"
	];
	return {
		text: tips[Math.floor(Math.random() * tips.length)],
		iconURL: 'https://media.discordapp.net/attachments/789323338946183188/1048075545017065562/light-bulb.png?width=468&height=468'
	}
}
