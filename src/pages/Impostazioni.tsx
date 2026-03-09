import { useState, useEffect } from "react";
import { User, Mail, Lock, Bell, Save, Loader2, Droplets, Calendar, Wallet, TrendingUp, CreditCard, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useUpdateProfile, useUpdatePassword } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Impostazioni() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const { profile, user } = useAuth();
  const { subscription, isLoading: subLoading } = useUserSubscription();

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [emailNotifiche, setEmailNotifiche] = useState(true);
  const [pushNotifiche, setPushNotifiche] = useState(true);
  const [alertCritici, setAlertCritici] = useState(true);
  const [reportSettimanali, setReportSettimanali] = useState(false);
  const [notifyLiquidity, setNotifyLiquidity] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyBudget, setNotifyBudget] = useState(true);
  const [notifyCashflow, setNotifyCashflow] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setVatNumber((profile as any).vat_number || "");
    }
  }, [profile]);

  // Load preferences when data is available
  useEffect(() => {
    if (preferences) {
      setEmailNotifiche(preferences.emailAlerts);
      setPushNotifiche(preferences.pushAlerts);
      setAlertCritici(preferences.criticalAlerts);
      setReportSettimanali(preferences.weeklySummary);
      setNotifyLiquidity(preferences.notifyLiquidity);
      setNotifyDeadlines(preferences.deadlineReminders);
      setNotifyBudget(preferences.budgetAlerts);
      setNotifyCashflow(preferences.notifyCashflow);
      setNotificationEmail(preferences.notificationEmail);
    }
  }, [preferences]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        vat_number: vatNumber || undefined,
      });

      if (newPassword.length > 0) {
        if (newPassword.length < 6) {
          toast.error("La password deve essere di almeno 6 caratteri");
          setProfileSaving(false);
          return;
        }
        await updatePassword.mutateAsync(newPassword);
        setNewPassword("");
      }

      toast.success("Profilo aggiornato con successo");
    } catch (error) {
      toast.error("Errore nell'aggiornamento del profilo");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        emailAlerts: emailNotifiche,
        pushAlerts: pushNotifiche,
        criticalAlerts: alertCritici,
        budgetAlerts: notifyBudget,
        deadlineReminders: notifyDeadlines,
        weeklySummary: reportSettimanali,
        notifyLiquidity,
        notifyCashflow,
        notificationEmail,
      });
      toast.success("Preferenze salvate con successo");
    } catch (error) {
      toast.error("Errore nel salvataggio delle preferenze");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni Personali</h1>
        <p className="text-muted-foreground mt-1">
          Personalizzazione esperienza utente
        </p>
      </div>

      <Tabs defaultValue="profilo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profilo" className="gap-2">
            <User className="h-4 w-4" />
            Profilo & Notifiche
          </TabsTrigger>
          <TabsTrigger value="abbonamento" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Abbonamento
          </TabsTrigger>
        </TabsList>

        {/* ── Profilo & Notifiche Tab ── */}
        <TabsContent value="profilo" className="space-y-6 mt-6">
          {/* Profile Section */}
          <div className="glass rounded-xl p-6">
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
                  <Label htmlFor="firstName" className="text-muted-foreground">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Il tuo nome"
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-muted-foreground">Cognome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Il tuo cognome"
                    className="bg-secondary border-border focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-9 bg-secondary border-border text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground">L'email non può essere modificata</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Nuova Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Lascia vuoto per non cambiare"
                    className="pl-9 bg-secondary border-border focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimo 6 caratteri</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva Profilo
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Preferenze Notifiche</h3>
                <p className="text-sm text-muted-foreground">Gestisci come ricevere gli aggiornamenti</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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

                <Separator className="bg-border" />

                {/* Alert Type Configuration */}
                <div className="py-4">
                  <p className="font-medium text-foreground mb-3">Tipi di Alert da Ricevere</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                      <Checkbox 
                        checked={notifyLiquidity} 
                        onCheckedChange={(checked) => setNotifyLiquidity(checked as boolean)} 
                      />
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="text-sm">Liquidità</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                      <Checkbox 
                        checked={notifyDeadlines} 
                        onCheckedChange={(checked) => setNotifyDeadlines(checked as boolean)} 
                      />
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Scadenze</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                      <Checkbox 
                        checked={notifyBudget} 
                        onCheckedChange={(checked) => setNotifyBudget(checked as boolean)} 
                      />
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Budget</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                      <Checkbox 
                        checked={notifyCashflow} 
                        onCheckedChange={(checked) => setNotifyCashflow(checked as boolean)} 
                      />
                      <TrendingUp className="h-4 w-4 text-violet-500" />
                      <span className="text-sm">Cashflow</span>
                    </label>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Custom Notification Email */}
                <div className="py-2">
                  <Label htmlFor="notification-email" className="text-muted-foreground">
                    Email per notifiche (opzionale)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Lascia vuoto per usare l'email del tuo account
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="notification-email"
                      type="email"
                      placeholder="notifiche@azienda.it"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      className="pl-9 bg-secondary border-border focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={updatePreferences.isPending}
            >
              {updatePreferences.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salva Modifiche
            </Button>
          </div>
        </TabsContent>

        {/* ── Abbonamento Tab ── */}
        <TabsContent value="abbonamento" className="space-y-6 mt-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Il tuo Abbonamento</h3>
                <p className="text-sm text-muted-foreground">Gestisci il tuo piano e la fatturazione</p>
              </div>
            </div>

            {subLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Current Plan Card */}
                <div className="rounded-lg border border-border bg-secondary/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Piano attivo</p>
                      <p className="text-xl font-bold text-foreground">{subscription.planName}</p>
                    </div>
                    <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                      Attivo
                    </Badge>
                  </div>

                  <Separator className="bg-border" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stato</p>
                      <p className="font-medium text-foreground capitalize">{subscription.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scadenza</p>
                      <p className="font-medium text-foreground">
                        {subscription.expiresAt
                          ? format(new Date(subscription.expiresAt), "dd MMMM yyyy", { locale: it })
                          : "Nessuna scadenza"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Crediti AI rimanenti</p>
                      <p className="font-medium text-foreground">€{subscription.aiCreditsRemaining.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Funzionalità incluse</p>
                      <p className="font-medium text-foreground">{subscription.features.length} moduli</p>
                    </div>
                  </div>
                </div>

                {/* Features list */}
                {subscription.features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Moduli attivi</p>
                    <div className="flex flex-wrap gap-2">
                      {subscription.features.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {f.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => setShowPaymentModal(true)} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cambia Piano
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Nessun abbonamento attivo</p>
                  <p className="text-sm text-muted-foreground mt-1">Scegli un piano per sbloccare tutte le funzionalità</p>
                </div>
                <Button onClick={() => setShowPaymentModal(true)} className="gap-2">
                  <Crown className="h-4 w-4" />
                  Scegli un Piano
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PaymentMethodModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        planName={subscription?.planName || "Pro"}
        planId={subscription?.planId}
        price={0}
        isAnnual={false}
      />
    </div>
  );
}
