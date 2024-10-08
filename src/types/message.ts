import { CQMessage } from './cq';

export enum PacketType {
    PULSE = 0,
    REG = 1,
    BROADCAST = 100,
    CHAT = 101,
    LIST = 200
}
interface MessageBase {
    version: number;
    type: PacketType;
}

interface Sender {
    name: string;
    uuid: string;
    title: string;
}

interface RegisterMessage extends MessageBase {
    identity: 0 | 1;
    id: string;
    name: string;
    SID: number;
}

interface BroadcastMessage extends MessageBase {
    event?: 1 | 2 | 3;
    content?: string;
    sender?: string;
    from_server?: string;
}

interface ChatMessageContent extends CQMessage {
    type: 'text' | 'cqcode';
    content: string;
}
interface ChatMessage extends MessageBase {
    world: string;
    world_display: string;
    sender: Sender;
    content: Array<ChatMessageContent>;
    from_server?: string;
}

interface ListMessage extends MessageBase {
    subtype: 0 | 1;
    count?: number;
    max?: number;
    player_list?: string[];
    world: string;
    world_display: string;
    sender: string;
}

interface SendChatMessage {
    world: string;
    world_display: string;
    sender: Sender;
    content: Array<ChatMessageContent>;
    from_server?: string;
}

interface SendListMessage {
    subtype: 0 | 1;
    count?: number;
    max?: number;
    playerlist?: string[];
    world: string;
    world_display: string;
    sender: string;
}

interface SendBroadcastMessage {
    event?: 1 | 2 | 3;
    content?: string;
    sender?: string;
    from_server?: string;
}

type Message = RegisterMessage | BroadcastMessage | ChatMessage | ListMessage;

export {
    Sender,
    Message,
    RegisterMessage,
    BroadcastMessage,
    ChatMessage,
    ListMessage,
    SendChatMessage,
    SendListMessage,
    SendBroadcastMessage,
    ChatMessageContent
};
