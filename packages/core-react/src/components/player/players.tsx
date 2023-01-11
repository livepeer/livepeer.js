import { AudioSrc, ControlsOptions, HlsSrc, VideoSrc } from '@livepeer/core';

import { PlayerObjectFit, PlayerProps } from './Player';

export type HlsPlayerProps<TElement, TPoster> = {
  src: HlsSrc;
  objectFit: PlayerObjectFit;
  width?: string | number;
  autoPlay?: boolean;
  loop?: boolean;
  title?: string;
  muted?: boolean;
  priority?: boolean;
  poster?: PlayerProps<TElement, TPoster>['poster'];
  jwt?: string;
  options?: ControlsOptions;
  onMetricsError?: (error: Error) => void;
};

export type AudioPlayerProps<TElement, TPoster> = Omit<
  HlsPlayerProps<TElement, TPoster>,
  'src' | 'poster'
> & {
  src: AudioSrc[];
};

export type VideoPlayerProps<TElement, TPoster> = Omit<
  HlsPlayerProps<TElement, TPoster>,
  'src'
> & {
  src: VideoSrc[] | null;
};
