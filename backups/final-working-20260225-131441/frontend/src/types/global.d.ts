import { wsService } from '../services/websocket';

declare global {
  interface Window {
    wsService: typeof wsService;
  }
}
