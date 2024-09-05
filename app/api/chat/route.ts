import { processPdfDataUrl } from "@/app/(preview)/file.convert.helpers";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export async function POST(req: Request) {
    const { messages } = await req.json();

    console.log(JSON.stringify(truncateStrings(messages), null, 2));

    const parsedMessages = await Promise.all(messages.map(async (message: any) => {
        if (message?.experimental_attachments?.length === 0) {
            return message;
        }

        const attachments = message.experimental_attachments;

        const parsedAttachments = await Promise.all(attachments.map(async (attachment: any) => {
            if (!attachment.contentType.endsWith('pdf')) {
                return attachment;
            }

            try {
                console.log('Processing PDF attachment:', attachment.name);
                const xmlFile = await processPdfDataUrl(attachment.url, attachment.name);
                console.log('Processed PDF attachment:', attachment.name);
                return {
                    name: attachment.name,
                    contentType: 'text/xml',
                    url: xmlFile,
                };
            } catch (e) {
                console.error(e);
                throw e;
            }
        }));

        return {
            ...message,
            experimental_attachments: parsedAttachments,
        };
    }));

    const result = await streamText({
        model: openai('gpt-4o'),
        system: 'do not respond on markdown or lists, keep your responses brief, you can ask the user to upload images or documents if it could help you understand the problem better',
        messages: convertToCoreMessages(parsedMessages),
    });

    return result.toDataStreamResponse();
}

function truncateStrings(obj: any): any {
    if (typeof obj === 'string') {
        return obj.substring(0, 200);
    } else if (Array.isArray(obj)) {
        return obj.map(item => truncateStrings(item));
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