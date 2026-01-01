'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Shield,
  Database,
  Save,
  Loader2,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';

export default function AdminConfiguracionPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estados de configuracion (simulados por ahora)
  const [config, setConfig] = useState({
    stockBajoUmbral: 5,
    emailNotificaciones: true,
    emailStockBajo: true,
    emailReservas: true,
    auditEnabled: true,
    auditRetentionDays: 90,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuracion</h1>
          <p className="text-muted-foreground">Ajustes del sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Inventario
            </CardTitle>
            <CardDescription>Configuracion de stock y alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stockUmbral">Umbral de stock bajo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stockUmbral"
                  type="number"
                  min="1"
                  max="100"
                  value={config.stockBajoUmbral}
                  onChange={(e) =>
                    setConfig({ ...config, stockBajoUmbral: parseInt(e.target.value) || 5 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">unidades</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los productos con stock igual o menor a este valor apareceran en alertas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configuracion de alertas por email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por email</Label>
                <p className="text-xs text-muted-foreground">Activar envio de emails</p>
              </div>
              <Switch
                checked={config.emailNotificaciones}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, emailNotificaciones: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de stock bajo</Label>
                <p className="text-xs text-muted-foreground">Notificar cuando el stock este bajo</p>
              </div>
              <Switch
                checked={config.emailStockBajo}
                onCheckedChange={(checked) => setConfig({ ...config, emailStockBajo: checked })}
                disabled={!config.emailNotificaciones}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nuevas reservas</Label>
                <p className="text-xs text-muted-foreground">Notificar al recibir reservas</p>
              </div>
              <Switch
                checked={config.emailReservas}
                onCheckedChange={(checked) => setConfig({ ...config, emailReservas: checked })}
                disabled={!config.emailNotificaciones}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auditoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Auditoria
            </CardTitle>
            <CardDescription>Configuracion del sistema de auditoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auditoria activa</Label>
                <p className="text-xs text-muted-foreground">Registrar cambios en el sistema</p>
              </div>
              <Switch
                checked={config.auditEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, auditEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retencion de logs</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="retentionDays"
                  type="number"
                  min="30"
                  max="365"
                  value={config.auditRetentionDays}
                  onChange={(e) =>
                    setConfig({ ...config, auditRetentionDays: parseInt(e.target.value) || 90 })
                  }
                  className="w-24"
                  disabled={!config.auditEnabled}
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Los logs mas antiguos seran eliminados automaticamente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informacion del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>Informacion del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entorno</p>
                <Badge variant="secondary">Desarrollo</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Backend</p>
                <p className="font-mono text-xs">localhost:3001</p>
              </div>
              <div>
                <p className="text-muted-foreground">Base de datos</p>
                <Badge variant="outline" className="text-success">
                  Conectada
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Vestimenta Catan - Sistema de gestion de inventario y reservas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
