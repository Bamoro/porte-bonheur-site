// ==========================================
// CATALOGUE.JS - PAGE CATALOGUE
// ==========================================

let produitsAffiches = [];
let filtresActifs = {
  categorie: '',
  recherche: '',
  tri: 'recent'
};

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof dataManager === 'undefined') {
    console.error('DataManager non disponible');
    return;
  }

  await initialiserCatalogue();
});

async function initialiserCatalogue() {
  try {
    Utils.afficherLoader(true);
    
    // S'assurer que les données sont chargées
    if (!dataManager.data) {
      await dataManager.chargerDonnees();
    }

    const data = dataManager.data;
    if (!data) {
      throw new Error('Impossible de charger les données');
    }

    // Initialiser l'interface
    initialiserHeader(data);
    initialiserFiltres(data);
    initialiserFooter(data);
    initialiserMenuMobile();
    
    // Charger les filtres depuis l'URL
    chargerFiltresDepuisUrl();
    
    // Afficher les produits
    afficherProduits();
    
    // Initialiser les écouteurs
    initialiserEcouteurs();

    Utils.afficherLoader(false);
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    Utils.afficherToast('Erreur de chargement du catalogue', 'error');
    Utils.afficherLoader(false);
  }
}

// ==========================================
// HEADER (réutilisé de site.js)
// ==========================================
function initialiserHeader(data) {
  const headerHTML = `
    <div class="container">
      <div class="header-content">
        <a href="index.html" class="logo">
          ${data.entreprise.logo ? 
            `<img src="${data.entreprise.logo}" alt="${data.entreprise.nom}">` :
            data.entreprise.nom
          }
        </a>
        
        <nav class="nav" id="mainNav">
          <a href="index.html" class="nav-link">Accueil</a>
          <a href="catalogue.html" class="nav-link">Catalogue</a>
          <a href="index.html#temoignages" class="nav-link">Témoignages</a>
          <a href="index.html#contact" class="nav-link">Contact</a>
          <a href="${Utils.genererLienWhatsApp(data.whatsapp.numero, data.whatsapp.messageDefaut)}" 
             class="btn btn-primary" target="_blank">
            📱 WhatsApp
          </a>
        </nav>
        
        <button class="menu-toggle" id="menuToggle" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  `;
  
  const header = document.querySelector('.header');
  if (header) header.innerHTML = headerHTML;
}

// ==========================================
// FILTRES
// ==========================================
function initialiserFiltres(data) {
  const filtresHTML = `
    <div class="container">
      <div class="section-title">
        <h1>Notre catalogue</h1>
        <p>Découvrez tous nos produits et services</p>
      </div>
      
      <div class="filtres-container">
        <div class="filtres-row">
          <div class="filtre-group">
            <label for="recherche">🔍 Rechercher</label>
            <div class="search-box">
              <span class="search-icon">🔎</span>
              <input type="text" 
                     id="recherche" 
                     placeholder="Nom du produit, mot-clé..." 
                     value="${filtresActifs.recherche}">
            </div>
          </div>
          
          <div class="filtre-group">
            <label for="categorie">📁 Catégorie</label>
            <select id="categorie">
              <option value="">Toutes les catégories</option>
              ${data.categories.map(cat => `
                <option value="${cat.id}" ${filtresActifs.categorie === cat.id ? 'selected' : ''}>
                  ${cat.icone} ${cat.nom}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="filtre-group">
            <label for="tri">📊 Trier par</label>
            <select id="tri">
              <option value="recent" ${filtresActifs.tri === 'recent' ? 'selected' : ''}>Plus récents</option>
              <option value="populaire" ${filtresActifs.tri === 'populaire' ? 'selected' : ''}>Plus populaires</option>
              <option value="prix-asc" ${filtresActifs.tri === 'prix-asc' ? 'selected' : ''}>Prix croissant</option>
              <option value="prix-desc" ${filtresActifs.tri === 'prix-desc' ? 'selected' : ''}>Prix décroissant</option>
              <option value="nom-asc" ${filtresActifs.tri === 'nom-asc' ? 'selected' : ''}>Nom A-Z</option>
              <option value="nom-desc" ${filtresActifs.tri === 'nom-desc' ? 'selected' : ''}>Nom Z-A</option>
            </select>
          </div>
        </div>
        
        <div class="mt-20" id="filtres-actifs"></div>
      </div>
    </div>
  `;
  
  const section = document.getElementById('filtres-section');
  if (section) section.innerHTML = filtresHTML;
}

// ==========================================
// AFFICHER LES PRODUITS
// ==========================================
function afficherProduits() {
  // Récupérer tous les produits actifs
  let produits = dataManager.getProduitsActifs();
  
  // Appliquer le filtre de catégorie
  if (filtresActifs.categorie) {
    produits = produits.filter(p => p.categorie === filtresActifs.categorie);
  }
  
  // Appliquer la recherche
  if (filtresActifs.recherche) {
    produits = dataManager.rechercherProduits(filtresActifs.recherche)
      .filter(p => filtresActifs.categorie ? p.categorie === filtresActifs.categorie : true);
  }
  
  // Appliquer le tri
  produits = dataManager.trierProduits(produits, filtresActifs.tri);
  
  // Sauvegarder les produits affichés
  produitsAffiches = produits;
  
  // Afficher le compteur
  afficherCompteur(produits.length);
  
  // Générer le HTML
  if (produits.length === 0) {
    afficherAucunResultat();
    return;
  }
  
  const produitsHTML = produits.map(produit => creerCardProduit(produit)).join('');
  
  const gridHTML = `
    <div class="container">
      <div class="produits-grid">
        ${produitsHTML}
      </div>
    </div>
  `;
  
  const section = document.getElementById('produits-section');
  if (section) {
    section.innerHTML = gridHTML;
    ajouterEcouteursProduits();
  }
}

// ==========================================
// CRÉER UNE CARD PRODUIT
// ==========================================
function creerCardProduit(produit) {
  const prixReduit = Utils.calculerPrixReduit(produit.prix, produit.reduction);
  const imagePrincipale = produit.images && produit.images.length > 0 ? 
    produit.images[0] : 
    'https://via.placeholder.com/400x250?text=Produit';
  
  return `
    <div class="produit-card animate-on-scroll" data-produit-id="${produit.id}">
      <div style="position: relative;">
        <img src="${imagePrincipale}" alt="${produit.nom}" class="produit-image">
        ${produit.vedette ? '<span class="produit-badge vedette">⭐ Vedette</span>' : ''}
        ${produit.reduction > 0 ? `<span class="produit-badge">-${produit.reduction}%</span>` : ''}
      </div>
      <div class="produit-content">
        <span class="produit-categorie">
          ${getCategorieEmoji(produit.categorie)} ${getCategorieNom(produit.categorie)}
        </span>
        <h3 class="produit-titre">${produit.nom}</h3>
        <p class="produit-description">${Utils.tronquer(produit.descriptionCourte, 100)}</p>
        
        ${produit.tags && produit.tags.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 5px; margin: 15px 0;">
            ${produit.tags.slice(0, 3).map(tag => `
              <span style="font-size: 0.75rem; padding: 3px 8px; background: #e5e7eb; border-radius: 10px;">
                #${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="produit-footer">
          <div>
            ${produit.reduction > 0 ? 
              `<span class="prix-original">${Utils.formaterPrix(produit.prix, produit.devise)}</span><br>` : 
              ''
            }
            <span class="produit-prix">${Utils.formaterPrix(prixReduit, produit.devise)}</span>
          </div>
          <button class="btn btn-primary" onclick="voirProduit(${produit.id})">
            Voir plus →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// AFFICHER LE COMPTEUR
// ==========================================
function afficherCompteur(nombre) {
  const filtresActifsDiv = document.getElementById('filtres-actifs');
  if (!filtresActifsDiv) return;
  
  const tags = [];
  
  if (filtresActifs.categorie) {
    const catNom = getCategorieNom(filtresActifs.categorie);
    tags.push(`
      <span class="filtre-tag">
        ${catNom}
        <button onclick="retirerFiltre('categorie')" style="margin-left: 8px; font-weight: bold;">×</button>
      </span>
    `);
  }
  
  if (filtresActifs.recherche) {
    tags.push(`
      <span class="filtre-tag">
        "${filtresActifs.recherche}"
        <button onclick="retirerFiltre('recherche')" style="margin-left: 8px; font-weight: bold;">×</button>
      </span>
    `);
  }
  
  const compteurHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div>
        <strong>${nombre}</strong> ${nombre > 1 ? 'produits trouvés' : 'produit trouvé'}
      </div>
      ${tags.length > 0 ? `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${tags.join('')}
          <button onclick="reinitialiserFiltres()" class="btn" style="font-size: 0.875rem; padding: 5px 12px;">
            Réinitialiser
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  filtresActifsDiv.innerHTML = compteurHTML;
  
  // Ajouter le style pour les tags
  if (!document.getElementById('filtre-tag-style')) {
    const style = document.createElement('style');
    style.id = 'filtre-tag-style';
    style.textContent = `
      .filtre-tag {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        background: var(--couleur-primaire);
        color: white;
        border-radius: 20px;
        font-size: 0.875rem;
      }
      .filtre-tag button {
        background: transparent;
        color: white;
        border: none;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  }
}

// ==========================================
// AUCUN RÉSULTAT
// ==========================================
function afficherAucunResultat() {
  const html = `
    <div class="container">
      <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
        <h2 style="margin-bottom: 15px;">Aucun produit trouvé</h2>
        <p style="color: #6b7280; margin-bottom: 30px;">
          Essayez de modifier vos critères de recherche ou de parcourir toutes les catégories.
        </p>
        <button onclick="reinitialiserFiltres()" class="btn btn-primary">
          Voir tous les produits
        </button>
      </div>
    </div>
  `;
  
  const section = document.getElementById('produits-section');
  if (section) section.innerHTML = html;
}

// ==========================================
// GESTION DES FILTRES
// ==========================================
function initialiserEcouteurs() {
  // Recherche avec debounce
  const rechercheInput = document.getElementById('recherche');
  if (rechercheInput) {
    rechercheInput.addEventListener('input', Utils.debounce((e) => {
      filtresActifs.recherche = e.target.value.trim();
      mettreAJourUrl();
      afficherProduits();
    }, 300));
  }
  
  // Catégorie
  const categorieSelect = document.getElementById('categorie');
  if (categorieSelect) {
    categorieSelect.addEventListener('change', (e) => {
      filtresActifs.categorie = e.target.value;
      mettreAJourUrl();
      afficherProduits();
    });
  }
  
  // Tri
  const triSelect = document.getElementById('tri');
  if (triSelect) {
    triSelect.addEventListener('change', (e) => {
      filtresActifs.tri = e.target.value;
      mettreAJourUrl();
      afficherProduits();
    });
  }
}

function chargerFiltresDepuisUrl() {
  const params = Utils.getParamsUrl();
  
  if (params.categorie) filtresActifs.categorie = params.categorie;
  if (params.recherche) filtresActifs.recherche = params.recherche;
  if (params.tri) filtresActifs.tri = params.tri;
}

function mettreAJourUrl() {
  Utils.updateUrl({
    categorie: filtresActifs.categorie,
    recherche: filtresActifs.recherche,
    tri: filtresActifs.tri
  });
}

function retirerFiltre(type) {
  if (type === 'categorie') {
    filtresActifs.categorie = '';
    const select = document.getElementById('categorie');
    if (select) select.value = '';
  } else if (type === 'recherche') {
    filtresActifs.recherche = '';
    const input = document.getElementById('recherche');
    if (input) input.value = '';
  }
  
  mettreAJourUrl();
  afficherProduits();
}

function reinitialiserFiltres() {
  filtresActifs = {
    categorie: '',
    recherche: '',
    tri: 'recent'
  };
  
  const categorieSelect = document.getElementById('categorie');
  const rechercheInput = document.getElementById('recherche');
  const triSelect = document.getElementById('tri');
  
  if (categorieSelect) categorieSelect.value = '';
  if (rechercheInput) rechercheInput.value = '';
  if (triSelect) triSelect.value = 'recent';
  
  mettreAJourUrl();
  afficherProduits();
}

// ==========================================
// ÉVÉNEMENTS
// ==========================================
function ajouterEcouteursProduits() {
  document.querySelectorAll('.produit-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      
      const produitId = card.dataset.produitId;
      if (produitId) voirProduit(produitId);
    });
  });
}

// ==========================================
// FOOTER (réutilisé)
// ==========================================
function initialiserFooter(data) {
  const footerHTML = `
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>${data.entreprise.nom}</h3>
          <p>${data.entreprise.slogan || ''}</p>
        </div>
        
        <div class="footer-section">
          <h3>Navigation</h3>
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="catalogue.html">Catalogue</a></li>
            <li><a href="admin.html">Administration</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>Contact</h3>
          <ul>
            <li>📧 ${data.entreprise.email}</li>
            <li>📱 ${data.entreprise.telephone}</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${data.entreprise.nom}. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  const footer = document.querySelector('.footer');
  if (footer) footer.innerHTML = footerHTML;
}

// ==========================================
// MENU MOBILE
// ==========================================
function initialiserMenuMobile() {
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function getCategorieNom(categorieId) {
  if (!dataManager.data) return categorieId;
  const categorie = dataManager.data.categories.find(c => c.id === categorieId);
  return categorie ? categorie.nom : categorieId;
}

function getCategorieEmoji(categorieId) {
  if (!dataManager.data) return '';
  const categorie = dataManager.data.categories.find(c => c.id === categorieId);
  return categorie ? categorie.icone : '';
}

function voirProduit(produitId) {
  window.location.href = `produit.html?id=${produitId}`;
}

// Rendre les fonctions accessibles globalement
window.voirProduit = voirProduit;
window.retirerFiltre = retirerFiltre;
window.reinitialiserFiltres = reinitialiserFiltres;