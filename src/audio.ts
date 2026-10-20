import * as Tone from 'tone';
import { AllAnomyStats } from './types';
import { INSTRUMENT_DEFINITIONS } from './constants';

export type PlayableInstrument = Tone.PolySynth | Tone.Sampler;

export function createAnomyInstrument(anomyId: string, statsMap: AllAnomyStats): Tone.PolySynth {
  const stats = statsMap[anomyId] || { softness: 0, echo: 0, brightness: 0 };
  const softnessRate = stats.softness / 100;
  const echoRate = stats.echo / 100;
  const brightnessRate = stats.brightness / 100;

  const oscType: 'sine' | 'triangle' | 'square' =
    softnessRate >= 0.7 ? 'sine' : softnessRate >= 0.35 ? 'triangle' : 'square';

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscType },
    envelope: {
      attack: 0.01 + softnessRate * 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.1 + softnessRate * 0.4,
    },
  });

  const filter = new Tone.Filter(1000 + brightnessRate * 4000, 'lowpass');
  const reverb = new Tone.Reverb({
    decay: Math.max(0.1, 0.2 + echoRate * 3),
    wet: echoRate * 0.4,
  });

  synth.connect(filter);
  filter.connect(reverb);
  reverb.toDestination();
  return synth;
}

export async function createInstrumentFromSelection(
  selectedValue: string | null,
  statsMap: AllAnomyStats
): Promise<PlayableInstrument | null> {
  if (!selectedValue) return null;
  if (selectedValue.startsWith('anomy_')) {
    return createAnomyInstrument(selectedValue, statsMap);
  }

  const def = INSTRUMENT_DEFINITIONS[selectedValue];
  if (def?.type === 'sample') {
    const sampler = new Tone.Sampler({
      urls: { C4: def.file },
    }).toDestination();
    await Tone.loaded();
    return sampler;
  }
  return null;
}
