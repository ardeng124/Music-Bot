const { promisify, isArray } = require('util');
const readdir = promisify(require('fs').readdir);
const { Client, IntentsBitField, ActivityType } = require("discord.js")
const config = require("./config.json");
const Discord = require("discord.js")

const client = new Discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildVoiceStates",],
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
})
const prefix = config.prefix;
client.login(config.token);
client.commands = new Map();
client.queue = new Map();
const statusMessages = [  
    "suffering",
    "pain and misery",
    "dancing",
    "some music",
    "bored",
    "feeling good",
    "vibes",
    "eeeeeeeee"
]
const talkedRecently = new Set();
client.once('ready', () => {
    console.log("Ready!!")
  
    let index = Math.floor(Math.random() * (statusMessages.length - 1 + 1));
    client.user.setActivity(statusMessages[index], { type: "STREAMING", url: "https://www.twitch.tv/something" })
    client.user.setPresence({
        activities: [
            {
                name: `${statusMessages[index]}`,
                type: ActivityType.Streaming,
                url: "https://www.twitch.tv/something",
            },
        ],
        status: "online",
    })
});
client.once("reconnecting", () => {
    console.log("reconnecting");
})
client.once("disconnect", () => {
    console.log("Disconnected");
})
client.on("error", (e) => console.error(e));

client.on('ready', async () => {
    readdir("./commands/", (error, files) => {
        if(error) throw error;
        files.forEach(file => {
        if (!file.endsWith('.js')) return;
        try {
            const props = require(`./commands/${file}`);
            if(props.help.name.constructor == Array) {
                props.help.name.forEach((e) => client.commands.set(e, props));
            } else {
                client.commands.set(props.help.name, props);
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
        })
    })
})

client.on('messageCreate', async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (talkedRecently.has(message.author.id)) return;

    talkedRecently.add(message.author.id);
    setTimeout(() => {
        talkedRecently.delete(message.author.id);
    }, 1000);

    const args = message.content.split(" ");
    let command = args[0].substring(1);
    const cmd = client.commands.get(command);
    if(!cmd) return;
    cmd.run(client,message,args);
})  
