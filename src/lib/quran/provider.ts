export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
  audio?: string;
  surah?: Surah;
}

export interface Reciter {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_QURAN_API_URL || 'https://api.alquran.cloud/v1';

export class QuranProvider {
  static async getSurahs(): Promise<Surah[]> {
    const response = await fetch(`${API_BASE_URL}/surah`);
    const data = await response.json();
    return data.data;
  }

  static async getSurah(number: number, edition: string = 'quran-uthmani'): Promise<{ surah: Surah, ayahs: Ayah[] }> {
    const response = await fetch(`${API_BASE_URL}/surah/${number}/${edition}`);
    const data = await response.json();
    const ayahs = data.data.ayahs;
    const surah = { ...data.data };
    delete surah.ayahs;
    return { surah, ayahs };
  }

  static async getReciters(): Promise<Reciter[]> {
    const response = await fetch(`${API_BASE_URL}/edition?format=audio&language=ar`);
    const data = await response.json();
    return data.data;
  }

  static async getAyahAudio(surah: number, ayah: number, reciter: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/ayah/${surah}:${ayah}/${reciter}`);
    const data = await response.json();
    return data.data.audio;
  }

  static async getTafsir(surah: number, ayah: number): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/ayah/${surah}:${ayah}/ar.muyassar`);
    const data = await response.json();
    return data.data.text;
  }
}
