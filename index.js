const { promisify, isArray } = require('util');
const readdir = promisify(require('fs').readdir);
const Discord = require('discord.js');
const config = require("./config.json");
const client = new Discord.Client();
const prefix = config.prefix;
client.login(config.token);
client.commands = new Map();
client.queue = new Map();
//const queue = new Map();

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

client.on('ready', async () => {
    //https://www.geeksforgeeks.org/node-js-fs-readdir-method/
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

client.on('message', async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.split(" ");
    let command = args[0].substring(1);
    const cmd = client.commands.get(command);
    if(!cmd) return;
    cmd.run(client,message,args);
})  