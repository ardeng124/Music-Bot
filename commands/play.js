const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const YouTube = require("discord-youtube-api");
const config = require('../config.json');
const youtube = new YouTube(config.youtubeKey);
const Discord = require("discord.js");

module.exports.help = {
  name: ["play"],
  description: "plays music, can also accept playlists and search queries (note, there is a max of 100 searches per day)",
  usage: "-play url OR -play search query",
};

module.exports.run = async (client, message, args) => {
    // ... command logic
    //serverQueue = client.queue;
    const serverQueue = client.queue.get(message.guild.id);

    var songUrl = args[1];
    const vc = message.member.voice.channel;
    if (!vc) {
        return message.reply("You need to get into a voice channel first!");
    }
    const permissions = vc.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.reply("I don't have permission to join!");
    }
    //load details of the video
    var songInfo;
    var song;
    var isPlaylist = ytpl.validateID(songUrl);
    var isVideo = ytdl.validateURL(songUrl);


    if (!isPlaylist) {
        if(!isVideo) {
            var query = args.join(" ");
            query = query.substring(6);
            var result;
            try {
                result = await youtube.searchVideos(query);
           
                songUrl = result.url;
            } catch(err) {
                console.log(err);
                return message.channel.send(`Error ${err}`);

            }

        } 
        try {
            songInfo = await ytdl.getInfo(songUrl);
        } catch (err) {
            return message.reply("Could not get youtube video");

            // let video = message.content.substring(5);
            // var searchResult = search(video);
            // console.log(searchResult);
            // songInfo = await ytdl.getInfo(searchResult.url);
        }

        let title = songInfo.videoDetails.title;
        let url = songInfo.videoDetails.video_url;
        let duration = songInfo.videoDetails.lengthSeconds;
        // let thumbnail = songInfo.videoInfo.thumbnail_url;
        let author = songInfo.videoDetails.author.name;
            song = {
            title: title,
            url: url,
            length: duration,
            //thumbnail: thumbnail,
            author: author,
        };
    
        // if its a playlist do the playlist stuff
    } else {
        var songs = await ytpl(songUrl);
        var playlistTitle = songs.title;
        var formattedSongList = [];
        for (let i = 0; i < songs.items.length; i++) {
            let title = songs.items[i].title;
            let url = songs.items[i].shortUrl;
            let duration = songs.items[i].duration;
            let author = songs.items[i].author.name;
           
            //let thumbnail = songInfo.thumbnail_url;
            let song = {
                title: title,
                url: url,
                length: duration,
                author: author,
                //thumbnail: thumbnail
            };
            formattedSongList.push(song);
        }
    }

    //server queue management
    if (!serverQueue) {
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: vc,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            currentSong: null,
        };
        client.queue.set(message.guild.id, queueConstruct);
        if (isPlaylist) {
            formattedSongList.forEach((element) => {
                queueConstruct.songs.push(element);
            });
            message.channel.send(`${formattedSongList.length} tracks queued up from ${playlistTitle}`)
        }
        if (!isPlaylist){
            queueConstruct.songs.push(song);
            message.channel.send(`${song.title} has been added to the queue`);
        } 

        try {
            var connection = await vc.join();
            queueConstruct.connection = connection;
            play(message, message.guild, queueConstruct.songs[0],0);
        } catch (err) {
            console.log("Error in try/catch when setting queue")
            console.log(err);
            client.queue.delete(message.guild.id);
            return message.channel.send("I/you/we fucked up " + err);
        }
    } else {
        if (isPlaylist) {
            formattedSongList.forEach((element) => {
                serverQueue.songs.push(element);
            });
            return message.channel.send(`${formattedSongList.length} tracks queued up from ${playlistTitle}`)
        }
        if (!isPlaylist)  {
            serverQueue.songs.push(song);
            return message.channel.send(`${song.title} has been added to the queue`);
        }
    }

    function play(message, guild, song, timestamp) {
        const serverQueue = client.queue.get(guild.id);
        if (!song) {
            serverQueue.voiceChannel.leave();
            client.queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url),{seek:timestamp})
            .on("finish", () => {
                serverQueue.songs.shift();
                serverQueue.currentSong = serverQueue.songs[0];
                play(message, guild, serverQueue.songs[0],0);
            })
            .on("error", (error) => {
                var time = dispatcher.timestamp;
                
                console.log(time);
                console.log(error);

                message.channel.send(
                    `There was a problem playing this song *${serverQueue.songs[0].title}*`
                );
                play(message, guild, serverQueue.songs[0],time);
            });

        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        const embed = new Discord.MessageEmbed()
            .setTitle("Now Playing 🎶")
            .setColor(0x78b0f0)
            .setDescription(`**${song.title}** \n by ${song.author}`);
        serverQueue.textChannel.send(embed);
        // serverQueue.textChannel.send(
        //     `Now playing: **${song.title}** by ${song.author}`
        // );
    }
};
