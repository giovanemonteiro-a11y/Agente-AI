import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  FileAudio,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useClient } from '@/hooks/useClient';
import { useMeetings, useUploadMeeting } from '@/hooks/useMeeting';
import type { Meeting, MeetingType, ProcessingStatus } from '@/types/meeting';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.m4a,.wav,.ogg,.webm,.mpeg,.mov,.avi,.mkv';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ─── Processing status badge ─────────────────────────────────────────────────

function ProcessingStatusBadge({ status }: { status: ProcessingStatus }) {
  if (status === 'completed') {
    return (
      <StatusBadge variant="success" label="Transcrito" dot={false} className="gap-1" />
    );
  }
  if (status === 'failed') {
    return (
      <StatusBadge variant="error" label="Falhou" dot={false} className="gap-1" />
    );
  }
  return (
    <StatusBadge variant="warning" label="Processando" dot={false} className="gap-1" />
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: MeetingType }) {
  if (type === 'kickoff') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold tracking-wider bg-galaxy-blue/20 text-galaxy-blue-light border border-galaxy-blue/30 uppercase">
        Kickoff
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25 uppercase">
      Check-in
    </span>
  );
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const hasTranscript = !!meeting.transcript_text;

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-galaxy-blue/10 border border-galaxy-blue/20 flex items-center justify-center">
              <Video size={16} className="text-galaxy-blue-light" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={meeting.type} />
                <ProcessingStatusBadge status={meeting.processing_status} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-secondary">
                <Calendar size={11} />
                <span>{formatDate(meeting.recorded_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        {meeting.participants && meeting.participants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
            <Users size={11} className="flex-shrink-0" />
            <span className="truncate">{meeting.participants.join(', ')}</span>
          </div>
        )}

        {/* Transcript toggle */}
        {hasTranscript && (
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-galaxy-blue-light hover:text-white transition-colors"
          >
            {transcriptOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {transcriptOpen ? 'Ocultar transcrição' : 'Ver transcrição'}
          </button>
        )}
      </div>

      {/* Collapsible transcript */}
      <AnimatePresence initial={false}>
        {transcriptOpen && meeting.transcript_text && (
          <motion.div
            key="transcript"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-glass-border mt-0 pt-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Transcrição
              </p>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {meeting.transcript_text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
}

function UploadZone({ onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center',
        isDragging
          ? 'border-galaxy-blue/60 bg-galaxy-blue/[0.08]'
          : 'border-galaxy-blue/30 hover:border-galaxy-blue/60 hover:bg-galaxy-blue/5',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      aria-label="Área de upload de gravação"
    >
      <div className="w-12 h-12 rounded-2xl bg-galaxy-blue/10 border border-galaxy-blue/20 flex items-center justify-center">
        <Upload size={22} className="text-galaxy-blue-light" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">
          Arraste um arquivo ou <span className="text-galaxy-blue-light underline">clique para selecionar</span>
        </p>
        <p className="text-xs text-text-secondary mt-1">
          MP3, MP4, M4A, WAV, OGG, WEBM — até 100 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Upload panel ─────────────────────────────────────────────────────────────

interface UploadPanelProps {
  clientId: string;
}

function UploadPanel({ clientId }: UploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType>('checkin');
  const [participantsInput, setParticipantsInput] = useState('');
  const uploadMutation = useUploadMeeting(clientId);

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const participants = participantsInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    await uploadMutation.mutateAsync({
      file: selectedFile,
      type: meetingType,
      participants,
    });

    setSelectedFile(null);
    setParticipantsInput('');
  };

  return (
    <GlassCard variant="strong" padding="lg" className="space-y-5">
      <h2 className="text-base font-semibold text-text-primary">Enviar Gravação</h2>

      {/* File zone */}
      {selectedFile ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-galaxy-blue/[0.08] border border-galaxy-blue/20">
          <FileAudio size={20} className="text-galaxy-blue-light flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{selectedFile.name}</p>
            <p className="text-xs text-text-secondary">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-text-muted hover:text-text-secondary transition-colors text-xs"
          >
            Remover
          </button>
        </div>
      ) : (
        <UploadZone onFile={setSelectedFile} />
      )}

      {/* Meeting type selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Tipo de reunião
        </label>
        <div className="flex gap-2">
          {(['kickoff', 'checkin'] as MeetingType[]).map((t) => (
            <button
              key={t}
              onClick={() => setMeetingType(t)}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                meetingType === t
                  ? 'bg-galaxy-blue/20 border-galaxy-blue/50 text-galaxy-blue-light'
                  : 'bg-transparent border-glass-border text-text-secondary hover:border-galaxy-blue/30 hover:text-text-primary',
              ].join(' ')}
            >
              {t === 'kickoff' ? 'Kickoff' : 'Check-in'}
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Participantes <span className="font-normal normal-case">(separados por vírgula)</span>
        </label>
        <input
          type="text"
          placeholder="ex: João Silva, Maria Costa"
          value={participantsInput}
          onChange={(e) => setParticipantsInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-galaxy-blue/50 focus:ring-1 focus:ring-galaxy-blue/30 transition"
        />
      </div>

      {/* Error */}
      {uploadMutation.isError && (
        <p className="text-xs text-red-400">
          Falha no upload. Tente novamente.
        </p>
      )}

      {/* Submit */}
      <GradientButton
        onClick={handleSubmit}
        disabled={!selectedFile}
        isLoading={uploadMutation.isPending}
        leftIcon={<Upload size={15} />}
        className="w-full"
      >
        {uploadMutation.isPending ? 'Enviando…' : 'Enviar e Transcrever'}
      </GradientButton>
    </GlassCard>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyMeetings() {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
      <Video size={36} className="text-text-muted mb-4" />
      <h3 className="text-base font-semibold text-text-primary mb-1">Nenhuma reunião ainda</h3>
      <p className="text-sm text-text-secondary max-w-xs">
        Envie a gravação de um kickoff ou check-in para iniciar a transcrição automática.
      </p>
    </GlassCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MeetingsPage() {
  const { selectedClientId } = useClient();
  const { data: meetings, isLoading, isError } = useMeetings(selectedClientId ?? undefined);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <PageHeader
        title="Reuniões"
        subtitle="Gravações, transcrições e highlights de reuniões"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upload panel — left/top column */}
        <div className="lg:col-span-1">
          {selectedClientId ? (
            <UploadPanel clientId={selectedClientId} />
          ) : (
            <GlassCard padding="lg" className="text-center">
              <p className="text-sm text-text-secondary">Selecione um cliente para fazer upload.</p>
            </GlassCard>
          )}
        </div>

        {/* Timeline — right/main column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Histórico de Reuniões
          </h2>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {isError && (
            <GlassCard className="text-center py-10">
              <p className="text-sm text-red-400">Falha ao carregar reuniões.</p>
            </GlassCard>
          )}

          {!isLoading && !isError && (!meetings || meetings.length === 0) && (
            <EmptyMeetings />
          )}

          {!isLoading && !isError && meetings && meetings.length > 0 && (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {meetings.map((meeting) => (
                <motion.div
                  key={meeting.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                  }}
                >
                  <MeetingCard meeting={meeting} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
