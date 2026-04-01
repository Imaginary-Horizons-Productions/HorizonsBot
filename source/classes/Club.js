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
