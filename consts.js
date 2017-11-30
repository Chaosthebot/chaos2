module.exports = {
    PROD: true,
    THRESHOLD: 4,
    UPVOTES: ["+1", "upvote", "i like it", "i really like it", "👍"],
    DOWNVOTES: ["-1", "downvote", "i dislike it", "i really dislike it", "i hate it", "i really hate it", "👎"]
};

module.exports.REPO_OWNER = module.exports.PROD ? "Chaosthebot" : "Smittyvb";
module.exports.REPO_NAME = module.exports.PROD ? "chaos2" : "chaos-2";
