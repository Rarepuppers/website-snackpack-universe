import { expect, it, vi } from 'vitest';
import { WebAudioSynth } from '../../dev/src/game/audio/WebAudioSynth';

// Audit reproducer: production class, instrumented AudioContext; no listening claim.
it('records existing voice gain after master zero and disabled sound', () => {
  const gains: any[] = [];
  const gain = () => {
    const node = { gain: { value: 1, setValueAtTime(v: number) {this.value=v;}, exponentialRampToValueAtTime: vi.fn() }, connect:vi.fn(),disconnect:vi.fn() };
    gains.push(node); return node;
  };
  const source = {connect:vi.fn(),start:vi.fn(),addEventListener:vi.fn(),disconnect:vi.fn()};
  const context = {state:'running',currentTime:0,destination:{},createGain:gain,createBufferSource:()=>source};
  const synth = new WebAudioSynth(true) as any;
  synth.context=context;
  synth.productionLoadStarted=true;
  synth.productionBuffers.set('s3:player-damage-a', {});
  synth.productionBuffers.set('s3:player-damage-b', {});
  synth.play({id:'player-hit',volume:0.14,frequencyHz:180,durationSeconds:0.22,oscillator:'square'});
  expect(source.start).toHaveBeenCalledOnce();
  const before=gains[0].gain.value;
  synth.setVolume(0);
  synth.enabled=false;
  const after=gains[0].gain.value;
  console.log(JSON.stringify({before,after,enabled:synth.enabled,outputVolume:synth.outputVolume}));
  // This passing assertion demonstrates the defect; it is NOT desired acceptance.
  expect(before).toBe(0.72);
  expect(after).toBe(before);
});
