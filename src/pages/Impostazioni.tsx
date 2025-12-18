import { useState } from "react";
import { User, Mail, Lock, Globe, Calendar, Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Impostazioni() {
  const [emailNotifiche, setEmailNotifiche] = useState(true);
  const [pushNotifiche, setPushNotifiche] = useState(true);
  const [alertCritici, setAlertCritici] = useState(true);
  const [reportSettimanali, setReportSettimanali] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Impostazioni Personali</h1>
        <p className="text-muted-foreground mt-1">
          Personalizzazione esperienza utente
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Profilo</h3>
            <p className="text-sm text-muted-foreground">Gestisci le tue informazioni personali</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-muted-foreground">Nome</Label>
              <Input
                id="nome"
                defaultValue="Mario Rossi"
                className="bg-secondary border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue="mario.rossi@azienda.it"
                  className="pl-9 bg-secondary border-border focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                defaultValue="••••••••••••"
                className="pl-9 bg-secondary border-border focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Ultimo aggiornamento: 15 giorni fa</p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="glass rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Preferenze</h3>
            <p className="text-sm text-muted-foreground">Personalizza la tua esperienza</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Lingua</Label>
            <Select defaultValue="it">
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Formato Data</Label>
            <Select defaultValue="dd/mm/yyyy">
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Preferenze Notifiche</h3>
            <p className="text-sm text-muted-foreground">Gestisci come ricevere gli aggiornamenti</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Notifiche Email</p>
              <p className="text-sm text-muted-foreground">Ricevi aggiornamenti via email</p>
            </div>
            <Switch checked={emailNotifiche} onCheckedChange={setEmailNotifiche} />
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Notifiche Push</p>
              <p className="text-sm text-muted-foreground">Ricevi notifiche push nel browser</p>
            </div>
            <Switch checked={pushNotifiche} onCheckedChange={setPushNotifiche} />
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Alert Critici</p>
              <p className="text-sm text-muted-foreground">Notifica immediata per situazioni urgenti</p>
            </div>
            <Switch checked={alertCritici} onCheckedChange={setAlertCritici} />
          </div>

          <Separator className="bg-border" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Report Settimanali</p>
              <p className="text-sm text-muted-foreground">Ricevi un riepilogo ogni lunedì</p>
            </div>
            <Switch checked={reportSettimanali} onCheckedChange={setReportSettimanali} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" />
          Salva Modifiche
        </Button>
      </div>
    </div>
  );
}
