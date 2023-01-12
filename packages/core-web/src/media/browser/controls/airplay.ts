interface AirPlayHTMLMediaElement extends HTMLMediaElement {
  webkitShowPlaybackTargetPicker: () => void;
}

interface AirPlayAvailabilityChangedEvent extends Event {
  availability: 'available' | 'unavailable';
}

export const requestAirPlay = (element: HTMLMediaElement) => {
  if (element) {
    (element as AirPlayHTMLMediaElement).webkitShowPlaybackTargetPicker();
  }
};
export const isAirPlaySupported = async (
  element: HTMLMediaElement | null,
): Promise<boolean> => {
  if (!element) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    element.addEventListener(
      'webkitplaybacktargetavailabilitychanged',
      (event) => resolve(handleAvailabilityChanged(event)),
      { once: true },
    );
  });
};

const handleAvailabilityChanged = (event: Event): boolean => {
  return (
    (event as AirPlayAvailabilityChangedEvent).availability === 'available'
  );
};
