require('dotenv').config(); // import env variables
let Twit = require('twit'); // import twit api library
let ascii = require('./ascii.js'); // import snazy ascii art console outputs
let config = {
    me: process.env.ACCOUNTNAME, // The authorized account with a list to retweet.
    myList: process.env.LISTID, // The list we want to retweet.
    tweetAccept: process.env.ACCEPT, // Accept only tweets matching this regex pattern.
    tweetReject: process.env.REJECT, // AND reject any tweets matching this regex pattern.
    keys: { //BOT KEYS FOR TWITTER
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN_KEY,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
    }
};
let T = new Twit(config.keys); //create twitter client

//fetches the list and grabs its user IDs passing it to the stream listening function
function getListMembers() {
    let memberIDs = [];
    console.log('Checking Boarding Passes...\n');
	T.get('lists/members',{
    owner_screen_name: config.me,
    list_id: config.myList
  },
    function(error, data){
        if (!error) {
            // loops over ids of users from a list
            for (let i=0; i < data.users.length; i++) {
                // pushes ids to array
                memberIDs.push(data.users[i].id_str);
            }
            let rocketBoarding =
            ascii.rocketBoardingTop+
            '             |:Boarded|'+'\n'+
            '             |:  '+memberIDs.length+'   |'+'\n'+
            '   +         |: Users |          *'+'\n'+
            ascii.rocketBoardingBottom
            console.log(rocketBoarding)
            startListen(memberIDs);
        } else {
            console.log(error);
            console.log(data);
        }
    })
}
// listens to the steam with filter on accounts filtered in from a twitter list
function startListen(users) {
  // creates a stream listening for supplied users
  // users provided by getListMembers() function
  let stream = T.stream('statuses/filter', {follow: users});

  // watches connect event
  // fires when the stream is establishing its connection
  stream.on('connect', ()=>{
    console.log(ascii.rocketConnecting)
  });

  // watches connected event
  // fires when the stream has connected
  stream.on('connected', ()=>{
    let rocketConnected =
    ascii.rocketConnectedTop +
    '            /|:Landed |'+'\n'+
    '           / |:  '+users.length+'   |'+'\n'+
    '          / /|: Users |'+'\n'+
    ascii.rocketConnectedBottom
    console.log(rocketConnected)
  });

  // watches tweet event
  // fires when the stream has received a tweet
  stream.on('tweet', function (tweet) {
    let tweetText = tweet.text;
    let tweetID = tweet.id_str;
      // checks if tweet author is on users list.
      // checks if tweet is a in_reply_to_user_id_str
      // checks if tweet has already been retweeted
      // if output [true,false,false] extract info
      if (users.indexOf(tweet.user.id_str) > -1 && !tweet.in_reply_to_user_id_str && !tweet.retweeted) {
        // checks if tweet is truncated to a char limit.
        // if output [true] sets tweet text to extended version.
        if (tweet.truncated){
          tweetText = tweet.extended_tweet.full_text;
        }
        // checks if tweet is a retweet
        // if output [true] set id and text to retweeted stats
        if(tweet.retweeted_status){
          tweetID = tweet.retweeted_status.id_str;
          tweetText = tweet.retweeted_status.text;
          // checks if tweet is truncated to a char limit.
          // if output [true] sets tweet text to extended version.
          if(tweet.retweeted_status.truncated){
            tweetText = tweet.retweeted_status.extended_tweet.full_text;
          }
        }
        //checks if tweetText contains any words from Accepted words list
        const accept = tweetText.split(" ").some(r=> config.tweetAccept.split(",").indexOf(r) >= 0);
        //checks if tweetText contains any words from Rejected words list
        const reject = tweetText.split(" ").some(r=> config.tweetReject.split(",").indexOf(r) >= 0);
        // runs if output [true,false]
        console.log(accept,reject)
        if (accept && !reject){
          console.log('Accept')
          console.log(tweet)
          console.log(tweetID)
          console.log(tweetText)
          //console.log("Retweeted User ["+tweet.user.name + "]: " + tweet.text);
          T.post('statuses/retweet/:id', { id: tweetID }, function (err, data, response) {
            console.log(data)
          })
          T.post('favorites/create/:id', { id: tweetID }, function (err, data, response) {
            console.log(data)
          })
        } else {
          console.log('reject2')
          console.log(tweet)
          console.log(tweetID)
          console.log(tweetText)
        }
      }
  });

  // watches limit event
  // fires when the stream hits rate limits
  stream.on('limit', function(err){
  	console.log(err)
  });

  // watches error event
  // fires when the stream has an error
  stream.on('error', function(err){
  	console.log(err)
  });

  // watches disconnect event
  // fires when the stream disconnects
  stream.on('disconnect', function(err){
    console.log(ascii.disconnected)
    // retries from start
  	getListMembers();
  });

}

getListMembers();
