const buttonDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js"
]) {
	const button = require(`./${file}`);
	buttonDictionary[button.name] = button;
}

exports.callButton = function (mainId, interaction, args) {
	buttonDictionary[mainId].execute(interaction, args);
}
