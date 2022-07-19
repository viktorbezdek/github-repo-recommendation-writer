import { config } from "dotenv"
import Twitter from "twitter"
import inquirer from "inquirer"
import fs from "fs"
import random from "random"
import { Configuration, OpenAIApi } from "openai"
import { remark } from "remark"
import strip from "strip-markdown"
import { fetchReadme as _fetchReadme } from "@varandas/fetch-readme"

const {
  parsed: {
    OPENAI_API_KEY,
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN_KEY,
    TWITTER_ACCESS_TOKEN_SECRET,
  },
} = config()

const openai = new OpenAIApi(
  new Configuration({
    apiKey: OPENAI_API_KEY,
  })
)

/**
  Return a random element from the given array.
  @param array - The array to sample from.
  @returns a random element from the array.
  */
function arraySample(array) {
  return array[Math.floor(random.integer(0, array.length))]
}

/**
 * It reads a file, splits it into lines, and returns a random line
 * @param file - The file to read from.
 * @returns A random line from the file.
 */
function readRandomLineFromFile(file) {
  const lines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((x) => typeof x !== "undefined" && x.includes("/"))
  if (lines.length === 0) {
    console.error("No lines found in file")
    process.exit(1)
  }
  return arraySample(lines)
}

/**
 * It fetches the readme of a repository
 * @param nameOwner - The name of the repository owner and the repository name, separated by a slash.
 * @returns A function that takes in a nameOwner and returns a readme
 */
async function fetchReadme(nameOwner) {
  if (!nameOwner || !nameOwner.includes("/")) {
    console.error('Please provide projects in the format "owner/repo"')
    process.exit(1)
  }
  const [username, repository] = nameOwner.split("/")
  try {
    const readme = await _fetchReadme({
      username,
      repository,
    })
    return readme
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

/**
  It takes a string as an argument, and then posts that string to Twitter
  @param tweetText - The text of the tweet you want to post.
  */
function postTweet(tweetText) {
  const client = new Twitter({
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token_key: TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
  })

  return new Promise((resolve, reject) => {
    client.post(
      "statuses/update",
      { status: tweetText },
      function (error, tweet, response) {
        if (error) reject(error)
        resolve(tweet)
      }
    )
  })
}

/* It's using the OpenAI API to generate a tweet based on the input data. */
async function composeTweet(inputData) {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-002",
      prompt:
        `Write 140 characters long appraisal or recommendation of following project with hashtags:\n` +
        `${JSON.stringify(inputData, null, 2)}\n` +
        `===\n`,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["==="],
    })
    return `${response.data.choices[0].text}
${inputData.href}`
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  }
}

/**
    It writes a tweet, asks if it's good enough, and if it's not, it writes another one
    @returns A promise that resolves to a string.
    */
async function main() {
  console.info("💡 Writing engaging tweet...")
  const project = readRandomLineFromFile("./data/repos.txt")

	console.info(`📂 Project: ${project}`)
  const readme = await remark()
    .use(strip)
    .process(await fetchReadme(project))

  const href = "https://github.com/" + project
  const tweetProposal = await composeTweet({ project, readme, href })

  try {
    const { confirm } = await inquirer.prompt({
      type: "confirm",
      message: `Is the tweet good enough?
          ${tweetProposal}`,
      name: "confirm",
    })

    if (confirm) {
      const { edit } = await inquirer.prompt({
        type: "confirm",
        message: `Do you want to edit it?`,
        name: "edit",
      })

      let tweet = tweetProposal

      if (edit) {
        const { editedTweet } = await inquirer.prompt({
          type: "editor",
          message: "Edit the tweet",
          name: "editedTweet",
          default: tweetProposal,
        })
        tweet = editedTweet
      }

      return postTweet(tweet)
    }
  } catch (e) {
    console.error(`❌ ${e.message}`)
		process.exit(1)
  }

  return main()
}

main().then(() => console.log("✅ Tweet posted!"))
