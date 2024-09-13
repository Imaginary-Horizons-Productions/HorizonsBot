const { GuildChannelManager, ActionRowBuilder, StringSelectMenuBuilder, Message, MessageFlags } = require('discord.js');
const { Club, ClubTimeslot } = require("../classes");
const { MAX_EMBEDS_PER_MESSAGE, MAX_EMBED_FIELD_NAME_LENGTH, MAX_EMBED_FIELD_VALUE_LENGTH, MAX_EMBED_TOTAL_CHARACTERS, MAX_EMBED_DESCRIPTION_LENGTH } = require('../constants');
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

/** Builds the MessageOptions for the petition list message
 * @param {number} memberCount
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
function buildPetitionListPayload(memberCount) {
	const messageOptions = { flags: MessageFlags.SuppressNotifications };

	const channelSelect = new StringSelectMenuBuilder().setCustomId("petitionChannel")
		.setMinValues(1);
	const roleSelect = new StringSelectMenuBuilder().setCustomId("petitionRole")
		.setMinValues(1);

	const fields = [{ name: "Channel Petitions", value: "" }, { name: "Role Petitions", value: "" }];
	for (const petition of getChannelPetitions()) {
		fields[0].value += `\n${petition.name}: ${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`;
		channelSelect.addOptions([{
			label: petition.name,
			value: petition.name
		}]);
	}
	if (fields[0].value === "") {
		fields[0].value = "No open channel petitions yet";
	}
	for (const petition of getRolePetitions()) {
		fields[1].value += `\n${petition.name}: ${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`;
		roleSelect.addOptions([{
			label: petition.name,
			value: petition.name
		}]);
	}
	if (fields[1].value === "") {
		fields[1].value = "No open role petitions yet";
	}

	if (channelSelect.options.length > 0) {
		channelSelect.setPlaceholder("Select a channel petition...");
	} else {
		channelSelect.setPlaceholder("No open channel petitions");
	}

	if (roleSelect.options.length > 0) {
		roleSelect.setPlaceholder("Select a role petition...");
	} else {
		roleSelect.setPlaceholder("No open role petitions");
	}

	[channelSelect, roleSelect].forEach(select => {
		if (select.options.length > 0) {
			select.setMaxValues(Math.min(select.options.length, MAX_EMBEDS_PER_MESSAGE));
		} else {
			select.setDisabled(true)
				.addOptions([{
					label: "no entries",
					value: "no entries"
				}])
				.setMaxValues(1);
		}
	})

	messageOptions.components = [new ActionRowBuilder().addComponents(channelSelect), new ActionRowBuilder().addComponents(roleSelect)];

	const title = `Open Petition List (${commandMention("list petitions")})`;
	const description = `Here are the open petitions for channels and pingable roles. They will automatically be added when reaching **${Math.ceil(memberCount * 0.05)} petitions** (5% of the server). You can sign an open petition with the select menus under this message.\n\nChannel petitions will be converted to lowercase because Discord text channels are all lowercase.`;
	if (title.length + description.length + fields.reduce((total, field) => total + field.name.length + field.value.length, 0) > MAX_EMBED_TOTAL_CHARACTERS || fields.some(field => field.name.length > MAX_EMBED_FIELD_NAME_LENGTH || field.value.length > MAX_EMBED_FIELD_VALUE_LENGTH)) {
		return new Promise((resolve, reject) => {
			const fileText = [title, description, ...fields.map(field => `${field.name}\n${field.value}`)].join("\n\n");
			fs.writeFile("data/listMessage.txt", fileText, "utf8", error => {
				if (error) {
					console.error(error);
				}
			});
			resolve(messageOptions);
		}).then(messageOptions => {
			messageOptions.files = [{
				attachment: "data/listMessage.txt",
				name: "petitionList.txt"
			}];
			return messageOptions;
		})
	} else {
		return new Promise((resolve, reject) => {
			messageOptions.embeds = [
				embedTemplateBuilder("#f07581")
					.setTitle(title)
					.setDescription(description)
					.addFields(fields)
			];
			resolve(messageOptions);
		})
	}
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
		selectMenu.setMaxValues(Math.min(selectMenu.options.length, MAX_EMBEDS_PER_MESSAGE));
	} else {
		selectMenu.setDisabled(true)
			.addOptions([{
				label: "no entries",
				value: "no entries"
			}])
			.setMaxValues(1);
	}

	messageOptions.components = [new ActionRowBuilder().addComponents(selectMenu)];

	if (description.length > MAX_EMBED_DESCRIPTION_LENGTH) {
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
