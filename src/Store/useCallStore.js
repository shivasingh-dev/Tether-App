import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useCallStore = create(
  subscribeWithSelector((set, get) => ({
    // call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, // video & audio

    // media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isRemoteVideoEnabled: true,
    isRemoteAudioEnabled: true,

    // WEB RTC
    peerConnection: null,
    iceCandidatesQueue: [], // Queue for ICE Candidates

    isCallModalOpen: false,
    callStatus: "idle", // idle, calling, ringing, connecting, connected, ended

    // Function placeholders (assigned in Manager)
    initiateCall: () => {},

    // Actions
    setCurrentCall: (call) => {
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },

    setCallActive: (active) => {
      set({ isCallActive: active });
    },

    setCallType: (type) => set({ callType: type }),

    setLocalStream: (stream) => {
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },

    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },

    setCallModalOpen: (open) => {
      set({ isCallModalOpen: open });
    },

    setCallStatus: (status) => {
      set({ callStatus: status });
    },

    setRemoteVideoEnabled: (enabled) => {
      set({ isRemoteVideoEnabled: enabled });
    },

    setRemoteAudioEnabled: (enabled) => {
      set({ isRemoteAudioEnabled: enabled });
    },

    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },

    processQueuedIceCandidate: async () => {
      const { peerConnection, iceCandidatesQueue } = get();

      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        for (const candidate of iceCandidatesQueue) {
          try {
            // In RN, we might need RTCIceCandidate from react-native-webrtc
            await peerConnection.addIceCandidate(candidate);
          } catch (error) {
            console.error("ICE Candidate error", error);
          }
        }
        set({ iceCandidatesQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    endCall: () => {
      const { localStream, peerConnection } = get();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }

      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isRemoteVideoEnabled: true,
        isRemoteAudioEnabled: true,
        peerConnection: null,
        iceCandidatesQueue: [],
        isCallModalOpen: false,
        callStatus: "idle",
      });
    },

    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
  })),
);

export default useCallStore;
