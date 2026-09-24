import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VocalService } from '../service/vocal.service';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';

// ─── Speech Recognition Browser Types ────────────────────────────────────────

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface BrowserSpeechRecognitionConstructor {
  new(): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

// ─── Domain Interfaces ────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant';

export interface EmployeeResult {
  id: number;
  csvEmployeeId?: number | null;
  employeeId?: string | null;
  userId?: string | null;
  email?: string;
  name: string;
  jobTitle: string;
  current_skills: string;
  score: number;
  missing_skills: string[];
}

export interface AnalyzeResponse {
  activityId?: string;
  activity?: {
    _id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    seats: number;
    requiredSkills: any[];
  };
  target_skills: string[];
  target_roles: string[];
  ai_justification: string;
  requested_count: number;
  returned_count: number;
  ocr_used?: boolean;
  ocr_error?: string | null;
  employees: EmployeeResult[];
  requirement_summary?: string;
  skill_analysis?: string;
  recommendation_summary?: string;
}

interface SuggestionsResponse {
  prompt: string;
  suggestions: string[];
}

interface ChatApiResponse {
  reply: string;
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  analysis?: AnalyzeResponse;
}

export interface HistoryEntry {
  id: number;
  title: string;
  summary: string;
  messageCount: number;
  savedAt: string;
  messages: ChatMessage[];
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-chatboat-recommondation',
  templateUrl: './chatboat-recommondation.component.html',
  styleUrls: ['./chatboat-recommondation.component.css'],
})
export class ChatboatRecommondationComponent {
  private readonly flaskApiBase = 'http://127.0.0.1:5000';
  private readonly backendApiBase = 'https://chowder-snooze-mutt.ngrok-free.dev/api';

  private readonly historyStorageKey = 'abt-ia-history';
  private readonly maxDocumentChars = 12000;
  private readonly maxHistoryEntries = 10;
  private readonly maxConversationHistory = 8;

  readonly modelV2Hint =
    'Model v2 (matching employés + activité Mongo existante + confirmation RH standard)';

  get flaskApiBaseUrl(): string {
    return this.flaskApiBase;
  }

  @ViewChild('promptTextarea') private promptTextarea?: ElementRef<HTMLTextAreaElement>;

  activityId = '';
  promptInput = '';
  isLoading = false;
  historySearchTerm = '';
  promptSuggestions: string[] = [];
  suggestedPrompt = '';
  autoCompletions: string[] = [];
  selectedCompletionIndex = 0;
  suggestionLoading = false;

  voiceSupported = false;
  isListening = false;
  voiceLanguage = 'fr-FR';
  liveTranscript = '';
  voiceError = '';
  voiceStatusText = 'Micro pret';
  voiceStatusTone: 'muted' | 'listening' | 'warn' | 'error' = 'muted';
  voiceEventLog: string[] = [];

  selectedDocumentName = '';
  selectedDocumentContent = '';
  selectedDocumentBase64 = '';
  selectedDocumentMime = '';
  documentError = '';

  historyEntries: HistoryEntry[] = [];

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Bonjour, je suis votre Chatbot. Je peux discuter avec vous, répondre à vos questions, ou recommander des employés pour une activité déjà créée dans MongoDB.',
    },
  ];

  confirmingMap: Record<number, boolean> = {};
  confirmedMap: Record<number, boolean> = {};
  confirmMsgMap: Record<number, string> = {};
  confirmErrMap: Record<number, string> = {};

  private recognition: BrowserSpeechRecognition | null = null;
  private transcriptBase = '';
  private hasFinalVoiceChunk = false;
  private receivedVoiceResult = false;
  private voiceRestartPending = false;
  private voiceStopRequested = false;
  private suggestionTimer: ReturnType<typeof setTimeout> | null = null;
  private nextHistoryId = 1;

  constructor(
    private readonly http: HttpClient,
    private readonly ngZone: NgZone,
    public readonly vocalService: VocalService,
    private readonly auth: AuthService,
    private readonly notifService: NotificationService,
    private readonly route: ActivatedRoute
  ) {
    this.activityId = this.route.snapshot.queryParamMap.get('activityId') || '';
    this.loadHistoryFromStorage();
    this.initializeVoiceRecognition();

    if (!this.voiceSupported) {
      this.voiceError =
        'La reconnaissance vocale n est pas supportee par ce navigateur. Utilisez Chrome ou Edge.';
      this.setVoiceStatus('Reconnaissance vocale indisponible', 'error');
    }
  }

  get showProfileLink(): boolean {
    const r = this.normalizeRole(this.auth.getRole());
    return r === 'MANAGER' || r === 'HR_MANAGER' || r === 'ADMINISTRATOR';
  }

  get showChatConfirmButton(): boolean {
    const r = this.normalizeRole(this.auth.getRole());
    return r === 'HR_MANAGER' || r === 'ADMINISTRATOR';
  }

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private normalizeRole(role: string | null | undefined): string {
    return String(role ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  get filteredHistoryEntries(): HistoryEntry[] {
    const query = this.historySearchTerm.trim().toLowerCase();
    if (!query) {
      return this.historyEntries;
    }

    return this.historyEntries.filter((entry) => {
      const haystack = [entry.title, entry.summary, entry.savedAt, String(entry.messageCount)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  confirmAnalysis(analysis: AnalyzeResponse, msgIndex: number): void {
    if (this.confirmingMap[msgIndex] || this.confirmedMap[msgIndex]) return;

    const effectiveActivityId = analysis.activityId || this.activityId;
    if (!effectiveActivityId) {
      this.confirmErrMap[msgIndex] =
        "❌ Aucune activité liée. Ouvre ce chat depuis une activité RH ou laisse le chat retrouver l'activité existante.";
      return;
    }

    this.confirmingMap[msgIndex] = true;
    this.confirmMsgMap[msgIndex] = '';
    this.confirmErrMap[msgIndex] = '';

    const sourcePrompt =
      this.messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === 'user')?.content || '';

    this.notifService.confirmRecommendations({
      activityId: effectiveActivityId,
      prompt: sourcePrompt
    }).subscribe({
      next: (res: any) => {
        this.confirmingMap[msgIndex] = false;
        this.confirmedMap[msgIndex] = true;

        const sent = res.sent ?? 0;
        const total = res.total ?? 0;

        this.confirmMsgMap[msgIndex] =
          `✅ ${sent}/${total} employé(s) notifié(s) — email + dashboard envoyés.`;
      },
      error: (err: any) => {
        this.confirmingMap[msgIndex] = false;
        this.confirmErrMap[msgIndex] =
          err?.error?.message || '❌ Erreur lors de la confirmation.';
      }
    });
  }

  startNewAnalysis(): void {
    if (this.isListening) {
      this.stopVoiceInput();
    }
    this.archiveCurrentConversation();
    this.resetCurrentConversation();
  }

  restoreHistory(entry: HistoryEntry): void {
    if (!entry?.messages?.length) {
      return;
    }
    this.messages = entry.messages.map((message) => ({
      role: message.role,
      content: message.content,
      analysis: message.analysis ? JSON.parse(JSON.stringify(message.analysis)) : undefined,
    }));
  }

  async sendPrompt(): Promise<void> {
    const prompt = this.promptInput.trim();
    const hasDocumentAttachment = this.hasAttachedDocument();
    const hasDocumentPayload = this.hasAttachedDocumentPayload();

    if ((!prompt && !hasDocumentAttachment) || this.isLoading) {
      return;
    }

    if (hasDocumentAttachment && !hasDocumentPayload) {
      this.messages.push({
        role: 'assistant',
        content:
          'Le document joint est vide ou illisible. Ajoutez du texte dans le fichier, utilisez une image lisible, ou saisissez un prompt.',
      });
      return;
    }

    const documentLabel = this.selectedDocumentName.trim();
    const userMessage = prompt
      ? hasDocumentAttachment && documentLabel
        ? `${prompt}\n[Document joint: ${documentLabel}]`
        : prompt
      : `Analyse du document: ${documentLabel || 'fichier joint'}`;

    this.messages.push({ role: 'user', content: userMessage });
    this.promptInput = '';
    this.promptSuggestions = [];
    this.suggestedPrompt = '';
    this.autoCompletions = [];
    this.clearSuggestionTimer();
    this.isLoading = true;

    try {
      const shouldAnalyze = this.shouldRunAnalysis(prompt, hasDocumentPayload);

      if (shouldAnalyze) {
        const finalPrompt =
          prompt ||
          `Analyse le besoin et propose les employés recommandés pour l'activité concernée.`;

        const analysis = await this.analyzePrompt(finalPrompt, hasDocumentPayload);
        this.messages.push({
          role: 'assistant',
          content: analysis.activity?.title
            ? `Activité trouvée: ${analysis.activity.title}. J'ai identifié ${analysis.target_skills.length} compétence(s) cible(s) et ${analysis.target_roles.length} rôle(s) cible(s).`
            : `J'ai identifié ${analysis.target_skills.length} compétence(s) cible(s) et ${analysis.target_roles.length} rôle(s) cible(s).`,
          analysis,
        });
      } else {
        const reply = await this.chatWithAssistant(prompt);
        this.messages.push({ role: 'assistant', content: reply });
      }
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.messages.push({
        role: 'assistant',
        content: `Impossible de traiter la demande: ${message}`,
      });
    } finally {
      this.clearAttachedDocument();
      this.isLoading = false;
    }
  }

  async optimizeOnly(): Promise<void> {
    const prompt = this.promptInput.trim();
    if (!prompt || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      const optimizedPrompt = await this.optimizePrompt(prompt);
      this.promptInput = optimizedPrompt;
      this.onPromptInputChange(optimizedPrompt);
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.messages.push({
        role: 'assistant',
        content: `L'optimisation du prompt a échoué: ${errorMessage}`,
      });
    } finally {
      this.isLoading = false;
    }
  }

  private async optimizePrompt(prompt: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ optimized_prompt: string; error?: string }>(
        `${this.flaskApiBase}/optimize-prompt`,
        { prompt }
      )
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.optimized_prompt;
  }

  onPromptInputChange(value: string): void {
    const normalized = value.toLowerCase();
    const normalization = this.normalizeSkillTypos(value);
    const currentSuggestions: string[] = [...normalization.hints];
    const rewritten = normalization.rewritten;

    const hasCount = /\b(top\s*\d+|\d+\s*(employees?|employes?|candidats?|profils?))\b/i.test(
      rewritten.toLowerCase(),
    );
    if (!hasCount && normalized.trim().length > 10) {
      currentSuggestions.push('Ajoutez un nombre exact, par exemple: "top 10 employees".');
    }

    this.promptSuggestions = currentSuggestions.slice(0, 4);
    this.suggestedPrompt = rewritten.trim() !== value.trim() ? rewritten : '';
    this.autoCompletions = this.buildAutoCompletions(value, this.suggestedPrompt);
    this.selectedCompletionIndex = 0;

    this.clearSuggestionTimer();

    const sourcePrompt = (this.suggestedPrompt || value).trim();
    if (sourcePrompt.length < 3) {
      return;
    }

    this.suggestionTimer = setTimeout(() => {
      void this.fetchBackendSuggestions(sourcePrompt);
    }, 250);
  }

  onPromptKeyDown(event: KeyboardEvent): void {
    if (this.autoCompletions.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedCompletionIndex =
        (this.selectedCompletionIndex + 1) % this.autoCompletions.length;
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedCompletionIndex =
        (this.selectedCompletionIndex - 1 + this.autoCompletions.length) %
        this.autoCompletions.length;
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.applyCompletion(this.autoCompletions[this.selectedCompletionIndex]);
    }
  }

  applyCompletion(completion: string): void {
    this.promptInput = completion;
    this.onPromptInputChange(completion);
  }

  toggleVoiceInput(): void {
    if (!this.voiceSupported || !this.recognition) {
      this.voiceError =
        'La reconnaissance vocale n est pas supportee par ce navigateur. Utilisez Chrome ou Edge.';
      this.setVoiceStatus('Reconnaissance vocale indisponible', 'error');
      return;
    }
    if (this.isListening) {
      this.stopVoiceInput();
      return;
    }
    this.voiceError = '';
    this.liveTranscript = '';
    this.hasFinalVoiceChunk = false;
    this.receivedVoiceResult = false;
    this.voiceRestartPending = false;
    this.voiceStopRequested = false;
    this.transcriptBase = this.promptInput.trim();
    this.recognition.lang = this.voiceLanguage;
    this.focusPromptTextarea();
    this.recordVoiceEvent('Demarrage de la reconnaissance vocale');
    this.setVoiceStatus('Ecoute en cours', 'listening');
    try {
      this.recognition.start();
      this.isListening = true;
    } catch {
      this.voiceError = 'Impossible de demarrer la reconnaissance vocale.';
      this.isListening = false;
      this.setVoiceStatus('Demarrage impossible', 'error');
      this.recordVoiceEvent('Erreur au demarrage de la reconnaissance vocale');
    }
  }

  stopVoiceInput(): void {
    if (this.recognition && this.isListening) {
      this.voiceStopRequested = true;
      this.voiceRestartPending = false;
      this.recordVoiceEvent('Arret manuel demande');
      this.setVoiceStatus('Arret en cours', 'warn');
      this.finalizeVoiceTranscript();
      this.recognition.stop();
    }
  }

  onVoiceLanguageChange(value: string): void {
    this.voiceLanguage = value;
    if (this.recognition && !this.isListening) {
      this.recognition.lang = this.voiceLanguage;
    }
  }

  speakMessage(content: string): void {
    this.vocalService.speak(content, this.voiceLanguage);
  }

  triggerDocumentPicker(input: HTMLInputElement): void {
    if (this.isLoading) {
      return;
    }
    input.click();
  }

  async onDocumentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.documentError = '';

    const supportedTypes = [
      'text/plain', 'text/csv', 'application/json',
      'image/png', 'image/jpeg', 'image/webp', 'image/tiff',
    ];
    const supportedExtensions = [
      '.txt', '.csv', '.json', '.md', '.log',
      '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff',
    ];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'];
    const loweredName = file.name.toLowerCase();
    const hasSupportedExtension = supportedExtensions.some((ext) => loweredName.endsWith(ext));
    const hasSupportedType = supportedTypes.includes(file.type) || file.type.startsWith('text/');
    const isImageFile =
      file.type.startsWith('image/') ||
      imageExtensions.some((ext) => loweredName.endsWith(ext));

    if (!hasSupportedType && !hasSupportedExtension) {
      this.clearAttachedDocument();
      this.documentError = 'Format non supporte. Utilisez TXT, CSV, JSON, MD, LOG ou image.';
      input.value = '';
      return;
    }

    try {
      this.selectedDocumentName = file.name;
      this.selectedDocumentMime = isImageFile
        ? file.type || 'image/*'
        : file.type || 'text/plain';

      if (isImageFile) {
        this.selectedDocumentBase64 = await this.readFileAsDataUrl(file);
        this.selectedDocumentContent = '';
        this.documentError = 'Image detectee: OCR sera utilise pendant l analyse.';
      } else {
        const content = await this.readFileAsText(file);
        const trimmed = content.trim();
        if (!trimmed) {
          this.selectedDocumentBase64 = '';
          this.selectedDocumentContent = '';
          this.documentError =
            'Document texte vide. Ajoutez du texte dans le prompt ou dans le fichier.';
          input.value = '';
          return;
        }
        this.selectedDocumentBase64 = '';
        this.selectedDocumentContent = trimmed.slice(0, this.maxDocumentChars);
        if (trimmed.length > this.maxDocumentChars) {
          this.documentError = `Document tronque a ${this.maxDocumentChars} caracteres pour l'analyse.`;
        }
      }
    } catch {
      this.clearAttachedDocument();
      this.documentError = 'Impossible de lire le document.';
    } finally {
      input.value = '';
    }
  }

  clearAttachedDocument(): void {
    this.selectedDocumentName = '';
    this.selectedDocumentContent = '';
    this.selectedDocumentBase64 = '';
    this.selectedDocumentMime = '';
    this.documentError = '';
  }

  trackByHistoryId(_index: number, entry: HistoryEntry): number {
    return entry.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByValue(_index: number, value: string): string {
    return value;
  }

  private archiveCurrentConversation(): void {
    const currentMessages = this.messages.filter((m) => m.content.trim().length > 0);
    const hasUserMessage = currentMessages.some((m) => m.role === 'user');
    if (!hasUserMessage) {
      return;
    }

    const firstUserMessage =
      currentMessages.find((m) => m.role === 'user')?.content.trim() || 'Discussion';
    const title =
      firstUserMessage.length > 48
        ? `${firstUserMessage.slice(0, 48).trim()}...`
        : firstUserMessage;
    const summarySource =
      currentMessages[currentMessages.length - 1]?.content?.trim() || firstUserMessage;
    const summary =
      summarySource.length > 80 ? `${summarySource.slice(0, 80).trim()}...` : summarySource;

    const entry: HistoryEntry = {
      id: this.nextHistoryId++,
      title,
      summary,
      messageCount: currentMessages.length,
      savedAt: new Date().toISOString(),
      messages: currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
        analysis: m.analysis ? JSON.parse(JSON.stringify(m.analysis)) : undefined,
      })),
    };

    this.historyEntries = [entry, ...this.historyEntries].slice(0, this.maxHistoryEntries);
    this.saveHistoryToStorage();
  }

  private resetCurrentConversation(): void {
    this.messages = [
      {
        role: 'assistant',
        content:
          'Bonjour, je suis votre Chatbot. Je peux discuter avec vous, répondre à vos questions, ou recommander des employés pour une activité déjà créée dans MongoDB.',
      },
    ];
    this.promptInput = '';
    this.promptSuggestions = [];
    this.suggestedPrompt = '';
    this.autoCompletions = [];
    this.selectedCompletionIndex = 0;
    this.suggestionLoading = false;
    this.voiceError = '';
    this.liveTranscript = '';
    this.isListening = false;
    this.transcriptBase = '';
    this.hasFinalVoiceChunk = false;
    this.clearAttachedDocument();
    this.documentError = '';
  }

  private loadHistoryFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.historyStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as HistoryEntry[];
      if (!Array.isArray(parsed)) {
        return;
      }
      this.historyEntries = parsed;
      this.nextHistoryId =
        parsed.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
    } catch {
      this.historyEntries = [];
    }
  }

  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem(this.historyStorageKey, JSON.stringify(this.historyEntries));
    } catch {
      // Ignore storage failures.
    }
  }

  private clearSuggestionTimer(): void {
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
      this.suggestionTimer = null;
    }
  }

  private normalizeSkillTypos(input: string): { rewritten: string; hints: string[] } {
    const typoRules: Array<{ pattern: RegExp; canonical: string; label: string }> = [
      { pattern: /\b(anglar|anguar|anguler|anuglar)\b/gi, canonical: 'angular', label: 'angular' },
      { pattern: /\b(pyhtone|pythone|pyhton)\b/gi, canonical: 'python', label: 'python' },
      {
        pattern: /\b(mach|machi|machin|machine\s*l|machine\s*leraning|machine\s*learnig|ml)\b/gi,
        canonical: 'machine learning',
        label: 'machine learning',
      },
      {
        pattern: /\b(data\s*scince|data\s*sience|data\s*scinece)\b/gi,
        canonical: 'data science',
        label: 'data science',
      },
      {
        pattern: /\b(kibernetes|kubernets|kuberntes|k8s)\b/gi,
        canonical: 'kubernetes',
        label: 'kubernetes',
      },
      { pattern: /\b(jva|jaav|jvaa|jafa)\b/gi, canonical: 'java', label: 'java' },
      { pattern: /\b(recat)\b/gi, canonical: 'react', label: 'react' },
      { pattern: /\b(nodjs|nodejs)\b/gi, canonical: 'node.js', label: 'node.js' },
      { pattern: /\b(dokcer|dockre)\b/gi, canonical: 'docker', label: 'docker' },
      { pattern: /\b(fronent)\b/gi, canonical: 'frontend', label: 'frontend' },
      { pattern: /\b(bakend)\b/gi, canonical: 'backend', label: 'backend' },
      { pattern: /\b(employes)\b/gi, canonical: 'employees', label: 'employees' },
    ];

    let rewritten = input;
    const hints: string[] = [];

    for (const rule of typoRules) {
      if (rule.pattern.test(rewritten)) {
        rewritten = rewritten.replace(rule.pattern, rule.canonical);
        hints.push(`Correction suggeree: ${rule.label} detecte et normalise.`);
      }
    }

    return { rewritten, hints: hints.slice(0, 4) };
  }

  private extractSkillIntents(text: string): string[] {
    const lower = text.toLowerCase();
    const patterns: Array<{ pattern: RegExp; skill: string }> = [
      { pattern: /\b(machine learning|mach|machi|machin|ml)\b/, skill: 'machine learning' },
      { pattern: /\b(data science|data scince|data sience)\b/, skill: 'data science' },
      { pattern: /\b(kubernetes|kibernetes|k8s|kubernets)\b/, skill: 'kubernetes' },
      { pattern: /\b(java|jva|jvaa|jafa)\b/, skill: 'java' },
      { pattern: /\b(python|pyhtone|pythone|pyhton)\b/, skill: 'python' },
      { pattern: /\b(angular|anglar|anguar|anguler)\b/, skill: 'angular' },
      { pattern: /\b(react|recat)\b/, skill: 'react' },
      { pattern: /\b(docker|dokcer|dockre)\b/, skill: 'docker' },
    ];

    const detected: string[] = [];
    for (const item of patterns) {
      if (item.pattern.test(lower) && !detected.includes(item.skill)) {
        detected.push(item.skill);
      }
    }
    return detected;
  }

  private defaultRoleForSkill(skill: string): string {
    if (skill === 'machine learning' || skill === 'data science' || skill === 'python') {
      return 'data scientist';
    }
    if (skill === 'kubernetes' || skill === 'docker') return 'devops';
    if (skill === 'java') return 'backend';
    if (skill === 'angular' || skill === 'react') return 'frontend';
    return 'tech';
  }

  private buildAutoCompletions(rawInput: string, rewrittenInput: string): string[] {
  const base = (rewrittenInput || rawInput).trim();

  if (!base) {
    return [
      "Je veux 5 personnes pour l'activité francais",
      "Je veux 10 employees pour l'activité react",
      "Je veux 8 personnes pour l'activité devops",
    ];
  }

  const lower = base.toLowerCase();
  const result = new Set<string>();
  const count = this.detectCount(lower);

  result.add(`Je veux ${count} personnes pour l'activité ${base}`);
  result.add(`Je veux 5 personnes pour l'activité ${base}`);
  result.add(`Je veux 10 employees pour l'activité ${base}`);
  result.add(`Trouve ${count} personnes pour l'activité ${base}`);
  result.add(`Donne moi ${count} profils pour l'activité ${base}`);

  return Array.from(result).slice(0, 6);
}

  private async fetchBackendSuggestions(prompt: string): Promise<void> {
    this.suggestionLoading = true;
    try {
      const response = await firstValueFrom(
        this.http.post<SuggestionsResponse & { error?: string }>(
          `${this.flaskApiBase}/suggestions`,
          { prompt, limit: 6 },
        ),
      );
      if (response.error) {
        throw new Error(response.error);
      }
      if (Array.isArray(response.suggestions) && response.suggestions.length > 0) {
        const forcedSkills = this.extractSkillIntents(prompt);
        if (forcedSkills.length > 0) {
          const skillHint = forcedSkills.join(' et ');
          this.autoCompletions = response.suggestions
            .map((item) => {
              const lowerItem = item.toLowerCase();
              const containsSkill = forcedSkills.some((skill) => lowerItem.includes(skill));
              return containsSkill ? item : `${item} en ${skillHint}`;
            })
            .slice(0, 6);
        } else {
          this.autoCompletions = response.suggestions;
        }
        this.selectedCompletionIndex = 0;
      }
    } catch {
      // Keep local fallback suggestions if backend fails.
    } finally {
      this.suggestionLoading = false;
    }
  }

  private initializeVoiceRecognition(): void {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.voiceSupported = false;
      this.voiceError =
        'La reconnaissance vocale n est pas supportee par ce navigateur. Utilisez Chrome ou Edge.';
      return;
    }

    this.voiceSupported = true;
    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = this.voiceLanguage;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      this.ngZone.run(() => {
        this.receivedVoiceResult = true;
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript ?? '';
          const result = event.results[i] as unknown as { isFinal?: boolean };
          if (result.isFinal) {
            finalText += `${transcript} `;
          } else {
            interimText += `${transcript} `;
          }
        }

        if (finalText.trim()) {
          this.hasFinalVoiceChunk = true;
          const merged = `${this.transcriptBase} ${finalText}`.trim();
          this.transcriptBase = merged;
          this.promptInput = merged;
          this.onPromptInputChange(this.promptInput);
          this.syncPromptTextarea();
          this.focusPromptTextarea();
          this.recordVoiceEvent(`Resultat final recu: ${merged.slice(0, 80)}`);
        }

        this.liveTranscript = interimText.trim();
        if (this.liveTranscript) {
          this.promptInput = `${this.transcriptBase} ${this.liveTranscript}`.trim();
          this.onPromptInputChange(this.promptInput);
          this.syncPromptTextarea();
          this.focusPromptTextarea();
          this.recordVoiceEvent(`Transcription live: ${this.liveTranscript.slice(0, 80)}`);
        }

        if (!this.liveTranscript && !finalText.trim()) {
          this.recordVoiceEvent('Evenement vocal recu sans texte exploitable');
        }

        this.setVoiceStatus(
          this.isListening ? 'Ecoute en cours' : 'Transcription disponible',
          this.isListening ? 'listening' : 'muted',
        );
      });
    };

    this.recognition.onerror = (event) => {
      const shouldAttemptRestart =
        !this.voiceStopRequested &&
        this.isListening &&
        event.error !== 'not-allowed' &&
        event.error !== 'service-not-allowed';

      this.voiceRestartPending = shouldAttemptRestart;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.voiceError =
          'Micro refuse. Autorisez le microphone dans le navigateur puis reessayez.';
      } else if (event.error === 'no-speech') {
        this.voiceError = 'Aucune voix detectee. Parlez plus pres du micro.';
      } else if (event.error === 'audio-capture') {
        this.voiceError = 'Aucun micro detecte. Verifiez votre peripherique audio.';
      } else {
        this.voiceError = `Erreur microphone: ${event.error}`;
      }

      this.isListening = false;
      this.finalizeVoiceTranscript();
      this.recordVoiceEvent(`Erreur vocale: ${event.error}`);
      this.setVoiceStatus('Erreur microphone', 'error');

      if (shouldAttemptRestart) {
        this.restartVoiceRecognition();
      }
    };

    this.recognition.onend = () => {
      const shouldAttemptRestart =
        !this.voiceStopRequested && (this.isListening || this.voiceRestartPending);
      this.isListening = false;

      if (this.receivedVoiceResult) {
        this.finalizeVoiceTranscript();
        this.recordVoiceEvent('Reconnaissance vocale terminee');
        this.setVoiceStatus(
          shouldAttemptRestart ? 'Relance automatique' : 'Micro arrete',
          shouldAttemptRestart ? 'warn' : 'muted',
        );
      } else {
        this.liveTranscript = '';
        this.setVoiceStatus('Aucun texte recu du navigateur', 'error');
        this.voiceError =
          'Le navigateur a termine la reconnaissance sans fournir de transcription. Verifiez la langue, le micro et le navigateur.';
        this.recordVoiceEvent('Termine sans transcription');
      }

      if (shouldAttemptRestart) {
        this.restartVoiceRecognition();
      }
    };
  }

  private finalizeVoiceTranscript(): void {
    const merged = `${this.transcriptBase} ${this.liveTranscript}`.trim();
    if (merged && (!this.hasFinalVoiceChunk || this.liveTranscript.trim().length > 0)) {
      this.promptInput = merged;
    }
    this.liveTranscript = '';
    this.onPromptInputChange(this.promptInput);
    this.syncPromptTextarea();
    this.focusPromptTextarea();
  }

  private restartVoiceRecognition(): void {
    if (!this.recognition || !this.voiceSupported) {
      return;
    }
    this.voiceRestartPending = false;
    this.voiceStopRequested = false;
    this.hasFinalVoiceChunk = false;
    this.receivedVoiceResult = false;
    try {
      this.recognition.lang = this.voiceLanguage;
      this.recognition.start();
      this.isListening = true;
    } catch {
      this.voiceError = 'La reconnaissance vocale a coupee. Vous pouvez relancer le micro.';
      this.isListening = false;
    }
  }

  private setVoiceStatus(text: string, tone: 'muted' | 'listening' | 'warn' | 'error'): void {
    this.voiceStatusText = text;
    this.voiceStatusTone = tone;
  }

  private recordVoiceEvent(event: string): void {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.voiceEventLog = [`${timestamp} - ${event}`, ...this.voiceEventLog].slice(0, 5);
  }

  private focusPromptTextarea(): void {
    queueMicrotask(() => {
      this.promptTextarea?.nativeElement.focus();
    });
  }

  private syncPromptTextarea(): void {
    queueMicrotask(() => {
      const textarea = this.promptTextarea?.nativeElement;
      if (!textarea) {
        return;
      }
      textarea.value = this.promptInput;
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }

  private async analyzePrompt(prompt: string, hasDocumentPayload: boolean): Promise<AnalyzeResponse> {
    if (hasDocumentPayload) {
      const response = await firstValueFrom(
        this.http.post<AnalyzeResponse & { error?: string }>(
          `${this.flaskApiBase}/analyze`,
          {
            prompt,
            document_content: this.selectedDocumentContent,
            document_name: this.selectedDocumentName,
            document_base64: this.selectedDocumentBase64,
            document_mime: this.selectedDocumentMime,
            ocr_language: 'fra+eng',
          },
        ),
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response;
    }

    if (this.activityId) {
      return this.analyzeSelectedActivityById(this.activityId, prompt);
    }

    return this.analyzeExistingActivityFromChat(prompt);
  }

  private async analyzeSelectedActivityById(activityId: string, prompt: string): Promise<AnalyzeResponse> {
    const response = await firstValueFrom(
      this.http.post<any>(
        `${this.backendApiBase}/recommend/${activityId}`,
        { prompt },
        { headers: this.getAuthHeaders() }
      )
    );

    const recommendations = Array.isArray(response?.recommendations)
      ? response.recommendations
      : [];

    const employees: EmployeeResult[] = recommendations.map((r: any, index: number) => ({
      id: Number(r.csvEmployeeId || index + 1),
      csvEmployeeId: r.csvEmployeeId ?? null,
      employeeId: r.employeeId ?? null,
      userId: r.userId ?? null,
      email: r.email || '',
      name: r.name || 'Employé',
      jobTitle: r.jobTitle || '',
      current_skills: r.currentSkills || '',
      score: Number(r.score || 0),
      missing_skills: []
    }));

    return {
      activityId: response?.activity?._id || activityId,
      activity: response?.activity
        ? {
            _id: response.activity._id,
            title: response.activity.title,
            description: response.activity.description,
            type: response.activity.type,
            category: response.activity.category,
            seats: response.activity.seats,
            requiredSkills: response.activity.requiredSkills || []
          }
        : undefined,
      target_skills: response?.meta?.targetSkills || [],
      target_roles: response?.meta?.targetRoles || [],
      ai_justification: response?.meta?.modelJustification || '',
      requested_count: this.detectCount(prompt),
      returned_count: employees.length,
      employees,
      requirement_summary: response?.activity?.description || response?.activity?.title || '',
      skill_analysis: response?.meta?.targetSkills?.length
        ? `Compétences ciblées: ${response.meta.targetSkills.join(', ')}`
        : '',
      recommendation_summary: employees.length
        ? `${employees.length} profil(s) recommandés pour l'activité sélectionnée.`
        : 'Aucun profil recommandé.'
    };
  }

  private async analyzeExistingActivityFromChat(prompt: string): Promise<AnalyzeResponse> {
    const lookup = await firstValueFrom(
      this.http.post<any>(
        `${this.backendApiBase}/chat-recommendation/analyze-existing-activity`,
        { prompt },
        { headers: this.getAuthHeaders() }
      )
    );

    const foundActivityId = lookup?.activityId || lookup?.activity?._id;
    if (!foundActivityId) {
      throw new Error("Aucune activité existante trouvée dans MongoDB.");
    }

    return this.analyzeSelectedActivityById(foundActivityId, prompt);
  }

  private async chatWithAssistant(message: string): Promise<string> {
    const history = this.messages
      .slice(-this.maxConversationHistory)
      .map((e) => ({ role: e.role, content: e.content }));

    try {
      const response = await firstValueFrom(
        this.http.post<ChatApiResponse & { error?: string }>(
          `${this.flaskApiBase}/chat`,
          { message, history },
        ),
      );
      if (response.error) {
        throw new Error(response.error);
      }
      return response.reply;
    } catch {
      return this.buildLocalFallbackReply(message);
    }
  }

  private shouldRunAnalysis(prompt: string, hasDocument: boolean): boolean {
  if (hasDocument) {
    return true;
  }

  const text = this.normalizeIntentText(prompt);
  if (!text) {
    return false;
  }

  const countHint =
    /\btop\s*\d+\b/.test(text) ||
    /\b\d+\s*(employees?|employes?|profils?|candidats?|personne|personnes|people)\b/.test(text);

  const peopleHint =
    /(employee|employees|employe|employes|profil|profils|candidat|candidats|personne|personnes|people)/.test(text);

  const recommendationHint =
    /(recommande|recommend|selection|classement|ranking|shortlist|trouve|cherche|donne|affiche)/.test(text);

  const trainingHint =
    /(formation|upskill|skill|competence|activité|activite|cours|training)/.test(text);

  const shortPromptLooksLikeActivity =
    text.split(/\s+/).filter(Boolean).length <= 4 &&
    /\d/.test(text) &&
    !/(bonjour|salut|hello|hi|merci|comment|pourquoi|resume|traduction|comparaison)/.test(text);

  return (
    (countHint && (peopleHint || recommendationHint || trainingHint)) ||
    (peopleHint && (recommendationHint || trainingHint)) ||
    shortPromptLooksLikeActivity
  );
}

  private hasAttachedDocument(): boolean {
    return Boolean(
      this.selectedDocumentName.trim().length > 0 || this.hasAttachedDocumentPayload(),
    );
  }

  private hasAttachedDocumentPayload(): boolean {
    return Boolean(
      this.selectedDocumentContent.trim().length > 0 ||
      this.selectedDocumentBase64.trim().length > 0,
    );
  }

  private normalizeIntentText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private extractRole(text: string): string {
    if (text.includes('frontend')) return 'frontend';
    if (text.includes('backend')) return 'backend';
    if (text.includes('devops')) return 'devops';
    if (text.includes('data scientist')) return 'data scientist';
    if (text.includes('full stack')) return 'full stack';
    return 'tech';
  }

  private detectCount(text: string): number {
  const normalized = String(text || '').toLowerCase();

  const patterns = [
    /\btop\s*(\d{1,3})\b/i,
    /\bexactement\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\s*(employees?|employes?|profils?|candidats?|personne|personnes|people)\b/i,
    /\b(personne|personnes|people)\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\b/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const value = Number(match[1] || match[2]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return 10;
}

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsText(file);
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsDataURL(file);
    });
  }

  private buildLocalFallbackReply(message: string): string {
    const text = message.trim().toLowerCase();
    if (text.includes('docker')) {
      return [
        'Docker est une plateforme de conteneurisation.',
        'Elle permet de lancer une application avec ses dependances dans un conteneur portable et reproductible.',
        'Avantages: deploiement plus simple, meme comportement entre machine locale et serveur, isolation des services.',
      ].join('\n');
    }
    return 'Je peux discuter avec vous, mais le service conversationnel est temporairement indisponible. Reessayez dans quelques secondes ou posez une question plus precise.';
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as { error?: string; message?: string } | string | null;
      if (typeof apiError === 'string' && apiError.trim()) {
        return apiError;
      }
      if (apiError && typeof apiError === 'object') {
        if (apiError.error) return apiError.error;
        if (apiError.message) return apiError.message;
      }
      return `Erreur HTTP ${error.status || 0}`;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Erreur inconnue.';
  }
}