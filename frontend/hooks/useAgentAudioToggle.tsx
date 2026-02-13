import { useState, useCallback } from 'react'
import { useParticipants } from '@livekit/components-react'

/**
 * Custom hook to manage agent audio muting/unmuting
 * Finds the agent participant and toggles their audio volume
 */
export const useAgentAudioToggle = () => {
  const [isAgentMuted, setIsAgentMuted] = useState(false)
  const participants = useParticipants()

  const toggleAgentAudio = useCallback(() => {
    const agentParticipant = participants.find((p) => p.isAgent)

    if (agentParticipant) {
      agentParticipant.audioTrackPublications.forEach((publication) => {
        if (publication.audioTrack) {
          const audioElements = publication.audioTrack.attachedElements

          audioElements.forEach((element) => {
            if (element instanceof HTMLAudioElement) {
              element.volume = isAgentMuted ? 1 : 0
            }
          })
        }
      })

      setIsAgentMuted(!isAgentMuted)
    }
  }, [participants, isAgentMuted])

  return {
    isAgentMuted,
    toggleAgentAudio,
  }
}
