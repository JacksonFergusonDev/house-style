import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountCast } from '../js/cast.js';

globalThis.window = { matchMedia: () => ({ matches: false }) };

function recording() {
  return { dataset: { asciinema: '/demo.cast' } };
}

test('first play waits for a real preview instead of clearing a timed poster', async () => {
  let finishPreview;
  const preview = new Promise(resolve => { finishPreview = resolve; });
  const calls = [];
  const element = recording();
  const player = mountCast((src, screen, options) => {
    assert.equal(src, '/demo.cast');
    assert.equal(screen, element);
    assert.equal('poster' in options, false);
    assert.equal(options.preload, true);
    return {
      seek: time => { calls.push(['seek', time]); return preview; },
      play: async () => { calls.push(['play']); return true; },
    };
  }, element);
  const playing = player.play();
  assert.deepEqual(calls, [['seek', 0.1]]);
  finishPreview();
  assert.equal(await playing, true);
  await player.play();
  assert.deepEqual(calls, [['seek', 0.1], ['play'], ['play']]);
  assert.equal(mountCast(() => assert.fail('mounted twice'), element), undefined);
});

test('reduced motion keeps the real preview paused and disables looping', async () => {
  let plays = 0;
  mountCast((src, element, options) => {
    assert.equal(options.loop, false);
    return { seek: async time => assert.equal(time, 0.1), play: async () => { plays++; } };
  }, recording(), { loop: false });
  await Promise.resolve();
  assert.equal(plays, 0);
});

test('explicit posters and autoplay remain under the caller’s control', () => {
  for (const overrides of [{ poster: 'data:text/plain,preview' }, { autoPlay: true }]) {
    mountCast((src, element, options) => {
      assert.equal(options.poster, overrides.poster ?? 'npt:0:00.1');
      return { seek: () => assert.fail('unexpected seek'), play: () => assert.fail('unexpected play') };
    }, recording(), overrides);
  }
});
