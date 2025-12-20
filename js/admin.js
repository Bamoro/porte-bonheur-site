// ==========================================
// ADMIN.JS - INTERFACE D'ADMINISTRATION
// ==========================================

let vueActuelle = 'dashboard'; // dashboard, produits, config
let produitEnEdition = null;
let donnees = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof dataManager === 'undefined') {
    console.error('DataManager non disponible');
    return;
  }

  await initialiserAdmin();
});

async function initialiserAdmin() {
  try {
    Utils.afficherLoader(true);
    
    // Charger les données
    if (!dataManager.data) {
      await dataManager.chargerDonnees();
    }

    donnees = dataManager.data;
    if (!donnees) {
      throw new Error('Impossible de charger les données');
    }

    // Initialiser l'interface
    initialiserNavigation();
    afficherVue('dashboard');

    Utils.afficherLoader(false);
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    Utils.afficherToast('Erreur de chargement de l\'administration', 'error');
    Utils.afficherLoader(false);
  }
}

// ==========================================
// NAVIGATION
// ==========================================
function initialiserNavigation() {
  const navHTML = `
    <div class="admin-header">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0;">
          <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--couleur-primaire);">
            ⚙️ Administration
          </h1>
          <a href="index.html" class="btn btn-outline">← Retour au site</a>
        </div>
      </div>
    </div>
    
    <div class="admin-nav">
      <div class="container">
        <div class="nav-tabs">
          <button class="nav-tab active" data-vue="dashboard" onclick="changerVue('dashboard')">
            📊 Dashboard
          </button>
          <button class="nav-tab" data-vue="produits" onclick="changerVue('produits')">
            🛍️ Produits (${donnees.produits.length}/10)
          </button>
          <button class="nav-tab" data-vue="config" onclick="changerVue('config')">
            ⚙️ Configuration
          </button>
        </div>
      </div>
    </div>
  `;
  
  const nav = document.getElementById('admin-navigation');
  if (nav) nav.innerHTML = navHTML;
}

function changerVue(vue) {
  vueActuelle = vue;
  
  // Mettre à jour les tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.vue === vue) {
      tab.classList.add('active');
    }
  });
  
  // Afficher la vue
  afficherVue(vue);
}

function afficherVue(vue) {
  switch(vue) {
    case 'dashboard':
      afficherDashboard();
      break;
    case 'produits':
      afficherProduits();
      break;
    case 'config':
      afficherConfiguration();
      break;
  }
}

// ==========================================
// DASHBOARD
// ==========================================
function afficherDashboard() {
  const stats = calculerStatistiques();
  
  const html = `
    <div class="container">
      <h2 style="font-size: 2rem; margin-bottom: 30px;">📊 Vue d'ensemble</h2>
      
      <!-- Stats Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-bottom: 40px;">
        <div class="stat-card">
          <div class="stat-icon">🛍️</div>
          <div class="stat-info">
            <h3>${stats.produitsActifs}</h3>
            <p>Produits actifs</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>${stats.produitsVedettes}</h3>
            <p>Produits vedettes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📁</div>
          <div class="stat-info">
            <h3>${stats.categories}</h3>
            <p>Catégories</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <h3>${stats.temoignages}</h3>
            <p>Témoignages</p>
          </div>
        </div>
      </div>
      
      <!-- Actions rapides -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="font-size: 1.5rem; margin-bottom: 20px;">⚡ Actions rapides</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <button onclick="changerVue('produits'); ajouterProduit();" class="btn btn-primary">
            ➕ Ajouter un produit
          </button>
          <button onclick="changerVue('produits')" class="btn btn-outline">
            ✏️ Gérer les produits
          </button>
          <button onclick="changerVue('config')" class="btn btn-outline">
            ⚙️ Modifier la config
          </button>
          <button onclick="exporterDonnees()" class="btn btn-outline">
            💾 Exporter les données
          </button>
        </div>
      </div>
      
      <!-- Liste des produits récents -->
      <div style="margin-top: 40px;">
        <h3 style="font-size: 1.5rem; margin-bottom: 20px;">📋 Derniers produits</h3>
        <div class="produits-admin-grid">
          ${donnees.produits.slice(0, 5).map(p => creerCardProduitAdmin(p)).join('')}
        </div>
      </div>
    </div>
  `;
  
  const content = document.getElementById('admin-content');
  if (content) content.innerHTML = html;
}

function calculerStatistiques() {
  return {
    produitsActifs: donnees.produits.filter(p => p.actif).length,
    produitsVedettes: donnees.produits.filter(p => p.vedette).length,
    categories: donnees.categories.length,
    temoignages: donnees.temoignages.length
  };
}

// ==========================================
// GESTION DES PRODUITS
// ==========================================
function afficherProduits() {
  const html = `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="font-size: 2rem;">🛍️ Gestion des produits</h2>
        <button onclick="ajouterProduit()" class="btn btn-primary">
          ➕ Ajouter un produit
        </button>
      </div>
      
      <!-- Filtres -->
      <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px;">
          <input type="text" id="recherche-produit" placeholder="🔍 Rechercher un produit..." style="padding: 12px;">
          <select id="filtre-categorie" onchange="filtrerProduits()" style="padding: 12px;">
            <option value="">Toutes les catégories</option>
            ${donnees.categories.map(cat => `
              <option value="${cat.id}">${cat.icone} ${cat.nom}</option>
            `).join('')}
          </select>
        </div>
      </div>
      
      <!-- Liste des produits -->
      <div id="liste-produits" class="produits-admin-grid">
        ${donnees.produits.map(p => creerCardProduitAdmin(p)).join('')}
      </div>
    </div>
  `;
  
  const content = document.getElementById('admin-content');
  if (content) {
    content.innerHTML = html;
    
    // Écouteur de recherche
    const recherche = document.getElementById('recherche-produit');
    if (recherche) {
      recherche.addEventListener('input', Utils.debounce(filtrerProduits, 300));
    }
  }
}

function creerCardProduitAdmin(produit) {
  const prixReduit = Utils.calculerPrixReduit(produit.prix, produit.reduction);
  
  return `
    <div class="produit-admin-card ${!produit.actif ? 'inactive' : ''}">
      <div style="position: relative;">
        <img src="${produit.images && produit.images.length > 0 ? produit.images[0] : 'https://via.placeholder.com/300x200'}" 
             alt="${produit.nom}"
             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
        ${!produit.actif ? '<div class="badge-inactive">Inactif</div>' : ''}
        ${produit.vedette ? '<div class="badge-vedette">⭐ Vedette</div>' : ''}
      </div>
      
      <div style="padding: 15px 0;">
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 5px;">${produit.nom}</h3>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 10px;">
          ${getCategorieEmoji(produit.categorie)} ${getCategorieNom(produit.categorie)}
        </p>
        <p style="font-size: 1.25rem; font-weight: 700; color: var(--couleur-primaire); margin-bottom: 15px;">
          ${Utils.formaterPrix(prixReduit, produit.devise)}
          ${produit.reduction > 0 ? `<span style="font-size: 0.875rem; color: #6b7280; text-decoration: line-through; margin-left: 8px;">${Utils.formaterPrix(produit.prix, produit.devise)}</span>` : ''}
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <button onclick="editerProduit(${produit.id})" class="btn-small btn-outline">✏️ Éditer</button>
          <button onclick="toggleActif(${produit.id})" class="btn-small ${produit.actif ? 'btn-warning' : 'btn-success'}">
            ${produit.actif ? '👁️' : '🔓'}
          </button>
          <button onclick="supprimerProduit(${produit.id})" class="btn-small btn-danger">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

function filtrerProduits() {
  const recherche = document.getElementById('recherche-produit')?.value.toLowerCase() || '';
  const categorie = document.getElementById('filtre-categorie')?.value || '';
  
  let produitsFiltres = donnees.produits;
  
  if (categorie) {
    produitsFiltres = produitsFiltres.filter(p => p.categorie === categorie);
  }
  
  if (recherche) {
    produitsFiltres = produitsFiltres.filter(p => 
      p.nom.toLowerCase().includes(recherche) ||
      p.descriptionCourte.toLowerCase().includes(recherche)
    );
  }
  
  const liste = document.getElementById('liste-produits');
  if (liste) {
    liste.innerHTML = produitsFiltres.map(p => creerCardProduitAdmin(p)).join('');
  }
}

// ==========================================
// FORMULAIRE PRODUIT
// ==========================================
function ajouterProduit() {
  const nouveauProduit = {
    id: Math.max(...donnees.produits.map(p => p.id), 0) + 1,
    actif: true,
    vedette: false,
    nom: '',
    slug: '',
    categorie: donnees.categories[0].id,
    prix: 0,
    devise: 'FCFA',
    reduction: 0,
    images: [],
    descriptionCourte: '',
    descriptionComplete: '',
    avantages: [],
    caracteristiques: [],
    tags: [],
    messageWhatsapp: '',
    produitsLies: [],
    dateAjout: new Date().toISOString().split('T')[0],
    vues: 0,
    commandes: 0
  };
  
  afficherFormulaireProduit(nouveauProduit, true);
}

function editerProduit(id) {
  const produit = donnees.produits.find(p => p.id === id);
  if (produit) {
    afficherFormulaireProduit({...produit}, false);
  }
}

function afficherFormulaireProduit(produit, estNouveau) {
  produitEnEdition = produit;
  
  const html = `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="font-size: 2rem;">${estNouveau ? '➕ Nouveau produit' : '✏️ Éditer le produit'}</h2>
        <button onclick="afficherProduits()" class="btn btn-outline">← Retour</button>
      </div>
      
      <form id="form-produit" style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Informations de base -->
        <h3 style="font-size: 1.5rem; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          📝 Informations de base
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <label>Nom du produit *</label>
            <input type="text" name="nom" value="${produit.nom}" required onchange="genererSlug()">
          </div>
          
          <div>
            <label>Slug (URL)</label>
            <input type="text" name="slug" value="${produit.slug}" required>
          </div>
          
          <div>
            <label>Catégorie *</label>
            <select name="categorie" required>
              ${donnees.categories.map(cat => `
                <option value="${cat.id}" ${produit.categorie === cat.id ? 'selected' : ''}>
                  ${cat.icone} ${cat.nom}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
            <div>
              <label>Prix (${produit.devise})</label>
              <input type="number" name="prix" value="${produit.prix}" required min="0">
            </div>
            <div>
              <label>Réduction (%)</label>
              <input type="number" name="reduction" value="${produit.reduction}" min="0" max="100">
            </div>
          </div>
          
          <div>
            <label>
              <input type="checkbox" name="actif" ${produit.actif ? 'checked' : ''}>
              Produit actif
            </label>
          </div>
          
          <div>
            <label>
              <input type="checkbox" name="vedette" ${produit.vedette ? 'checked' : ''}>
              Produit vedette
            </label>
          </div>
        </div>
        
        <!-- Descriptions -->
        <h3 style="font-size: 1.5rem; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          📄 Descriptions
        </h3>
        
        <div style="margin-bottom: 20px;">
          <label>Description courte * (max 150 caractères)</label>
          <textarea name="descriptionCourte" rows="2" required maxlength="150">${produit.descriptionCourte}</textarea>
          <small style="color: #6b7280;">Apparaît sur les cartes produits</small>
        </div>
        
        <div style="margin-bottom: 30px;">
          <label>Description complète *</label>
          <textarea name="descriptionComplete" rows="6" required>${produit.descriptionComplete}</textarea>
          <small style="color: #6b7280;">Description détaillée affichée sur la page produit</small>
        </div>
        
        <!-- Images -->
        <h3 style="font-size: 1.5rem; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          🖼️ Images (URL)
        </h3>
        
        <div id="images-container" style="margin-bottom: 30px;">
          ${produit.images.map((img, i) => `
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <input type="url" value="${img}" placeholder="https://..." style="flex: 1;" onchange="updateImage(${i}, this.value)">
              <button type="button" onclick="supprimerImage(${i})" class="btn-small btn-danger">🗑️</button>
            </div>
          `).join('')}
        </div>
        <button type="button" onclick="ajouterImage()" class="btn btn-outline" style="margin-bottom: 30px;">
          ➕ Ajouter une image
        </button>
        
        <!-- Avantages -->
        <h3 style="font-size: 1.5rem; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          ✨ Avantages
        </h3>
        
        <div id="avantages-container" style="margin-bottom: 30px;">
          ${produit.avantages.map((av, i) => `
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <input type="text" value="${av}" placeholder="Avantage..." style="flex: 1;" onchange="updateAvantage(${i}, this.value)">
              <button type="button" onclick="supprimerAvantage(${i})" class="btn-small btn-danger">🗑️</button>
            </div>
          `).join('')}
        </div>
        <button type="button" onclick="ajouterAvantage()" class="btn btn-outline" style="margin-bottom: 30px;">
          ➕ Ajouter un avantage
        </button>
        
        <!-- Tags -->
        <h3 style="font-size: 1.5rem; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          🏷️ Tags (séparés par des virgules)
        </h3>
        
        <input type="text" name="tags" value="${produit.tags.join(', ')}" placeholder="marketing, formation, business..." style="margin-bottom: 30px;">
        
        <!-- Message WhatsApp -->
        <h3 style="font-size: 1.5rem; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
          💬 Message WhatsApp personnalisé
        </h3>
        
        <textarea name="messageWhatsapp" rows="3" placeholder="Message par défaut sera utilisé si vide">${produit.messageWhatsapp || ''}</textarea>
        
        <!-- Boutons -->
        <div style="display: flex; gap: 15px; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">
            💾 ${estNouveau ? 'Créer le produit' : 'Sauvegarder les modifications'}
          </button>
          <button type="button" onclick="afficherProduits()" class="btn btn-outline">
            Annuler
          </button>
        </div>
      </form>
    </div>
  `;
  
  const content = document.getElementById('admin-content');
  if (content) {
    content.innerHTML = html;
    
    // Écouteur du formulaire
    const form = document.getElementById('form-produit');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        sauvegarderProduit(estNouveau);
      });
    }
  }
}

// Suite dans le prochain message...
