const fs = require('fs');
const { EmbedBuilder, Colors, UserSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { imaginaryHorizonsIconURL, discordIconURL, SKIP_INTERACTION_HANDLING } = require('../constants');
const { Club } = require('../classes');
const { commandMention } = require('../util/textUtil');
const { EmbedLimits } = require('@sapphire/discord.js-utilities');

/** Create a Message Embed with common settings (author, timestamp, color)
 * @param {string} color
 * @returns {EmbedBuilder}
 */
function embedTemplateBuilder(color = Colors.Blurple) {
	return new EmbedBuilder().setColor(color)
		.setAuthor({
			name: "Click here to visit HorizonsBot's GitHub",
			iconURL: imaginaryHorizonsIconURL,
			url: "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
		})
		.setFooter(randomEmbedFooter())
		.setTimestamp();
}

const discordTips = [
	"Message starting with @silent don't send notifications; good for when everyone's asleep.",
	"Surround your message with || to mark it a spoiler (not shown until reader clicks on it).",
	"Surround a part of your messag with ~~ to add strikethrough styling.",
	"Don't forget to check slash commands for optional arguments.",
	"Some slash commands can be used in DMs, others can't.",
	"Server subscriptions cost more on mobile because the mobile app stores take a cut."
].map(text => ({ text, iconURL: discordIconURL }));
const horizonsBotTips = [
	"You can roll dice with the /roll command!",
	"Once 5% of the server has used /petition for a topic, a text channel will automatically be created.",
	"Clubs are hidden by default to reduce channel clutter. Use /list to see what you're missing!",
	"Find out how to get roles on the server with /roles.",
	"Use /timestamp to get a string that Discord automatically converts into the reader's timezone!",
	"Use /at-channel if you want to ping the channel (this lets us rate limit @here and @everyone).",
	"The /timestamp command allows negative number inputs.",
	"Please do not make bounties to vote for your petitions."
].map(text => ({ text, iconURL: imaginaryHorizonsIconURL }));
const bountyBotIcon = "https://cdn.discordapp.com/attachments/618523876187570187/1138968614364528791/BountyBotIcon.jpg";
const bountyBotTips = [
	"You can showcase one of your bounties once a week to increase its rewards.",
	"Bounties can't be completed until 5 minutes after they've been posted. Don't make them too easy!",
	"You get XP for posting a bounty, but lose that XP if it's taken down before it's completed.",
	"You get XP when your bounties are completed. Thanks for posting!",
	"You get more XP when a bigger group completes your bounties. Thanks for organizing!",
	"Sometimes when you raise a toast to someone, it'll crit and grant you XP too!",
	"Your chance for Critical Toast is lower when repeatedly toasting the same bounty hunters. Spread the love!",
	"Users who can manage BountyBot aren't included in seasonal rewards to avoid conflicts of interest.",
	"Anyone can post a bounty, even you!",
	"Anyone can raise a toast, even you!",
	"Manage bounties from within games with the Discord Overlay (default: Shift + Tab)!",
	"Server level is based on total bounty hunter level--higher server level means better evergreen bounty rewards.",
	"A bounty poster cannot complete their own bounty."
].map(text => ({ text, iconURL: bountyBotIcon }));
const potlIcon = "https://images-ext-1.discordapp.net/external/wclKLsXO0RRUYVqULk4xBWnqyeepTl4MPdQAvwmYA4w/https/cdn.discordapp.com/avatars/950469509628702740/97f4ae84c14c2b88fbf569de061bac88.webp";
const potlTips = [
	"Combatants lose their next turn (Stun) when their Stagger reaches their Poise.",
	"Using items has priority.",
	"Gear that matches your element removes 1 Stagger on allies.",
	"Gear that matches your element adds 1 Stagger on foes.",
	"Combatant speed varies every round.",
	"Damage is capped to 500 in one attack without any Power Up."
].map(text => ({ text, iconURL: potlIcon }));
const tipPool = horizonsBotTips.concat(bountyBotTips, potlTips, discordTips);
function randomEmbedFooter() {
	return tipPool[Math.floor(Math.random() * tipPool.length)];
}

/** Generate the club's summary embed
 * @param {Club} club
 */
function clubEmbedBuilder(club) {
	const fields = [{ name: "Club Host", value: `<@${club.hostId}>` }];
	if (club.system) {
		fields.push({ name: "Game", value: club.system });
	}
	if (club.timeslot.nextMeeting) {
		fields.push({
			name: "Next Meeting",
			value: `<t:${club.timeslot.nextMeeting}:F>${club.timeslot.periodCount && club.timeslot.periodUnits ? ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "weeks" ? "week(s)" : "day(s)"}` : ""}`
		});
	}

	return embedTemplateBuilder()
		.setTitle(`__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)`)
		.setDescription(club.description)
		.addFields(fields)
		.setImage(club.imageURL || null)
		.setColor(club.color || null);
}

/** The version embed should contain the last version's changes, known issues, and project links
 * @returns {EmbedBuilder}
 */
function versionEmbedBuilder() {
	const changelogPath = "./ChangeLog.md";
	return fs.promises.stat(changelogPath).then(stats => {
		return fs.promises.readFile(changelogPath, { encoding: 'utf8' }).then(data => {
			const dividerRegEx = /####/g;
			const changesStartRegEx = /\.\d+:/g;
			let titleStart = dividerRegEx.exec(data).index;
			changesStartRegEx.exec(data);
			let sectionEnd = dividerRegEx.exec(data).index;

			return embedTemplateBuilder()
				.setTitle(data.slice(titleStart + 5, changesStartRegEx.lastIndex))
				.setURL('https://discord.gg/bcE3Syu')
				.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/734099622846398565/newspaper.png')
				.setDescription(data.slice(changesStartRegEx.lastIndex, sectionEnd).slice(0, EmbedLimits.MaximumDescriptionLength))
				.addFields({ name: "Other Discord Bots", value: "Check out other Imaginary Horizons Productions bots or commission your own on the [IHP GitHub](https://github.com/Imaginary-Horizons-Productions)" }).setFooter(randomEmbedFooter())
				.setTimestamp(stats.mtime);
		})
	})
}

function rulesEmbedBuilder() {
	return fs.promises.stat(__filename).then(stats => {
		return new EmbedBuilder().setColor(7045611)
			.setAuthor({
				"name": "Click here to visit HorizonsBot's GitHub",
				"iconURL": imaginaryHorizonsIconURL,
				"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
			})
			.setTitle(`Server Rules (${commandMention("server-rules")})`)
			.setThumbnail(imaginaryHorizonsIconURL)
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
					"value": `Please post in appropriate channels so we can keep discussion organized. If you can't find a good channel to post in, check the Channel and Roles Browser at the top of the channel list to see if you can opt-in. If you still can't find a good channel, you can ${commandMention("petition")} for one to be made.`
				},
				{
					"name": "Some Channels Have Additional Rules",
					"value": "The topic chanels **#comfort**, **#controversial**, and **#creations** have extra rules associated with them. You can find the extra rules pinned in those channels."
				},
				{
					"name": "Discord Usage Tips",
					"value": "- Start your message with `@silent` to prevent it from waking people up in the middle of the night.\n- Surround text with `||` to mark it a spoiler. ||example||"
				}
			)
			.setFooter(randomEmbedFooter())
			.setTimestamp(stats.mtime);
	})
}

function pressKitEmbedBuilder() {
	return fs.promises.stat(__filename).then(stats => {
		return new EmbedBuilder().setColor(7045611)
			.setAuthor({
				"name": "Click here to visit HorizonsBot's GitHub",
				"iconURL": imaginaryHorizonsIconURL,
				"url": "https://github.com/Imaginary-Horizons-Productions/HorizonsBot"
			})
			.setTitle(`Imaginary Horizons Branding (${commandMention("press-kit")})`)
			.setThumbnail(imaginaryHorizonsIconURL)
			.addFields({
				"name": "Colors",
				"value": "Salmon - #f07581\nPeriwinkle - #6b81eb\nSpring Green - #b0ffe8\nWhite - #ffffff\nMint - #00BD9D"
			},
				{
					"name": "Links",
					"value": "Server Invite - discord.gg/5EPWvu4\ntop.gg vote page - https://top.gg/servers/353575133157392385/vote"
				}
			)
			.setImage("https://cdn.discordapp.com/attachments/812099861084241982/1094738237169340558/Patreon_Banner_Final.jpg")
			.setFooter(randomEmbedFooter())
			.setTimestamp(stats.mtime);
	})
}

/** @param {string} placeholderText */
function disabledSelectRow(placeholderText) {
	return new ActionRowBuilder().addComponents(
		new UserSelectMenuBuilder().setCustomId(SKIP_INTERACTION_HANDLING)
			.setPlaceholder(placeholderText)
			.setDisabled(true)
	)
}

module.exports = {
	embedTemplateBuilder,
	randomEmbedFooter,
	clubEmbedBuilder,
	versionEmbedBuilder,
	rulesEmbedBuilder,
	pressKitEmbedBuilder,
	disabledSelectRow
};
