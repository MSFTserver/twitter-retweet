require('dotenv').config();
let Twit = require('twit');
let debug = require('debug')
let derror = debug('ERROR:');
let dreject = debug('REJECT:');
let daccept = debug('ACCEPT:');
let ddrop = debug('DROP:');
let dlog = debug('LOG:');
let dpass = debug('PASSED:');
let config = {
    me: process.env.TESTACCOUNTNAME,
    myList: process.env.TESTLISTID,
    regexAccept: process.env.TESTACCEPT,
    regexReject: process.env..TESTREJECT,
    keys: {
        consumer_key: process.env.TESTCONSUMER_KEY,
        consumer_secret: process.env.TESTCONSUMER_SECRET,
        access_token: process.env.TESTACCESS_TOKEN_KEY,
        access_token_secret: process.env.TESTACCESS_TOKEN_SECRET
    }
};
let accepted = 0;
let rejected = 0;
let users = 0;
let dropped = 0;
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
      dpass('total Dropped Tweets: '+dropped)
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
      let regexAccept = new RegExp(config.regexAccept, 'gi');
      const accept = regexAccept.test(tweetText);
      let regexReject = new RegExp(config.regexReject, 'gi');
      const reject = regexReject.test(tweetText)
      dlog(accept,reject);
      if (accept && !reject){
        daccept('passsed ACCEPT and REJECT filters')
        daccept('   '+tweetText)
        T.post('statuses/retweet/:id', { id: tweetID }, function (err, data, response) {
          if(!err){
            T.post('favorites/create', { id: tweetID }, function (err, data, response) {
              if(!err){
                daccept('Retweeted '+tweetUser+': '+tweetText);
                accepted++
              } else {
                derror('Favorite Failed!');
                derror(err);
              }
            })
          } else {
            derror('Retweet Failed!');
            derror(err);
          }
        })
      } else {
        dreject('did NOT pass ACCEPT and REJECT filters')
        dreject('   '+tweetText)
        rejected++
      }
    } else {
      ddrop('is reply and retweeted')
      ddrop('   '+tweetText)
      dropped++
    }
  });

  stream.on('limit', function(err){
  	derror(err)
  });

  stream.on('error', function(err){
  	derror(err)
  });

  stream.on('disconnect', function(res){
    derror('disconnected')
    derror(res)
  });
}

getListMembers();
