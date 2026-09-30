// MeuVoto - Web Push Notifications Manager (com chave VAPID dinâmica)
(function() {
  var BASE = (function() {
    try { if (window.MeuVoto && MeuVoto.API_BASE) return MeuVoto.API_BASE; } catch(e) {}
    try { if (window.VotaBrasil && VotaBrasil.API_BASE) return VotaBrasil.API_BASE; } catch(e) {}
    return 'https://mudabrasil-production-79eb.up.railway.app';
  })();

  // Cache em memória da chave pública VAPID
  var _vapidPublicKey = null;

  var PushManager = {
    isSupported: function() {
      return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    // Busca a chave pública VAPID do backend (ou usa cache)
    getVapidPublicKey: async function() {
      if (_vapidPublicKey) return _vapidPublicKey;
      try {
        var r = await fetch(BASE + '/api/push/vapid-public');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var j = await r.json();
        if (!j || !j.ok || !j.publicKey) throw new Error('resposta sem publicKey');
        _vapidPublicKey = j.publicKey;
        return _vapidPublicKey;
      } catch (err) {
        console.error('[push] falha ao obter VAPID pública:', err);
        return null;
      }
    },

    requestPermission: async function() {
      if (!this.isSupported()) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    },

    subscribe: async function() {
      if (!this.isSupported()) return null;
      try {
        const vapidKey = await this.getVapidPublicKey();
        if (!vapidKey) {
          console.error('[push] sem chave VAPID pública disponível');
          return null;
        }
        const registration = await navigator.serviceWorker.ready;
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        // Enviar subscription para o backend
        await fetch(BASE + '/api/digest/subscribe-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() })
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
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
      } catch (e) {
        return false;
      }
    }
  };

  // Helper para converter chave VAPID base64url em Uint8Array
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
