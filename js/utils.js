// ==========================================
// UTILS.JS - FONCTIONS UTILITAIRES GLOBALES
// ==========================================

// Classe principale de gestion des données
class DataManager {
  constructor() {
    this.data = null;
    this.dataUrl = 'data.json';
  }

  // Charger les données depuis data.json
  async chargerDonnees() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error('Erreur de chargement des données');
      this.data = await response.json();
      return this.data;
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  }

  // Sauvegarder les données (pour l'admin)
  sauvegarderDonnees(donnees) {
    // En mode statique, on utilise localStorage
    localStorage.setItem('porteBonheurData', JSON.stringify(donnees));
    this.data = donnees;
    return true;
  }

  // Charger depuis localStorage (prioritaire sur data.json)
  chargerDepuisLocalStorage() {
    const data = localStorage.getItem('porteBonheurData');
    if (data) {
      this.data = JSON.parse(data);
      return this.data;
    }
    return null;
  }

  // Obtenir tous les produits actifs
  getProduitsActifs() {
    if (!this.data) return [];
    return this.data.produits.filter(p => p.actif);
  }

  // Obtenir un produit par ID
  getProduitParId(id) {
    if (!this.data) return null;
    return this.data.produits.find(p => p.id === parseInt(id));
  }

  // Obtenir un produit par slug
  getProduitParSlug(slug) {
    if (!this.data) return null;
    return this.data.produits.find(p => p.slug === slug);
  }

  // Obtenir les produits vedettes
  getProduitsVedettes(max = 3) {
    if (!this.data) return [];
    return this.data.produits
      .filter(p => p.actif && p.vedette)
      .slice(0, max);
  }

  // Obtenir les produits par catégorie
  getProduitsByCategorie(categorie) {
    if (!this.data) return [];
    return this.data.produits.filter(p => p.actif && p.categorie === categorie);
  }

  // Rechercher des produits
  rechercherProduits(terme) {
    if (!this.data) return [];
    terme = terme.toLowerCase();
    return this.data.produits.filter(p => {
      return p.actif && (
        p.nom.toLowerCase().includes(terme) ||
        p.descriptionCourte.toLowerCase().includes(terme) ||
        p.tags.some(tag => tag.toLowerCase().includes(terme))
      );
    });
  }

  // Trier les produits
  trierProduits(produits, critere) {
    const produitsTriés = [...produits];
    
    switch(critere) {
      case 'prix-asc':
        return produitsTriés.sort((a, b) => a.prix - b.prix);
      case 'prix-desc':
        return produitsTriés.sort((a, b) => b.prix - a.prix);
      case 'nom-asc':
        return produitsTriés.sort((a, b) => a.nom.localeCompare(b.nom));
      case 'nom-desc':
        return produitsTriés.sort((a, b) => b.nom.localeCompare(a.nom));
      case 'recent':
        return produitsTriés.sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout));
      case 'populaire':
        return produitsTriés.sort((a, b) => (b.vues + b.commandes) - (a.vues + a.commandes));
      default:
        return produitsTriés;
    }
  }

  // Obtenir les produits liés
  getProduitsLies(produitId, max = 3) {
    if (!this.data) return [];
    const produit = this.getProduitParId(produitId);
    if (!produit || !produit.produitsLies) return [];
    
    return produit.produitsLies
      .map(id => this.getProduitParId(id))
      .filter(p => p && p.actif)
      .slice(0, max);
  }
}

// Fonctions utilitaires générales
const Utils = {
  // Formater le prix
  formaterPrix(prix, devise = 'FCFA') {
    return new Intl.NumberFormat('fr-FR').format(prix) + ' ' + devise;
  },

  // Calculer le prix avec réduction
  calculerPrixReduit(prix, reduction) {
    if (!reduction || reduction === 0) return prix;
    return prix - (prix * reduction / 100);
  },

  // Générer un slug depuis un texte
  genererSlug(texte) {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Tronquer un texte
  tronquer(texte, longueur = 100) {
    if (texte.length <= longueur) return texte;
    return texte.substring(0, longueur) + '...';
  },

  // Générer un lien WhatsApp
  genererLienWhatsApp(numero, message) {
    const msgEncode = encodeURIComponent(message);
    return `https://wa.me/${numero}?text=${msgEncode}`;
  },

  // Valider un email
  validerEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Valider un téléphone
  validerTelephone(tel) {
    const regex = /^[\d\s\+\-\(\)]+$/;
    return regex.test(tel) && tel.replace(/\D/g, '').length >= 8;
  },

  // Formater une date
  formaterDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Afficher les étoiles de notation
  afficherEtoiles(note, max = 5) {
    let html = '';
    for (let i = 0; i < max; i++) {
      html += i < note ? '⭐' : '☆';
    }
    return html;
  },

  // Debounce pour optimiser les recherches
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Afficher un message toast
  afficherToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Valider une URL d'image
  validerImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  },

  // Convertir une image en base64
  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Vérifier si on est sur mobile
  estMobile() {
    return window.innerWidth < 768;
  },

  // Smooth scroll vers un élément
  scrollVers(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // Copier dans le presse-papier
  async copierTexte(texte) {
    try {
      await navigator.clipboard.writeText(texte);
      this.afficherToast('Copié dans le presse-papier !', 'success');
      return true;
    } catch (err) {
      console.error('Erreur de copie:', err);
      return false;
    }
  },

  // Obtenir les paramètres URL
  getParamsUrl() {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    for (const [key, value] of params) {
      obj[key] = value;
    }
    return obj;
  },

  // Mettre à jour l'URL sans recharger
  updateUrl(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  },

  // Animation au scroll
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  },

  // Loader
  afficherLoader(show = true) {
    let loader = document.getElementById('global-loader');
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.innerHTML = '<div class="spinner"></div>';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      document.body.appendChild(loader);
    } else if (loader && !show) {
      loader.remove();
    }
  }
};

// Classe de validation de formulaires
class FormValidator {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.errors = {};
  }

  valider(regles) {
    this.errors = {};
    let isValid = true;

    Object.keys(regles).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      const rules = regles[fieldName];
      
      if (!field) return;

      if (rules.required && !field.value.trim()) {
        this.errors[fieldName] = rules.messageRequired || 'Ce champ est requis';
        isValid = false;
      }

      if (rules.email && field.value && !Utils.validerEmail(field.value)) {
        this.errors[fieldName] = rules.messageEmail || 'Email invalide';
        isValid = false;
      }

      if (rules.tel && field.value && !Utils.validerTelephone(field.value)) {
        this.errors[fieldName] = rules.messageTel || 'Téléphone invalide';
        isValid = false;
      }

      if (rules.min && field.value.length < rules.min) {
        this.errors[fieldName] = `Minimum ${rules.min} caractères`;
        isValid = false;
      }

      if (rules.max && field.value.length > rules.max) {
        this.errors[fieldName] = `Maximum ${rules.max} caractères`;
        isValid = false;
      }
    });

    this.afficherErreurs();
    return isValid;
  }

  afficherErreurs() {
    // Nettoyer les anciennes erreurs
    this.form.querySelectorAll('.error-message').forEach(el => el.remove());
    this.form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // Afficher les nouvelles erreurs
    Object.keys(this.errors).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      if (field) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = this.errors[fieldName];
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
        field.parentNode.appendChild(errorDiv);
      }
    });
  }

  nettoyerErreurs() {
    this.form.querySelectorAll('.error-message').forEach(el => el.remove());
    this.form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    this.errors = {};
  }
}

// Initialisation globale
let dataManager;

document.addEventListener('DOMContentLoaded', async () => {
  // Créer l'instance du gestionnaire de données
  dataManager = new DataManager();
  
  // Charger d'abord depuis localStorage, sinon depuis data.json
  let data = dataManager.chargerDepuisLocalStorage();
  if (!data) {
    data = await dataManager.chargerDonnees();
  }

  // Initialiser les animations
  Utils.initScrollAnimations();

  // Ajouter les styles CSS pour les animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});

// Exporter pour utilisation globale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataManager, Utils, FormValidator };
}