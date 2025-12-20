// ==========================================
// SITE.JS - PAGE D'ACCUEIL
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  // Attendre que dataManager soit disponible
  if (typeof dataManager === 'undefined') {
    console.error('DataManager non disponible');
    return;
  }

  // Initialiser le site
  await initialiserSite();
});

async function initialiserSite() {
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

    // Initialiser tous les éléments
    initialiserHeader(data);
    initialiserHero(data);
    afficherProduitsVedettes(data);
    afficherTemoignages(data);
    initialiserFooter(data);
    initialiserMenuMobile();

    Utils.afficherLoader(false);
  } catch (error) {
    console.error('Erreur d\'initialisation:', error);
    Utils.afficherToast('Erreur de chargement du site', 'error');
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
          <a href="#temoignages" class="nav-link">Témoignages</a>
          <a href="#contact" class="nav-link">Contact</a>
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
// HERO SECTION
// ==========================================
function initialiserHero(data) {
  const heroHTML = `
    <div class="container">
      <div class="hero-content animate-on-scroll">
        <h1>${data.seo.titre}</h1>
        <p>${data.seo.description}</p>
        <div class="flex gap-20" style="justify-content: center; flex-wrap: wrap;">
          <a href="catalogue.html" class="btn btn-primary">
            🛍️ Voir le catalogue
          </a>
          <a href="${Utils.genererLienWhatsApp(data.whatsapp.numero, 'Bonjour, j\'aimerais en savoir plus sur vos services')}" 
             class="btn btn-secondary" target="_blank">
            💬 Nous contacter
          </a>
        </div>
      </div>
    </div>
  `;
  
  const hero = document.querySelector('.hero');
  if (hero) hero.innerHTML = heroHTML;
}

// ==========================================
// PRODUITS VEDETTES
// ==========================================
function afficherProduitsVedettes(data) {
  const produitsVedettes = dataManager.getProduitsVedettes(3);
  
  if (!produitsVedettes || produitsVedettes.length === 0) {
    console.log('Aucun produit vedette');
    return;
  }

  let produitsHTML = produitsVedettes.map(produit => creerCardProduit(produit)).join('');
  
  const sectionHTML = `
    <div class="container">
      <div class="section-title animate-on-scroll">
        <h2>Nos produits vedettes</h2>
        <p>Découvrez notre sélection de formations et services premium</p>
      </div>
      <div class="produits-grid">
        ${produitsHTML}
      </div>
      <div class="text-center mt-40">
        <a href="catalogue.html" class="btn btn-outline">
          Voir tous les produits →
        </a>
      </div>
    </div>
  `;
  
  const section = document.getElementById('produits-vedettes');
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
// TÉMOIGNAGES
// ==========================================
function afficherTemoignages(data) {
  if (!data.temoignages || data.temoignages.length === 0) {
    return;
  }

  const temoignagesHTML = data.temoignages.map(temoignage => `
    <div class="temoignage-card animate-on-scroll">
      <div class="temoignage-header">
        <img src="${temoignage.photo || 'https://via.placeholder.com/60'}" 
             alt="${temoignage.nom}" 
             class="temoignage-photo">
        <div class="temoignage-info">
          <h4>${temoignage.nom}</h4>
          <p>${temoignage.entreprise}</p>
        </div>
      </div>
      <div class="temoignage-note">
        ${Utils.afficherEtoiles(temoignage.note)}
      </div>
      <p class="temoignage-texte">${temoignage.texte}</p>
    </div>
  `).join('');
  
  const sectionHTML = `
    <div class="container">
      <div class="section-title animate-on-scroll">
        <h2>Ce que disent nos clients</h2>
        <p>Ils nous ont fait confiance et partagent leur expérience</p>
      </div>
      <div class="temoignages-slider">
        ${temoignagesHTML}
      </div>
    </div>
  `;
  
  const section = document.getElementById('temoignages');
  if (section) section.innerHTML = sectionHTML;
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
          <p style="margin-top: 20px;">
            ${data.entreprise.adresse || ''}
          </p>
        </div>
        
        <div class="footer-section">
          <h3>Navigation</h3>
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="catalogue.html">Catalogue</a></li>
            <li><a href="#temoignages">Témoignages</a></li>
            <li><a href="admin.html">Administration</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>Catégories</h3>
          <ul>
            ${data.categories.map(cat => `
              <li><a href="catalogue.html?categorie=${cat.id}">
                ${cat.icone} ${cat.nom}
              </a></li>
            `).join('')}
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>Contact</h3>
          <ul>
            <li>📧 ${data.entreprise.email}</li>
            <li>📱 ${data.entreprise.telephone}</li>
            <li style="margin-top: 20px;">
              <a href="${Utils.genererLienWhatsApp(data.whatsapp.numero, data.whatsapp.messageDefaut)}" 
                 class="btn btn-whatsapp" target="_blank">
                💬 WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${data.entreprise.nom}. Tous droits réservés.</p>
        <p style="margin-top: 10px; font-size: 0.875rem;">
          Site créé avec ❤️ | Hébergé sur GitHub Pages
        </p>
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
      menuToggle.classList.toggle('active');
    });
    
    // Fermer le menu au clic sur un lien
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
    
    // Fermer le menu au clic en dehors
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
        nav.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  }
}

// ==========================================
// ÉVÉNEMENTS
// ==========================================
function ajouterEcouteursProduits() {
  document.querySelectorAll('.produit-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignorer si on clique sur le bouton
      if (e.target.closest('button')) return;
      
      const produitId = card.dataset.produitId;
      if (produitId) voirProduit(produitId);
    });
  });
}

// ==========================================
// NAVIGATION
// ==========================================
function voirProduit(produitId) {
  const produit = dataManager.getProduitParId(parseInt(produitId));
  if (produit) {
    window.location.href = `produit.html?id=${produitId}`;
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

// Rendre les fonctions accessibles globalement
window.voirProduit = voirProduit;