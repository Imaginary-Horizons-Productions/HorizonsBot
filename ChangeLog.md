# HorizonsBot Change Log
#### HorizonsBot Version 2.1.0:
- Removed opt-in topics handling, please use the Channel & Roles Browser instead
   - Retained `/petition` for text channels
   - Removed topic specific commands: `/join` (use `/club-invite` instead) and `/topic-invite`
   - Renamed commands to indicate their club only functionality:
      - `/leave` -> `/club-leave`
	  - `/remove-user` -> `/club-kick` (this command has been made usable by club hosts)
	  - `/delete` -> `/club-sunset` (this command has been made usable by club hosts)
   - Replaced topic list with petition list in: `/list` and `/pin-list`
- Updated `/press-kit`
- Removed the functionality where HorizonsBot would bump the club list in #clubs-recruiting
#### HorizonsBot Version 2.0.1:
- Clubs that aren't recruiting are filtered out of the club list select
- Fixed selects (drop downs) crashing the bot
- Fixed club reminder timestamp being for the next next meeting instead of the next meeting
#### HorizonsBot Version 2.0.0:
 - Updated discord.js to v14
 - Embeds have random tips in their footer
 - Combined all club configuration under `/club-config` using Discord UI
 - Removed the annoying behavior where the bot would send reminder messages for meetings less than a day away on start-up/configuration (use new slash command `/club-send-reminder` manually)
#### HorizonsBot Version 1.17.2:
 - Fixed a crash
#### HorizonsBot Version 1.17.1:
 - Removed custom embed system
 - New commands: `/roles`, `/rules`, and `/press-kit`
 - Fixed several bugs and crashes

#### HorizonsBot Version 1.17.0:
- Reorganized several manager commands via subcommands
- Fixed an issue where club reminders weren't getting cleared if meeting times changed

#### HorizonsBot Version 1.16.3:
- Fixed "Join Voice" button in club reminders
- Fixed a crash on generating club reminders
- Fixed an issue where club events wouldn't recreate themselves
- Club timestamps now include day of the week
- Set `/club-next-meeting` and `/club-set-repeat` to require a club leader or moderator
- Other stuff

#### HorizonsBot Version 1.16.2:
- Fixed crash in scheduling club events

#### HorizonsBot Version 1.16.1:
- Many fixes for club reminders
- Other stuff

#### HorizonsBot Version 1.16.0:
- Reenabled custom club reminder messages (use the `reminder-text` option in `/club-set-repeat`)
- Turning off club meeting repeats now cancels the upcoming event and reminder
- Fixed `/commands` sending a file while the commands list still fits in a message
- Automated patch notes and `/version` to check bot changes
- Other stuff

#### HorizonsBot Version 1.15.0:
- Check the repository for version notes pre-history
