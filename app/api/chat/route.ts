import { processPdfDataUrl } from './file.convert.helpers';
import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';
import type { Message } from 'ai/react';

export async function POST(req: Request) {
    const { messages } = await req.json();

    // console.log('messages:', JSON.stringify(truncateStrings(messages), null, 2));

    const parsedMessages = await Promise.all(
        messages.map(async (message: Message) => {
            if (
                !message?.experimental_attachments ||
                message?.experimental_attachments.length === 0
            ) {
                return message;
            }

            const attachments = message.experimental_attachments;

            const parsedAttachments = await Promise.all(
                attachments.map(async (attachment) => {
                    if (
                        !attachment.contentType ||
                        !attachment.name ||
                        !attachment.contentType.endsWith('pdf')
                    ) {
                        return attachment;
                    }

                    console.log('starting PDF to XML conversion...');
                    const time = Date.now();
                    const xmlFile = await processPdfDataUrl(attachment.url);
                    console.log(
                        `PDF to XML conversion took ${Date.now() - time}ms`
                    );
                    return {
                        name: attachment.name,
                        contentType: 'text/xml',
                        url: xmlFile,
                    };
                })
            );

            return {
                ...message,
                experimental_attachments: parsedAttachments,
            };
        })
    );

    // console.log('parsedCoreMessages:', JSON.stringify(truncateStrings(convertToCoreMessages(parsedMessages)), null, 2));

    const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: 'do not respond on markdown or lists, keep your responses brief, you can ask the user to upload images or documents if it could help you understand the problem better',
        messages: convertToCoreMessages(parsedMessages),
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
