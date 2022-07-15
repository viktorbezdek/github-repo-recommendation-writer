# GitHub Repo Recommendation Writer

> A simple CLI experiment that writes recommendation of GitHub repository/project in form of tweet. Powered by OpenAI GPT-3.

![](./demo.gif)

Prerequisites:

- Node 17.5+ (or higher)
- OpenAI API access
- Twitter API access

Create `.env` file with:

```
OPENAI_API_KEY=sk-your-credentials

TWITTER_CONSUMER_KEY=your-consumer-key
TWITTER_CONSUMER_SECRET=your-consumer-secred
TWITTER_ACCESS_TOKEN_KEY=your-access-token-key
TWITTER_ACCESS_TOKEN_SECRET=your-access-token-secret
```

Populate `data/repos.txt` with github projects you like and want to tweet about in following format:

```
owner/reponame
owner/reponame
owner/reponame
```

Install dependencies using `npm install` or `yarn install`.

Run the tool with: `node index.js` or `npm start` or `yarn start`

---

⚠️ WARNING: This shouldn't be used as basis for Twitter bot. OpenAI forbids to use GPT-3 in this way.
