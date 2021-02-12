require('dotenv').config();
let Twit = require('twit');
let debug = require('debug')
let derror = debug('ERROR:');
let dreject = debug('REJECT:');
let daccept = debug('ACCEPT:');
let dlog = debug('LOG:');
let dpass = debug('PASSED:');
let config = {
    me: process.env.ACCOUNTNAME,
    myList: process.env.LISTID,
    tweetAccept: 'bot,twitter,sleep,wierd,word,to,just,one',
    tweetReject: 'test',
    keys: {
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN_KEY,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
    }
};
let accepted = 0;
let rejected = 0;
let users = 0;
if (!config.keys.consumer_key){
  dlog("no CONSUMER_KEY found in Environmental Variables")
  dlog("please set up the .env to run the test")
  return;
}
if (!config.myList){
  dlog("no LISTID found in Environmental Variables")
  dlog("please set up the .env to run the test")
  return;
}
let T = new Twit(config.keys);

function getListMembers() {
    let memberIDs = [];
    dlog('testing lists/members api and functions...');
	T.get('lists/members',{
    owner_screen_name: config.me,
    list_id: config.myList
  },
    function(err, data){
        if (!err) {
          dlog('looping over user in list for IDs..')
            for (let i=0; i < data.users.length; i++) {
                memberIDs.push(data.users[i].id_str);
            }
            users = memberIDs.length;
            startListen(memberIDs);
        } else {
            derror(err);
            derror(data);
        }
    })
}

function startListen() {
  dlog('testing statuses/sample api and functions...')
  let stream = T.stream('statuses/sample', {});
  stream.on('connect', ()=>{
    dlog('connecting...')
  });

  stream.on('connected', ()=>{
    dlog('Connected')
    setTimeout(()=>{
      stream.stop()
      dpass('total Users Watched From List: '+users)
      dpass('total Accepted Tweets: '+accepted)
      dpass('total Rejected Tweets: '+rejected)
    },10000)
  });

  stream.on('tweet', function (tweet) {
    let tweetText = tweet.text;
    let tweetID = tweet.id_str;
    let tweetUser = tweet.user.name;
    if (!tweet.in_reply_to_user_id_str && !tweet.retweeted) {
      dlog('not a reply and not retweeted')
      if (tweet.truncated){
        dlog('truncated text, grab text from extended_tweet object')
        tweetText = tweet.extended_tweet.full_text;
      }
      if(tweet.retweeted_status){
        dlog('retweet from user, grab text and ID from retweet_status object')
        tweetID = tweet.retweeted_status.id_str;
        tweetText = tweet.retweeted_status.text;
        tweetUser = tweet.retweeted_status.user.name;
        if(tweet.retweeted_status.truncated){
          dlog('retweet from user is truncated text, grab text from extended_tweet object')
          tweetText = tweet.retweeted_status.extended_tweet.full_text;
        }
      }
      const accept = tweetText.split(" ").some(r=> config.tweetAccept.split(",").indexOf(r) >= 0);
      const reject = tweetText.split(" ").some(r=> config.tweetReject.split(",").indexOf(r) >= 0);
      if (accept && !reject){
        daccept('passsed ACCEPT and REJECT filters')
        daccept('   '+tweetText)
        accepted++
      } else {
        dreject('did NOT pass ACCEPT and REJECT filters')
        dreject('   '+tweetText)
        rejected++
      }
    } else {
      dreject('is reply and retweeted')
      dreject('   '+tweetText)
      rejected++
    }
  });

  stream.on('error', function(err){
    derror("")
  	derror(err)
  });

  stream.on('disconnect', function(res){
    derror('disconnected')
    derror(res)
  });
}

getListMembers();
