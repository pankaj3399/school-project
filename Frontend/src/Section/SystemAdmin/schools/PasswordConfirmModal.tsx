import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from 'lucide-react';

interface PasswordConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    isLoading?: boolean;
}

export function PasswordConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    isLoading = false
}: PasswordConfirmModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!password) {
            setError("Password is required");
            return;
        }

        try {
            await onConfirm(password);
            setPassword('');
        } catch (err: any) {
            setError(err.message || "Invalid password. Please try again.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <Lock className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-center text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleConfirm} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Administrator Password</Label>
                        <Input
                            id="admin-password"
                            type="password"
                            placeholder="Enter your password to confirm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={error ? "border-red-500 focus:ring-red-500" : ""}
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onClose();
                                setPassword('');
                                setError(null);
                            }}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={isLoading || !password}
                            className="flex-1"
                        >
                            {isLoading ? "Verifying..." : confirmText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
