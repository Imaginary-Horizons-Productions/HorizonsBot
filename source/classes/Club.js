const { ButtonBuilder, ActionRowBuilder, heading, subtext, userMention } = require("@discordjs/builders");
const { ButtonLimits } = require("@sapphire/discord.js-utilities");
const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ButtonStyle, MediaGalleryBuilder, MediaGalleryItemBuilder } = require("discord.js");
const { SAFE_DELIMITER } = require("../constants");
const { collapseTextToLength } = require("../util/textUtil");

module.exports.Club = class {
	/**
	 * @param {string} idInput the club's text channel's id
	 * @param {string} hostIdInput The host's Discord snowflake
	 * @param {string} voiceChannelIdInput
	 */
	constructor(idInput, hostIdInput, voiceChannelIdInput) {
		this.id = idInput;
		this.voiceChannelId = voiceChannelIdInput;
		this.hostId = hostIdInput;
	}
	name = "new club";
	description = "The host can change this text with `/club-config`.";
	/** @type {number | null} */
	idealMemberCount = null;
	/** @type {string | null} */
	activity = null;
	/** @type {string | null} */
	imageURL = null;
	/** @type {string | null} */
	color = null;
	userIds = []; // An array containing the allowed user snowflakes (excluding the host)
	detailSummaryId = "";
	timeslot = new module.exports.ClubTimeslot();

	/** @param {"info" | "config" | "invite" } mode  */
	asContainer(mode) {
		const container = new ContainerBuilder();
		if (this.color) {
			container.setAccentColor([parseInt(this.color.slice(1, 3), 16), parseInt(this.color.slice(3, 5), 16), parseInt(this.color.slice(5), 16)]);
		}
		let infoText = `${heading(this.name)}\n${this.description}`;
		if (this.activity) {
			infoText += `\n${heading("Activity", 3)}\n${this.activity}`;
		}
		if (mode === "config") {
			container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(infoText)
			).setButtonAccessory(
				new ButtonBuilder().setCustomId(`changeclubdescriptors${SAFE_DELIMITER}${this.id}`)
					.setLabel("Change Descriptors")
					.setStyle(ButtonStyle.Primary)
			));
		} else {
			container.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoText));
		}
		if (mode === "config" || this.imageURL) {
			if (mode === "config") {
				container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(heading("Image", 2))
				).setButtonAccessory(
					new ButtonBuilder().setCustomId(`changeclubimages${SAFE_DELIMITER}${this.id}`)
						.setLabel(this.imageURL ? "Change Image" : "Add Image")
						.setStyle(ButtonStyle.Primary)
				))
			}
			if (this.imageURL) {
				container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(this.imageURL)));
			}
		}

		const activityText = `${heading("Membership", 2)}\nClub Host: ${userMention(this.hostId)}\n${subtext(`${this.userIds.length + 1}${this.idealMemberCount !== null ? `/${this.idealMemberCount}` : ""} Members`)}`;
		if (mode === "config") {
			container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(activityText)
			).setButtonAccessory(
				new ButtonBuilder().setCustomId(`changeclubmembership${SAFE_DELIMITER}${this.id}`)
					.setLabel("Change Membership")
					.setStyle(ButtonStyle.Primary)
			));
		} else {
			container.addTextDisplayComponents(new TextDisplayBuilder().setContent(activityText));
		}

		const meetingTimeButton = new ButtonBuilder().setCustomId(`changeclubschedule${SAFE_DELIMITER}${this.id}`)
			.setLabel("Change Schedule")
			.setStyle(ButtonStyle.Primary);
		if (this.timeslot.nextMeeting) {
			let meetingText = `${heading("Schedule", 2)}\nNext Meeting: <t:${this.timeslot.nextMeeting}:F>`;
			if (this.timeslot.recurrenceData) {
				meetingText += " (repeats every week)";
			}
			if (mode === "config") {
				container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
					new TextDisplayBuilder().setContent(meetingText)
				).setButtonAccessory(meetingTimeButton));
			} else {
				container.addTextDisplayComponents(new TextDisplayBuilder().setContent(meetingText));
			}
		} else if (mode === "config") {
			container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`${heading("Schedule", 2)}\nSetting the club's next meeting time will list it in viewers' timezones and send a reminder to the channel the day before.`)
			).setButtonAccessory(meetingTimeButton));
		}

		if (mode === "invite") {
			container.addActionRowComponents(
				new ActionRowBuilder().addComponents(
					new ButtonBuilder({
						custom_id: `join${SAFE_DELIMITER}${this.id}`,
						label: collapseTextToLength(`Join ${this.name}`, ButtonLimits.MaximumLabelCharacters),
						style: ButtonStyle.Success
					})
				)
			)
		}
		return container;
	}

	/** @param {string} userId */
	hasGuildMember(userId) {
		return userId === this.hostId || this.userIds.includes(userId);
	}

	getMembershipStatus() {
		if (this.idealMemberCount === null) {
			return "unlimited";
		}

		if (this.userIds.length + 1 < this.idealMemberCount) {
			return "recruiting";
		} else {
			return "full";
		}
	}

	membershipCountString() {
		const memberCount = this.userIds.length + 1;
		let countString = memberCount.toString();
		if (this.idealMemberCount) {
			countString += `/${this.idealMemberCount} Member`
			if (this.idealMemberCount !== 1) {
				countString += "s";
			}
		} else {
			countString += " Member";
			if (memberCount !== 1) {
				countString += "s";
			}
		}
		return countString;
	}
}

module.exports.ClubTimeslot = class {
	/** @type {number | null} Format: Unix Timestamp */
	nextMeeting = null;
	/** @type {"weekly" | null} */
	repeatType = null;
	/** @type {string | null} */
	eventId = null;
}
