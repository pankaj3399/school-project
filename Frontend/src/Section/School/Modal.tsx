import React from "react";

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  callToAction: string;
  confirmDisabled?: boolean;
  variant?: 'primary' | 'danger';
}

// The checkbox is all-or-nothing: either no checkbox at all, or label + state +
// handler must all be supplied so we can never render a clickable control
// without a way to update its state.
type ModalCheckboxProps =
  | {
      checkboxLabel?: undefined;
      checkboxChecked?: undefined;
      onCheckboxChange?: undefined;
      checkboxDisabled?: undefined;
    }
  | {
      checkboxLabel: string;
      checkboxChecked: boolean;
      onCheckboxChange: (checked: boolean) => void;
      checkboxDisabled?: boolean;
    };

type ModalProps = ModalBaseProps & ModalCheckboxProps;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  callToAction,
  confirmDisabled = false,
  variant = 'primary',
  checkboxLabel,
  checkboxChecked,
  onCheckboxChange,
  checkboxDisabled = false
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-sm mb-4">{description}</p>
        {checkboxLabel ? (
          <label className="flex items-start gap-2 mb-6 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => onCheckboxChange(e.target.checked)}
              disabled={checkboxDisabled}
              className="mt-1"
            />
            <span>{checkboxLabel}</span>
          </label>
        ) : (
          <div className="mb-6" />
        )}
        <div className="flex justify-between space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 text-white rounded ${confirmButtonClasses} ${confirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {confirmDisabled ? 'Processing...' : callToAction}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
