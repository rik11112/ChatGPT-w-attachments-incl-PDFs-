import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: 'do not respond on markdown or lists, keep your responses brief, you can ask the user to upload images or documents if it could help you understand the problem better',
        messages: convertToCoreMessages(messages),
        onFinish({ finishReason, usage }) {
            console.log('finishReason:', finishReason);
            console.log('usage:', JSON.stringify(usage, null, 2));
        },
    });

    return result.toDataStreamResponse();
}

function truncateStrings(obj: any): any {
    if (typeof obj === 'string') {
        return obj.substring(0, 200);
    } else if (Array.isArray(obj)) {
        return obj.map((item) => truncateStrings(item));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = truncateStrings(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}
