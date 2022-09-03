import { VideoPlayer } from '@livepeer/react';
import * as React from 'react';

const playbackId = 'a4e8o6mykgkvtxav';

export const DemoVideoPlayer = () => {
  return <VideoPlayer className="mt-6" playbackId={playbackId} loop muted />;
};