module.exports = {
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", {
      "tarballDir": "release",
      "usesAutomationToken": true
    }],
    ["@semantic-release/github", {
      "assets": "release/*.tgz"
    }],
    "@semantic-release/git"
  ],
  "preset": "angular"
}