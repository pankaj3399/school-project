import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { subscribeToWaitlist } from "@/api";

interface WaitlistPopupProps {
    onClose?: () => void;
}

export default function WaitlistPopup({ onClose }: WaitlistPopupProps) {
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if user has already dismissed the popup
        const dismissed = localStorage.getItem("waitlist_dismissed");
        if (dismissed) {
            setIsVisible(false);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("waitlist_dismissed", "true");
        setIsVisible(false);
        onClose?.();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !confirmEmail) {
            setError("Please fill in both email fields");
            return;
        }

        if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
            setError("Email addresses do not match");
            return;
        }

        setIsLoading(true);

        try {
            const result = await subscribeToWaitlist(email, confirmEmail);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.message || "Something went wrong. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {!success ? (
                    /* Registration Form */
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <img
                                src="/radu-logo-2.png"
                                alt="RADU E-Token Logo"
                                className="h-20 w-auto mx-auto mb-4"
                            />
                            <h2 className="text-xl font-bold text-gray-800 uppercase leading-tight">
                                Register here to receive the updates on the RADU E-Token
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmEmail"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Confirm Email Address
                                </label>
                                <input
                                    type="email"
                                    id="confirmEmail"
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    placeholder="Confirm your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Registering..." : "Register"}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Success Message */
                    <div className="p-8 text-center">
                        <img
                            src="/radu-logo-2.png"
                            alt="RADU E-Token Logo"
                            className="h-24 w-auto mx-auto mb-6"
                        />
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Thanks for registering!!!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We'll keep you posted on the Radu E-Token system.
                        </p>
                        <p className="text-gray-600 mb-6">
                            You may reach out to us using this email:{" "}
                            <a
                                href="mailto:admin@theraduetoken.com"
                                className="text-blue-600 hover:underline"
                            >
                                admin@theraduetoken.com
                            </a>
                        </p>
                        <p className="text-gray-600 mb-8">Thanks.</p>

                        {/* Footer */}
                        <div className="pt-6 border-t border-gray-200 text-sm text-gray-500">
                            <p>© {new Date().getFullYear()} The RADU E-Token System® All rights reserved.</p>
                            <p>Powered by Affective Academy LLC.</p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="mt-6 py-2 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
