import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface EvaluationNotification {
  id: string;
  employeeId?: string;
  employeeEmail?: string;
  employeeName?: string;
  activityTitle?: string;
  note: number;
  comment?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationNotificationService {
  private readonly storageKey = 'skillranker_evaluation_notifications';

  private messagesSubject = new BehaviorSubject<EvaluationNotification[]>(this.getAllMessages());
  messages$ = this.messagesSubject.asObservable();

  createMessage(payload: Omit<EvaluationNotification, 'id' | 'read' | 'createdAt'>): EvaluationNotification {
    const messages = this.getAllMessages();

    const newMessage: EvaluationNotification = {
      ...payload,
      id: this.generateId(),
      read: false,
      createdAt: new Date().toISOString()
    };

    messages.unshift(newMessage);
    this.saveAllMessages(messages);

    return newMessage;
  }

  getMessagesForEmployee(identifiers: string[]): EvaluationNotification[] {
    const cleanIdentifiers = identifiers
      .filter(Boolean)
      .map(value => this.normalize(value));

    return this.getAllMessages()
      .filter(message => {
        const employeeId = this.normalize(message.employeeId || '');
        const employeeEmail = this.normalize(message.employeeEmail || '');

        return cleanIdentifiers.includes(employeeId) || cleanIdentifiers.includes(employeeEmail);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markAsRead(messageId: string): void {
    const messages = this.getAllMessages().map(message => {
      if (message.id === messageId) {
        return {
          ...message,
          read: true
        };
      }

      return message;
    });

    this.saveAllMessages(messages);
  }

  private getAllMessages(): EvaluationNotification[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAllMessages(messages: EvaluationNotification[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(messages));
    this.messagesSubject.next(messages);
  }

  private normalize(value: string): string {
    return String(value || '').trim().toLowerCase();
  }

  private generateId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}