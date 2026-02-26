import { StreamChat } from 'stream-chat';

const API_KEY = import.meta.env.VITE_STREAM_API_KEY;

if (!API_KEY) {
  console.error('VITE_STREAM_API_KEY is not set');
}

export const chatClient = StreamChat.getInstance(API_KEY || '');

export const connectUser = async (userId: string, token: string) => {
  try {
    await chatClient.connectUser(
      {
        id: userId,
        name: `User_${userId.slice(0, 4)}`,
      },
      token
    );
    console.log('Stream Chat connected for user:', userId);
  } catch (error) {
    console.error('Stream Chat connection error:', error);
    throw error;
  }
};

export const disconnectUser = async () => {
  try {
    await chatClient.disconnectUser();
    console.log('Stream Chat disconnected');
  } catch (error) {
    console.error('Stream Chat disconnect error:', error);
  }
};

export const createChannel = async (sessionId: string, members: string[]) => {
  try {
    console.log('Creating channel with members:', members);
    
    const channel = chatClient.channel('messaging', sessionId, {
      name: `Chat Session ${sessionId}`,
      members: members,
      created_by_id: members[0],
    });
    
    const response = await channel.create();
    console.log('Channel created:', response.channel?.id);
    return channel;
  } catch (error) {
    console.error('Stream Chat channel error:', error);
    throw error;
  }
};
