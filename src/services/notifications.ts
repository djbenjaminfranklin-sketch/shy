import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'new_like'
  | 'invitation'
  | 'match'
  | 'message'
  | 'nearby'
  | 'mode_expiring'
  | 'mode_expired'
  | 'mode_new_profiles';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const notificationService = {
  /**
   * Enregistrer le device pour les push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications need a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Configuration pour Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF006E',
        sound: 'default',
      });

      // Canal pour les messages
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'Notifications pour les nouveaux messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF7B7B',
        sound: 'default',
      });

      // Canal pour les matchs
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Matchs',
        description: 'Notifications pour les nouveaux matchs',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF91B4',
        sound: 'default',
      });

      // Canal pour les proximites
      await Notifications.setNotificationChannelAsync('nearby', {
        name: 'A proximite',
        description: 'Notifications quand quelqu\'un est pres de vous',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FFB86F',
      });

      // Canal pour les modes de disponibilite
      await Notifications.setNotificationChannelAsync('availability_modes', {
        name: 'Modes de disponibilite',
        description: 'Notifications pour les modes de disponibilite',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
        lightColor: '#4CAF50',
        sound: 'default',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    })).data;

    return token;
  },

  /**
   * Sauvegarder le token dans Supabase
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    } catch (err) {
      console.error('Error saving push token:', err);
    }
  },

  /**
   * Enregistrer et sauvegarder le token en une seule operation
   */
  async registerAndSaveToken(userId: string): Promise<{ token: string | null; error: string | null }> {
    try {
      const token = await this.registerForPushNotifications();

      if (!token) {
        return { token: null, error: 'Permission refusee pour les notifications' };
      }

      await this.savePushToken(userId, token);
      return { token, error: null };
    } catch (err) {
      console.error('Error registering for push notifications:', err);
      return { token: null, error: 'Erreur lors de l\'enregistrement des notifications' };
    }
  },

  /**
   * Supprimer le token (lors de la deconnexion)
   */
  async removeToken(userId: string): Promise<void> {
    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error removing push token:', err);
    }
  },

  /**
   * Envoyer une notification locale (pour test)
   */
  async sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        vibrate: [0, 250, 250, 250],
        data,
      },
      trigger: null, // Immediat
    });
  },

  /**
   * Notification: Nouvelle invitation recue
   */
  async notifyNewInvitation(fromName: string): Promise<void> {
    await this.sendLocalNotification(
      'Nouvelle invitation !',
      `${fromName} veut te connaitre`,
      { type: 'invitation' }
    );
  },

  /**
   * Notification: Invitation acceptee (match)
   */
  async notifyInvitationAccepted(name: string): Promise<void> {
    await this.sendLocalNotification(
      'C\'est un match !',
      `${name} a accepte ton invitation. Dis-lui bonjour !`,
      { type: 'match' }
    );
  },

  /**
   * Notification: Nouveau message
   */
  async notifyNewMessage(fromName: string, preview: string): Promise<void> {
    const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    await this.sendLocalNotification(
      fromName,
      truncatedPreview,
      { type: 'message' }
    );
  },

  /**
   * Notification: Utilisateur a proximite
   */
  async notifyNearbyUser(name: string, distance: number): Promise<void> {
    await this.sendLocalNotification(
      'Quelqu\'un pres de toi !',
      `${name} est a ${distance} km de toi`,
      { type: 'nearby' }
    );
  },

  /**
   * Notification: Nouveau like (premium)
   */
  async notifyNewLike(): Promise<void> {
    await this.sendLocalNotification(
      'Quelqu\'un t\'a like !',
      'Passe a Gold pour voir qui',
      { type: 'new_like' }
    );
  },

  /**
   * Notification: Mode expire bientot (30 min)
   */
  async notifyModeExpiringSoon(modeName: string, remainingMinutes: number): Promise<void> {
    await this.sendLocalNotification(
      'Mode expire bientot',
      `Votre mode ${modeName} expire dans ${remainingMinutes} minutes`,
      { type: 'mode_expiring' }
    );
  },

  /**
   * Notification: Mode expire
   */
  async notifyModeExpired(modeName: string): Promise<void> {
    await this.sendLocalNotification(
      'Mode expire',
      `Votre mode ${modeName} a expire. Activez-le a nouveau si vous etes toujours disponible.`,
      { type: 'mode_expired' }
    );
  },

  /**
   * Notification: Nouveaux profils dans votre mode (gratuit)
   */
  async notifyNewProfilesInModeFree(): Promise<void> {
    await this.sendLocalNotification(
      'Nouveaux profils disponibles',
      'De nouveaux profils sont disponibles dans votre mode actuel',
      { type: 'mode_new_profiles' }
    );
  },

  /**
   * Notification: Nouveaux profils dans votre mode (premium - avec count)
   */
  async notifyNewProfilesInModePremium(count: number): Promise<void> {
    await this.sendLocalNotification(
      'Nouveaux profils disponibles',
      `${count} nouveaux profils sont disponibles pendant votre mode actif`,
      { type: 'mode_new_profiles', profileCount: count }
    );
  },

  /**
   * Programmer une notification pour l'expiration du mode
   */
  async scheduleModeExpirationNotification(
    modeName: string,
    expiresAt: Date,
    warningMinutes: number = 30
  ): Promise<string | null> {
    try {
      // Calculer le moment de la notification (30 min avant expiration)
      const notificationTime = new Date(expiresAt.getTime() - warningMinutes * 60 * 1000);
      const now = new Date();

      // Ne programmer que si c'est dans le futur
      if (notificationTime <= now) {
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Mode expire bientot',
          body: `Votre mode ${modeName} expire dans ${warningMinutes} minutes`,
          sound: true,
          data: { type: 'mode_expiring', modeName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      return identifier;
    } catch (err) {
      console.error('Error scheduling mode expiration notification:', err);
      return null;
    }
  },

  /**
   * Annuler une notification programmee par son ID
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (err) {
      console.error('Error canceling scheduled notification:', err);
    }
  },

  /**
   * Envoyer une notification push via l'API Expo
   * Note: En production, ceci devrait etre fait cote serveur
   */
  async sendPushNotification(
    expoPushToken: string,
    notification: NotificationData
  ): Promise<{ error: string | null }> {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, ...notification.data },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        return { error: 'Erreur lors de l\'envoi de la notification' };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erreur lors de l\'envoi de la notification' };
    }
  },

  /**
   * Recuperer le token push d'un utilisateur
   */
  async getUserPushToken(userId: string): Promise<{ token: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { token: null, error: error.message };
      }

      return { token: data?.token || null, error: null };
    } catch (err) {
      return { token: null, error: 'Erreur lors de la recuperation du token' };
    }
  },

  /**
   * Notifier un nouveau match (push distant)
   */
  async notifyNewMatchRemote(userId: string, matchedUserName: string): Promise<void> {
    const { token } = await this.getUserPushToken(userId);
    if (!token) return;

    await this.sendPushNotification(token, {
      type: 'new_match',
      title: 'Nouveau match !',
      body: `Vous avez matche avec ${matchedUserName}`,
      data: { matchedUserName },
    });
  },

  /**
   * Notifier un nouveau message (push distant)
   */
  async notifyNewMessageRemote(userId: string, senderName: string, preview: string): Promise<void> {
    const { token } = await this.getUserPushToken(userId);
    if (!token) return;

    await this.sendPushNotification(token, {
      type: 'new_message',
      title: senderName,
      body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
      data: { senderName },
    });
  },

  /**
   * Notifier un utilisateur a proximite (push distant)
   */
  async notifyNearbyUserRemote(userId: string, nearbyUserName: string, distance: number): Promise<void> {
    const { token } = await this.getUserPushToken(userId);
    if (!token) return;

    await this.sendPushNotification(token, {
      type: 'nearby',
      title: 'Quelqu\'un pres de toi !',
      body: `${nearbyUserName} est a ${distance} km de toi`,
      data: { nearbyUserName, distance },
    });
  },

  /**
   * Ajouter un listener pour les notifications recues
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Ajouter un listener pour les notifications cliquees
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Supprimer les listeners
   */
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    subscription.remove();
  },

  /**
   * Reinitialiser le badge
   */
  async resetBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  },

  /**
   * Definir le nombre de badges
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Obtenir le nombre de badges actuel
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Annuler toutes les notifications programmees
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Obtenir toutes les notifications en attente
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },
};

// Export par defaut et nomme pour compatibilite
export const notificationsService = notificationService;
export default notificationService;
