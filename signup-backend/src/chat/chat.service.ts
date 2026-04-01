import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './chat.schema';
import Groq from 'groq-sdk';

const teenlancerPrompt = `
You are Gengig Assistant for Teenlancers.
Gengig is a freelancing platform connecting Agents (clients who post jobs)
and Teenlancers (teen freelancers who complete the work).

Your job is to help Teenlancers with:
1. Finding and applying to gigs
2. Writing cover letters and proposals
3. Understanding how the platform works
4. Delivering work and getting paid
5. Building their profile and skills

Services on Gengig include: UI/UX Design, Logo Design, Graphic Design, 
Video Editing, Motion Graphics, Photography, Web Development, 
Content Writing, Social Media, and Animation.

Always be friendly, encouraging and supportive to teen freelancers.
Keep responses concise and easy to understand.
If you don't know something specific about Gengig, say so honestly.
`;

const agentPrompt = `
You are Gengig Assistant for Agents.
Gengig is a freelancing platform connecting Agents (clients who post jobs)
and Teenlancers (teen freelancers who complete the work).

Your job is to help Agents with:
1. Posting and managing gigs
2. Reviewing applications and proposals
3. Hiring and managing teenlancers
4. Understanding how payments work
5. Getting the best results from teenlancers

Services on Gengig include: UI/UX Design, Logo Design, Graphic Design,
Video Editing, Motion Graphics, Photography, Web Development,
Content Writing, Social Media, and Animation.

Always be professional and helpful.
Keep responses concise and to the point.
If you don't know something specific about Gengig, say so honestly.
`;

@Injectable()
export class ChatService {
  private groq: Groq;

  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatModel: Model<ChatMessageDocument>,
  ) {
    if (!process.env.GROQ_API_KEY) {
      throw new InternalServerErrorException(
        'GROQ_API_KEY is not configured',
      );
    }

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    userType: 'teenlancer' | 'agent',
  ) {
    // Save user message to MongoDB
    await this.chatModel.create({
      sessionId,
      userId,
      role: 'user',
      content: message,
      userType,
    });

    // Get conversation history
    const history = await this.chatModel
      .find({ sessionId, userId })
      .sort({ createdAt: 1 })
      .exec();

    // Choose prompt based on user type
    const systemPrompt =
      userType === 'teenlancer' ? teenlancerPrompt : agentPrompt;

    // Build chat history for Groq
    const chatHistory = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Send to Groq AI
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0].message.content ?? '';

    // Save AI response to MongoDB
    await this.chatModel.create({
      sessionId,
      userId,
      role: 'assistant',
      content: aiReply,
      userType,
    });

    return {
      reply: aiReply,
      sessionId,
      userType,
    };
  }

  async getHistory(userId: string, sessionId: string) {
    return this.chatModel
      .find({ sessionId, userId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async getSessions(userId: string) {
    const sessions = await this.chatModel.aggregate([
      { $match: { userId: userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$content' },
          userType: { $first: '$userType' },
          createdAt: { $first: '$createdAt' },
        },
      },
    ]);

    return sessions;
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.chatModel.deleteMany({ sessionId, userId }).exec();
    return { message: 'Session deleted successfully' };
  }
}
