import React from "react";
//test
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  callToAction:string;
  disabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, description, callToAction, disabled }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-sm mb-6">{description}</p>
        <div className="flex justify-between space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className={`px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          {
            callToAction === 'Delete' ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled}
                className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {disabled ? 'Processing...' : callToAction}
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default Modal;
