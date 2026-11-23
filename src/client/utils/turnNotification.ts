import {APP_NAME} from '@/common/constants';
import {translateText} from '@/client/directives/i18n';
import {isPageInFront} from '@/client/utils/pageInFront';

/** Was aus der Benachrichtigung "Du bist am Zug!" wurde – die Admin-Seite "Push" zeigt es beim Test an */
export type TurnNotificationResult = 'shown' | 'page-in-front' | 'no-permission' | 'failed';

/**
 * Zeigt "Du bist am Zug!" als System-Benachrichtigung. Eigenes Modul, damit das Spiel (WaitingFor.vue)
 * und der Test auf der Admin-Seite denselben Weg gehen – der Test prüft so das echte Verhalten.
 * icon: relativ zur Seite; die Admin-Seite liegt woanders als das Spiel und gibt ihr eigenes mit.
 */
export async function showTurnNotification(icon = 'favicon.ico'): Promise<TurnNotificationResult> {
  if (typeof Notification === 'undefined') {
    return 'failed';
  }
  if (Notification.permission !== 'granted') {
    // Die Erlaubnis wird beim ersten Zug erfragt, auch wenn die Seite vorne ist – sonst käme die Frage nie
    void Notification.requestPermission();
    return 'no-permission';
  }
  if (isPageInFront()) {
    // Der Spieler sieht den Zugwechsel selbst, eine System-Benachrichtigung wäre nur störend
    return 'page-in-front';
  }
  const title = APP_NAME;
  const options = {icon, body: translateText('It\'s your turn!')};
  try {
    new Notification(title, options);
    return 'shown';
  } catch {
    // Manche Browser (z. B. Chrome auf Android) kennen nur die Benachrichtigung über den Service Worker
    if (!window.isSecureContext || navigator.serviceWorker === undefined) {
      return 'failed';
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return 'shown';
    } catch (error) {
      console.warn('Failed to display notification with serviceWorker', error);
      return 'failed';
    }
  }
}
