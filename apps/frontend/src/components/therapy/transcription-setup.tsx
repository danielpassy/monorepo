import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mic, MicOff, Globe, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";

// Simulated extension ID - in production this would be your actual extension ID
const EXTENSION_ID = "therapynotes-transcription-ext";

export function TranscriptionSetup() {
  const [isOpen, setIsOpen] = useState(false);
  const [extensionStatus, setExtensionStatus] = useState<"checking" | "active" | "inactive">(
    "checking",
  );
  const [isChecking, setIsChecking] = useState(false);

  const checkExtension = useCallback(() => {
    setIsChecking(true);
    setExtensionStatus("checking");

    // Simulate extension detection
    // In production, you'd use chrome.runtime.sendMessage or a custom event
    setTimeout(() => {
      // Check if extension injected a marker element
      const extensionMarker = document.getElementById("therapynotes-extension-active");
      // Or check localStorage/sessionStorage for extension flag
      const extensionFlag = localStorage.getItem("therapynotes-extension-installed");

      if (extensionMarker || extensionFlag) {
        setExtensionStatus("active");
      } else {
        setExtensionStatus("inactive");
      }
      setIsChecking(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkExtension();
    }
  }, [isOpen, checkExtension]);

  const handleInstallClick = () => {
    // In production, this would link to the Chrome Web Store or Firefox Add-ons
    window.open("https://chrome.google.com/webstore", "_blank");
  };

  // Simulate activating extension for demo purposes
  const simulateExtensionActive = () => {
    localStorage.setItem("therapynotes-extension-installed", "true");
    checkExtension();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {extensionStatus === "active" ? (
            <Mic className="size-4 text-emerald-600" />
          ) : (
            <MicOff className="size-4 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">Transcription</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Transcription</DialogTitle>
          <DialogDescription>
            Connect the TherapyNotes browser extension to enable real-time session transcription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Extension Status */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isChecking ? (
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : extensionStatus === "active" ? (
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <XCircle className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">Extension Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isChecking
                      ? "Checking for extension..."
                      : extensionStatus === "active"
                        ? "Connected and ready"
                        : "Not detected"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={checkExtension} disabled={isChecking}>
                {isChecking ? <Loader2 className="size-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Installation Instructions */}
          {extensionStatus !== "active" && (
            <div className="space-y-4">
              <h4 className="font-medium">Install the Extension</h4>
              <div className="space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <Globe className="size-8 text-[#4285F4]" />
                  <div className="flex-1">
                    <p className="font-medium">Chrome Web Store</p>
                    <p className="text-sm text-muted-foreground">
                      For Chrome, Edge, Brave, and other Chromium browsers
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <svg className="size-8" viewBox="0 0 77.42 79.97" fill="currentColor">
                    <path
                      d="M38.71 0c-2.89 9.41-9.17 16.08-16.15 22.67C14.13 30.47 4.82 39.14 0 51.49c9.39-4.65 18.29-6.22 27.28-5.43-1.24 10.74-5.09 20.33-12.67 28.91 12.55-3.11 22.33-9.3 29.13-19.42 3.02 2.06 5.7 4.47 8.08 7.21 2.38 2.74 4.45 5.81 6.26 9.19 3.05-13.17.98-25.15-5.86-36.15 9.15.41 17.89 2.89 26.2 7.64-4.58-12.51-13.37-21.35-21.77-29.43C49.26 7.1 43.41 3.56 38.71 0z"
                      fill="#FF7139"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">Firefox Add-ons</p>
                    <p className="text-sm text-muted-foreground">For Mozilla Firefox browser</p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </button>
              </div>

              {/* Demo: Simulate Extension Active */}
              <div className="border-t pt-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  For demo purposes, click below to simulate an active extension:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateExtensionActive}
                  className="w-full"
                >
                  Simulate Extension Active
                </Button>
              </div>
            </div>
          )}

          {/* Active State */}
          {extensionStatus === "active" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium">Ready to transcribe</p>
                <p className="mt-1 text-emerald-700">
                  Start a session to begin real-time transcription. The extension will automatically
                  capture audio from your meeting or call.
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Supported platforms:</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Zoom, Google Meet, Microsoft Teams</li>
                  <li>In-person sessions via microphone</li>
                  <li>Phone calls (with appropriate permissions)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
