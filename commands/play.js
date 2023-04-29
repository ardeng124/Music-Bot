
const ytdl = require("ytdl-core");
// const ytdl = require("ytdl-core-discord")
const ytpl = require("ytpl");
//const YouTube = require("discord-youtube-api");
//const config =  require('../config.json');
//const youtube = new YouTube(config.youtubeKey);
const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js")
const spdl = require("spdl-core").default;
const YouTubeSR = require("youtube-sr").default;
const {
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    createAudioPlayer,
    getVoiceConnection,
} = require("@discordjs/voice")

module.exports.help = {
  name: ["play"],
  description: "plays music from youtube or spotify, can also accept yt playlists and search yt queries ",
  usage: "-play url OR -play search query",
};

module.exports.run = async (client, message, args) => {
    //serverQueue = client.queue;
    const serverQueue = client.queue.get(message.guild.id);
    if(args.length < 2) {
        return message.reply("Play what?");
    }
    var songUrl = args[1];
    const vc = message.member?.voice.channel
    if (!vc) {
        return message.reply("You need to get into a voice channel first!");
    }
    // const permissions = vc.permissionsFor(message.client.user);
    // if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    //     return message.reply("I don't have permission to join!");
    // }
    //load details of the video
 
    var title,url,duration,author,songInfo,type,song;

    var isPlaylist = ytpl.validateID(songUrl);
    var isVideo = ytdl.validateURL(songUrl);
    var isSpotify = spdl.validateURL(songUrl);
    var trackType = 'none';
    if(isPlaylist) trackType = 'playlist';
    if(isVideo) trackType = 'video';
    if(isSpotify) trackType = 'spotify';
    //depdning on what type of link it is
    switch(trackType) {
        case 'playlist':
            var songs = await ytpl(songUrl);
            var playlistTitle = songs.title;
            var formattedSongList = [];
            for (let i = 0; i < songs.items.length; i++) {
                title = songs.items[i].title;
                url = songs.items[i].shortUrl;
                duration = songs.items[i].durationSec;
                author = songs.items[i].author.name;
                
                let song = {
                    title: title,
                    url: url,
                    length: duration,
                    author: author,
                    //type: 'youtube'
                };
                formattedSongList.push(song);
            }
        break;

        case 'video':
            try {
            songInfo = await ytdl.getInfo(songUrl);
            } catch (err) {
                return message.reply("Could not get youtube video");
            }

            title = songInfo.videoDetails.title;
            url = songInfo.videoDetails.video_url;
            duration = songInfo.videoDetails.lengthSeconds;
            // let thumbnail = songInfo.videoInfo.thumbnail_url;
            author = songInfo.videoDetails.author.name;
            //type = 'youtube'
        break;

        case 'spotify':
            try {
                songInfo = await spdl.getInfo(songUrl)
            } catch (err) {
                console.log(err)
                return message.reply("Could not get spotify track")
            }
            title = songInfo.title;
            duration = songInfo.duration/1000;
            author = songInfo.artist;
            //type = 'spotify'
            try {
                videoSearch = await YouTubeSR.searchOne(`${title} ${author}`)
            } catch (err) {
                console.log(err)
                return message.reply("Could not get track");
            }
            
            url = videoSearch.url;
        break;

        case 'none':
            var query = args.join(" ");
            query = query.substring(6);
            try {
                songInfo = await YouTubeSR.searchOne(query);
            } catch(err) {
                console.log(err);
                return message.channel.send(`Error ${err}`);
            }
            title = songInfo.title;
            url = songInfo.url;
            duration = songInfo.duration/1000;
            author = songInfo.channel.name;
            //type = "youtube"
        break;
    }
    song = {
        title: title,
        url: url,
        length: duration,
        author: author,
        //type: type,
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
            looping: false,
            player: new createAudioPlayer(),
            audioResource: null,
            timestamp:0
        }
        client.queue.set(message.guild.id, queueConstruct);
        if (isPlaylist) {
            formattedSongList.forEach((element) => {
                queueConstruct.songs.push(element);
            });
            message.channel.send(`${formattedSongList.length} tracks queued up from \`${playlistTitle}\` `)
        }
        if (!isPlaylist){
            queueConstruct.songs.push(song);
            if(trackType == 'none') {
                message.channel.send(` \`${song.title}\` has been added to the queue \n${song.url}`);
            } else {
                message.channel.send(` \`${song.title}\` has been added to the queue`);
            }
        } 

        try {
            // var connection = await vc.join();
            const connection =  joinVoiceChannel({
                channelId: vc.id,
                guildId: vc.guild.id,
                adapterCreator: vc.guild.voiceAdapterCreator,
            })
            queueConstruct.connection = connection;
            // console.log(queueConstruct.songs[0])
            playYoutube(message, message.guild, queueConstruct.songs[0],0);
        } catch (err) {
            console.log("Error in try/catch when setting queue")
            console.log(err);
            client.queue.delete(message.guild.id);
	    vc.leave();
            return message.channel.send("Error playing track " + err);
        }
    } else {
        //if its a playlist add each to the queue
        if (isPlaylist) {
            formattedSongList.forEach((element) => {
                serverQueue.songs.push(element);
            });
            return message.channel.send(`${formattedSongList.length} tracks queued up from \`${playlistTitle}\` `)
        }
        if (!isPlaylist)  {
            serverQueue.songs.push(song);
            if(trackType == 'none') {
                return message.channel.send(` \`${song.title}\` has been added to the queue \n${song.url}`);
            } else {
                return message.channel.send(` \`${song.title}\` has been added to the queue`);
            }
        }   
    }

    async function playYoutube(message, guild, song, timestamp) {
        const serverQueue = client.queue.get(guild.id)
        const player = serverQueue.player
        // console.log(serverQueue.songs[0])
        if (!song) {
            // serverQueue.voiceChannel.leave();
            serverQueue.connection.destroy()
            client.queue.delete(guild.id)
            return message.channel.send("Playback finished")
        }
        try {
                let stream = ytdl(song.url, {
                    filter: "audioonly",
                // opusEncoded: false,
                fmt: "mp3",
                // quality: "highestaudio",
                // highWaterMark: 1 << 25,
                // liveBuffer: 1 << 62,
                // dlChunkSize: 0, //disabling chunking is recommended in discord bot
                // bitrate: 128,
                // encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
            })
            // const player = createAudioPlayer()
            serverQueue.audioResource = createAudioResource(stream)

            const resource = serverQueue.audioResource
            serverQueue.timestamp = Date.now()
            player.play(resource)
            serverQueue.connection.subscribe(player)
            player.on(AudioPlayerStatus.Idle, () => {
                if (!serverQueue.looping) {
                    console.log(serverQueue.songs)
                    serverQueue.songs.shift()
                }
                serverQueue.currentSong = serverQueue.songs[0]
                if (serverQueue.songs.length <= 0) {
                    try {
                        serverQueue.connection.destroy()
                        client.queue.delete(guild.id)

                    } catch (e) {
                        console.log(e)
                    }
                    return message.channel.send("Playback finished")
                } else {
                    playYoutube(message, guild, serverQueue.songs[0], 0)
                }
            })
            
            player.on("error", (err) => {
                console.error(err)
            })
        } catch (error) {
            console.error(error)
            message.reply("Failed to play the live stream.")
        }

        const embed = new EmbedBuilder()
            .setTitle("Now Playing 🎶")
            .setColor(0x78b0f0)
            .setDescription(`**${song.title}** \n by ${song.author}`)
        serverQueue.textChannel.send({ embeds: [embed] })
        
    }
};
