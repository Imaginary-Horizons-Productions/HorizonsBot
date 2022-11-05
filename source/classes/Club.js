module.exports.Club = class {
	/**
	 * @param {number} idInput
	 * @param {number} hostIdInput The host's Discord snowflake
	 * @param {number} voiceChannelIdInput
	 */
	constructor(idInput, hostIdInput, voiceChannelIdInput) {
		this.id = idInput;
		this.voiceChannelId = voiceChannelIdInput;
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
	periodCount = 1; // Number of units between repeating meetings (eg 1 week)
	periodUnits = "w";
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
	 * @param {"d" | "w"} unit
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
