/**
 * Estado global centralizado de la aplicación (Store reactivo)
 */

class Store {
  constructor() {
    this.state = {
      user: null,
      shows: [],
      currentShow: null,
      selectedSeat: null,
      exchangeRate: 0,
      userPurchases: [],
      guestPurchases: [],
      activeView: 'vista-inicio'
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error en listener del store:', err);
      }
    }
  }
}

export const store = new Store();
