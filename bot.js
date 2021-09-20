const Discord = require('discord.js');
const config = require("./config.json");
const fs = require('fs');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const { syncBuiltinESMExports } = require('module');
const { validateID } = require('ytdl-core');
// const { isNumber } = require('util');
// var search = require('youtube-search');
const prefix = "-";
const queue = new Map();
var beRude = false;
// var opts = {
//   maxResults: 5,
//   key: config.youtubeKey
// };
const client = new Discord.Client();

client.login(config.token);


const commands = 
   [{
        "name":"play",
        "description":"plays music, can also accept playlists",
        "usage":"-play url"
    },
    {
        "name":"stop",
        "description":"stops music",
        "usage":"-stop OR -die"
    },
    {
        "name":"skip",
        "description":"skips music",
        "usage":"-skip"
    },
    {
        "name":"queue",
        "description":"displays current song queue",
        "usage":"-queue OR -q"
    },
    {
        "name":"remove",
        "description":"removes a song from queue",
        "usage":"-remove number OR -r number"
    },
    {
        "name":"shuffle",
        "description":"shuffles the queue",
        "usage":"-shuffle"
    }]

    const statusMessages = [
        ""
    ]


client.once('ready', () => {
    console.log("Ready!!")
    client.user.setActivity("suffering", { type: "STREAMING", url: "https://www.twitch.tv/something" })
});
client.once("reconnecting", () => {
    console.log("reconnecting");
})
client.once("disconnect", () => {
    console.log("Disconnected");
})
client.on("error", (e) => console.error(e));
client.on("message", async message => {
    console.log(queue);
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;
    if(message.guild.id = "578443669137522690") {
        beRude = true;
    } else {
        beRude = false;
    }
    const args = message.content.split(" ");
   
    let command = args[0].substring(1);
    if(args.length > 3) {
        message.reply("no");
        return;
    }
    const serverQueue = queue.get(message.guild.id);
    switch(command) {
        case "play":
            setupConnection(message,args[1],serverQueue);
        break;
        case "stop":
            stop(message, serverQueue);
        break;
        case "die":
            stop(message, serverQueue);
        break;
        case "pause":
        break;
        case "skip":
            skip(message, serverQueue);
        break;
        case "queue":
            queueCommand(message,serverQueue);
        break;
        case "q":
            queueCommand(message,serverQueue);
        break;
        case "remove":
            removeItem(message, serverQueue, args[1]);
        break;
        case "r":
            removeItem(message, serverQueue, args[1]);
        break;
        case "help":
            help(message);
        break;
        case "shuffle":
            shuffle(message,serverQueue);
        break;
        case "bump":
            bump(message,serverQueue, args[1], args[2]);
        break;
        case "ping":
            ping(message)
        break;
        default:
            console.log(message.content);
            // if(beRude == true) message.reply("not a command bozo");
            // else message.reply("thats not a command");
        break;   
    }
});

async function setupConnection(message, songUrl, serverQueue) {
    const vc = message.member.voice.channel;
    if(!vc) {
        return message.reply("You need to get into a voice channel first!");
    }
    const permissions = vc.permissionsFor(message.client.user)
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.reply("I don't have permission to join!");
    }
    //load details of the video
    var songInfo;
    var isPlaylist = ytpl.validateID(songUrl);
    var song;
    if(!isPlaylist){
        try{
            songInfo = await ytdl.getInfo(songUrl);
        } catch(err) {
            return message.reply("Please use a youtube link");

            // let video = message.content.substring(5);
            // var searchResult = search(video);
            // console.log(searchResult);
            // songInfo = await ytdl.getInfo(searchResult.url);
        }
        
        let title = songInfo.videoDetails.title;
        let url = songInfo.videoDetails.video_url
        let duration = songInfo.videoDetails.lengthSeconds;
       // let thumbnail = songInfo.videoInfo.thumbnail_url;
        let author = songInfo.videoDetails.author.name

        song = {
            title: title,
            url: url,
            length: duration,
            //thumbnail: thumbnail,
            author: author
        }
    } else {
        var songs = await ytpl(songUrl)

        var formattedSongList = [];
        for(let i =0; i < songs.items.length; i ++) {
            
            let title = songs.items[i].title
            let url = songs.items[i].shortUrl
            let duration = songs.items[i].duration
            let author = songs.items[i].author.name
            //let thumbnail = songInfo.thumbnail_url;
            let song = {
                title: title,
                url: url,
                length: duration,
                author: author
                //thumbnail: thumbnail
            }
            formattedSongList.push(song);
        }
        
    }

    //server queue management
    if (serverQueue) {
        if (isPlaylist) {
            formattedSongList.forEach((element) => {serverQueue.songs.push(element)})
        };
        if (!isPlaylist) serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue`);
        } else {
        //create the struct for the queue
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: vc,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            currentSong: null
        };
        queue.set(message.guild.id, queueConstruct);
        if (isPlaylist) {
            formattedSongList.forEach((element) => {queueConstruct.songs.push(element)})
        }
        if (!isPlaylist) queueConstruct.songs.push(song);
    
    try {
        var connection = await vc.join();
        queueConstruct.connection = connection;
        play(message,message.guild, queueConstruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send("I/you/we fucked up "+err);
    }
    }
}

function play(message,guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
        serverQueue.songs.shift();
        serverQueue.currentSong = serverQueue.songs[0];
        play(message,guild,serverQueue.songs[0]);
        })
        .on("error", error => {
            console.log(error)
            message.channel.send(`There was a problem playing this song *${serverQueue.currentSong.title}*`)
            play(message,guild,serverQueue.songs[0]);
        });
            
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now playing: **${song.title}** by ${song.author}`);
}

function skip(message, serverQueue) {
    if(!message.member.voice.channel) {
        return message.reply("Join a vc first!");
    }
    if(!serverQueue) {
        return message.reply("No song to skip")
    }
   
    message.channel.send(`Skipped **${serverQueue.songs[0].title}**`);
    serverQueue.connection.dispatcher.end();
    //serverQueue.songs.shift();
}

function stop(message, serverQueue) {
    if(!message.member.voice.channel) {
       return message.reply("you have to be in a vc to stop!")
    }
    if(!serverQueue) {
       return message.reply("there are no songs to stop");
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

//TODO: duration
function queueCommand(message, serverQueue) {
    if(!serverQueue) {
        return message.reply("Queue is empty");
    }
    const embed = new Discord.MessageEmbed()
        .setTitle("Queue")
        .setColor(0x78b0f0)
        .setFooter(`server id ${message.guild.id}`)
        .setTimestamp();
    for(let i = 0; i < serverQueue.songs.length; i++) {
        //let length = parseInt(serverQueue.songs[i].duration,10);
        //console.log(serverQueue.songs[i].duration);
       // console.log(length);
        embed.addFields({name: serverQueue.songs[i].title, value:`Position ${i+1}`})
    }
    message.channel.send(embed);
}

function help(message) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Help")
        .setColor(0x78b0f0)
        .setDescription("prefix: -");
    commands.forEach(function(obj){embed.addFields({ name: obj.name, value: `**desc:** ${obj.description} \n **usage:** ${obj.usage}`})} );
    message.channel.send(embed);
}

function removeItem(message,serverQueue, index) {
    if(!message.member.voice.channel) {
        return message.reply("you have to be in a vc to remove items from queue!")
    }
    if(!serverQueue) {
        return message.reply("Nothing in the queue to remove")
    }
    if(isNaN(index)) {
        return message.reply("What the fuck do I do with that letter? do you count in letters?")
    }
    index--;
    let songToBeRemoved = serverQueue.songs[index];
    serverQueue.songs.splice(index,1);
    message.channel.send(`**${songToBeRemoved.title}** by *${songToBeRemoved.author}* has been removed from the queue`);

}

function shuffle(message,serverQueue) {
    if(!message.member.voice.channel) {
        return message.reply("you have to be in a vc to shuffle!")
    }
    if(!serverQueue) {
        return message.reply("there are no songs to shuffle");
    }
    if(serverQueue.songs.length <2) {
        return message.reply("not enough songs to shuffle")
    }
    var first = serverQueue.songs[0];
    let index = serverQueue.songs.length, randomIndex;
    while(index != 0) {
        randomIndex = Math.floor(Math.random() * index);
        index--;
        [serverQueue.songs[index], serverQueue.songs[randomIndex]] = [serverQueue.songs[randomIndex],serverQueue.songs[index]]
        //swap so serverQueue[0] is always whats currently playing:        
    }
    var temp = serverQueue.songs[0];
    if(serverQueue.songs[0] != serverQueue.currentSong) {
        for(let i = 0; i < serverQueue.songs.length; i ++) {
            if(serverQueue.songs[i] == first) {
                serverQueue.songs[0] = serverQueue.songs[i];
                serverQueue.songs[i] = temp;
                break;
            }
        }
    }
   
    message.channel.send("Queue has been shuffled");

}
function ping(message) {
    message.channel.send("Pinging...").then(m => {
        var ping = m.createdTimestamp - message.createdTimestamp;
        m.edit(`Ping is ${ping}ms`);
    })
}

//TODO: Finish
function bump(message,serverQueue, toBeMovedIndex, moveMeHere) {
    if(!message.member.voice.channel) {
        return message.reply("you have to be in a vc to bump items in queue!")
    }
    if(!serverQueue) {
        return message.reply("Nothing in the queue to bump")
    }
    if(isNaN(toBeMovedIndex) || isNaN(moveMeHere)) {
        return message.reply("What the fuck do I do with that letter? do you count in letters?")
    }
    if(serverQueue.songs.length <2) {
        return message.reply("not enough songs to bump")
    }
    if(toBeMovedIndex < moveMeHere) {
        return message.reply("no");
    }
    

}

// search('jsconf', opts, function(err, results) {
//     if(err) return console.log(err);
    
//     console.dir(results[0]);
//     return results[0]
// });

