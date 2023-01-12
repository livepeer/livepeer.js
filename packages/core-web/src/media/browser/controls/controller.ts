import {
  ControlsOptions as ControlsOptionsBase,
  DEFAULT_AUTOHIDE_TIME,
  DEFAULT_VOLUME_LEVEL,
  MediaControllerState,
  MediaControllerStore,
} from '@livepeer/core/media';
import { StoreApi } from 'zustand/vanilla';

import { requestAirPlay } from './airplay';
import {
  addFullscreenEventListener,
  enterFullscreen,
  exitFullscreen,
  isCurrentlyFullscreen,
} from './fullscreen';
import {
  addEnterPictureInPictureEventListener,
  addExitPictureInPictureEventListener,
  enterPictureInPicture,
  exitPictureInPicture,
  isCurrentlyPictureInPicture,
} from './pictureInPicture';

const MEDIA_CONTROLLER_INITIALIZED_ATTRIBUTE = 'data-controller-initialized';

const allKeyTriggers = [
  'KeyF',
  'KeyK',
  'KeyM',
  'KeyI',
  'Space',
  'ArrowRight',
  'ArrowLeft',
] as const;
type KeyTrigger = typeof allKeyTriggers[number];

// if volume change is unsupported, the element will always return 1
// similar to https://github.com/videojs/video.js/pull/7514/files
const getIsVolumeChangeSupported = <TElement extends HTMLMediaElement>(
  element: TElement,
) => {
  return new Promise<boolean>((resolve) => {
    const prevVolume = element?.volume ?? DEFAULT_VOLUME_LEVEL;

    const newVolume = prevVolume - 0.01;

    // set new value and test
    element.volume = newVolume;

    window.setTimeout(() => {
      const isSupported = element.volume !== 1;

      // reset to old value
      element.volume = prevVolume;

      resolve(isSupported);
    });
  });
};

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export type ControlsOptions = ControlsOptionsBase & {
  /** If hotkeys should be enabled on the media element (arrows to seek, etc) */
  hotkeys?: boolean;
};

export const addEventListeners = <TElement extends HTMLMediaElement>(
  store: MediaControllerStore<TElement>,
  { hotkeys = true, autohide = DEFAULT_AUTOHIDE_TIME }: ControlsOptions = {},
) => {
  const element = store?.getState()?._element;

  const initializedState = store.getState();

  // restore the persisted values from store
  if (element && !element.muted && !element.defaultMuted) {
    element.volume = initializedState.volume;
  }

  store.setState({ muted: element?.muted });

  const onCanPlay = () => store.getState().onCanPlay();

  const onPlay = () => {
    store.getState().onPlay();
  };
  const onPause = () => {
    store.getState().onPause();
  };

  const onDurationChange = () =>
    store.getState().onDurationChange(element?.duration ?? 0);

  const onKeyUp = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const code = e.code as KeyTrigger;

    store.getState()._updateLastInteraction();

    if (allKeyTriggers.includes(code)) {
      if (code === 'Space' || code === 'KeyK') {
        store.getState().togglePlay();
      } else if (code === 'KeyF') {
        store.getState().requestToggleFullscreen();
      } else if (code === 'KeyI') {
        store.getState().requestTogglePictureInPicture();
      } else if (code === 'ArrowRight') {
        store.getState().requestSeekForward();
      } else if (code === 'ArrowLeft') {
        store.getState().requestSeekBack();
      } else if (code === 'KeyM') {
        store.getState().requestToggleMute();
      }
    }
  };

  const onMouseEnter = () => {
    store.getState()._updateLastInteraction();
  };
  const onMouseLeave = () => {
    if (autohide) {
      store.getState().setHidden(true);
    }
  };
  const onMouseMove = async () => {
    store.getState()._updateLastInteraction();
  };

  const onTouchUpdate = async () => {
    store.getState()._updateLastInteraction();
  };

  const onVolumeChange = () => {
    if (
      typeof element?.volume !== 'undefined' &&
      element?.volume !== store.getState().volume
    ) {
      store.getState()._setVolume(element.volume);
    }
  };

  const onTimeUpdate = () => {
    store.getState().onProgress(element?.currentTime ?? 0);

    if (element && (element?.duration ?? 0) > 0) {
      const currentTime = element.currentTime;

      const buffered = [...Array(element.buffered.length)].reduce(
        (prev, _curr, i) => {
          const start = element.buffered.start(element.buffered.length - 1 - i);
          const end = element.buffered.end(element.buffered.length - 1 - i);

          // if the TimeRange covers the current time, then use this value
          if (start <= currentTime && end >= currentTime) {
            return end;
          }

          return prev;
        },
        // default to no buffering
        0,
      );

      store.getState()._updateBuffered(buffered);
    }
  };

  let retryCount = 0;

  const onError = async (e: ErrorEvent) => {
    store.getState().setError(e.message);
    await new Promise((r) => setTimeout(r, 1000 * ++retryCount));
    element?.load();
  };

  const onWaiting = async () => {
    store.getState().setWaiting(true);
  };

  const onStalled = async () => {
    store.getState().setStalled(true);
  };

  const onLoadStart = async () => {
    store.getState().setLoading(true);
  };

  const onResize = async () => {
    store.getState().setSize({
      ...((element as unknown as HTMLVideoElement)?.videoHeight &&
      (element as unknown as HTMLVideoElement)?.videoWidth
        ? {
            media: {
              height: (element as unknown as HTMLVideoElement).videoHeight,
              width: (element as unknown as HTMLVideoElement).videoWidth,
            },
          }
        : {}),
      ...(element?.clientHeight && element?.clientWidth
        ? {
            container: {
              height: element.clientHeight,
              width: element.clientWidth,
            },
          }
        : {}),
    });
  };

  if (element) {
    onResize();
  }

  if (element) {
    element.addEventListener('volumechange', onVolumeChange);

    element.addEventListener('canplay', onCanPlay);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);
    element.addEventListener('durationchange', onDurationChange);
    element.addEventListener('timeupdate', onTimeUpdate);
    element.addEventListener('error', onError);
    element.addEventListener('waiting', onWaiting);
    element.addEventListener('stalled', onStalled);
    element.addEventListener('loadstart', onLoadStart);
    element.addEventListener('resize', onResize);

    const parentElementOrElement = element?.parentElement ?? element;

    if (hotkeys) {
      parentElementOrElement.addEventListener('keyup', onKeyUp);
    }
    if (autohide) {
      parentElementOrElement.addEventListener('mouseenter', onMouseEnter);
      parentElementOrElement.addEventListener('mouseleave', onMouseLeave);
      parentElementOrElement.addEventListener('mousemove', onMouseMove);

      parentElementOrElement.addEventListener('touchstart', onTouchUpdate);
      parentElementOrElement.addEventListener('touchend', onTouchUpdate);
      parentElementOrElement.addEventListener('touchmove', onTouchUpdate);
    }

    element.load();

    getIsVolumeChangeSupported(element).then((isVolumeChangeSupported) =>
      store.getState().setIsVolumeChangeSupported(isVolumeChangeSupported),
    );

    element.setAttribute(MEDIA_CONTROLLER_INITIALIZED_ATTRIBUTE, 'true');
  }

  const onFullscreenChange = () => {
    store.getState().setFullscreen(isCurrentlyFullscreen(element));
  };

  const onEnterPictureInPicture = () => {
    store.getState().setPictureInPicture(true);
  };
  const onExitPictureInPicture = () => {
    store.getState().setPictureInPicture(false);
  };

  // add effects
  const removeEffectsFromStore = addEffectsToStore(store, element, {
    autohide,
  });

  // add fullscreen listener
  const removeFullscreenListener = addFullscreenEventListener(
    element,
    onFullscreenChange,
  );

  // add picture in picture listeners
  const removeEnterPictureInPictureListener =
    addEnterPictureInPictureEventListener(element, onEnterPictureInPicture);
  const removeExitPictureInPictureListener =
    addExitPictureInPictureEventListener(element, onExitPictureInPicture);

  return {
    destroy: () => {
      removeFullscreenListener?.();

      removeEnterPictureInPictureListener?.();
      removeExitPictureInPictureListener?.();

      element?.removeEventListener?.('volumechange', onVolumeChange);
      element?.removeEventListener?.('canplay', onCanPlay);
      element?.removeEventListener?.('play', onPlay);
      element?.removeEventListener?.('pause', onPause);
      element?.removeEventListener?.('durationchange', onDurationChange);
      element?.removeEventListener?.('timeupdate', onTimeUpdate);
      element?.removeEventListener?.('error', onError);
      element?.removeEventListener?.('waiting', onWaiting);
      element?.removeEventListener?.('stalled', onStalled);
      element?.removeEventListener?.('loadstart', onLoadStart);
      element?.removeEventListener?.('resize', onResize);

      const parentElementOrElement = element?.parentElement ?? element;

      parentElementOrElement?.removeEventListener?.('keyup', onKeyUp);

      parentElementOrElement?.removeEventListener?.('mouseenter', onMouseEnter);
      parentElementOrElement?.removeEventListener?.('mouseleave', onMouseLeave);
      parentElementOrElement?.removeEventListener?.('mousemove', onMouseMove);

      parentElementOrElement?.addEventListener?.('touchstart', onTouchUpdate);
      parentElementOrElement?.addEventListener?.('touchend', onTouchUpdate);
      parentElementOrElement?.addEventListener?.('touchmove', onTouchUpdate);

      removeEffectsFromStore?.();

      store?.destroy?.();

      element?.removeAttribute?.(MEDIA_CONTROLLER_INITIALIZED_ATTRIBUTE);
    },
  };
};

let previousPromise: Promise<void> | Promise<null> | boolean | null;

const addEffectsToStore = <TElement extends HTMLMediaElement>(
  store: StoreApi<MediaControllerState<TElement>>,
  element: HTMLMediaElement | null,
  options: Required<Pick<ControlsOptions, 'autohide'>>,
) => {
  // add effects to store changes
  return store.subscribe(async (current, prev) => {
    try {
      if (element) {
        if (previousPromise) {
          try {
            // wait for the previous promise to execute before handling the next effect
            await previousPromise;
          } catch (e) {
            console.warn(e);
          }
        }

        if (
          current._requestedPlayPauseLastTime !==
          prev._requestedPlayPauseLastTime
        ) {
          if (element.paused) {
            previousPromise = element.play();
          } else {
            element.pause();
          }
        }

        if (current.volume !== prev.volume) {
          element.volume = current.volume;
        }

        if (current.muted !== prev.muted) {
          element.muted = current.muted;
          if (current.volume === 0) {
            element.volume = DEFAULT_VOLUME_LEVEL;
          }
        }

        if (current._requestedRangeToSeekTo !== prev._requestedRangeToSeekTo) {
          // Can't set the time before the media is ready
          // Ignore if readyState isn't supported
          if (
            typeof element.readyState === 'undefined' ||
            element.readyState > 0
          ) {
            element.currentTime = current._requestedRangeToSeekTo;
          }
        }

        // user has interacted with element
        if (
          options.autohide &&
          current._lastInteraction !== prev._lastInteraction
        ) {
          const { device } = store.getState();
          if (!device.isMobile) {
            store.getState().setHidden(false);
          }

          await delay(options.autohide);

          if (
            !store.getState().hidden &&
            current._lastInteraction === store.getState()._lastInteraction
          ) {
            store.getState().setHidden(true);
          }
        }

        if (
          current._requestedFullscreenLastTime !==
          prev._requestedFullscreenLastTime
        ) {
          const isFullscreen = isCurrentlyFullscreen(element);

          if (!isFullscreen) {
            previousPromise = enterFullscreen(element);
          } else {
            previousPromise = exitFullscreen(element);
          }
        }

        if (
          current._requestedAirPlayLastTime !== prev._requestedAirPlayLastTime
        ) {
          requestAirPlay(element);
        }

        if (
          current._requestedPictureInPictureLastTime !==
          prev._requestedPictureInPictureLastTime
        ) {
          const isPictureInPicture = isCurrentlyPictureInPicture(element);

          if (!isPictureInPicture) {
            previousPromise = enterPictureInPicture(element);
          } else {
            previousPromise = exitPictureInPicture(element);
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }
  });
};
