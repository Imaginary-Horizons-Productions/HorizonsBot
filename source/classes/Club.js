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
	title = "new club";
	description = "The host can change this text with `/club-config`.";
	userIds = []; // An array containing the allowed user snowflakes (excluding the host)
	seats = -1; // Maximum number of players in the club, 0 = unlimited
	system = ""; // string for club game
	timeslot = new module.exports.ClubTimeslot();
	imageURL = ""; // URL for club image
	detailSummaryId = "";
	color = "";

	/** Only clubs that are looking for a finite number of new members have events created for their meetings
	 * @returns {boolean}
	 */
	isRecruiting() {
		return this.userIds.length < this.seats;
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
