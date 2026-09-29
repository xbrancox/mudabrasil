// MeuVoto - Web Push Notifications Manager
(function() {
  var BASE = (function() {
    try { if (window.MeuVoto && MeuVoto.API_BASE) return MeuVoto.API_BASE; } catch(e) {}
    try { if (window.VotaBrasil && VotaBrasil.API_BASE) return VotaBrasil.API_BASE; } catch(e) {}
    return 'https://mudabrasil-production-79eb.up.railway.app';
  })();

  var PushManager = {
    isSupported: function() {
      return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    requestPermission: async function() {
      if (!this.isSupported()) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    },

    subscribe: async function() {
      if (!this.isSupported()) return null;
      try {
        const registration = await navigator.serviceWorker.ready;
        // Usando uma chave pública de exemplo (em produção, usar VAPID real do backend)
        const applicationServerKey = urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib3-SJcZxJf0xVqN8K9L2M3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        // Enviar subscription para o backend
        await fetch(BASE + '/api/digest/subscribe-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription })
        });
        
        return subscription;
      } catch (error) {
        console.error('Erro ao inscrever no push:', error);
        return null;
      }
    },

    unsubscribe: async function() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch(BASE + '/api/digest/unsubscribe-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          });
        }
        return true;
      } catch (error) {
        console.error('Erro ao cancelar inscrição push:', error);
        return false;
      }
    },

    getSubscriptionStatus: async function() {
      if (!this.isSupported()) return false;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    }
  };

  // Helper para converter chave VAPID
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Expor globalmente
  window.MeuvotoPush = PushManager;
})();