// ==========================================
// PRODUIT.JS - PAGE PRODUIT INDIVIDUELLE
// ==========================================

let produitActuel = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof dataManager === 'undefined') {
    console.error('DataManager non disponible');
    return;
  }

  await initialiserPageProduit();
});

async function initialiserPageProduit() {
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

    // Récupérer l'ID du produit depuis l'URL
    const params = Utils.getParamsUrl();
    const produitId = params.id;
    
    if (!produitId) {
      window.location.href = 'catalogue.html';
      return;
    }

    // Charger le produit
    produitActuel = dataManager.getProduitParId(parseInt(produitId));
    
    if (!produitActuel) {
      Utils.afficherToast('Produit introuvable', 'error');
      setTimeout(() => window.location.href = 'catalogue.html', 2000);
      return;
    }

    // Incrémenter le compteur de vues
    incrementerVues(produitActuel.id);

    // Initialiser l'interface
    initialiserHeader(data);
    afficherProduit(produitActuel, data);
    afficherProduitsLies(produitActuel.id);
    initialiserFooter(data);
    initialiserMenuMobile();
    initialiserGalerie();

    Utils.afficherLoader(false);
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    Utils.afficherToast('Erreur de chargement du produit', 'error');
    Utils.afficherLoader(false);
  }
}

// ==========================================
// HEADER
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
// AFFICHER LE PRODUIT
// ==========================================
function afficherProduit(produit, data) {
  // Mettre à jour le title de la page
  document.title = `${produit.nom} - ${data.entreprise.nom}`;
  
  // Mettre à jour les meta tags
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = produit.descriptionCourte;
  
  // Fil d'Ariane
  const breadcrumbHTML = `
    <div class="container">
      <div style="padding: 20px 0; color: #6b7280; font-size: 0.875rem;">
        <a href="index.html" style="color: #6b7280;">Accueil</a> 
        → 
        <a href="catalogue.html" style="color: #6b7280;">Catalogue</a> 
        → 
        <a href="catalogue.html?categorie=${produit.categorie}" style="color: #6b7280;">
          ${getCategorieNom(produit.categorie)}
        </a>
        → 
        <strong style="color: var(--couleur-primaire);">${produit.nom}</strong>
      </div>
    </div>
  `;
  
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) breadcrumb.innerHTML = breadcrumbHTML;
  
  // Calculer le prix
  const prixReduit = Utils.calculerPrixReduit(produit.prix, produit.reduction);
  
  // Contenu principal
  const produitHTML = `
    <div class="container">
      <div class="produit-detail">
        <!-- GALERIE D'IMAGES -->
        <div class="galerie-images">
          <img src="${produit.images && produit.images.length > 0 ? produit.images[0] : 'https://via.placeholder.com/600x500'}" 
               alt="${produit.nom}" 
               class="image-principale" 
               id="imagePrincipale">
          
          ${produit.images && produit.images.length > 1 ? `
            <div class="miniatures">
              ${produit.images.map((img, index) => `
                <img src="${img}" 
                     alt="${produit.nom} ${index + 1}" 
                     class="miniature ${index === 0 ? 'active' : ''}" 
                     data-index="${index}"
                     onclick="changerImage(${index})">
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <!-- INFORMATIONS PRODUIT -->
        <div class="produit-info">
          <!-- Badges -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <span class="produit-categorie">
              ${getCategorieEmoji(produit.categorie)} ${getCategorieNom(produit.categorie)}
            </span>
            ${produit.vedette ? '<span class="produit-badge vedette">⭐ Produit vedette</span>' : ''}
            ${produit.reduction > 0 ? `<span class="produit-badge">-${produit.reduction}%</span>` : ''}
          </div>
          
          <h1>${produit.nom}</h1>
          
          <!-- Prix -->
          <div class="produit-prix-detail">
            ${produit.reduction > 0 ? 
              `<span class="prix-original" style="font-size: 1.5rem;">${Utils.formaterPrix(produit.prix, produit.devise)}</span>
               <br>` : 
              ''
            }
            ${Utils.formaterPrix(prixReduit, produit.devise)}
          </div>
          
          <!-- Description courte -->
          <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 30px;">
            ${produit.descriptionCourte}
          </p>
          
          <!-- Bouton WhatsApp -->
          <a href="${Utils.genererLienWhatsApp(data.whatsapp.numero, produit.messageWhatsapp || data.whatsapp.messageDefaut + produit.nom)}" 
             class="btn btn-whatsapp" 
             target="_blank"
             style="width: 100%; justify-content: center; font-size: 1.125rem; padding: 18px;">
            💬 Commander sur WhatsApp
          </a>
          
          <!-- Bouton partage -->
          <button onclick="partagerProduit()" class="btn btn-outline" style="width: 100%; margin-top: 15px;">
            🔗 Partager ce produit
          </button>
          
          <!-- Description complète -->
          <div style="margin-top: 40px;">
            <h2 style="font-size: 1.75rem; margin-bottom: 20px;">Description</h2>
            <p style="line-height: 1.8; color: #4b5563;">
              ${produit.descriptionComplete}
            </p>
          </div>
          
          <!-- Avantages -->
          ${produit.avantages && produit.avantages.length > 0 ? `
            <div style="margin-top: 40px;">
              <h2 style="font-size: 1.75rem; margin-bottom: 20px;">✨ Ce que vous obtenez</h2>
              <ul class="avantages-liste">
                ${produit.avantages.map(avantage => `
                  <li>${avantage}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <!-- Caractéristiques -->
          ${produit.caracteristiques && produit.caracteristiques.length > 0 ? `
            <div style="margin-top: 40px;">
              <h2 style="font-size: 1.75rem; margin-bottom: 20px;">📋 Caractéristiques</h2>
              <ul class="caracteristiques-liste">
                ${produit.caracteristiques.map(carac => `
                  <li>
                    <strong>${carac.nom}</strong>
                    <span>${carac.valeur}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <!-- Tags -->
          ${produit.tags && produit.tags.length > 0 ? `
            <div style="margin-top: 40px;">
              <h3 style="font-size: 1.25rem; margin-bottom: 15px;">🏷️ Tags</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${produit.tags.map(tag => `
                  <a href="catalogue.html?recherche=${tag}" 
                     style="padding: 8px 16px; background: #e5e7eb; border-radius: 20px; font-size: 0.875rem; transition: all 0.3s;">
                    #${tag}
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  const section = document.getElementById('produit-section');
  if (section) section.innerHTML = produitHTML;
}

// ==========================================
// PRODUITS LIÉS
// ==========================================
function afficherProduitsLies(produitId) {
  const produitsLies = dataManager.getProduitsLies(produitId, 3);
  
  if (!produitsLies || produitsLies.length === 0) {
    return;
  }

  const produitsHTML = produitsLies.map(produit => creerCardProduit(produit)).join('');
  
  const sectionHTML = `
    <div class="container">
      <div class="section-title">
        <h2>Produits similaires</h2>
        <p>Découvrez d'autres produits qui pourraient vous intéresser</p>
      </div>
      <div class="produits-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        ${produitsHTML}
      </div>
    </div>
  `;
  
  const section = document.getElementById('produits-lies');
  if (section) {
    section.innerHTML = sectionHTML;
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
// GALERIE D'IMAGES
// ==========================================
function initialiserGalerie() {
  // Déjà géré par les onclick dans le HTML
}

function changerImage(index) {
  if (!produitActuel || !produitActuel.images) return;
  
  const imagePrincipale = document.getElementById('imagePrincipale');
  const miniatures = document.querySelectorAll('.miniature');
  
  if (imagePrincipale) {
    imagePrincipale.src = produitActuel.images[index];
  }
  
  miniatures.forEach((mini, i) => {
    if (i === index) {
      mini.classList.add('active');
    } else {
      mini.classList.remove('active');
    }
  });
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function incrementerVues(produitId) {
  // Dans un système statique, on peut utiliser localStorage
  const vuesKey = `vues_produit_${produitId}`;
  const vues = parseInt(localStorage.getItem(vuesKey) || '0');
  localStorage.setItem(vuesKey, (vues + 1).toString());
}

async function partagerProduit() {
  const url = window.location.href;
  const titre = produitActuel.nom;
  const texte = produitActuel.descriptionCourte;
  
  // Vérifier si l'API Web Share est disponible
  if (navigator.share) {
    try {
      await navigator.share({
        title: titre,
        text: texte,
        url: url
      });
      Utils.afficherToast('Merci d\'avoir partagé !', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        copierLien();
      }
    }
  } else {
    copierLien();
  }
}

function copierLien() {
  Utils.copierTexte(window.location.href);
}

function ajouterEcouteursProduits() {
  document.querySelectorAll('.produit-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      
      const produitId = card.dataset.produitId;
      if (produitId) voirProduit(produitId);
    });
  });
}

function voirProduit(produitId) {
  window.location.href = `produit.html?id=${produitId}`;
}

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

// ==========================================
// FOOTER
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

// Rendre les fonctions accessibles globalement
window.voirProduit = voirProduit;
window.changerImage = changerImage;
window.partagerProduit = partagerProduit;