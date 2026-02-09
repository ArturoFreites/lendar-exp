import React, { useState, useEffect, useRef } from 'react';
import { useEmails } from '../../hooks/use-emails';
import { useAuth } from '../../contexts/AuthContext';
import { useProdPromotion } from '../../contexts/ProdPromotionContext';
import {
  EmailConfigResponse,
  EmailConfigRequest,
  EmailLayoutConfigResponse,
  EmailLayoutConfigRequest,
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Mail, Plus, Edit2, Search, Power, PowerOff, Layout, Eye, ArrowLeft, Save, Send, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { BookOpen } from 'lucide-react';
import { EmailEditor } from './EmailEditor';

const PLACEHOLDERS_HELP = 'Usa las variables entre llaves; ver leyenda abajo.';

/** Leyenda de variables disponibles en plantillas de email (BE/FE), agrupadas por categoría. */
const EMAIL_PLACEHOLDERS_LEGEND: { category: string; items: { key: string; desc: string }[] }[] = [
  {
    category: 'Usuario y cuenta',
    items: [
      { key: 'fullName', desc: 'Nombre y apellido del usuario' },
      { key: 'userName', desc: 'Nombre de usuario' },
      { key: 'verifyUrl', desc: 'URL de verificación de cuenta' },
      { key: 'resetUrl', desc: 'URL para restablecer contraseña' },
      { key: 'resetLink', desc: 'Enlace de reseteo de contraseña' },
    ],
  },
  {
    category: 'Sistema',
    items: [
      { key: 'year', desc: 'Año actual' },
      { key: 'supportEmail', desc: 'Email de soporte' },
    ],
  },
  {
    category: 'Solicitudes y mensajes',
    items: [
      { key: 'solicitante', desc: 'Nombre del solicitante' },
      { key: 'solicitanteEmail', desc: 'Email del solicitante' },
      { key: 'ejecutivo', desc: 'Nombre del ejecutivo asignado' },
      { key: 'agente', desc: 'Nombre del agente Remax' },
      { key: 'prestador', desc: 'Nombre del prestador (si aplica)' },
      { key: 'url', desc: 'URL generada (ej. landing de solicitud)' },
      { key: 'orderId', desc: 'ID de orden (si aplica)' },
    ],
  },
];

/** Estilos base del cuerpo del email en vista previa (evitan que se pierdan espaciados al editar con TipTap). */
const EMAIL_PREVIEW_BODY_STYLES = `
.email-preview-body p { font-size:15px; line-height:1.6; margin:0 0 16px; color:#1f2a2a; }
.email-preview-body h1 { font-size:18px; margin:0 0 16px; font-weight:700; color:#1f2a2a; }
.email-preview-body h2 { font-size:17px; margin:0 0 14px; font-weight:700; color:#1f2a2a; }
.email-preview-body h3 { font-size:16px; margin:0 0 12px; font-weight:700; color:#1f2a2a; }
.email-preview-body a { color:#38bdb8; text-decoration:none; }
/* Solo los botones CTA (clase email-cta-button) tienen estilo de botón; los hipervínculos normales se mantienen como enlace */
.email-preview-body a.email-cta-button { display:inline-block; background:#38bdb8; color:#fff !important; font-weight:700; font-size:15px; padding:14px 32px; border-radius:8px; text-decoration:none !important; }
.email-preview-body strong { font-weight:700; }
.email-preview-body br + * { margin-top:0; }
`;

/** Estructura de email real (base.html): wrapper + header + cuerpo + footer. El cuerpo va envuelto para aplicar estilos base. */
function buildEmailPreviewHtml(headerHtml: string, bodyHtml: string, footerHtml: string): string {
  const bodyWrapped = `<style>${EMAIL_PREVIEW_BODY_STYLES}</style><div class="email-preview-body">${bodyHtml}</div>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f7f7; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">
  <tr><td align="center" style="padding: 0;">
    <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; margin: 0 auto;">
      <tr><td>${headerHtml}</td></tr>
      <tr><td style="background-color: #ffffff; padding: 64px 96px; text-align: left; color: #1f2a2a;">${bodyWrapped}</td></tr>
      <tr><td>${footerHtml}</td></tr>
      <tr><td style="height: 34px; line-height: 34px; font-size: 1px;">&nbsp;</td></tr>
    </table>
  </td></tr>
</table>`;
}

export function Emails() {
  const emailsApi = useEmails();
  const { environment } = useAuth();
  const { openPromoteFlow } = useProdPromotion();
  const [emailConfigs, setEmailConfigs] = useState<EmailConfigResponse[]>([]);
  const [layoutConfig, setLayoutConfig] = useState<EmailLayoutConfigResponse | null>(null);
  const [defaultLayout, setDefaultLayout] = useState<EmailLayoutConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plantillas');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [configSearch, setConfigSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pantalla completa: null = lista, 'new' = nueva plantilla, number = editar id
  const [editorFullScreen, setEditorFullScreen] = useState<null | 'new' | number>(null);
  const [editingConfig, setEditingConfig] = useState<EmailConfigResponse | null>(null);
  const [configForm, setConfigForm] = useState<EmailConfigRequest>({
    key: '',
    description: '',
    subjectTemplate: '',
    bodyTemplate: '',
  });
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  const [layoutForm, setLayoutForm] = useState<EmailLayoutConfigRequest>({ headerHtml: '', footerHtml: '' });
  const [layoutSaving, setLayoutSaving] = useState(false);

  const [sendTestDialogOpen, setSendTestDialogOpen] = useState(false);
  const [sendTestEmail, setSendTestEmail] = useState('');
  const [sendTestSending, setSendTestSending] = useState(false);

  const loadEmailConfigs = async (page: number = 0, search?: string) => {
    if (!emailsApi.hasApi) return;
    setConfigLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), size: '10' };
      if (search?.trim()) params.contains = `key:${search.trim()}`;
      const response = await emailsApi.getEmailConfigs(params);
      if (response?.code === 200 && response.data) {
        setEmailConfigs(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setCurrentPage(response.data.number ?? 0);
      } else {
        setEmailConfigs([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar plantillas');
      setEmailConfigs([]);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadLayoutConfig = async () => {
    if (!emailsApi.hasApi) return;
    setLayoutLoading(true);
    try {
      const response = await emailsApi.getEmailLayoutConfig();
      if (response?.code === 200 && response.data) {
        setLayoutConfig(response.data);
        setLayoutForm({ headerHtml: response.data.headerHtml || '', footerHtml: response.data.footerHtml || '' });
      }
    } catch {
      toast.error('Error al cargar layout');
    } finally {
      setLayoutLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'plantillas') loadEmailConfigs(0, configSearch);
    if (activeTab === 'layout') loadLayoutConfig();
  }, [activeTab]);

  useEffect(() => {
    if (emailsApi.hasApi && !layoutConfig) loadLayoutConfig();
  }, [emailsApi.hasApi]);

  const loadDefaultLayout = async () => {
    if (!emailsApi.hasApi || defaultLayout) return;
    try {
      const response = await emailsApi.getEmailLayoutConfigDefault();
      if (response?.code === 200 && response.data) setDefaultLayout(response.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (emailsApi.hasApi && editorFullScreen !== null) loadDefaultLayout();
  }, [emailsApi.hasApi, editorFullScreen]);

  const runConfigSearch = (searchValue: string) => {
    setCurrentPage(0);
    loadEmailConfigs(0, searchValue);
  };

  const handleConfigSearch = (searchValue: string) => {
    setConfigSearch(searchValue);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      runConfigSearch(searchValue);
    }, 300);
  };

  const openEditorFullScreen = (config?: EmailConfigResponse) => {
    if (config) {
      setEditingConfig(config);
      setConfigForm({
        key: config.key,
        description: config.description ?? '',
        subjectTemplate: config.subjectTemplate,
        bodyTemplate: config.bodyTemplate,
      });
      setEditorFullScreen(config.id);
    } else {
      setEditingConfig(null);
      setConfigForm({ key: '', description: '', subjectTemplate: '', bodyTemplate: '' });
      setEditorFullScreen('new');
    }
  };

  const closeEditorFullScreen = () => {
    setEditorFullScreen(null);
    setEditingConfig(null);
    loadEmailConfigs(currentPage, configSearch);
  };

  const handleSaveConfig = async () => {
    if (!emailsApi.hasApi) return;
    if (!configForm.key.trim()) {
      toast.error('La clave es obligatoria');
      return;
    }
    if (!configForm.subjectTemplate.trim()) {
      toast.error('El asunto es obligatorio');
      return;
    }
    if (!configForm.bodyTemplate.trim()) {
      toast.error('El cuerpo del email es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const request: EmailConfigRequest = {
        key: configForm.key.trim(),
        description: configForm.description?.trim() || null,
        subjectTemplate: configForm.subjectTemplate.trim(),
        bodyTemplate: configForm.bodyTemplate,
      };
      if (editingConfig) {
        const response = await emailsApi.updateEmailConfig(editingConfig.id, request);
        if (response?.code === 200) {
          toast.success('Plantilla actualizada');
          closeEditorFullScreen();
        } else toast.error(response?.message || 'Error al actualizar');
      } else {
        const response = await emailsApi.createEmailConfig(request);
        if (response?.code === 200) {
          toast.success('Plantilla creada');
          closeEditorFullScreen();
        } else toast.error(response?.message || 'Error al crear');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (config: EmailConfigResponse) => {
    if (!emailsApi.hasApi) return;
    try {
      const response = await emailsApi.updateEmailConfigActive(config.id, !config.active);
      if (response?.code === 200) {
        toast.success(config.active ? 'Plantilla desactivada' : 'Plantilla activada');
        await loadEmailConfigs(currentPage, configSearch);
      } else toast.error(response?.message || 'Error al actualizar estado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleSendTestEmail = async () => {
    if (!emailsApi.hasApi || !editingConfig) return;
    const email = sendTestEmail.trim();
    if (!email) {
      toast.error('Ingresá un email de destino');
      return;
    }
    setSendTestSending(true);
    try {
      const response = await emailsApi.sendEmailConfigTest(editingConfig.id, email);
      if (response?.code === 200) {
        toast.success('Email de ejemplo enviado correctamente');
        setSendTestDialogOpen(false);
        setSendTestEmail('');
      } else {
        toast.error(response.message || 'Error al enviar');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setSendTestSending(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!emailsApi.hasApi) return;
    setLayoutSaving(true);
    try {
      const response = await emailsApi.updateEmailLayoutConfig(layoutForm);
      if (response?.code === 200 && response.data) {
        toast.success('Layout actualizado');
        setLayoutConfig(response.data);
      } else toast.error(response?.message || 'Error al guardar layout');
    } catch {
      toast.error('Error al guardar layout');
    } finally {
      setLayoutSaving(false);
    }
  };

  const getEffectiveHeaderFooter = () => {
    const header = (layoutConfig?.headerHtml?.trim() || defaultLayout?.headerHtml || '').trim();
    const footer = (layoutConfig?.footerHtml?.trim() || defaultLayout?.footerHtml || '').trim();
    return { header: header || '<div style="background:#38bdb8;padding:16px;text-align:center;color:#fff;">Header</div>', footer: footer || '<div style="background:#dff3f2;padding:16px;text-align:center;">Footer</div>' };
  };

  const previewHtml = (bodyHtml: string) => {
    const { header, footer } = getEffectiveHeaderFooter();
    return buildEmailPreviewHtml(header, bodyHtml || '<p style="color:#6b6a6e;">Escribí el cuerpo para ver la vista previa.</p>', footer);
  };

  // Vista pantalla completa: editor + preview
  if (editorFullScreen !== null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f9fa]">
        {/* Barra superior */}
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#4a494d]/10 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={closeEditorFullScreen}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <span className="text-lg font-semibold text-[#3b3a3e]">
              {editingConfig ? `Editar: ${editingConfig.key}` : 'Nueva plantilla'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {editingConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSendTestEmail('');
                  setSendTestDialogOpen(true);
                }}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar ejemplo
              </Button>
            )}
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-[#55c3c5] hover:bg-[#4ab3b5] gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : editingConfig ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </header>

        {/* Contenido: editor + preview (redimensionable a lo ancho) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={55} minSize={35} className="flex flex-col min-h-0 min-w-0 border-r border-[#4a494d]/10 bg-white">
            <ScrollArea className="flex-1 min-h-0">
              <div className="max-w-2xl space-y-5 p-6">
              <div className="space-y-2">
                <Label className="text-[#3b3a3e]">Clave *</Label>
                <Input
                  value={configForm.key}
                  onChange={(e) => setConfigForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="ej: EmailSendConfirmAccountProcessor"
                  disabled={!!editingConfig}
                  className={editingConfig ? 'bg-[#f1f1f2] text-[#6b6a6e]' : ''}
                />
                {editingConfig && <p className="text-xs text-[#6b6a6e]">La clave no se puede modificar</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[#3b3a3e]">Descripción (opcional)</Label>
                <Input
                  value={configForm.description ?? ''}
                  onChange={(e) => setConfigForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Qué hace este email..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#3b3a3e]">Asunto *</Label>
                <Input
                  value={configForm.subjectTemplate}
                  onChange={(e) => setConfigForm((f) => ({ ...f, subjectTemplate: e.target.value }))}
                  placeholder="Confirmá tu cuenta"
                />
                <p className="text-xs text-[#6b6a6e]">{PLACEHOLDERS_HELP}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#3b3a3e]">Cuerpo del email (HTML) *</Label>
                <EmailEditor
                  key={editorFullScreen === 'new' ? 'new' : editorFullScreen}
                  value={configForm.bodyTemplate}
                  onChange={(html) => setConfigForm((f) => ({ ...f, bodyTemplate: html }))}
                  placeholder="Contenido del email. Usa {placeholders} para datos dinámicos."
                  minHeight="320px"
                />
                <p className="text-xs text-[#6b6a6e]">{PLACEHOLDERS_HELP}</p>
              </div>
              <Accordion type="single" collapsible className="rounded-xl border border-[#4a494d]/10 bg-[#f8f9fa] overflow-hidden">
                <AccordionItem value="leyenda" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-[#4a494d]/10">
                    <span className="text-sm font-semibold text-[#3b3a3e] flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#55c3c5]" />
                      Leyenda de variables
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-4 pb-4 space-y-5">
                      <p className="text-xs text-[#6b6a6e]">Escribí el nombre entre llaves, ej. {`{fullName}`}</p>
                      {EMAIL_PLACEHOLDERS_LEGEND.map(({ category, items }) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-[#55c3c5] uppercase tracking-wide mb-2">{category}</p>
                          <ul className="space-y-2">
                            {items.map(({ key, desc }) => (
                              <li key={key} className="flex items-start gap-3 text-sm">
                                <code className="rounded-md bg-[#e8eaeb] px-2 py-1 font-mono text-[#1f2a2a] text-xs shrink-0 border border-[#4a494d]/10">{`{${key}}`}</code>
                                <span className="text-[#6b6a6e] pt-0.5">{desc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-[#4a494d]/10 hover:bg-[#55c3c5]/30 transition-colors" />
          <ResizablePanel defaultSize={45} minSize={25} className="flex flex-col min-w-0 bg-[#eef0f1]">
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#4a494d]/10 bg-white/80">
              <span className="text-sm font-medium text-[#6b6a6e] flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista previa (arrastrá el borde para cambiar el ancho)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {showPreview && (
              <div className="flex-1 flex flex-col min-h-0 p-6">
                <div className="rounded-xl overflow-hidden border border-[#4a494d]/10 shadow-sm bg-[#f3f7f7] flex-1 min-h-0 overflow-y-auto">
                  <div
                    className="text-left p-4"
                    style={{ maxWidth: 640, margin: '0 auto' }}
                    dangerouslySetInnerHTML={{
                      __html: previewHtml(configForm.bodyTemplate),
                    }}
                  />
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>

        <Dialog open={sendTestDialogOpen} onOpenChange={setSendTestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar ejemplo por correo</DialogTitle>
              <DialogDescription>
                Se enviará la plantilla guardada a la dirección que indiques. Los placeholders se reemplazarán por valores de ejemplo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sendTestEmail">Email de destino</Label>
                <Input
                  id="sendTestEmail"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={sendTestEmail}
                  onChange={(e) => setSendTestEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendTestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendTestEmail} disabled={sendTestSending} className="bg-[#55c3c5] hover:bg-[#4ab3b5] gap-2">
                <Send className="h-4 w-4" />
                {sendTestSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista normal: lista + tabs
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#3b3a3e] flex items-center gap-2">
          <Mail className="h-7 w-7 text-[#55c3c5]" />
          Emails
        </h1>
        <p className="text-[#6b6a6e] mt-1">
          Configuración de plantillas de email y layout (header/footer). Vista previa en tiempo real.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f8f9fa] border border-[#4a494d]/10">
          <TabsTrigger value="plantillas" className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white">
            Plantillas de email
          </TabsTrigger>
          <TabsTrigger value="layout" className="data-[state=active]:bg-[#55c3c5] data-[state=active]:text-white">
            Layout (header y footer)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Plantillas</CardTitle>
                <CardDescription>Gestiona las plantillas de email. Usa placeholders como {`{fullName}`}, {`{verifyUrl}`}.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-2 flex-1 max-w-sm">
                  <Input
                    placeholder="Buscar por clave..."
                    value={configSearch}
                    onChange={(e) => handleConfigSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runConfigSearch(configSearch)}
                  />
                  <Button variant="outline" size="icon" onClick={() => runConfigSearch(configSearch)} disabled={configLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => openEditorFullScreen()} className="bg-[#55c3c5] hover:bg-[#4ab3b5] gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando plantillas...</div>
              ) : emailConfigs.length === 0 ? (
                <div className="text-center py-8 text-[#6b6a6e]">No hay plantillas. Crea una para empezar.</div>
              ) : (
                <>
                  <ScrollArea className="h-[420px]">
                    <div className="space-y-3">
                      {emailConfigs.map((config) => (
                        <Card
                          key={config.id}
                          className={`border-l-4 ${config.active ? 'border-l-[#55c3c5] bg-white' : 'border-l-gray-300 bg-gray-50'}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-[#3b3a3e]">{config.key}</h3>
                                  <Badge variant={config.active ? 'default' : 'outline'} className={config.active ? 'bg-[#55c3c5]' : ''}>
                                    {config.active ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                                {config.description && (
                                  <p className="text-[#6b6a6e] text-sm mb-2">{config.description}</p>
                                )}
                                <p className="text-[#6b6a6e] text-sm">
                                  <span className="font-medium">Asunto:</span> {config.subjectTemplate}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[#6b6a6e] mt-2">
                                  <span>Creada: {format(new Date(config.createdAt), 'PPpp', { locale: es })}</span>
                                  {config.updatedAt && <span>Actualizada: {format(new Date(config.updatedAt), 'PPpp', { locale: es })}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleToggleActive(config)} title={config.active ? 'Desactivar' : 'Activar'}>
                                  {config.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEditorFullScreen(config)} className="gap-2">
                                  <Edit2 className="h-4 w-4" />
                                  Editar
                                </Button>
                                {environment === 'development' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openPromoteFlow('email_config', {
                                        key: config.key,
                                        description: config.description ?? undefined,
                                        subjectTemplate: config.subjectTemplate,
                                        bodyTemplate: config.bodyTemplate,
                                      })
                                    }
                                    className="gap-2"
                                    title="Subir esta plantilla de email a producción"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Subir a producción
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-[#6b6a6e]">Página {currentPage + 1} de {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadEmailConfigs(currentPage - 1, configSearch)} disabled={currentPage === 0 || configLoading}>
                          Anterior
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => loadEmailConfigs(currentPage + 1, configSearch)} disabled={currentPage >= totalPages - 1 || configLoading}>
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Header y footer del email
              </CardTitle>
              <CardDescription>
                Contenido común que envuelve el cuerpo de cada email. Se usa en todas las plantillas y en la vista previa.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {layoutLoading ? (
                <div className="text-center py-8 text-[#6b6a6e]">Cargando layout...</div>
              ) : (
                <ResizablePanelGroup direction="horizontal" className="min-h-[520px]">
                  <ResizablePanel defaultSize={55} minSize={35} className="flex flex-col min-h-0 min-w-0">
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-6 space-y-6 max-w-2xl">
                        <Accordion type="single" collapsible className="rounded-xl border border-[#4a494d]/10 bg-[#f8f9fa] overflow-hidden">
                          <AccordionItem value="leyenda" className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-[#4a494d]/10">
                              <span className="text-sm font-semibold text-[#3b3a3e] flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[#55c3c5]" />
                                Leyenda de variables
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="px-4 pb-4 space-y-5">
                                <p className="text-xs text-[#6b6a6e]">Escribí el nombre entre llaves, ej. {`{fullName}`}</p>
                                {EMAIL_PLACEHOLDERS_LEGEND.map(({ category, items }) => (
                                  <div key={category}>
                                    <p className="text-xs font-semibold text-[#55c3c5] uppercase tracking-wide mb-2">{category}</p>
                                    <ul className="space-y-2">
                                      {items.map(({ key, desc }) => (
                                        <li key={key} className="flex items-start gap-3 text-sm">
                                          <code className="rounded-md bg-[#e8eaeb] px-2 py-1 font-mono text-[#1f2a2a] text-xs shrink-0 border border-[#4a494d]/10">{`{${key}}`}</code>
                                          <span className="text-[#6b6a6e] pt-0.5">{desc}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <div className="space-y-2">
                          <Label className="text-[#3b3a3e]">Header HTML</Label>
                          <EmailEditor
                            key="layout-header"
                            value={layoutForm.headerHtml}
                            onChange={(html) => setLayoutForm((f) => ({ ...f, headerHtml: html }))}
                            placeholder="Contenido del encabezado del email..."
                            minHeight="140px"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#3b3a3e]">Footer HTML</Label>
                          <EmailEditor
                            key="layout-footer"
                            value={layoutForm.footerHtml}
                            onChange={(html) => setLayoutForm((f) => ({ ...f, footerHtml: html }))}
                            placeholder="Contenido del pie del email..."
                            minHeight="140px"
                          />
                        </div>
                        <Button onClick={handleSaveLayout} disabled={layoutSaving} className="bg-[#55c3c5] hover:bg-[#4ab3b5]">
                          {layoutSaving ? 'Guardando...' : 'Guardar layout'}
                        </Button>
                      </div>
                    </ScrollArea>
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-[#4a494d]/10 hover:bg-[#55c3c5]/30 transition-colors" />
                  <ResizablePanel defaultSize={45} minSize={25} className="flex flex-col min-w-0 bg-[#eef0f1]">
                    <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[#4a494d]/10 bg-white/80">
                      <Eye className="h-4 w-4 text-[#6b6a6e]" />
                      <span className="text-sm font-medium text-[#6b6a6e]">Vista previa (arrastrá el borde para cambiar el ancho)</span>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 p-6">
                      <div className="rounded-xl overflow-hidden border border-[#4a494d]/10 shadow-sm bg-[#f3f7f7] flex-1 min-h-0 overflow-y-auto">
                        <div
                          className="text-left p-4"
                          style={{ maxWidth: 640, margin: '0 auto' }}
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const header = (layoutForm.headerHtml?.trim() || '').trim() || '<div style="background:#38bdb8;padding:16px;text-align:center;color:#fff;">Header</div>';
                              const footer = (layoutForm.footerHtml?.trim() || '').trim() || '<div style="background:#dff3f2;padding:16px;text-align:center;">Footer</div>';
                              const bodyPlaceholder = '<p style="color:#6b6a6e;">Vista previa del layout. El cuerpo lo define cada plantilla.</p>';
                              return buildEmailPreviewHtml(header, bodyPlaceholder, footer);
                            })(),
                          }}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
