const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
//const YouTube = require("discord-youtube-api");
//const config = require('../config.json');
//const youtube = new YouTube(config.youtubeKey);
const Discord = require("discord.js");
const easy = require("../ost-jsons/easy.json")
const medium = require("../ost-jsons/medium.json")
const hard = require("../ost-jsons/hard.json")
const veryHard = require("../ost-jsons/very-hard.json")

module.exports.help = {
  name: ["game"],
  description: "from soft ost guessing game ",
  usage: "-game difficulty/specific game",
};

module.exports.run = async (client, message, args) => {
  var points = 0;
  const serverQueue = client.queue.get(message.guild.id);
  const vc = message.member.voice.channel;
  if (!vc) {
      return message.reply("You need to get into a voice channel first!");
  }
  if(args.length < 2){
    let filter = m => m.channel.id === message.channel.id;
    message.channel.send("Choose a difficulty or a game \n Games include DS1, DS2, DS3, BB, SK, ER, ALL\n difficulties include easy, medium, hard, very hard").then(() => {
      message.channel.awaitMessages(filter, {
        max:1,
        time:30000,
        errors:['time']
      })
      .then(async message =>  {
        msg = message.first();
        answer = msg.content.toLowerCase();
        switch(answer){
          case 'ds1' || "dark souls 1": items = filterLists('ds1'); 
          case 'ds2' || "dark souls 2": items = filterLists('ds2')
          case 'ds3' || "dark souls 3": items = filterLists('ds3')
          case 'bb' || "bloodborne": items = filterLists('bb')
          case 'sk' || "sekiro": items = filterLists('sk')
          case 'er' || "elden ring": items = filterLists('er')
          case 'ALL':
            items = []
            easy.forEach(i => items.push(i))
            medium.forEach(i => items.push(i))
            hard.forEach(i => items.push(i))
            veryHard.forEach(i => items.push(i))
            items = items.sort(() => Math.random() - 0.5);
            break;
          case 'easy': items = easy;
          case 'medium': items = medium;
          case 'hard': items = hard;
          case 'very hard'|| 'very-hard': items = veryHard;
        }
        //this is where the game starts
        //play an ost and give users a timeout based off difficult 
        if (!serverQueue) {
          queueConstruct = {
              textChannel: message.channel,
              voiceChannel: vc,
              connection: null,
              songs: items,
              volume: 5,
              playing: true,
              currentSong: null,
              looping: false
          };
        }
        client.queue.set(msg.guild.id, queueConstruct);
        try {
          var connection = await vc.join();
          queueConstruct.connection = connection;
          playYoutube(msg, msg.guild, queueConstruct.songs[0],0).then(message => {
            msg.channel.awaitMessages(filter, {
              time:30000,
              errors:['time']
            }).then( message =>  {
              answer = message.content.toLowerCase();
              if(answer == serverQueue.songs[0].name || serverQueue.songs[0].alt-names.includes(answer)){
                message.reply("Bingo")
                serverQueue.connection.dispatcher.end();

              }
            })

          })
        } catch (err) {
            console.log("Error in try/catch when setting queue")
            console.log(err);
            client.queue.delete(message.guild.id);
            return message.channel.send("I/you/we fucked up " + err);
        }

      })

  })
}
  function filterLists(gameName) {
    let arr = []
  
    easy.forEach(i => {
      if (i.game == gameName) 
      arr.push(i)
    })
    medium.forEach(i => {
      if (i.game == gameName) 
      arr.push(i)
    })
    hard.forEach(i => {
      if (i.game == gameName) 
      arr.push(i)
    })
    veryHard.forEach(i => {
      if (i.game == gameName) 
      arr.push(i)
    })
    arr = arr.sort(() => Math.random() - 0.5);
    return arr;
  }
  async function playYoutube(message, guild, song, timestamp, timeout) {
    if (!song) {
        // serverQueue.voiceChannel.leave();
        // client.queue.delete(guild.id);
        // return message.channel.send("Playback finished");
    }
    //dispatcher for playing song in vc
    let songInfo = await ytdl.getInfo(song.url);
    let duration = songInfo.videoDetails.lengthSeconds;
    let pointDecreaseInterval = duration/5;


    const dispatcher = serverQueue.connection
        
        .play(ytdl(song.url),{seek:timestamp})
        .on("finish", () => {
            return([dispatcher.timestamp, duration]);
        })
        .on("error", (error) => {
            var time = dispatcher.timestamp;
            
            console.log("error playing");
            console.log(error);

            message.channel.send(
                `There was a problem playing the track`
            );
            playYoutube(message, guild, serverQueue.songs[0],time);
        });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

}
}