import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import BuyerQualificationForm from './BuyerQualificationForm';

interface Props {
  listingId: string;
  sellerId: string;
  onClose: () => void;
}

const AppointmentBookingModal: React.FC<Props> = ({ listingId, sellerId, onClose }) => {
  const qc = useQueryClient();

  const handleSuccess = () => {
    qc.invalidateQueries({ queryKey: ['appointments', 'buyer'] });
    // Note: We don't close the modal immediately to allow the user to see the seller contact information
  };

  return (
    <Modal isOpen onClose={onClose} title="Book Appointment">
      <BuyerQualificationForm
        listingId={listingId}
        sellerId={sellerId}
        onSuccess={handleSuccess}
      />
    </Modal>
  );
};

export default AppointmentBookingModal;
