import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scan, Shield, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-face-recognition.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="inset-0 bg-gradient-primary opacity-5" />
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">Sistem Absensi Wajah</h1>
                <p className="text-xl text-muted-foreground">Absensi lebih cepat, aman, dan tanpa kertas</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="shadow-elegant hover:shadow-glow transition-all">
                  Masuk / Daftar
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur-3xl" />
              <img src={heroImage} alt="Face Recognition System" className="relative rounded-3xl shadow-elegant w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Mengapa Memilih Kami?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Teknologi pengenalan wajah canggih untuk absensi yang lebih efisien</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Scan className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cepat & Akurat</h3>
              <p className="text-muted-foreground">Verifikasi wajah dalam hitungan detik dengan akurasi tinggi</p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Aman & Privat</h3>
              <p className="text-muted-foreground">Data wajah terenkripsi dan dilindungi dengan standar keamanan tinggi</p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time</h3>
              <p className="text-muted-foreground">Catat kehadiran secara instan dan lihat laporan langsung</p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mudah Dikelola</h3>
              <p className="text-muted-foreground">Dashboard admin intuitif untuk mengelola pengguna dan absensi</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-primary rounded-3xl p-12 text-center text-primary-foreground shadow-glow">
            <h2 className="text-4xl font-bold mb-4">Siap Untuk Memulai?</h2>
            <p className="text-xl mb-8 opacity-90">Daftar sekarang dan rasakan kemudahan absensi dengan teknologi wajah</p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="shadow-elegant">
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Sistem Absensi Wajah. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
