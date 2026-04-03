// src/components/DeleteConfirmModal.tsx
import React from 'react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isRecurring: boolean;
  onConfirm: () => void;
  onConfirmOnce: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  isRecurring,
  onConfirm,
  onConfirmOnce,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Delete</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {isRecurring ? (
            <>
              <p>This is part of a recurring event.</p>
              <p>What would you like to delete?</p>
            </>
          ) : (
            <p>Are you sure you want to delete this event?</p>
          )}
        </div>
        
        <div className="modal-actions">
          {isRecurring ? (
            <>
              <button className="btn-delete-once" onClick={onConfirmOnce}>
                Delete This Event
              </button>
              <button className="btn-delete-all" onClick={onConfirm}>
                Delete All Occurrences
              </button>
              <button className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn-delete" onClick={onConfirm}>
                Delete
              </button>
              <button className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;