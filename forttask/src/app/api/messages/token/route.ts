import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth';
import { StreamChat } from 'stream-chat';

const serverClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY || '',
  process.env.STREAM_SECRET || ''
);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const username = session.user.username || 'User';

    const token = serverClient.createToken(userId);

    await serverClient.upsertUser({
      id: userId,
      name: username,
      role: 'admin',
    });

    return NextResponse.json({
      token,
      userId,
      username,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}