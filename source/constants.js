const { guildId, topicCategoryId } = require('../config/auth.json');

exports.SAFE_DELIMITER = "→";
exports.MAX_SET_TIMEOUT = 2 ** 31 - 1;
exports.guildId = guildId;
exports.topicCategoryId = topicCategoryId;
