module.exports = {
    name: "ping",
    description: "Send ping respond with pong",
    execute(message, args, client) {
        message.channel.send("pong!");
    }
}