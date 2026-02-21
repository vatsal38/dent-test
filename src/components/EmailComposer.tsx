'use client';

import { useState } from 'react';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: string;
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

const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: 'follow-up',
        name: 'Follow-up',
        subject: 'Following up on our conversation',
        body: 'Hi,\n\nI wanted to follow up on our recent conversation. [Add your message here]\n\nBest regards,',
        category: 'general',
    },
    {
        id: 'intro',
        name: 'Introduction',
        subject: 'Introduction - Partnership Opportunity',
        body: 'Hi,\n\nI hope this email finds you well. I wanted to introduce [organization] and discuss a potential partnership opportunity.\n\n[Add details here]\n\nLooking forward to hearing from you.\n\nBest regards,',
        category: 'outreach',
    },
    {
        id: 'mou-reminder',
        name: 'MOU Reminder',
        subject: 'MOU Reminder - Action Required',
        body: 'Hi,\n\nI wanted to follow up on the MOU we sent. Please let me know if you have any questions or if you need any clarification.\n\n[Add specific details]\n\nThank you!\n\nBest regards,',
        category: 'mou',
    },
    {
        id: 'thank-you',
        name: 'Thank You',
        subject: 'Thank you for your partnership',
        body: 'Hi,\n\nThank you for your partnership and collaboration. We truly appreciate [specific reason].\n\n[Add personalization]\n\nBest regards,',
        category: 'general',
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
    const [body, setBody] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [sending, setSending] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    if (!isOpen) return null;

    const handleTemplateSelect = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setSubject(template.subject);
        setBody(template.body);
        setUseAI(false);
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiGenerating(true);
        try {
            // TODO: Call AI API endpoint
            // For now, simulate AI generation
            await new Promise(resolve => setTimeout(resolve, 1000));
            const generatedBody = `Hi,\n\n${aiPrompt}\n\nBest regards,`;
            setBody(generatedBody);
            setSubject(subject || 'Re: Partnership Discussion');
        } catch (err) {
            console.error('Failed to generate email:', err);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) return;
        setSending(true);
        try {
            await onSend({
                to,
                subject,
                body,
                bodyHtml: body.replace(/\n/g, '<br>'),
            });
            // Reset form
            setSubject('');
            setBody('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* To Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="text"
                            value={Array.isArray(to) ? to.join(', ') : to}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 bg-gray-50 text-sm"
                        />
                    </div>

                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Templates</label>
                        <div className="grid grid-cols-2 gap-2">
                            {DEFAULT_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                                        selectedTemplate?.id === template.id
                                            ? 'border-[#3b82f6] bg-blue-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <p className="text-sm font-medium text-gray-900">{template.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{template.subject}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Composer Toggle */}
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
                                    setBody('');
                                }
                            }}
                            className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                        />
                        <label htmlFor="useAI" className="text-sm text-gray-700">Use AI to compose email</label>
                    </div>

                    {/* AI Prompt */}
                    {useAI && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                What would you like to say?
                            </label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="E.g., Follow up on the partnership discussion, ask about next steps..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-sm"
                                rows={3}
                            />
                            <button
                                onClick={handleAIGenerate}
                                disabled={!aiPrompt.trim() || aiGenerating}
                                className="mt-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {aiGenerating ? 'Generating...' : 'Generate Email'}
                            </button>
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-sm"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Email body..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-sm"
                            rows={10}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!subject.trim() || !body.trim() || sending}
                        className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}
