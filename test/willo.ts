import { JustChatClient, JustChatServer, ChatMessage, PacketType } from '../src';

const client = new JustChatClient({
    address: 'localhost',
    port: 38080,
    name: 'Jest Client',
    id: '123'
});
const server = new JustChatServer({
    port: 38080,
    name: 'Jest Server',
    id: '321',
    enableTimeout: false
});
const msg: ChatMessage = {
    version: 4,
    type: PacketType.CHAT,
    world: '123',
    world_display: 'test',
    sender: 'Jest',
    content: [
        {
            type: 'text',
            content: 'This is a test message'
        }
    ]
};
async function main() {
    await server.start();
    await client.start();
    client.sendChat(msg);
    server.on('chat', (rmsg, client) => {
        console.log(rmsg);
        console.log(client);
    });
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
    server.sendChatMessage(msg, {
        name: 'Jest Client',
        uuid: '123'
    });
    client.on('chat', (rmsg) => {
        console.log(rmsg);
        process.exit();
    });
}

main();
