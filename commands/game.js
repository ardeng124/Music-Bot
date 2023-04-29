const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const YouTubeSR = require("youtube-sr").default

//const YouTube = require("discord-youtube-api");
//const config = require('../config.json');
//const youtube = new YouTube(config.youtubeKey);
const Discord = require("discord.js");
const easy = require("../ost-jsons/easy.json")
const medium = require("../ost-jsons/medium.json")
const hard = require("../ost-jsons/hard.json")
const veryHard = require("../ost-jsons/very-hard.json")
const {
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    createAudioPlayer,
    getVoiceConnection,
} = require("@discordjs/voice")
module.exports.help = {
  name: ["game"],
  description: "from soft ost guessing game ",
  usage: "-game difficulty/specific game",
};

module.exports.run = async (client, message, args) => {
 let isListening = true
  var points = 0;
  const serverQueue = client.queue.get(message.guild.id)
  const vc = message.member.voice.channel;
  if (!vc) {
      return message.reply("You need to get into a voice channel first!");
  }
  if(args.length < 2){
    let filter = (m) =>
        m.author.id === message.author.id &&
        [
            "ds1",
            "ds2",
            "ds3",
            "bb",
            "sk",
            "er",
            "all",
            "easy",
            "medium",
            "hard",
            "very hard",
            "very-hard",
            "cancel",
        ].includes(m.content.toLowerCase())
      message.channel.send("Choose a difficulty or a game \n Games include DS1, DS2, DS3, BB, SK, ER, ALL\n difficulties include easy, medium, hard, very hard").then(() => {
      message.channel.awaitMessages({filter, 
        max:1,
        time:30000,
        errors:['time']
      })
      .then(collected =>  {
        msg = collected.first();
        answer = msg.content.toLowerCase();
        switch (answer) {
          case "ds1":
          case "dark souls 1":
            items = filterLists("ds1")
            break
          case "ds2":
          case "dark souls 2":
            items = filterLists("ds2")
            break
          case "ds3":
          case "dark souls 3":
            items = filterLists("ds3")
            break
          case "bb":
          case "bloodborne":
            items = filterLists("bb")
            break
          case "sk":
          case "sekiro":
            items = filterLists("sk")
            break
          case "er":
          case "elden ring":
            items = filterLists("er")
            break
          case "all":
            items = []
            easy.forEach((i) => items.push(i))
            medium.forEach((i) => items.push(i))
            hard.forEach((i) => items.push(i))
            veryHard.forEach((i) => items.push(i))
            items = items.sort(() => Math.random() - 0.5)
            break
          case "easy":
            items = easy
            break
          case "medium":
            items = medium
            break
          case "hard":
            items = hard
            break
          case "very hard":
          case "very-hard":
            items = veryHard
            break
          case "cancel":
            return;
            break;
          default:
            return message.reply("Invalid input, please try again")
      }
      //For each video - Checks if it is available on youtube and if not it will search for a new one
      const isVideoUnavailable = async (videoUrl) => {
        try {
            await ytdl.getBasicInfo(videoUrl)
            return false // video is available
          } catch (err) {
            return true
            }
          }
          items.forEach(async (item) => {
            item.name = item.name.toLowerCase()
            item.alt.forEach((x) => x = x.toLowerCase())
           
            console.log(item.name)
            let unavailable =  await isVideoUnavailable(item.link)
            if(unavailable) {
              let query = `${item.name} + OST`
              songInfo = await YouTubeSR.searchOne(query);
              item.link = songInfo.url
            }
          })
          client.queue.delete(message.guild.id);
            
          //this is where the game starts
          //play an ost and give users a timeout based off difficult - not yet implemented
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: vc,
            connection: null,
            songs: items,
            playing: true,
            player: new createAudioPlayer(),
            audioResource: null,
            timestamp:0,
            points : 0,
            songCount: [items.length, 1]
        }
        client.queue.set(msg.guild.id, queueConstruct);
        
        try {
          const connection = joinVoiceChannel({
              channelId: vc.id,
              guildId: vc.guild.id,
              adapterCreator: vc.guild.voiceAdapterCreator,
          })
          queueConstruct.connection = connection
          // playYoutube(msg, msg.guild, queueConstruct.songs[0],0)
          playQueue(msg, msg.guild)
          
          return 
          } catch (err) {
            console.log("Error in try/catch when setting queue")
            console.log(err);
            client.queue.delete(message.guild.id);
            return message.channel.send("Error Playing " + err);
        }
        
      });
      }
      )
      
      client.on("messageCreate", async (message) => {
        if (isListening) {
          try {
            const serverQueue = await client.queue.get(message.guild.id)
            
            if(serverQueue) {
            if (
                message.content === serverQueue.songs[0].name || serverQueue.songs[0].alt.includes(message.content)) {
                message.reply(`Bingo \n ${getTime(serverQueue)}`)
                serverQueue.player.stop()
            }
          }
  
          } catch (e) {
            console.log(e)
          }
        } else {
          return;
        }
        })

  }
  //queue mangement function
  async function playQueue(message, guild) {
    const serverQueue = client.queue.get(guild.id)
    const songs = serverQueue.songs
    
    while (songs.length > 0) {
        console.log("flag")
          await playYoutube(message, guild, songs[0], 0)
      }
      try {
        if (serverQueue.connection) {
          serverQueue.connection.destroy()
        }
        client.queue.delete(guild.id)
        isListening = false
        return message.channel.send("Game completed!")
      } catch (e) {
        console.log(e)
      }
      
    }
    async function playYoutube(message, guild, song, timestamp, timeout) {
      const serverQueue = client.queue.get(guild.id)
      message.channel.send(`Playing track # ${serverQueue.songCount[1]}`)
      serverQueue.songCount[1] ++
    //dispatcher for playing song in vc
    let songInfo = await ytdl.getInfo(song.link);
    let duration = songInfo.videoDetails.lengthSeconds;
    let pointDecreaseInterval = duration/5;
    const player = serverQueue.player
    console.log(serverQueue.songs[0])  
    try {
      let stream = ytdl(song.link, {
        filter: "audioonly",
        fmt: "mp3",
      })    
      serverQueue.audioResource = createAudioResource(stream)
      const resource = serverQueue.audioResource
      serverQueue.timestamp = Date.now()
      player.play(resource)
      serverQueue.connection.subscribe(player)
      
      
      const songPromise = new Promise((resolve, reject) => {
        player.on(AudioPlayerStatus.Idle, () => {
          serverQueue.songs.shift()
          resolve()
        })
        player.on("error", (err) => {
        console.error(err);
        reject(err);
      });
    });
    
    return songPromise;
  } catch (error) {
    console.error(error);
    message.reply("Failed to play the live stream.");
  }
}
function getTime(serverQueue) {
  try {
    var time = serverQueue.timestamp
    var duration = serverQueue.songs[0].length
  } catch (err) {
    console.log(err)
     }
     //divide by 1000 because its in miliseconds
     time = Math.round(time / 1000)
     let currentTime = Date.now()
     currentTime = Math.round(currentTime / 1000)
     const remainingTime = currentTime - time
     const minutes = Math.floor(remainingTime / 60)
     const seconds = Math.floor(remainingTime % 60)
     let timestring = ""
     //converts time into human readable format
     //if they are less than 10 add a leading 0
     timestring +="You got it in "+ 
     (minutes < 10 ? `0${minutes}` : `${minutes}`) +
     ":" +
     (seconds < 10 ? `0${seconds}` : `${seconds}`)
     return timestring
    }
    
    const handleMessage = async (message) => {
      // your code to handle messages here
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
}