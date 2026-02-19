import { useState } from 'react';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackModalProps {
  hospital: string;
  userLat: number;
  userLon: number;
  onClose: () => void;
  onSubmit: (rating: boolean, comment: string) => Promise<void>;
}

const FeedbackModal = ({
  hospital,
  userLat,
  userLon,
  onClose,
  onSubmit,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) {
      alert('Please select Yes or No');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(rating, comment);
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your feedback helps us improve recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Feedback</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Selected: <span className="font-bold text-gray-900">{hospital}</span>
          </p>

          <p className="text-sm font-semibold text-gray-700 mb-4">
            Was this recommendation helpful?
          </p>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setRating(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                rating === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="font-semibold">Yes</span>
            </button>
            <button
              onClick={() => setRating(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                rating === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="font-semibold">No</span>
            </button>
          </div>

          <label className="block mb-2">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">
              Additional comment (optional)
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              className="input-field resize-none h-24"
              disabled={loading}
            />
          </label>
        </div>

        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
