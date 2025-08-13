const { Guild, ChannelType, GuildOnboardingPromptType } = require('discord.js');
const { Petition } = require('../classes');
const { ensuredPathSave } = require('../util/fileUtil');

const { topicCategoryId } = require('../constants');
// type not associated correctly if the require and destructure are done in same line
const optInChannelsData = require('../../config/optInChannels.json');
const rolesData = require('../../config/pingableRoles.json');

/** @param {Guild} guild */
function updateOnboarding(guild) {
	const roleIds = Object.keys(pingableRoles);
	if (roleIds.length > 0) {
		Promise.all(Object.keys(pingableRoles).map(async roleId => {
			const role = await guild.roles.fetch(roleId);
			const optionPayload = {
				roles: [role],
				title: role.name,
			};
			if (pingableRoles[roleId] !== null) {
				optionPayload.emoji = pingableRoles[roleId];
			}
			return optionPayload;
		})).then(promptOptions => {
			guild.editOnboarding({
				prompts: [
					{
						title: "Select your ping-able roles",
						type: GuildOnboardingPromptType.Dropdown,
						singleSelect: false,
						options: promptOptions
					}
				]
			})
		})
	}
}

/** @type {[Petition[], string[]]} */
const [channelPetitions, optInChannelIds] = optInChannelsData;

/** Add a petition to the petition list and update the topic list embed
 * @param {Petition[]} updatedChannelPetitions
 * @param {Record<string, string>} updatedOptInChannels
 */
function saveOptInChannelData(updatedChannelPetitions, updatedOptInChannels) {
	ensuredPathSave([updatedChannelPetitions, updatedOptInChannels], "optInChannels.json");
}

/** Create an opt-in channel for a petition if it has enough signatures
 * @param {Guild} guild
 * @param {string} channelName
 * @param {User} author
 */
async function checkChannelPetition(guild, channelName, author = null) {
	let petition = channelPetitions.find(petition => petition.name.toLowerCase() === channelName.toLowerCase());
	if (!petition) {
		petition = new Petition(channelName);
		if (author) {
			channelPetitions.push(petition);
		}
	}
	const returnStats = {
		name: channelName,
		petitionCount: petition.petitionerIds.length,
		threshold: Math.ceil(guild.memberCount * 0.05),
		result: "checkOnly"
	};
	if (author) {
		if (!petition.petitionerIds.includes(author.id)) {
			petition.petitionerIds.push(author.id);
			returnStats.petitionCount++;
			returnStats.result = "signatureAdded";
		} else {
			returnStats.result = "duplicateSignature";
			return returnStats;
		}
	}
	if (returnStats.petitionCount >= returnStats.threshold) {
		returnStats.channel = await createOptInChannel(guild, channelName, "petition");
		returnStats.result = "petitionFulfilled";
	} else {
		saveOptInChannelData(channelPetitions, optInChannelIds);
	}
	return returnStats;
}

function getChannelPetitions() {
	return channelPetitions;
}

/** @param {string} channelName */
function deleteChannelPetition(channelName) {
	saveOptInChannelData(channelPetitions.filter(petition => petition.name.toLowerCase() !== channelName.toLowerCase()), optInChannelIds);
}

/**
 * @param {Guild} guild
 * @param {string} channelName
 * @param {"petition" | string} initiator
 */
function createOptInChannel(guild, channelName, initiator) {
	return guild.channels.create({
		name: channelName,
		parent: topicCategoryId,
		type: ChannelType.GuildText,
		reason: `Opt-In Channel added by ${initiator}`
	}).then(channel => {
		const petitionIndex = channelPetitions.findIndex(petition => petition.name === channelName);
		if (petitionIndex !== -1) {
			const petition = channelPetitions[petitionIndex];
			if (petition.petitionerIds.length > 0) {
				channel.send(`This channel has been created thanks to: <@${petition.petitionerIds.join('> <@')}>`);
			}
			channelPetitions.splice(petitionIndex, 1);
		}
		optInChannelIds.push(channel.id);
		saveOptInChannelData(channelPetitions, optInChannelIds);
		return channel;
	});
}

/** @param {string} id */
function isOptInChannel(id) {
	return optInChannelIds.includes(id);
}

/**
 * @param {string} name
 * @param {Guild} guild
 */
async function findOptInChannelWithName(name, guild) {
	for (const id of optInChannelIds) {
		const channel = await guild.channels.fetch(id);
		if (channel.name === name.toLowerCase()) {
			return channel;
		}
	}
	return null;
}

/**
 * @param {string} id
 * @param {Guild} guild
 */
function deleteOptInChannel(id, guild) {
	saveOptInChannelData(channelPetitions, optInChannelIds.filter(channelId => channelId !== id));
	updateOnboarding(guild);
}

/** @type {[Petition[], Record<string, ?string>]} */
const [rolePetitions, pingableRoles] = rolesData;

/** Add a petition to the petition list and update the topic list embed
 * @param {Petition[]} updatedRolePetitions
 * @param {Record<string, string>} updatedPingableRoles
 */
function savePingableRoleData(updatedRolePetitions, updatedPingableRoles) {
	ensuredPathSave([updatedRolePetitions, updatedPingableRoles], "pingableRoles.json");
}

/** Create a Pingable Role for a petition if it has enough signatures
 * @param {Guild} guild
 * @param {string} roleName
 * @param {User} author
 */
function checkRolePetition(guild, roleName, author = null) {
	let petition = rolePetitions.find(petition => petition.name.toLowerCase() === roleName.toLowerCase());
	if (!petition) {
		petition = new Petition(roleName);
		rolePetitions.push(petition);
	}
	const returnStats = {
		name: roleName,
		petitionCount: petition.petitionerIds.length,
		threshold: Math.ceil(guild.memberCount * 0.05),
		result: "checkOnly"
	};
	if (author) {
		if (!petition.petitionerIds.includes(author.id)) {
			petition.petitionerIds.push(author.id);
			returnStats.petitionCount++;
			returnStats.result = "signatureAdded";
		} else {
			returnStats.result = "duplicateSignature";
			return returnStats;
		}
	}
	if (returnStats.petitionCount >= returnStats.threshold) {
		createPingableRole(guild, roleName, "petition");
		returnStats.result = "petitionFulfilled";
	} else {
		savePingableRoleData(rolePetitions, pingableRoles);
	}
	return returnStats;
}


function getRolePetitions() {
	return rolePetitions;
}

/** @param {string} roleName */
function deleteRolePetition(roleName) {
	savePingableRoleData(rolePetitions.filter(petition => petition.name.toLowerCase() !== roleName.toLowerCase()), pingableRoles);
}

/**
 * @param {Guild} guild
 * @param {string} roleName
 * @param {"petition" | string} initiator
 */
function createPingableRole(guild, roleName, initiator) {
	return guild.roles.create({
		name: roleName,
		mentionable: true,
		reason: `Pingable Role added by ${initiator}`
	}).then(role => {
		const petitionIndex = rolePetitions.findIndex(petition => petition.name === roleName);
		if (petitionIndex !== -1) {
			rolePetitions[petitionIndex].petitionerIds.forEach(id => {
				guild.members.addRole({ user: id, role, reason: "Fulfillment of petition for Pingable Role" });
			})
			rolePetitions.splice(petitionIndex, 1);
		}
		pingableRoles[role.id] = null;
		savePingableRoleData(rolePetitions, pingableRoles);
		updateOnboarding(guild);
		return role;
	})
}

/** @param {string} id */
function isPingableRoleId(id) {
	return id in pingableRoles;
}

/**
 * @param {string} name
 * @param {Guild} guild
 */
async function findPingableRoleWithName(name, guild) {
	for (const id in pingableRoles) {
		const role = await guild.roles.fetch(id);
		if (role.name.toLowerCase() === name.toLowerCase()) {
			return role;
		}
	}
	return null;
}

/**
 * @param {string} roleId
 * @param {string} emoji
 */
function setPingableRoleEmoji(roleId, emoji, guild) {
	pingableRoles[roleId] = emoji;
	savePingableRoleData(rolePetitions, pingableRoles);
}

/** @param {Role} role */
function deletePingableRole(role) {
	if (role.id in pingableRoles) {
		delete pingableRoles[role.id];
		savePingableRoleData(rolePetitions, pingableRoles);
		updateOnboarding(role.guild);
	}
}

function checkAllPetitions(guild) {
	for (const petition of channelPetitions) {
		checkChannelPetition(guild, petition.name);
	}
	for (const petition of rolePetitions) {
		checkRolePetition(guild, petition.name);
	}
}

function removeAllPetitionsBy(userId) {
	for (const petition of channelPetitions) {
		petition.petitionerIds = petition.petitionerIds.filter(id => id != userId);
	}
	saveOptInChannelData(channelPetitions.filter(petition => petition.petitionerIds.length > 0), optInChannelIds);

	for (const petition of rolePetitions) {
		petition.petitionerIds = petition.petitionerIds.filter(id => id != userId);
	}
	savePingableRoleData(rolePetitions.filter(petition => petition.petitionerIds.length > 0), pingableRoles);
}

module.exports = {
	updateOnboarding,
	checkChannelPetition,
	getChannelPetitions,
	deleteChannelPetition,
	createOptInChannel,
	isOptInChannel,
	findOptInChannelWithName,
	deleteOptInChannel,
	getRolePetitions,
	checkRolePetition,
	deleteRolePetition,
	createPingableRole,
	isPingableRoleId,
	findPingableRoleWithName,
	setPingableRoleEmoji,
	deletePingableRole,
	checkAllPetitions,
	removeAllPetitionsBy
};
