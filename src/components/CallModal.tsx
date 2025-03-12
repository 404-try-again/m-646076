
import { useState, useEffect } from "react";
import { X, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface CallModalProps {
  callType: "audio" | "video";
  callerName: string;
  callerAvatar: string;
  isIncoming: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  isOpen: boolean;
}

export const CallModal = ({
  callType,
  callerName,
  callerAvatar,
  isIncoming,
  onAccept,
  onDecline,
  onEnd,
  isOpen
}: CallModalProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isConnected) {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  useEffect(() => {
    if (!isOpen) {
      setIsConnected(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    setIsConnected(true);
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass p-6 rounded-xl max-w-md w-full">
        <div className="flex flex-col items-center gap-4">
          {callType === "video" && !isVideoOff ? (
            <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="text-center text-muted-foreground">
                Video preview (Placeholder)
              </div>
            </div>
          ) : (
            <Avatar className="w-24 h-24 mb-2">
              <img src={callerAvatar} alt={callerName} className="object-cover" />
            </Avatar>
          )}

          <div className="text-center">
            <h3 className="font-bold text-xl">{callerName}</h3>
            {isConnected ? (
              <p className="text-sm text-muted-foreground">
                {formatTime(callDuration)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isIncoming ? "Incoming call..." : "Calling..."}
              </p>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`rounded-full ${isMuted ? 'bg-red-500/20 text-red-500' : ''}`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                {callType === "video" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`rounded-full ${isVideoOff ? 'bg-red-500/20 text-red-500' : ''}`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onEnd}
                  className="rounded-full"
                >
                  <Phone className="h-5 w-5 rotate-135" />
                </Button>
              </>
            ) : isIncoming ? (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onDecline}
                  className="rounded-full"
                >
                  <Phone className="h-5 w-5 rotate-135" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleAccept}
                  className="rounded-full bg-green-500 hover:bg-green-600"
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                size="icon"
                onClick={onEnd}
                className="rounded-full"
              >
                <Phone className="h-5 w-5 rotate-135" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
