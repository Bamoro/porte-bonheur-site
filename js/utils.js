// utils.js

// Fonction pour charger le JSON de manière sécurisée
async function chargerDonnees() {
  try {
    const response = await fetch('data.json', { cache: "no-store" }); 
    // no-store empêche le cache de corrompre le JSON
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    // Lire le texte brut d'abord pour debug si JSON invalide
    const texte = await response.text();

    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(texte);
    } catch(parseErr) {
      console.error("Erreur JSON.parse:", parseErr);
      console.log("Contenu reçu :", texte);
      throw parseErr;
    }

    return data;
  } catch (err) {
    console.error("Impossible de charger les données :", err);
    throw err;
  }
}

// Exemple d'utilisation
async function initialiserSite() {
  try {
    const data = await chargerDonnees();
    console.log("JSON chargé avec succès :", data);

    // Exemple : afficher les produits sur la page
    const container = document.getElementById('products');
    if (container && data.produits) {
      container.innerHTML = "";
      data.produits.forEach(produit => {
        const div = document.createElement('div');
        div.innerHTML = `
          <h3>${produit.nom}</h3>
          <p>${produit.descriptionCourte}</p>
          <p><strong>Prix :</strong> ${produit.prix} ${produit.devise}</p>
        `;
        container.appendChild(div);
      });
    }

  } catch (err) {
    console.error("Erreur d'initialisation :", err);
    // Ici, tu peux afficher un message utilisateur
    const container = document.getElementById('products');
    if (container) {
      container.innerHTML = "<p>Impossible de charger les produits. Veuillez réessayer plus tard.</p>";
    }
  }
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  initialiserSite();
});
