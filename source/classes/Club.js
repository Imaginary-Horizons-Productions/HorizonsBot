const { ButtonBuilder, ActionRowBuilder, heading, subtext, userMention } = require("@discordjs/builders");
const { ButtonLimits } = require("@sapphire/discord.js-utilities");
const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ButtonStyle, MediaGalleryBuilder, MediaGalleryItemBuilder, GuildMember, time, TimestampStyles, Collection } = require("discord.js");
const { SAFE_DELIMITER } = require("../constants");
const { collapseTextToLength } = require("../util/textUtil");

module.exports.Club = class {
	/**
	 * @param {import("discord.js").Snowflake} idInput the club's text channel's id
	 * @param {string} nameArgument
	 * @param {import("discord.js").Snowflake} roleId
	 * @param {import("discord.js").Snowflake} hostIdInput The host's Discord snowflake
	 * @param {import("discord.js").Snowflake} voiceChannelIdInput
	 */
	constructor(idInput, nameArgument, roleId, hostIdInput, voiceChannelIdInput) {
		this.id = idInput;
		this.name = nameArgument;
		this.roleId = roleId;
		this.voiceChannelId = voiceChannelIdInput;
		this.hostId = hostIdInput;
	}
	description = "The host can change this text with `/club-config`.";
	/** @type {number | null} */
	idealMemberCount = null;
	/** @type {string | null} */
	activity = null;
	/** @type {string | null} */
	imageURL = null;
	/** @type {string | null} */
	color = null;
	/** @type {import("discord.js").Snowflake[]} */
	bannedUserIds = [];
	detailSummaryId = "";
	timeslot = new module.exports.ClubTimeslot();

	/**
	 * @param {"info" | "config" | "invite" } mode
	 * @param {number} clubSize
	 */
	asContainer(mode, clubSize) {
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

		const activityText = `${heading("Membership", 2)}\nClub Host: ${userMention(this.hostId)}\n${subtext(`${clubSize}${this.idealMemberCount !== null ? `/${this.idealMemberCount}` : ""} Members`)}`;
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
			let meetingText = `${heading("Schedule", 2)}\nNext Meeting: ${time(this.timeslot.nextMeeting, TimestampStyles.FullDateShortTime)}`;
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

	/**
	 * @param {string} userId
	 * @param {Collection<import("discord.js").Snowflake, GuildMember>}
	 */
	hasGuildMember(userId, memberCollection) {
		return userId === this.hostId || memberCollection.has(userId);
	}

	/** @param {number} clubSize */
	getMembershipStatus(clubSize) {
		if (this.idealMemberCount === null) {
			return "unlimited";
		}

		if (clubSize < this.idealMemberCount) {
			return "recruiting";
		} else {
			return "full";
		}
	}

	/** @param {number} clubSize */
	membershipCountString(clubSize) {
		let countString = clubSize.toString();
		if (this.idealMemberCount) {
			countString += `/${this.idealMemberCount} Member`
			if (this.idealMemberCount !== 1) {
				countString += "s";
			}
		} else {
			countString += " Member";
			if (clubSize !== 1) {
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
