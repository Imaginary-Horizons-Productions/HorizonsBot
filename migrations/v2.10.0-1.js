const clubDictionary = require("../config/clubList.json");
const { ensuredPathSave } = require("../source/util/fileUtil");

const migratedClubDictionary = {};
for (const id in clubDictionary) {
	const club = clubDictionary[id];
	const updatedClub = { ...club };
	if ("title" in club) {
		updatedClub.name = club.title;
		delete updatedClub.title;
	}
	if ("system" in club) {
		updatedClub.activity = club.system;
		delete updatedClub.system;
	}
	if ("seats" in club) {
		updatedClub.maxMembers = club.seats;
		delete updatedClub.seats;
	}
	migratedClubDictionary[id] = updatedClub;
}

ensuredPathSave(migratedClubDictionary, 'clubList.json');
