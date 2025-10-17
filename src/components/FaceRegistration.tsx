import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FaceRegistrationProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export const FaceRegistration = ({ userId, userName, onSuccess }: FaceRegistrationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const TOTAL_IMAGES_NEEDED = 5;
  const instructions = [
    "Wajah menghadap depan",
    "Wajah sedikit ke kiri",
    "Wajah sedikit ke kanan",
    "Wajah dengan senyum",
    "Wajah dengan ekspresi netral"
  ];

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

      // Prefer front camera with ideal resolution; fallback to any camera
      const primaryConstraints: MediaStreamConstraints = {
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch (e) {
        // Fallback for older devices/browsers
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        const video = videoRef.current;
        // iOS/Safari autoplay requirements
        video.muted = true;
        
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");

        video.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);

        // Ensure playback starts
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

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    
    setCapturedImages(prev => [...prev, imageDataUrl]);
    setCurrentStep(prev => prev + 1);

    if (capturedImages.length + 1 >= TOTAL_IMAGES_NEEDED) {
      toast.success("Semua foto telah diambil! Memproses data wajah...");
      await processAndRegisterFace([...capturedImages, imageDataUrl]);
    } else {
      toast.success(`Foto ${capturedImages.length + 1} dari ${TOTAL_IMAGES_NEEDED} berhasil diambil!`);
    }
  };

  const processAndRegisterFace = async (images: string[]) => {
    setIsProcessing(true);

    try {
      // Convert base64 images to blobs
      const imageBlobs = await Promise.all(
        images.map(async (dataUrl) => {
          const response = await fetch(dataUrl);
          return await response.blob();
        })
      );

      // Upload images to storage
      const uploadPromises = imageBlobs.map(async (blob, index) => {
        const fileName = `${userId}/${Date.now()}_${index}.jpg`;
        const { data, error } = await supabase.storage
          .from("face-images")
          .upload(fileName, blob);

        if (error) throw error;
        return fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Call edge function to process images and create embeddings
      const { data, error } = await supabase.functions.invoke("register-face", {
        body: { 
          userId,
          imageFileNames: uploadedFiles
        }
      });

      if (error) throw error;

      // Update profile consent
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ consent_face_data: true })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Pendaftaran wajah berhasil! Anda sekarang dapat menggunakan sistem absensi.");
      stopCamera();
      onSuccess();
    } catch (error) {
      console.error("Error registering face:", error);
      toast.error("Gagal mendaftarkan wajah. Silakan coba lagi.");
      setCapturedImages([]);
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setCurrentStep(0);
    stopCamera();
  };

  const progress = (capturedImages.length / TOTAL_IMAGES_NEEDED) * 100;

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Pendaftaran Wajah</h3>
        <p className="text-sm text-muted-foreground">
          Ambil {TOTAL_IMAGES_NEEDED} foto wajah Anda dari berbagai sudut
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{capturedImages.length} / {TOTAL_IMAGES_NEEDED}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {currentStep < TOTAL_IMAGES_NEEDED && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Langkah {currentStep + 1}</p>
              <p className="text-sm text-muted-foreground">{instructions[currentStep]}</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden min-h-[300px]">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {capturedImages.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto">
            {capturedImages.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img
                  src={img}
                  alt={`Captured ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border-2 border-green-500"
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isCameraActive ? (
          <Button onClick={startCamera} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Mulai Pendaftaran
          </Button>
        ) : (
          <>
            <Button
              onClick={captureImage}
              disabled={isProcessing || currentStep >= TOTAL_IMAGES_NEEDED}
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
                  Ambil Foto
                </>
              )}
            </Button>
            <Button
              onClick={resetCapture}
              variant="outline"
              disabled={isProcessing}
            >
              Ulang
            </Button>
          </>
        )}
      </div>

      {capturedImages.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Foto yang diambil akan diproses untuk membuat profil wajah Anda
        </p>
      )}
    </Card>
  );
};
