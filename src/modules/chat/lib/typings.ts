import {ID} from "@lib/typings";
import {UserPublicData} from "@modules/user";
import {FilePublicData} from "@modules/upload";

export interface GroupChatMemberPublicData extends UserPublicData {
  isOwner: boolean;
  isMember: boolean;
}

export interface AttachmentPublicData {
  id: ID;
  files: FilePublicData[] | null;
  images: {
    id: ID;
    url: string;
  }[] | null;
  audio: {
    id: ID;
    url: string;
  } | null;
}

export type AttachmentType = "audio" | "image" | "file";

export interface OneToOneChatPublicData {
  id: ID;
}

export interface GroupChatPublicData {
  id: ID;
  avatar: string;
  title: string;
}

export type ChatMessageSenderType = "user" | "system";

export type GroupChatMemberRole = "owner" | "member";

export interface GroupChatMessagePublicData {
  id: ID;
  text: string | null;
  sender: GroupChatMemberPublicData | null;
  isEdited: boolean;
  isRead: boolean;
  isSystem: boolean;
  chat: GroupChatPublicData;
  audio: string;
  images: string[];
  files: FilePublicData[];
  parent: GroupChatMessagePublicData | null;
  createdAt: Date;
}

export interface OneToOneChatMessagePublicData {
  id: ID;
  text: string;
  sender: OneToOneChatMemberPublicData | null;
  isEdited: boolean;
  isRead: boolean;
  isSystem: boolean;
  chat: OneToOneChatPublicData;
  audio: string;
  images: string[];
  files: FilePublicData[];
  parent: OneToOneChatMessagePublicData | null;
  createdAt: Date;
}

export interface OneToOneChatMemberPublicData extends UserPublicData {
  isBanned: boolean;
}
