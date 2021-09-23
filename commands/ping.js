module.exports.help = {
  name: ["ping"],
  description: "gets latency of bot",
  usage: "-ping",
};

module.exports.run = async (client, message, args) => {
  message.channel.send("Pinging...").then((m) => {
    var ping = m.createdTimestamp - message.createdTimestamp;
    m.edit(`Ping is ${ping}ms`);
  });
};
