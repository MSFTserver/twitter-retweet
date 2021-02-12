# Twitter Retweet
# Under-Construction
This is a simple twitter bot, designed to retweet and like the contents of a twitter list based on keywords to reject and accept certain tweets. 


## Setup Your Own
1. [Install node.js & npm](http://nodejs.org/download/) (if you haven't already).
2. Download this repo with `git clone git@github.com:MSFTserver/twitter-retweet.git`.
3. in Terminal or Command Prompt, Navigate into the folder and run `npm install` to download dependencies.
4. Rename `.env.example` to `.env`, or you can actually just set them in your systems Environmental Variables and skip step 5.
5. Open `.env` enter the Account Name, enter the Lists ID number (can be found in the URL), enter Reject keywords you want to EXCLUDE, also the
Accept keywords on what you want the bot to INCLUDE. lastly enter the keys for your bot. If you have don't have keys [Create a twitter application HERE](https://apps.twitter.com/app/new), grant it the necessary access, and generate your tokens/keys.
6. run the bot `npm run start`.

## Credit
Twitter Retweet is written in [node.js](http://nodejs.org/) and
