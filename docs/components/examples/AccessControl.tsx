import { Box, Button, Flex, Text, TextField } from '@livepeer/design-system';
import { Player, useCreateStream, useStream } from '@livepeer/react';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '../../lib/error';
import {
  CreateSignedPlaybackBody,
  CreateSignedPlaybackResponse,
} from '../../pages/api/create-signed-jwt';
import { Spinner } from '../core';

export const AccessControl = () => {
  const [streamName, setStreamName] = useState<string>('');
  const {
    mutate: createStream,
    data: createdStream,
    status,
  } = useCreateStream();

  const { data: stream } = useStream({
    streamId: createdStream?.id,
    refetchInterval: (stream) => (!stream?.isActive ? 5000 : false),
  });

  const { mutate: createJwt, data: createdJwt } = useMutation({
    mutationFn: async () => {
      if (!stream?.playbackId) {
        throw new Error('No playback ID yet.');
      }

      const body: CreateSignedPlaybackBody = {
        playbackId: stream.playbackId,
        // we pass along a "secret key" to demonstrate how gating can work
        secret: 'supersecretkey',
      };

      // eslint-disable-next-line compat/compat
      const response = await fetch('/api/create-signed-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return response.json() as Promise<
        CreateSignedPlaybackResponse | ApiError
      >;
    },
  });

  useEffect(() => {
    if (stream?.playbackId) {
      createJwt();
    }
  }, [stream?.playbackId, createJwt]);

  const isLoading = useMemo(() => status === 'loading', [status]);

  return (
    <Box css={{ my: '$6' }}>
      {!stream?.id ? (
        <>
          <TextField
            size="3"
            type="text"
            placeholder="Stream name"
            onChange={(e) => setStreamName(e.target.value)}
          />
          <Flex css={{ jc: 'flex-end', mt: '$4' }}>
            <Button
              css={{ display: 'flex', ai: 'center' }}
              onClick={() => {
                if (streamName) {
                  createStream({
                    name: streamName,
                    playbackPolicy: { type: 'jwt' },
                  });
                }
              }}
              size="2"
              disabled={!streamName || isLoading || Boolean(stream)}
              variant="primary"
            >
              {isLoading && <Spinner size={16} css={{ mr: '$1' }} />}
              Create Gated Stream
            </Button>
          </Flex>
        </>
      ) : (
        <>
          {stream &&
            stream.rtmpIngestUrl &&
            (!stream?.playbackUrl || !stream.isActive) && (
              <Text size="3" variant="gray" css={{ mt: '$3', mb: '$4' }}>
                Use the ingest URL <code>{stream.rtmpIngestUrl}</code> in a
                stream client like OBS to see content below.
              </Text>
            )}

          <Box css={{ mt: '$2' }}>
            <Player
              title={stream?.name}
              playbackId={stream?.playbackId}
              autoPlay
              muted
              jwt={(createdJwt as CreateSignedPlaybackResponse)?.token}
            />
          </Box>
        </>
      )}
    </Box>
  );
};
