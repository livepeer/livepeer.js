import { MediaControllerState } from 'livepeer';
import { isAirPlaySupported } from 'livepeer/media/browser';
import { styling } from 'livepeer/media/browser/styling';
import * as React from 'react';

import { useMediaController } from '../../../context';
import { PropsOf } from '../../system';
const DefaultAirPlayIcon = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 36 36"
    fill="none"
    style={{
      marginLeft: '9px',
      marginTop: '6px',
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="currentColor"
      d="M12.83,13.45a1,1,0,0,0-1.66,0l-4,6a1,1,0,0,0,0,1A1,1,0,0,0,8,21h8a1,1,0,0,0,.88-.53,1,1,0,0,0-.05-1ZM9.87,19,12,15.8,14.13,19ZM19,3H5A3,3,0,0,0,2,6v9a3,3,0,0,0,3,3h.85a1,1,0,1,0,0-2H5a1,1,0,0,1-1-1V6A1,1,0,0,1,5,5H19a1,1,0,0,1,1,1v9a1,1,0,0,1-1,1h-.85a1,1,0,0,0,0,2H19a3,3,0,0,0,3-3V6A3,3,0,0,0,19,3Z"
    />
  </svg>
);
export type AirPlayButtonProps = Omit<PropsOf<'button'>, 'children'> & {
  /**
   * The AirPlay icon to be used for the button.
   * @type React.ReactElement
   */
  icon?: React.ReactElement;
};
const mediaControllerSelector = ({
  requestAirPlay,
  _element,
}: MediaControllerState<HTMLMediaElement>) => ({
  requestAirPlay,
  _element,
});
export const AirPlayButton: React.FC<AirPlayButtonProps> = (props) => {
  const { requestAirPlay, _element } = useMediaController(
    mediaControllerSelector,
  );
  const [isAPSupported, setIsAPSupported] = React.useState(false);
  const { icon, onClick, ...rest } = props;
  const onClickComposed = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      await onClick?.(e);
      await requestAirPlay();
    },
    [onClick, requestAirPlay],
  );

  const title = 'AirPlay';
  const _children = icon ? icon : <DefaultAirPlayIcon />;

  const checkIfAPSupported = async () => {
    const result = await isAirPlaySupported(_element);
    setIsAPSupported(result);
  };

  React.useEffect(() => {
    checkIfAPSupported();
  }, [_element]);

  // do not show button if it is not supported
  if (!isAPSupported) {
    return <></>;
  }

  return (
    <>
      <button
        {...rest}
        className={styling.iconButton()}
        title={title}
        aria-label={title}
        onClick={onClickComposed}
      >
        {_children}
      </button>
    </>
  );
};
