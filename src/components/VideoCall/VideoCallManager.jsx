import React, { useCallback, useEffect } from "react";
import useCallStore from "../../Store/useCallStore";
import VideoCallModal from "./VideoCallModal";
import useUserStore from "../../Store/useUserStore";
import { useContactStore } from "../../Store/useContactStore";

const VideoCallManager = ({ socket }) => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
  } = useCallStore();

  const { user } = useUserStore();

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callType,
      callId,
    }) => {
      const { registeredContacts, getLocalName } = useContactStore.getState();
      const caller = registeredContacts.find(c => c._id === callerId);
      const localName = getLocalName(caller?.phoneNumber);
      const displayCallerName = localName || callerName;

      setIncomingCall({
        callerId,
        callerName: displayCallerName,
        callerAvatar,
        callId,
      });

      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("ringing");
    };

    const handleCallEnded = () => {
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_failed", handleCallEnded);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_failed", handleCallEnded);
    };
  }, [socket]);

  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      if (!user?._id) return;
      
      const callId = `${user?._id}-${receiverId}-${Date.now()}`;
      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      };

      setCurrentCall(callData);
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus("calling");

      socket.emit("initiate_call", {
        callerId: user?._id,
        receiverId,
        callType,
        callerInfo: {
          userName: user.fullName,
          profilePicture: user.profilePicture,
        },
      });
    },
    [user, socket]
  );

  useEffect(() => {
    useCallStore.getState().initiateCall = initiateCall;
  }, [initiateCall]);

  return <VideoCallModal socket={socket} />;
};

export default VideoCallManager;
