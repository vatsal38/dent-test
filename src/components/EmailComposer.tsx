'use client';

import { useState } from 'react';
import { EmailEditor } from '@/components/EmailEditor';
import { FOLLOW_UP_BODY_HTML, INTRO_BODY_HTML, MOU_REMINDER_BODY_HTML, THANK_YOU_BODY_HTML } from '@/lib/emailTemplates';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    bodyHtml: string;
    category: string;
    icon: React.ReactNode;
    description: string;
}

interface EmailComposerProps {
    isOpen: boolean;
    to: string | string[];
    subject?: string;
    threadId?: string;
    partnershipId?: string;
    onClose: () => void;
    onSend: (data: { to: string | string[]; subject: string; body: string; bodyHtml?: string }) => Promise<void>;
}

const FollowUpIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
    </svg>
);
const IntroIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 01-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);
const MOUIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
const ThankYouIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: 'follow-up',
        name: 'Follow-up',
        subject: 'Following up on our conversation',
        description: 'Re-engage after a meeting or email',
        category: 'general',
        icon: <FollowUpIcon />,
        body: 'Hi,\n\nI wanted to follow up on our recent conversation. [Add your message here]\n\nBest regards,',
        bodyHtml: FOLLOW_UP_BODY_HTML,
    },
    {
        id: 'intro',
        name: 'Introduction',
        subject: 'Introduction – Partnership Opportunity',
        description: 'Introduce your organization and propose collaboration',
        category: 'outreach',
        icon: <IntroIcon />,
        body: 'Hi,\n\nI hope this email finds you well. I wanted to introduce [organization] and discuss a potential partnership opportunity.\n\n[Add details here]\n\nLooking forward to hearing from you.\n\nBest regards,',
        bodyHtml: INTRO_BODY_HTML,
    },
    {
        id: 'mou-reminder',
        name: 'MOU Reminder',
        subject: 'MOU Reminder – Action Required',
        description: 'Gentle nudge for MOU review or signing',
        category: 'mou',
        icon: <MOUIcon />,
        body: 'Hi,\n\nI wanted to follow up on the MOU we sent. Please let me know if you have any questions or need any clarification.\n\n[Add specific details]\n\nThank you!\n\nBest regards,',
        bodyHtml: MOU_REMINDER_BODY_HTML,
    },
    {
        id: 'thank-you',
        name: 'Thank You',
        subject: 'Thank you for your partnership',
        description: 'Appreciate their collaboration',
        category: 'general',
        icon: <ThankYouIcon />,
        body: 'Hi,\n\nThank you for your partnership and collaboration. We truly appreciate [specific reason].\n\n[Add personalization]\n\nBest regards,',
        bodyHtml: THANK_YOU_BODY_HTML,
    },
];

export function EmailComposer({
    isOpen,
    to,
    subject: initialSubject,
    threadId,
    partnershipId,
    onClose,
    onSend,
}: EmailComposerProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [useAI, setUseAI] = useState(false);
    const [subject, setSubject] = useState(initialSubject || '');
    const [bodyHtml, setBodyHtml] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [sending, setSending] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    if (!isOpen) return null;

    const handleTemplateSelect = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setSubject(template.subject);
        setBodyHtml(template.bodyHtml);
        setBodyText(template.body);
        setUseAI(false);
    };

    const handleEditorChange = (payload: { html: string; text: string }) => {
        setBodyHtml(payload.html);
        setBodyText(payload.text);
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const generatedBody = `Hi,\n\n${aiPrompt}\n\nBest regards,`;
            const generatedHtml = `<p>Hi,</p><p>${aiPrompt.replace(/\n/g, '</p><p>')}</p><p>Best regards,</p>`;
            setBodyText(generatedBody);
            setBodyHtml(generatedHtml);
            setSubject(subject || 'Re: Partnership Discussion');
        } catch (err) {
            console.error('Failed to generate email:', err);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !bodyText.trim()) return;
        setSending(true);
        try {
            await onSend({
                to,
                subject,
                body: bodyText,
                bodyHtml: bodyHtml || undefined,
            });
            setSubject('');
            setBodyHtml('');
            setBodyText('');
            setSelectedTemplate(null);
            setUseAI(false);
            setAiPrompt('');
            onClose();
        } catch (err) {
            console.error('Failed to send email:', err);
        } finally {
            setSending(false);
        }
    };

    const editorKey = selectedTemplate?.id ?? 'blank';
    const editorInitialContent = selectedTemplate ? selectedTemplate.bodyHtml : bodyHtml || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                        <input
                            type="text"
                            value={Array.isArray(to) ? to.join(', ') : to}
                            disabled
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-gray-50 text-sm"
                        />
                    </div>

                    {/* Templates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Choose a template</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {DEFAULT_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                                        selectedTemplate?.id === template.id
                                            ? 'border-[#3b82f6] bg-blue-50/80 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
                                    }`}
                                >
                                    <span className={`p-2 rounded-lg ${selectedTemplate?.id === template.id ? 'bg-[#3b82f6] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {template.icon}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                                    <span className="text-xs text-gray-500 text-center leading-tight">{template.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="useAI"
                            checked={useAI}
                            onChange={(e) => {
                                setUseAI(e.target.checked);
                                if (e.target.checked) {
                                    setSelectedTemplate(null);
                                    setSubject('');
                                    setBodyHtml('');
                                    setBodyText('');
                                }
                            }}
                            className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                        />
                        <label htmlFor="useAI" className="text-sm text-gray-700">Use AI to compose email</label>
                    </div>

                    {useAI && (
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <label className="block text-sm font-medium text-gray-700 mb-2">What would you like to say?</label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="E.g., Follow up on the partnership discussion, ask about next steps..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-sm"
                                rows={3}
                            />
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={!aiPrompt.trim() || aiGenerating}
                                className="mt-3 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {aiGenerating ? 'Generating...' : 'Generate Email'}
                            </button>
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-sm"
                        />
                    </div>

                    {/* Body – TipTap */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                        <EmailEditor
                            key={editorKey}
                            initialContent={editorInitialContent}
                            placeholder="Write your message… You can use bold, italic, and lists."
                            onChange={handleEditorChange}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!subject.trim() || !bodyText.trim() || sending}
                        className="px-5 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}
