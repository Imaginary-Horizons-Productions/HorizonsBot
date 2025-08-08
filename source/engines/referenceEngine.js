const { GuildChannelManager, ActionRowBuilder, StringSelectMenuBuilder, Message, MessageFlags, ContainerBuilder, TextDisplayBuilder, bold, italic } = require('discord.js');
const { Club, ClubTimeslot } = require("../classes");
const { EmbedLimits, MessageLimits } = require('@sapphire/discord.js-utilities');
const { embedTemplateBuilder } = require("./messageEngine.js");
const { getRolePetitions, getChannelPetitions } = require('./customizationEngine.js');
const { ensuredPathSave } = require('../util/fileUtil.js');
const { commandMention } = require('../util/textUtil.js');

/** @type {{[clubId: string]: Club}>} */
const clubDictionary = {};
Object.values(require('../../config/clubList.json')).forEach(club => {
	const serializedClub = { ...club, timeslot: Object.assign(new ClubTimeslot, club.timeslot) };
	clubDictionary[club.id] = Object.assign(new Club(), serializedClub);
});

function getClubDictionary() {
	return clubDictionary;
}

/** Update a club's details in the internal dictionary and in the club list embed
 * @param {Club} club
 */
function updateClub(club) {
	clubDictionary[club.id] = club;
	ensuredPathSave(clubDictionary, 'clubList.json');
}

/** Clean up club information after deletion
 * @param {string} id
 * @param {GuildChannelManager} channelManager
 */
function removeClub(id, channelManager) {
	delete clubDictionary[id];
	ensuredPathSave(clubDictionary, 'clubList.json');
	updateListReference(channelManager, "club");
}

/** @type {{petition: {channelId: string; messageId: string}, club: {channelId: string; messageId: string;}, rules: {channelId: string; messageId: string;}, "press-kit": {channelId: string; messageId: string;}, "proxy-thread-info": {channelId: string; messageId: string;}}} */
let referenceMessages = require('../../config/referenceMessageIds.json');
const { channelBrowserMention } = require('../constants.js');

/** Builds the MessageOptions for the petition list message
 * @param {number} memberCount
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
function buildPetitionListPayload(memberCount) {
	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`# Petitions (${commandMention("list petitions")})`),
		new TextDisplayBuilder().setContent(`Petitions allow server members to create text channels and pingable roles on Imaginary Horizons while ensuring enough buy-in exists for sustained use. A channel or role will automatically be created when it reaches ${bold(`${Math.ceil(memberCount * 0.05)} petitions`)} (5% of the sever population).`),
		new TextDisplayBuilder().setContent(`You can add a new petition or sign-on to an existing petition with the ${commandMention("petition")} command.`),
		new TextDisplayBuilder().setContent("## Discussion Channels"),
		new TextDisplayBuilder().setContent(`Discussion Channels are text channels designated for specific topics under the Discussion category. ${italic("Note: Discord channel names are all lowercase, so channel petitions will be converted to match.")}`),
		new TextDisplayBuilder().setContent("You can sign onto an already-open petition below:"),
	)
	const channelSelect = new StringSelectMenuBuilder().setCustomId("petitionChannel");
	for (const petition of getChannelPetitions()) {
		channelSelect.addOptions([{
			label: petition.name,
			description: `${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`,
			value: petition.name
		}]);
	}
	if (channelSelect.options.length > 0) {
		channelSelect.setPlaceholder("Select a channel petition...");
	} else {
		channelSelect.setPlaceholder("No open channel petitions");
	}
	if (channelSelect.options.length > 0) {
		channelSelect.setMinValues(1)
			.setMaxValues(Math.min(channelSelect.options.length, MessageLimits.MaximumEmbeds));
	} else {
		channelSelect.setDisabled(true)
			.addOptions([{
				label: "no entries",
				value: "no entries"
			}]);
	}
	container.addActionRowComponents(new ActionRowBuilder().addComponents(channelSelect))
	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent("## Pingable Roles"),
		new TextDisplayBuilder().setContent(`Pingable Roles allow server members to sign up for notifications for specific activities by assigning themselves the role in ${channelBrowserMention}.`),
		new TextDisplayBuilder().setContent("You can sign onto an already-open petition below:"),
	)
	const roleSelect = new StringSelectMenuBuilder().setCustomId("petitionRole");
	for (const petition of getRolePetitions()) {
		roleSelect.addOptions([{
			label: petition.name,
			description: `${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`,
			value: petition.name
		}]);
	}
	if (roleSelect.options.length > 0) {
		roleSelect.setPlaceholder("Select a role petition...");
	} else {
		roleSelect.setPlaceholder("No open role petitions");
	}
	if (roleSelect.options.length > 0) {
		roleSelect.setMinValues(1)
			.setMaxValues(Math.min(roleSelect.options.length, MessageLimits.MaximumEmbeds));
	} else {
		roleSelect.setDisabled(true)
			.addOptions([{
				label: "no entries",
				value: "no entries"
			}])
	}
	container.addActionRowComponents(new ActionRowBuilder().addComponents(roleSelect));
	//TODONOW overflow protection
	return { components: [container], flags: MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2 };
}

/** Builds the MessageOptions for the the club list message
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
function buildClubListPayload() {
	let description = "Here's a list of the clubs on the server. Learn more about one by using `/club-invite (club ID)`.\n";

	const messageOptions = { flags: MessageFlags.SuppressNotifications };

	const selectMenu = new StringSelectMenuBuilder().setCustomId("clubList")
		.setMinValues(1);

	for (const id in clubDictionary) {
		const club = clubDictionary[id];
		description += `\n__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)\n**Host**: <@${club.hostId}>\n`;
		if (club.system) {
			description += `**Game**: ${club.system}\n`;
		}
		if (club.timeslot.nextMeeting) {
			description += `**Next Meeting**: <t:${club.timeslot.nextMeeting}>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "weeks" ? "week(s)" : "day(s)"}`}\n`;
		}
		if (club.isRecruiting()) {
			selectMenu.addOptions([
				{
					label: club.title,
					description: `${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`,
					value: club.id
				}
			])
		}
	}

	if (selectMenu.options.length > 0) {
		selectMenu.setPlaceholder("Get club details...");
	} else {
		selectMenu.setPlaceholder("No clubs currently recruiting");
	}

	if (selectMenu.options.length > 0) {
		selectMenu.setMaxValues(Math.min(selectMenu.options.length, MessageLimits.MaximumEmbeds));
	} else {
		selectMenu.setDisabled(true)
			.addOptions([{
				label: "no entries",
				value: "no entries"
			}])
			.setMaxValues(1);
	}

	messageOptions.components = [new ActionRowBuilder().addComponents(selectMenu)];

	if (description.length > EmbedLimits.MaximumDescriptionLength) {
		return new Promise((resolve, reject) => {
			let fileText = description;
			fs.writeFile("data/listMessage.txt", fileText, "utf8", error => {
				if (error) {
					console.error(error);
				}
			});
			resolve(messageOptions);
		}).then(messageOptions => {
			messageOptions.files = [{
				attachment: "data/listMessage.txt",
				name: "clubList.txt"
			}];
			messageOptions.embeds = [];
			return messageOptions;
		})
	} else {
		return new Promise((resolve, reject) => {
			messageOptions.embeds = [
				embedTemplateBuilder("#f07581")
					.setTitle(`Club List (${commandMention("list clubs")})`)
					.setDescription(description)
			];
			resolve(messageOptions);
		})
	}
}

/** Update the club or petition list message
 * @param {GuildChannelManager} channelManager
 * @param {"petition" | "club"} listType
 * @returns {Promise<Message>}
 */
async function updateListReference(channelManager, listType) {
	const { channelId, messageId } = referenceMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId).catch(error => {
			if (error.code === 10003) { // Unknown Channel
				referenceMessages[listType].channelId = "";
				referenceMessages[listType].messageId = "";
				ensuredPathSave(referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const message = await channel?.messages.fetch(messageId).catch(error => {
			if (error.code === 10008) { // Unknown Message
				referenceMessages[listType].channelId = "";
				referenceMessages[listType].messageId = "";
				ensuredPathSave(referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const messageOptions = listType === "club" ? await buildClubListPayload() : await buildPetitionListPayload(channelManager.guild.memberCount);
		message?.edit(messageOptions);
		return message;
	}
}

module.exports = {
	getClubDictionary,
	updateClub,
	removeClub,
	referenceMessages,
	buildPetitionListPayload,
	buildClubListPayload,
	updateListReference
};
