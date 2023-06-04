const { Octokit } = require("@octokit/rest");
const { Base64 } = require("js-base64");
const fs = require("fs");
const prettier = require('prettier');
const { decodeGuildExperiment } = require('discord-experiments');

async function fetchRollouts() {
  try {
    const response = await fetch('https://api.rollouts.advaith.io/');
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch rollouts: ${error.message}`);
  }
}

async function replaceRolloutValue() {
  try {
    const rollouts = await fetchRollouts();

    for (const rollout of rollouts) {
      const decodedRollout = decodeGuildExperiment(rollout.rollout);
      rollout.rollout = decodedRollout;
    }

    const jsonData = JSON.stringify(rollouts, null, 2);
    const formattedJsonData = prettier.format(jsonData, {
      parser: 'json'
    });

    fs.writeFile('data.json', formattedJsonData, 'utf8', (err) => {
      if (err) {
        throw new Error(`Error writing to data.json: ${err.message}`);
      }
      console.log('Data has been written to data.json on your local machine.');
    });
  } catch (error) {
    console.error(error);
  }
}

replaceRolloutValue();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const main = async () => {
  try {
    const content = fs.readFileSync("./data.json", "utf-8");
    const contentEncoded = Base64.encode(content);

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: "Discord-dataminings",
      repo: "discord-experiments-datamining",
      path: "data.json",
      message: "✅ Data updated",
      content: contentEncoded,
      committer: {
        name: `github-actions[bot]`,
        email: "github-actions[bot]@users.noreply.github.com",
      },
      author: {
        name: "github-actions[bot]",
        email: "github-actions[bot]@users.noreply.github.com",
      },
    });

    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

main();
