const { PROD, THRESHOLD, UPVOTES, DOWNVOTES, REPO_OWNER, REPO_NAME } = require("./consts");

const GITHUB_TOKEN = require("./keys");

const { exec } = require('child_process');
const GitHub = require('github-api');

// basic auth
const gh = new GitHub({
    username: 'Smittyvb',
    token: GITHUB_TOKEN
});

var rateLimit = 500; //Wait between requests, to stay under rate limits. Before we get data, assume that it's high.
gh.getRateLimit().getRateLimit().then(function (newRateLimit) {
    rateLimit = ((newRateLimit.data.resources.core.reset - (Date.now() / 1000)) * 1000) / newRateLimit.data.resources.core.remaining;
    rateLimit = 1 / rateLimit;
    console.log("Got rate limit: " + (rateLimit * 1).toFixed(19) + " reqs/s.");
});

var repo = gh.getRepo(REPO_OWNER, REPO_NAME);
var issues = gh.getIssues(REPO_OWNER, REPO_NAME);
function lookAtPrs() {
    repo.listPullRequests({
        state: "open",
        base: "master" //ignore non-master PRs
    }).then(function (prs) {
        prs = prs.data;
        prs.forEach(function (prOverview) {
            issues.listIssueComments(prOverview.number).then(function (comments) {
                var score = 0;
                var voters = []; //anyone in this list will have their votes ignored
                comments = comments.data;
                comments.forEach(function (comment) {
                    if (voters.indexOf(comment.user.id) > -1) {
                        if (PROD) {
                            return;
                        }
                    }
                    var commentBody = comment.body.toLowerCase();
                    for (var upIndex = 0; upIndex < UPVOTES.length; upIndex++) {
                        if ((commentBody.indexOf(UPVOTES[upIndex]) > -1)) {
                            score++;
                            voters.push(comment.user.id);
                            return;
                        }
                    }
                    for (var downIndex = 0; downIndex < DOWNVOTES.length; downIndex++) {
                        if ((commentBody.indexOf(DOWNVOTES[downIndex]) > -1)) {
                            score--;
                            voters.push(comment.user.id);
                            return;
                        }
                    }
                });
                console.log(score);
                if (score >= THRESHOLD) {
                    repo.mergePullRequest(prOverview.number, {
                        commit_message: "Merging #" + prOverview.number + ", with a score of " + score + "."
                    }).then(function (res) {
                        if (res.status === 200) {
                            console.log("Suceessfully merged pull request #" + prOverview.number + "!");
                            exec("git pull", function () {
                                require('child_process').execSync('node index');
                                console.log("An update caused the new server code to exit: #" + prOverview.number);
                                process.exit(1);
                            });


                        } else {
                            console.log("Attempted, but failed, to merge #" + prOverview.number + ", with a status of " + res.status);
                        }
                    });
                }
            });
        });
    });
}

lookAtPrs();
setInterval(lookAtPrs, 30000)
