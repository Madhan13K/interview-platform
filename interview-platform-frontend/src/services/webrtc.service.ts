import api from "@/lib/axios";
import { WEBRTC_ENDPOINTS } from "@/lib/api-endpoints";

export interface RoomInfo {
  roomId: string;
  existingParticipants: { sessionId: string; userId: string; displayName: string }[];
  iceServers: { urls: string[] }[];
}

export const webrtcService = {
  joinRoom: async (roomId: string, data: { sessionId?: string; displayName?: string }): Promise<RoomInfo> => {
    const res = await api.post(WEBRTC_ENDPOINTS.joinRoom(roomId), data);
    return res.data;
  },

  leaveRoom: async (roomId: string, sessionId: string): Promise<void> => {
    await api.post(WEBRTC_ENDPOINTS.leaveRoom(roomId), { sessionId });
  },

  getRoomStatus: async (roomId: string): Promise<{ exists: boolean; participants: number }> => {
    const res = await api.get(WEBRTC_ENDPOINTS.getRoomStatus(roomId));
    return res.data;
  },

  getIceServers: async (): Promise<{ urls: string[] }[]> => {
    const res = await api.get(WEBRTC_ENDPOINTS.getIceServers);
    return res.data;
  },
};
