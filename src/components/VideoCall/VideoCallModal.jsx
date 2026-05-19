import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from "react-native-webrtc";
import useCallStore from "../../Store/useCallStore";
import useUserStore from "../../Store/useUserStore";
import useThemeStore from "../../Store/useThemeStore";
import Icon from "react-native-vector-icons/FontAwesome5";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import useCallHistoryStore from "../../Store/useCallHistoryStore";

const { width, height } = Dimensions.get("window");

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const { addCallRecord } = useCallHistoryStore();

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteStream,
    isVideoEnabled,
    peerConnection,
    isCallModalOpen,
    setIncomingCall,
    setCurrentCall,
    callType,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    callStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidate,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
    isAudioEnabled,
    isRemoteVideoEnabled,
    isRemoteAudioEnabled,
    setRemoteVideoEnabled,
    setRemoteAudioEnabled,
  } = useCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected");
      setCallActive(true);
      callStartTimeRef.current = Date.now();
    }
  }, [peerConnection, remoteStream]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const cameraStatus = await request(PERMISSIONS.ANDROID.CAMERA);
      const microStatus = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      return cameraStatus === RESULTS.GRANTED && microStatus === RESULTS.GRANTED;
    } else {
      const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
      const microStatus = await request(PERMISSIONS.IOS.MICROPHONE);
      return cameraStatus === RESULTS.GRANTED && microStatus === RESULTS.GRANTED;
    }
  };

  const initializeMedia = async (video = true) => {
    try {
      const isGranted = await requestPermissions();
      if (!isGranted) {
        Alert.alert("Permission Denied", "Camera and Microphone permissions are required for calls.");
        return null;
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: video ? {
          mandatory: {
            minWidth: 640,
            minHeight: 480,
            minFrameRate: 30,
          },
          facingMode: "user",
        } : false,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Media Error", error);
      return null;
    }
  };

  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia(callType === "video");
      if (!stream) return;

      const pc = createPeerConnection(stream, "CALLER");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("Caller Error", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia(callType === "video");
      if (!stream) {
        handleEndCall();
        return;
      }

      createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          fullName: user?.fullName,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver Error", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }
    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    // Save to local history before clearing state
    if (displayInfo) {
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      addCallRecord({
        id: callId || Date.now().toString(),
        participantId,
        participantName: displayInfo.name,
        participantAvatar: displayInfo.avatar,
        callType: callType,
        status: callStatus === "connected" ? "completed" : "missed",
        timestamp: new Date().toISOString(),
        duration: duration,
      });
    }

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    callStartTimeRef.current = null;
    endCall();
  };

  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = () => {
      if (currentCall) {
        setTimeout(initializeCallerCall, 500);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => endCall();

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      const pc = useCallStore.getState().peerConnection;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedIceCandidate();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { answer, receiverId: senderId, callId });
      } catch (error) {
        console.error("Receiver error offer", error);
      }
    };

    const handleWebRTCAnswer = async ({ answer }) => {
      const pc = useCallStore.getState().peerConnection;
      if (!pc || pc.signalingState === "closed") return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processQueuedIceCandidate();
      } catch (error) {
        console.error("caller answer error", error);
      }
    };

    const handleWebRTCIceCandidates = async ({ candidate }) => {
      const pc = useCallStore.getState().peerConnection;
      if (pc && pc.signalingState !== "closed") {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Ice candidate error", error);
          }
        } else {
          addIceCandidate(candidate);
        }
      }
    };

    const handleMediaToggled = ({ isVideoEnabled, isAudioEnabled }) => {
      if (isVideoEnabled !== undefined) setRemoteVideoEnabled(isVideoEnabled);
      if (isAudioEnabled !== undefined) setRemoteAudioEnabled(isAudioEnabled);
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);
    socket.on("media_toggled", handleMediaToggled);

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
      socket.off("media_toggled", handleMediaToggled);
    };
  }, [socket, peerConnection, currentCall, incomingCall]);

  const handleToggleVideo = () => {
    toggleVideo();
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;
    if (socket && participantId && callId) {
      socket.emit("toggle_media", { receiverId: participantId, callId, isVideoEnabled: !isVideoEnabled, isAudioEnabled });
    }
  };

  const handleToggleAudio = () => {
    toggleAudio();
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;
    if (socket && participantId && callId) {
      socket.emit("toggle_media", { receiverId: participantId, callId, isVideoEnabled, isAudioEnabled: !isAudioEnabled });
    }
  };

  if (!isCallModalOpen && !incomingCall) return null;

  const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Incoming Call View */}
        {incomingCall && !isCallActive && (
          <View style={styles.incomingContainer}>
            <View style={styles.userInfo}>
              <Image source={{ uri: displayInfo?.avatar || 'https://via.placeholder.com/150' }} style={styles.avatarLarge} />
              <Text style={styles.userName}>{displayInfo?.name}</Text>
              <Text style={styles.callTypeStatus}>Incoming {callType} call...</Text>
            </View>
            <View style={styles.callButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleRejectCall}>
                <Icon name="phone-slash" size={25} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={handleAnswerCall}>
                <Icon name="phone" size={25} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Call View */}
        {shouldShowActiveCall && (
          <View style={styles.activeContainer}>
            {callType === "video" && remoteStream ? (
              isRemoteVideoEnabled ? (
                <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
              ) : (
                <View style={[styles.remoteVideo, { backgroundColor: '#1c1c1c', justifyContent: 'center', alignItems: 'center' }]}>
                  {displayInfo?.avatar ? (
                    <Image source={{ uri: displayInfo.avatar }} style={styles.avatarLarge} />
                  ) : (
                    <View style={[styles.avatarLarge, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff', fontSize: 40, fontWeight: 'bold' }}>
                        {displayInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.userName}>{displayInfo?.name}</Text>
                  <Text style={{ color: '#00A884', fontSize: 16, marginTop: 10 }}>Video Paused</Text>
                </View>
              )
            ) : (
              <View style={styles.audioPlaceholder}>
                <Image source={{ uri: displayInfo?.avatar || 'https://via.placeholder.com/150' }} style={styles.avatarLarge} />
                <Text style={styles.userName}>{displayInfo?.name}</Text>
                <Text style={styles.callStatusText}>{callStatus}...</Text>
              </View>
            )}

            {callType === "video" && localStream && (
              <View style={styles.localVideoContainer}>
                {isVideoEnabled ? (
                  <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" zOrder={1} />
                ) : (
                  <View style={[styles.localVideo, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                    {user?.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.controls}>
              {callType === "video" && (
                <TouchableOpacity style={styles.controlBtn} onPress={handleToggleVideo}>
                  <Icon name={isVideoEnabled ? "video" : "video-slash"} size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.controlBtn} onPress={handleToggleAudio}>
                <Icon name={isAudioEnabled ? "microphone" : "microphone-slash"} size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, styles.btnReject]} onPress={handleEndCall}>
                <Icon name="phone-slash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  incomingContainer: { flex: 1, justifyContent: "space-around", alignItems: "center", paddingVertical: 50 },
  activeContainer: { flex: 1, backgroundColor: "#1c1c1c" },
  userInfo: { alignItems: "center" },
  avatarLarge: { width: 150, height: 150, borderRadius: 75, marginBottom: 20, borderWith: 2, borderColor: '#00A884' },
  userName: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  callTypeStatus: { fontSize: 16, color: "#00A884", marginTop: 10 },
  callButtons: { flexDirection: "row", gap: 50 },
  btn: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center" },
  btnAccept: { backgroundColor: "#00A884" },
  btnReject: { backgroundColor: "#FF3B30" },
  remoteVideo: { flex: 1 },
  localVideoContainer: { position: "absolute", top: 50, right: 20, width: 120, height: 160, borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#fff" },
  localVideo: { flex: 1 },
  audioPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  callStatusText: { color: "#00A884", marginTop: 10, fontSize: 18 },
  controls: { position: "absolute", bottom: 50, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 30 },
  controlBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
});

export default VideoCallModal;
