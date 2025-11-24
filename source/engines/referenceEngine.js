const { GuildChannelManager, ActionRowBuilder, StringSelectMenuBuilder, Message, MessageFlags, ContainerBuilder, TextDisplayBuilder, bold, italic } = require('discord.js');
const { Club, ClubTimeslot } = require("../classes");
const { MessageLimits, SelectMenuLimits } = require('@sapphire/discord.js-utilities');
const { disabledSelectRow } = require("./messageEngine.js");
const { getRolePetitions, getChannelPetitions } = require('./customizationEngine.js');
const { ensuredPathSave } = require('../util/fileUtil.js');
const { commandMention } = require('../util/textUtil.js');
const { channelBrowserMention } = require('../constants.js');

/** @type {{[clubId: string]: Club}>} */
const clubDictionary = {};
Object.values(require('../../config/clubList.json')).forEach(club => {
	const serializedClub = { ...club, timeslot: Object.assign(new ClubTimeslot, club.timeslot) };
	clubDictionary[club.id] = Object.assign(new Club(), serializedClub);
});

function getClubDictionary() {
	return clubDictionary;
}

/** @param {string} clubId  */
function getClub(clubId) {
	return clubDictionary[clubId];
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
	const container = new ContainerBuilder().setAccentColor([240, 117, 129]).addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`# Petitions (${commandMention("list petitions")})`),
		new TextDisplayBuilder().setContent(`Petitions allow server members to create text channels and pingable roles on Imaginary Horizons while ensuring enough buy-in exists for sustained use. A channel or role will automatically be created when it reaches ${bold(`${Math.ceil(memberCount * 0.05)} petitions`)} (5% of the sever population).`),
		new TextDisplayBuilder().setContent(`You can add a new petition or sign-on to an existing petition with the ${commandMention("petition")} command.`),
		new TextDisplayBuilder().setContent("## Discussion Channels"),
		new TextDisplayBuilder().setContent(`Discussion Channels are text channels designated for specific topics under the Discussion category. ${italic("Note: Discord channel names are all lowercase, so channel petitions will be converted to match.")}`),
		new TextDisplayBuilder().setContent("You can sign onto the 25 oldest petitions below:"),
	)
	const channelPetitions = getChannelPetitions();
	if (channelPetitions.length > 0) {
		const channelSelect = new StringSelectMenuBuilder().setCustomId("petitionChannel")
			.setPlaceholder("Select a channel petition...")
			.setMinValues(1)
			.setMaxValues(channelPetitions.length);
		const channelOptions = [];
		for (const petition of channelPetitions) {
			channelOptions.push({
				label: petition.name,
				description: `${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`,
				value: petition.name
			});
		}
		container.addActionRowComponents(new ActionRowBuilder().addComponents(channelSelect.addOptions(channelOptions.slice(0, SelectMenuLimits.MaximumOptionsLength))))
	} else {
		container.addActionRowComponents(disabledSelectRow("No open channel petitions"))
	}
	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent("## Pingable Roles"),
		new TextDisplayBuilder().setContent(`Pingable Roles allow server members to sign up for notifications for specific activities by assigning themselves the role in ${channelBrowserMention}.`),
		new TextDisplayBuilder().setContent("You can sign onto the 25 oldest petitions below:"),
	)
	const rolePetitions = getRolePetitions();
	if (rolePetitions.length > 0) {
		const roleSelect = new StringSelectMenuBuilder().setCustomId("petitionRole")
			.setPlaceholder("Select a role petition...")
			.setMinValues(1)
			.setMaxValues(rolePetitions.length);
		const roleOptions = [];
		for (const petition of rolePetitions) {
			roleOptions.push({
				label: petition.name,
				description: `${petition.petitionerIds.length} petitioner${petition.petitionerIds.length === 1 ? "" : "s"} so far`,
				value: petition.name
			});
		}
		container.addActionRowComponents(new ActionRowBuilder().addComponents(roleSelect.addOptions(roleOptions.slice(0, SelectMenuLimits.MaximumOptionsLength))));
	} else {
		container.addActionRowComponents(disabledSelectRow("No open role petitions"))
	}
	return { components: [container], flags: MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2 };
}

/** Builds the MessageOptions for the the club list message
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
function buildClubListPayload() {
	const container = new ContainerBuilder().setAccentColor([240, 117, 129]).addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`# Club List (${commandMention("list clubs")})`),
		new TextDisplayBuilder().setContent("Clubs are private subgroups within Imaginary Horizons formed for a specific activity. Clubs come with their own voice channel and tools for scheduling meetings. You can get more details on a recruiting club or join below:")
	);

	const recruitingClubs = Object.values(getClubDictionary()).filter(club => club.isRecruiting());
	if (recruitingClubs.length > 0) {
		const selectMenu = new StringSelectMenuBuilder().setCustomId("clubList")
			.setPlaceholder("Get club details...")
			.setMinValues(1)
			.setMaxValues(Math.min(recruitingClubs.length, MessageLimits.MaximumEmbeds));

		const clubOptions = [];
		for (const club of recruitingClubs) {
			const clubOption = {
				label: `${club.title} (${`${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`})`,
				value: club.id
			};
			if (club.system) {
				clubOption.description = `Activity: ${club.system}`;
			}
			clubOptions.push(clubOption);
		}
		container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu.addOptions(clubOptions.slice(0, SelectMenuLimits.MaximumOptionsLength))))
	} else {
		container.addActionRowComponents(disabledSelectRow("No recruiting clubs"))
	}

	return { components: [container], flags: MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2 };
}

/** Update the club or petition list message
 * @param {GuildChannelManager} channelManager
 * @param {"petition" | "club"} listType
 * @returns {Promise<Message>}
 */
async function updateListReference(channelManager, listType) {
	const { channelId, messageId } = referenceMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId).catch(handleMissingListReferenceChannel);
		const message = await channel?.messages.fetch(messageId).catch(handleMissingListReferenceMesssage);
		const messageOptions = listType === "club" ? buildClubListPayload() : buildPetitionListPayload(channelManager.guild.memberCount);
		message?.edit(messageOptions);
		return message;
	}
}

function handleMissingListReferenceChannel(error) {
	if (error.code === 10003) { // Unknown Channel
		referenceMessages[listType].channelId = "";
		referenceMessages[listType].messageId = "";
		ensuredPathSave(referenceMessages, "referenceMessageIds.json");
	}
	console.error(error);
}

function handleMissingListReferenceMesssage(error) {
	if (error.code === 10008) { // Unknown Message
		referenceMessages[listType].channelId = "";
		referenceMessages[listType].messageId = "";
		ensuredPathSave(referenceMessages, "referenceMessageIds.json");
	}
	console.error(error);
}

module.exports = {
	getClubDictionary,
	getClub,
	updateClub,
	removeClub,
	referenceMessages,
	buildPetitionListPayload,
	buildClubListPayload,
	updateListReference,
	handleMissingListReferenceChannel,
	handleMissingListReferenceMesssage
};
