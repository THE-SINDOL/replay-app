const commitAnalyzer = [
  "@semantic-release/commit-analyzer",
  {
    releaseRules: [
      {
        type: "fix",
        scope: "*",
        release: "patch",
      },
      {
        type: "feat",
        scope: "*",
        release: "minor",
      },
      {
        type: "docs",
        scope: "*",
        release: false,
      },
      {
        type: "refac",
        scope: "*",
        release: false,
      },
      {
        type: "ci",
        scope: "*",
        release: false,
      },
      {
        type: "chore",
        scope: "*",
        release: false,
      },
      {
        type: "test",
        scope: "*",
        release: false,
      },
      {
        scope: "no-release",
        release: false,
      },
    ],
    parserOpts: {
      noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
    },
  },
];
const githubRelease = [
  "@semantic-release/github",
  {
    assets: [
      {
        path: ["artifacts/**", "!artifacts/artifacts-Linux*", "!dist/**/*.app"],
      },
    ],
  },
];
const config = {
  plugins: [commitAnalyzer, "@semantic-release/release-notes-generator"],
};
if (!process.env.NPM_UPDATE_ONLY) {
  config.plugins.push(githubRelease);
}
module.exports = config;
