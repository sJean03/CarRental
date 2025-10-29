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

interface DelistCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => Promise<void>;
  carName: string;
}

const DELIST_REASONS = [
  'Owner request',
  'Safety concerns',
  'Policy violation',
  'Spam or fraudulent listing',
  'Other',
];

export function DelistCarModal({ isOpen, onClose, onConfirm, carName }: DelistCarModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason || reason.trim().length === 0) return;
    setIsLoading(true);
    try {
      await onConfirm(reason, notes);
      setSelectedReason('');
      setCustomReason('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to delist car', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = selectedReason && (selectedReason !== 'Other' ? true : customReason.trim().length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Delist Car Listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to delist <strong>{carName}</strong>? Please provide a reason below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Select a reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DELIST_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'Other' && (
            <div className="grid gap-2">
              <Label htmlFor="customReason">Custom Reason *</Label>
              <Textarea id="customReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows={3} />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!isFormValid || isLoading}>
            {isLoading ? 'Delisting...' : 'Delist Car Listing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
