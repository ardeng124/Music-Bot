const Discord = require("discord.js")

module.exports.help = {
    name: ["queue", "q"],
    description: "shows current queue and time remaining of first track",
    usage: "-q OR -queue",
}

module.exports.run = async (client, message, args) => {
    const serverQueue = client.queue.get(message.guild.id)
    if (!serverQueue) {
        return message.reply("Queue is empty")
    }

    if (serverQueue.songs.length < 25) {
        const embed = new Discord.MessageEmbed()
            .setTitle("🎵 Queue 🎵")
            .setColor(0x78b0f0)
            .setFooter(`server id ${message.guild.id}`)
            .setTimestamp()
        if (serverQueue.looping) {
            embed.setDescription("Looping first track 🔃")
        }
        for (let i = 0; i < serverQueue.songs.length; i++) {
            //All this is for calculating the remaning duration of the song
            if (i == 0) {
                let timeString = getTime()
                //time = (Math.round(time *100)/100).toFixed(2);
                embed.addFields({
                    name: serverQueue.songs[i].title,
                    value: `Position ${i + 1}    *[${timeString}]*`,
                })
            } else {
                embed.addFields({
                    name: serverQueue.songs[i].title,
                    value: `Position ${i + 1}`,
                })
            }
        }
        message.channel.send(embed)
    } else {
        let loopCount = 0;
        for (let i = 0; i < serverQueue.songs.length; i += 25) {
            loopCount++
            let embed = new Discord.MessageEmbed()
                .setTitle(`🎵 Queue Pt${loopCount} 🎵`)
                .setColor(0x78b0f0)
                .setFooter(`server id ${message.guild.id}`)
                .setTimestamp()
            let loopGuard
            if (serverQueue.songs.length < i + 25) {
                loopGuard = serverQueue.songs.length
            } else {
                loopGuard = i + 25
            }
            for (let j = i; j < loopGuard; j++) {
                if (j == 0) {
                   let timeString = getTime()
                    embed.addFields({
                        name: serverQueue.songs[j].title,
                        value: `Position ${j + 1}    *[${timeString}]*`,
                    })
                } else {
                    embed.addFields({
                        name: serverQueue.songs[j].title,
                        value: `Position ${j + 1}`,
                    })
                }
            }
            message.channel.send(embed)
        }
    }
    function getTime() {
        var time;
        var duration;
        try {
            time = serverQueue.connection.dispatcher.streamTime;
            duration = serverQueue.songs[0].length;
        } catch (err) {
            return message.reply("Give me a sec to start playing first");
        }
        time = time / 1000;
        time = duration - time;
        let hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        let mins = Math.floor(time / 60); //convert to mins
        let secs = Math.floor(time - mins * 60);
        let timeString = "";
        timeString +=
            (hours < 10 ? `0${hours}` : `${hours}`) +
            ":" +
            (mins < 10 ? `0${mins}` : `${mins}`) +
            ":" +
            (secs < 10 ? `0${secs}` : `${secs}`);
        return timeString;
    }
}
