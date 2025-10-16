import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { FaceRecognitionAttendance } from "@/components/FaceRecognitionAttendance";
import { FaceRegistration } from "@/components/FaceRegistration";
import { Camera, History, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Profile {
  name: string;
  consent_face_data: boolean;
}

interface AttendanceLog {
  id: string;
  status: string;
  timestamp: string;
  score: number | null;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastAttendance, setLastAttendance] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, consent_face_data")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch last attendance
      const { data: attendanceData } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attendanceData) {
        setLastAttendance(attendanceData);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    // Reload attendance and profile data after successful verification
    const { data: attendanceData } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attendanceData) {
      setLastAttendance(attendanceData);
    }
  };

  const handleRegistrationSuccess = async () => {
    // Reload profile data
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, consent_face_data")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }
    setShowRegistration(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar userName={profile?.name} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">
                Selamat datang, {profile?.name}!
              </CardTitle>
              <CardDescription>
                Tandai kehadiran Anda hari ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.consent_face_data ? (
                <FaceRecognitionAttendance
                  userId={user!.id}
                  userName={profile.name}
                  onSuccess={handleMarkAttendance}
                />
              ) : (
                <Button
                  size="lg"
                  onClick={handleMarkAttendance}
                  className="w-full sm:w-auto gap-2 shadow-elegant hover:shadow-glow transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Absen Sekarang
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absensi Terakhir</p>
                    <p className="text-lg font-bold">
                      {lastAttendance 
                        ? new Date(lastAttendance.timestamp).toLocaleDateString("id-ID")
                        : "Belum ada"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-bold text-success">
                      {lastAttendance?.status === "present" ? "Hadir" : "Aktif"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wajah Terdaftar</p>
                    <p className="text-lg font-bold">
                      {profile?.consent_face_data ? "Ya" : "Belum"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Face Registration Card */}
          {!profile?.consent_face_data && (
            <Card className="shadow-card border-accent">
              <CardHeader>
                <CardTitle>Daftarkan Wajah Anda</CardTitle>
                <CardDescription>
                  Untuk menggunakan fitur absensi wajah, Anda perlu mendaftarkan wajah terlebih dahulu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showRegistration ? (
                  <FaceRegistration
                    userId={user!.id}
                    userName={profile!.name}
                    onSuccess={handleRegistrationSuccess}
                  />
                ) : (
                  <Button 
                    onClick={() => setShowRegistration(true)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Mulai Pendaftaran Wajah
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
