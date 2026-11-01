// v94: RadShield-MX branded login with Kimi OAuth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn, Radio, BookOpen, GitBranch } from "lucide-react";
import { buildKimiOAuthUrl, isKimiOAuthEnabled } from "@/lib/authConfig";

export default function Login() {
  const oauthEnabled = isKimiOAuthEnabled();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            RadShield<span className="text-orange-500">-MX</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Professional Radiation Shielding Design
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-800">
          <CardHeader className="text-center pb-2">
            <Badge variant="outline" className="mx-auto mb-2 text-[10px] text-slate-400">
              NCRP 147/151/155 Compliant
            </Badge>
            <CardTitle className="text-lg">Iniciar Sesion</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Acceda a sus proyectos en la nube y funciones avanzadas
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-200 transition-all hover:shadow-lg"
              size="lg"
              disabled={!oauthEnabled}
              onClick={() => {
                const url = buildKimiOAuthUrl();
                if (url) window.location.href = url;
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {oauthEnabled ? "Entrar con Kimi" : "Kimi OAuth no configurado"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => { window.location.href = '/'; }}
            >
              Continuar sin sesion
            </Button>

            <div className="pt-3 border-t text-center space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Normas de referencia
              </p>
              <div className="flex justify-center gap-3 text-slate-300">
                <Radio className="w-4 h-4" aria-label="NCRP" />
                <BookOpen className="w-4 h-4" aria-label="IAEA" />
                <GitBranch className="w-4 h-4" aria-label="AAPM" />
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-slate-300 mt-4">
          v94 | 2022-2026 | C.E. Cardena et al. | RadShield-MX
        </p>
      </div>
    </div>
  );
}
