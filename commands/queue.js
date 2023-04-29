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

        const embed = {
            title: "🎵 Queue 🎵",
            color: 0x78b0f0,
            footer: {
                text: `server id ${message.guild.id}`,
            },
            timestamp: new Date().toISOString(),
            fields: [],
        }
        if (serverQueue.looping) {
            embed.setDescription("Looping first track 🔃")
        }
        for (let i = 0; i < serverQueue.songs.length; i++) {
            //All this is for calculating the remaning duration of the song
            if (i == 0) {
                let timeString = getTime()
                //time = (Math.round(time *100)/100).toFixed(2);
                embed.fields.push({
                    name: serverQueue.songs[i].title,
                    value: `Position ${i + 1}    *[${timeString}]*`,
                })
            } else {
                embed.fields.push({
                    name: serverQueue.songs[i].title,
                    value: `Position ${i + 1}`,
                })
            }
        }
        message.channel.send({ embeds: [embed] })
    } else {
        let loopCount = 0;
        for (let i = 0; i < serverQueue.songs.length; i += 25) {
            loopCount++
            let embed = {
                title: `🎵 Queue Pt${loopCount} 🎵`,
                color: 0x78b0f0,
                footer: {
                    text: `server id ${message.guild.id}`,
                },
                timestamp: new Date().toISOString(),
                fields: [],
            }
            let loopGuard
            if (serverQueue.songs.length < i + 25) {
                loopGuard = serverQueue.songs.length
            } else {
                loopGuard = i + 25
            }
            for (let j = i; j < loopGuard; j++) {
                if (j == 0) {
                   let timeString = getTime()
                    embed.fields.push({
                        name: serverQueue.songs[j].title,
                        value: `Position ${j + 1}    *[${timeString}]*`,
                    })
                } else {
                    embed.fields.push({
                        name: serverQueue.songs[j].title,
                        value: `Position ${j + 1}`,
                    })
                }
            }
            message.channel.send({ embeds: [embed] })
        }
    }
    function getTime() {
        try {
            var time = serverQueue.timestamp
            var duration = serverQueue.songs[0].length
        } catch (err) {
            console.log(err)
            return message.reply("Give me a sec to start playing first")
        }
        //divide by 1000 because its in miliseconds
        time = Math.round(time / 1000)
        let currentTime = Date.now()
        currentTime = Math.round(currentTime / 1000)
        const remainingTime = time + duration - currentTime
        const hours = Math.floor(remainingTime / 3600)
        const minutes = Math.floor(remainingTime / 60)
        const seconds = Math.floor(remainingTime % 60)
        let timestring = ""
        //converts time into human readable format
        //if they are less than 10 add a leading 0
        timestring +=
            (hours < 10 ? `0${hours}` : `${hours}`) +
            ":" +
            (minutes < 10 ? `0${minutes}` : `${minutes}`) +
            ":" +
            (seconds < 10 ? `0${seconds}` : `${seconds}`)
        return timestring
    }
}
