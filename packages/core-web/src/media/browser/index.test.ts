import { expect, it } from 'vitest';

// eslint-disable-next-line import/namespace
import * as Exports from '.';

it('should expose correct exports', () => {
  expect(Object.keys(Exports).sort()).toMatchInlineSnapshot(`
    [
      "addEventListeners",
      "addMediaMetrics",
      "addMediaMetricsToInitializedStore",
      "canPlayMediaNatively",
      "getDeviceInfo",
      "isAirPlaySupported",
      "isPictureInPictureSupported",
    ]
  `);
});
