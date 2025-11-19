'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RejectCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectionReason: string, adminNotes: string) => Promise<void>;
  carName: string;
}

const REJECTION_REASONS = [
  'Incomplete information',
  'Poor quality photos',
  'Invalid registration',
  "Doesn't meet safety standards",
  'Other',
];

export function RejectCarModal({
  isOpen,
  onClose,
  onConfirm,
  carName,
}: RejectCarModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const rejectionReason =
      selectedReason === 'Other' ? customReason : selectedReason;

    if (!rejectionReason.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(rejectionReason, adminNotes);
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      setAdminNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to reject car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    selectedReason &&
    (selectedReason !== 'Other' || customReason.trim().length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Car Listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject <strong>{carName}</strong>? Please
            provide a reason below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'Other' && (
            <div className="grid gap-2">
              <Label htmlFor="customReason">Custom Reason *</Label>
              <Textarea
                id="customReason"
                placeholder="Please specify the reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Internal notes for reference..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Rejecting...' : 'Reject Car'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
