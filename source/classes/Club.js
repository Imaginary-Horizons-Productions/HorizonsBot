module.exports.Club = class {
	/**
	 * @param {string} idInput the club's text channel's id
	 * @param {string} hostIdInput The host's Discord snowflake
	 * @param {string} voiceChannelIdInput
	 * @param {"stage" | "private"} voiceTypeInput
	 */
	constructor(idInput, hostIdInput, voiceChannelIdInput, voiceTypeInput) {
		this.id = idInput;
		this.voiceChannelId = voiceChannelIdInput;
		this.voiceType = voiceTypeInput;
		this.hostId = hostIdInput;
	}
	name = "new club";
	description = "The host can change this text with `/club-config`.";
	userIds = []; // An array containing the allowed user snowflakes (excluding the host)
	/** @type {number | null} */
	idealMemberCount = null;
	activity = "";
	timeslot = new module.exports.ClubTimeslot();
	imageURL = "";
	detailSummaryId = "";
	color = "";

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
	nextMeeting = null;
	message = null;
	periodCount = 0; // Number of units between repeating meetings (eg 1 week), 0 for off
	periodUnits = "weeks";
	eventId = null;

	/** Stores the unix timestamp of the club's next meeting
	 * @param {number} timestamp
	 */
	setNextMeeting(timestamp) {
		this.nextMeeting = timestamp;
	}

	/** Stores the message to send during a club's reminder
	 * @param {string} messageInput
	 */
	setMessage(messageInput) {
		this.message = messageInput;
	}

	/** Stores the components of the club's repeat period
	 * @param {number} count
	 * @param {"days" | "weeks"} unit
	 */
	setMeetingRepeatPeriod(count, unit) {
		this.periodCount = count;
		this.periodUnits = unit;
	}

	/** Stores the id of the event associated with the club's next meeting
	 * @param {string} eventIdInput
	 */
	setEventId(eventIdInput) {
		this.eventId = eventIdInput;
	}
}
