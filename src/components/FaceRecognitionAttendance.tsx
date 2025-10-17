import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FaceRecognitionAttendanceProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export const FaceRecognitionAttendance = ({ userId, userName, onSuccess }: FaceRecognitionAttendanceProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [matchResult, setMatchResult] = useState<{ success: boolean; score: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Perangkat tidak mendukung kamera atau izin ditolak.");
        return;
      }

      const primaryConstraints: MediaStreamConstraints = {
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        const video = videoRef.current;
        video.muted = true;
        
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");

        video.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);

        try {
          await video.play();
        } catch {
          video.addEventListener(
            "loadedmetadata",
            () => {
              video.play().catch(() => {});
            },
            { once: true }
          );
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan dan perangkat memiliki kamera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setMatchResult(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0);
      
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.95);
      });

      // Upload image to storage for processing
      const fileName = `${userId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("face-images")
        .upload(fileName, imageBlob);

      if (uploadError) throw uploadError;

      // Call edge function to verify face and mark attendance
      const { data, error } = await supabase.functions.invoke("verify-face-attendance", {
        body: { 
          userId,
          imageFileName: fileName
        }
      });

      if (error) throw error;

      setMatchResult({
        success: data.matched,
        score: data.score
      });

      if (data.matched) {
        toast.success("Wajah terverifikasi! Kehadiran berhasil dicatat.");
        stopCamera();
        onSuccess();
      } else {
        toast.error("Wajah tidak cocok. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error verifying face:", error);
      toast.error("Gagal memverifikasi wajah. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Verifikasi Wajah untuk Kehadiran</h3>
        <p className="text-sm text-muted-foreground">
          Gunakan kamera untuk memverifikasi identitas Anda
        </p>
      </div>

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden min-h-[300px]">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {matchResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-background p-6 rounded-lg text-center space-y-2">
                  {matchResult.success ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                      <p className="font-semibold">Wajah Cocok!</p>
                      <p className="text-sm text-muted-foreground">
                        Skor: {(matchResult.score * 100).toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                      <p className="font-semibold">Wajah Tidak Cocok</p>
                      <p className="text-sm text-muted-foreground">
                        Skor: {(matchResult.score * 100).toFixed(1)}%
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        {!isCameraActive ? (
          <Button onClick={startCamera} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Aktifkan Kamera
          </Button>
        ) : (
          <>
            <Button
              onClick={captureAndVerify}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Verifikasi & Catat Kehadiran
                </>
              )}
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              disabled={isProcessing}
            >
              Batal
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
