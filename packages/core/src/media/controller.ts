import { persist } from 'zustand/middleware';
import create, { StoreApi } from 'zustand/vanilla';

import { ClientStorage } from '../storage';

const DEFAULT_SEEK_TIME = 5000; // milliseconds which the media will skip when seeking with arrows/buttons
export const DEFAULT_VOLUME_LEVEL = 0.2; // 0-1 for how loud the audio is

export const DEFAULT_AUTOHIDE_TIME = 3000; // milliseconds to wait before hiding controls

export type DeviceInformation = {
  isMobile: boolean;
  isIos: boolean;
  isAndroid: boolean;
};

export type MediaSizing = {
  container?: ElementSize;
  media?: ElementSize;
};

export type ElementSize = {
  width: number;
  height: number;
};

export type MediaControllerState<TElement = void> = {
  /** If the media has loaded and can be played */
  canPlay: boolean;
  /** If the controls are currently hidden */
  hidden: boolean;
  /** The last time that the media was interacted with */
  _lastInteraction: number;

  /** Current volume of the media */
  volume: number;
  /** If media is muted */
  muted: boolean;
  /** If media supports changing the volume */
  isVolumeChangeSupported: boolean;

  /** If the media is current playing or paused */
  playing: boolean;
  /** If the media has been played yet */
  hasPlayed: boolean;
  /** If the media is fullscreen */
  fullscreen: boolean;

  /** The playback rate for the media */
  playbackRate: number;

  /** If the media has an error */
  error?: string;
  /** If the media is currently waiting for data */
  waiting: boolean;
  /** If the media is currently stalled */
  stalled: boolean;
  /** If the media is currently loading */
  loading: boolean;

  /** If the media is in picture in picture mode */
  pictureInPicture: boolean;

  /** The last time that play/pause was requested */
  _requestedPlayPauseLastTime: number;

  /** The last time that fullscreen was changed */
  _requestedFullscreenLastTime: number;

  /** The last time that picture in picture was changed*/
  _requestedPictureInPictureLastTime: number;

  /** The last time that airplay was requested */
  _requestedAirPlayLastTime: number;

  /** If the content is live media */
  live: boolean;

  /** Current progress of the media */
  progress: number;
  /** Current total duration of the media */
  duration: number;

  /** Current buffered end time for the media */
  buffered: number;

  /** Internal value when a user requests an update to the progress of the media */
  _requestedRangeToSeekTo: number;

  /** Internal element used for playing media */
  _element: TElement | null;

  /** Media sizing information */
  size?: MediaSizing;

  /** Device tracking set on load of the media */
  device: DeviceInformation;

  setHidden: (hidden: boolean) => void;
  _updateLastInteraction: () => void;

  onCanPlay: () => void;

  onPlay: () => void;
  onPause: () => void;
  togglePlay: (force?: boolean) => void;

  onProgress: (time: number) => void;
  onDurationChange: (duration: number) => void;

  _updateBuffered: (buffered: number) => void;

  requestSeek: (time: number) => void;

  requestSeekBack: (difference?: number) => void;
  requestSeekForward: (difference?: number) => void;
  _requestSeekDiff: (difference: number) => void;

  setLive: (fullscreen: boolean) => void;

  setSize: (size: MediaSizing) => void;

  setFullscreen: (fullscreen: boolean) => void;
  setPictureInPicture: (pictureInPicture: boolean) => void;
  requestToggleFullscreen: () => void;
  requestTogglePictureInPicture: () => void;
  requestAirPlay: () => void;
  _setVolume: (volume: number) => void;
  requestVolume: (volume: number) => void;
  requestToggleMute: () => void;
  setIsVolumeChangeSupported: (supported: boolean) => void;

  setWaiting: (waiting: boolean) => void;
  setError: (error: string) => void;
  setStalled: (stalled: boolean) => void;
  setLoading: (stalled: boolean) => void;
};

export type MediaControllerStore<TElement> = StoreApi<
  MediaControllerState<TElement>
>;

const getFilteredNaN = (value: number | undefined | null) =>
  value && !isNaN(value) && isFinite(value) ? value : 0;

const getBoundedSeek = (seek: number, duration: number | undefined) =>
  Math.min(
    Math.max(0, getFilteredNaN(seek)),
    // seek to near the end
    getFilteredNaN(duration) ? getFilteredNaN(duration) - 0.01 : 0,
  );

const getBoundedVolume = (volume: number) =>
  Math.min(Math.max(0, getFilteredNaN(volume)), 1);

export const createControllerStore = <TElement>({
  element,
  device,
  storage,
  opts,
}: {
  element: TElement | null;
  device: DeviceInformation;
  storage: ClientStorage;
  opts: ControlsOptions;
}) => {
  const store = create<
    MediaControllerState<TElement>,
    [['zustand/persist', Partial<MediaControllerState<TElement>>]]
  >(
    persist(
      (set, get) => ({
        _element: element,

        canPlay: false,
        hidden: false,
        live: false,

        hasPlayed: false,
        playing: false,
        fullscreen: false,
        pictureInPicture: false,

        waiting: false,
        stalled: false,
        loading: false,
        playbackRate: 1,

        device,

        progress: 0,
        duration: 0,

        buffered: 0,

        volume: getBoundedVolume(opts?.defaultVolume ?? DEFAULT_VOLUME_LEVEL),
        muted: true,
        isVolumeChangeSupported: false,

        _lastInteraction: Date.now(),

        _requestedRangeToSeekTo: 0,
        _requestedFullscreenLastTime: Date.now(),
        _requestedPictureInPictureLastTime: Date.now(),
        _requestedAirPlayLastTime: Date.now(),
        _requestedPlayPauseLastTime: Date.now(),

        setHidden: (hidden: boolean) =>
          set(({ playing }) => ({ hidden: playing ? hidden : false })),
        _updateLastInteraction: () =>
          set(() => ({ _lastInteraction: Date.now() })),

        onCanPlay: () =>
          set(() => ({
            canPlay: true,
            loading: false,
          })),

        onPlay: () =>
          set(() => ({
            playing: true,
            hasPlayed: true,
            stalled: false,
            waiting: false,
          })),
        onPause: () =>
          set(() => ({
            playing: false,
            hidden: false,
            // TODO check if these should be getting set when pause event is fired (this was pulled from metrics)
            stalled: false,
            waiting: false,
          })),
        togglePlay: (force?: boolean) => {
          const { hidden, setHidden, device } = store.getState();
          if (!force && hidden && device.isMobile) {
            setHidden(false);
          } else {
            set(() => ({
              _requestedPlayPauseLastTime: Date.now(),
              _lastInteraction: Date.now(),
            }));
          }
        },
        onProgress: (time) => set(() => ({ progress: getFilteredNaN(time) })),
        requestSeek: (time) =>
          set(({ duration }) => ({
            _requestedRangeToSeekTo: getBoundedSeek(time, duration),
            progress: getBoundedSeek(time, duration),
          })),

        onDurationChange: (duration) =>
          set(({ live }) => ({
            duration,
            live: duration === Number.POSITIVE_INFINITY ? true : live,
          })),

        _updateBuffered: (buffered) => set(() => ({ buffered })),

        _requestSeekDiff: (difference) =>
          set(({ progress, duration }) => ({
            _requestedRangeToSeekTo: getBoundedSeek(
              getFilteredNaN(progress) + difference / 1000,
              duration,
            ),
          })),
        requestSeekBack: (difference = DEFAULT_SEEK_TIME) =>
          get()._requestSeekDiff(-difference),
        requestSeekForward: (difference = DEFAULT_SEEK_TIME) =>
          get()._requestSeekDiff(difference),

        setSize: (size: MediaSizing) => set(() => ({ size })),
        setWaiting: (waiting: boolean) => set(() => ({ waiting })),
        setError: (error: string) => set(() => ({ error })),
        setStalled: (stalled: boolean) => set(() => ({ stalled })),
        setLoading: (loading: boolean) => set(() => ({ loading })),

        setFullscreen: (fullscreen: boolean) => set(() => ({ fullscreen })),
        requestToggleFullscreen: () =>
          set(() => ({
            _requestedFullscreenLastTime: Date.now(),
          })),

        setPictureInPicture: (pictureInPicture: boolean) =>
          set(() => ({ pictureInPicture })),
        requestTogglePictureInPicture: () =>
          set(() => ({
            _requestedPictureInPictureLastTime: Date.now(),
          })),
        requestAirPlay: () =>
          set(() => ({
            _requestedAirPlayLastTime: Date.now(),
          })),

        setLive: (live: boolean) => set(() => ({ live })),

        requestVolume: (newVolume) =>
          set(({ volume }) => ({
            volume: newVolume === 0 ? volume : getBoundedVolume(newVolume),
            muted: newVolume === 0,
          })),
        _setVolume: (newVolume) =>
          set(() => ({
            volume: getBoundedVolume(newVolume),
          })),

        requestToggleMute: () =>
          set(({ muted }) => ({
            muted: !muted,
          })),

        setIsVolumeChangeSupported: (supported) =>
          set(() => ({
            isVolumeChangeSupported: supported,
          })),
      }),
      {
        name: 'livepeer-player',
        version: 1,
        // since these values are persisted across media, only persist volume and playbackRate
        partialize: ({ volume, playbackRate }) => ({
          volume,
          playbackRate,
        }),
        getStorage: () => storage,
      },
    ),
  );

  return store;
};

export type ControlsOptions = {
  /** Auto-hide controls after a set amount of time (in milliseconds). Defaults to 3000. Set to 0 for no hiding. */
  autohide?: number;
  /** Sets the default volume. Must be between 0 and 1. */
  defaultVolume?: number;
};
