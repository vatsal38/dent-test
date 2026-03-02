'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect, useState } from 'react';

interface EmailEditorProps {
    initialContent?: string;
    placeholder?: string;
    onChange?: (payload: { html: string; text: string }) => void;
    className?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    if (!editor) return null;

    const setLink = () => {
        if (linkUrl.trim()) {
            editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
            setLinkUrl('');
            setShowLinkInput(false);
        } else {
            editor.chain().focus().unsetLink().run();
            setShowLinkInput(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50/80 rounded-t-lg">
            {/* Text formatting */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Bold"
            >
                <span className="font-bold text-sm">B</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Italic"
            >
                <span className="italic text-sm">I</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Underline"
            >
                <span className="underline text-sm">U</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Strikethrough"
            >
                <span className="line-through text-sm">S</span>
            </button>

            <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />

            {/* Headings */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Heading 2"
            >
                <span className="text-xs font-semibold">H2</span>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Heading 3"
            >
                <span className="text-xs font-semibold">H3</span>
            </button>

            <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />

            {/* Blockquote & lists */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Quote"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
                </svg>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Bullet list"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 6h2v2H4V6zm0 6h2v2H4v-2zm0 6h2v2H4v-2zm4-12h10v2H8V6zm0 6h10v2H8v-2zm0 6h10v2H8v-2z" />
                </svg>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title="Numbered list"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 5h2v2H4V5zm0 6h2v2H4v-2zm0 6h2v2H4v-2zm4-10v2h10V1H8zm0 6v2h10V7H8zm0 6v2h10v-2H8z" />
                </svg>
            </button>

            <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />

            {/* Link */}
            <div className="relative inline-flex items-center">
                <button
                    type="button"
                    onClick={() => setShowLinkInput((v) => !v)}
                    className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('link') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                    title="Link"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </button>
                {showLinkInput && (
                    <div className="absolute left-0 top-full mt-1 flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1.5 z-10 min-w-[220px]">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => e.key === 'Enter' && setLink()}
                        />
                        <button type="button" onClick={setLink} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Apply
                        </button>
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="p-2 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                title="Horizontal line"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 11h16v2H4z" />
                </svg>
            </button>
        </div>
    );
}

export function EmailEditor({ initialContent = '', placeholder = 'Write your message...', onChange, className = '' }: EmailEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Placeholder.configure({ placeholder }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' },
            }),
            Underline,
        ],
        content: initialContent || '',
        editorProps: {
            attributes: {
                class: 'email-editor-content min-h-[200px] px-3 py-3 focus:outline-none text-gray-900 text-sm',
            },
        },
    });

    const emitChange = useCallback(() => {
        if (!editor || !onChange) return;
        onChange({ html: editor.getHTML(), text: editor.getText() });
    }, [editor, onChange]);

    useEffect(() => {
        if (!editor) return;
        editor.on('update', emitChange);
        return () => {
            editor.off('update', emitChange);
        };
    }, [editor, emitChange]);

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#3b82f6] focus-within:border-[#3b82f6] ${className}`}>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
