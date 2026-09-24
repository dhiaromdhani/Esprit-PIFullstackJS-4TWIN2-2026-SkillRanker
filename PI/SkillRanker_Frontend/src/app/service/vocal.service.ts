import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VocalService {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, lang: string = 'en-US') {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }
}