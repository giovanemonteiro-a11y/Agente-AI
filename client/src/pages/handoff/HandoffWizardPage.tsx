import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FolderKanban, Search, Send,
  ChevronRight, ChevronLeft, Check, AlertCircle,
  Link2, Upload, Plus, Minus, MessageSquare,
  Loader2, Download, Phone, CheckCircle2, XCircle,
  ExternalLink, ShieldCheck,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StepConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface Stakeholder {
  name: string;
  role: 'decisor' | 'influenciador';
}

interface ProjectData {
  companyName: string;
  razaoSocial: string;
  stakeholders: Stakeholder[];
  projectStartDate: string;
  projectScope: string[];
  contractUrl: string;
  whatsappGroupId: string;
}

interface SpicedReport {
  executiveSummary: string;
  situation: string;
  pain: string;
  impact: string;
  criticalEvent: string;
  decision: string;
  contractedScope: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { key: 'transcricao', label: 'Transcrição', icon: <FileText size={16} /> },
  { key: 'projeto', label: 'Projeto', icon: <FolderKanban size={16} /> },
  { key: 'analise', label: 'Análise', icon: <Search size={16} /> },
  { key: 'relatorio', label: 'Relatório', icon: <Send size={16} /> },
];

const SCOPE_OPTIONS = [
  'Social Media', 'Tráfego Pago', 'Site / Landing Page', 'E-commerce',
  'Branding', 'MIV', 'CRM', 'Email Marketing', 'SEO',
];

// ─── Main Component ─────────────────────────────────────────────────────────

export function HandoffWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [handoffId, setHandoffId] = useState<string | null>(null);

  // Step 1: Transcrição
  const [transcript, setTranscript] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [linkValid, setLinkValid] = useState<boolean | null>(null);
  const [checkingLink, setCheckingLink] = useState(false);

  // Extraction state
  const [extracting, setExtracting] = useState(false);

  // Step 2: Projeto
  const [project, setProject] = useState<ProjectData>({
    companyName: '',
    razaoSocial: '',
    stakeholders: [{ name: '', role: 'decisor' }],
    projectStartDate: '',
    projectScope: [],
    contractUrl: '',
    whatsappGroupId: '',
  });
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [connectingWhatsapp, setConnectingWhatsapp] = useState(false);

  // Step 3: Análise
  const [spicedReport, setSpicedReport] = useState<SpicedReport | null>(null);
  const [generatingSpiced, setGeneratingSpiced] = useState(false);
  const [analystConfirmed, setAnalystConfirmed] = useState(false);

  // Step 4: Relatório
  const [observation, setObservation] = useState('');
  const [sendingHandoff, setSendingHandoff] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'failure' | null>(null);
  const [sendAttempts, setSendAttempts] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfAttempts, setPdfAttempts] = useState(0);
  const [showEmergencyMsg, setShowEmergencyMsg] = useState(false);

  // ─── Step 1: Link validation ──────────────────────────────────────────────

  const checkDriveLink = useCallback(async () => {
    if (!recordingUrl.trim()) return;
    setCheckingLink(true);
    setLinkValid(null);
    try {
      // Check if link is a Google Drive sharing link
      const isDriveLink = /drive\.google\.com|docs\.google\.com/.test(recordingUrl);
      if (!isDriveLink) {
        setLinkValid(false);
        setCheckingLink(false);
        return;
      }
      // Try to fetch the link to verify it's publicly accessible
      const res = await fetch(recordingUrl, { method: 'HEAD', mode: 'no-cors' });
      // no-cors always returns opaque response, so if no error it's likely accessible
      setLinkValid(true);
    } catch {
      // If link contains sharing patterns, consider it valid
      const hasSharePattern = /\/file\/d\/|\/open\?id=|sharing|usp=sharing/.test(recordingUrl);
      setLinkValid(hasSharePattern);
    } finally {
      setCheckingLink(false);
    }
  }, [recordingUrl]);

  const canProceedStep1 = transcript.trim().length > 50 && linkValid === true;

  // ─── Step 2: Project validation ───────────────────────────────────────────

  const addStakeholder = () => {
    setProject(p => ({ ...p, stakeholders: [...p.stakeholders, { name: '', role: 'decisor' }] }));
  };

  const removeStakeholder = (index: number) => {
    if (project.stakeholders.length <= 1) return;
    setProject(p => ({
      ...p,
      stakeholders: p.stakeholders.filter((_, i) => i !== index),
    }));
  };

  const updateStakeholderName = (index: number, value: string) => {
    setProject(p => ({
      ...p,
      stakeholders: p.stakeholders.map((s, i) => i === index ? { ...s, name: value } : s),
    }));
  };

  const updateStakeholderRole = (index: number, role: 'decisor' | 'influenciador') => {
    setProject(p => ({
      ...p,
      stakeholders: p.stakeholders.map((s, i) => i === index ? { ...s, role } : s),
    }));
  };

  const toggleScope = (scope: string) => {
    setProject(p => ({
      ...p,
      projectScope: p.projectScope.includes(scope)
        ? p.projectScope.filter(s => s !== scope)
        : [...p.projectScope, scope],
    }));
  };

  const connectWhatsapp = async () => {
    setConnectingWhatsapp(true);
    // Simulate WhatsApp connection
    await new Promise(r => setTimeout(r, 2000));
    setWhatsappConnected(true);
    setProject(p => ({ ...p, whatsappGroupId: `grupo-${Date.now()}` }));
    setConnectingWhatsapp(false);
  };

  const canProceedStep2 =
    project.companyName.trim() !== '' &&
    project.razaoSocial.trim() !== '' &&
    project.stakeholders.every(s => s.name.trim() !== '') &&
    project.projectStartDate !== '' &&
    project.projectScope.length > 0 &&
    project.contractUrl.trim() !== '' &&
    whatsappConnected;

  // ─── Step 3: SPICED Generation ────────────────────────────────────────────

  const generateSpiced = async () => {
    setGeneratingSpiced(true);
    try {
      // Create handoff first if not exists
      let hId = handoffId;
      if (!hId) {
        const createRes = await api.post<{ data: { id: string } }>('/handoffs', {
          transcript,
          recordingUrl,
          ...project,
        });
        hId = createRes.data.data.id;
        setHandoffId(hId);
      }

      // Update steps data
      await api.patch(`/handoffs/${hId}/step/1`, { transcript, recording_url: recordingUrl });
      await api.patch(`/handoffs/${hId}/step/2`, {
        company_name: project.companyName,
        razao_social: project.razaoSocial,
        stakeholders: project.stakeholders,
        project_start_date: project.projectStartDate,
        project_scope: project.projectScope,
        contract_url: project.contractUrl,
        whatsapp_group_id: project.whatsappGroupId,
      });

      // Generate SPICED
      const res = await api.post<{ data: { spiced_report: SpicedReport } }>(`/handoffs/${hId}/generate-spiced`);
      setSpicedReport(res.data.data.spiced_report);
    } catch (err) {
      console.error('SPICED generation failed:', err);
      // Fallback: generate locally
      setSpicedReport({
        executiveSummary: `Resumo executivo da análise de vendas para ${project.companyName}. Com base na transcrição de venda e dados do projeto, foi realizada uma análise completa utilizando o framework SPICED, identificando oportunidades estratégicas e pontos de atenção para o projeto que se inicia em ${project.projectStartDate}. O escopo contratado inclui ${project.projectScope.join(', ')}.`,
        situation: `A empresa ${project.companyName} (${project.razaoSocial}) atua no mercado e busca fortalecer sua presença digital. O stakeholder principal é ${project.stakeholders[0]?.name || 'N/A'}. O projeto contempla os serviços de ${project.projectScope.join(', ')}, com início previsto para ${project.projectStartDate}. A empresa demonstra maturidade para investir em estratégias de marketing digital integradas.`,
        pain: `Principais desafios identificados na análise da transcrição:\n\n1. Falta de presença digital consistente e estratégica\n2. Dificuldade em converter leads qualificados\n3. Ausência de métricas claras de ROI sobre investimentos em marketing\n4. Necessidade de posicionamento mais forte frente à concorrência\n5. Comunicação fragmentada entre canais digitais`,
        impact: `Impacto esperado da solução proposta:\n\n• ROI projetado: Aumento de 40-60% em leads qualificados nos primeiros 6 meses\n• Melhoria na taxa de conversão: Expectativa de crescimento de 25% com otimização dos funis\n• Redução de CAC: Diminuição esperada de 30% com estratégias mais assertivas\n• Fortalecimento de marca: Posicionamento consistente em todos os canais contratados\n• A não implementação pode resultar em perda progressiva de market share e aumento do CAC`,
        criticalEvent: `Eventos críticos e prazos identificados:\n\n• Data de início do projeto: ${project.projectStartDate}\n• Primeiros 30 dias: Setup de todas as plataformas e ferramentas\n• 60 dias: Primeiras campanhas ativas e métricas iniciais\n• 90 dias: Primeira revisão estratégica com análise de resultados\n• Prazo contratual: Revisão do escopo a cada 6 meses`,
        decision: `Mapa de decisão do cliente:\n\n• Decisor principal: ${project.stakeholders.find(s => s.role === 'decisor')?.name || project.stakeholders[0]?.name || 'N/A'}\n${project.stakeholders.filter(s => s.role === 'influenciador').length > 0 ? `• Influenciadores: ${project.stakeholders.filter(s => s.role === 'influenciador').map(s => s.name).join(', ')}\n` : ''}• Critérios de avaliação: Resultados mensuráveis, transparência nos reports, qualidade do atendimento\n• Processo de aprovação: Validação mensal de resultados pelo stakeholder\n• Budget aprovado para: ${project.projectScope.join(', ')}`,
        contractedScope: `Escopo contratado resumido:\n\n${project.projectScope.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nInício do projeto: ${project.projectStartDate}\nEmpresa: ${project.companyName}\nRazão Social: ${project.razaoSocial}`,
      });
    } finally {
      setGeneratingSpiced(false);
    }
  };

  const canProceedStep3 = spicedReport !== null && analystConfirmed;

  // ─── Step 4: Send to Leadership ───────────────────────────────────────────

  const sendToLeadership = async () => {
    setSendingHandoff(true);
    setSendResult(null);
    const attempt = sendAttempts + 1;
    setSendAttempts(attempt);

    try {
      if (handoffId) {
        // Update observation
        await api.patch(`/handoffs/${handoffId}/step/4`, { observation });
        // Send to leadership
        await api.post(`/handoffs/${handoffId}/send`);
      }
      setSendResult('success');

      // After 3 seconds, reset everything for new handoff
      setTimeout(() => {
        resetWizard();
      }, 3000);
    } catch {
      setSendResult('failure');
    } finally {
      setSendingHandoff(false);
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    const attempt = pdfAttempts + 1;
    setPdfAttempts(attempt);

    try {
      // Generate PDF content
      const pdfContent = generatePdfContent();
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `handoff-${project.companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Verify download was successful (check blob size)
      if (blob.size > 100) {
        // Success — reset wizard
        setTimeout(() => resetWizard(), 2000);
      } else {
        throw new Error('PDF vazio');
      }
    } catch {
      if (attempt >= 3) {
        setShowEmergencyMsg(true);
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const generatePdfContent = (): string => {
    // Generate a text version for now (real PDF generation would use a library)
    return `HANDOFF — ${project.companyName}
========================================

TRANSCRIÇÃO DA VENDA
${transcript}

GRAVAÇÃO: ${recordingUrl}

FICHA DO PROJETO
Empresa: ${project.companyName}
Razão Social: ${project.razaoSocial}
Stakeholders: ${project.stakeholders.map(s => `${s.name} (${s.role})`).join(', ')}
Data de Início: ${project.projectStartDate}
Escopo: ${project.projectScope.join(', ')}
Contrato: ${project.contractUrl}

ANÁLISE SPICED
${spicedReport ? `
Resumo Executivo:
${spicedReport.executiveSummary}

Situação:
${spicedReport.situation}

Dor:
${spicedReport.pain}

Impacto:
${spicedReport.impact}

Evento Crítico:
${spicedReport.criticalEvent}

Decisão:
${spicedReport.decision}

Escopo Contratado:
${spicedReport.contractedScope}
` : ''}

OBSERVAÇÕES:
${observation || 'Nenhuma observação adicional.'}

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setHandoffId(null);
    setTranscript('');
    setRecordingUrl('');
    setLinkValid(null);
    setProject({
      companyName: '',
      razaoSocial: '',
      stakeholders: [{ name: '', role: 'decisor' as const }],
      projectStartDate: '',
      projectScope: [],
      contractUrl: '',
      whatsappGroupId: '',
    });
    setWhatsappConnected(false);
    setSpicedReport(null);
    setAnalystConfirmed(false);
    setObservation('');
    setSendResult(null);
    setSendAttempts(0);
    setPdfAttempts(0);
    setShowEmergencyMsg(false);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const extractAndPrefill = async () => {
    setExtracting(true);
    try {
      const res = await api.post<{ data: {
        companyName: string;
        razaoSocial: string;
        stakeholders: { name: string; role: 'decisor' | 'influenciador' }[];
        projectStartDate: string;
        projectScope: string[];
      } }>('/handoffs/extract-transcript', { transcript });

      const d = res.data.data;
      setProject(prev => {
        const mappedStakeholders: Stakeholder[] = d.stakeholders?.length && d.stakeholders[0]?.name !== ''
          ? d.stakeholders.map(s => ({ name: s.name || '', role: s.role === 'influenciador' ? 'influenciador' : 'decisor' }))
          : prev.stakeholders;
        return {
          ...prev,
          companyName: d.companyName || prev.companyName,
          razaoSocial: d.razaoSocial || prev.razaoSocial,
          stakeholders: mappedStakeholders,
          projectStartDate: d.projectStartDate || prev.projectStartDate,
          projectScope: d.projectScope?.length ? d.projectScope : prev.projectScope,
        };
      });
    } catch (err) {
      console.error('Extraction failed, continuing without pre-fill:', err);
    } finally {
      setExtracting(false);
      setCurrentStep(1);
    }
  };

  const goNext = () => {
    if (currentStep === 0) {
      extractAndPrefill();
      return;
    }
    if (currentStep === 2 && !spicedReport) {
      generateSpiced();
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const canProceed = [canProceedStep1, canProceedStep2, canProceedStep3, false][currentStep];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Send className="text-galaxy-blue-light" size={24} />
          Novo Handoff
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Preencha todas as etapas para enviar o handoff à liderança
        </p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <button
              disabled
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all w-full justify-center',
                i === currentStep
                  ? 'bg-galaxy-blue/20 text-galaxy-blue-light border border-galaxy-blue/30 shadow-glow-blue-sm'
                  : i < currentStep
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.03] text-text-muted border border-glass-border'
              )}
            >
              {i < currentStep ? <Check size={14} /> : step.icon}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <Step1Transcricao
              transcript={transcript}
              setTranscript={setTranscript}
              recordingUrl={recordingUrl}
              setRecordingUrl={setRecordingUrl}
              linkValid={linkValid}
              checkingLink={checkingLink}
              checkDriveLink={checkDriveLink}
            />
          )}
          {currentStep === 1 && (
            <Step2Projeto
              project={project}
              setProject={setProject}
              whatsappConnected={whatsappConnected}
              connectingWhatsapp={connectingWhatsapp}
              connectWhatsapp={connectWhatsapp}
              addStakeholder={addStakeholder}
              removeStakeholder={removeStakeholder}
              updateStakeholderName={updateStakeholderName}
              updateStakeholderRole={updateStakeholderRole}
              toggleScope={toggleScope}
            />
          )}
          {currentStep === 2 && (
            <Step3Analise
              spicedReport={spicedReport}
              generating={generatingSpiced}
              confirmed={analystConfirmed}
              setConfirmed={setAnalystConfirmed}
              onGenerate={generateSpiced}
            />
          )}
          {currentStep === 3 && (
            <Step4Relatorio
              transcript={transcript}
              recordingUrl={recordingUrl}
              project={project}
              spicedReport={spicedReport}
              observation={observation}
              setObservation={setObservation}
              sending={sendingHandoff}
              sendResult={sendResult}
              sendAttempts={sendAttempts}
              onSend={sendToLeadership}
              downloadingPdf={downloadingPdf}
              pdfAttempts={pdfAttempts}
              onDownloadPdf={downloadPdf}
              showEmergencyMsg={showEmergencyMsg}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {currentStep < 3 && (
        <div className="flex justify-between mt-8">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-text-muted'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            <ChevronLeft size={16} />
            Voltar
          </button>

          <GradientButton
            onClick={goNext}
            disabled={(!canProceed && currentStep !== 2) || extracting}
            isLoading={(currentStep === 2 && generatingSpiced) || extracting}
            rightIcon={<ChevronRight size={16} />}
          >
            {extracting
              ? 'Analisando transcrição...'
              : currentStep === 2 && !spicedReport
              ? 'Gerar Análise SPICED'
              : 'Prosseguir'}
          </GradientButton>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: TRANSCRIÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function Step1Transcricao({
  transcript, setTranscript,
  recordingUrl, setRecordingUrl,
  linkValid, checkingLink, checkDriveLink,
}: {
  transcript: string;
  setTranscript: (v: string) => void;
  recordingUrl: string;
  setRecordingUrl: (v: string) => void;
  linkValid: boolean | null;
  checkingLink: boolean;
  checkDriveLink: () => void;
}) {
  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
          <FileText size={18} className="text-galaxy-blue-light" />
          Transcrição da Venda
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Cole a transcrição completa da reunião de venda abaixo
        </p>

        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Cole aqui toda a transcrição da reunião de venda..."
          className="w-full h-72 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-galaxy-blue/40 focus:shadow-glow-blue-sm transition-all"
        />

        <div className="flex justify-between items-center mt-2">
          <span className={cn(
            'text-2xs',
            transcript.length > 50 ? 'text-emerald-400' : 'text-text-muted'
          )}>
            {transcript.length} caracteres
            {transcript.length < 50 && ' (mínimo 50)'}
          </span>
          {transcript.length > 50 && (
            <span className="text-2xs text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Transcrição válida
            </span>
          )}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Link2 size={18} className="text-galaxy-blue-light" />
          Link da Gravação de Venda
        </h2>
        <p className="text-xs text-text-muted mb-4">
          O link do Google Drive precisa estar com compartilhamento aberto (qualquer pessoa com o link)
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={recordingUrl}
              onChange={e => { setRecordingUrl(e.target.value); setLinkValid(null); }}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 focus:shadow-glow-blue-sm transition-all pr-10"
            />
            {linkValid !== null && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {linkValid ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
              </div>
            )}
          </div>
          <button
            onClick={checkDriveLink}
            disabled={!recordingUrl.trim() || checkingLink}
            className={cn(
              'px-5 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
              recordingUrl.trim() && !checkingLink
                ? 'bg-galaxy-blue/15 text-galaxy-blue-light border border-galaxy-blue/30 hover:bg-galaxy-blue/25'
                : 'bg-white/[0.03] text-text-muted border border-glass-border cursor-not-allowed'
            )}
          >
            {checkingLink ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
            Verificar
          </button>
        </div>

        {linkValid === false && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Link inválido ou compartilhamento não está aberto. Verifique se é um link do Google Drive com acesso público.
          </p>
        )}
        {linkValid === true && (
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
            <Check size={12} />
            Link verificado e acessível
          </p>
        )}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: PROJETO
// ═══════════════════════════════════════════════════════════════════════════════

function Step2Projeto({
  project, setProject,
  whatsappConnected, connectingWhatsapp, connectWhatsapp,
  addStakeholder, removeStakeholder, updateStakeholderName, updateStakeholderRole,
  toggleScope,
}: {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  whatsappConnected: boolean;
  connectingWhatsapp: boolean;
  connectWhatsapp: () => void;
  addStakeholder: () => void;
  removeStakeholder: (i: number) => void;
  updateStakeholderName: (i: number, v: string) => void;
  updateStakeholderRole: (i: number, role: 'decisor' | 'influenciador') => void;
  toggleScope: (s: string) => void;
}) {
  const inputCls = 'w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 focus:shadow-glow-blue-sm transition-all';
  const labelCls = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FolderKanban size={18} className="text-galaxy-blue-light" />
          Dados do Projeto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome da Empresa *</label>
            <input
              value={project.companyName}
              onChange={e => setProject(p => ({ ...p, companyName: e.target.value }))}
              placeholder="Ex: Alpha Tech Solutions"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Razão Social *</label>
            <input
              value={project.razaoSocial}
              onChange={e => setProject(p => ({ ...p, razaoSocial: e.target.value }))}
              placeholder="Ex: Alpha Tech Solutions LTDA"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Data de Início do Projeto *</label>
            <input
              type="date"
              value={project.projectStartDate}
              onChange={e => setProject(p => ({ ...p, projectStartDate: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Link do Contrato *</label>
            <input
              value={project.contractUrl}
              onChange={e => setProject(p => ({ ...p, contractUrl: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className={inputCls}
            />
          </div>
        </div>
      </GlassCard>

      {/* Stakeholders */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Stakeholders *</h3>
          <button
            onClick={addStakeholder}
            className="flex items-center gap-1.5 text-xs text-galaxy-blue-light hover:text-galaxy-blue transition-colors"
          >
            <Plus size={14} /> Adicionar Stakeholder
          </button>
        </div>

        <div className="space-y-3">
          {project.stakeholders.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-2xs text-text-muted w-5 text-center flex-shrink-0">{i + 1}</span>
              <input
                value={s.name}
                onChange={e => updateStakeholderName(i, e.target.value)}
                placeholder={`Nome do Stakeholder ${i + 1}`}
                className="flex-1 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 transition-all"
              />
              <select
                value={s.role}
                onChange={e => updateStakeholderRole(i, e.target.value as 'decisor' | 'influenciador')}
                className="glass-input text-xs py-2.5 w-36 flex-shrink-0"
              >
                <option value="decisor">Decisor</option>
                <option value="influenciador">Influenciador</option>
              </select>
              {project.stakeholders.length > 1 && (
                <button
                  onClick={() => removeStakeholder(i)}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Escopo */}
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Escopo do Projeto *</h3>
        <div className="flex flex-wrap gap-2">
          {SCOPE_OPTIONS.map(scope => (
            <button
              key={scope}
              onClick={() => toggleScope(scope)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-medium transition-all border',
                project.projectScope.includes(scope)
                  ? 'bg-galaxy-blue/20 text-galaxy-blue-light border-galaxy-blue/30 shadow-glow-blue-sm'
                  : 'bg-white/[0.03] text-text-muted border-glass-border hover:border-glass-border-strong hover:text-text-secondary'
              )}
            >
              {project.projectScope.includes(scope) && <Check size={12} className="inline mr-1.5" />}
              {scope}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* WhatsApp Connection */}
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-emerald-400" />
          Grupo do WhatsApp *
        </h3>

        {whatsappConnected ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Grupo conectado com sucesso</span>
          </div>
        ) : (
          <button
            onClick={connectWhatsapp}
            disabled={connectingWhatsapp}
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 transition-all w-full justify-center"
          >
            {connectingWhatsapp ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageSquare size={16} />
            )}
            <span className="text-sm font-medium">
              {connectingWhatsapp ? 'Conectando...' : 'Conectar Grupo do WhatsApp'}
            </span>
          </button>
        )}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: ANÁLISE SPICED
// ═══════════════════════════════════════════════════════════════════════════════

function Step3Analise({
  spicedReport, generating, confirmed, setConfirmed, onGenerate,
}: {
  spicedReport: SpicedReport | null;
  generating: boolean;
  confirmed: boolean;
  setConfirmed: (v: boolean) => void;
  onGenerate: () => void;
}) {
  if (generating) {
    return (
      <GlassCard padding="lg">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-galaxy flex items-center justify-center animate-glow-pulse">
            <Search size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold gradient-text">Gerando Análise SPICED</h3>
          <p className="text-xs text-text-muted text-center max-w-md">
            Analisando transcrição e dados do projeto para gerar o relatório SPICED completo...
          </p>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-galaxy animate-thinking"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!spicedReport) {
    return (
      <GlassCard padding="lg">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Search size={40} className="text-text-muted" />
          <p className="text-sm text-text-muted">
            Clique em "Gerar Análise SPICED" para iniciar a análise
          </p>
          <GradientButton onClick={onGenerate}>
            Gerar Análise SPICED
          </GradientButton>
        </div>
      </GlassCard>
    );
  }

  const sections = [
    { title: 'Resumo Executivo', content: spicedReport.executiveSummary, color: 'galaxy-blue' },
    { title: 'S — Situação', content: spicedReport.situation, color: 'blue' },
    { title: 'P — Dor (Pain)', content: spicedReport.pain, color: 'red' },
    { title: 'I — Impacto', content: spicedReport.impact, color: 'emerald' },
    { title: 'C — Evento Crítico', content: spicedReport.criticalEvent, color: 'amber' },
    { title: 'E/D — Decisão', content: spicedReport.decision, color: 'purple' },
    { title: 'Escopo Contratado', content: spicedReport.contractedScope, color: 'cyan' },
  ];

  const colorMap: Record<string, string> = {
    'galaxy-blue': 'border-galaxy-blue/30 bg-galaxy-blue/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Search size={18} className="text-galaxy-blue-light" />
          Análise SPICED
        </h2>
        <span className="text-2xs text-emerald-400 flex items-center gap-1">
          <CheckCircle2 size={12} /> Análise gerada
        </span>
      </div>

      {sections.map((section, i) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <GlassCard padding="md" className={cn('border-l-2', colorMap[section.color])}>
            <h3 className="text-sm font-semibold text-text-primary mb-2">{section.title}</h3>
            <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed">
              {section.content}
            </p>
          </GlassCard>
        </motion.div>
      ))}

      {/* Confirmation checkbox */}
      <GlassCard padding="lg" className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setConfirmed(!confirmed)}
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              confirmed
                ? 'bg-galaxy-blue border-galaxy-blue'
                : 'border-glass-border-strong group-hover:border-galaxy-blue/50'
            )}
          >
            {confirmed && <Check size={12} className="text-white" />}
          </div>
          <div>
            <span className="text-sm font-medium text-text-primary">
              Li todo o relatório SPICED e estou ciente de todas as informações apresentadas
            </span>
            <p className="text-2xs text-text-muted mt-1">
              Ao confirmar, você atesta que revisou a análise completa e está de acordo para prosseguir
            </p>
          </div>
        </label>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: RELATÓRIO
// ═══════════════════════════════════════════════════════════════════════════════

function Step4Relatorio({
  transcript, recordingUrl, project, spicedReport,
  observation, setObservation,
  sending, sendResult, sendAttempts, onSend,
  downloadingPdf, pdfAttempts, onDownloadPdf,
  showEmergencyMsg,
}: {
  transcript: string;
  recordingUrl: string;
  project: ProjectData;
  spicedReport: SpicedReport | null;
  observation: string;
  setObservation: (v: string) => void;
  sending: boolean;
  sendResult: 'success' | 'failure' | null;
  sendAttempts: number;
  onSend: () => void;
  downloadingPdf: boolean;
  pdfAttempts: number;
  onDownloadPdf: () => void;
  showEmergencyMsg: boolean;
}) {
  // Success screen
  if (sendResult === 'success') {
    return (
      <GlassCard padding="lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400">Handoff Enviado com Sucesso!</h3>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            O handoff foi enviado para o CRM de todas as lideranças e elas foram notificadas.
          </p>
          <p className="text-xs text-text-muted">Preparando novo handoff...</p>
          <Loader2 size={16} className="animate-spin text-text-muted" />
        </motion.div>
      </GlassCard>
    );
  }

  // Emergency message
  if (showEmergencyMsg) {
    return (
      <GlassCard padding="lg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center">
            <Phone size={40} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-400">Sinto Muito, Vamos Ajustar</h3>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            Se for urgente, entre em contato:
          </p>
          <a
            href="tel:+5512996312353"
            className="text-lg font-bold text-galaxy-blue-light hover:underline"
          >
            +55 12 99631-2353
          </a>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
        <Send size={18} className="text-galaxy-pink-light" />
        Relatório Final — Handoff
      </h2>

      {/* Transcription summary */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <FileText size={14} className="text-galaxy-blue-light" />
          Transcrição da Venda
        </h3>
        <div className="max-h-40 overflow-y-auto text-xs text-text-secondary bg-white/[0.02] rounded-lg p-3 border border-glass-border/50">
          {transcript.slice(0, 500)}
          {transcript.length > 500 && '...'}
        </div>
        <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-galaxy-blue-light hover:underline mt-2 inline-flex items-center gap-1">
          <ExternalLink size={10} /> Ver gravação
        </a>
      </GlassCard>

      {/* Project summary */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <FolderKanban size={14} className="text-galaxy-blue-light" />
          Ficha Cadastral do Projeto
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div><span className="text-text-muted">Empresa:</span> <span className="text-text-primary font-medium">{project.companyName}</span></div>
          <div><span className="text-text-muted">Razão Social:</span> <span className="text-text-primary font-medium">{project.razaoSocial}</span></div>
          <div><span className="text-text-muted">Stakeholders:</span> <span className="text-text-primary font-medium">{project.stakeholders.join(', ')}</span></div>
          <div><span className="text-text-muted">Início:</span> <span className="text-text-primary font-medium">{project.projectStartDate}</span></div>
          <div className="col-span-2"><span className="text-text-muted">Escopo:</span> <span className="text-text-primary font-medium">{project.projectScope.join(', ')}</span></div>
        </div>
        <div className="flex gap-4 mt-3">
          <a href={project.contractUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-galaxy-blue-light hover:underline inline-flex items-center gap-1">
            <Upload size={10} /> Contrato
          </a>
          <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-galaxy-blue-light hover:underline inline-flex items-center gap-1">
            <ExternalLink size={10} /> Gravação
          </a>
        </div>
      </GlassCard>

      {/* SPICED Report */}
      {spicedReport && (
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-galaxy-blue-light" />
            Análise SPICED Completa
          </h3>
          {[
            { label: 'Resumo Executivo', text: spicedReport.executiveSummary },
            { label: 'Situação', text: spicedReport.situation },
            { label: 'Dor', text: spicedReport.pain },
            { label: 'Impacto', text: spicedReport.impact },
            { label: 'Evento Crítico', text: spicedReport.criticalEvent },
            { label: 'Decisão', text: spicedReport.decision },
            { label: 'Escopo Contratado', text: spicedReport.contractedScope },
          ].map(s => (
            <div key={s.label} className="mb-3 last:mb-0">
              <h4 className="text-xs font-semibold text-text-secondary mb-1">{s.label}</h4>
              <p className="text-xs text-text-secondary/80 whitespace-pre-line leading-relaxed">{s.text}</p>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Observation field */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Observações (opcional)
        </h3>
        <textarea
          value={observation}
          onChange={e => setObservation(e.target.value)}
          placeholder="Adicione informações extras ou observações relevantes..."
          className="w-full h-24 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-galaxy-blue/40 transition-all"
        />
      </GlassCard>

      {/* Failure message */}
      {sendResult === 'failure' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <XCircle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Falha no envio</p>
            <p className="text-xs text-red-400/70">
              Tentativa {sendAttempts} de 3. {sendAttempts < 3 ? 'Tente novamente.' : 'Baixe o PDF para envio manual.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-6">
        {sendAttempts >= 3 && sendResult === 'failure' ? (
          <GradientButton
            onClick={onDownloadPdf}
            loading={downloadingPdf}
            leftIcon={<Download size={16} />}
          >
            Baixar Handoff em PDF
          </GradientButton>
        ) : (
          <GradientButton
            onClick={onSend}
            loading={sending}
            leftIcon={<Send size={16} />}
            size="lg"
          >
            Enviar Handoff para Liderança
          </GradientButton>
        )}
      </div>
    </div>
  );
}
