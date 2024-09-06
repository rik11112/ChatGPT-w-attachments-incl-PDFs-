/* eslint-disable @next/next/no-img-element */
'use client';

import {
    AttachmentIcon,
    BotIcon,
    UserIcon,
    VercelIcon,
} from '@/components/icons';
import { Message, useChat } from 'ai/react';
import { DragEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// @ts-ignore - it is installed and working, but somehow the import gives a warning
import { toast } from 'sonner';
import Link from 'next/link';
import { Markdown } from '@/components/markdown';

const getTextFromDataUrl = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    return window.atob(base64);
};

function TextFilePreview({ file }: { file: File }) {
    const [content, setContent] = useState<string>('');

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            setContent(typeof text === 'string' ? text.slice(0, 100) : '');
        };
        reader.readAsText(file);
    }, [file]);

    return (
        <div>
            {content}
            {content.length >= 100 && '...'}
        </div>
    );
}

function PdfFilePreview({ file }: { file: { name?: string } }) {
    return (
        <div
            key={file.name}
            className="text-xs overflow-hidden text-zinc-400 border p-2 rounded-md dark:bg-zinc-800 dark:border-zinc-700 mb-3 flex gap-2 items-center"
        >
            {/* TODO: use FontAwesomeIcon */}
            <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 512 512">
                <path d="M64 464l48 0 0 48-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L229.5 0c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3L384 304l-48 0 0-144-80 0c-17.7 0-32-14.3-32-32l0-80L64 48c-8.8 0-16 7.2-16 16l0 384c0 8.8 7.2 16 16 16zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
            </svg>
            {file.name ?? 'PDF file'}
        </div>
    );
}

export default function Home() {
    const { messages, input, handleSubmit, handleInputChange, isLoading } =
        useChat({
            onError: (error) => {
                toast.error(
                    "You've been rate limited, please try again later!"
                );
                console.error(error);
            },
        });

    const [files, setFiles] = useState<FileList | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handlePaste = async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;

        if (items) {
            const files = Array.from(items)
                .map((item) => item.getAsFile())
                .filter((file): file is File => file !== null);

            if (files.length > 0) {
                const validFiles = files.filter(
                    (file) =>
                        file.type.startsWith('image/') ||
                        file.type.startsWith('text/') ||
                        file.type.toLocaleLowerCase().endsWith('/pdf')
                );

                if (validFiles.length === files.length) {
                    const dataTransfer = new DataTransfer();
                    validFiles.forEach((file) => dataTransfer.items.add(file));
                    setFiles(dataTransfer.files);
                } else {
                    toast.error('Only image and text files are allowed');
                }
            }
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        const droppedFilesArray = Array.from(droppedFiles);
        if (droppedFilesArray.length > 0) {
            const validFiles = droppedFilesArray.filter(
                (file) =>
                    file.type.startsWith('image/') ||
                    file.type.startsWith('text/') ||
                    file.type.toLocaleLowerCase().endsWith('/pdf')
            );

            if (validFiles.length === droppedFilesArray.length) {
                const dataTransfer = new DataTransfer();
                validFiles.forEach((file) => dataTransfer.items.add(file));
                setFiles(dataTransfer.files);
            } else {
                toast.error('Only image and text files are allowed!');
            }

            setFiles(droppedFiles);
        }
        setIsDragging(false);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div
            className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div>Drag and drop files here</div>
                        <div className="text-sm dark:text-zinc-400 text-zinc-500">
                            {'(images and text)'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col justify-between gap-4">
                {messages.length > 0 ? (
                    <div className="flex flex-col gap-2 h-full w-dvw items-center overflow-y-scroll">
                        {messages.map((message: Message, index) => (
                            <motion.div
                                key={message.id}
                                className={`flex flex-row gap-2 px-4 w-full md:w-[500px] md:px-0 ${
                                    index === 0 ? 'pt-20' : ''
                                }`}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
                                    {message.role === 'assistant' ? (
                                        <BotIcon />
                                    ) : (
                                        <UserIcon />
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
                                        <Markdown>{message.content}</Markdown>
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        {message.experimental_attachments?.map(
                                            (attachment) => {
                                                if (
                                                    attachment.contentType?.startsWith(
                                                        'image'
                                                    )
                                                ) {
                                                    return (
                                                        <img
                                                            className="rounded-md w-40 mb-3"
                                                            key={
                                                                attachment.name
                                                            }
                                                            src={attachment.url}
                                                            alt={
                                                                attachment.name
                                                            }
                                                        />
                                                    );
                                                } else if (
                                                    attachment.contentType?.startsWith(
                                                        'text'
                                                    )
                                                ) {
                                                    return (
                                                        <div
                                                            key={
                                                                attachment.name
                                                            }
                                                            className="text-xs w-40 h-24 overflow-hidden text-zinc-400 border p-2 rounded-md dark:bg-zinc-800 dark:border-zinc-700 mb-3"
                                                        >
                                                            {getTextFromDataUrl(
                                                                attachment.url
                                                            )}
                                                        </div>
                                                    );
                                                } else if (
                                                    attachment.contentType?.endsWith(
                                                        'pdf'
                                                    )
                                                ) {
                                                    return <PdfFilePreview key={attachment.name} file={attachment} />
                                                } else {
                                                    return null;
                                                }
                                            }
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {isLoading &&
                            messages[messages.length - 1].role !==
                                'assistant' && (
                                <div className="flex flex-row gap-2 px-4 w-full md:w-[500px] md:px-0">
                                    <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
                                        <BotIcon />
                                    </div>
                                    <div className="flex flex-col gap-1 text-zinc-400">
                                        <div>hmm...</div>
                                    </div>
                                </div>
                            )}

                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
                        <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
                            <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
                                <VercelIcon />
                                <span>+</span>
                                <AttachmentIcon />
                            </p>
                            <p>
                                The useChat hook supports sending attachments
                                along with messages as well as rendering
                                previews on the client. This can be useful for
                                building applications that involve sending
                                images, files, and other media content to the AI
                                provider.
                            </p>
                            <p>
                                {' '}
                                Learn more about the{' '}
                                <Link
                                    className="text-blue-500 dark:text-blue-400"
                                    href="https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot#attachments-experimental"
                                    target="_blank"
                                >
                                    useChat{' '}
                                </Link>
                                hook from Vercel AI SDK.
                            </p>
                        </div>
                    </motion.div>
                )}

                <form
                    className="flex flex-col gap-2 relative items-center"
                    onSubmit={(event) => {
                        const options = files
                            ? { experimental_attachments: files }
                            : {};
                        handleSubmit(event, options);
                        setFiles(null);
                    }}
                >
                    <AnimatePresence>
                        {files && files.length > 0 && (
                            <div className="flex flex-row gap-2 absolute bottom-12 px-4 w-full md:w-[500px] md:px-0">
                                {Array.from(files).map((file) => {
                                    if (file.type.startsWith('image')) {
                                        return (
                                            <div key={file.name}>
                                                <motion.img
                                                    src={URL.createObjectURL(
                                                        file
                                                    )}
                                                    alt={file.name}
                                                    className="rounded-md w-16"
                                                    initial={{
                                                        scale: 0.8,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    exit={{
                                                        y: -10,
                                                        scale: 1.1,
                                                        opacity: 0,
                                                        transition: {
                                                            duration: 0.2,
                                                        },
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (file.type.startsWith('text')) {
                                        return (
                                            <motion.div
                                                key={file.name}
                                                className="text-[8px] leading-1 w-28 h-16 overflow-hidden text-zinc-500 border p-2 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                                initial={{
                                                    scale: 0.8,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                }}
                                                exit={{
                                                    y: -10,
                                                    scale: 1.1,
                                                    opacity: 0,
                                                    transition: {
                                                        duration: 0.2,
                                                    },
                                                }}
                                            >
                                                <TextFilePreview file={file} />
                                            </motion.div>
                                        );
                                    } else if (
                                        file.type
                                            .toLocaleLowerCase()
                                            .endsWith('/pdf')
                                    ) {
                                        return (
                                            <motion.div
                                                key={file.name}
                                                className="text-[8px] leading-1 h-16 overflow-hidden text-zinc-500 border p-2 rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                                                initial={{
                                                    scale: 0.8,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                }}
                                                exit={{
                                                    y: -10,
                                                    scale: 1.1,
                                                    opacity: 0,
                                                    transition: {
                                                        duration: 0.2,
                                                    },
                                                }}
                                            >
                                                <PdfFilePreview file={file} />
                                            </motion.div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </AnimatePresence>

                    <input
                        ref={inputRef}
                        className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
                        placeholder="Send a message..."
                        value={input}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                    />
                </form>
            </div>
        </div>
    );
}
