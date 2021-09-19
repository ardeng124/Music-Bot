const Discord = require('discord.js');
const config = require("./config.json");
const fs = require('fs');
const ytdl = require('ytdl-core');
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
        "description":"plays music",
        "usage":"-play url"
    },
    {
        "name":"stop",
        "description":"stops music",
        "usage":"-stop"
    },
    {
        "name":"skip",
        "description":"skips music",
        "usage":"-skip"
    }]


client.once('ready', () => {
    console.log("Ready!!")
    client.user.setPresence({ status: "online", game: { name: "prefix: -" } });
});
client.once("reconnecting", () => {
    console.log("reconnecting");
})
client.once("disconnect", () => {
    console.log("Disconnected");
})

client.on("message", async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;
    if(message.guild.id = "578443669137522690") {
        beRude = true;
    } else {
        beRude = false;
    }
    const args = message.content.split(" ");
   
    let command = args[0].substring(1);
    var songUrl = args[1];

    const serverQueue = queue.get(message.guild.id);
    switch(command) {
        case "play":
            setupConnection(message,songUrl,serverQueue);
        break;
        case "stop":
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
        //finish this
        case "help":
            help(message);
        break;
        default:
            console.log(message.content);
            if(beRude == true) message.reply("not a command bozo");
            else message.reply("thats not a command");
        break;   
    }
});

async function setupConnection(message, songUrl, serverQueue) {
    const vc = message.member.voice.channel;
    if(!vc) {
        if(beRude == true) {
            return message.reply("Get in a voice channel fuckwit");
        } else {

         return message.reply("You need to get into a voice channel first!");
        }
    }
    const permissions = vc.permissionsFor(message.client.user)
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.reply("I don't have permission to join!");
    }
    //load details of the video
    var songInfo;
    try{
        songInfo = await ytdl.getInfo(songUrl);
    } catch(err) {
        if(beRude == true) return message.reply("Use a youtube video you twat");
        else return message.reply("Please use a youtube link")
        // let video = message.content.substring(5);
        // var searchResult = search(video);
        // console.log(searchResult);
        // songInfo = await ytdl.getInfo(searchResult.url);
    }
    let title = songInfo.videoDetails.title;
    let url = songInfo.videoDetails.video_url
    let duration = songInfo.videoDetails.lengthSeconds;
    let thumbnail = songInfo.thumbnail_url;
   // let url = songInfo.moreVideoDetails.video_url;
    const song = {
        title: title,
        url: url,
        length: duration,
        thumbnail: thumbnail
    }
   
    
    //server queue management
    if (serverQueue) {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue`);
    } else {
        //create the struct for the queue
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: vc,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);
    
    try {
        var connection = await vc.join();
        queueConstruct.connection = connection;
        play(message.guild, queueConstruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send("I/you/we fucked up "+err);
    }
    }
}

function play(guild, song) {
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
            play(guild,serverQueue.songs[0]);
        })
        .on("error", error => console.log(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function skip(message, serverQueue) {
    if(!message.member.voice.channel) {
        return message.reply("Join a vc first!");
    }
    if(!serverQueue) {
        return message.reply("No song to skip")
    }
    serverQueue.connection.dispatcher.end();
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
        let length = parseInt(serverQueue.songs[i].duration,10);
        //console.log(serverQueue.songs[i].duration);
       // console.log(length);
        embed.addFields({name: serverQueue.songs[i].title, value:`Position ${i+1}`})
    }
    message.channel.send(embed);
}

//TODO: Help command
function help(message) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Help")
        .setColor(0x78b0f0)
        .setDescription("prefix: -");
    commands.forEach(function(obj){ embed.addField({ name: obj.name, value: `desc: ${obj.description}  usage: ${obj.usage}`})} );
   
    message.channel.send(embed);
}

function removeItem(message,serverQueue, index) {
    if(!message.member.voice.channel) {
        return message.reply("you have to be in a vc to remove items from queue!")
    }
    if(!serverQueue) {
        return message.reply("Nothing in the queue to remove")
    }
    index--;
    let songToBeRemoved = serverQueue.songs[index].title;
    serverQueue.songs.splice(index,1);
    message.channel.send(`${songToBeRemoved} has been removed from the queue`);
    
}
// search('jsconf', opts, function(err, results) {
//     if(err) return console.log(err);
    
//     console.dir(results[0]);
//     return results[0]
// });


// Insults for getting commands wrong:
// mark: too simple for the bot "psycologist"
// tom: too much of a monkey brain to figure this shit out
//     maybe give him a banana
// kai: stop mumbling bitch
// nelson: engineer yourself a better brain and use the command properly
// edmond: get the lego piece out of your ass and use the command properly 