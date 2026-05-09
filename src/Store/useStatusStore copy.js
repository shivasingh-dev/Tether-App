import { getSocket } from "@/Services/ChatServices";
import axiosInstance from "@/Services/UrlService";
import { create } from "zustand";

const useStatusStore = create((set, get) => ({
  // state
  statuses: [],
  loading: false,
  error: null,

  // Active
  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize the socket listeners
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    // Real time status event
    (socket.on("new_status", (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some((s) => s?._id === newStatus?._id)
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    }),
      socket.on("status_deleted", (statusId) => {
        set((state) => ({
          statuses: state.statuses.filter((s) => s?._id === statusId),
        }));
      }),
      socket.on("status_viewed", (statusId, viewers) => {
        set((state) => ({
          statuses: state.statuses.map((status) =>
            status?._id === statusId ? { ...status, viewers } : status,
          ),
        }));
      }));
  },

  cleanUpSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("new_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  // Fetch status
  fetchStatuses: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await axiosInstance.get("status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.error("Error in fetching status", error);
      set({ error: error.message });
    } finally {
      set({ loading: false, error: null });
    }
  },

  // Create status
  createStatus: async (statusData) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();

      if (statusData?.file) {
        formData.append("media", statusData?.file);
      }

      if (statusData?.content?.trim()) {
        formData.append("content", statusData?.content);
      }

      const { data } = await axiosInstance.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // add status to local state
      if (data?.data) {
        set((state) => ({
          statuses: state.statuses.some((s) => s?._id === data?._id)
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }
    } catch (error) {
      set({ error: error?.message });
      console.error("Error in creating status", error);
      throw error;
    } finally {
      set({ loading: false, error: null });
    }
  },

  // View status
  viewStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.post(`status/${statusId}/view`);
      set((state) => ({
        statuses: state?.statuses?.map((status) =>
          status?._id === statusId ? { ...status } : status,
        ),
      }));
    } catch (error) {
      set({ error: error.message });
      console.error("Error in watching status", error);
    } finally {
      set({ loading: false, error: null });
    }
  },

  // delete status
  deleteStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s?._id !== statusId),
      }));
    } catch (error) {
      set({ error: error.message });
      console.error("Error in deleting status", error);
      throw error;
    } finally {
      set({ loading: false, error: null });
    }
  },

  // get status viewers
  getStatusViewers: async (statusId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
      return data?.data;
    } catch (error) {
      set({ error: error.message });
      console.error("Error in getting viewers of status", error);
      throw error;
    } finally {
      set({ loading: false, error: null });
    }
  },

  // helper functions for grouped status
  getGroupedStatus: () => {
    const { statuses } = get();
    return statuses.reduce((acc, status) => {
      const statusUserId = status?.user?._id;
      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: status?.user?.fullName,
          avatar: status?.user?.profilePicture,
          phoneNumber: status?.user?.phoneNumber,
          statuses: [],
        };
      }

      acc[statusUserId].statuses.push({
        id: status?._id,
        media: status?.content,
        contentType: status?.contentType,
        timestamp: status?.createdAt,
        viewers: status?.viewers,
      });
      return acc;
    }, {});
  },

  getUserStatuses: (userId) => {
    const groupedStatus = get().getGroupedStatus();
    return userId ? groupedStatus[userId] : null;
  },

  getOtherStatuses: (userId) => {
    const groupedStatus = get().getGroupedStatus();
    return Object.values(groupedStatus).filter(
      (contact) => contact?.id !== userId
    );
  },

  // clear error
  clearError: () => set({error: null}),

  reset: () => 
    set({
      statuses: [],
      loading: false,
      error: null
    })

}));

export default useStatusStore
