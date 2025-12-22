// ==========================================
// UTILS.JS - FONCTIONS GLOBALES & DATA MANAGER
// ==========================================

/* =========================
   UTILS (GLOBAL)
========================= */
window.Utils = {
  afficherLoader(show) {
    let loader = document.getElementById('global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.style = `
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-size: 1.2rem;
      `;
      loader.innerHTML = 'Chargement...';
      document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
  },

  afficherToast(message, type = 'info') {
    alert(message);
  },

  calculerPrixReduit(prix, reduction = 0) {
    return Math.round(prix - (prix * reduction / 100));
  },

  formaterPrix(prix, devise = 'FCFA') {
    return `${prix.toLocaleString()} ${devise}`;
  },

  tronquer(texte, longueur = 100) {
    if (!texte) return '';
    return texte.length > longueur ? texte.substring(0, longueur) + '...' : texte;
  },

  genererLienWhatsApp(numero, message) {
    return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
  },

  getParamsUrl() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  afficherEtoiles(note) {
    return '★'.repeat(note) + '☆'.repeat(5 - note);
  },

  copierTexte(texte) {
    navigator.clipboard.writeText(texte);
    this.afficherToast('Lien copié');
  }
};

/* =========================
   DATA MANAGER (GLOBAL)
========================= */
class DataManager {
  constructor() {
    this.data = null;
  }

  async chargerDonnees() {
    try {
      const response = await fetch('data/data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Erreur HTTP ' + response.status);

      this.data = await response.json();
      return this.data;
    } catch (err) {
      console.error('Erreur chargement JSON :', err);
      throw err;
    }
  }

  getProduitParId(id) {
    return this.data?.produits.find(p => p.id === id);
  }

  getProduitsVedettes(limit = 3) {
    return this.data?.produits.filter(p => p.vedette).slice(0, limit);
  }

  getProduitsLies(produitId, limit = 3) {
    const produit = this.getProduitParId(produitId);
    if (!produit) return [];
    return this.data.produits
      .filter(p => p.categorie === produit.categorie && p.id !== produitId)
      .slice(0, limit);
  }
}

// INSTANCE GLOBALE
window.dataManager = new DataManager();
