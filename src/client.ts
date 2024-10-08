import net from 'node:net';
import {
    BroadcastMessage,
    ChatMessage,
    ClientConfig,
    ListMessage,
    PacketType,
    Message,
    SendChatMessage,
    SendListMessage,
    PacketVersion
} from './types';
import { Protocol } from './utils';

class Client extends net.Socket {
    private config: ClientConfig;
    private entry: Protocol;
    constructor(config: ClientConfig) {
        super();
        this.config = config;
        this.entry = new Protocol();
        this.pipe(this.entry).pipe(this);
        this.entry.on('message', (packet: Message) => this.handlePacket(packet));
    }

    public start() {
        return new Promise<void>((resolve, reject) => {
            try {
                this.connect(this.config.port, this.config.address, async () => {
                    const regPacket = {
                        type: PacketType.REG,
                        version: PacketVersion,
                        identity: '1',
                        name: this.config.name
                            ? Buffer.from(this.config.name, 'utf-8').toString('base64')
                            : Buffer.from('', 'utf-8').toString('base64'),
                        id: this.config.id
                    };
                    this.entry.send(regPacket);
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // 处理包
    private handlePacket(packet: Message) {
        // 根据 packet.type 处理不同的包
        switch (packet.type) {
            case PacketType.PULSE:
                // 向服务器发送心跳包
                this.entry.send({
                    type: PacketType.PULSE,
                    version: PacketVersion
                });
                break;
            case PacketType.REG:
                console.log('客户端不应该收到 REG 包');
                break;
            case PacketType.CHAT:
                this.handleChat(packet as ChatMessage);
                break;

            case PacketType.BROADCAST:
                this.handleBroadcast(packet as BroadcastMessage);
                break;

            case PacketType.LIST:
                this.handleList(packet as ListMessage);
                break;

            default:
                throw new Error('Unknown packet type');
        }
    }
    // 处理聊天包
    private handleChat(packet: ChatMessage) {
        const { world, world_display, sender, content, from_server } = packet;
        const decodedContent = content.map((c) => {
            const { type, content, ...otherProps } = c;
            return {
                type,
                content: Buffer.from(content, 'base64').toString('utf-8'),
                ...otherProps
            };
        });
        const chatEvent = {
            world: Buffer.from(world, 'base64').toString('utf-8'),
            world_display: Buffer.from(world_display, 'base64').toString('utf-8'),
            sender: {
                name: Buffer.from(sender.name, 'base64').toString('utf-8'),
                uuid: Buffer.from(sender.uuid, 'base64').toString('utf-8'),
                title: Buffer.from(sender.title, 'base64').toString('utf-8')
            },
            content: decodedContent,
            from_server: Buffer.from(from_server || '', 'base64').toString('utf-8')
        };
        this.emit('chat', chatEvent);
    }
    // 处理广播包
    private handleBroadcast(packet: BroadcastMessage) {
        const content = packet.content
            ? Buffer.from(packet.content, 'base64').toString('utf-8')
            : undefined;
        const sender = packet.sender
            ? Buffer.from(packet.sender, 'base64').toString('utf-8')
            : undefined;
        this.emit('broadcast', { event: packet.event, content, sender });
    }
    // 处理列表包
    private handleList(packet: ListMessage) {
        const count = packet.count;
        const max = packet.max;
        const playerlist = packet.player_list?.map((player: string) =>
            Buffer.from(player, 'base64').toString('utf-8')
        );
        const world = packet.world;
        const world_display = packet.world_display
            ? Buffer.from(packet.world_display, 'base64').toString('utf-8')
            : null;
        const sender = packet.sender
            ? Buffer.from(packet.sender, 'base64').toString('utf-8')
            : null;

        // 触发 list 事件
        this.emit('list', { count, max, playerlist, world, world_display, sender });
    }
    // 发送聊天包
    public sendChat(message: SendChatMessage) {
        this.entry.send({
            version: PacketVersion,
            type: PacketType.CHAT,
            // 转换需要转换为 base64 的字段
            world_display: Buffer.from(message.world_display, 'utf-8').toString('base64'),
            world: message.world,
            sender: {
                name: Buffer.from(message.sender.name, 'utf-8').toString('base64'),
                uuid: Buffer.from(message.sender.uuid, 'utf-8').toString('base64'),
                title: Buffer.from(message.sender.title, 'utf-8').toString('base64')
            },
            content: message.content.map((c) => {
                const { type, content, ...otherProps } = c;
                return {
                    type,
                    content: Buffer.from(content, 'utf-8').toString('base64'),
                    ...otherProps
                };
            })
        });
    }
    // 发送广播包
    public sendList(message: SendListMessage) {
        this.entry.send({
            version: PacketVersion,
            type: PacketType.LIST,
            subtype: message.subtype,
            world: message.world,
            //该字段需要转换为base64
            world_display: Buffer.from(message.world_display, 'utf-8').toString('base64'),
            sender: Buffer.from(message.sender, 'utf-8').toString('base64')
        });
    }
}

export default Client;
