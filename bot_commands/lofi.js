// TODO: This should just use the code in play

const ytdl = require("ytdl-core");

module.exports = {
    name: "lofi",
    description: "Start playing lofi music in the channel the user is in and does not stop until interupted.",
    async execute(message) {
        try {
            const lofiMusicUrl = "https://www.youtube.com/watch?v=5qap5aO4i9A"

            const queue = message.client.queue;
            const serverQueue = queue.get(message.guild.id);

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel)
                return message.channel.send(
                    "You need to be in a voice channel to play music!"
                );
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send(
                    "I need the permissions to join and speak in your voice channel!"
                );
            }

            const songInfo = await ytdl.getInfo(lofiMusicUrl);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    volume: 5,
                    playing: true,
                    locked: true
                };

                queue.set(message.guild.id, queueContruct);

                queueContruct.songs.push(song);

                try {
                    var connection = await voiceChannel.join();
                    queueContruct.connection = connection;
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            } else {
                serverQueue.songs = [];
            }
            this.playLoop(message, song);
        } catch (error) {
            console.log(error);
            message.channel.send(error.message);
        }
    },

    playLoop(message, song) {
        const serverQueue = message.client.queue.get(message.guild.id);
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on("error", error => console.error(error));
        dispatcher.setVolume(0.25);
        message.channel.send(`Start playing: **${song.title}**`);
    }
}