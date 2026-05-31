import { useState } from 'react';

export default function JoinRequestModal({ group, onClose, onSubmit }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Pass the message back to your parent component/backend hook
    await onSubmit(group.id, message);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-[#F9FAFB]">Join {group.title}</h3>
          <p className="text-sm text-[#9CA3AF] mt-1">Introduce yourself briefly to the host.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
              Introduction Message
            </label>
            <textarea
              required
              rows={4}
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'm interested because..."
              className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-[#0B0F1A] text-[#F9FAFB] placeholder-[#6b6375] focus:ring-2 focus:ring-[#6366F1] outline-none resize-none shadow-inner text-sm"
            />
            <div className="text-right text-xs text-[#6b6375] mt-1">
              {message.length}/200 characters
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#6366F1] hover:bg-[#4f46e5] disabled:bg-gray-700 text-white text-sm font-medium rounded-xl transition-all shadow-md"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}